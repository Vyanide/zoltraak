import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import type { ImageResult } from './types';

/** The background-removal models a user can choose. */
export type RemoveBgModel = 'u2net' | 'isnet-anime';

type ModelSpec = {
	/** rembg release asset to download on first use. */
	url: string;
	file: string;
	/** Square input resolution the model expects. */
	size: number;
	/** Per-channel mean/std applied after scaling pixels by the image's max value. */
	mean: [number, number, number];
	std: [number, number, number];
};

const MODELS: Record<RemoveBgModel, ModelSpec> = {
	u2net: {
		url: 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx',
		file: 'u2net.onnx',
		size: 320,
		mean: [0.485, 0.456, 0.406],
		std: [0.229, 0.224, 0.225]
	},
	'isnet-anime': {
		url: 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-anime.onnx',
		file: 'isnet-anime.onnx',
		size: 1024,
		mean: [0.485, 0.456, 0.406],
		std: [1.0, 1.0, 1.0]
	}
};

const MODELS_DIR = process.env.MODELS_DIR || join(import.meta.dir, '..', '..', '..', 'models');

// Lazy singletons: the native runtime loads at most once, each model session once.
type Ort = typeof import('onnxruntime-node');
let ortPromise: Promise<Ort> | null = null;
const sessions = new Map<RemoveBgModel, Promise<import('onnxruntime-node').InferenceSession>>();

function loadOrt(): Promise<Ort> {
	if (!ortPromise) ortPromise = import('onnxruntime-node');
	return ortPromise;
}

/** Download the model file on first use; reuse the cached copy afterwards. */
async function ensureModelFile(spec: ModelSpec): Promise<string> {
	const path = join(MODELS_DIR, spec.file);
	if (await Bun.file(path).exists()) return path;
	const res = await fetch(spec.url, { redirect: 'follow' });
	if (!res.ok) throw new Error(`Failed to download model (HTTP ${res.status}).`);
	await mkdir(MODELS_DIR, { recursive: true });
	await Bun.write(path, res);
	return path;
}

function getSession(model: RemoveBgModel) {
	let session = sessions.get(model);
	if (!session) {
		session = (async () => {
			const ort = await loadOrt();
			const path = await ensureModelFile(MODELS[model]);
			return ort.InferenceSession.create(path);
		})();
		sessions.set(model, session);
		// On failure, drop the cached rejection so the next request can retry.
		session.catch(() => sessions.delete(model));
	}
	return session;
}

/**
 * Remove an image's background with the chosen ONNX model and return a PNG with
 * a transparent background. sharp does all the pixel work; the model only turns
 * RGB pixels into a single-channel alpha matte.
 *
 * Pipeline (mirrors rembg's reference implementation — each model's exact
 * mean/std/input-size lives in MODELS above):
 *
 *   1. Decode once with sharp to oriented (EXIF-rotated), full-resolution RGB
 *      (`.rotate().removeAlpha().raw()`); remember the width/height.
 *   2. Resize that RGB to the model's square input (e.g. 320² or 1024²),
 *      stretching it (`fit: 'fill'`, no aspect preservation — rembg does the
 *      same).
 *   3. Build a float32 NCHW tensor: scale pixels by the image's OWN max value
 *      (not a fixed 255 — matches rembg), then apply per-channel (x-mean)/std,
 *      packed plane-by-plane (all R, then all G, then all B).
 *   4. Run the model; take the first output, channel 0 — an H×W saliency map.
 *   5. Min–max normalize that map to 0–255 (robust whether it's logits or a
 *      sigmoid) to get the matte at the model's resolution.
 *   6. Resize the matte back to the original W×H and join it onto the original
 *      RGB as the alpha channel, then encode PNG.
 *
 * Gotcha: step 6 MUST force the resized matte to a single channel with
 * `.toColourspace('b-w')`. Otherwise sharp expands it to 3-channel sRGB on
 * output, the oversized buffer breaks `joinChannel`, and the whole image comes
 * back fully transparent.
 */
