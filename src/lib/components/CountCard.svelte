<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		name: string;
		userName: string;
		completed: boolean;
		date: Date;
		id: string;
	}

	let { name, userName, completed, date, id }: Props = $props();
</script>

<div class="card w-full bg-base-100 p-2 shadow-sm card-xs">
	<div class="card-body">
		<div class="flex flex-row justify-between">
			<h2 class="card-title">{name}</h2>
			<div class="badge {completed ? 'badge-success' : 'badge-warning'}">
				{completed ? 'Completed' : 'In Progress'}
			</div>
		</div>
		<p>{userName}</p>
		<p>{date.toLocaleDateString()}</p>

		<a href={resolve(`/count/${id}`)} class="btn btn-outline btn-sm">View</a>
	</div>
</div>
