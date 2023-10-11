<script lang="ts">
	import { activeLocation, activeLocationId, locations, isLoadingLocation } from "../../store/store";
	import { onMount } from "svelte";

	import Leaflet from './Leaflet.svelte';
	import Marker from './Marker.svelte';
	import Tooltip from './Tooltip.svelte';
	import RedPin from './pin-red.svelte';
	import BluePin from './pin-blue.svelte';
  import Button from "../Button.svelte";
	import Loading from "../Loading.svelte";

	import { addLocationToStorage, removeLocationFromStorage, updateActiveLocationIdInStorage } from "../../lib/handleStorage";
  import Modal from "../Modal.svelte";
	
	let badMessage = '';
	let modalOpen = false;
	let modalLocked = false;
	function checkLocations() {
		if (!$activeLocation || !$locations) {
			modalOpen = true;
			modalLocked = true;
		}
	}
	$: $activeLocation, $locations, checkLocations();

	const isNum = (val) => new RegExp('^[0-9]+$').test(val);
	function parseAddress(address) {
		const pieces = address.split(', ');

		let shortAddress;
		if (isNum(pieces[0])) {
			const houseNumber = pieces.shift();
			const street = pieces.shift();
			shortAddress = `${houseNumber} ${street}`;
		} else {
			shortAddress = pieces.shift();
		}

		const stateIdx = pieces.findIndex(p => Object.keys(ALLOWED_STATES).includes(p));
		const muniPieces = pieces.slice(0,stateIdx);
		let municipality;
		if (muniPieces.length === 0) {
			municipality = '';
		} else if (muniPieces.length === 1) {
			municipality = muniPieces[0];
		} else {
			municipality = muniPieces.find(m => m.includes(' of ') || m.includes('County')) || '';
		}

		const fullAddress = municipality ? `${shortAddress}, ${municipality}, ${pieces[stateIdx]}` : `${shortAddress}, ${pieces[stateIdx]}`;
		return { shortAddress, fullAddress };
	}

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

	function handleAddLocation(addressStr, lat, lon) {
		try {
			const { shortAddress, fullAddress } = parseAddress(addressStr);
			const newLoc = {
				shortAddress,
				fullAddress,
				lat,
				lon,
				id: String(new Date().getTime())
			};
			const newLocs = addLocationToStorage($locations, newLoc);
			if (newLocs) {
				$locations = newLocs;
				$activeLocationId = updateActiveLocationIdInStorage(newLoc.id);
				toggleModal(true);
				badMessage = '';
			} else {
				badMessage = 'You already have a pin at that location. Please click the pin to select it again.';
			}
		} catch {
			badMessage = 'An error occurred while getting the address for this location. Please try again or select a different location.'
		}
	}

	function handleMapClick(e) {
		$isLoadingLocation = true;
		fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`, {
			headers: {
				'User-Agent': 'High Tunnel Tomatoes v0.1'
			}
		})
			.then(response => { 
				if (!response.ok) throw 'Reverse Geocode Error';
				else return response.json();
			})
			.then(responseJson =>{
				if (Object.keys(ALLOWED_STATES).includes(responseJson.address.state)) {
					handleAddLocation(responseJson.display_name, e.latlng.lat, e.latlng.lng);
				} else {
					badMessage = 'Selected location was out of bounds. Please select a location within the outlined states.';
				}
				$isLoadingLocation = false;
			})
			.catch((e) => {
				console.error('Failed location search: ', e);
				badMessage = 'An error occurred finding that location. Please make sure you are selecting land within one of the outlined states.';
				$isLoadingLocation = false;
			});
	}

	async function handleSearch(event, inputEl, provider) {
		$isLoadingLocation = true;
		event.preventDefault();
		try {
			let results = await provider.search({ query: inputEl.value });
			const result = results.find(({ label }) => {
				let inBounds = false;
				const stateList = Object.keys(ALLOWED_STATES);
				for (let i = 0; i < stateList.length; i++) {
					const state = stateList[i];
					if (label.includes(state)) {
						inBounds = true;
						break;
					}
				}
				return inBounds;
			});
			handleAddLocation(result.label, result.y, result.x);
		} catch {
			badMessage = 'Something went wrong while searching for that location. If this continues to be an issue please click on the map to select instead.';
		}
		$isLoadingLocation = false;
	}

	function handleMarkerClick(changeToId) {
		if (changeToId !== $activeLocationId) {
			$activeLocationId = updateActiveLocationIdInStorage(changeToId);
			toggleModal(true);
			badMessage = '';
		}
	}

	function handleMarkerRemove(removeId) {
		if (removeId !== $activeLocationId) {
			const newLocs = removeLocationFromStorage($locations, removeId);
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
</script>

<div class="location-picker-display">
	<h3 class="location-picker-address">{$activeLocation?.shortAddress}</h3>
	<Button onClick={toggleModal}>Change Location</Button>
</div>
<Modal open={modalOpen} handleClose={toggleModal}>
	<div class="location-picker-modal-content">
		<Leaflet
			locations={$locations}
			bounds={$locations ? undefined : [[37.20, -82.70], [47.60, -66.90]]}
			{handleMapClick}
			{handleSearch}
		>
			{#if $locations}
				{#each Object.values($locations) as loc (loc.id)}
					<Marker
						latLng={[loc.lat, loc.lon]}
						width={15}
						height={30}
						handleMarkerClick={() => handleMarkerClick(loc.id)}
						handleMarkerContextMenu={() => handleMarkerRemove(loc.id)}
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
			<Loading position='absolute'/>
		{/if}
	</div>
</Modal>

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

	.location-picker-modal-content {
		width: 90vw;
		min-width: 300px;
		max-width: 1000px;
		height: 90vh;
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