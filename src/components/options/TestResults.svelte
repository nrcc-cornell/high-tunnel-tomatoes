<script>
  import SquareEditOutline from "svelte-material-icons/SquareEditOutline.svelte";
  import DeleteOutline from "svelte-material-icons/DeleteOutline.svelte";
  import Button from "../Button.svelte";
  import Modal from "../Modal.svelte";
  import ShapedTextfield from "./ShapedTextfield.svelte";

	import { userOptions, endDate } from "../../store/store";
  $: testResults = $userOptions.testResults;
  $: hasEvents = Object.keys(testResults).length > 0;
  
  const iconDim = 20;
  const newTestResultEvent = {
    date: null,
    organicMatter: 0,
    inorganicN: 0
  };

  function removeTestResult(id) {
    const newUOs = JSON.parse(JSON.stringify($userOptions));
    delete newUOs.testResults[id];
    $userOptions = newUOs;
  }

  function updateTestResults(submittedTestResultsEvent) {
    const newUOs = JSON.parse(JSON.stringify($userOptions));
    newUOs.testResults[submittedTestResultsEvent.id] = submittedTestResultsEvent;
    $userOptions = newUOs;
    closeModal();
    justChanged = null;
    justChanged = submittedTestResultsEvent.id;
  }

  function unsetJustChanged() {
    if (justChanged) {
      setTimeout(() => {
        justChanged = null;
      }, 2000);
    }
  }

  let modalOpen = false;
  let editingEvent = null;
  let justChanged = null;
  $: justChanged, unsetJustChanged();

  function openModal(testResult) {
    if (testResult) {
      editingEvent = { ...testResult };
    } else {
      editingEvent = {
        ...newTestResultEvent,
        id: new Date().getTime()
      };
    }
    modalOpen = true;
	}

  function closeModal() {
    modalOpen = false;
    editingEvent = null;
	}
</script>

{#if hasEvents}
  <div class="test-results-container">
    <div class="row header">
      <p></p>
      <p>Org. Matter (%)</p>
      <p>Inorg. N (lbs/acre)</p>
      <p></p>
    </div>
  </div>
  <div class='test-results-container scroll-shadows'>
    {#each Object.values(testResults).sort((a,b) => a.date > b.date ? 1 : -1) as testResult,i (testResult.id)}
      {#if testResult.date}
        {#if i > 0}
          <div class='line' />
        {/if}
        <div class={`row${justChanged === testResult.id ? ' anim' : ''}`}>
          <p>{testResult.date.slice(5).replace('-','/')}</p>
          <p>{testResult.organicMatter}</p>
          <p>{testResult.inorganicN}</p>
          <div class='btns-container'>
            <Button btnType='edit' onClick={() => openModal(testResult)}><SquareEditOutline width={iconDim} height={iconDim} /></Button>
            <Button btnType='delete' onClick={() => removeTestResult(testResult.id)}><DeleteOutline width={iconDim} height={iconDim} /></Button>
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}
<Button btnType='green' style='margin: {hasEvents ? '10px 0px 4px 0px' : '0px auto'};' onClick={() => openModal(null)}>Add Test Result Event</Button>
<Modal open={modalOpen} handleClose={closeModal}>
  <div class='editing-modal'>
    <h4 style='margin-top: 0;'>Test Result Event</h4>
    {#if editingEvent}
      <ShapedTextfield
        bind:value={editingEvent.date}
        invalid={editingEvent.date === null}
        required
        label='Date'
        helperText={`Date of testing${editingEvent.date === null ? ', required': ''}`}
        helperProps={{ persistent: true }}
        type='date'
        input$min={`${parseInt(endDate.slice(0,4)) - 1}-01-01`}
        input$max={endDate}
      />
      <div class='org-inputs'>
        <ShapedTextfield
          bind:value={editingEvent.organicMatter}
          label='Organic Matter (%)'
          type='number'
          input$step='0.1'
          input$min='0'
        />
        <ShapedTextfield
          bind:value={editingEvent.inorganicN}
          label='Inorganic Nitrogen (lbs/acre)'
          type='number'
          input$step='1'
          input$min='0'
          width=220
        />
      </div>
      <div class='btns-container'>
        <Button btnType='cancel' onClick={closeModal}>Cancel</Button>
        <Button btnType='green' disabled={editingEvent.date === null} disabledText='No Date' onClick={() => updateTestResults(editingEvent)}>Submit</Button>
      </div>
    {/if}
  </div>
</Modal>

<style lang='scss'>
  .btns-container {
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: end;
    width: 100%;
  }
  
  .test-results-container {
    display: grid;
    grid-auto-rows: auto;
    width: fit-content;
    font-size: 1em;
    max-height: 320px;
    margin: 0 auto;

    .row {
      display: grid;
      grid-template-columns: 45px repeat(2, minmax(50px, 200px)) 60px;
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

  .editing-modal {
    background-color: white;
    border-radius: 8px;
    border: 1px solid rgb(150,150,150);
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-height: 90vh;
    overflow-y: auto;

    .org-inputs {
      display: flex;
      gap: 12px
    }
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
  
  @media (max-width: 490px) {
    .org-inputs {
      flex-direction: column;
    }
  }

  @media (max-width: 400px) {
    .test-results-container {
      font-size: 0.9em;

      .header {
        font-size: 0.95em;
      }
    }
  }

  @media (max-width: 340px) {
    .test-results-container {
      font-size: 0.8em;

      .header {
        font-size: 0.9em;
      }
    }
  }
</style>