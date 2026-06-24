import sharp from 'sharp';
import type { ImageResult } from './types';

/** Formats sharp can re-encode, used to preserve the input format when padding. */
const PRESERVABLE: Record<string, { mime: string; ext: string }> = {
	jpeg: { mime: 'image/jpeg', ext: 'jpg' },
	png: { mime: 'image/png', ext: 'png' },
	webp: { mime: 'image/webp', ext: 'webp' },
	gif: { mime: 'image/gif', ext: 'gif' },
	tiff: { mime: 'image/tiff', ext: 'tiff' },
	avif: { mime: 'image/avif', ext: 'avif' }
};

/** Parse a `#rrggbb` colour into 0–255 components (defaults to white). */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match) return { r: 255, g: 255, b: 255 };
	const n = parseInt(match[1]!, 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Pure image logic, with no knowledge of HTTP or Elysia (CCP). Padding,
 * cropping and resizing with sharp (libvips); format conversion (with optional
 * quality) lives in `convert.ts` and uses ImageMagick instead.
 */
export abstract class ImageService {
	/**
	 * Add solid-colour (or transparent) padding around an image with sharp's
	 * `extend`. `background` is a `#rrggbb` hex, or the literal `'transparent'`.
	 *
	 * Opaque padding keeps the source format; transparent padding outputs PNG —
	 * the widely-supported format with alpha here — since e.g. JPEG can't carry
	 * transparency.
	 */
	static async pad(
		source: Uint8Array,
		padding: { top: number; right: number; bottom: number; left: number },
		background: string
	): Promise<ImageResult> {
		let format: string | undefined;
		try {
			format = (await sharp(source, { failOn: 'none' }).metadata()).format;
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as an image.' };
		}

		const transparent = background.trim().toLowerCase() === 'transparent';
		const { r, g, b } = parseHexColor(transparent ? '#000000' : background);
		const extend = { ...padding, background: { r, g, b, alpha: transparent ? 0 : 1 } };

		try {
			if (transparent) {
				const out = await sharp(source, { failOn: 'none' })
					.ensureAlpha()
					.extend(extend)
					.png()
					.toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
			}

			const preserved = format ? PRESERVABLE[format] : undefined;
			const pipeline = sharp(source, { failOn: 'none' }).extend(extend);
			if (preserved) {
				// No format method → sharp re-encodes in the input format.
				const out = await pipeline.toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: preserved.mime, ext: preserved.ext };
			}
			// Unknown / unwritable input format → fall back to PNG.
			const out = await pipeline.png().toBuffer();
			return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
		} catch {
			return { ok: false, error: 'This image could not be padded.' };
		}
	}

	/**
	 * Crop a rectangle out of an image with sharp's `extract`. The rectangle is in
	 * source-image pixels; it is clamped to the image bounds so a slightly
	 * off-by-one selection from the client can't make extract throw.
	 *
	 * The source format is preserved when sharp can re-encode it, otherwise the
	 * result falls back to PNG (same policy as `pad`).
	 */
	static async crop(
		source: Uint8Array,
		rect: { left: number; top: number; width: number; height: number }
	): Promise<ImageResult> {
		let meta: sharp.Metadata;
		try {
			meta = await sharp(source, { failOn: 'none' }).metadata();
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as an image.' };
		}

		const imgW = meta.width;
		const imgH = meta.height;
		if (!imgW || !imgH) {
			return { ok: false, error: 'The image has no readable dimensions.' };
		}

		// Clamp so left/top stay inside the image and the rectangle never spills
		// past the right/bottom edge.
		const left = Math.min(Math.max(0, Math.round(rect.left)), imgW - 1);
		const top = Math.min(Math.max(0, Math.round(rect.top)), imgH - 1);
		const width = Math.min(Math.max(1, Math.round(rect.width)), imgW - left);
		const height = Math.min(Math.max(1, Math.round(rect.height)), imgH - top);

		const preserved = meta.format ? PRESERVABLE[meta.format] : undefined;
		try {
			const pipeline = sharp(source, { failOn: 'none' }).extract({ left, top, width, height });
			if (preserved) {
				// No format method → sharp re-encodes in the input format.
				const out = await pipeline.toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: preserved.mime, ext: preserved.ext };
			}
			const out = await pipeline.png().toBuffer();
			return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
		} catch {
			return { ok: false, error: 'This image could not be cropped.' };
		}
	}

	/**
	 * Resize an image to a target width and/or height with sharp.
	 *
	 * `fit: 'inside'` keeps the original aspect ratio (the image is scaled to fit
	 * within the box); `fit: 'fill'` stretches it to exactly the given dimensions.
	 * If only one of width/height is given, sharp scales the other proportionally
	 * regardless of `fit`. The source format is preserved (PNG fallback).
	 */
	static async resize(
		source: Uint8Array,
		opts: { width?: number; height?: number; fit: 'inside' | 'fill' }
	): Promise<ImageResult> {
		if (!opts.width && !opts.height) {
			return { ok: false, error: 'Enter a width or a height to resize to.' };
		}

		let format: string | undefined;
		try {
			format = (await sharp(source, { failOn: 'none' }).metadata()).format;
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as an image.' };
		}

		const preserved = format ? PRESERVABLE[format] : undefined;
		try {
			const pipeline = sharp(source, { failOn: 'none' }).resize({
				width: opts.width,
				height: opts.height,
				fit: opts.fit
			});
			if (preserved) {
				const out = await pipeline.toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: preserved.mime, ext: preserved.ext };
			}
			const out = await pipeline.png().toBuffer();
			return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
		} catch {
			return { ok: false, error: 'This image could not be resized.' };
		}
	}

	/**
	 * Rotate an image clockwise by `angle` degrees with sharp.
	 *
	 * `background` (`#rrggbb` or `'transparent'`) fills the corners exposed by a
	 * non-right-angle rotation; it is irrelevant for multiples of 90°. As with
	 * `pad`, transparent output is PNG (for the alpha channel) while opaque output
	 * keeps the source format (PNG fallback). EXIF orientation is baked in first so
	 * the result matches how the image renders in the browser.
	 */
	static async rotate(source: Uint8Array, angle: number, background: string): Promise<ImageResult> {
		let format: string | undefined;
		try {
			format = (await sharp(source, { failOn: 'none' }).metadata()).format;
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as an image.' };
		}

		const a = (((Math.round(angle) % 360) + 360) % 360);
		const transparent = background.trim().toLowerCase() === 'transparent';
		const { r, g, b } = parseHexColor(transparent ? '#000000' : background);
		const fill = { r, g, b, alpha: transparent ? 0 : 1 };

		try {
			// Bake EXIF orientation first (matches the browser preview), then rotate —
			// a fresh sharp pass, since chained rotate() calls don't compose.
			const oriented = await sharp(source, { failOn: 'none' }).rotate().toBuffer();
			const build = () => sharp(oriented).rotate(a, { background: fill });

			// Exposed corners only appear off the right angles; emit PNG for the alpha.
			if (transparent && a % 90 !== 0) {
				const out = await build().png().toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
			}

			const preserved = format ? PRESERVABLE[format] : undefined;
			if (preserved) {
				const out = await build().toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: preserved.mime, ext: preserved.ext };
			}
			const out = await build().png().toBuffer();
			return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
		} catch {
			return { ok: false, error: 'This image could not be rotated.' };
		}
	}

	/**
	 * Mirror an image with sharp: `flipH` flips left↔right (`flop`), `flipV` flips
	 * top↔bottom (`flip`). Mirroring exposes no new area, so there is no background
	 * to fill. The source format is preserved (PNG fallback) and EXIF orientation
	 * is baked in first so the result matches the browser preview.
	 */
	static async flip(source: Uint8Array, flipH = false, flipV = false): Promise<ImageResult> {
		let format: string | undefined;
		try {
			format = (await sharp(source, { failOn: 'none' }).metadata()).format;
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as an image.' };
		}

		try {
			// Bake EXIF orientation first so the result matches the browser preview.
			const oriented = await sharp(source, { failOn: 'none' }).rotate().toBuffer();
			let pipeline = sharp(oriented);
			if (flipV) pipeline = pipeline.flip();
			if (flipH) pipeline = pipeline.flop();

			const preserved = format ? PRESERVABLE[format] : undefined;
			if (preserved) {
				const out = await pipeline.toBuffer();
				return { ok: true, bytes: new Uint8Array(out), mime: preserved.mime, ext: preserved.ext };
			}
			const out = await pipeline.png().toBuffer();
			return { ok: true, bytes: new Uint8Array(out), mime: 'image/png', ext: 'png' };
		} catch {
			return { ok: false, error: 'This image could not be flipped.' };
		}
	}
}
