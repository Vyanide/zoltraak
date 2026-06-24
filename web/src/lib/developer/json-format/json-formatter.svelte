<script lang="ts">
	import { pretty, minify, type Indent } from './format';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';

	// One connected group: three indents (pretty-print) + minify. Each click
	// transforms the text in place; `indent` undefined means minify.
	type Action = { key: string; label: string; indent?: Indent };
	const actions: Action[] = [
		{ key: '2', label: '2 spaces', indent: 2 },
		{ key: '4', label: '4 spaces', indent: 4 },
		{ key: 'tab', label: 'Tab', indent: 'tab' },
		{ key: 'minify', label: 'Minify' }
	];

	let text = $state('');
	let error = $state<string | null>(null);
	let copied = $state(false);
	// The action last applied, highlighted until the text is edited.
	let lastApplied = $state<string | null>(null);

	function apply(action: Action) {
		const result = action.indent !== undefined ? pretty(text, action.indent) : minify(text);
		if (result.ok) {
			text = result.output;
			error = null;
			lastApplied = action.key;
		} else {
			error = result.error;
		}
		copied = false;
	}

	function clear() {
		text = '';
		error = null;
		copied = false;
		lastApplied = null;
	}

	function onInput() {
		// The error / highlight belonged to the previous content.
		error = null;
		lastApplied = null;
		copied = false;
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
	<!-- Toolbar: four connected transform buttons (left), copy/clear (right) -->
	<div class="flex flex-wrap items-center gap-3">
		<div class="inline-flex divide-x divide-border border bg-card">
			{#each actions as action (action.key)}
				<button
					type="button"
					disabled={!text}
					aria-pressed={lastApplied === action.key}
					onclick={() => apply(action)}
					class={cn(
						'px-4 py-2 font-mono text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-50',
						lastApplied === action.key
							? 'bg-primary font-semibold text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted hover:text-foreground'
					)}
				>
					{action.label}
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

	<!-- Editor: JSON is transformed in place -->
	<div
		class={cn(
			'flex min-h-[24rem] flex-col border bg-card transition-colors focus-within:border-ring',
			error && 'border-destructive/60'
		)}
	>
		<textarea
			id="json-text"
			bind:value={text}
			oninput={onInput}
			spellcheck="false"
			placeholder="Paste JSON here, then pick a format above…"
			class="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground"
		></textarea>
		{#if error}
			<div
				class="flex items-start gap-2 border-t border-destructive/40 bg-destructive/10 px-4 py-2.5 font-mono text-[12px] text-foreground"
			>
				<TriangleAlert class="mt-0.5 size-3.5 shrink-0 text-destructive" />
				<span>{error}</span>
			</div>
		{:else}
			<div
				class="flex items-center gap-2 border-t px-4 py-2.5 font-mono text-[11px] text-muted-foreground"
			>
				<ShieldCheck class="size-3.5" />
				fully client-side · nothing is uploaded
			</div>
		{/if}
	</div>
</div>
