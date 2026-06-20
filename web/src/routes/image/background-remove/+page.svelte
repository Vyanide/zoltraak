<script lang="ts">
	import BackgroundRemover from '$lib/image/background-remove/background-remover.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Remove Image Background · zoltraak</title>
	<meta
		name="description"
		content="Remove an image's background with an ONNX model (U²-Net or ISNet Anime)."
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Remove Image Background</h1>
		<p class="text-muted-foreground">
			Upload an image, pick a model, and get back a transparent PNG with the background erased. The
			model runs on the server.
		</p>
	</header>

	<BackgroundRemover />
</main>
