import { t } from 'elysia';

/**
 * Request/response shapes for the PDF module. Kept together so the API contract
 * changes in one place (Common Closure Principle).
 */
export namespace PdfModel {
	/**
	 * Multipart body for `POST /pdf/reorder`.
	 *
	 * `order` is the new page sequence as 1-based page numbers — e.g. `[3,1,2]`.
	 * The client sends it as a JSON string in the form field; Elysia's form
	 * parser turns that back into an array before validation. The upper bound
	 * (page count) is enforced at runtime by the service.
	 */
	export const reorderBody = t.Object({
		file: t.File({ type: 'application/pdf', maxSize: '50m' }),
		order: t.Array(t.Integer({ minimum: 1 }), { minItems: 1 })
	});
	export type ReorderBody = typeof reorderBody.static;

	/**
	 * Multipart body for `POST /pdf/merge`.
	 *
	 * `files` is the list of PDFs to concatenate, in the order received. The
	 * minimum count (≥ 2) is enforced at runtime by the service.
	 */
	export const mergeBody = t.Object({
		files: t.Files({ type: 'application/pdf', maxSize: '50m' })
	});
	export type MergeBody = typeof mergeBody.static;

	/**
	 * Multipart body for `POST /pdf/unlock`.
	 *
	 * `password` is the PDF's password (may be empty for owner-only encryption).
	 */
	export const unlockBody = t.Object({
		file: t.File({ type: 'application/pdf', maxSize: '50m' }),
		password: t.String()
	});
	export type UnlockBody = typeof unlockBody.static;

	/**
	 * Multipart body for `POST /pdf/encrypt`.
	 *
	 * `password` locks the document (rejected when empty). `algorithm` is the
	 * cipher to use — the literals mirror LibPDF's `EncryptionAlgorithmOption`,
	 * with AES-256 as the default for callers that omit it.
	 */
	export const encryptBody = t.Object({
		file: t.File({ type: 'application/pdf', maxSize: '50m' }),
		password: t.String({ minLength: 1 }),
		algorithm: t.Union(
			[t.Literal('AES-256'), t.Literal('AES-128'), t.Literal('RC4-128'), t.Literal('RC4-40')],
			{ default: 'AES-256' }
		)
	});
	export type EncryptBody = typeof encryptBody.static;

	/** Multipart body for `POST /pdf/extract-images`. */
	export const extractImagesBody = t.Object({
		file: t.File({ type: 'application/pdf', maxSize: '50m' })
	});
	export type ExtractImagesBody = typeof extractImagesBody.static;

	/**
	 * Multipart body for `POST /pdf/split`.
	 *
	 * `pages` is the set of 1-based page numbers to keep, in the order they should
	 * appear in the output. Sent as a JSON string; Elysia's form parser turns it
	 * back into an array. The upper bound (page count) is enforced by the service.
	 */
	export const splitBody = t.Object({
		file: t.File({ type: 'application/pdf', maxSize: '50m' }),
		pages: t.Array(t.Integer({ minimum: 1 }), { minItems: 1 })
	});
	export type SplitBody = typeof splitBody.static;

	/** Models registered on the Elysia instance and referenced by name. */
	export const schemas = {
		'pdf.reorderBody': reorderBody,
		'pdf.mergeBody': mergeBody,
		'pdf.unlockBody': unlockBody,
		'pdf.encryptBody': encryptBody,
		'pdf.extractImagesBody': extractImagesBody,
		'pdf.splitBody': splitBody
	};
}
