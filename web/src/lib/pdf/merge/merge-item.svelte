<script lang="ts">
	import type { MergeFile } from './types';
	import { cn } from '$lib/utils';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import FileText from '@lucide/svelte/icons/file-text';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import X from '@lucide/svelte/icons/x';

	let {
		item,
		position,
		onRemove
	}: {
		item: MergeFile;
		/** 1-based position in the merge order. */
		position: number;
		onRemove: (id: string) => void;
	} = $props();

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div
	class={cn(
		'group flex cursor-grab select-none items-center gap-3 border bg-card p-3 transition active:cursor-grabbing',
		item.error ? 'border-destructive/50' : 'border-border hover:border-primary/40'
	)}
>
	<span class="w-5 shrink-0 text-center text-sm tabular-nums text-muted-foreground">{position}</span>
	<GripVertical class="size-4 shrink-0 text-muted-foreground" />
	<div class="flex size-9 shrink-0 items-center justify-center bg-muted text-primary">
		<FileText class="size-4" />
	</div>

	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{item.file.name}</p>
		<p class="flex items-center gap-1 text-xs text-muted-foreground">
			<span>{formatSize(item.file.size)}</span>
			<span>·</span>
			{#if item.error}
				<span class="text-destructive">{item.error}</span>
			{:else if item.pageCount === null}
				<span class="inline-flex items-center gap-1"><LoaderCircle class="size-3 animate-spin" /> reading…</span>
			{:else}
				<span>{item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}</span>
			{/if}
		</p>
	</div>

	<button
		type="button"
		onclick={() => onRemove(item.id)}
		aria-label="Remove {item.file.name}"
		class="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
	>
		<X class="size-4" />
	</button>
</div>
