<script lang="ts">
	import JsonFormatter from '$lib/developer/json-format/json-formatter.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>JSON Formatter · zoltraak</title>
	<meta
		name="description"
		content="Pretty-print, minify and validate JSON. Runs entirely in your browser — nothing is uploaded."
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">JSON Formatter</h1>
		<p class="text-muted-foreground">
			Pretty-print, minify and validate JSON. Everything runs in your browser — nothing is uploaded.
		</p>
	</header>

	<JsonFormatter />
</main>
