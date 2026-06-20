<script lang="ts">
	import { removeBackground } from './api';
	import { models, defaultModel, type BgModel } from './models';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import Eraser from '@lucide/svelte/icons/eraser';
	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type RunState = 'idle' | 'working' | 'done' | 'error';

	// The server only accepts these (see the server's removeBgBody schema).
	const ACCEPT = 'image/jpeg,image/png,image/webp';
	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let model = $state<BgModel>(defaultModel);
	let result = $state<Blob | null>(null);
	let resultUrl = $state('');
	let resultName = $state('');
	let runState = $state<RunState>('idle');
	let errorMessage = $state<string | null>(null);

	// Revoke any object URLs when the component is torn down.
	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		if (resultUrl) URL.revokeObjectURL(resultUrl);
	});

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	/** `photo.jpg` → `photo-no-bg.png` (the result is always a transparent PNG). */
	function resultNameFor(name: string): string {
		const dot = name.lastIndexOf('.');
		const base = dot > 0 ? name.slice(0, dot) : name;
		return `${base}-no-bg.png`;
	}

	function setOriginalUrl(file: File | null) {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		originalUrl = file ? URL.createObjectURL(file) : '';
	}
	function setResultUrl(blob: Blob | null) {
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		resultUrl = blob ? URL.createObjectURL(blob) : '';
	}

	/** Drop the previous result — it belongs to the old upload or model. */
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
		clearResult();
	}

	function selectModel(value: BgModel) {
		if (value === model) return;
		model = value;
		clearResult();
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		model = defaultModel;
		clearResult();
	}

	async function run() {
		if (!original || runState === 'working') return;
		runState = 'working';
		errorMessage = null;
		try {
			const blob = await removeBackground(original, model);
			result = blob;
			resultName = resultNameFor(original.name);
			setResultUrl(blob);
			runState = 'done';
		} catch (error) {
			console.error('Failed to remove background', error);
			runState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}

	function downloadResult() {
		if (result) downloadBlob(result, resultName);
	}

	// A checkerboard so the transparent areas of the result read visually.
	const checker =
		'background-image:linear-gradient(45deg,#3a4248 25%,transparent 25%),linear-gradient(-45deg,#3a4248 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a4248 75%),linear-gradient(-45deg,transparent 75%,#3a4248 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;background-color:#2b3134;';
</script>

{#if !original}
	<Dropzone
		title="Drop an image to remove its background, or click to browse"
		description="JPEG, PNG or WebP. The image is sent to the server, processed with an AI model, and returned as a transparent PNG."
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

		<!-- Studio: preview + controls -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<!-- Preview (result over a checkerboard once cut out) -->
			<div
				class="relative grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6"
				style={result ? checker : ''}
			>
				<span
					class="absolute left-3 top-3 z-10 border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
				>
					{result ? 'Background removed' : 'Original'}
				</span>
				<img
					src={result ? resultUrl : originalUrl}
					alt={result ? 'Background removed' : 'Original'}
					class="max-h-[60vh] w-auto object-contain"
				/>
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-5 border bg-card p-4">
				<div class="space-y-2">
					<span class={sectionLabel}>Model</span>
					<div class="grid gap-2">
						{#each models as option (option.value)}
							<button
								type="button"
								onclick={() => selectModel(option.value)}
								aria-pressed={model === option.value}
								class={cn(
									'flex flex-col gap-1 border bg-background p-3 text-left transition-colors',
									model === option.value
										? 'border-primary bg-primary/10'
										: 'border-border hover:border-primary/50 hover:bg-muted/40'
								)}
							>
								<span class={cn('text-sm font-medium', model === option.value && 'text-primary')}>
									{option.name}
								</span>
								<span class="text-xs text-muted-foreground">{option.blurb}</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="mt-auto space-y-3">
					{#if runState === 'working'}
						<p class="text-xs text-muted-foreground">
							The first run with a model downloads it on the server (~168&nbsp;MB), so it can take a
							while. Later runs are faster.
						</p>
					{/if}
					<Button class="w-full justify-center" onclick={run} disabled={runState === 'working'}>
						{#if runState === 'working'}
							<LoaderCircle class="animate-spin" />
							Removing…
						{:else}
							<Eraser />
							{result ? 'Run again' : 'Remove background'}
						{/if}
					</Button>
					{#if result}
						<Button variant="outline" class="w-full justify-center" onclick={downloadResult}>
							<Download />
							Download PNG
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
