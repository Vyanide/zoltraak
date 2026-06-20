<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Compass from '@lucide/svelte/icons/compass';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	const status = $derived(page.status);
	const isNotFound = $derived(status === 404);
	const heading = $derived(isNotFound ? 'Page not found' : 'Something went wrong');
	const detail = $derived(
		page.error?.message && page.error.message !== 'Not Found'
			? page.error.message
			: isNotFound
				? "That page doesn't exist — it may have moved, or never been here."
				: 'An unexpected error occurred.'
	);
</script>

<svelte:head>
	<title>{status} · zoltraak</title>
</svelte:head>

<main
	class="mx-auto flex min-h-svh w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center"
>
	<span class="grid size-16 place-items-center border bg-muted text-primary">
		<Compass class="size-8" />
	</span>
	<div class="space-y-2">
		<p class="font-mono text-5xl font-bold tracking-tight text-primary tabular-nums">{status}</p>
		<h1 class="text-2xl font-semibold tracking-tight">{heading}</h1>
		<p class="text-muted-foreground">{detail}</p>
	</div>
	<Button href="/">
		<ArrowLeft />
		Back to all tools
	</Button>
</main>