export async function removeBackground(source: Uint8Array, model: RemoveBgModel): Promise<ImageResult> {
	const spec = MODELS[model];
	if (!spec) return { ok: false, error: `Unknown model: ${model}.` };

	// Decode once to oriented, full-resolution RGB (EXIF-rotated so the mask aligns).
	let rgb: Buffer;
	let width: number;
	let height: number;
	try {
		const decoded = await sharp(source, { failOn: 'none' })
			.rotate()
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });
		rgb = decoded.data;
		width = decoded.info.width;
		height = decoded.info.height;
	} catch {
		return { ok: false, error: 'The uploaded file could not be read as an image.' };
	}

	const session = await getSession(model).catch((error) => {
		console.error('Failed to load background-removal model', error);
		return null;
	});
	if (!session) {
		return {
			ok: false,
			error: 'The background-removal model could not be loaded — the server may lack network access to download it.'
		};
	}

	try {
		const ort = await loadOrt();
		const { size, mean, std } = spec;

		// Resize the RGB to the model's square input and pack it into an NCHW tensor.
		const resized = await sharp(rgb, { raw: { width, height, channels: 3 } })
			.resize(size, size, { fit: 'fill' })
			.raw()
			.toBuffer();

		// rembg scales pixels by the image's own max value (not a fixed 255) before
		// applying mean/std — match that so the model sees the same input.
		let pmax = 0;
		for (let i = 0; i < resized.length; i++) if (resized[i]! > pmax) pmax = resized[i]!;
		const scale = pmax || 1;

		const area = size * size;
		const input = new Float32Array(3 * area);
		for (let i = 0; i < area; i++) {
			input[i] = (resized[i * 3]! / scale - mean[0]) / std[0];
			input[area + i] = (resized[i * 3 + 1]! / scale - mean[1]) / std[1];
			input[2 * area + i] = (resized[i * 3 + 2]! / scale - mean[2]) / std[2];
		}

		const inputName = session.inputNames[0];
		const outputName = session.outputNames[0];
		if (!inputName || !outputName) {
			return { ok: false, error: 'The model has an unexpected input/output signature.' };
		}

		const tensor = new ort.Tensor('float32', input, [1, 3, size, size]);
		const outputs = await session.run({ [inputName]: tensor });
		const output = outputs[outputName];
		if (!output) return { ok: false, error: 'The model returned no output.' };

		const dims = output.dims;
		const mh = Number(dims[dims.length - 2] ?? size);
		const mw = Number(dims[dims.length - 1] ?? size);
		const mask = output.data as Float32Array;

		// Min–max normalize the matte to 0–255 (matches rembg; works for logits or sigmoid).
		let min = Infinity;
		let max = -Infinity;
		const n = mh * mw;
		for (let i = 0; i < n; i++) {
			const v = mask[i]!;
			if (v < min) min = v;
			if (v > max) max = v;
		}
		const range = max - min || 1;
		const matte = new Uint8Array(n);
		for (let i = 0; i < n; i++) matte[i] = Math.round(((mask[i]! - min) / range) * 255);

		// Scale the matte back to the original size. `toColourspace('b-w')` is
		// essential: without it sharp expands the single-channel matte to 3-channel
		// sRGB on output, and the oversized buffer makes the joinChannel below
		// produce a bogus (all-zero) alpha — i.e. a fully transparent image.
		const alpha = await sharp(matte, { raw: { width: mw, height: mh, channels: 1 } })
			.resize(width, height, { fit: 'fill' })
			.toColourspace('b-w')
			.raw()
			.toBuffer();

		const png = await sharp(rgb, { raw: { width, height, channels: 3 } })
			.joinChannel(alpha, { raw: { width, height, channels: 1 } })
			.png()
			.toBuffer();

		return { ok: true, bytes: new Uint8Array(png), mime: 'image/png', ext: 'png' };
	} catch (error) {
		console.error('Background removal failed', error);
		return { ok: false, error: 'The image could not be processed.' };
	}
}
