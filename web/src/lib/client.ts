/**
 * Shared client for the zoltraak backend. The backend origin is defined once
 * here so every tool talks to the same place; override it at build time with
 * `VITE_SERVER_URL`.
 */
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000';

/**
 * POST a multipart form to the backend and return the binary response as a Blob
 * (a PDF, image, ZIP, …). Throws an `Error` with a human-readable message on
 * failure.
 */
export async function requestBlob(path: string, form: FormData): Promise<Blob> {
	let response: Response;
	try {
		response = await fetch(`${SERVER_URL}${path}`, { method: 'POST', body: form });
	} catch {
		throw new Error('Could not reach the server. Is it running?');
	}

	if (!response.ok) {
		let message = `The server responded with ${response.status}.`;
		try {
			const data = await response.json();
			if (data?.error) message = data.error;
		} catch {
			// Non-JSON error body — keep the generic message.
		}
		throw new Error(message);
	}

	return await response.blob();
}

/** Trigger a browser download of `blob` under `filename`. */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
