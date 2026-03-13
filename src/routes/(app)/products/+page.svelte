<script lang="ts">
	import ProductListCard from '$lib/components/ProductListCard.svelte';
	import { PlusIcon } from 'phosphor-svelte';

	const exampleProductLists = [
		{
			name: 'Bar Stock',
			userName: 'Ben',
			id: '1'
		},
		{
			name: 'Kitchen Stock',
			userName: 'Sam',
			id: '2'
		}
	];
</script>

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-8">
	{#each exampleProductLists as productList}
		<ProductListCard {...productList} />
	{/each}
</div>

<div class="fab bottom-20">
	<button class="btn btn-circle btn-lg btn-primary">
		<PlusIcon weight="bold"></PlusIcon>
	</button>
</div>
