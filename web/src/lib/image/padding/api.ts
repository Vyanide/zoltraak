import { requestBlob } from '$lib/client';

export type Padding = { top: number; right: number; bottom: number; left: number };

/**
 * Send an image, its per-side padding (in pixels) and a background to the
 * backend, which pads it with sharp and returns the result as a Blob.
 * `background` is a `#rrggbb` hex or the literal `'transparent'`.
 */
export async function padImage(file: File, padding: Padding, background: string): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('top', String(padding.top));
	form.append('right', String(padding.right));
	form.append('bottom', String(padding.bottom));
	form.append('left', String(padding.left));
	form.append('background', background);
	return requestBlob('/image/pad', form);
}
