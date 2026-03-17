<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		name: string;
		userName: string;
		completed: boolean;
		date: Date;
		id: string;
		productListName?: string | null;
	}

	let { name, userName, completed, date, id, productListName }: Props = $props();
</script>

<a href={resolve(`/count/${id}`)} class="card w-full bg-base-100 p-2 shadow-sm card-xs">
	<div class="card-body">
		<div class="flex flex-row justify-between">
			<h2 class="card-title">{name}</h2>
			<div class="flex flex-row justify-evenly gap-4">
				{#if productListName}
					<div class="badge badge-soft badge-primary">{productListName}</div>
				{/if}
				<div class="badge {completed ? 'badge-success' : 'badge-warning'}">
					{completed ? 'Completed' : 'In Progress'}
				</div>
			</div>
		</div>
		<p>{userName}</p>
		<p>{date.toLocaleDateString()}</p>
	</div>
</a>
