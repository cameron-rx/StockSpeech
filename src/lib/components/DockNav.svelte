<script lang="ts">
	import { resolve } from '$app/paths';
	import { ChartBar, Storefront, Gear } from 'phosphor-svelte';
	import DockNavItem from './DockNavItem.svelte';
</script>

<div class="dock">
	<DockNavItem href={resolve('/')} label="Counts">
		{#snippet icon()}
			<ChartBar class="size-[1.2em]" weight="regular" />
		{/snippet}
	</DockNavItem>

	<DockNavItem href={resolve('/products')} label="Products">
		{#snippet icon()}
			<Storefront class="size-[1.2em]" weight="regular" />
		{/snippet}
	</DockNavItem>

	<DockNavItem href={resolve('/settings')} label="Settings">
		{#snippet icon()}
			<Gear class="size-[1.2em]" weight="regular" />
		{/snippet}
	</DockNavItem>
</div>
