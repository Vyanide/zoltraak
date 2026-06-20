<script lang="ts">
	import { cropImage, type CropRect } from './api';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type CropState = 'idle' | 'cropping' | 'error';
	type Mode = 'free' | 'ratio';
	/** Which edges a resize handle controls. */
	type EdgeFlags = { left?: boolean; top?: boolean; right?: boolean; bottom?: boolean };
	/** A crop box in *displayed* (rendered-image) pixels. */
	type Box = { left: number; top: number; right: number; bottom: number };

	const modes: { value: Mode; label: string }[] = [
		{ value: 'free', label: 'Freeform' },
		{ value: 'ratio', label: 'Aspect ratio' }
	];
	const ratios: { label: string; value: number }[] = [
		{ label: '1:1', value: 1 },
		{ label: '4:3', value: 4 / 3 },
		{ label: '3:2', value: 3 / 2 },
		{ label: '16:9', value: 16 / 9 },
		{ label: '3:4', value: 3 / 4 },
		{ label: '2:3', value: 2 / 3 },
		{ label: '9:16', value: 9 / 16 }
	];

	const handles: { key: string; edges: EdgeFlags; corner: boolean; cursor: string }[] = [
		{ key: 'nw', edges: { left: true, top: true }, corner: true, cursor: 'nwse-resize' },
		{ key: 'ne', edges: { right: true, top: true }, corner: true, cursor: 'nesw-resize' },
		{ key: 'sw', edges: { left: true, bottom: true }, corner: true, cursor: 'nesw-resize' },
		{ key: 'se', edges: { right: true, bottom: true }, corner: true, cursor: 'nwse-resize' },
		{ key: 'n', edges: { top: true }, corner: false, cursor: 'ns-resize' },
		{ key: 's', edges: { bottom: true }, corner: false, cursor: 'ns-resize' },
		{ key: 'w', edges: { left: true }, corner: false, cursor: 'ew-resize' },
		{ key: 'e', edges: { right: true }, corner: false, cursor: 'ew-resize' }
	];

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

	/** Minimum crop size, in displayed pixels. */
	const MIN_BOX_PX = 16;

	let original = $state<File | null>(null);
	let originalUrl = $state('');
	let imageElement = $state<HTMLImageElement | null>(null);
	let wrapperElement = $state<HTMLDivElement | null>(null);

	let naturalSize = $state({ width: 0, height: 0 });
	let renderedSize = $state({ width: 0, height: 0 });

	let mode = $state<Mode>('free');
	let aspectRatio = $state(1);
	let box = $state<Box>({ left: 0, top: 0, right: 0, bottom: 0 });

	let cropState = $state<CropState>('idle');
	let errorMessage = $state<string | null>(null);

	const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

	// Displayed → source-pixel scale. The image is rendered with object-contain,
	// so the scale is uniform and either axis preserves the aspect ratio.
	const scaleX = $derived(renderedSize.width > 0 ? naturalSize.width / renderedSize.width : 1);
	const scaleY = $derived(renderedSize.height > 0 ? naturalSize.height / renderedSize.height : 1);

	/** The crop rectangle in source-image pixels — what gets sent and shown. */
	const output = $derived.by<CropRect>(() => {
		if (!naturalSize.width || !renderedSize.width) return { left: 0, top: 0, width: 0, height: 0 };
		const left = clamp(Math.round(box.left * scaleX), 0, Math.max(0, naturalSize.width - 1));
		const top = clamp(Math.round(box.top * scaleY), 0, Math.max(0, naturalSize.height - 1));
		const width = clamp(Math.round((box.right - box.left) * scaleX), 1, naturalSize.width - left);
		const height = clamp(Math.round((box.bottom - box.top) * scaleY), 1, naturalSize.height - top);
		return { left, top, width, height };
	});

	const visibleHandles = $derived(
		mode === 'ratio' ? handles.filter((handle) => handle.corner) : handles
	);

	function fitRatioBox(targetRatio: number): Box {
		let width = renderedSize.width;
		let height = width / targetRatio;
		if (height > renderedSize.height) {
			height = renderedSize.height;
			width = height * targetRatio;
		}
		width *= 0.9;
		height *= 0.9;
		const left = (renderedSize.width - width) / 2;
		const top = (renderedSize.height - height) / 2;
		return { left, top, right: left + width, bottom: top + height };
	}

	function initBox() {
		if (renderedSize.width === 0) return;
		if (mode === 'ratio') {
			box = fitRatioBox(aspectRatio);
		} else {
			const width = renderedSize.width * 0.8;
			const height = renderedSize.height * 0.8;
			const left = (renderedSize.width - width) / 2;
			const top = (renderedSize.height - height) / 2;
			box = { left, top, right: left + width, bottom: top + height };
		}
	}

	function onImageLoad() {
		if (!imageElement) return;
		naturalSize = { width: imageElement.naturalWidth, height: imageElement.naturalHeight };
		renderedSize = { width: imageElement.clientWidth, height: imageElement.clientHeight };
		initBox();
	}

	// Keep the box pinned to the image when the rendered size changes (e.g. the
	// window is resized) by scaling it proportionally.
	$effect(() => {
		const image = imageElement;
		if (!image) return;
		const observer = new ResizeObserver(() => {
			const newWidth = image.clientWidth;
			const newHeight = image.clientHeight;
			if (newWidth === 0 || newHeight === 0) return;
			if (
				renderedSize.width > 0 &&
				renderedSize.height > 0 &&
				(newWidth !== renderedSize.width || newHeight !== renderedSize.height)
			) {
				const rescaleX = newWidth / renderedSize.width;
				const rescaleY = newHeight / renderedSize.height;
				box = {
					left: box.left * rescaleX,
					top: box.top * rescaleY,
					right: box.right * rescaleX,
					bottom: box.bottom * rescaleY
				};
			}
			renderedSize = { width: newWidth, height: newHeight };
		});
		observer.observe(image);
		return () => observer.disconnect();
	});

	function setMode(nextMode: Mode) {
		mode = nextMode;
		if (nextMode === 'ratio') box = fitRatioBox(aspectRatio);
	}
	function setRatio(nextRatio: number) {
		aspectRatio = nextRatio;
		if (mode === 'ratio') box = fitRatioBox(nextRatio);
	}

	function startDrag(event: PointerEvent) {
		if (cropState === 'cropping') return;
		event.preventDefault();
		(event.currentTarget as Element).setPointerCapture?.(event.pointerId);
		const startPointerX = event.clientX;
		const startPointerY = event.clientY;
		const startBox = { ...box };
		const boxW = startBox.right - startBox.left;
		const boxH = startBox.bottom - startBox.top;
		const onPointerMove = (moveEvent: PointerEvent) => {
			const nextLeft = clamp(startBox.left + (moveEvent.clientX - startPointerX), 0, renderedSize.width - boxW);
			const nextTop = clamp(startBox.top + (moveEvent.clientY - startPointerY), 0, renderedSize.height - boxH);
			box = { left: nextLeft, top: nextTop, right: nextLeft + boxW, bottom: nextTop + boxH };
		};
		const onPointerUp = () => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		};
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
	}

	function startResize(event: PointerEvent, edges: EdgeFlags) {
		if (cropState === 'cropping') return;
		event.preventDefault();
		event.stopPropagation();
		(event.currentTarget as Element).setPointerCapture?.(event.pointerId);
		const onPointerMove = (moveEvent: PointerEvent) => {
			if (!wrapperElement) return;
			const bounds = wrapperElement.getBoundingClientRect();
			const pointerX = clamp(moveEvent.clientX - bounds.left, 0, renderedSize.width);
			const pointerY = clamp(moveEvent.clientY - bounds.top, 0, renderedSize.height);

			if (mode === 'free') {
				let { left, top, right, bottom } = box;
				if (edges.left) left = clamp(pointerX, 0, right - MIN_BOX_PX);
				if (edges.right) right = clamp(pointerX, left + MIN_BOX_PX, renderedSize.width);
				if (edges.top) top = clamp(pointerY, 0, bottom - MIN_BOX_PX);
				if (edges.bottom) bottom = clamp(pointerY, top + MIN_BOX_PX, renderedSize.height);
				box = { left, top, right, bottom };
				return;
			}

			// Ratio mode: corner handles only, anchored to the opposite corner.
			const anchorX = edges.left ? box.right : box.left;
			const anchorY = edges.top ? box.bottom : box.top;
			const signX = edges.left ? -1 : 1;
			const signY = edges.top ? -1 : 1;
			const maxWidth = signX > 0 ? renderedSize.width - anchorX : anchorX;
			const maxHeight = signY > 0 ? renderedSize.height - anchorY : anchorY;

			let width = Math.max(Math.abs(pointerX - anchorX), Math.abs(pointerY - anchorY) * aspectRatio);
			width = clamp(width, MIN_BOX_PX, maxWidth);
			let height = width / aspectRatio;
			if (height > maxHeight) {
				height = maxHeight;
				width = height * aspectRatio;
			}
			if (height < MIN_BOX_PX) {
				height = MIN_BOX_PX;
				width = height * aspectRatio;
				if (width > maxWidth) {
					width = maxWidth;
					height = width / aspectRatio;
				}
			}
			const cornerX = anchorX + signX * width;
			const cornerY = anchorY + signY * height;
			box = {
				left: Math.min(anchorX, cornerX),
				right: Math.max(anchorX, cornerX),
				top: Math.min(anchorY, cornerY),
				bottom: Math.max(anchorY, cornerY)
			};
		};
		const onPointerUp = () => {
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		};
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
	}

	/** Apply an edited numeric field (source pixels) back onto the crop box. */
	function setOutput(changes: Partial<CropRect>) {
		if (!naturalSize.width || !renderedSize.width) return;
		let { left, top, width, height } = { ...output, ...changes };
		width = clamp(Math.round(width), 1, naturalSize.width);
		height = clamp(Math.round(height), 1, naturalSize.height);

		if (mode === 'ratio') {
			// Keep the locked ratio: changing width (or x) drives height, and vice versa.
			if (changes.width != null || changes.left != null) {
				height = clamp(Math.round(width / aspectRatio), 1, naturalSize.height);
				width = Math.round(height * aspectRatio);
			} else if (changes.height != null || changes.top != null) {
				width = clamp(Math.round(height * aspectRatio), 1, naturalSize.width);
				height = Math.round(width / aspectRatio);
			}
		}

		left = clamp(Math.round(left), 0, Math.max(0, naturalSize.width - width));
		top = clamp(Math.round(top), 0, Math.max(0, naturalSize.height - height));

		box = {
			left: left / scaleX,
			top: top / scaleY,
			right: (left + width) / scaleX,
			bottom: (top + height) / scaleY
		};
	}

	function onNumberInput(field: keyof CropRect, event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		if (!Number.isFinite(value)) return;
		setOutput({ [field]: value });
	}

	$effect(() => () => {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
	});

	function croppedName(name: string, mime: string): string {
		const dotIndex = name.lastIndexOf('.');
		const base = (dotIndex > 0 ? name.slice(0, dotIndex) : name) || 'image';
		return `${base}-cropped.${MIME_EXT[mime] ?? 'png'}`;
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	}

	function setOriginalUrl(file: File | null) {
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		originalUrl = file ? URL.createObjectURL(file) : '';
	}

	function selectFile(file: File) {
		setOriginalUrl(file);
		original = file;
		naturalSize = { width: 0, height: 0 };
		renderedSize = { width: 0, height: 0 };
		cropState = 'idle';
		errorMessage = null;
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		naturalSize = { width: 0, height: 0 };
		renderedSize = { width: 0, height: 0 };
		cropState = 'idle';
		errorMessage = null;
	}

	async function download() {
		if (!original || cropState === 'cropping' || !overlayReady) return;
		cropState = 'cropping';
		errorMessage = null;
		try {
			const blob = await cropImage(original, output);
			downloadBlob(blob, croppedName(original.name, blob.type));
			cropState = 'idle';
		} catch (error) {
			console.error('Failed to crop image', error);
			cropState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}

	const overlayReady = $derived(renderedSize.width > 0 && naturalSize.width > 0);
	const boxWidth = $derived(Math.max(0, box.right - box.left));
	const boxHeight = $derived(Math.max(0, box.bottom - box.top));

	function handleStyle(edges: EdgeFlags, cursor: string): string {
		const leftPercent = edges.left ? '0%' : edges.right ? '100%' : '50%';
		const topPercent = edges.top ? '0%' : edges.bottom ? '100%' : '50%';
		return `left:${leftPercent};top:${topPercent};transform:translate(-50%,-50%);cursor:${cursor};touch-action:none;`;
	}
</script>

{#if !original}
	<Dropzone
		title="Drop an image to crop, or click to browse"
		description="Select a region and see it live; the export is rendered on the server with sharp."
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
				<p class="text-sm text-muted-foreground tabular-nums">
					{formatSize(original.size)}{naturalSize.width
						? ` · ${naturalSize.width} × ${naturalSize.height}px`
						: ''}
				</p>
			</div>
			<Button variant="outline" size="sm" onclick={reset}>Choose different image</Button>
		</div>

		<!-- Studio: live crop preview + controls -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<!-- Live preview (image + crop overlay) -->
			<div
				class="flex min-h-[24rem] min-w-0 items-center justify-center overflow-hidden border bg-muted/30 p-4"
			>
				<div
					bind:this={wrapperElement}
					class="relative inline-block max-w-full select-none leading-[0]"
					style="touch-action:none;"
				>
					<img
						bind:this={imageElement}
						src={originalUrl}
						alt="Crop source"
						onload={onImageLoad}
						draggable="false"
						class="block max-h-[60vh] w-auto max-w-full"
					/>

					{#if overlayReady}
						<!-- Dim everything outside the crop box. -->
						<div class="pointer-events-none absolute inset-x-0 top-0 bg-black/55" style="height:{box.top}px;"></div>
						<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-black/55" style="top:{box.bottom}px;"></div>
						<div class="pointer-events-none absolute left-0 bg-black/55" style="top:{box.top}px;width:{box.left}px;height:{boxHeight}px;"></div>
						<div class="pointer-events-none absolute right-0 bg-black/55" style="left:{box.right}px;top:{box.top}px;height:{boxHeight}px;"></div>

						<!-- The crop box (drag to move) -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="absolute cursor-move"
							style="left:{box.left}px;top:{box.top}px;width:{boxWidth}px;height:{boxHeight}px;touch-action:none;"
							onpointerdown={startDrag}
						>
							<div class="pointer-events-none absolute inset-0 border-2 border-primary"></div>
							<!-- rule-of-thirds guides -->
							<div class="pointer-events-none absolute inset-0">
								<div class="absolute inset-y-0 left-1/3 w-px bg-white/25"></div>
								<div class="absolute inset-y-0 left-2/3 w-px bg-white/25"></div>
								<div class="absolute inset-x-0 top-1/3 h-px bg-white/25"></div>
								<div class="absolute inset-x-0 top-2/3 h-px bg-white/25"></div>
							</div>
							<span
								class="pointer-events-none absolute left-1 top-1 bg-primary px-1 py-0.5 font-mono text-[10px] leading-none text-primary-foreground tabular-nums"
							>
								{output.width} × {output.height}
							</span>
							{#each visibleHandles as handle (handle.key)}
								<button
									type="button"
									aria-label="Resize crop"
									class="absolute size-3 border border-background bg-primary"
									style={handleStyle(handle.edges, handle.cursor)}
									onpointerdown={(event) => startResize(event, handle.edges)}
								></button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Controls -->
			<div class="flex flex-col gap-5 border bg-card p-4">
				<div class="space-y-2">
					<span class={sectionLabel}>Crop mode</span>
					<div class="grid grid-cols-2 gap-2">
						{#each modes as option (option.value)}
							<button
								type="button"
								onclick={() => setMode(option.value)}
								aria-pressed={mode === option.value}
								class={cn(
									'border px-2.5 py-2 text-[13px] font-medium transition-colors',
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

				{#if mode === 'ratio'}
					<div class="space-y-2">
						<span class={sectionLabel}>Aspect ratio</span>
						<div class="grid grid-cols-3 gap-2">
							{#each ratios as option (option.label)}
								<button
									type="button"
									onclick={() => setRatio(option.value)}
									aria-pressed={aspectRatio === option.value}
									class={cn(
										'border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors',
										aspectRatio === option.value
											? 'border-primary bg-primary/10 text-primary'
											: 'border-border hover:border-primary/50 hover:bg-muted/40'
									)}
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="space-y-2">
					<span class={sectionLabel}>Size &amp; position · px</span>
					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col items-center gap-1">
							<label for="crop-x" class="text-[10px] leading-none text-muted-foreground">X</label>
							<input id="crop-x" type="number" min="0" value={output.left} onchange={(event) => onNumberInput('left', event)} class={inputBase} />
						</div>
						<div class="flex flex-col items-center gap-1">
							<label for="crop-y" class="text-[10px] leading-none text-muted-foreground">Y</label>
							<input id="crop-y" type="number" min="0" value={output.top} onchange={(event) => onNumberInput('top', event)} class={inputBase} />
						</div>
						<div class="flex flex-col items-center gap-1">
							<label for="crop-w" class="text-[10px] leading-none text-muted-foreground">Width</label>
							<input id="crop-w" type="number" min="1" value={output.width} onchange={(event) => onNumberInput('width', event)} class={inputBase} />
						</div>
						<div class="flex flex-col items-center gap-1">
							<label for="crop-h" class="text-[10px] leading-none text-muted-foreground">Height</label>
							<input id="crop-h" type="number" min="1" value={output.height} onchange={(event) => onNumberInput('height', event)} class={inputBase} />
						</div>
					</div>
				</div>

				<div class="mt-auto space-y-3">
					<div class="flex items-center justify-between gap-2 text-xs tabular-nums">
						<span class="text-muted-foreground">Output</span>
						<span class="font-mono text-foreground">
							{overlayReady ? `${output.width} × ${output.height}px` : '—'}
						</span>
					</div>
					<Button
						class="w-full justify-center"
						onclick={download}
						disabled={cropState === 'cropping' || !overlayReady}
					>
						{#if cropState === 'cropping'}
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

		{#if cropState === 'error'}
			<div
				class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
				<span>{errorMessage}</span>
			</div>
		{/if}
	</div>
{/if}
