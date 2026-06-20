<script lang="ts">
	import type { PdfPage } from './render';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';

	let {
		page,
		keep,
		ontoggle
	}: {
		/** The page being displayed. */
		page: PdfPage;
		/** Whether this page is selected to keep. */
		keep: boolean;
		/** Called when the user toggles this page. */
		ontoggle: () => void;
	} = $props();
</script>

<button
	type="button"
	onclick={ontoggle}
	aria-pressed={keep}
	aria-label="{keep ? 'Keep' : 'Drop'} page {page.pageNumber}"
	class={cn(
		'group relative flex w-full select-none flex-col overflow-hidden border bg-card text-card-foreground shadow-sm transition',
		keep ? 'border-primary ring-2 ring-primary/40' : 'opacity-60 hover:opacity-100 hover:border-primary/40'
	)}
>
	<div class="absolute left-2 top-2 z-10">
		<Badge variant={keep ? 'default' : 'secondary'} class="tabular-nums shadow-sm">
			{page.pageNumber}
		</Badge>
	</div>

	<div
		class={cn(
			'absolute right-2 top-2 z-10 flex size-6 items-center justify-center border shadow-sm transition-colors',
			keep ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background/70 text-transparent'
		)}
		aria-hidden="true"
	>
		<Check class="size-4" />
	</div>

	<div class="flex aspect-[3/4] items-center justify-center overflow-hidden bg-muted/40 p-3">
		<img
			src={page.thumbnail}
			alt="Page {page.pageNumber}"
			draggable="false"
			loading="lazy"
			class="max-h-full max-w-full object-contain shadow ring-1 ring-black/20"
		/>
	</div>

	<div class="border-t px-3 py-2 text-center text-xs text-muted-foreground">
		Page <span class="font-medium text-foreground tabular-nums">{page.pageNumber}</span>
	</div>
</button>
