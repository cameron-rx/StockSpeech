<script lang="ts">
	import { enhance } from '$app/forms';
	import { venueState } from '$lib/state/venue.svelte';

	let { data } = $props();
</script>

<h1 class="text-4xl">Settings</h1>

<h2>{data.fullName}</h2>

<select
	class="select"
	value={venueState.value}
	onchange={(e) => venueState.set((e.target as HTMLSelectElement).value)}
>
	{#each data.venues as venue (venue.id)}
		<option value={venue.id}>{venue.name}</option>
	{/each}
</select>

<form method="POST" action="?/logout" use:enhance>
	<button type="submit" class="btn btn-outline btn-error btn-sm">Log out</button>
</form>
