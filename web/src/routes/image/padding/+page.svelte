<script lang="ts">
	import ImagePadder from '$lib/image/padding/image-padder.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Pad Image · zoltraak</title>
	<meta name="description" content="Add solid-color or transparent padding around an image." />
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Pad Image</h1>
		<p class="text-muted-foreground">
			Add padding around an image — uniform, top &amp; bottom, left &amp; right, a single side, or a
			custom amount per side — in any colour or transparent.
		</p>
	</header>

	<ImagePadder />
</main>
