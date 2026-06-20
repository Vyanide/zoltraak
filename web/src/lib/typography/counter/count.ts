/**
 * Pure text statistics for the word counter. No DOM or network — just string
 * math, so it's trivial to reason about and runs entirely client-side.
 */

/** Common average silent-reading speed, words per minute. */
const READING_WPM = 200;
/** Common average speaking/presentation speed, words per minute. */
const SPEAKING_WPM = 130;

export type TextStats = {
	characters: number;
	charactersNoSpaces: number;
	words: number;
	sentences: number;
	paragraphs: number;
	punctuation: number;
	/** Estimated silent-reading time, in seconds. */
	readingSeconds: number;
	/** Estimated speaking time, in seconds. */
	speakingSeconds: number;
};

export function countText(text: string): TextStats {
	const characters = text.length;
	const charactersNoSpaces = text.replace(/\s/g, '').length;
	// Words: runs of non-whitespace.
	const words = (text.match(/\S+/g) ?? []).length;
	// Sentences: chunks delimited by . ! ? — trailing text with no terminator
	// still counts as one sentence.
	const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
	// Paragraphs: non-empty blocks separated by one or more line breaks.
	const paragraphs = text.split(/\n+/).filter((part) => part.trim().length > 0).length;
	// Punctuation: any Unicode punctuation mark (. , ; : ! ? " ' - … — etc.).
	const punctuation = (text.match(/\p{P}/gu) ?? []).length;

	return {
		characters,
		charactersNoSpaces,
		words,
		sentences,
		paragraphs,
		punctuation,
		readingSeconds: (words / READING_WPM) * 60,
		speakingSeconds: (words / SPEAKING_WPM) * 60
	};
}

/** Format a duration in seconds as e.g. "0 sec", "45 sec", "1 min", "2 min 5 sec". */
export function formatDuration(totalSeconds: number): string {
	const total = Math.round(totalSeconds);
	if (total < 1) return '0 sec';
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	if (minutes === 0) return `${seconds} sec`;
	if (seconds === 0) return `${minutes} min`;
	return `${minutes} min ${seconds} sec`;
}
