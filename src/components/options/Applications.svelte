<script>
  import Button from "../Button.svelte";
  import Modal from "../Modal.svelte";

  import ApplicationsDisplay from "./ApplicationsDisplay.svelte";
  import ApplicationsAdder from "./ApplicationsAdder.svelte";
  import ApplicationsWaterScheduler from "./ApplicationsWaterScheduler.svelte";

  import { organicAmendments } from '../../lib/nitrogenHelpers';
	import { userOptions, endDate } from "../../store/store";
  $: applications = $userOptions.applications;
  $: hasEvents = Object.keys(applications).length > 0;

  const iconDim = 20;
  const newApplicationEvent = () => ({
    date: null,
    waterAmount: 0,
    fastN: [],
    mediumN: [],
    slowN: [],
    inorganicN: 0
  });

  let modalOpen = false;
  let editingEvent = null;
  let justChanged = null;
  let showWaterScheduler = false;

  function removeApplication(id) {
    const newUOs = JSON.parse(JSON.stringify($userOptions));
    delete newUOs.applications[id];
    $userOptions = newUOs;
  }

  function updateApplications(submittedApplicationEvents) {
    const newUOs = JSON.parse(JSON.stringify($userOptions));
    submittedApplicationEvents.forEach(event => newUOs.applications[event.id] = event);
    $userOptions = newUOs;
    closeModal();
    justChanged = null;
    justChanged = submittedApplicationEvents.map(event => event.id);
  }

  function openModal(application) {
    if (application) {
      editingEvent = { ...application };
    } else {
      editingEvent = {
        ...newApplicationEvent(),
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

<ApplicationsDisplay
  {hasEvents}
  {applications}
  {openModal}
  {removeApplication}
  {justChanged}
  {iconDim}
/>

<Button btnType='green' style='margin: {hasEvents ? '10px 0px 4px 0px' : '0px auto'};' onClick={() => openModal(null)}>Add Application Event</Button>

<Modal open={modalOpen} handleClose={closeModal}>
  <div class='editing-modal'>
    {#if showWaterScheduler}
      <ApplicationsWaterScheduler />
    {:else}
      <ApplicationsAdder
        bind:editingEvent
        {endDate}
        {organicAmendments}
        {iconDim}
      />
    {/if}

    <div class="btns-row">
      <Button onClick={() => showWaterScheduler = !showWaterScheduler}>Switch to {showWaterScheduler ? 'Normal Application' : 'Water Scheduler'}</Button>
  
      <div class='btns-container'>
        <Button btnType='cancel' onClick={closeModal}>Cancel</Button>
        <Button btnType='green' disabled={editingEvent.date === null} disabledText='No Date' onClick={() => updateApplications([editingEvent])}>Submit</Button>
      </div>
    </div>
  </div>
</Modal>

<style lang='scss'>
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
    
    .btns-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 3px;

      .btns-container {
        display: flex;
        gap: 3px;
        align-items: center;
        justify-content: end;
        width: 100%;
        padding-right: 8px;
        box-sizing: border-box;
      }
    }
  }
</style>