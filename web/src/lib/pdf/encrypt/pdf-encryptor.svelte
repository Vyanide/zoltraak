<script lang="ts">
	import { encryptPdf } from './api';
	import { algorithms, defaultAlgorithm, type EncryptionAlgorithm } from './algorithms';
	import { downloadBlob } from '$lib/client';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import Dropzone from '$lib/components/dropzone.svelte';

	import FileText from '@lucide/svelte/icons/file-text';
	import Lock from '@lucide/svelte/icons/lock';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	type SaveState = 'idle' | 'saving' | 'done' | 'error';

	let file = $state<File | null>(null);
	let password = $state('');
	let confirm = $state('');
	let algorithm = $state<EncryptionAlgorithm>(defaultAlgorithm);
	let showPassword = $state(false);
	let showConfirm = $state(false);
	let saveState = $state<SaveState>('idle');
	let saveError = $state<string | null>(null);

	const mismatch = $derived(confirm.length > 0 && password !== confirm);
	const canSubmit = $derived(
		!!file && password.length > 0 && password === confirm && saveState !== 'saving'
	);

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
		confirm = '';
		algorithm = defaultAlgorithm;
		saveState = 'idle';
		saveError = null;
	}

	function reset() {
		file = null;
		password = '';
		confirm = '';
		algorithm = defaultAlgorithm;
		saveState = 'idle';
		saveError = null;
	}

	// Clear a finished result once the user changes any input again.
	function clearStatus() {
		if (saveState === 'done' || saveState === 'error') {
			saveState = 'idle';
			saveError = null;
		}
	}

	function downloadName(name: string) {
		return `${name.replace(/\.pdf$/i, '') || 'document'} (encrypted).pdf`;
	}

	async function submit() {
		if (!canSubmit || !file) return;
		saveState = 'saving';
		saveError = null;
		try {
			const blob = await encryptPdf(file, password, algorithm);
			downloadBlob(blob, downloadName(file.name));
			saveState = 'done';
		} catch (error) {
			console.error('Failed to encrypt PDF', error);
			saveState = 'error';
			saveError = error instanceof Error ? error.message : 'Something went wrong.';
		}
	}
</script>

{#if !file}
	<Dropzone
		title="Drop a PDF to encrypt, or click to browse"
		description="The file is sent to the server only to be encrypted, then returned."
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
								<Lock class="size-7" />
							</div>
						</div>
					</div>
					<p class="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
						Locks your PDF with a password
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
				<fieldset class="space-y-2">
					<legend class={sectionLabel}>Encryption type</legend>
					<div class="grid gap-2" role="radiogroup" aria-label="Encryption type">
						{#each algorithms as option (option.value)}
							<button
								type="button"
								role="radio"
								aria-checked={algorithm === option.value}
								disabled={!option.supported}
								onclick={() => {
									algorithm = option.value;
									clearStatus();
								}}
								class={cn(
									'flex flex-col items-start gap-1 border bg-background p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
									!option.supported
										? 'cursor-not-allowed border-border opacity-50'
										: algorithm === option.value
											? 'border-primary bg-primary/10'
											: 'border-border hover:border-primary/50'
								)}
							>
								<span class="flex items-center gap-2 text-sm font-medium">
									{option.name}
									{#if option.recommended}
										<Badge variant="secondary">Recommended</Badge>
									{:else if !option.supported}
										<Badge variant="outline">Soon</Badge>
									{/if}
								</span>
								<span class="text-xs text-muted-foreground">{option.description}</span>
							</button>
						{/each}
					</div>
					<p class="text-xs text-muted-foreground">Only AES-256 is available in this version.</p>
				</fieldset>

				<div class="space-y-2">
					<span class={sectionLabel}>Password</span>
					<div class="relative">
						<Input
							id="pdf-password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							oninput={clearStatus}
							placeholder="Choose a password"
							autocomplete="new-password"
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
					<div class="relative">
						<Input
							id="pdf-password-confirm"
							type={showConfirm ? 'text' : 'password'}
							bind:value={confirm}
							oninput={clearStatus}
							placeholder="Confirm password"
							autocomplete="new-password"
							aria-invalid={mismatch}
							class="pr-10"
						/>
						<button
							type="button"
							onclick={() => (showConfirm = !showConfirm)}
							aria-label={showConfirm ? 'Hide password' : 'Show password'}
							class="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
						>
							{#if showConfirm}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</button>
					</div>
					{#if mismatch}
						<p class="text-xs text-destructive">Passwords don’t match.</p>
					{/if}
				</div>

				{#if saveState === 'done'}
					<div
						class="flex items-start gap-2 border border-primary/40 bg-primary/10 p-3 text-sm text-foreground"
					>
						<CircleCheck class="mt-0.5 size-4 shrink-0 text-primary" />
						<span>Encrypted PDF downloaded.</span>
					</div>
				{:else if saveState === 'error'}
					<div
						class="flex items-start gap-2 border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
					>
						<TriangleAlert class="mt-0.5 size-4 shrink-0 text-destructive" />
						<span>{saveError}</span>
					</div>
				{/if}

				<Button type="submit" class="mt-auto w-full justify-center" disabled={!canSubmit}>
					{#if saveState === 'saving'}
						<LoaderCircle class="animate-spin" />
						Encrypting…
					{:else}
						<Lock />
						Encrypt PDF
					{/if}
				</Button>
			</form>
		</div>
	</div>
{/if}
