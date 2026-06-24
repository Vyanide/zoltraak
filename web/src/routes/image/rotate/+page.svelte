<script lang="ts">
	import ImageRotator from '$lib/image/rotate/image-rotator.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Rotate & Flip Image · zoltraak</title>
	<meta
		name="description"
		content="Rotate an image by 90°, 180° or any angle and mirror it horizontally or vertically. Runs on the server and comes back as a download."
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Rotate &amp; Flip Image</h1>
		<p class="text-muted-foreground">
			Turn an image by 90°, 180° or any angle, and mirror it horizontally or vertically.
			Non-right-angle rotations fill the exposed corners with a colour or transparency.
		</p>
	</header>

	<ImageRotator />
</main>
