<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CopyIcon, CheckIcon } from 'phosphor-svelte';
	import { confidenceClass } from '$lib/utils';

	interface Props {
		name: string;
		quantity: number | null;
		unit?: string | null;
		confidence?: number | null;
		actions?: Snippet;
		copyable?: boolean;
	}

	let { name, quantity, unit, confidence, actions, copyable = false }: Props = $props();

	let copied = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	async function copyQuantity() {
		if (quantity == null) return;
		await navigator.clipboard.writeText(String(quantity));
		copied = true;
		if (copyTimeout) clearTimeout(copyTimeout);
		copyTimeout = setTimeout(() => {
			copied = false;
		}, 1500);
	}
</script>

<div class="flex rounded-xl border border-base-content/10">
	<div class="w-1.5 shrink-0 rounded-l-xl {confidenceClass(confidence)}"></div>
	<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
		<div class="flex items-center justify-between gap-2">
			<span class="font-medium">{name}</span>
			{#if copyable}
				<button
					type="button"
					class="badge gap-1 min-w-16 justify-center transition-colors {copied
						? 'badge-success'
						: 'badge-neutral'} active:scale-95"
					onclick={copyQuantity}
				>
					{quantity ?? '—'}
					{#if copied}
						<CheckIcon size={12} weight="bold" />
					{:else}
						<CopyIcon size={12} />
					{/if}
				</button>
			{:else}
				<span class="badge min-w-12 justify-center badge-neutral">{quantity ?? '—'}</span>
			{/if}
		</div>
		{#if unit}
			<span class="text-xs text-base-content/60">{unit}</span>
		{/if}
	</div>
	{#if actions}
		<div class="flex items-start pt-3 pr-3">
			{@render actions()}
		</div>
	{/if}
</div>
