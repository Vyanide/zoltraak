<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ArrowRightLeft from '@lucide/svelte/icons/arrow-right-left';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	type Direction = 'encode' | 'decode';

	let text = $state('');
	let direction = $state<Direction>('encode');
	let copied = $state(false);

	const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	// The Standard Galactic Alphabet is a 1:1 glyph substitution of Latin A–Z with
	// no Unicode of its own, so "translating" is purely visual: the same text is
	// shown in the SGA font on one side and a normal font on the other. The swap
	// button decides which side is which.
	const inputLabel = $derived(direction === 'encode' ? 'English' : 'Galactic');
	const outputLabel = $derived(direction === 'encode' ? 'Galactic' : 'English');
	const inputSga = $derived(direction === 'decode');
	const outputSga = $derived(direction === 'encode');

	function swap() {
		direction = direction === 'encode' ? 'decode' : 'encode';
	}
	function clear() {
		text = '';
	}
	async function copy() {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// Clipboard may be unavailable (e.g. insecure context); ignore.
		}
	}
</script>

<div class="space-y-4">
	<!-- Split mirror: source ↔ target, swapped by the centre button -->
	<div class="grid border bg-card lg:grid-cols-[1fr_auto_1fr]">
		<!-- Source (editable) -->
		<div class="flex min-h-[18rem] min-w-0 flex-col p-4 lg:min-h-[22rem]">
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
					{inputLabel}
				</span>
				<Button variant="outline" size="sm" onclick={clear} disabled={!text}>
					<Trash2 />
					Clear
				</Button>
			</div>
			<textarea
				bind:value={text}
				spellcheck="false"
				placeholder={direction === 'encode'
					? 'Type the message to enchant…'
					: 'Type the letters to read them as glyphs…'}
				class="w-full min-h-0 flex-1 resize-none break-words bg-transparent text-base leading-relaxed outline-none placeholder:font-sans placeholder:text-muted-foreground"
				class:sga={inputSga}
			></textarea>
		</div>

		<!-- Swap -->
		<div
			class="flex items-center justify-center border-y bg-muted/30 p-2 lg:border-x lg:border-y-0"
		>
			<button
				type="button"
				onclick={swap}
				aria-label="Swap direction"
				class="grid size-10 place-items-center border border-[#d699b6]/40 bg-[#d699b6]/10 text-[#d699b6] transition-all hover:rotate-180 hover:bg-[#d699b6]/20 hover:shadow-[0_0_16px_rgba(214,153,182,0.4)]"
			>
				<ArrowRightLeft class="size-4" />
			</button>
		</div>

		<!-- Target (result) -->
		<div class="flex min-h-[18rem] min-w-0 flex-col bg-muted/30 p-4 lg:min-h-[22rem]">
			<div class="mb-2 flex items-center justify-between gap-2">
				<span class="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
					{outputLabel}
				</span>
				<Button variant="outline" size="sm" disabled={!text} onclick={copy}>
					{#if copied}
						<Check />
						Copied
					{:else}
						<Copy />
						Copy
					{/if}
				</Button>
			</div>
			<div
				class="min-h-0 w-full min-w-0 flex-1 overflow-auto whitespace-pre-wrap text-base leading-relaxed [overflow-wrap:anywhere]"
				class:sga={outputSga}
				aria-live="polite"
			>
				{#if text}
					{text}
				{:else}
					<span class="font-sans text-sm text-muted-foreground">The translation appears here.</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Alphabet key (A–Z) — all glyphs shown, wraps to fit -->
	<div class="grid grid-cols-6 gap-1.5 border bg-card p-3 sm:grid-cols-9 lg:grid-cols-13">
		{#each LETTERS as letter (letter)}
			<div class="flex flex-col items-center gap-1 border bg-background py-2">
				<span class="sga text-lg leading-none">{letter}</span>
				<span class="font-mono text-[11px] text-muted-foreground">{letter}</span>
			</div>
		{/each}
	</div>

	{#if outputSga}
		<p class="text-xs text-muted-foreground">
			The glyphs are a font over the Latin letters — copying yields the plain text, since the
			Standard Galactic Alphabet has no characters of its own.
		</p>
	{/if}
</div>

<style>
	@font-face {
		font-family: 'SGA Smooth';
		src: url('./sga-smooth.woff2') format('woff2');
		font-display: swap;
	}
	/* The runes get Everforest purple + a soft glow — the tool's "magic" accent. */
	.sga {
		font-family: 'SGA Smooth', monospace;
		letter-spacing: 0.14em;
		color: #d699b6;
		text-shadow: 0 0 12px rgba(214, 153, 182, 0.4);
	}
</style>
