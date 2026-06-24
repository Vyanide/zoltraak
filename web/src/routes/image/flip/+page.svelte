<script lang="ts">
	import ImageFlipper from '$lib/image/flip/image-flipper.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Flip Image · zoltraak</title>
	<meta
		name="description"
		content="Mirror an image horizontally or vertically. Runs on the server and comes back as a download."
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Flip Image</h1>
		<p class="text-muted-foreground">
			Mirror an image horizontally (left↔right), vertically (top↔bottom), or both.
		</p>
	</header>

	<ImageFlipper />
</main>
