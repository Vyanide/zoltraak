<script lang="ts">
	import ImageConverter from '$lib/image/convert/image-converter.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Convert &amp; Compress Image · zoltraak</title>
	<meta
		name="description"
		content="Convert an image between formats (PNG, JPEG, WebP, AVIF, HEIC, TIFF, BMP, GIF, ICO, ICNS) and adjust quality to shrink it."
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Convert &amp; Compress</h1>
		<p class="text-muted-foreground">
			Re-encode an image to another format — PNG, JPEG, WebP, AVIF, HEIC, TIFF, BMP, GIF, ICO or
			ICNS — and dial in the quality for lossy formats to shrink the file.
		</p>
	</header>


	<ImageConverter />
</main>
