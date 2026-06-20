import { requestBlob } from '$lib/client';

/** A crop rectangle in source-image pixels. */
export type CropRect = { left: number; top: number; width: number; height: number };

/**
 * Send an image and a crop rectangle (in source-image pixels) to the backend,
 * which extracts it with sharp and returns the cropped image as a Blob.
 */
export async function cropImage(file: File, rect: CropRect): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('left', String(rect.left));
	form.append('top', String(rect.top));
	form.append('width', String(rect.width));
	form.append('height', String(rect.height));
	return requestBlob('/image/crop', form);
}
