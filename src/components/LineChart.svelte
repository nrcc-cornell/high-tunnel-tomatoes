<script>
  import { Chart } from 'svelte-chartjs';
  import { onMount } from 'svelte';
  import { hoverXPos, hoverIdxPos, isZoomed } from '../store/store';
  
  import annotationPlugin from 'chartjs-plugin-annotation';
  import zoomPlugin from 'chartjs-plugin-zoom';
  import {
    Chart as ChartJS,
    CategoryScale,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
  } from 'chart.js';

  import Button from './Button.svelte';

  ChartJS.register(
    annotationPlugin,
    CategoryScale,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    zoomPlugin
  );

  export let data;
  export let plugins;
  export let yAxisLabel;
  export let showResetZoomBtn;

  let chart;

  const baseOptions = {
    plugins: {
      zoom: {
        zoom: {
          drag: {
            enabled: true,
            backgroundColor: 'rgba(150,150,150,0.5)'
          },
          mode: 'x',
          onZoomComplete({chart}) {
            $isZoomed = true;
            for (const k of Object.keys(ChartJS.instances)) {
              const c = ChartJS.instances[k];
              if (c.id !== chart.id && c.options.plugins.zoom.zoom) {
                c.options.scales.x.min = Math.trunc(chart.scales.x.min);
                c.options.scales.x.max = Math.trunc(chart.scales.x.max);
                c.update();
              }
            }
          }
        },
        limits: {
          x: {
            minRange: 10
          }
        }
      }
    },
    elements: { point: { hitRadius: 10 }},
    scales: {
      x: {
        grid: { drawOnChartArea: false },
        ticks: { maxTicksLimit: 20 }
      },
      y: {
        title: { 
          display: true,
          text: yAxisLabel
        },
        grid: { drawOnChartArea: false },
        afterFit: function(scaleInst) {
          scaleInst.width = 58;
        }
      }
    },
    transitions: {
      zoom: {
        animation: {
          duration: 300,
          easing: 'easeOutQuint'
        }
      }
    },
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  onMount(() => {
    if (!chart) return;
    const handleHover = (e) => {
      const point = chart.getElementsAtEventForMode(
        e,
        "index",
        {
          intersect: false
        },
        true
      );
      if (point[0]) {
        $hoverIdxPos = point[0].index;
        $hoverXPos = point[0].element.x;
      } else {
        $hoverIdxPos = null;
        $hoverXPos = null;
      }
    };

    function handleMouseOut() {
      $hoverIdxPos = null;
      $hoverXPos = null;
    }

    chart.canvas.onmousemove = handleHover;
    chart.canvas.onmouseout = handleMouseOut;
    chart.options.plugins = { ...chart.options.plugins, ...plugins };
    chart.options.scales.x.min = data.datasets[0].data.length - 30;
    chart.update();
  });

  function handleResetZoom() {
    for (const k of Object.keys(ChartJS.instances)) {
      const c = ChartJS.instances[k];
      c.options.scales.x.min = 0;
      c.options.scales.x.max = data.datasets[0].data.length - 1;
      c.update();
    }
    $isZoomed = false;
  }

  function updatePlugins() {
    if (plugins && chart) {
      chart.options.plugins = { ...chart.options.plugins, ...plugins };
      chart.update();
    }
  }
  $: plugins, updatePlugins();
</script>

<div class='chart-container'>
  <Chart bind:chart type="line" {data} options={baseOptions} plugins={[{
    afterDraw: chart => {
      const x = $hoverXPos;
      if (x !== null) {               
        let yAxis = chart.scales.y;
        let ctx = chart.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#FFF4949';
        ctx.setLineDash([3,3]);
        ctx.stroke();
        ctx.restore();
      }
    }
  },{
    beforeDraw(chart) {
      const {ctx, chartArea: {left, top, width, height}} = chart;
      ctx.save();
      ctx.strokeStyle = 'rgb(220,220,220)';
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    }
  }]} />
  {#if showResetZoomBtn}
    <div class="btn-container"><Button btnType='orange' hidden={!$isZoomed} onClick={() => handleResetZoom(chart)}>Reset Zoom</Button></div>
  {/if}
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
      position: absolute;
      top: 20px;
      left: 65px;
    }
  }
</style>