import { requestBlob } from '$lib/client';

/**
 * Send an image and mirror toggles to the backend, which flips it with sharp
 * (`flipH` = left↔right, `flipV` = top↔bottom) and returns the result as a Blob.
 */
export async function flipImage(file: File, flipH: boolean, flipV: boolean): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('flipH', String(flipH));
	form.append('flipV', String(flipV));
	return requestBlob('/image/flip', form);
}
