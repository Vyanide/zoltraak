<script lang="ts">
	import ImageCropper from '$lib/image/crop/image-cropper.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Crop Image · zoltraak</title>
	<meta name="description" content="Crop an image with a draggable selection or an aspect-ratio preset." />
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Crop Image</h1>
		<p class="text-muted-foreground">
			Drag a freeform selection or lock it to an aspect-ratio preset — or type the exact size and
			position — then crop.
		</p>
	</header>

	<ImageCropper />
</main>
