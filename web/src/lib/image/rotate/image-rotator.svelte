<script lang="ts">
	import { rotateImage } from './api';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Dropzone from '$lib/components/dropzone.svelte';

	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';
	import Download from '@lucide/svelte/icons/download';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type RunState = 'idle' | 'working' | 'done' | 'error';

	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';
	const inputBase =
		'h-9 w-full border border-input bg-transparent px-2 py-1 text-center font-mono text-sm tabular-nums outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

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
	let angle = $state(0);
	let background = $state('transparent');
	let hexColor = $state('#ffffff');
	let result = $state<Blob | null>(null);
	let resultUrl = $state('');
	let resultName = $state('');
	let runState = $state<RunState>('idle');
	let errorMessage = $state<string | null>(null);

	// The background fill only shows through on rotations that aren't multiples of 90°.
	const showBackground = $derived(angle % 90 !== 0);
	const transparent = $derived(background === 'transparent');

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

	/** Drop the previous result — it belongs to an earlier angle/background. */
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
		angle = 0;
		clearResult();
	}

	function reset() {
		setOriginalUrl(null);
		original = null;
		angle = 0;
		background = 'transparent';
		clearResult();
	}

	const norm = (deg: number) => ((Math.round(deg) % 360) + 360) % 360;
	function turn(by: number) {
		angle = norm(angle + by);
		clearResult();
	}
	function setAngle(deg: number) {
		angle = norm(deg);
		clearResult();
	}

	function useTransparent() {
		background = 'transparent';
		clearResult();
	}
	function useColor(hex: string) {
		hexColor = hex;
		background = hex;
		clearResult();
	}

	async function run() {
		if (!original || runState === 'working') return;
		runState = 'working';
		errorMessage = null;
		try {
			const blob = await rotateImage(original, angle, background);
			result = blob;
			const dot = original.name.lastIndexOf('.');
			const base = dot > 0 ? original.name.slice(0, dot) : original.name;
			resultName = `${base}-rotated.${MIME_EXT[blob.type] ?? 'png'}`;
			setResultUrl(blob);
			runState = 'done';
		} catch (error) {
			console.error('Failed to rotate image', error);
			runState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}

	function downloadResult() {
		if (result) downloadBlob(result, resultName);
	}

	// Checkerboard so transparent corners of a rotated result read visually.
	const checker =
		'background-image:linear-gradient(45deg,#3a4248 25%,transparent 25%),linear-gradient(-45deg,#3a4248 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a4248 75%),linear-gradient(-45deg,transparent 75%,#3a4248 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;background-color:#2b3134;';
</script>

{#if !original}
	<Dropzone
		title="Drop an image to rotate it, or click to browse"
		description="Any image format. Set the angle, then rotate — it runs on the server and comes back as a download."
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

		<!-- Studio: source until rotated, then the rendered result to review before download -->
		<div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
			<div
				class="relative grid min-h-[24rem] place-items-center overflow-hidden border bg-muted/30 p-6"
				style={result && transparent ? checker : ''}
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
					<span class={sectionLabel}>Rotation</span>
					<div class="grid grid-cols-3 gap-2">
						<Button variant="outline" size="sm" onclick={() => turn(-90)}>
							<RotateCcw />
							90°
						</Button>
						<Button variant="outline" size="sm" onclick={() => turn(180)}>180°</Button>
						<Button variant="outline" size="sm" onclick={() => turn(90)}>
							<RotateCw />
							90°
						</Button>
					</div>
					<div class="flex flex-col items-center gap-1 pt-1">
						<label for="rotate-angle" class="text-[10px] leading-none text-muted-foreground">
							Angle (°)
						</label>
						<input
							id="rotate-angle"
							type="number"
							min="0"
							max="359"
							value={angle}
							onchange={(e) => setAngle(+e.currentTarget.value)}
							class={inputBase}
						/>
					</div>
				</div>

				{#if showBackground}
					<div class="space-y-2">
						<span class={sectionLabel}>Corner fill</span>
						<div class="flex gap-1 border bg-card p-1">
							<button
								type="button"
								aria-pressed={transparent}
								onclick={useTransparent}
								class={cn(
									'flex-1 px-3 py-1.5 text-[13px] transition-colors',
									transparent
										? 'bg-primary font-semibold text-primary-foreground'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								)}
							>
								Transparent
							</button>
							<button
								type="button"
								aria-pressed={!transparent}
								onclick={() => useColor(hexColor)}
								class={cn(
									'flex-1 px-3 py-1.5 text-[13px] transition-colors',
									!transparent
										? 'bg-primary font-semibold text-primary-foreground'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								)}
							>
								Colour
							</button>
						</div>
						{#if !transparent}
							<label class="flex items-center justify-between gap-2">
								<span class="text-sm text-muted-foreground">Fill colour</span>
								<input
									type="color"
									value={hexColor}
									oninput={(e) => useColor(e.currentTarget.value)}
									class="size-8 cursor-pointer border bg-background"
								/>
							</label>
						{/if}
						<p class="text-xs text-muted-foreground">Fills the corners exposed by the rotation.</p>
					</div>
				{/if}

				<div class="mt-auto space-y-3">
					<Button class="w-full justify-center" onclick={run} disabled={runState === 'working'}>
						{#if runState === 'working'}
							<LoaderCircle class="animate-spin" />
							Rotating…
						{:else}
							<RotateCw />
							{result ? 'Rotate again' : 'Rotate'}
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
