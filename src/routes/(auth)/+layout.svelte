<script lang="ts">
	let { children } = $props();
</script>

<div class="main-content-no-nav flex h-full flex-col">
	{@render children()}
</div>
