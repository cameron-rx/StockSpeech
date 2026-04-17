<script lang="ts">
	import { page } from '$app/state';
	import DockNav from '$lib/components/DockNav.svelte';

	let { children } = $props();

	const hideNav = $derived(page.url.pathname.endsWith('/record'));
</script>

<div class="flex h-full flex-col">
	<div
		class="relative flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
		class:main-content={!hideNav}
		class:main-content-no-nav={hideNav}
	>
		{@render children()}
	</div>

	{#if !hideNav}
		<DockNav />
	{/if}
</div>
