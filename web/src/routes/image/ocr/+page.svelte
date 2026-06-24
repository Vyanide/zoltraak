<script lang="ts">
	import Ocr from '$lib/image/ocr/ocr.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Image OCR · zoltraak</title>
	<meta
		name="description"
		content="Extract the text from an image with OCR (PP-OCRv6). The image is read on the server and only the text comes back."
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Image OCR</h1>
		<p class="text-muted-foreground">
			Upload an image and get back the text it contains. The image is read on the server with OCR;
			only the text is returned.
		</p>
	</header>

	<Ocr />
</main>
