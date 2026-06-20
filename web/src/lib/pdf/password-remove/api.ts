import { requestBlob } from '$lib/client';

/**
 * Send a password-protected PDF and its password to the backend, and return
 * the unlocked PDF as a Blob.
 */
export async function removePassword(file: File, password: string): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('password', password);
	return requestBlob('/pdf/unlock', form);
}
