import { requestBlob } from '$lib/client';

/** Rotation + mirror options for {@link rotateImage}. */
export type RotateOptions = {
	/** Clockwise rotation in degrees (0–359). */
	angle: number;
	/** `#rrggbb` or `'transparent'` — fills the corners exposed by a non-right angle. */
	background: string;
	/** Mirror left↔right. */
	flipH: boolean;
	/** Mirror top↔bottom. */
	flipV: boolean;
};

/**
 * Send an image and a rotation/mirror spec to the backend, which applies them
 * with sharp and returns the result as a Blob. `background` only fills the
 * corners exposed by a non-right-angle rotation.
 */
export async function rotateImage(file: File, opts: RotateOptions): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('angle', String(opts.angle));
	form.append('background', opts.background);
	form.append('flipH', String(opts.flipH));
	form.append('flipV', String(opts.flipV));
	return requestBlob('/image/rotate', form);
}
