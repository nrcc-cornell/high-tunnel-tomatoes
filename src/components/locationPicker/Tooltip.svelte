<script lang="ts">
	import { onMount, onDestroy, getContext } from 'svelte';
	import { point, tooltip } from 'leaflet';

	let leafTooltip: L.Tooltip | undefined;
	let tooltipElement: HTMLElement;
  
  export let isActive = false;

	let open = false;

	const { getLayer }: { getLayer: () => L.Layer | undefined } = getContext('layer');
	const layer = getLayer();

	onMount(() => {
		leafTooltip = tooltip({
      direction: 'bottom',
      className: 'tooltip-adjustment',
      permanent: isActive
    }).setContent(tooltipElement);

		if (layer) {
			layer.bindTooltip(leafTooltip);
			layer.on('tooltipopen', () => (open = true));
			layer.on('tooltipclose', () => (open = false));
		}
	});

	onDestroy(() => {
		layer?.unbindTooltip();
		leafTooltip?.remove();
		leafTooltip = undefined;
	});
</script>

<div bind:this={tooltipElement} class='tooltip-adjustment'>
	{#if open || isActive}
		<slot />
	{/if}
</div>

<style>
  :global(.tooltip-adjustment) {
    width: 125px;
    white-space: break-spaces;
  }
</style>