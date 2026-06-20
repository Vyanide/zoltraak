<script lang="ts">
	import About from '$lib/about/about.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>About · zoltraak</title>
	<meta
		name="description"
		content="About zoltraak and credits for the libraries, runtimes and models it's built on."
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

	<header class="mb-8">
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">About &amp; credits</h1>
	</header>

	<About />
</main>
