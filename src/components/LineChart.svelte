<script>
  import { Chart } from 'svelte-chartjs';
  
  import annotationPlugin from 'chartjs-plugin-annotation';
  import zoomPlugin from 'chartjs-plugin-zoom';
  import {
    Chart as ChartJS,
    CategoryScale,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip
  } from 'chart.js';

  import Button from './Button.svelte';

  ChartJS.register(
    annotationPlugin,
    CategoryScale,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
    zoomPlugin
  );

  export let data;
  export let options;

  $: allOptions = {
    plugins: { 
      tooltip: {
        titleColor: 'black',
        bodyColor: 'black',
        borderColor: 'black',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.95)'
      },
      zoom: {
        zoom: {
          drag: { enabled: true },
          mode: 'x'
        }
      },
      ...options?.plugins
    },
    elements: { point: { hitRadius: 10 }},
    scales: {
      x: { grid: { drawOnChartArea: false }, ticks: { maxTicksLimit: 20 } },
      y: {
        grid: { drawOnChartArea: false },
        ...options?.scales?.y
      }
    },
    transitions: {
      zoom: {
        animation: {
          duration: 1000,
          easing: 'easeOutCubic'
        }
      }
    },
    maintainAspectRatio: false
  };

  let chart;
  $: console.log(chart ? chart : null);
</script>

<div class='chart-container'>
  <Chart bind:chart type="line" {data} options={allOptions} />
  <div class="btn-container"><Button onClick={() => chart.resetZoom()}>Reset Zoom</Button></div>
</div>

<style lang="scss">
  .chart-container {
    position: relative;
    height: 400px;
    width: 100%;
    min-width: 400px;
    max-width: 1000px;
    margin: 0 auto;

    .btn-container {
      display: flex;
      justify-content: center;
    }
  }
</style>