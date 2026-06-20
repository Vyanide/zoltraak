<script lang="ts">
	import { countText, formatDuration } from './count';
	import { Button } from '$lib/components/ui/button';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	let text = $state('');
	const stats = $derived(countText(text));

	const counts = $derived([
		{ label: 'Words', value: stats.words },
		{ label: 'Characters', value: stats.characters },
		{ label: 'Characters (no spaces)', value: stats.charactersNoSpaces },
		{ label: 'Sentences', value: stats.sentences },
		{ label: 'Paragraphs', value: stats.paragraphs },
		{ label: 'Punctuation', value: stats.punctuation }
	]);
	const estimates = $derived([
		{ label: 'Reading time', value: formatDuration(stats.readingSeconds), rate: '200 wpm' },
		{ label: 'Speaking time', value: formatDuration(stats.speakingSeconds), rate: '130 wpm' }
	]);

	function clear() {
		text = '';
	}
</script>

<!-- Workbench rail: editor on the left, stat panels in a right rail. -->
<div class="grid gap-4 lg:grid-cols-[1fr_320px]">
	<!-- Editor (stretches to the rail's height on lg, so its bottom aligns with the Estimates box) -->
	<div
		class="flex min-h-[24rem] flex-col border bg-card transition-colors focus-within:border-ring lg:min-h-0"
	>
		<div class="flex items-center justify-between gap-3 border-b px-4 py-2.5">
			<label for="wc-text" class="text-sm font-medium">Your text</label>
			<Button variant="outline" size="sm" disabled={text.length === 0} onclick={clear}>
				<Trash2 />
				Clear all
			</Button>
		</div>
		<textarea
			id="wc-text"
			bind:value={text}
			spellcheck="false"
			placeholder="Type or paste your text here…"
			class="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
		></textarea>
		<div
			class="flex items-center gap-2 border-t px-4 py-2.5 font-mono text-[11px] text-muted-foreground"
		>
			<ShieldCheck class="size-3.5" />
			plain text · counts update instantly
		</div>
	</div>

	<!-- Rail -->
	<div class="flex flex-col gap-4">
		<div class="border bg-card px-4 py-3">
			<p class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
				Counts
			</p>
			<dl>
				{#each counts as row, i (row.label)}
					<div
						class="flex items-baseline justify-between gap-3 py-2"
						class:border-t={i > 0}
						class:border-border={i > 0}
					>
						<dt class="text-sm text-muted-foreground">{row.label}</dt>
						<dd class="font-mono text-xl font-semibold tabular-nums">
							{row.value.toLocaleString()}
						</dd>
					</div>
				{/each}
			</dl>
		</div>

		<div class="border bg-card px-4 py-3">
			<p class="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
				Estimates
			</p>
			<dl>
				{#each estimates as row, i (row.label)}
					<div class="flex flex-col gap-0.5 py-2.5" class:border-t={i > 0} class:border-border={i > 0}>
						<dt class="text-[13px] text-muted-foreground">{row.label}</dt>
						<dd class="flex items-baseline justify-between gap-2">
							<span class="font-mono text-lg font-semibold tabular-nums text-primary">{row.value}</span>
							<span class="font-mono text-[10px] text-muted-foreground">{row.rate}</span>
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
</div>
