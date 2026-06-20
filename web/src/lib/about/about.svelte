<script lang="ts">
	import { creditGroups } from './credits';
	import Heart from '@lucide/svelte/icons/heart';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	const total = creditGroups.reduce((sum, group) => sum + group.items.length, 0);
</script>

<div class="space-y-10">
	<section class="space-y-4 border bg-card p-6">
		<div class="flex items-center gap-3">
			<span class="grid size-10 place-items-center bg-primary text-primary-foreground">
				<Heart class="size-5" />
			</span>
			<div>
				<h2 class="text-lg font-semibold tracking-tight">Built on open source</h2>
				<p class="text-sm text-muted-foreground tabular-nums">
					{total} projects credited below
				</p>
			</div>
		</div>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Named after the now ordinary offensive magic spell from <em>Frieren</em>, zoltraak is a
			self-hosted toolbox for everyday PDF, image and text tasks. Pick a tool, drop a file in, and
			the work runs on your own machine — nothing is uploaded to a third-party service. It only
			exists because of the libraries, runtimes and research listed here; thank you to everyone who
			builds and maintains them.
		</p>
	</section>

	{#each creditGroups as group (group.title)}
		<section class="space-y-4">
			<div class="space-y-1">
				<h2 class="text-base font-semibold tracking-tight">{group.title}</h2>
				<p class="text-sm text-muted-foreground">{group.blurb}</p>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each group.items as item (item.name)}
					<a
						href={item.href}
						target="_blank"
						rel="noreferrer noopener"
						class="group flex items-start gap-3 border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-accent/20"
					>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
								<span class="font-medium">{item.name}</span>
								{#if item.version}
									<span class="font-mono text-[11px] text-muted-foreground tabular-nums">
										v{item.version}
									</span>
								{/if}
							</div>
							<p class="mt-1 text-sm text-muted-foreground">{item.description}</p>
						</div>
						<ExternalLink
							class="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
						/>
					</a>
				{/each}
			</div>
		</section>
	{/each}

	<p class="border-t pt-6 text-sm text-muted-foreground">
		Made with Bun, Svelte and Elysia. Names and trademarks belong to their respective owners;
		listing here is acknowledgement, not endorsement.
	</p>
</div>
