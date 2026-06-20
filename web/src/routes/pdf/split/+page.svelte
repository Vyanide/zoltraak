<script lang="ts">
	import PdfSplitter from '$lib/pdf/split/pdf-splitter.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Split PDF · zoltraak</title>
	<meta name="description" content="Pick the pages to keep from a PDF and download them as a new file." />
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Split PDF</h1>
		<p class="text-muted-foreground">
			Upload a PDF, select the pages you want to keep, and download them as a new PDF.
		</p>
	</header>

	<PdfSplitter />
</main>
