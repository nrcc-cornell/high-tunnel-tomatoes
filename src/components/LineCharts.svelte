<script lang="ts">
  import { nutrientData, waterData } from "../store/store";
  
  import LineChart from "./LineChart.svelte";
  import FixedTooltip from "./FixedTooltip.svelte";

  function constructLineChartProps(
    dataKey: ('vwc' | 'tin'),
    datasetLabel: string,
    yAxisLabel: string,
    showResetZoomBtn: boolean
  ) {
    const { fcstLength } = $waterData;
    const data = $nutrientData[dataKey];
    const dataLength = data.length;

    const observed = data.slice(0, dataLength - fcstLength).concat(new Array(fcstLength).fill(null));
    const forecasted = new Array(dataLength - fcstLength).fill(null).concat(data.slice(dataLength - fcstLength));

    const plugins = $nutrientData[`${dataKey}Annotations`] ? { annotation: $nutrientData[`${dataKey}Annotations`] } : {};
    const pointBackgroundColor = $nutrientData[`${dataKey}PntColors`] || 'black';
    const pointBorderColor = $nutrientData[`${dataKey}PntBorders`] ? $nutrientData[`${dataKey}PntBorders`].borderColors : 'black';
    const pointBorderWidth = $nutrientData[`${dataKey}PntBorders`] ? $nutrientData[`${dataKey}PntBorders`].borderWidths : 0;

    const labels = $nutrientData.dates.map(d => d.slice(5).replace('-','/'));

    return {
      data: {
        labels,
        datasets: [{
          label: `${datasetLabel} Observed`,
          data: observed,
          pointBackgroundColor,
          pointBorderColor,
          pointBorderWidth,
          borderColor: 'rgb(0,0,0)',
          borderWidth: 1
        },{
          label: `${datasetLabel} Forecast`,
          data: forecasted,
          pointBackgroundColor,
          borderColor: 'rgb(0,0,0)',
          borderWidth: 1,
          borderDash: [6,6]
        }]
      },
      options: {
        plugins,
        scales: {
          y: {
            title: { 
              display: true,
              text: yAxisLabel
            },
          }
        }
      },
      showResetZoomBtn
    };
  }
</script>

<div class='line-charts-container'>
  {#if $nutrientData}
    <LineChart {...constructLineChartProps('tin', 'Inorganic Nitrogen', 'Inorganic Nitrogen (ppm)', true)} />
    <LineChart {...constructLineChartProps('vwc', 'VWC', `Volumetric Water Content (in\u00B3/ in\u00B3)`, false)} />
	{/if}
  <FixedTooltip />
</div>

<style lang="scss">
  .line-charts-container {
    position: relative;
  }
</style>