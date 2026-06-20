<script lang="ts">
	import { cn } from '$lib/utils';
	import { type Category, toolsInCategory } from './tools';

	let {
		categories,
		selected = $bindable(),
		orientation = 'vertical'
	}: {
		categories: Category[];
		/** Id of the selected category. */
		selected: string;
		orientation?: 'vertical' | 'horizontal';
	} = $props();

	const horizontal = $derived(orientation === 'horizontal');
</script>

<ul class={cn('flex gap-1', horizontal ? 'flex-row overflow-x-auto' : 'flex-col')}>
	{#each categories as category (category.id)}
		{@const Icon = category.icon}
		{@const active = selected === category.id}
		{@const count = toolsInCategory(category.id).length}
		<li class={horizontal ? 'shrink-0' : ''}>
			<button
				type="button"
				aria-current={active ? 'true' : undefined}
				onclick={() => (selected = category.id)}
				class={cn(
					'flex items-center gap-2.5 border px-3 py-2 text-sm font-medium transition-colors',
					horizontal ? 'whitespace-nowrap' : 'w-full',
					active
						? 'border-primary/50 bg-primary/10 text-primary'
						: 'border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
				)}
			>
				<Icon class="size-4 shrink-0" />
				<span class="truncate">{category.name}</span>
				{#if !horizontal}
					<span
						class={cn(
							'ml-auto text-xs tabular-nums',
							active ? 'text-primary/70' : 'text-muted-foreground'
						)}
					>
						{count}
					</span>
				{/if}
			</button>
		</li>
	{/each}
</ul>
