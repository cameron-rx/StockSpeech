<script lang="ts">
	import type { Snippet } from 'svelte';
	import { relativeTime } from '$lib/utils';

	let {
		name,
		completed,
		date,
		href,
		actions
	}: {
		name: string;
		completed: boolean;
		date: Date;
		href?: string;
		actions: Snippet;
	} = $props();
</script>

<div class="flex rounded-xl border border-base-content/10">
	<div class="w-1.5 shrink-0 rounded-l-xl {completed ? 'bg-success' : 'bg-warning'}"></div>
	<svelte:element
		this={href ? 'a' : 'div'}
		{href}
		class="flex flex-1 flex-col justify-center gap-2 px-4 py-3"
	>
		<div class="flex items-center justify-between gap-2">
			<span class="text-lg font-bold">{name}</span>
		</div>
		<span class="text-xs text-base-content/60">
			{relativeTime(date)}
		</span>
	</svelte:element>
	<div class="flex flex-col items-end gap-1 py-3 pr-3">
		{@render actions()}
	</div>
</div>
