<script lang="ts">
	import { renderPdfThumbnails, type PdfPage } from './render';
	import { splitPdf } from './api';
	import { downloadBlob } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';
	import PageThumb from './page-thumb.svelte';

	import FileUp from '@lucide/svelte/icons/file-up';
	import FileText from '@lucide/svelte/icons/file-text';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import Square from '@lucide/svelte/icons/square';
	import Scissors from '@lucide/svelte/icons/scissors';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type Status = 'idle' | 'loading' | 'ready' | 'error';
	type SaveState = 'idle' | 'saving' | 'done' | 'error';
	type SelectablePage = PdfPage & { keep: boolean };

	let status = $state<Status>('idle');
	let fileName = $state<string | null>(null);
	let sourceFile = $state<File | null>(null);
	let pages = $state<SelectablePage[]>([]);
	let errorMessage = $state<string | null>(null);
	let progress = $state({ rendered: 0, total: 0 });
	let saveState = $state<SaveState>('idle');
	let saveError = $state<string | null>(null);

	let fileInput: HTMLInputElement;

	const selectedCount = $derived(pages.filter((p) => p.keep).length);
	// 1-based page numbers to keep, ascending (pages are in document order).
	const keepPages = $derived(pages.filter((p) => p.keep).map((p) => p.pageNumber));
	const allSelected = $derived(pages.length > 0 && selectedCount === pages.length);

	async function load(file: File) {
		const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
		if (!isPdf) {
			status = 'error';
			errorMessage = `“${file.name}” is not a PDF file.`;
			return;
		}

		status = 'loading';
		errorMessage = null;
		saveState = 'idle';
		saveError = null;
		fileName = file.name;
		sourceFile = file;
		pages = [];
		progress = { rendered: 0, total: 0 };

		try {
			const result = await renderPdfThumbnails(file, (rendered, total) => {
				progress = { rendered, total };
			});
			// Start with nothing kept — the user clicks the pages to keep.
			pages = result.pages.map((page) => ({ ...page, keep: false }));
			status = 'ready';
		} catch (error) {
			console.error('Failed to render PDF', error);
			status = 'error';
			errorMessage = error instanceof Error ? error.message : 'Could not read this PDF.';
		}
	}

	function onInputChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) load(file);
		input.value = ''; // allow re-selecting the same file
	}

	function openPicker() {
		fileInput.click();
	}

	function toggle(index: number) {
		const page = pages[index];
		if (!page) return;
		page.keep = !page.keep;
		saveState = 'idle';
		saveError = null;
	}

	function selectAll() {
		for (const page of pages) page.keep = true;
		saveState = 'idle';
		saveError = null;
	}

	function clear() {
		for (const page of pages) page.keep = false;
		saveState = 'idle';
		saveError = null;
	}

	function downloadName(name: string) {
		return `${name.replace(/\.pdf$/i, '') || 'document'} (split).pdf`;
	}

	// Send the PDF + kept pages to the backend and download the split file.
	async function split() {
		if (!sourceFile || keepPages.length === 0) return;
		saveState = 'saving';
		saveError = null;
		try {
			const blob = await splitPdf(sourceFile, keepPages);
			downloadBlob(blob, downloadName(sourceFile.name));
			saveState = 'done';
		} catch (error) {
			console.error('Failed to split PDF', error);
			saveState = 'error';
			saveError = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="application/pdf,.pdf"
	class="hidden"
	onchange={onInputChange}
/>

{#if status === 'idle' || status === 'error'}
	<Dropzone
		title="Drop a PDF here, or click to browse"
		description="Every page is rendered locally; only the pages you keep are sent to the server."
		buttonLabel="Choose PDF"
		onfiles={(files) => {
			if (files[0]) load(files[0]);
		}}
	/>

	{#if status === 'error' && errorMessage}
		<p class="mt-4 flex items-center gap-2 text-sm text-destructive">
			<TriangleAlert class="size-4" />
			{errorMessage}
		</p>
	{/if}
{:else if status === 'loading'}
	<div class="flex flex-col items-center justify-center gap-4 border bg-card px-6 py-20">
		<LoaderCircle class="size-8 animate-spin text-primary" />
		<div class="space-y-1 text-center">
			<p class="font-medium">Rendering pages…</p>
			<p class="text-sm text-muted-foreground tabular-nums">
				{progress.rendered} / {progress.total || '—'} pages
			</p>
		</div>
		{#if progress.total > 0}
			<div class="h-2 w-64 overflow-hidden bg-muted">
				<div
					class="h-full bg-primary transition-all"
					style="width: {(progress.rendered / progress.total) * 100}%"
				></div>
			</div>
		{/if}
	</div>
{:else}
	<div class="space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-3 border bg-card p-3">
			<div class="flex min-w-0 items-center gap-3">
				<div class="bg-muted p-2 text-primary">
					<FileText class="size-5" />
				</div>
				<div class="min-w-0">
					<p class="truncate font-medium">{fileName}</p>
					<p class="text-sm text-muted-foreground tabular-nums">
						{selectedCount} of {pages.length} page{pages.length === 1 ? '' : 's'} kept
					</p>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Button variant="outline" size="sm" onclick={openPicker}>
					<FileUp />
					Open another
				</Button>
				<Button variant="outline" size="sm" disabled={allSelected} onclick={selectAll}>
					<CheckCheck />
					Select all
				</Button>
				<Button variant="outline" size="sm" disabled={selectedCount === 0} onclick={clear}>
					<Square />
					Clear
				</Button>
				<Button size="sm" disabled={selectedCount === 0 || saveState === 'saving'} onclick={split}>
					{#if saveState === 'saving'}
						<LoaderCircle class="animate-spin" />
						Splitting…
					{:else}
						<Scissors />
						{selectedCount > 0 ? `Split (${selectedCount} page${selectedCount === 1 ? '' : 's'})` : 'Split'}
					{/if}
				</Button>
			</div>
		</div>

		{#if saveState === 'done'}
			<div
				class="flex items-start gap-2 border border-primary/40 bg-primary/10 p-3 text-sm text-foreground"
			>
				<CircleCheck class="mt-0.5 size-4 shrink-0 text-primary" />
				<span>Split PDF downloaded.</span>
			</div>
		{:else if saveState === 'error'}
			<div
				class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{saveError}</span>
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">Click the pages you want to keep, then split.</p>
		{/if}

		<section class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each pages as page, index (page.pageNumber)}
				<PageThumb {page} keep={page.keep} ontoggle={() => toggle(index)} />
			{/each}
		</section>
	</div>
{/if}
