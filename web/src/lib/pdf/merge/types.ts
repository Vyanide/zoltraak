/** A PDF queued for merging. */
export type MergeFile = {
	/** Stable id for the keyed `{#each}` and svelte-dnd-action. */
	id: string;
	file: File;
	/** Page count, or `null` while it is still being read. */
	pageCount: number | null;
	/** Set if the file could not be read as a PDF. */
	error?: string;
};
