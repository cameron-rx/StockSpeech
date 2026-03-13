<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import DockNav from '$lib/components/DockNav.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-dvh flex-col overflow-hidden">
	<main class="relative flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
		{@render children()}
	</main>

	{#if page.url.pathname !== '/login'}
		<DockNav />
	{/if}
</div>
