<script lang="ts">
	import { padImage, type Padding } from './api';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Pipette from '@lucide/svelte/icons/pipette';

	type PadState = 'idle' | 'padding' | 'error';
	type Mode = 'all' | 'tb' | 'lr' | 'top' | 'right' | 'bottom' | 'left' | 'custom';

	const presets: { value: Mode; label: string }[] = [
		{ value: 'all', label: 'All sides' },
		{ value: 'tb', label: 'Top & bottom' },
		{ value: 'lr', label: 'Left & right' },
		{ value: 'top', label: 'Top only' },
		{ value: 'right', label: 'Right only' },
		{ value: 'bottom', label: 'Bottom only' },
		{ value: 'left', label: 'Left only' },
		{ value: 'custom', label: 'Custom' }
	];

	const swatches: { value: string; label: string }[] = [
		{ value: '#ffffff', label: 'White' },
		{ value: '#000000', label: 'Black' },
		{ value: '#232a2e', label: 'Ink' },
		{ value: '#e6e2cc', label: 'Sand' },
		{ value: '#a7c080', label: 'Green' }
	];

	const MIME_EXT: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/tiff': 'tiff',
		'image/avif': 'avif'
	};

	const inputBase =
		'h-9 w-16 border border-input bg-transparent px-2 py-1 text-center font-mono text-sm tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

	// Checkerboard for transparent padding (frame + swatch).
	const CHECKER =
		'background-color:#2b3134;background-image:linear-gradient(45deg,#3a4248 25%,transparent 25%),linear-gradient(-45deg,#3a4248 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a4248 75%),linear-gradient(-45deg,transparent 75%,#3a4248 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;';
	const CHECKER_SW =
		'background-color:#2b3134;background-image:linear-gradient(45deg,#3a4248 25%,transparent 25%),linear-gradient(-45deg,#3a4248 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a4248 75%),linear-gradient(-45deg,transparent 75%,#3a4248 75%);background-size:10px 10px;background-position:0 0,0 5px,5px -5px,-5px 0;';

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let natW = $state(0);
	let natH = $state(0);

	let mode = $state<Mode>('all');
	let amount = $state(40);
	let custom = $state({ top: 40, right: 40, bottom: 40, left: 40 });
	let color = $state('#ffffff'); // a #rrggbb hex, or the literal 'transparent'

	let padState = $state<PadState>('idle');
	let errorMessage = $state<string | null>(null);

	// Live preview canvas size, measured so the padded result is scaled to fit.
	let canvasW = $state(0);
	let canvasH = $state(0);

	const clampPx = (n: number) => Math.max(0, Math.floor(Number(n)) || 0);

	const padding = $derived.by<Padding>(() => {
		if (mode === 'custom') {
			return {
				top: clampPx(custom.top),
				right: clampPx(custom.right),
				bottom: clampPx(custom.bottom),
				left: clampPx(custom.left)
			};
		}
		const a = clampPx(amount);
		if (mode === 'all') return { top: a, right: a, bottom: a, left: a };
		if (mode === 'tb') return { top: a, right: 0, bottom: a, left: 0 };
		if (mode === 'lr') return { top: 0, right: a, bottom: 0, left: a };
		return { top: 0, right: 0, bottom: 0, left: 0, [mode]: a }; // a single side
	});

	const transparent = $derived(color === 'transparent');
	const isCustomColor = $derived(
		color !== 'transparent' && !swatches.some((s) => s.value.toLowerCase() === color.toLowerCase())
	);

	const outW = $derived(natW + padding.left + padding.right);
	const outH = $derived(natH + padding.top + padding.bottom);

	// Scale the whole padded result to fit the canvas (never upscaled past 1:1).
	const scale = $derived.by(() => {
		if (!natW || !natH || !canvasW || !canvasH || !outW || !outH) return 0;
		const margin = 28;
		return Math.min((canvasW - margin) / outW, (canvasH - margin) / outH, 1);
	});

	const frameStyle = $derived.by(() => {
		const s = scale;
		const dims = `width:${outW * s}px;height:${outH * s}px;padding:${padding.top * s}px ${padding.right * s}px ${padding.bottom * s}px ${padding.left * s}px;`;
		return dims + (transparent ? CHECKER : `background-color:${color};`);
	});

	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
	});

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	function paddedName(name: string, mime: string): string {
		const dot = name.lastIndexOf('.');
		const base = (dot > 0 ? name.slice(0, dot) : name) || 'image';
		return `${base}-padded.${MIME_EXT[mime] ?? 'png'}`;
	}

	function onImgLoad(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		natW = img.naturalWidth;
		natH = img.naturalHeight;
	}

	function selectFile(file: File) {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		original = file;
		originalUrl = URL.createObjectURL(file);
		natW = 0;
		natH = 0;
		padState = 'idle';
		errorMessage = null;
	}

	function reset() {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		original = null;
		originalUrl = '';
		natW = 0;
		natH = 0;
		padState = 'idle';
		errorMessage = null;
	}

	async function download() {
		if (!original || padState === 'padding') return;
		padState = 'padding';
		errorMessage = null;
		try {
			const blob = await padImage(original, padding, color);
			downloadBlob(blob, paddedName(original.name, blob.type));
			padState = 'idle';
		} catch (error) {
			console.error('Failed to pad image', error);
			padState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

{#if !original}
	<Dropzone
		title="Drop an image to pad, or click to browse"
		description="Adjust the padding and see it live; the export is rendered on the server with sharp."
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
					{formatSize(original.size)}{natW ? ` · ${natW} × ${natH}px` : ''}
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={reset}>Choose different image</Button>
		</div>

		<!-- Studio: live preview + controls -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<!-- Live preview -->
			<div
				bind:clientWidth={canvasW}
				bind:clientHeight={canvasH}
				class="grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6"
			>
				{#if scale > 0}
					<div
						class="box-border shadow-xl transition-all duration-150 ease-out"
						style={frameStyle}
					>
						<img src={originalUrl} alt="Padded preview" class="block size-full" />
					</div>
				{:else}
					<img src={originalUrl} alt="" class="max-h-72 w-auto object-contain opacity-70" />
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-5 border bg-card p-4">
				<div class="space-y-2">
					<span class="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Sides to pad
					</span>
					<div class="grid grid-cols-2 gap-2">
						{#each presets as option (option.value)}
							<button
								type="button"
								onclick={() => (mode = option.value)}
								aria-pressed={mode === option.value}
								class={cn(
									'border px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
									mode === option.value
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border hover:border-primary/50 hover:bg-muted/40'
								)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>

				{#if mode === 'custom'}
					<div class="space-y-2">
						<span class="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
							Amount per side · px
						</span>
						<div class="grid grid-cols-3 items-start justify-items-center gap-2">
							<div class="col-start-2 row-start-1 flex flex-col items-center gap-1">
								<label for="pad-top" class="text-[10px] leading-none text-muted-foreground">Top</label>
								<input id="pad-top" type="number" min="0" bind:value={custom.top} class={inputBase} />
							</div>
							<div class="col-start-1 row-start-2 flex flex-col items-center gap-1">
								<label for="pad-left" class="text-[10px] leading-none text-muted-foreground">Left</label>
								<input id="pad-left" type="number" min="0" bind:value={custom.left} class={inputBase} />
							</div>
							<!-- Center cell: a blank label spacer keeps the box aligned with the side inputs. -->
							<div class="col-start-2 row-start-2 flex flex-col items-center gap-1">
								<span class="text-[10px] leading-none" aria-hidden="true">&nbsp;</span>
								<div
									class="grid h-9 w-16 place-items-center border border-dashed border-border text-[10px] text-muted-foreground"
								>
									img
								</div>
							</div>
							<div class="col-start-3 row-start-2 flex flex-col items-center gap-1">
								<label for="pad-right" class="text-[10px] leading-none text-muted-foreground">Right</label>
								<input id="pad-right" type="number" min="0" bind:value={custom.right} class={inputBase} />
							</div>
							<div class="col-start-2 row-start-3 flex flex-col items-center gap-1">
								<label for="pad-bottom" class="text-[10px] leading-none text-muted-foreground">
									Bottom
								</label>
								<input
									id="pad-bottom"
									type="number"
									min="0"
									bind:value={custom.bottom}
									class={inputBase}
								/>
							</div>
						</div>
					</div>
				{:else}
					<div class="space-y-2">
						<label
							for="pad-amount"
							class="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
						>
							Amount · px
						</label>
						<input id="pad-amount" type="number" min="0" bind:value={amount} class={inputBase} />
					</div>
				{/if}

				<div class="space-y-2">
					<span class="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Background
					</span>
					<div class="flex flex-wrap gap-2">
						{#each swatches as sw (sw.value)}
							<button
								type="button"
								onclick={() => (color = sw.value)}
								title={sw.label}
								aria-label={sw.label}
								aria-pressed={color.toLowerCase() === sw.value.toLowerCase()}
								class={cn(
									'size-8 border border-input transition-transform hover:scale-105',
									color.toLowerCase() === sw.value.toLowerCase() &&
										'ring-2 ring-primary ring-offset-2 ring-offset-background'
								)}
								style="background:{sw.value}"
							></button>
						{/each}
						<button
							type="button"
							onclick={() => (color = 'transparent')}
							title="Transparent"
							aria-label="Transparent"
							aria-pressed={transparent}
							class={cn(
								'size-8 border border-input transition-transform hover:scale-105',
								transparent && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
							)}
							style={CHECKER_SW}
						></button>
						<label
							title="Custom colour"
							class={cn(
								'relative grid size-8 cursor-pointer place-items-center border border-input bg-card text-muted-foreground transition-transform hover:scale-105',
								isCustomColor && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
							)}
						>
							<Pipette class="size-4" />
							<input
								type="color"
								value={transparent ? '#ffffff' : color}
								oninput={(e) => (color = e.currentTarget.value)}
								class="absolute inset-0 cursor-pointer opacity-0"
							/>
						</label>
					</div>
				</div>

				<div class="mt-auto space-y-3">
					<div class="flex items-center justify-between gap-2 text-xs tabular-nums">
						<span class="text-muted-foreground">Output</span>
						<span class="font-mono text-foreground">
							{natW ? `${outW} × ${outH}px` : '—'}
						</span>
					</div>
					<Button class="w-full justify-center" onclick={download} disabled={padState === 'padding'}>
						{#if padState === 'padding'}
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

		{#if padState === 'error'}
			<div
				class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{errorMessage}</span>
			</div>
		{/if}
	</div>
{/if}
