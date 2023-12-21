<script>
  import SquareEditOutline from "svelte-material-icons/SquareEditOutline.svelte";
  import DeleteOutline from "svelte-material-icons/DeleteOutline.svelte";
  import Button from "../Button.svelte";

  export let hasEvents = false;
  export let applications = {};
  export let justChanged = null;
  export let openModal = () => null;
  export let removeApplication = () => null;
  export let iconDim = 20;
  
  function unsetJustChanged() {
    if (justChanged) {
      setTimeout(() => {
        justChanged = null;
      }, 2000);
    }
  }
  $: justChanged, unsetJustChanged();
</script>

{#if hasEvents}
  <div class='applications-container'>
    <div class="row header">
      <p></p>
      <p>H<sub>2</sub>O (inches)</p>
      <div>
        <p>Org. N (lbs/acre)</p>
        <p style='font-weight: normal;'>Fast</p>
        <p style='font-weight: normal;'>Medium</p>
        <p style='font-weight: normal;'>Slow</p>
      </div>
      <p>Inorg. N (lbs/acre)</p>
      <p></p>
    </div>
  </div>
  <div class='applications-container scroll-shadows'>
    {#each Object.values(applications).sort((a,b) => a.date > b.date ? 1 : -1) as application, i (application.id)}
      {#if application.date}
        {#if i > 0}
          <div class='line' />
        {/if}  
        <div class={`row${justChanged && justChanged.includes(application.id) ? ' anim' : ''}`}>
          <p>{application.date.slice(5).replace('-','/')}</p>
          <p>{application.waterAmount}</p>
          <div>
            <p>{application.fastN.reduce((acc,arr) => acc += arr[1], 0)}</p>
            <p>{application.mediumN.reduce((acc,arr) => acc += arr[1], 0)}</p>
            <p>{application.slowN.reduce((acc,arr) => acc += arr[1], 0)}</p>
          </div>
          <p>{application.inorganicN}</p>
          <div class='btns-container'>
            <Button btnType='edit' onClick={() => openModal(application)}><SquareEditOutline width={iconDim} height={iconDim} /></Button>
            <Button btnType='delete' onClick={() => removeApplication(application.id)}><DeleteOutline width={iconDim} height={iconDim} /></Button>
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style lang="scss">
  .applications-container {
    display: grid;
    grid-auto-rows: auto;
    width: fit-content;
    font-size: 1em;
    max-height: 320px;
    margin: 0 auto;

    .row {
      display: grid;
      grid-template-columns: 45px repeat(3, minmax(50px, 200px)) 60px;
      align-items: center;
      padding: 3px;
    }
    
    .header {
      font-weight: bold;
      font-size: 1em;
    }

    p {
      margin: 0;
      font-size: 0.9em;
    }

    .line {
      grid-column: 1 / -1;
      height: 1px;
      background: rgb(220,220,220);
    }
  }

  .btns-container {
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: end;
    width: 100%;
    padding-right: 8px;
    box-sizing: border-box;
  }

  .anim {
    animation-name: color_change;
    animation-duration: 1s;
    animation-iteration-count: initial;
  }

  @keyframes color_change {
    35% {
      background-color: #ff3e00;
      color: white;
    }

    100% {
      background-color: white;
      color: black;
    }
  }

  @media (max-width: 800px) {
    .n-inputs {
      flex-direction: column;
    }
  }

  @media (max-width: 600px) {
    .editing-modal {
      width: 85vw;
    }

    .org-inputs {
      flex-wrap: wrap !important;
      justify-content: center;
    }
  }

  @media (max-width: 400px) {
    .applications-container {
      font-size: 0.9em;

      .header {
        font-size: 0.95em;
      }
    }
  }

  @media (max-width: 340px) {
    .applications-container {
      font-size: 0.8em;

      .header {
        font-size: 0.9em;
      }
    }
  }
</style>