import { requestBlob } from '$lib/client';

/**
 * Send the PDF and the 1-based page numbers to keep (ascending) to the backend,
 * and return the split PDF — containing only those pages — as a Blob.
 */
export async function splitPdf(file: File, pages: number[]): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('pages', JSON.stringify(pages));
	return requestBlob('/pdf/split', form);
}
