<script lang="ts">
	import ImageResizer from '$lib/image/resize/image-resizer.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Resize Image · zoltraak</title>
	<meta name="description" content="Resize an image by width and height, optionally keeping its aspect ratio." />
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Resize Image</h1>
		<p class="text-muted-foreground">
			Set a new width and height — keep the aspect ratio locked, or stretch to exact dimensions.
		</p>
	</header>

	<ImageResizer />
</main>
