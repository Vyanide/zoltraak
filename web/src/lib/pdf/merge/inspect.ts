import { getPdfjs } from '$lib/pdf/pdfjs';

/**
 * Count the pages of a PDF locally (no rendering). Throws if the file can't be
 * read as a PDF, so callers can flag invalid uploads before sending them.
 */
export async function countPages(file: File): Promise<number> {
	const pdfjs = await getPdfjs();
	const data = new Uint8Array(await file.arrayBuffer());
	const loadingTask = pdfjs.getDocument({ data });
	try {
		const doc = await loadingTask.promise;
		return doc.numPages;
	} finally {
		await loadingTask.destroy();
	}
}
