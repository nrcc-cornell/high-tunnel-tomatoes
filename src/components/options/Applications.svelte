<script>
  import SquareEditOutline from "svelte-material-icons/SquareEditOutline.svelte";
  import DeleteOutline from "svelte-material-icons/DeleteOutline.svelte";
  import Button from "../Button.svelte";
  import Modal from "../Modal.svelte";
  import ShapedTextfield from "./ShapedTextfield.svelte";

	import { userOptions, endDate } from "../../store/store";
  $: applications = $userOptions.applications;
  $: hasEvents = Object.keys(applications).length > 0;

  const iconDim = 20;
  const newApplicationEvent = {
    date: null,
    waterAmount: 0,
    fastN: 0,
    mediumN: 0,
    slowN: 0,
    inorganicN: 0
  };

  function removeApplication(id) {
    const newUOs = JSON.parse(JSON.stringify($userOptions));
    delete newUOs.applications[id];
    $userOptions = newUOs;
  }

  function updateApplications(submittedApplicationEvent) {
    const newUOs = JSON.parse(JSON.stringify($userOptions));
    newUOs.applications[submittedApplicationEvent.id] = submittedApplicationEvent;
    $userOptions = newUOs;
    closeModal();
    justChanged = null;
    justChanged = submittedApplicationEvent.id;
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

  function openModal(application) {
    if (application) {
      editingEvent = { ...application };
    } else {
      editingEvent = {
        ...newApplicationEvent,
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
        <div class={`row${justChanged === application.id ? ' anim' : ''}`}>
          <p>{application.date.slice(5).replace('-','/')}</p>
          <p>{application.waterAmount}</p>
          <div>
            <p>{application.fastN}</p>
            <p>{application.mediumN}</p>
            <p>{application.slowN}</p>
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
<Button btnType='green' style='margin: {hasEvents ? '10px 0px 4px 0px' : '0px auto'};' onClick={() => openModal(null)}>Add Application Event</Button>
<Modal open={modalOpen} handleClose={closeModal}>
  <div class='editing-modal'>
    <h4 style='margin-top: 0;'>Application Event</h4>
    {#if editingEvent}
      <ShapedTextfield
        bind:value={editingEvent.date}
        invalid={editingEvent.date === null}
        required
        label='Date'
        helperText={`Date of application${editingEvent.date === null ? ', required': ''}`}
        helperProps={{ persistent: true }}
        type='date'
        input$min={`${parseInt(endDate.slice(0,4)) - 1}-01-01`}
        input$max={endDate}
      />
      <ShapedTextfield
        bind:value={editingEvent.waterAmount}
        label='Water'
        helperText='Amount of water added in inches'
        helperProps={{ persistent: true }}
        type='number'
        input$step='0.01'
        input$min='0'
        width=175
      />
      <div class='n-inputs'>
        <div class='org-inputs'>
          <ShapedTextfield
            bind:value={editingEvent.fastN}
            label='Fast Organic Nitrogen'
            helperText='Amount of fast organic nitrogen added in lbs/acre'
            helperProps={{ persistent: true }}
            type='number'
            input$step='1'
            input$min='0'
            width=175
          />
          <ShapedTextfield
            bind:value={editingEvent.mediumN}
            label='Medium Organic Nitrogen'
            helperText='Amount of medium organic nitrogen added in lbs/acre'
            helperProps={{ persistent: true }}
            type='number'
            input$step='1'
            input$min='0'
            width=175
          />
          <ShapedTextfield
            bind:value={editingEvent.slowN}
            label='Slow Organic Nitrogen'
            helperText='Amount of slow organic nitrogen added in lbs/acre'
            helperProps={{ persistent: true }}
            type='number'
            input$step='1'
            input$min='0'
            width=175
          />
        </div>
        <ShapedTextfield
          bind:value={editingEvent.inorganicN}
          label='Inorganic Nitrogen'
          helperText='Amount of inorganic nitrogen added in lbs/acre'
          helperProps={{ persistent: true }}
          type='number'
          input$step='1'
          input$min='0'
          width=175
        />
      </div>
      <div class='btns-container'>
        <Button btnType='cancel' onClick={closeModal}>Cancel</Button>
        <Button btnType='green' disabled={editingEvent.date === null} disabledText='No Date' onClick={() => updateApplications(editingEvent)}>Submit</Button>
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
    padding-right: 8px;
    box-sizing: border-box;
  }

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

    .n-inputs {
      flex-wrap: wrap;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .org-inputs {
      display: flex;
      gap: 12px;
      flex-wrap: nowrap;
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