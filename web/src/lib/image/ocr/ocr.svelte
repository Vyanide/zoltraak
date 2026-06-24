<script lang="ts">
	import { extractText } from './api';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import ScanText from '@lucide/svelte/icons/scan-text';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type RunState = 'idle' | 'working' | 'done' | 'error';

	const ACCEPT = 'image/*';
	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let text = $state('');
	let runState = $state<RunState>('idle');
	let errorMessage = $state<string | null>(null);
	let copied = $state(false);

	// Revoke the preview object URL when the component is torn down.
	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
	});

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	function setOriginalUrl(file: File | null) {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		originalUrl = file ? URL.createObjectURL(file) : '';
	}

	/** Drop the previous result — it belongs to the old upload. */
	function clearResult() {
		text = '';
		copied = false;
		if (runState !== 'working') runState = 'idle';
		errorMessage = null;
	}

	function selectFile(file: File) {
		original = file;
		setOriginalUrl(file);
		clearResult();
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		clearResult();
	}

	async function run() {
		if (!original || runState === 'working') return;
		runState = 'working';
		errorMessage = null;
		try {
			text = await extractText(original);
			runState = 'done';
		} catch (error) {
			console.error('Failed to extract text', error);
			runState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}

	async function copy() {
		if (!text) return;
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

{#if !original}
	<Dropzone
		title="Drop an image to extract its text, or click to browse"
		description="Any image format. The image is sent to the server and read with OCR (PP-OCRv6); only the text comes back."
		buttonLabel="Choose image"
		accept={ACCEPT}
		onfiles={(files) => {
			if (files[0]) selectFile(files[0]);
		}}
	/>
{:else}
	<div class="space-y-4">
		<div class="flex items-center gap-3 border bg-card p-3">
			<div class="size-12 shrink-0 overflow-hidden border bg-muted/40">
				<img src={originalUrl} alt="" class="size-full object-cover" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate font-medium">{original.name}</p>
				<p class="text-sm text-muted-foreground tabular-nums">{formatSize(original.size)}</p>
			</div>
			<Button variant="outline" size="sm" onclick={reset}>Choose different image</Button>
		</div>

		<!-- Enchanting table: image in (left), strictly text out (right) -->
		<div class="grid gap-4 lg:grid-cols-2">
			<!-- Source image -->
			<div
				class="relative grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6"
			>
				<span
					class="absolute left-3 top-3 z-10 border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
				>
					Source
				</span>
				<img src={originalUrl} alt="Source" class="max-h-[60vh] w-auto object-contain" />
			</div>

			<!-- Extracted text -->
			<div class="flex min-h-[24rem] flex-col border bg-card">
				<div class="flex items-center justify-between border-b px-3 py-2">
					<span class={sectionLabel}>Extracted text</span>
					{#if runState === 'done' && text}
						<button
							type="button"
							onclick={copy}
							class="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if copied}
								<Check class="size-3" /> Copied
							{:else}
								<Copy class="size-3" /> Copy
							{/if}
						</button>
					{/if}
				</div>

				{#if runState === 'done'}
					{#if text}
						<textarea
							readonly
							class="flex-1 resize-none bg-background p-3 font-mono text-sm text-foreground outline-none"
							value={text}
						></textarea>
					{:else}
						<p class="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
							No text was found in this image.
						</p>
					{/if}
				{:else if runState === 'error'}
					<div class="flex flex-1 items-start gap-2 p-3 text-sm text-foreground">
						<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
						<span>{errorMessage}</span>
					</div>
				{:else}
					<div class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
						{#if runState === 'working'}
							<LoaderCircle class="size-5 animate-spin text-muted-foreground" />
							<p class="text-xs text-muted-foreground">
								Reading the image… the first run downloads the OCR model (~140&nbsp;MB) on the
								server, so it can take a while. Later runs are faster.
							</p>
						{:else}
							<p class="text-sm text-muted-foreground">Run OCR to extract the text from this image.</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<Button class="w-full justify-center sm:w-auto" onclick={run} disabled={runState === 'working'}>
			{#if runState === 'working'}
				<LoaderCircle class="animate-spin" />
				Reading…
			{:else}
				<ScanText />
				{runState === 'done' ? 'Read again' : 'Extract text'}
			{/if}
		</Button>
	</div>
{/if}
