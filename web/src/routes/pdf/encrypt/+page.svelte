<script lang="ts">
	import PdfEncryptor from '$lib/pdf/encrypt/pdf-encryptor.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>Encrypt PDF · zoltraak</title>
	<meta name="description" content="Password-protect a PDF with your choice of encryption." />
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
		<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Encrypt PDF</h1>
		<p class="text-muted-foreground">
			Upload a PDF, set a password, and pick an encryption type to download a protected copy.
		</p>
	</header>

	<PdfEncryptor />
</main>
