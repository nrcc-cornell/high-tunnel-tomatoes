<script lang="ts">
	import LocationPicker from "./components/locationPicker/LocationPicker.svelte";
  import ToolOptions from "./components/options/ToolOptions.svelte";
	import { soilCharacteristics, waterData } from "./store/store";

	$: console.log($soilCharacteristics);
	$: console.log($waterData);
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