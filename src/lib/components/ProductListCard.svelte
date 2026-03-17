<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		name: string;
		userName: string;
		id: string;
	}

	let { name, userName, id }: Props = $props();
</script>

<a href={resolve(`/products/${id}`)} class="card w-full bg-base-100 p-2 shadow-sm card-xs">
	<div class="card-body">
		<h2 class="card-title">{name}</h2>
		<p>{userName}</p>
	</div>
</a>
