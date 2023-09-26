<script lang="ts">
	import { activeLocation, locations } from "../../store";
	import { onMount } from "svelte";

	import Leaflet from './Leaflet.svelte';
	import Marker from './Marker.svelte';
	import Tooltip from './Tooltip.svelte';
	import RedPin from './pin-red.svelte';
	import BluePin from './pin-blue.svelte';

	import { loadLocations, addLocation, updateActiveLocation, removeLocation } from "./handleStorage";
	
	onMount(() => {
		const { storedLocations, storedActiveLocation } = loadLocations();
		if (storedLocations && storedActiveLocation) {
			$locations = storedLocations;
			$activeLocation = storedActiveLocation;
		}
	})

	function handleMapClick(e) {
		fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`)
			.then(response => { 
				if (!response.ok) throw 'Reverse Geocode Error';
				else return response.json();
			})
			.then(responseJson =>{
				if (responseJson.address.state === 'New York') {
					const houseNum = responseJson.address.house_number;
					const roadName = responseJson.address.road;
					console.log(responseJson);
					let townCityVillage;
					try {
						townCityVillage = responseJson.display_name.split(' of ')[1].split(', ')[0];
					} catch {
						const pieces = responseJson.display_name.split('County')[0].split(', ');
						pieces.pop();
						townCityVillage = pieces.pop();
					}

					const shortAddress = houseNum ? `${houseNum} ${roadName}` : roadName;
					const newLoc = {
						shortAddress: shortAddress,
						fullAddress: `${shortAddress}, ${townCityVillage}, NY`,
						lat: parseFloat(responseJson.lat),
						lon: parseFloat(responseJson.lon),
						id: String(new Date().getTime())
					};

					const newLocs = addLocation($locations, newLoc);
					if (newLocs) {
						$locations = newLocs;
						$activeLocation = updateActiveLocation(newLoc);
					}
				}
			})
			.catch((e) => console.log(e));
	}

	function handleMarkerClick(changeToLoc) {
		if (changeToLoc.id !== $activeLocation.id) {
			$activeLocation = updateActiveLocation(changeToLoc);
		}
	}

	function handleMarkerRemove(removeLoc) {
		if (removeLoc.id !== $activeLocation.id) {
			const newLocs = removeLocation($locations, removeLoc);
			$locations = newLocs;
		}
	}


	$: console.log($locations);


	// on map click:
	// // make sure there is a loading animation while waiting for response
	
	
	// Changes once there is a working, changable location picker:
	// // if just default marker on load, have zoom be north east
	// // do not have a default location
	// // if no locations, force the user to select a location before going to UI
	// // on map click:
	// // // make sure to close location changer when we have the new location
	// // on marker click:
	// // // close location changer
</script>

<div class="w-full h-screen">
	<Leaflet
		locations={$locations}
		{handleMapClick}
	>
		{#each $locations as loc (loc.id)}
			<Marker
				latLng={[loc.lat, loc.lon]}
				width={15}
				height={30}
				handleMarkerClick={() => handleMarkerClick(loc)}
				handleMarkerContextMenu={() => handleMarkerRemove(loc)}
			>
				{#if loc.id === $activeLocation.id}
					<RedPin />
					<Tooltip isActive={true}>{loc.fullAddress}</Tooltip>
				{:else}
					<BluePin />
					<Tooltip>{loc.fullAddress}</Tooltip>
				{/if}
			</Marker>
		{/each}
	</Leaflet>
</div>

<style>
	.w-full {
		width: 100%;
	}

	.h-screen {
		height: 70vh;
		min-height: 400px;
	}
</style>