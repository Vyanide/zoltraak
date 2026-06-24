/**
 * Pure JSON formatting helpers. No DOM or network — stdlib JSON.parse /
 * JSON.stringify validate and (re)serialise exactly RFC 8259 JSON, so this runs
 * entirely client-side.
 */

/** Indentation used when pretty-printing. */
export type Indent = 2 | 4 | 'tab';

/** A formatted string, or the raw JSON.parse error message. */
export type FormatResult = { ok: true; output: string } | { ok: false; error: string };

// A leading BOM is valid to ignore (RFC 8259 §8.1) but JSON.parse rejects it.
const stripBom = (text: string) => text.replace(/^\uFEFF/, '');

function run(text: string, indent: string | number | undefined): FormatResult {
	try {
		return { ok: true, output: JSON.stringify(JSON.parse(stripBom(text)), null, indent) };
	} catch (error) {
		// Surface JSON.parse's own message as-is (wording is engine-specific).
		return { ok: false, error: error instanceof Error ? error.message : String(error) };
	}
}

/** Pretty-print with the chosen indentation. */
export const pretty = (text: string, indent: Indent): FormatResult =>
	run(text, indent === 'tab' ? '\t' : indent);

/** Collapse to the most compact single-line form. */
export const minify = (text: string): FormatResult => run(text, undefined);
