<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Upload from '@lucide/svelte/icons/upload';

	let {
		onfiles,
		title,
		description,
		buttonLabel,
		accept = 'application/pdf,.pdf',
		multiple = false,
		compact = false
	}: {
		/** Called with the chosen or dropped files (never empty). */
		onfiles: (files: File[]) => void;
		title: string;
		description?: string;
		buttonLabel?: string;
		accept?: string;
		multiple?: boolean;
		/** Slimmer variant for an always-visible "add more" zone. */
		compact?: boolean;
	} = $props();

	let input: HTMLInputElement;
	let over = $state(false);

	function open() {
		input.click();
	}
	function emit(list: FileList | null | undefined) {
		if (list && list.length > 0) onfiles(Array.from(list));
	}
	function onChange(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		emit(el.files);
		el.value = ''; // allow re-selecting the same file
	}
	function onDrop(event: DragEvent) {
		event.preventDefault();
		over = false;
		emit(event.dataTransfer?.files);
	}
	function onDragOver(event: DragEvent) {
		event.preventDefault();
		over = true;
	}
	function onDragLeave(event: DragEvent) {
		if (event.currentTarget === event.target) over = false;
	}
</script>

<input bind:this={input} type="file" {accept} {multiple} class="hidden" onchange={onChange} />

<div
	role="button"
	tabindex="0"
	aria-label={title}
	class={cn(
		'flex flex-col items-center justify-center border-2 border-dashed text-center transition-colors',
		compact ? 'gap-2 px-6 py-8' : 'gap-4 px-6 py-20',
		over ? 'border-primary bg-accent/40' : 'border-border hover:border-primary/50 hover:bg-muted/40'
	)}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	onclick={open}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			open();
		}
	}}
>
	<div class={cn('bg-muted text-primary', compact ? 'p-2.5' : 'p-4')}>
		<Upload class={compact ? 'size-5' : 'size-8'} />
	</div>
	<div class="space-y-1">
		<p class={cn('font-medium', compact ? 'text-sm' : 'text-base')}>{title}</p>
		{#if description && !compact}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if buttonLabel && !compact}
		<Button
			onclick={(event) => {
				event.stopPropagation();
				open();
			}}
		>
			<Upload />
			{buttonLabel}
		</Button>
	{/if}
</div>
