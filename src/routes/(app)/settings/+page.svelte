<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<h2>{data.fullName}</h2>

<form method="POST" action="?/logout" use:enhance>
	<button type="submit" class="btn btn-outline btn-sm btn-error">Log out</button>
</form>
