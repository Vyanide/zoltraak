import { requestBlob } from '$lib/client';

/**
 * Send the PDFs to the backend to be concatenated (in the given order) and
 * return the merged PDF as a Blob.
 */
export async function mergePdfs(files: File[]): Promise<Blob> {
	const form = new FormData();
	for (const file of files) form.append('files', file);
	return requestBlob('/pdf/merge', form);
}
