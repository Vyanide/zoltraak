import { PaddleOcrService, V6_MEDIUM_MODEL } from 'ppu-paddle-ocr';
import type { OcrResult } from './types';

/**
 * Optical character recognition via ppu-paddle-ocr (PP-OCRv6 medium). The
 * library owns the whole pipeline — text detection (DBNet), recognition (CTC)
 * and the OpenCV-based pre/post-processing — so this module just feeds it bytes
 * and hands back the extracted text.
 *
 * The PP-OCRv6 medium weights + dictionary are downloaded and cached by the
 * library on first use (to its own cache dir), the same "fetch once" pattern the
 * background-removal models use. The first request therefore needs outbound
 * network access and is slow; later requests reuse the cached models.
 */

// Lazy singleton: the OCR service (models + OpenCV runtime) initializes at most
// once and is shared across requests.
let servicePromise: Promise<PaddleOcrService> | null = null;

function getService(): Promise<PaddleOcrService> {
	if (!servicePromise) {
		servicePromise = (async () => {
			const service = new PaddleOcrService({ model: V6_MEDIUM_MODEL });
			await service.initialize();
			return service;
		})();
		// On failure, drop the cached rejection so the next request can retry.
		servicePromise.catch(() => {
			servicePromise = null;
		});
	}
	return servicePromise;
}

/**
 * Recognize the text in an image and return it as a single string (lines
 * separated by newlines), or an error result the controller maps to a 422.
 */
export async function recognizeText(source: ArrayBuffer): Promise<OcrResult> {
	const service = await getService().catch((error) => {
		console.error('Failed to load the OCR model', error);
		return null;
	});
	if (!service) {
		return {
			ok: false,
			error: 'The OCR model could not be loaded — the server may lack network access to download it.'
		};
	}

	try {
		const result = await service.recognize(source);
		return { ok: true, text: result.text };
	} catch (error) {
		console.error('OCR failed', error);
		return { ok: false, error: 'The uploaded file could not be read as an image.' };
	}
}
