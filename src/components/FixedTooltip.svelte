<script>
  // If hovering show, else dont
  // show VWC at idx
  // show inorg N at idx (ppm and lbs/acre)
  // show fast N at idx (ppm and lbs/acre)
  // show medium N at idx (ppm and lbs/acre)
  // show slow N at idx (ppm and lbs/acre)
  // if test event, show results
  // if application event, show what was added

  import { tooltipData } from "../store/store";

  const nRows = [{
    title: 'Total Inorg. N.',
    key: 'tin',
    appKey: 'inorganicN'
  },{
    title: 'Fast Org. N.',
    key: 'fastN',
    appKey: 'fastN'
  },{
    title: 'Medium Org. N.',
    key: 'mediumN',
    appKey: 'mediumN'
  },{
    title: 'Slow Org. N.',
    key: 'slowN',
    appKey: 'slowN'
  }];

  $: console.log($tooltipData ? $tooltipData.application : null);
</script>

{#if $tooltipData}
  <div class='fixed-tooltip-container' style='--numCols: {$tooltipData.application ? 3 : 2}; --numRows: {6 + ($tooltipData.application ? 1 : 0) + ($tooltipData.testResult ? 1 : 0)};'>
    <h4 class='full-row'>{$tooltipData.date}</h4>

    {#if $tooltipData.testResult}
      <p class='full-row'>Test Results Applied</p>
    {/if}

    {#if $tooltipData.application}
      <p class='header'></p>
      <p class='header'>Current</p>
      <p class='header'>Added Today</p>
    {/if}

    {#each nRows as { title, key }}
      <p class='row-header'>{title}</p>
      <p>{Math.round($tooltipData[key].ppm)}ppm ({Math.round($tooltipData[key].lbsPerAcre)}lbs/acre)</p>
      {#if $tooltipData.application}
        <p>{Math.round($tooltipData.application.inorganicN)}lbs/acre</p>
      {/if}
    {/each}

    <p class='row-header'>VWC</p>
    <p style='line-height: 10px;'>{$tooltipData.vwc}in<sup>3</sup>/in<sup>3</sup></p>
    {#if $tooltipData.application}
      <p>{$tooltipData.application.waterAmount}in</p>
    {/if}
  </div>
{/if}

<style lang="scss">
  .fixed-tooltip-container {
    background-color: rgb(250,250,250);
    padding: 10px;
    box-sizing: border-box;
    border: 1px solid rgb(220,220,220);
    border-radius: 6px;
    box-shadow: 0px 3px 5px 0px rgba(100,100,100,0.2);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    pointer-events: none;
    display: grid;
    grid-template-rows: repeat(var(--numRows), fit-content);
    grid-template-columns: repeat(var(--numCols), 1fr);

    h4, p {
      margin: 0;
      line-height: 16px;
    }

    .row-header,
    .header {
      font-weight: bold;
    }

    .row-header {
      text-align: left;
    }

    .full-row {
      grid-column: 1/calc(1 + var(--numCols));
    }
  }
</style>


<!-- {
  "date": "2023-06-05",
  "vwc": 0.172,
  "tin": {
    "ppm": 51.215,
    "lbsPerAcre": 102.43
  },
  "fastN": {
    "ppm": 0.044,
    "lbsPerAcre": 0.088
  },
  "mediumN": {
    "ppm": 13.439,
    "lbsPerAcre": 26.878
  },
  "slowN": {
    "ppm": 29.738,
    "lbsPerAcre": 59.476
  },
  "application": {
    "date": "2023-06-05",
    "waterAmount": 0.03,
    "fastN": 0,
    "mediumN": 0,
    "slowN": 0,
    "inorganicN": 0,
    "id": 1696960928214
  },
  "testResult": {
    "id": 5432,
    "date": "2023-06-05",
    "organicMatter": 8,
    "inorganicN": 100
  }
} -->