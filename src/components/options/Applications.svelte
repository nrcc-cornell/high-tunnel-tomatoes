<script>
  import { v4 as uuidv4 } from 'uuid';

  import Button from "../Button.svelte";
  import Modal from "../Modal.svelte";

  import ApplicationsDisplay from "./ApplicationsDisplay.svelte";
  import ApplicationsAdder from "./ApplicationsAdder.svelte";
  import ApplicationsWaterScheduler from "./ApplicationsWaterScheduler.svelte";
  import ApplicationsBtnsRow from "./ApplicationsBtnsRow.svelte";

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
        id: uuidv4()
      };
    }
    modalOpen = true;
	}

  function closeModal() {
    modalOpen = false;
    editingEvent = null;
    showWaterScheduler = false;
	}

  function toggleShowWaterScheduler() {
    showWaterScheduler = !showWaterScheduler;
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
      <ApplicationsWaterScheduler
        latestDate={endDate}
        switcherFunc={toggleShowWaterScheduler}
        cancelFunc={closeModal}
        {updateApplications}
      />
    {:else}
      <ApplicationsAdder
        bind:editingEvent
        {endDate}
        {organicAmendments}
        {iconDim}
      >
        <ApplicationsBtnsRow
          switcherBtnText='Switch to Water Scheduler'
          switcherFunc={toggleShowWaterScheduler}
          cancelFunc={closeModal}
          submitFunc={() => updateApplications([editingEvent])}
          submitIsDisabled={editingEvent.date === null}
          submitDisabledText='No Date'
        />
      </ApplicationsAdder>
    {/if}
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
  }
</style>