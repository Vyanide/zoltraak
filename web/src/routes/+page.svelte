<script lang="ts">
	import { categories, toolsInCategory } from '$lib/catalog/tools';
	import CategoryNav from '$lib/catalog/category-nav.svelte';
	import ToolCard from '$lib/catalog/tool-card.svelte';
	import Info from '@lucide/svelte/icons/info';

	let selected = $state('all');

	const activeCategory = $derived(categories.find((c) => c.id === selected) ?? categories[0]);
	const visibleTools = $derived(toolsInCategory(selected));
</script>

<svelte:head>
	<title>zoltraak · Toolbox</title>
	<meta name="description" content="A local-first toolbox. Pick a category to find a tool." />
</svelte:head>

<div class="flex min-h-svh">
	<!-- Sidebar (desktop) -->
	<aside
		class="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
	>
		<a href="/" class="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
			<!-- Logo B — the "Zoltraak beam" mark, framed in a square border -->
			<span class="grid size-9 shrink-0 place-items-center border border-primary/50">
				<svg viewBox="0 0 64 64" class="size-6" aria-hidden="true">
					<defs>
						<linearGradient id="zlogo" x1="18" y1="48" x2="46" y2="18" gradientUnits="userSpaceOnUse">
							<stop offset="0" stop-color="#d699b6" />
							<stop offset="1" stop-color="#7fbbb3" />
						</linearGradient>
						<filter id="zlogo-glow" x="-60%" y="-60%" width="220%" height="220%">
							<feDropShadow dx="0" dy="0" stdDeviation="1.8" flood-color="#d699b6" flood-opacity="0.55" />
						</filter>
					</defs>
					<g filter="url(#zlogo-glow)" transform="translate(32 32) scale(0.78) translate(-31 -29)">
						<g stroke="url(#zlogo)" stroke-linecap="round" opacity="0.42">
							<line x1="9" y1="41" x2="19" y2="30" stroke-width="2" />
							<line x1="17" y1="51" x2="25" y2="42" stroke-width="2" />
						</g>
						<line x1="14" y1="50" x2="46" y2="18" stroke="url(#zlogo)" stroke-width="8" stroke-linecap="round" opacity="0.42" />
						<line x1="14" y1="50" x2="46" y2="18" stroke="#f2e9d4" stroke-width="2.6" stroke-linecap="round" />
						<path d="M49 3 C49.63 7.8 49.63 7.8 61 9 C49.63 10.2 49.63 10.2 49 15 C48.37 10.2 48.37 10.2 37 9 C48.37 7.8 48.37 7.8 49 3Z" fill="url(#zlogo)" />
						<path d="M49 9.8 C49.36 11.9 49.36 11.9 54.2 9 C49.36 6.1 49.36 6.1 49 4 C48.64 6.1 48.64 6.1 49 9.8Z" fill="#fbf6ea" />
						<path d="M31 29.6 C31.29 32.4 31.29 32.4 34.4 33 C31.29 33.6 31.29 33.6 31 36.4 C30.71 33.6 30.71 33.6 27.6 33 C30.71 32.4 30.71 32.4 31 29.6Z" fill="#f2e9d4" />
					</g>
				</svg>
			</span>
			<span class="text-base font-semibold tracking-tight">zoltraak</span>
		</a>
		<nav class="flex-1 overflow-y-auto p-3">
			<p class="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
				Categories
			</p>
			<CategoryNav {categories} bind:selected />
		</nav>
		<a
			href="/about"
			class="flex items-center gap-2 border-t border-sidebar-border px-5 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
		>
			<Info class="size-3.5" />
			About &amp; credits
		</a>
	</aside>

	<!-- Main content -->
	<main class="min-w-0 flex-1">
		<header class="flex items-center justify-between gap-3 border-b bg-background/60 px-5 py-4 sm:px-8">
			<div class="min-w-0">
				<h1 class="text-xl font-semibold tracking-tight sm:text-2xl">{activeCategory.name}</h1>
				<p class="text-sm text-muted-foreground tabular-nums">
					{visibleTools.length}
					{visibleTools.length === 1 ? 'tool' : 'tools'}
				</p>
			</div>
			<a
				href="/about"
				class="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<Info class="size-4" />
				<span class="hidden sm:inline">About</span>
			</a>
		</header>

		<!-- Category selector (mobile) -->
		<div class="border-b p-3 md:hidden">
			<CategoryNav {categories} bind:selected orientation="horizontal" />
		</div>

		<div class="p-5 sm:p-8">
			{#if visibleTools.length === 0}
				<p class="text-muted-foreground">No tools in this category yet.</p>
			{:else if selected === 'all'}
				<!-- Group every tool under its category heading. -->
				<div class="space-y-10">
					{#each categories.filter((category) => category.id !== 'all') as category (category.id)}
						{@const Icon = category.icon}
						{@const group = toolsInCategory(category.id)}
						{#if group.length > 0}
							<section>
								<h2
									class="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
								>
									<Icon class="size-4" />
									{category.name}
								</h2>
								<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{#each group as tool (tool.id)}
										<ToolCard {tool} />
									{/each}
								</div>
							</section>
						{/if}
					{/each}
				</div>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each visibleTools as tool (tool.id)}
						<ToolCard {tool} />
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>
