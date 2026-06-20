<script lang="ts">
    import CaseConverter from "$lib/typography/case/case-converter.svelte";
    import ArrowLeft from "@lucide/svelte/icons/arrow-left";
</script>

<svelte:head>
    <title>Convert Case · zoltraak</title>
    <meta name="description" content="Switch text between UPPERCASE, lowercase, Title Case and Sentence case. Runs entirely in your browser." />
</svelte:head>

<main class="mx-auto min-h-svh w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
    <a href="/" class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft class="size-4" />
        All tools
    </a>

    <header class="mb-8 space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Convert Case</h1>
        <p class="text-muted-foreground">Switch text between UPPERCASE, lowercase, Title Case and Sentence case.</p>
    </header>

    <CaseConverter />
</main>
