import { requestBlob } from '$lib/client';

/**
 * Send the PDF and its new page order (1-based page numbers in their new
 * sequence) to the backend, and return the reordered PDF as a Blob.
 */
export async function reorderPdf(file: File, order: number[]): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('order', JSON.stringify(order));
	return requestBlob('/pdf/reorder', form);
}
