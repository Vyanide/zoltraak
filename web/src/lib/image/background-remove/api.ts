import { requestBlob } from '$lib/client';
import type { BgModel } from './models';

/**
 * Send an image and a model choice to the backend, which removes the background
 * with an ONNX model and returns a transparent PNG as a Blob.
 */
export async function removeBackground(file: File, model: BgModel): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('model', model);
	return requestBlob('/image/remove-background', form);
}
