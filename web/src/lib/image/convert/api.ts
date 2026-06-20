import { requestBlob } from '$lib/client';
import type { TargetFormat } from './formats';

/**
 * Send an image, a target format and (optionally) a quality to the backend,
 * which re-encodes it with ImageMagick and returns the converted image as a
 * Blob. `quality` (1–100) only applies to the lossy formats.
 */
export async function convertImage(
	file: File,
	format: TargetFormat,
	quality?: number
): Promise<Blob> {
	const form = new FormData();
	form.append('file', file);
	form.append('format', format);
	if (quality != null) form.append('quality', String(quality));
	return requestBlob('/image/convert', form);
}
