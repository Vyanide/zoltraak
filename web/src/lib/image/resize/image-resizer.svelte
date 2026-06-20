<script lang="ts">
	import { resizeImage } from './api';
	import { downloadBlob } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type ResizeState = 'idle' | 'resizing' | 'error';

	const MIME_EXT: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/tiff': 'tiff',
		'image/avif': 'avif'
	};

	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';
	const inputBase =
		'h-9 w-full border border-input bg-transparent px-2 py-1 text-center font-mono text-sm tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let originalW = $state(0);
	let originalH = $state(0);

	let width = $state(0);
	let height = $state(0);
	let keepAspect = $state(true);

	let resizeState = $state<ResizeState>('idle');
	let errorMessage = $state<string | null>(null);

	// Live preview canvas size, measured so the result is scaled to fit.
	let canvasW = $state(0);
	let canvasH = $state(0);

	const aspect = $derived(originalH > 0 ? originalW / originalH : 1);
	const ready = $derived(width >= 1 && height >= 1);

	const clampPx = (n: number) => Math.max(0, Math.floor(Number(n) || 0));

	// Scale the target dimensions to fit the preview canvas. The image fills the
	// frame, so an unlocked (non-proportional) size shows the stretch live.
	const scale = $derived.by(() => {
		if (width < 1 || height < 1 || !canvasW || !canvasH) return 0;
		const margin = 28;
		return Math.min((canvasW - margin) / width, (canvasH - margin) / height);
	});
	const frameStyle = $derived(`width:${width * scale}px;height:${height * scale}px;`);

	function onWidth(e: Event) {
		width = clampPx((e.currentTarget as HTMLInputElement).value as unknown as number);
		if (keepAspect && width >= 1) height = Math.max(1, Math.round(width / aspect));
	}
	function onHeight(e: Event) {
		height = clampPx((e.currentTarget as HTMLInputElement).value as unknown as number);
		if (keepAspect && height >= 1) width = Math.max(1, Math.round(height * aspect));
	}
	function toggleAspect() {
		keepAspect = !keepAspect;
		// Re-snap height to the locked ratio from the current width.
		if (keepAspect && width >= 1) height = Math.max(1, Math.round(width / aspect));
	}

	function onImgLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		originalW = img.naturalWidth;
		originalH = img.naturalHeight;
		// Seed the inputs with the original size on first load.
		if (width === 0) width = originalW;
		if (height === 0) height = originalH;
	}

	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
	});

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	function resizedName(name: string, mime: string): string {
		const dot = name.lastIndexOf('.');
		const base = (dot > 0 ? name.slice(0, dot) : name) || 'image';
		return `${base}-resized.${MIME_EXT[mime] ?? 'png'}`;
	}

	function setOriginalUrl(file: File | null) {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		originalUrl = file ? URL.createObjectURL(file) : '';
	}

	function selectFile(file: File) {
		original = file;
		setOriginalUrl(file);
		originalW = 0;
		originalH = 0;
		width = 0;
		height = 0;
		resizeState = 'idle';
		errorMessage = null;
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		originalW = 0;
		originalH = 0;
		width = 0;
		height = 0;
		resizeState = 'idle';
		errorMessage = null;
	}

	async function download() {
		if (!original || !ready || resizeState === 'resizing') return;
		resizeState = 'resizing';
		errorMessage = null;
		try {
			const blob = await resizeImage(original, { width, height, fit: keepAspect ? 'inside' : 'fill' });
			downloadBlob(blob, resizedName(original.name, blob.type));
			resizeState = 'idle';
		} catch (error) {
			console.error('Failed to resize image', error);
			resizeState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

{#if !original}
	<Dropzone
		title="Drop an image to resize, or click to browse"
		description="Set the size and see it live; the export is rendered on the server with sharp."
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
				<img src={originalUrl} alt="" onload={onImgLoad} class="size-full object-cover" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate font-medium">{original.name}</p>
				<p class="text-sm text-muted-foreground tabular-nums">
					{formatSize(original.size)}{originalW ? ` · ${originalW} × ${originalH}px` : ''}
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={reset}>Choose different image</Button>
		</div>

		<!-- Studio: live preview + controls -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<!-- Live preview (image at the target size) -->
			<div
				bind:clientWidth={canvasW}
				bind:clientHeight={canvasH}
				class="grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6"
			>
				{#if scale > 0}
					<div class="shadow-xl transition-all duration-150 ease-out" style={frameStyle}>
						<img src={originalUrl} alt="Resized preview" class="block size-full object-fill" />
					</div>
				{:else}
					<img src={originalUrl} alt="" class="max-h-72 w-auto object-contain opacity-70" />
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-5 border bg-card p-4">
				<div class="space-y-2">
					<span class={sectionLabel}>New size · px</span>
					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col items-center gap-1">
							<label for="resize-w" class="text-[10px] leading-none text-muted-foreground">Width</label>
							<input id="resize-w" type="number" min="1" value={width} oninput={onWidth} class={inputBase} />
						</div>
						<div class="flex flex-col items-center gap-1">
							<label for="resize-h" class="text-[10px] leading-none text-muted-foreground">Height</label>
							<input id="resize-h" type="number" min="1" value={height} oninput={onHeight} class={inputBase} />
						</div>
					</div>
				</div>

				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={keepAspect}
						onchange={toggleAspect}
						class="size-4 accent-primary"
					/>
					Keep aspect ratio
				</label>

				<div class="mt-auto space-y-3">
					<div class="flex items-center justify-between gap-2 text-xs tabular-nums">
						<span class="text-muted-foreground">Output</span>
						<span class="font-mono text-foreground">{ready ? `${width} × ${height}px` : '—'}</span>
					</div>
					<Button
						class="w-full justify-center"
						onclick={download}
						disabled={resizeState === 'resizing' || !ready}
					>
						{#if resizeState === 'resizing'}
							<LoaderCircle class="animate-spin" />
							Exporting…
						{:else}
							<Download />
							Download
						{/if}
					</Button>
				</div>
			</div>
		</div>

		{#if resizeState === 'error'}
			<div
				class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{errorMessage}</span>
			</div>
		{/if}
	</div>
{/if}
