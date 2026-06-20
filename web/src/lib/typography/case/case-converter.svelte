<script lang="ts">
	import { convertCase, type CaseKind } from './convert';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	// Labels are shown in their own case as a live demonstration.
	const cases: { kind: CaseKind; label: string }[] = [
		{ kind: 'upper', label: 'UPPERCASE' },
		{ kind: 'lower', label: 'lowercase' },
		{ kind: 'title', label: 'Title Case' },
		{ kind: 'sentence', label: 'Sentence case' }
	];

	let text = $state('');
	let copied = $state(false);
	// The last case applied, highlighted in the toolbar until the text is edited.
	let lastApplied = $state<CaseKind | null>(null);

	function apply(kind: CaseKind) {
		text = convertCase(kind, text);
		lastApplied = kind;
		copied = false;
	}

	function clear() {
		text = '';
		lastApplied = null;
		copied = false;
	}

	function onInput() {
		copied = false;
		lastApplied = null;
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
		} catch {
			// Clipboard unavailable (e.g. insecure context) — leave the text selectable.
		}
	}
</script>

<div class="space-y-4">
	<!-- In-place toolbar: pick a case (left), copy/clear (right) -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="flex flex-wrap gap-1 border bg-card p-1">
			{#each cases as option (option.kind)}
				<button
					type="button"
					disabled={!text}
					aria-pressed={lastApplied === option.kind}
					onclick={() => apply(option.kind)}
					class={cn(
						'px-3 py-1.5 font-mono text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-50',
						lastApplied === option.kind
							? 'bg-primary font-semibold text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					)}
				>
					{option.label}
				</button>
			{/each}
		</div>

		<div class="ml-auto flex gap-2">
			<Button variant="outline" size="sm" onclick={copy} disabled={!text}>
				{#if copied}
					<Check />
					Copied
				{:else}
					<Copy />
					Copy
				{/if}
			</Button>
			<Button variant="outline" size="sm" onclick={clear} disabled={!text}>
				<Trash2 />
				Clear
			</Button>
		</div>
	</div>

	<!-- Editor: text is transformed in place -->
	<div class="flex min-h-[22rem] flex-col border bg-card transition-colors focus-within:border-ring">
		<textarea
			id="cc-text"
			bind:value={text}
			oninput={onInput}
			spellcheck="false"
			placeholder="Type or paste your text here, then pick a case above…"
			class="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
		></textarea>
		<div
			class="flex items-center gap-2 border-t px-4 py-2.5 font-mono text-[11px] text-muted-foreground"
		>
			<ShieldCheck class="size-3.5" />
			fully client-side · nothing is uploaded
		</div>
	</div>
</div>
