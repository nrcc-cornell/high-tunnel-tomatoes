<script lang="ts">
	import { onMount, onDestroy, setContext, createEventDispatcher } from 'svelte';
	import type { LocationObj } from '../../global';
	import { tileLayer, map} from 'leaflet';
	import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
	import 'leaflet/dist/leaflet.css';
	import 'leaflet-geosearch/dist/geosearch.css';

	export let bounds: L.LatLngBoundsExpression | undefined = undefined;
	export let view: L.LatLngExpression | undefined = undefined;
	export let zoom: number | undefined = undefined;
	export let locations: LocationObj[] | undefined = undefined;
	export let handleMapClick = (e) => null;

	const dispatch = createEventDispatcher();

	let leafMap: L.Map | undefined;
	let mapElement: HTMLElement;

	onMount(() => {
		if (!bounds && (!view || !zoom) && !locations) {
			throw new Error('Must set either bounds, view and zoom, or locations.');
		}

		leafMap = map(mapElement)
			// example to expose map events to parent components:
			.on('zoom', (e) => dispatch('zoom', e));

		tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,&copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`
		}).addTo(leafMap);

		const provider = new OpenStreetMapProvider();
		leafMap.addControl(GeoSearchControl({ provider, style: 'bar' }));

		leafMap.on('click', handleMapClick);
	});

	onDestroy(() => {
		leafMap?.remove();
		leafMap = undefined;
	});

	setContext('map', {
		getMap: () => leafMap
	});

	$: if (leafMap) {
		if (bounds) {
			leafMap.fitBounds(bounds);
		} else if (view && zoom) {
			leafMap.setView(view, zoom);
		} else if (locations) {
			const boundsObj = locations.reduce((acc, loc) => {
				if (loc.lat < acc.ll.lat) acc.ll.lat = loc.lat;
				if (loc.lon < acc.ll.lon) acc.ll.lon = loc.lon;
				if (loc.lat > acc.ur.lat) acc.ur.lat = loc.lat;
				if (loc.lon > acc.ur.lon) acc.ur.lon = loc.lon;
				return acc;
			}, { ll: { lat: 999, lon: 999}, ur: { lat: -999, lon: -999 }});

			leafMap.fitBounds([
				[boundsObj.ll.lat, boundsObj.ll.lon],
				[boundsObj.ur.lat, boundsObj.ur.lon]
			], {
				paddingTopLeft: [10,15],
				paddingBottomRight: [10,5]
			});
		}
	}

	console.log('end of script: leaflet');
</script>

<div style="width: 80%; height: 100%; margin: 0 auto;" bind:this={mapElement}>
	{#if leafMap}
		<slot />
	{/if}
</div>