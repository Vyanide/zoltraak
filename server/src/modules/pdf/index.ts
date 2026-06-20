import { Elysia } from 'elysia';
import { PdfModel } from './model';
import { PdfService } from './service';
import { attachment } from '../../http';

/** Inserts a " (suffix)" before the .pdf extension for the download name. */
function suffixedFilename(name: string, suffix: string): string {
	const base = name.replace(/\.pdf$/i, '');
	return `${base || 'document'} (${suffix}).pdf`;
}

/** Build a downloadable PDF response. */
function pdfResponse(bytes: Uint8Array, filename: string): Response {
	return new Response(new Blob([bytes], { type: 'application/pdf' }), {
		headers: {
			'content-disposition': attachment(filename)
		}
	});
}

/**
 * Controller for the PDF tools. Owns HTTP routing and request validation;
 * delegates the actual work to {@link PdfService}.
 */
export const pdfController = new Elysia({ prefix: '/pdf' })
	.model(PdfModel.schemas)
	.post(
		'/reorder',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await PdfService.reorder(source, body.order);
			if (!result.ok) return status(422, { error: result.error });

			return pdfResponse(result.bytes, suffixedFilename(body.file.name, 'reordered'));
		},
		{ body: 'pdf.reorderBody' }
	)
	.post(
		'/split',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await PdfService.split(source, body.pages);
			if (!result.ok) return status(422, { error: result.error });

			return pdfResponse(result.bytes, suffixedFilename(body.file.name, 'split'));
		},
		{ body: 'pdf.splitBody' }
	)
	.post(
		'/merge',
		async ({ body, status }) => {
			const sources = await Promise.all(
				body.files.map(async (file) => new Uint8Array(await file.arrayBuffer()))
			);
			const result = await PdfService.merge(sources);
			if (!result.ok) return status(422, { error: result.error });

			return pdfResponse(result.bytes, 'merged.pdf');
		},
		{ body: 'pdf.mergeBody' }
	)
	.post(
		'/unlock',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await PdfService.removePassword(source, body.password);
			if (!result.ok) return status(422, { error: result.error });

			return pdfResponse(result.bytes, suffixedFilename(body.file.name, 'unlocked'));
		},
		{ body: 'pdf.unlockBody' }
	)
	.post(
		'/encrypt',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await PdfService.encrypt(source, body.password, body.algorithm);
			if (!result.ok) return status(422, { error: result.error });

			return pdfResponse(result.bytes, suffixedFilename(body.file.name, 'encrypted'));
		},
		{ body: 'pdf.encryptBody' }
	)
	.post(
		'/extract-images',
		async ({ body, status }) => {
			const source = new Uint8Array(await body.file.arrayBuffer());
			const result = await PdfService.extractImages(source);
			if (!result.ok) return status(422, { error: result.error });

			const base = body.file.name.replace(/\.pdf$/i, '') || 'document';
			return new Response(new Blob([result.bytes], { type: 'application/zip' }), {
				headers: {
					'content-disposition': attachment(`${base} images.zip`)
				}
			});
		},
		{ body: 'pdf.extractImagesBody' }
	);
