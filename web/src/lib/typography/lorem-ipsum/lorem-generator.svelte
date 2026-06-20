<script lang="ts">
	import { generate, type Unit } from './generate';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	const units: { value: Unit; label: string }[] = [
		{ value: 'paragraphs', label: 'Paragraphs' },
		{ value: 'sentences', label: 'Sentences' },
		{ value: 'words', label: 'Words' }
	];

	let unit = $state<Unit>('paragraphs');
	let count = $state(3);
	let startWithLorem = $state(true);
	let output = $state('');
	let copied = $state(false);
	// Bumped by "Generate" to re-randomize without changing the options.
	let nonce = $state(0);

	// Regenerate whenever the options change or Generate is clicked. Runs only on
	// the client (an effect), so the random text never causes a hydration mismatch.
	$effect(() => {
		nonce;
		output = generate(unit, count, startWithLorem);
		copied = false;
	});

	// Min 0, no upper clamp — the amount stays open-ended as before.
	function step(delta: number) {
		count = Math.max(0, (Number.isFinite(count) ? count : 0) + delta);
	}

	const paragraphs = $derived(output ? output.split('\n\n') : []);

	async function copy() {
		try {
			await navigator.clipboard.writeText(output);
			copied = true;
		} catch {
			// Clipboard unavailable (e.g. insecure context) — leave the text selectable.
		}
	}
</script>

<!-- Control rail: options panel on the left, live preview on the right. -->
<div class="grid gap-4 lg:grid-cols-[16rem_1fr]">
	<!-- Controls -->
	<div class="flex flex-col gap-5 border bg-card p-4">
		<div class="space-y-2">
			<span class="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
				Generate by
			</span>
			<div class="flex flex-col gap-1 border bg-background p-1">
				{#each units as option (option.value)}
					<button
						type="button"
						onclick={() => (unit = option.value)}
						aria-pressed={unit === option.value}
						class={cn(
							'px-3 py-1.5 text-left font-mono text-[13px] transition-colors',
							unit === option.value
								? 'bg-primary font-semibold text-primary-foreground'
								: 'text-muted-foreground hover:bg-muted hover:text-foreground'
						)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			<span class="block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
				Amount
			</span>
			<div class="flex h-9 w-fit items-stretch border bg-background">
				<button
					type="button"
					aria-label="Decrease amount"
					onclick={() => step(-1)}
					class="grid w-9 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
				>
					<Minus class="size-4" />
				</button>
				<input
					type="number"
					min="0"
					aria-label="Amount"
					bind:value={count}
					class="w-16 border-x border-border bg-transparent text-center font-mono text-sm tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
				<button
					type="button"
					aria-label="Increase amount"
					onclick={() => step(1)}
					class="grid w-9 place-items-center text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
				>
					<Plus class="size-4" />
				</button>
			</div>
		</div>

		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={startWithLorem} class="size-4 accent-primary" />
			Start with “Lorem ipsum…”
		</label>

		<Button onclick={() => nonce++} class="mt-auto justify-center">
			<RefreshCw />
			Generate
		</Button>
	</div>

	<!-- Preview -->
	<div class="flex min-h-[28rem] flex-col gap-3 border bg-card p-5">
		<div class="flex items-center justify-between gap-3">
			<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
				Preview
			</span>
			<Button variant="outline" size="sm" onclick={copy} disabled={!output}>
				{#if copied}
					<Check />
					Copied
				{:else}
					<Copy />
					Copy
				{/if}
			</Button>
		</div>
		<div class="min-h-0 flex-1 overflow-auto text-[14.5px] leading-[1.75] text-muted-foreground">
			{#if paragraphs.length > 0}
				{#each paragraphs as para, i (i)}
					<p class="mb-3.5 last:mb-0">{para}</p>
				{/each}
			{:else}
				<p class="text-muted-foreground/70">Set the amount above to generate placeholder text.</p>
			{/if}
		</div>
	</div>
</div>
