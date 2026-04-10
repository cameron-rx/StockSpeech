<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		name,
		completed,
		userName,
		date,
		href,
		actions
	}: {
		name: string;
		completed: boolean;
		userName: string;
		date: Date;
		href?: string;
		actions: Snippet;
	} = $props();

	function relativeTime(d: Date): string {
		const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
		if (seconds < 60) return 'Just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}hr ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
		const weeks = Math.floor(days / 7);
		return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
	}
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
			{userName}<br />{relativeTime(date)}
		</span>
	</svelte:element>
	<div class="flex flex-col items-end gap-1 py-3 pr-3">
		{@render actions()}
	</div>
</div>
