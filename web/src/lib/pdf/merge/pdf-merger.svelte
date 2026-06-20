<script lang="ts">
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { mergePdfs } from './api';
	import { countPages } from './inspect';
	import { downloadBlob } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';
	import type { MergeFile } from './types';
	import MergeItem from './merge-item.svelte';

	import Combine from '@lucide/svelte/icons/combine';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	type SaveState = 'idle' | 'saving' | 'done' | 'error';

	let items = $state<MergeFile[]>([]);
	let saveState = $state<SaveState>('idle');
	let saveError = $state<string | null>(null);

	const flipDurationMs = 180;
	const counting = $derived(items.some((it) => it.pageCount === null && !it.error));
	const hasErrors = $derived(items.some((it) => it.error));
	const readyToMerge = $derived(items.length >= 2 && !counting && !hasErrors);
	const totalPages = $derived(items.reduce((sum, it) => sum + (it.pageCount ?? 0), 0));

	function isPdf(file: File) {
		return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
	}

	async function addFiles(list: FileList | File[]) {
		const pdfs = Array.from(list).filter(isPdf);
		if (pdfs.length === 0) return;
		const fresh: MergeFile[] = pdfs.map((file) => ({ id: crypto.randomUUID(), file, pageCount: null }));
		items = [...items, ...fresh];
		saveState = 'idle';
		saveError = null;

		// Read each page count in the background and patch the row when it resolves.
		for (const entry of fresh) {
			let pageCount: number | null = null;
			let error: string | undefined;
			try {
				pageCount = await countPages(entry.file);
			} catch {
				error = 'Not a readable PDF';
			}
			items = items.map((it) => (it.id === entry.id ? { ...it, pageCount, error } : it));
		}
	}

	function handleConsider(event: CustomEvent<DndEvent<MergeFile>>) {
		items = event.detail.items;
	}
	function handleFinalize(event: CustomEvent<DndEvent<MergeFile>>) {
		items = event.detail.items;
		saveState = 'idle';
	}

	function remove(id: string) {
		items = items.filter((it) => it.id !== id);
		saveState = 'idle';
	}
	function clearAll() {
		items = [];
		saveState = 'idle';
		saveError = null;
	}

	async function merge() {
		if (!readyToMerge) return;
		saveState = 'saving';
		saveError = null;
		try {
			const blob = await mergePdfs(items.map((it) => it.file));
			downloadBlob(blob, 'merged.pdf');
			saveState = 'done';
		} catch (error) {
			console.error('Failed to merge PDFs', error);
			saveState = 'error';
			saveError = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

{#if items.length === 0}
	<Dropzone
		multiple
		title="Drop PDFs here, or click to browse"
		description="Add two or more PDFs to combine them into one document."
		buttonLabel="Choose PDFs"
		onfiles={addFiles}
	/>
{:else}
	<div class="space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-3 border bg-card p-3">
			<div class="min-w-0">
				<p class="font-medium">{items.length} {items.length === 1 ? 'PDF' : 'PDFs'}</p>
				<p class="text-sm text-muted-foreground tabular-nums">
					{#if counting}Reading pages…{:else}{totalPages} pages total{/if}
				</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Button variant="outline" size="sm" onclick={clearAll}>
					<Trash2 />
					Clear all
				</Button>
				<Button size="sm" disabled={!readyToMerge || saveState === 'saving'} onclick={merge}>
					{#if saveState === 'saving'}
						<LoaderCircle class="animate-spin" />
						Merging…
					{:else}
						<Combine />
						Merge PDFs
					{/if}
				</Button>
			</div>
		</div>

		{#if items.length < 2}
			<p class="px-1 text-sm text-muted-foreground">Add at least one more PDF to merge.</p>
		{:else if hasErrors}
			<p class="px-1 text-sm text-destructive">Remove the files that couldn’t be read before merging.</p>
		{/if}

		{#if saveState === 'done'}
			<div class="flex items-start gap-2 border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
				<CircleCheck class="mt-0.5 size-4 shrink-0 text-primary" />
				<span>Merged PDF downloaded.</span>
			</div>
		{:else if saveState === 'error'}
			<div class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground">
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{saveError}</span>
			</div>
		{/if}

		<section
			use:dndzone={{ items, flipDurationMs, dropTargetStyle: {} }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
			class="space-y-2"
		>
			{#each items as item, index (item.id)}
				<div animate:flip={{ duration: flipDurationMs }}>
					<MergeItem {item} position={index + 1} onRemove={remove} />
				</div>
			{/each}
		</section>

		<Dropzone multiple compact title="Drop more PDFs, or click to add" onfiles={addFiles} />

		<p class="px-1 text-xs text-muted-foreground">Drag to reorder — pages are merged top to bottom.</p>
	</div>
{/if}
