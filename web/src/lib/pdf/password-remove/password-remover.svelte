<script lang="ts">
	import { removePassword } from './api';
	import { downloadBlob } from '$lib/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Dropzone from '$lib/components/dropzone.svelte';

	import FileText from '@lucide/svelte/icons/file-text';
	import LockOpen from '@lucide/svelte/icons/lock-open';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type SaveState = 'idle' | 'saving' | 'done' | 'error';

	let file = $state<File | null>(null);
	let password = $state('');
	let showPassword = $state(false);
	let saveState = $state<SaveState>('idle');
	let saveError = $state<string | null>(null);

	const sectionLabel =
		'block font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground';

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function selectFile(picked: File) {
		file = picked;
		password = '';
		saveState = 'idle';
		saveError = null;
	}

	function reset() {
		file = null;
		password = '';
		saveState = 'idle';
		saveError = null;
	}

	// Clear a finished result once the user edits the password again.
	function clearStatus() {
		if (saveState === 'done' || saveState === 'error') {
			saveState = 'idle';
			saveError = null;
		}
	}

	function downloadName(name: string) {
		return `${name.replace(/\.pdf$/i, '') || 'document'} (unlocked).pdf`;
	}

	async function submit() {
		if (!file || !password || saveState === 'saving') return;
		saveState = 'saving';
		saveError = null;
		try {
			const blob = await removePassword(file, password);
			downloadBlob(blob, downloadName(file.name));
			saveState = 'done';
		} catch (error) {
			console.error('Failed to remove PDF password', error);
			saveState = 'error';
			saveError = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

{#if !file}
	<Dropzone
		title="Drop a password-protected PDF, or click to browse"
		description="The file is sent to the server only to be decrypted, then returned."
		buttonLabel="Choose PDF"
		onfiles={(files) => {
			if (files[0]) selectFile(files[0]);
		}}
	/>
{:else}
	<div class="space-y-4">
		<div class="flex items-center gap-3 border bg-card p-3">
			<div class="bg-muted p-2 text-primary">
				<FileText class="size-5" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate font-medium">{file.name}</p>
				<p class="text-sm text-muted-foreground tabular-nums">{formatSize(file.size)}</p>
			</div>
			<Button variant="outline" size="sm" onclick={reset}>Choose different file</Button>
		</div>

		<!-- Studio: document panel + controls -->
		<div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
			<!-- Document -->
			<div class="grid min-h-[22rem] place-items-center border bg-muted/30 p-8">
				<div class="flex flex-col items-center gap-4">
					<div class="relative h-44 w-36 border bg-card shadow-xl">
						<div class="absolute inset-x-5 top-5 space-y-2" aria-hidden="true">
							<div class="h-1 bg-foreground/10"></div>
							<div class="h-1 w-5/6 bg-foreground/10"></div>
							<div class="h-1 w-2/3 bg-foreground/10"></div>
						</div>
						<div class="absolute inset-0 grid place-items-center">
							<div
								class="grid size-14 place-items-center border border-primary/40 bg-primary/15 text-primary shadow-md"
							>
								<LockOpen class="size-7" />
							</div>
						</div>
					</div>
					<p class="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
						Removes the password protection
					</p>
				</div>
			</div>

			<!-- Controls -->
			<form
				class="flex flex-col gap-5 border bg-card p-4"
				onsubmit={(event) => {
					event.preventDefault();
					submit();
				}}
			>
				<div class="space-y-2">
					<span class={sectionLabel}>Password</span>
					<div class="relative">
						<Input
							id="pdf-password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							oninput={clearStatus}
							placeholder="Enter the PDF password"
							autocomplete="off"
							class="pr-10"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showPassword}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					</div>
					<p class="text-xs text-muted-foreground">
						Enter the password the PDF opens with to strip its protection.
					</p>
				</div>

				{#if saveState === 'done'}
					<div
						class="flex items-start gap-2 border border-primary/40 bg-primary/10 p-3 text-sm text-foreground"
					>
						<CircleCheck class="mt-0.5 size-4 shrink-0 text-primary" />
						<span>Unlocked PDF downloaded.</span>
					</div>
				{:else if saveState === 'error'}
					<div
						class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
					>
						<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
						<span>{saveError}</span>
					</div>
				{/if}

				<Button type="submit" class="mt-auto w-full justify-center" disabled={!password || saveState === 'saving'}>
					{#if saveState === 'saving'}
						<LoaderCircle class="animate-spin" />
						Removing…
					{:else}
						<LockOpen />
						Remove password
					{/if}
				</Button>
			</form>
		</div>
	</div>
{/if}
