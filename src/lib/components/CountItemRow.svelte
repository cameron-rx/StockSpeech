<script lang="ts">
	import type { Snippet } from 'svelte';
	import { confidenceClass } from '$lib/utils';
	import ActionDropdown from './ActionDropdown.svelte';

	interface Props {
		name: string;
		quantity: number | null;
		unit?: string | null;
		confidence?: number | null;
		actions?: Snippet;
	}

	let { name, quantity, unit, confidence, actions }: Props = $props();
</script>

<div class="flex rounded-xl border border-base-content/10">
	<div class="w-1.5 shrink-0 rounded-l-xl {confidenceClass(confidence)}"></div>
	<div class="flex flex-1 flex-col justify-center gap-1 px-4 py-3">
		<div class="flex items-center justify-between gap-2">
			<span class="font-medium">{name}</span>
			<span class="badge min-w-12 justify-center badge-neutral">{quantity ?? '—'}</span>
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
