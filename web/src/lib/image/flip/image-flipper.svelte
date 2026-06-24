<script lang="ts">
	import { flipImage } from './api';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import FlipHorizontal from '@lucide/svelte/icons/flip-horizontal-2';
	import FlipVertical from '@lucide/svelte/icons/flip-vertical-2';
	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type RunState = 'idle' | 'working' | 'done' | 'error';

	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';

	const MIME_EXT: Record<string, string> = {
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/tiff': 'tiff',
		'image/avif': 'avif'
	};

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let flipH = $state(false);
	let flipV = $state(false);
	let result = $state<Blob | null>(null);
	let resultUrl = $state('');
	let resultName = $state('');
	let runState = $state<RunState>('idle');
	let errorMessage = $state<string | null>(null);

	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		if (resultUrl) URL.revokeObjectURL(resultUrl);
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
	function setResultUrl(blob: Blob | null) {
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		resultUrl = blob ? URL.createObjectURL(blob) : '';
	}

	/** Drop the previous result — it belongs to an earlier flip selection. */
	function clearResult() {
		result = null;
		setResultUrl(null);
		resultName = '';
		if (runState !== 'working') runState = 'idle';
		errorMessage = null;
	}

	function selectFile(file: File) {
		original = file;
		setOriginalUrl(file);
		flipH = false;
		flipV = false;
		clearResult();
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		flipH = false;
		flipV = false;
		clearResult();
	}

	function toggleFlipH() {
		flipH = !flipH;
		clearResult();
	}
	function toggleFlipV() {
		flipV = !flipV;
		clearResult();
	}

	async function run() {
		if (!original || runState === 'working') return;
		runState = 'working';
		errorMessage = null;
		try {
			const blob = await flipImage(original, flipH, flipV);
			result = blob;
			const dot = original.name.lastIndexOf('.');
			const base = dot > 0 ? original.name.slice(0, dot) : original.name;
			resultName = `${base}-flipped.${MIME_EXT[blob.type] ?? 'png'}`;
			setResultUrl(blob);
			runState = 'done';
		} catch (error) {
			console.error('Failed to flip image', error);
			runState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}

	function downloadResult() {
		if (result) downloadBlob(result, resultName);
	}
</script>

{#if !original}
	<Dropzone
		title="Drop an image to flip it, or click to browse"
		description="Any image format. Pick the mirror direction, then flip — it runs on the server and comes back as a download."
		buttonLabel="Choose image"
		accept="image/*"
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

		<!-- Studio: source until flipped, then the rendered result to review before download -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<div
				class="relative grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6"
			>
				<span
					class="absolute left-3 top-3 z-10 border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
				>
					{result ? 'Result' : 'Original'}
				</span>
				<img
					src={result ? resultUrl : originalUrl}
					alt={result ? 'Result' : 'Original'}
					class="max-h-[55vh] max-w-full object-contain"
				/>
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-5 border bg-card p-4">
				<div class="space-y-2">
					<span class={sectionLabel}>Flip</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							aria-pressed={flipH}
							onclick={toggleFlipH}
							class={cn(
								'inline-flex items-center justify-center gap-2 border px-3 py-1.5 text-[13px] transition-colors',
								flipH
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/40'
							)}
						>
							<FlipHorizontal class="size-4" />
							Horizontal
						</button>
						<button
							type="button"
							aria-pressed={flipV}
							onclick={toggleFlipV}
							class={cn(
								'inline-flex items-center justify-center gap-2 border px-3 py-1.5 text-[13px] transition-colors',
								flipV
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/40'
							)}
						>
							<FlipVertical class="size-4" />
							Vertical
						</button>
					</div>
					<p class="text-xs text-muted-foreground">
						Mirror left↔right, top↔bottom, or both.
					</p>
				</div>

				<div class="mt-auto space-y-3">
					<Button
						class="w-full justify-center"
						onclick={run}
						disabled={runState === 'working' || (!flipH && !flipV)}
					>
						{#if runState === 'working'}
							<LoaderCircle class="animate-spin" />
							Flipping…
						{:else}
							<FlipHorizontal />
							{result ? 'Flip again' : 'Flip'}
						{/if}
					</Button>
					{#if result}
						<Button variant="outline" class="w-full justify-center" onclick={downloadResult}>
							<Download />
							Download
						</Button>
					{/if}
				</div>
			</div>
		</div>

		{#if runState === 'error'}
			<div
				class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{errorMessage}</span>
			</div>
		{/if}
	</div>
{/if}
