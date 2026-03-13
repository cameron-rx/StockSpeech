<script lang="ts">
	import CountCard from '$lib/components/CountCard.svelte';
	import { PlusIcon } from 'phosphor-svelte';

	const exampleCounts = [
		{
			name: 'Bar Weekly Count',
			userName: 'Ben',
			completed: false,
			date: new Date('2026-03-13'),
			id: '1'
		},
		{
			name: 'Kitchen Weekly Count',
			userName: 'Sam',
			completed: true,
			date: new Date('2026-03-12'),
			id: '2'
		},
		{
			name: 'Bar Weekly Count',
			userName: 'John',
			completed: true,
			date: new Date('2026-03-11'),
			id: '3'
		}
	];
</script>

<div class="mx-4 my-4 flex h-auto w-auto flex-col gap-8">
	{#each exampleCounts as count}
		<CountCard {...count} />
	{/each}
</div>

<div class="fab bottom-20">
	<button class="btn btn-circle btn-lg btn-primary">
		<PlusIcon weight="bold"></PlusIcon>
	</button>
</div>
