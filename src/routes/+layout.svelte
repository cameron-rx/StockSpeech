<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { pwaAssetsHead } from 'virtual:pwa-assets/head';
	import DockNav from '$lib/components/DockNav.svelte';

	let { data, children } = $props();

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});

	onMount(() => {
		const { data: { subscription } } = data.supabase.auth.onAuthStateChange(
			(event, session) => {
				if (session?.expires_at !== data.session?.expires_at) {
					invalidate('supabase:auth');
				}
			}
		);

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	{#if pwaAssetsHead.themeColor}
		<meta name="theme-color" content={pwaAssetsHead.themeColor.content} />
	{/if}
	{#each pwaAssetsHead.links as link (link.href)}
		<link {...link} />
	{/each}
	{#if pwaInfo?.webManifest.href}
		<link rel="manifest" href={pwaInfo.webManifest.href} />
	{/if}
</svelte:head>

<div class="safe-layout flex h-screen flex-col">
	<main
		class="relative flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
		class:main-content={page.url.pathname !== '/login' && !page.url.pathname.endsWith('/record')}
		class:main-content-no-nav={page.url.pathname === '/login' || page.url.pathname.endsWith('/record')}
	>
		{@render children()}
	</main>

	{#if page.url.pathname !== '/login' && !page.url.pathname.endsWith('/record')}
		<DockNav />
	{/if}
</div>
