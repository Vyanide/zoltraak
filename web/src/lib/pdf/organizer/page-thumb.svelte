<script lang="ts">
	import type { PdfPage } from './render';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';

	let {
		page,
		position,
		moved = false
	}: {
		/** The page being displayed. */
		page: PdfPage;
		/** 1-based position in the current (possibly reordered) sequence. */
		position: number;
		/** Whether this page has been moved from its original position. */
		moved?: boolean;
	} = $props();
</script>

<div
	class={cn(
		'group relative flex cursor-grab select-none flex-col overflow-hidden border bg-card text-card-foreground shadow-sm transition active:cursor-grabbing',
		moved ? 'border-primary ring-2 ring-primary/40' : 'hover:border-primary/40 hover:shadow-md'
	)}
>
	<div class="absolute left-2 top-2 z-10">
		<Badge class="tabular-nums shadow-sm">{position}</Badge>
	</div>

	<div
		class="absolute right-2 top-2 z-10 bg-background/70 p-1 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
		aria-hidden="true"
	>
		<GripVertical class="size-4" />
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
		Original page <span class="font-medium text-foreground tabular-nums">{page.pageNumber}</span>
	</div>
</div>
