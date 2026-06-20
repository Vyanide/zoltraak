import { requestBlob } from '$lib/client';

/**
 * `inside` keeps the original aspect ratio (fit within the box); `fill`
 * stretches the image to exactly the given width × height.
 */
export type ResizeFit = 'inside' | 'fill';
export type ResizeOptions = { width?: number; height?: number; fit: ResizeFit };

/**
 * Send an image and its target dimensions to the backend, which resizes it with
 * sharp and returns the result as a Blob.
 */
export async function resizeImage(file: File, opts: ResizeOptions): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	if (opts.width != null) form.append('width', String(opts.width));
	if (opts.height != null) form.append('height', String(opts.height));
	form.append('fit', opts.fit);
	return requestBlob('/image/resize', form);
}
