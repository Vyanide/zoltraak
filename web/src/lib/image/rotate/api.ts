import { requestBlob } from '$lib/client';

/**
 * Send an image, a clockwise rotation `angle` (0–359°) and a `background` to the
 * backend, which rotates it with sharp and returns the result as a Blob.
 * `background` (`#rrggbb` or `'transparent'`) only fills the corners exposed by a
 * non-right-angle rotation.
 */
export async function rotateImage(file: File, angle: number, background: string): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('angle', String(angle));
	form.append('background', background);
	return requestBlob('/image/rotate', form);
}
