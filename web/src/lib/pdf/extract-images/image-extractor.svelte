<script lang="ts">
	import { extractImages } from './api';
	import { downloadBlob } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import FileText from '@lucide/svelte/icons/file-text';
	import ImageDown from '@lucide/svelte/icons/image-down';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type SaveState = 'idle' | 'saving' | 'done' | 'error';

	let file = $state<File | null>(null);
	let saveState = $state<SaveState>('idle');
	let saveError = $state<string | null>(null);

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function selectFile(picked: File) {
		file = picked;
		saveState = 'idle';
		saveError = null;
	}

	function reset() {
		file = null;
		saveState = 'idle';
		saveError = null;
	}

	function downloadName(name: string) {
		return `${name.replace(/\.pdf$/i, '') || 'document'} images.zip`;
	}

	async function run() {
		if (!file || saveState === 'saving') return;
		saveState = 'saving';
		saveError = null;
		try {
			const blob = await extractImages(file);
			downloadBlob(blob, downloadName(file.name));
			saveState = 'done';
		} catch (error) {
			console.error('Failed to extract images', error);
			saveState = 'error';
			saveError = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

{#if !file}
	<Dropzone
		title="Drop a PDF here, or click to browse"
		description="Embedded JPEG and PNG images are pulled out and zipped up."
		buttonLabel="Choose PDF"
		onfiles={(files) => {
			if (files[0]) selectFile(files[0]);
		}}
	/>
{:else}
	<div class="space-y-4">
		<div class="flex items-center gap-3 border bg-card p-3">
			<div class="bg-muted p-2 text-primary">
				<FileText class="size-5" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate font-medium">{file.name}</p>
				<p class="text-sm text-muted-foreground tabular-nums">{formatSize(file.size)}</p>
			</div>
			<Button variant="outline" size="sm" onclick={reset}>Choose different file</Button>
		</div>

		{#if saveState === 'done'}
			<div class="flex items-start gap-2 border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
				<CircleCheck class="mt-0.5 size-4 shrink-0 text-primary" />
				<span>Images downloaded as a ZIP.</span>
			</div>
		{:else if saveState === 'error'}
			<div class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground">
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{saveError}</span>
			</div>
		{/if}

		<Button onclick={run} disabled={saveState === 'saving'}>
			{#if saveState === 'saving'}
				<LoaderCircle class="animate-spin" />
				Extracting…
			{:else}
				<ImageDown />
				Extract images
			{/if}
		</Button>

		<p class="px-1 text-xs text-muted-foreground">
			Pulls out embedded JPEG and PNG images. Some encodings (CMYK, indexed, 1-bit masks) are skipped.
		</p>
	</div>
{/if}
