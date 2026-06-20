import { PDF, PdfStream, type PdfDict, type PdfRef } from '@libpdf/core';
import { zlibSync } from 'fflate';

export type ExtractedImage = { name: string; bytes: Uint8Array };

/**
 * Pull embedded raster images out of a PDF.
 *
 * It walks every page's (and nested Form XObjects') image XObjects:
 * - DCTDecode → the raw stream is already a JPEG, emitted as-is (.jpg)
 * - JPXDecode → the raw stream is JPEG 2000, emitted as-is (.jp2)
 * - FlateDecode RGB / Gray / ICCBased(3|1), 8 bits/component → rebuilt as PNG
 *
 * Anything else (CMYK, indexed palettes, 1-bit masks, exotic filters) is skipped
 * — extracting those correctly needs a full image-decoding pipeline.
 *
 * @throws if the bytes can't be parsed as a PDF.
 */
export async function collectImages(source: Uint8Array): Promise<ExtractedImage[]> {
	const doc = await PDF.load(source);
	const resolve = (ref: PdfRef) => doc.getObject(ref);
	const refKey = (ref: PdfRef) => `${ref.objectNumber}R${ref.generation}`;

	const seenImages = new Set<string>();
	const visitedForms = new Set<string>();
	const found: { bytes: Uint8Array; ext: string }[] = [];

	function colorOf(stream: PdfStream): { channels: number; colorType: number } | null {
		const cs = stream.get('ColorSpace', resolve);
		if (!cs) return null;
		if (cs.type === 'name') {
			if (cs.value === 'DeviceRGB') return { channels: 3, colorType: 2 };
			if (cs.value === 'DeviceGray') return { channels: 1, colorType: 0 };
			return null;
		}
		if (cs.type === 'array') {
			const parts = [...cs];
			const head = parts[0];
			if (head?.type === 'name' && head.value === 'ICCBased') {
				const ref = parts[1];
				const icc = ref?.type === 'ref' ? doc.getObject(ref) : ref;
				if (icc instanceof PdfStream) {
					const n = icc.getNumber('N')?.value;
					if (n === 3) return { channels: 3, colorType: 2 };
					if (n === 1) return { channels: 1, colorType: 0 };
				}
			}
		}
		return null;
	}

	function decodeImage(stream: PdfStream): { bytes: Uint8Array; ext: string } | null {
		const filters = filterNames(stream, resolve);
		// JPEG / JPEG2000 streams are stored verbatim — emit the raw bytes.
		if (filters.length === 1 && filters[0] === 'DCTDecode') {
			return { bytes: stream.data, ext: 'jpg' };
		}
		if (filters.length === 1 && filters[0] === 'JPXDecode') {
			return { bytes: stream.data, ext: 'jp2' };
		}

		const width = stream.getNumber('Width', resolve)?.value;
		const height = stream.getNumber('Height', resolve)?.value;
		const bpc = stream.getNumber('BitsPerComponent', resolve)?.value;
		if (!width || !height || bpc !== 8) return null;

		const color = colorOf(stream);
		if (!color) return null;

		let samples: Uint8Array;
		try {
			samples = stream.getDecodedData(); // applies /Filter + /DecodeParms (predictors)
		} catch {
			return null;
		}
		if (samples.length < width * height * color.channels) return null;

		return { bytes: encodePng(samples, width, height, color.channels, color.colorType), ext: 'png' };
	}

	function walkResources(resources: PdfDict | undefined) {
		const xobjects = resources?.getDict('XObject', resolve);
		if (!xobjects) return;
		for (const key of xobjects.keys()) {
			const value = xobjects.get(key);
			const ref = value?.type === 'ref' ? value : null;
			const obj = ref ? doc.getObject(ref) : value;
			if (!(obj instanceof PdfStream)) continue;

			const subtype = obj.getName('Subtype', resolve)?.value;
			if (subtype === 'Image') {
				if (ref) {
					if (seenImages.has(refKey(ref))) continue; // same image used on many pages
					seenImages.add(refKey(ref));
				}
				const image = decodeImage(obj);
				if (image) found.push(image);
			} else if (subtype === 'Form') {
				if (ref) {
					if (visitedForms.has(refKey(ref))) continue;
					visitedForms.add(refKey(ref));
				}
				walkResources(obj.getDict('Resources', resolve));
			}
		}
	}

	for (const page of doc.getPages()) {
		walkResources(page.getResources());
	}

	const pad = Math.max(3, String(found.length).length);
	return found.map((image, index) => ({
		name: `image-${String(index + 1).padStart(pad, '0')}.${image.ext}`,
		bytes: image.bytes
	}));
}

function filterNames(stream: PdfStream, resolve: (ref: PdfRef) => unknown): string[] {
	const filter = stream.get('Filter', resolve as never);
	if (!filter) return [];
	if (filter.type === 'name') return [filter.value];
	if (filter.type === 'array') {
		return [...filter].filter((x) => x.type === 'name').map((x) => (x as { value: string }).value);
	}
	return [];
}

// --- minimal PNG encoder (8-bit RGB / grayscale, no interlace) ---

function encodePng(
	samples: Uint8Array,
	width: number,
	height: number,
	channels: number,
	colorType: number
): Uint8Array {
	const stride = width * channels;
	// Prefix every scanline with a 0 (filter: None).
	const raw = new Uint8Array((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0;
		raw.set(samples.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
	}

	const ihdr = new Uint8Array(13);
	const view = new DataView(ihdr.buffer);
	view.setUint32(0, width);
	view.setUint32(4, height);
	ihdr[8] = 8; // bit depth
	ihdr[9] = colorType; // 2 = RGB, 0 = grayscale
	// bytes 10-12 (compression, filter, interlace) stay 0

	return concat([
		new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
		pngChunk('IHDR', ihdr),
		pngChunk('IDAT', zlibSync(raw, { level: 6 })),
		pngChunk('IEND', new Uint8Array(0))
	]);
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
	const typeBytes = new Uint8Array([type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)]);
	const chunk = new Uint8Array(12 + data.length);
	const view = new DataView(chunk.buffer);
	view.setUint32(0, data.length);
	chunk.set(typeBytes, 4);
	chunk.set(data, 8);
	view.setUint32(8 + data.length, crc32(concat([typeBytes, data])));
	return chunk;
}

function concat(parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((sum, p) => sum + p.length, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const p of parts) {
		out.set(p, offset);
		offset += p.length;
	}
	return out;
}

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!)! & 0xff]! ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}
