<script lang="ts">
	import LineChart from "./components/LineChart.svelte";
	import LocationPicker from "./components/locationPicker/LocationPicker.svelte";
  import ToolOptions from "./components/options/ToolOptions.svelte";
	import { soilCharacteristics, waterData, wdmOutput } from "./store/store";

	$: console.log('APP SOILCHARACTERISTICS: ', $soilCharacteristics);
	$: console.log('APP WATERDATA: ', $waterData);
	$: console.log('APP WDMOUTPUT: ', $wdmOutput);




	// no forecast because locHourly doesnt give daily precip...can get from runoff risk if necessary



	// handle when no soil data
	// handle out of season

	// Need input for planting date

  // Remove unneccessary comments and update todo doc

  // set up loading screen when initializing
  // make sure loading is displayed when an options change or location change occurs until the data is ready for display
  
  // work on fertilization events
  // work on nitrogen stuff




</script>

<main>
	{#if $wdmOutput}
		<LineChart
			data={{
				labels: $wdmOutput.dates.map(d => d.slice(5).replace('-','/')),
				datasets: [{
					label: 'Water Deficit',
					data: $wdmOutput.deficitsInches,
					pointBackgroundColor: $wdmOutput.deficitsInchesPntColors,
					borderColor: 'rgb(0,0,0)',
					borderWidth: 1
				}]
			}}
			options={{
				plugins: { 
					annotation: $wdmOutput.annotations,
				},
				scales: {
					y: {
						title: { 
							display: true,
							text: 'Water Deficit (in/18in soil)'
						},
					}
				}
			}}
		/>
	{/if}
	<h1>High Tunnel Tomatoes</h1>
	<LocationPicker />
	<ToolOptions />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}
</style>