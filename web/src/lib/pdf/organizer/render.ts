import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getPdfjs } from '$lib/pdf/pdfjs';

/** A single rendered PDF page, ready to be displayed and reordered. */
export type PdfPage = {
	/** Stable id used for the keyed `{#each}` and svelte-dnd-action. */
	id: string;
	/** 0-based position of this page in the original document. */
	originalIndex: number;
	/** 1-based page number in the original document. */
	pageNumber: number;
	/** Rendered thumbnail as a data URL. */
	thumbnail: string;
	/** Intrinsic page width in PDF points (unscaled). */
	width: number;
	/** Intrinsic page height in PDF points (unscaled). */
	height: number;
};

export type LoadedPdf = {
	name: string;
	numPages: number;
	pages: PdfPage[];
};

/** CSS-pixel width each thumbnail is rendered for. */
const THUMBNAIL_WIDTH = 300;

/**
 * Render every page of `file` to a thumbnail. Runs entirely in the browser;
 * the file never leaves the client.
 */
export async function renderPdfThumbnails(
	file: File,
	onProgress?: (rendered: number, total: number) => void
): Promise<LoadedPdf> {
	const pdfjs = await getPdfjs();
	const data = new Uint8Array(await file.arrayBuffer());
	const loadingTask = pdfjs.getDocument({ data });
	const doc: PDFDocumentProxy = await loadingTask.promise;
	const pages: PdfPage[] = [];
	const dpr = Math.min(window.devicePixelRatio || 1, 2);

	try {
		for (let n = 1; n <= doc.numPages; n++) {
			const page = await doc.getPage(n);
			const unscaled = page.getViewport({ scale: 1 });
			const scale = (THUMBNAIL_WIDTH * dpr) / unscaled.width;
			const viewport = page.getViewport({ scale });

			const canvas = document.createElement('canvas');
			canvas.width = Math.ceil(viewport.width);
			canvas.height = Math.ceil(viewport.height);
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Unable to acquire a 2D canvas context.');

			await page.render({ canvas, viewport }).promise;

			pages.push({
				id: `page-${n}`,
				originalIndex: n - 1,
				pageNumber: n,
				thumbnail: canvas.toDataURL('image/jpeg', 0.85),
				width: unscaled.width,
				height: unscaled.height
			});

			page.cleanup();
			onProgress?.(n, doc.numPages);
		}
	} finally {
		// Tears down the document and its worker transport.
		await loadingTask.destroy();
	}

	return { name: file.name, numPages: pages.length, pages };
}
