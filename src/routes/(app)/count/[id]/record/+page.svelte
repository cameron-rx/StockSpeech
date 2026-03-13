<script lang="ts">
	import { resolve } from '$app/paths';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	let { data } = $props();
</script>

<Breadcrumbs crumbs={[{ label: 'Counts', href: resolve('/') }, { label: data.count.name, href: resolve(`/count/${data.count.id}`) }, { label: 'Record' }]} />

<div class="mx-4 my-4 flex flex-col gap-4">
	<h1 class="text-2xl font-bold">{data.count.name}</h1>
</div>
