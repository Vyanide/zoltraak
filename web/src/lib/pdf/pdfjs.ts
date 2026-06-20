let workerConfigured = false;

/**
 * Lazily import pdf.js with its worker configured.
 *
 * pdf.js touches browser globals at module-eval time, so it must never be
 * imported on the server — keeping it behind a dynamic import makes every
 * caller SSR-safe. Shared by the PDF tools that need to read PDFs locally.
 */
export async function getPdfjs() {
	const pdfjs = await import('pdfjs-dist');
	if (!workerConfigured) {
		// Vite resolves `?url` to the emitted asset URL for the worker bundle.
		const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
		pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
		workerConfigured = true;
	}
	return pdfjs;
}
