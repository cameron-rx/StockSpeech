<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import favicon from '$lib/assets/favicon.svg';
	import DockNav from '$lib/components/DockNav.svelte';

	let { data, children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

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
	<link rel="icon" href={favicon} />
	{@html webManifestLink}
</svelte:head>

<div class="safe-layout flex h-screen flex-col">
	<main
		class="main-content relative flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain pb-24"
	>
		{@render children()}
	</main>

	{#if page.url.pathname !== '/login'}
		<DockNav />
	{/if}
</div>
