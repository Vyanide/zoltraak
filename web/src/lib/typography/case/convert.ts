/**
 * Pure text-case transforms for the case converter. No DOM or network — they
 * run entirely client-side, and each is deterministic from any input state
 * (they lowercase first where needed), so conversions can be chained.
 */

export type CaseKind = 'upper' | 'lower' | 'title' | 'sentence';

export function convertCase(kind: CaseKind, text: string): string {
	switch (kind) {
		case 'upper':
			return text.toUpperCase();
		case 'lower':
			return text.toLowerCase();
		case 'title':
			// Capitalize the first letter of each whitespace-separated word.
			return text.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
		case 'sentence':
			// Capitalize the first letter of the text and of each new sentence/line.
			return text
				.toLowerCase()
				.replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
	}
}
