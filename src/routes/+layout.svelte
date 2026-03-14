<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import favicon from '$lib/assets/favicon.svg';
	import DockNav from '$lib/components/DockNav.svelte';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

<div class="safe-layout flex h-dvh flex-col">
	<main class="main-content relative flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
		{@render children()}
	</main>

	{#if page.url.pathname !== '/login'}
		<DockNav />
	{/if}
</div>
