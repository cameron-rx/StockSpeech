<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name,
		subtext,
		href,
		actions
	}: {
		name: string;
		subtext?: string;
		href?: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="flex rounded-xl border border-base-content/10">
	<div class="w-1.5 shrink-0 rounded-l-xl bg-primary"></div>
	<svelte:element this={href ? 'a' : 'div'} {href} class="flex flex-1 flex-col justify-center gap-2 px-4 py-3">
		<span class="text-lg font-bold">{name}</span>
		{#if subtext}
			<span class="text-xs text-base-content/60">{subtext}</span>
		{/if}
	</svelte:element>
	{#if actions}
		<div class="flex flex-col items-end gap-1 py-3 pr-3">
			{@render actions()}
		</div>
	{/if}
</div>
