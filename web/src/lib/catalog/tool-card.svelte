<script lang="ts">
	import type { Tool } from './tools';
	import { Badge } from '$lib/components/ui/badge';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	let { tool }: { tool: Tool } = $props();
	const available = $derived(tool.status !== 'coming-soon');
</script>

{#snippet body()}
	{@const Icon = tool.icon}
	<div class="flex items-start gap-4">
		<div class="border border-border bg-muted p-2.5 text-primary">
			<Icon class="size-5" />
		</div>
		<div class="min-w-0 flex-1">
			<div class="flex items-center gap-2">
				<h3 class="font-semibold tracking-tight">{tool.name}</h3>
				{#if !available}
					<Badge variant="secondary">Soon</Badge>
				{/if}
			</div>
			<p class="mt-1 text-sm text-muted-foreground">{tool.description}</p>
		</div>
	</div>
{/snippet}

{#if available}
	<a
		href={tool.href}
		class="group flex flex-col justify-between border border-border bg-card p-5 transition-colors hover:border-primary/60 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
	>
		{@render body()}
		<div class="mt-5 flex items-center gap-1 text-sm font-medium text-primary">
			Open tool
			<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
		</div>
	</a>
{:else}
	<div class="flex flex-col justify-between border border-dashed border-border bg-card/40 p-5 opacity-70">
		{@render body()}
		<div class="mt-5 text-sm text-muted-foreground">Coming soon</div>
	</div>
{/if}
