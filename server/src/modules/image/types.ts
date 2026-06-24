/** Result of an image operation: the encoded bytes + how to label them, or an error. */
export type ImageResult =
	| { ok: true; bytes: Uint8Array; mime: string; ext: string }
	| { ok: false; error: string };

/** Result of an OCR operation: the extracted text, or an error. */
export type OcrResult = { ok: true; text: string } | { ok: false; error: string };
