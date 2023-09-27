<script lang="ts">
	import { activeLocation, locations, isLoadingLocation } from "../../store";
	import { onMount } from "svelte";

	import Leaflet from './Leaflet.svelte';
	import Marker from './Marker.svelte';
	import Tooltip from './Tooltip.svelte';
	import RedPin from './pin-red.svelte';
	import BluePin from './pin-blue.svelte';
  import Button from "../Button.svelte";
	import Loading from "../Loading.svelte";

	import { loadLocations, addLocation, updateActiveLocation, removeLocation } from "./handleStorage";
	
	onMount(() => {
		const { storedLocations, storedActiveLocation } = loadLocations();
		if (storedLocations && storedActiveLocation) {
			$locations = storedLocations;
			$activeLocation = storedActiveLocation;
		} else {
			modalOpen = true;
			modalLocked = true;
		}
	})

	const ALLOWED_STATES = {
		'Maine': 'ME',
		'Vermont': 'VT',
		'New Hampshire': 'NH',
		'Rhode Island': 'RI',
		'Massachusetts': 'MA',
		'Connecticut': 'CT',
		'New York': 'NY',
		'Pennsylvania': 'PA',
		'New Jersey': 'NJ',
		'Delaware': 'DE',
		'Maryland': 'MD',
		'West Virginia': 'WV',
	};
	function handleMapClick(e) {
		console.log('here');
		$isLoadingLocation = true;
		fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`)
			.then(response => { 
				if (!response.ok) throw 'Reverse Geocode Error';
				else return response.json();
			})
			.then(responseJson =>{
				console.log(responseJson);
				if (Object.keys(ALLOWED_STATES).includes(responseJson.address.state)) {
					const { house_number, road, state, county } = responseJson.address;

					let shortAddress;
					if (house_number) {
						shortAddress = `${house_number} ${road}`;
					} else if (road) {
						shortAddress = road;
					} else {
						shortAddress = 'Unknown Address';
					}

					let municipality;
					try {
						municipality = responseJson.display_name.split(' of ')[1].split(', ')[0];
					} catch {
						try {
							const pieces = responseJson.display_name.split('County')[0].split(', ');
							pieces.pop();
							municipality = pieces.pop();
						} catch {
							municipality = county ? county : null;
						}
					}

					let fullAddress;
					if (municipality) {
						fullAddress = `${shortAddress}, ${municipality}, ${ALLOWED_STATES[responseJson.address.state]}`;
					} else {
						fullAddress = `${shortAddress}, ${ALLOWED_STATES[responseJson.address.state]}`;
					}

					const newLoc = {
						shortAddress,
						fullAddress,
						lat: parseFloat(responseJson.lat),
						lon: parseFloat(responseJson.lon),
						id: String(new Date().getTime())
					};

					const newLocs = addLocation($locations, newLoc);
					if (newLocs) {
						$locations = newLocs;
						$activeLocation = updateActiveLocation(newLoc);
						toggleModal(true);
						badMessage = '';
					} else {
						badMessage = 'You already have a pin at that location. Please click the pin to select it again.';
					}
				} else {
					badMessage = 'Selected location was out of bounds. Please select a location within the outlined states.';
				}

				$isLoadingLocation = false;
			})
			.catch((e) => {
				console.log(e);
				badMessage = 'An error occurred finding that location. Please make sure you are selecting land within one of the outlined states.';
				$isLoadingLocation = false;
			});
	}

	function handleMarkerClick(changeToLoc) {
		if (changeToLoc.id !== $activeLocation.id) {
			$activeLocation = updateActiveLocation(changeToLoc);
			toggleModal(true);
			badMessage = '';
		}
	}

	function handleMarkerRemove(removeLoc) {
		if (removeLoc.id !== $activeLocation.id) {
			const newLocs = removeLocation($locations, removeLoc);
			$locations = newLocs;
			badMessage = '';
		}
	}

	function toggleModal(unlockModal=false) {
		if (unlockModal) {
			modalLocked = false;
		}
		
		if (!modalLocked) {
			modalOpen = !modalOpen;
		}
	}

	function handleEsc(e) {
		if (e.keyCode === 27 && modalOpen) {
			toggleModal();
		}
	}

	let badMessage = '';
	let modalOpen = false;
	let modalLocked = false;
</script>

<div class="location-picker-display">
	<h3 class="location-picker-address">{$activeLocation?.shortAddress}</h3>
	<Button onClick={toggleModal}>Change Location</Button>
</div>

{#if modalOpen}
	<div class="location-picker-modal" on:click={() => toggleModal()} on:keydown={handleEsc}>
		<div class="location-picker-modal-content" on:click|stopPropagation on:keydown={handleEsc}>
			<Leaflet
				locations={$locations}
				bounds={$locations ? undefined : [[37.20, -82.70], [47.60, -66.90]]}
				{handleMapClick}
			>
				{#if $locations}
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
				{/if}
			</Leaflet>
			{#if modalLocked && modalOpen}
				<div class='message'><p>Select your high tunnel location to get started</p></div>
			{/if}
			{#if badMessage}
				<div class='message'><p>{badMessage}</p></div>
			{/if}
			{#if $isLoadingLocation}
				<Loading />
			{/if}
		</div>
	</div>
{/if}

<style>
	.location-picker-display {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.location-picker-address {
		font-size: 1.2em;
		color: #595959;
	}

	.location-picker-modal {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(150,150,150,0.7);
	}
	
	.location-picker-modal-content {
		position: relative;
		width: 90%;
		min-width: 300px;
		max-width: 1000px;
		height: 90%;
		min-height: 400px;
		max-height: 800px;
	}

	.message {
		background-color: white;
		padding: 0px 20px;
		font-size: 1.2em;
		border-radius: 6px;
		border: 1px solid #595959;
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 400;
	}
</style>