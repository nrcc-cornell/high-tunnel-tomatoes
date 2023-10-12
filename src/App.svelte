<script lang="ts">
  import LineCharts from "./components/LineCharts.svelte";
  import Loading from "./components/Loading.svelte";
	import LocationPicker from "./components/locationPicker/LocationPicker.svelte";
  import ToolOptions from "./components/options/ToolOptions.svelte";
	import { soilCharacteristics, waterData, nutrientData, isLoadingData, devOptions, userOptions } from "./store/store";

	$: console.log('APP SOILCHARACTERISTICS: ', $soilCharacteristics);
	$: console.log('APP WATERDATA: ', $waterData);
	$: console.log('APP NUTRIENTDATA: ', $nutrientData);
	$: console.log('APP DEVOPTIONS: ', $devOptions);
	$: console.log('APP USEROPTIONS: ', $userOptions);
	$: console.log('APP ISLOADINGDATA: ', JSON.stringify($isLoadingData, null, 2));

</script>

<main>
	<h1>High Tunnel Tomatoes</h1>
	
	<LocationPicker />
	<ToolOptions />
	<LineCharts />

	{#if Object.values($isLoadingData).includes(true)}
		<Loading />
	{:else if !$soilCharacteristics}
		<div class='no-soil-data'>Soil data could not be loaded for this location. Please try a different location.</div>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
		min-width: 360px;
		box-sizing: border-box;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.no-soil-data {
		font-style: italic;
		font-size: 24px;
		color: rgb(150,150,150);
		margin-top: 30px;
	}

	:global(.scroll-shadows) {
    overflow-y: auto;
    border: 1px solid rgb(220,220,220);

    background:
      /* Shadow Cover TOP */
      linear-gradient(
        white 20%,
        rgba(255, 255, 255, 0)
      ) center top,
      
      /* Shadow Cover BOTTOM */
      linear-gradient(
        rgba(255, 255, 255, 0), 
        white 80%
      ) center bottom,
      
      /* Shadow TOP */
      linear-gradient(
        rgba(100, 100, 100, 0.3) 20%,
        rgba(0, 0, 0, 0)
      ) center top,
      
      /* Shadow BOTTOM */
      linear-gradient(
        rgba(0, 0, 0, 0) 20%,
        rgba(100, 100, 100, 0.3)
      ) center bottom;
    
    background-repeat: no-repeat;
    background-size: 100% 40px, 100% 40px, 100% 14px, 100% 14px;
    background-attachment: local, local, scroll, scroll;
  }
</style>