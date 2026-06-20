<script lang="ts">
	import EnchantingTable from '$lib/typography/enchanting/enchanting-table.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Enchanting Table · zoltraak</title>
	<meta
		name="description"
		content="Translate text into the Minecraft Standard Galactic Alphabet, and back."
	/>
</svelte:head>

<main class="mx-auto min-h-svh w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
	<a
		href="/"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
	>
		<ArrowLeft class="size-4" />
		All tools
	</a>

	<header class="mb-8 space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Enchanting Table</h1>
		<p class="text-muted-foreground">
			Convert English into the Standard Galactic Alphabet — the Minecraft enchanting-table script —
			and back again.
		</p>
	</header>

	<EnchantingTable />
</main>
