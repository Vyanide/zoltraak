import { requestBlob } from '$lib/client';

/**
 * Send a PDF to the backend and get back a ZIP of its embedded images.
 * (`requestBlob` returns the response body as a Blob regardless of type.)
 */
export async function extractImages(file: File): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	return requestBlob('/pdf/extract-images', form);
}
