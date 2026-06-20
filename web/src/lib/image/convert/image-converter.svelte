<script lang="ts">
	import { convertImage } from './api';
	import { formats, defaultFormat, type TargetFormat } from './formats';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Dropzone from '$lib/components/dropzone.svelte';

	import FileImage from '@lucide/svelte/icons/file-image';
	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type ConvertState = 'idle' | 'converting' | 'done' | 'error';

	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let target = $state<TargetFormat>(defaultFormat);
	let quality = $state(80);
	let converted = $state<Blob | null>(null);
	let convertedUrl = $state('');
	let convertedName = $state('');
	let convertState = $state<ConvertState>('idle');
	let errorMessage = $state<string | null>(null);

	const currentFormat = $derived(formats.find((f) => f.value === target) ?? formats[0]);
	const ratio = $derived(
		original && converted && original.size > 0 ? converted.size / original.size : 1
	);
	const deltaPercent = $derived(Math.round((1 - ratio) * 100));
	const showResult = $derived(!!converted && currentFormat.previewable);

	// Revoke any object URLs when the component is torn down.
	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		if (convertedUrl) URL.revokeObjectURL(convertedUrl);
	});

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	/** `photo.png` → `photo.webp` (swap the extension for the target format). */
	function convertedNameFor(name: string, ext: string): string {
		const dot = name.lastIndexOf('.');
		const base = dot > 0 ? name.slice(0, dot) : name;
		return `${base}.${ext}`;
	}

	function setOriginalUrl(file: File | null) {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		originalUrl = file ? URL.createObjectURL(file) : '';
	}
	function setConvertedUrl(blob: Blob | null) {
		if (convertedUrl) URL.revokeObjectURL(convertedUrl);
		convertedUrl = blob ? URL.createObjectURL(blob) : '';
	}

	/** Drop the previous result — it belongs to the old upload, format or quality. */
	function clearResult() {
		converted = null;
		setConvertedUrl(null);
		convertedName = '';
		if (convertState !== 'converting') convertState = 'idle';
		errorMessage = null;
	}

	function selectFile(file: File) {
		original = file;
		setOriginalUrl(file);
		clearResult();
	}

	function selectFormat(format: TargetFormat) {
		if (format === target) return;
		target = format;
		clearResult();
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		target = defaultFormat;
		quality = 80;
		clearResult();
	}

	async function run() {
		if (!original || convertState === 'converting') return;
		convertState = 'converting';
		errorMessage = null;
		try {
			const blob = await convertImage(original, target, currentFormat.lossy ? quality : undefined);
			converted = blob;
			convertedName = convertedNameFor(original.name, currentFormat.ext);
			setConvertedUrl(blob);
			convertState = 'done';
		} catch (error) {
			console.error('Failed to convert image', error);
			convertState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}

	function downloadConverted() {
		if (converted) downloadBlob(converted, convertedName);
	}
</script>

{#if !original}
	<Dropzone
		title="Drop an image to convert, or click to browse"
		description="Convert between formats and tune the quality to shrink the file — done on the server."
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

		<!-- Studio: preview + controls -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<!-- Preview (the result once it can be shown, else the source) -->
			<div class="relative grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6">
				<span
					class="absolute left-3 top-3 z-10 border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
				>
					{showResult ? `${currentFormat.name} result` : 'Source'}
				</span>
				{#if converted && !currentFormat.previewable}
					<div class="flex flex-col items-center gap-2 text-center text-muted-foreground">
						<FileImage class="size-8" />
						<p class="max-w-[16rem] text-sm">
							{currentFormat.name} can't preview in the browser — download to view.
						</p>
					</div>
				{:else}
					<img
						src={showResult ? convertedUrl : originalUrl}
						alt={showResult ? 'Converted result' : 'Source image'}
						class="max-h-[60vh] w-auto object-contain"
					/>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-5 border bg-card p-4">
				<div class="space-y-2">
					<span class={sectionLabel}>Convert to</span>
					<div class="grid grid-cols-2 gap-2">
						{#each formats as format (format.value)}
							<button
								type="button"
								onclick={() => selectFormat(format.value)}
								aria-pressed={target === format.value}
								class={cn(
									'border px-2.5 py-1.5 text-[13px] font-medium transition-colors',
									target === format.value
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border hover:border-primary/50 hover:bg-muted/40'
								)}
							>
								{format.name}
							</button>
						{/each}
					</div>
					<p class="text-xs text-muted-foreground">{currentFormat.blurb}</p>
				</div>

				{#if currentFormat.lossy}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="convert-quality" class={sectionLabel}>Quality</label>
							<span class="font-mono text-sm tabular-nums text-primary">{quality}%</span>
						</div>
						<input
							id="convert-quality"
							type="range"
							min="1"
							max="100"
							step="1"
							bind:value={quality}
							oninput={clearResult}
							class="w-full accent-primary"
						/>
						<p class="text-xs text-muted-foreground">Lower quality means a smaller file.</p>
					</div>
				{/if}

				<div class="mt-auto space-y-3">
					{#if converted && original}
						<div class="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
							<span class="text-muted-foreground">
								{formatSize(original.size)} → {formatSize(converted.size)}
							</span>
							{#if deltaPercent > 0}
								<Badge variant="default">{deltaPercent}% smaller</Badge>
							{:else if deltaPercent < 0}
								<Badge variant="secondary">{-deltaPercent}% larger</Badge>
							{/if}
						</div>
					{/if}

					<Button class="w-full justify-center" onclick={run} disabled={convertState === 'converting'}>
						{#if convertState === 'converting'}
							<LoaderCircle class="animate-spin" />
							Converting…
						{:else}
							<FileImage />
							Convert to {currentFormat.name}
						{/if}
					</Button>
					{#if converted}
						<Button variant="outline" class="w-full justify-center" onclick={downloadConverted}>
							<Download />
							Download {currentFormat.name}
						</Button>
					{/if}
				</div>
			</div>
		</div>

		{#if convertState === 'error'}
			<div
				class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{errorMessage}</span>
			</div>
		{/if}
	</div>
{/if}
