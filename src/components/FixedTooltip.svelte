<script>
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
  },{
    title: 'Leached N.',
    key: 'leached',
    appKey: 'leached'
  }];
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

    {#each nRows as { title, key, appKey }}
      <p class='row-header'>{title}</p>
      <p>{Math.round($tooltipData[key].ppm)}ppm ({$tooltipData[key].lbsPerAcre === 0 ? '0 lbs/acre' : ((Math.round($tooltipData[key].lbsPerAcre) === 0 && $tooltipData[key].lbsPerAcre > 0.125) ? 'Trace' : Math.round($tooltipData[key].lbsPerAcre) + 'lbs/acre')})</p>
      {#if $tooltipData.application}
        {#if key === 'tin'}
          <p>{Math.round($tooltipData.application.inorganicN)}lbs/acre</p>
        {:else if key === 'leached'}
          <p>-</p>
        {:else}
          <p>{Math.round($tooltipData.application[key].reduce((acc, arr) => acc += arr[1], 0))}lbs/acre</p>
        {/if}
      {/if}
    {/each}

    <p class='row-header'>VWC</p>
    <p style='line-height: 10px;'>{$tooltipData.vwc}in<sup>3</sup>/in<sup>3</sup></p>
    {#if $tooltipData.application}
      <p>{Math.round($tooltipData.application.waterAmount * 1000) / 1000}in</p>
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
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
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