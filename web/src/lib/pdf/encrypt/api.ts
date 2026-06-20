import { requestBlob } from '$lib/client';
import type { EncryptionAlgorithm } from './algorithms';

/**
 * Send a PDF, a password, and the chosen cipher to the backend, and return the
 * encrypted PDF as a Blob.
 */
export async function encryptPdf(
	file: File,
	password: string,
	algorithm: EncryptionAlgorithm
): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('password', password);
	form.append('algorithm', algorithm);
	return requestBlob('/pdf/encrypt', form);
}
