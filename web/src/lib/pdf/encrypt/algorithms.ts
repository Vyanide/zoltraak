/**
 * The encryption ciphers presented in the UI. The string values mirror LibPDF's
 * `EncryptionAlgorithmOption` exactly — they're sent verbatim as a form field.
 *
 * The PDF engine (LibPDF 0.4) can only apply **AES-256** to a fresh document;
 * the weaker/legacy ciphers are listed so the type picker is complete and ready
 * to light up if the engine gains support, but they're flagged `supported:
 * false` and disabled in the UI. The server rejects them with a 422 too, so the
 * two stay in sync.
 */
export type EncryptionAlgorithm = 'AES-256' | 'AES-128' | 'RC4-128' | 'RC4-40';

export type AlgorithmOption = {
	value: EncryptionAlgorithm;
	name: string;
	description: string;
	/** Whether the backend can currently apply this cipher. */
	supported: boolean;
	/** The default, strongest choice — flagged in the UI. */
	recommended?: boolean;
};

export const algorithms: AlgorithmOption[] = [
	{
		value: 'AES-256',
		name: 'AES-256',
		description: 'Strongest. Needs a PDF 2.0 reader.',
		supported: true,
		recommended: true
	},
	{
		value: 'AES-128',
		name: 'AES-128',
		description: 'Strong. Works in PDF 1.5+ readers.',
		supported: false
	},
	{
		value: 'RC4-128',
		name: 'RC4 128-bit',
		description: 'Legacy cipher, broad compatibility.',
		supported: false
	},
	{
		value: 'RC4-40',
		name: 'RC4 40-bit',
		description: 'Weak. Only for very old readers.',
		supported: false
	}
];

export const defaultAlgorithm: EncryptionAlgorithm = 'AES-256';
