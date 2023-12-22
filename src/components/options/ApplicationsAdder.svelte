<script>
  import DeleteOutline from "svelte-material-icons/DeleteOutline.svelte";
  import HelpCircle from 'svelte-material-icons/HelpCircle.svelte';
  import ShapedTextfield from "./ShapedTextfield.svelte";
  import ShapedSelect from "./ShapedSelect.svelte";
  import Button from "../Button.svelte";

  export let editingEvent;
  export let endDate;
  export let organicAmendments;
  export let iconDim = 20;
  let amendment = null;
  let amountAdded = 0;
  let showHelp = false;

  function handleShowHelp() {
    showHelp = true;
  }

  function handleHideHelp() {
    showHelp = false;
  }

  function addAmendment() {
    if (editingEvent && amendment && amountAdded > 0) {
      const newEditingEvent = JSON.parse(JSON.stringify(editingEvent));
      const selectedAmendment = organicAmendments.find(opt => opt.name === amendment);
      const category = `${selectedAmendment.category}N`;

      const matchingAmendment = newEditingEvent[category].find(arr => arr[0] === amendment);
      if (matchingAmendment) {
        matchingAmendment[1] += amountAdded;
      } else {
        newEditingEvent[category].push([amendment, amountAdded]);
      }
      
      editingEvent = newEditingEvent;
      amendment = null;
      amountAdded = 0;
    }
  }

  function removeAmendment(category, name) {
    const newEditingEvent = JSON.parse(JSON.stringify(editingEvent));
    const amendmentIdx = newEditingEvent[category].findIndex(arr => arr[0] === name);
    newEditingEvent[category].splice(amendmentIdx, 1);
    editingEvent = newEditingEvent;
  }
</script>

<h4 style='margin-top: 0;'>Application Event</h4>

<div
  class='hover-help'
  on:mouseenter={handleShowHelp}
  on:mouseout={handleHideHelp}
  on:focus={handleShowHelp}
  on:blur={handleHideHelp}
  role="tooltip"
>
  <div style='width: fit-content; pointer-events: none; color: rgb(27,8,255);'>
    <HelpCircle width={iconDim} height={iconDim} />
  </div>
  {#if showHelp}
    <div class='conversion-help'>
      <p>This tool uses pounds per acre as units for nitrogen. If your applications are in pounds and you know the area of your high tunnel in square feet, then you can easily convert by:</p>
      <pre>Lbs applied / Sq.ft. of high tunnel * 43,560sq.ft./acre</pre>
      <p>For example, if you apply 10lbs of nitrogen to a 200sq.ft. high tunnel:</p>
      <pre>10lbs / 200sq.ft. * 43,560sq.ft./acre = 2,178lbs/acre</pre>
    </div>
  {/if}
</div>

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
  <div class="application-inputs">
    <ShapedTextfield
      bind:value={editingEvent.waterAmount}
      label='Water (inches)'
      type='number'
      input$step='0.01'
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
  <div class='application-inputs' style='flex-direction: column;'>
    <h5 style='margin: 0;'>Organic Amendments</h5>
    <div class="add-organic">
      <ShapedSelect
        bind:value={amendment}
        label='Amendment Type'
        options={organicAmendments.map(opt => ({ name: opt.name, value: opt.name }))}
      />
      
      <ShapedTextfield
        bind:value={amountAdded}
        label='Amount Applied (lbs/acre)'
        type='number'
        input$step='1'
        input$min='0'
      />

      <div class='add-amendment-btn'>
        <Button
          btnType='green'
          disabled={!amendment || amountAdded <= 0}
          disabledText='Not valid'
          onClick={addAmendment}
        >
          Add Amendment
        </Button>
      </div>
    </div>
    {#if editingEvent}
      <div class='proposed-amendment-lists'>
        {#each ['fastN', 'mediumN', 'slowN'] as category}
        {#if editingEvent[category].length}
            <h6>{category.slice(0,1).toUpperCase() + category.slice(1,-1)} Nitrogen Applied</h6>
            <ul>
              {#each editingEvent[category] as [name, amount]}
              <li>
                <p>{name}:</p>
                <p>{amount} lbs/acre</p>
                <div style='margin-left: 6px;'><Button btnType='delete' onClick={() => removeAmendment(category, name)}><DeleteOutline width={iconDim} height={iconDim} /></Button></div>
              </li>
              {/each}
            </ul>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

<slot/>

<style lang="scss">
  .application-inputs {
    flex-wrap: wrap;
    display: flex;
    gap: 12px;
    align-items: flex-start;

    .add-organic {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .add-amendment-btn {
        margin-top: 18px;
        width: 118px;
        display: flex;
        justify-content: center;
      }

      :global(.mdc-menu-surface--open) {
        max-height: 300px !important;
      }
    }
  }

  .hover-help {
    position: absolute;
    width: fit-content;
    top: 6px;
    right: 6px;
    padding: 4px;

    &:hover {
      cursor: pointer;
    }

    .conversion-help {
      position: absolute;
      bottom: 0px;
      left: 0px;
      transform: translate(-100%, 100%);
      background-color: white;
      border: 2px solid rgb(220,220,220);
      padding: 12px;
      z-index: 1;

      pre {
        text-align: center;
      }
    }
  }

  .proposed-amendment-lists {
    h6 {
      margin: 0;
      text-align: left;
    }
    
    ul {
      list-style: none;
      margin: 0;

      li {
        display: flex;
        gap: 6px;
        align-items: center;
      }
    }
  }
</style>