<script>
  import { v4 as uuidv4 } from 'uuid';

  import ShapedTextfield from "./ShapedTextfield.svelte";
  import ApplicationsBtnsRow from "./ApplicationsBtnsRow.svelte";
  
  export let latestDate;
  export let cancelFunc = () => null;
  export let switcherFunc = () => null;
  export let updateApplications = () => null;

  let startDate = null;
  let endDate = null;
  let waterAmount = 0;
  let frequency = 1;

  function generateWateringEvents(startDate, endDate, frequency, amount) {
    // Convert input strings to Date objects
    startDate = new Date(startDate);
    endDate = new Date(endDate);

    // Ensure startDate is before endDate
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Count number of applications to be added
    let currentDate = new Date(startDate.getTime());
    let numToCreate = 0;
    while (currentDate <= endDate) {
      // Increment counter
      numToCreate++;

      // Increment the date by the specified frequency
      currentDate.setDate(currentDate.getDate() + frequency);
    }

    // Make sure user understands the implications of this action
    if (confirm(`This action will create ${numToCreate} new application events. Continue?`)) {
      const newApplications = [];

      // Loop through the date range with the specified frequency
      currentDate = startDate;
      while (currentDate <= endDate) {
        // Create an object with the amount, date, and id, as well as empty arrays for all nitrogen
        const newApplication = {
          date: currentDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
          waterAmount: amount,
          fastN: [],
          mediumN: [],
          slowN: [],
          inorganicN: 0,
          id: uuidv4()
        };

        // Add the object to the array
        newApplications.push(newApplication);

        // Increment the date by the specified frequency
        currentDate.setDate(currentDate.getDate() + frequency);
      }
    
      updateApplications(newApplications);
    }
  }
</script>

<h4 style='margin-top: 0;'>Water Scheduler</h4>

<div class='input-group'>
  <ShapedTextfield
    bind:value={startDate}
    invalid={startDate === null}
    required
    label='Start Date'
    helperText={`First date water was applied${startDate === null ? ', required': ''}`}
    helperProps={{ persistent: true }}
    type='date'
    input$min={`${parseInt(latestDate.slice(0,4)) - 1}-01-01`}
    input$max={endDate || latestDate}
    width=180
  />
  <ShapedTextfield
    bind:value={endDate}
    invalid={endDate === null}
    required
    label='End Date'
    helperText={endDate === null ? 'Required': ''}
    helperProps={{ persistent: true }}
    type='date'
    input$min={startDate}
    width=180
  />
  <ShapedTextfield
    bind:value={frequency}
    label='Frequency of Watering (days)'
    type='number'
    input$step='1'
    input$min='1'
    width=225
  />
  <ShapedTextfield
    bind:value={waterAmount}
    label='Water (inches)'
    helperText='Amount of water added each watering event'
    helperProps={{ persistent: true }}
    type='number'
    input$step='0.01'
    input$min='0'
  />
</div>

<ApplicationsBtnsRow
  switcherBtnText='Switch to Normal Application'
  {switcherFunc}
  {cancelFunc}
  submitFunc={() => generateWateringEvents(startDate, endDate, frequency, waterAmount)}
  submitIsDisabled={!startDate || !endDate || startDate > endDate || waterAmount <= 0 || frequency < 1}
  submitDisabledText={waterAmount <= 0 ? 'Invalid Water Amount' : (frequency < 1 ? 'Invalid frequency' : 'Invalid Dates') }
/>

<style lang="scss">
  .input-group {
    display: grid;
    grid-template-columns: repeat(2, 225px);
    grid-template-rows: repeat(2, auto);
    gap: 12px;
    justify-items: center;
  }
</style>