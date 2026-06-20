import { PDF, SecurityError, type EncryptionAlgorithmOption } from '@libpdf/core';
import { zipSync } from 'fflate';
import { collectImages } from './extract-images';

export type PdfResult =
	| { ok: true; bytes: Uint8Array }
	| { ok: false; error: string };

/**
 * Pure PDF logic. It has no knowledge of HTTP or Elysia, so it changes only
 * when the PDF behaviour changes (CCP) and can be unit tested on its own.
 */
export abstract class PdfService {
	/**
	 * Produce a new PDF whose pages follow `order` — an array of 1-based page
	 * numbers from the source document, in their desired new sequence.
	 *
	 * Invalid input is reported as a `{ ok: false }` result rather than thrown,
	 * leaving HTTP status mapping to the controller.
	 */
	static async reorder(source: Uint8Array, order: number[]): Promise<PdfResult> {
		let doc: PDF;
		try {
			doc = await PDF.load(source);
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as a PDF.' };
		}

		const pageCount = doc.getPageCount();
		if (order.length === 0) {
			return { ok: false, error: 'The page order must contain at least one page.' };
		}
		for (const n of order) {
			if (!Number.isInteger(n) || n < 1 || n > pageCount) {
				return {
					ok: false,
					error: `Page ${n} is out of range — this PDF has ${pageCount} page(s).`
				};
			}
		}

		// extractPages builds a fresh document containing the requested pages in
		// the given order, deep-copying their resources. The source is untouched.
		const reordered = await doc.extractPages(order.map((n) => n - 1));
		const bytes = await reordered.save();
		return { ok: true, bytes };
	}

	/**
	 * Produce a new PDF containing only `pages` — an array of 1-based page numbers
	 * from the source to keep, in the order they should appear in the output.
	 *
	 * Like {@link reorder}, invalid input is reported as `{ ok: false }` rather
	 * than thrown, leaving HTTP status mapping to the controller.
	 */
	static async split(source: Uint8Array, pages: number[]): Promise<PdfResult> {
		let doc: PDF;
		try {
			doc = await PDF.load(source);
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as a PDF.' };
		}

		const pageCount = doc.getPageCount();
		if (pages.length === 0) {
			return { ok: false, error: 'Select at least one page to keep.' };
		}
		for (const n of pages) {
			if (!Number.isInteger(n) || n < 1 || n > pageCount) {
				return {
					ok: false,
					error: `Page ${n} is out of range — this PDF has ${pageCount} page(s).`
				};
			}
		}

		// extractPages builds a fresh document with just the requested pages,
		// deep-copying their resources; the source is left untouched.
		const result = await doc.extractPages(pages.map((n) => n - 1));
		const bytes = await result.save();
		return { ok: true, bytes };
	}

	/**
	 * Concatenate `sources` into a single PDF, preserving the given order.
	 */
	static async merge(sources: Uint8Array[]): Promise<PdfResult> {
		if (sources.length < 2) {
			return { ok: false, error: 'Merging needs at least two PDFs.' };
		}

		let merged: PDF;
		try {
			merged = await PDF.merge(sources);
		} catch {
			return { ok: false, error: 'One of the files could not be read as a PDF.' };
		}

		const bytes = await merged.save();
		return { ok: true, bytes };
	}

	/**
	 * Decrypt a password-protected PDF and return it without encryption.
	 */
	static async removePassword(source: Uint8Array, password: string): Promise<PdfResult> {
		let doc: PDF;
		try {
			doc = await PDF.load(source, { credentials: password });
		} catch (error) {
			// A bad password surfaces as a SecurityError during parsing.
			if (error instanceof SecurityError) {
				return { ok: false, error: 'Incorrect password for this PDF.' };
			}
			return { ok: false, error: 'The uploaded file could not be read as a PDF.' };
		}

		if (!doc.isEncrypted) {
			return { ok: false, error: 'This PDF is not password-protected.' };
		}
		if (!doc.isAuthenticated) {
			return { ok: false, error: 'Incorrect password for this PDF.' };
		}

		try {
			doc.removeProtection();
		} catch {
			// e.g. authenticated with the user password on a doc that forbids changes.
			return {
				ok: false,
				error: 'That password can’t remove this PDF’s protection — the owner password is required.'
			};
		}

		const bytes = await doc.save();
		return { ok: true, bytes };
	}

	/**
	 * Encrypt a PDF with `password` using the chosen `algorithm`.
	 *
	 * The password is set as both the user and owner password, so the single
	 * password both opens the document and carries the rights to later strip the
	 * protection (e.g. via the unlock tool). Re-encrypting an already-protected
	 * PDF isn't supported — the existing password must be removed first.
	 */
	static async encrypt(
		source: Uint8Array,
		password: string,
		algorithm: EncryptionAlgorithmOption
	): Promise<PdfResult> {
		if (!password) {
			return { ok: false, error: 'A password is required to encrypt the PDF.' };
		}

		let doc: PDF;
		try {
			doc = await PDF.load(source);
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as a PDF.' };
		}

		if (doc.isEncrypted) {
			return {
				ok: false,
				error: 'This PDF is already password-protected. Remove its password first.'
			};
		}

		try {
			doc.setProtection({ userPassword: password, ownerPassword: password, algorithm });
			const bytes = await doc.save();
			return { ok: true, bytes };
		} catch (error) {
			// LibPDF 0.4 can only apply AES-256 to a new document; the weaker
			// ciphers throw an "Only AES-256 …" error here. Surface that as a clean
			// 422 instead of letting it become a 500.
			if (error instanceof Error && /AES-256/i.test(error.message)) {
				return { ok: false, error: 'Only AES-256 encryption is supported right now.' };
			}
			return { ok: false, error: 'This PDF could not be encrypted.' };
		}
	}

	/**
	 * Extract embedded images from a PDF, returned as a ZIP archive's bytes.
	 */
	static async extractImages(source: Uint8Array): Promise<PdfResult> {
		let images: { name: string; bytes: Uint8Array }[];
		try {
			images = await collectImages(source);
		} catch {
			return { ok: false, error: 'The uploaded file could not be read as a PDF.' };
		}
		if (images.length === 0) {
			return { ok: false, error: 'No extractable images were found in this PDF.' };
		}

		const entries: Record<string, Uint8Array> = {};
		for (const image of images) entries[image.name] = image.bytes;
		// level 0 (store): the images are already compressed.
		return { ok: true, bytes: zipSync(entries, { level: 0 }) };
	}
}
