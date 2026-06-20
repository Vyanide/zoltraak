/**
 * Pure lorem-ipsum generation. No DOM or network — runs entirely client-side.
 * Randomness uses Math.random, so output is generated fresh in the browser.
 */

export type Unit = 'paragraphs' | 'sentences' | 'words';

/** The classic opening, used when "start with Lorem ipsum…" is on. */
const LEAD = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
const LEAD_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' ');

/** Word pool: the classic lorem words plus common filler to vary the text. */
const WORDS =
	'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis quasi architecto beatae vitae dicta sunt explicabo aspernatur odit aut fugit sed quia consequuntur magni dolores ratione sequi nesciunt neque porro quisquam dolorem adipisci numquam eius modi tempora incidunt magnam quaerat voluptatem aliquam quaerat'.split(
		' '
	);

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(): string {
	return WORDS[randInt(0, WORDS.length - 1)]!;
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function makeSentence(): string {
	const length = randInt(6, 14);
	const words: string[] = [];
	for (let i = 0; i < length; i++) words.push(pick());
	// Drop in a comma somewhere in longer sentences for natural rhythm.
	if (length >= 8 && Math.random() < 0.6) {
		const at = randInt(2, length - 3);
		words[at] = words[at]! + ',';
	}
	return capitalize(words.join(' ')) + '.';
}

function makeParagraph(): string {
	const count = randInt(3, 7);
	const sentences: string[] = [];
	for (let i = 0; i < count; i++) sentences.push(makeSentence());
	return sentences.join(' ');
}

/**
 * Generate `count` units of lorem text. Paragraphs are separated by blank lines.
 * When `startWithLorem` is set, the output begins with the canonical opening.
 */
export function generate(unit: Unit, count: number, startWithLorem: boolean): string {
	// Not clamped to an upper bound; 0 (or empty/negative) yields no text.
	const n = Math.floor(count);
	if (!Number.isFinite(n) || n <= 0) return '';

	if (unit === 'words') {
		const words: string[] = [];
		if (startWithLorem) words.push(...LEAD_WORDS.slice(0, n));
		while (words.length < n) words.push(pick());
		return capitalize(words.slice(0, n).join(' ')) + '.';
	}

	if (unit === 'sentences') {
		const sentences: string[] = [];
		for (let i = 0; i < n; i++) sentences.push(makeSentence());
		if (startWithLorem) sentences[0] = LEAD;
		return sentences.join(' ');
	}

	const paragraphs: string[] = [];
	for (let i = 0; i < n; i++) paragraphs.push(makeParagraph());
	if (startWithLorem && paragraphs.length > 0) {
		paragraphs[0] = `${LEAD} ${paragraphs[0]}`;
	}
	return paragraphs.join('\n\n');
}
