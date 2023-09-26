<script lang="ts">
	import { onMount, onDestroy, getContext, setContext } from 'svelte';
	import { divIcon, point, marker } from 'leaflet';

	export let width: number;
	export let height: number;
	export let latLng: L.LatLngExpression;
	export let handleMarkerClick = (e) => null;
	export let handleMarkerContextMenu = (e) => null;

	let leafMarker: L.Marker | undefined;
	let markerElement: HTMLElement;

	const { getMap }: { getMap: () => L.Map | undefined } = getContext('map');
	const map = getMap();

	setContext('layer', {
		// L.Marker inherits from L.Layer
		getLayer: () => leafMarker
	});

	onMount(() => {
		if (map) {
			let icon = divIcon({
				html: markerElement,
				className: 'map-marker',
				iconSize: point(width, height),
				iconAnchor: [width / 2, height]
			});
			leafMarker = marker(latLng, {
				icon,
				riseOnHover: true
			}).addTo(map);
			leafMarker.on('click', handleMarkerClick)
			leafMarker.on('contextmenu', handleMarkerContextMenu)
		}
	});

	onDestroy(() => {
		leafMarker?.remove();
		leafMarker = undefined;
	});
</script>

<div bind:this={markerElement}>
	{#if leafMarker}
		<slot />
	{/if}
</div>