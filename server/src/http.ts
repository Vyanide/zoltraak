/**
 * Build a valid `Content-Disposition: attachment` header value for an arbitrary
 * download filename.
 *
 * HTTP header values must be ISO-8859-1, so a raw non-ASCII filename (accented,
 * CJK, emoji, …) throws "invalid header value" when the `Response` is built —
 * which surfaces as an unhandled 500. We emit a sanitised ASCII `filename` as a
 * legacy fallback plus an RFC 5987 `filename*` carrying the UTF-8 name
 * percent-encoded, which modern browsers prefer.
 */
export function attachment(filename: string): string {
	const fallback =
		filename
			.replace(/[^\x20-\x7e]/g, '_')
			.replace(/["\\]/g, '_')
			.trim() || 'download';
	// encodeURIComponent leaves a few chars that aren't RFC 5987 attr-chars
	// (notably `'`, which is the `UTF-8''` delimiter) — encode those too.
	const encoded = encodeURIComponent(filename).replace(
		/['()*!]/g,
		(c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
	);
	return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
