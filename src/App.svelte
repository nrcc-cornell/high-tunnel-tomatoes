<script lang="ts">
	import LocationPicker from "./components/locationPicker/LocationPicker.svelte";
  import ToolOptions from "./components/options/ToolOptions.svelte";
	import { soilCharacteristics, waterData, wdmOutput } from "./store/store";

	$: console.log('APP SOILCHARACTERISTICS: ', $soilCharacteristics);
	$: console.log('APP WATERDATA: ', $waterData);
	$: console.log('APP WDMOUTPUT: ', $wdmOutput);
</script>

<main>
	<h1>High Tunnel Tomatoes</h1>
	<LocationPicker />
	<ToolOptions />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>