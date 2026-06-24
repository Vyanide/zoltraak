import { requestBlob } from '$lib/client';

/**
 * Send an image to the backend, which reads it with OCR (PP-OCRv6) and returns
 * the extracted text. The response is plain text, so the Blob is read as text.
 */
export async function extractText(file: File): Promise<string> {
	const form = new FormData();
	form.append('file', file);
	const blob = await requestBlob('/image/ocr', form);
	return blob.text();
}
