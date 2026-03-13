<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<div class="flex flex-col items-center justify-center h-full gap-4">
	<h1 class="text-4xl font-bold">{page.status}</h1>
	<p class="text-base-content/70">{page.error?.message ?? 'Something went wrong'}</p>
	<a href={resolve('/')} class="btn btn-primary">Go home</a>
</div>
