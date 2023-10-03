<script>
  import OptionsContainer from "./OptionsContainer.svelte";
  import ShapedSelect from "./ShapedSelect.svelte";
  import ShapedTextfield from "./ShapedTextfield.svelte";
  import { devOptions, userOptions, soilCharacteristics } from "../../store/store";
  import Button from "../Button.svelte";

  let localDevOptions = null;
  let localUserOptions = null;

  const updateLocalDevOptions = () => {
    localDevOptions = JSON.parse(JSON.stringify($devOptions));
  }
  $: $devOptions, updateLocalDevOptions();

  const updateLocalUserOptions = () => {
    localUserOptions = JSON.parse(JSON.stringify($userOptions))
  }
  $: $userOptions, updateLocalUserOptions();

  function handleUpdateOptions() {
    $userOptions = localUserOptions;
    $devOptions = localDevOptions;
  }

  const waterCapacityOptions = [{
    name: 'Sand, coarse texture',
    value: 'low'
  },{
    name: 'Loam, medium texture',
    value: 'medium'
  },{
    name: 'Clay, fine texture',
    value: 'high'
  }]
</script>

<div>
  {#if localUserOptions && $soilCharacteristics}
    <OptionsContainer sectionName='Options'>
      <div class="other-vars">
        <ShapedSelect
          bind:value={localUserOptions.waterCapacity}
          highlight={localUserOptions.waterCapacity !== $userOptions.waterCapacity}
          label='Soil Type'
          helperText='"{waterCapacityOptions.find(wco => wco.value === $soilCharacteristics.waterCapacity).name}" is recommended: Sand-{$soilCharacteristics.composition.sand}% Silt-{$soilCharacteristics.composition.silt}% Clay-{$soilCharacteristics.composition.clay}%'
          options={waterCapacityOptions}
        />
        <ShapedTextfield
          bind:value={localUserOptions.organicMatter}
          highlight={localUserOptions.organicMatter !== $userOptions.organicMatter}
          label='Organic Matter'
          helperText='Percent organic matter in the soil'
          helperProps={{ persistent: true }}
          suffix='%'
          type='number'
          input$min='0'
          input$max='100'
        />
      </div>
      <!-- <ShapedTextfield
        bind:value={inorgN}
        label='Inorganic Nitrogen'
        helperText='Amount of inorganic nitrogen added to the soil'
        helperProps={{ persistent: true }}
        suffix='lbs/acre'
        type='number'
      />
      <ShapedTextfield
        bind:value={orgN}
        label='Organic Nitrogen Added'
        helperText='Amount of organic nitrogen added to the soil'
        helperProps={{ persistent: true }}
        suffix='lbs/acre'
        type='number'
      /> -->
    </OptionsContainer>
  {/if}
  {#if localDevOptions && $userOptions}
    <OptionsContainer sectionName='Development Only'>
      <div>
        <h4>Soil Moisture Definitions (inches)</h4>
        <div class='smo-grid'>
          {#each ['', 'wiltingpoint', 'prewiltingpoint', 'stressthreshold', 'fieldcapacity', 'saturation'] as row}
            {#each ['constName', 'low', 'medium', 'high'] as col (`${col}-${row}`)}
              {#if col === 'constName'}
                <div class='header' style='height: 24px;'>{row}</div>
              {:else if row === ''}
                <div class={col === $userOptions.waterCapacity ? 'header highlighted' : 'header'}>{waterCapacityOptions.find(wco => wco.value === col).name}</div>
              {:else}
                <div class={col === $userOptions.waterCapacity ? 'highlighted' : ''}>
                  <ShapedTextfield
                    bind:value={localDevOptions.soilmoistureoptions[col][row]}
                    highlight={localDevOptions.soilmoistureoptions[col][row] !== $devOptions.soilmoistureoptions[col][row]}
                    type='number'
                    input$step='0.01'
                    input$min='0'
                    width=115
                  />
                </div>
              {/if}
            {/each}
          {/each}
        </div>
      </div>
      <div>
        <h4>Crop Coefficient Definitions</h4>
        <div class='kc-grid'>
          {#each Object.keys(localDevOptions.soilmoistureoptions.kc) as kcConst (kcConst)}
            <div class={kcConst === 'Kcend' ? 'span2' : ''}>
              <ShapedTextfield
                bind:value={localDevOptions.soilmoistureoptions.kc[kcConst].value}
                highlight={localDevOptions.soilmoistureoptions.kc[kcConst].value !== $devOptions.soilmoistureoptions.kc[kcConst].value}
                label={localDevOptions.soilmoistureoptions.kc[kcConst].name}
                helperText={localDevOptions.soilmoistureoptions.kc[kcConst].description}
                helperProps={{ persistent: true }}
                type='number'
                input$step={kcConst.slice(0,1) === 'K' ? '0.01' : '1'}
                input$min='0'
              />
            </div>
          {/each}
        </div>
      </div>
      <div>
        <h4>Other Variables</h4>
        <div class='other-vars'>
          <ShapedTextfield
            bind:value={localDevOptions.soilmoistureoptions.p}
            highlight={localDevOptions.soilmoistureoptions.p !== $devOptions.soilmoistureoptions.p}
            label='p'
            helperText='Fraction between field capacity and wilting to start applying water stress'
            helperProps={{ persistent: true }}
            type='number'
            input$step='0.01'
            input$min='0'
            input$max='1'
          />
          <ShapedTextfield
            bind:value={localDevOptions.soilmoistureoptions.petAdj}
            highlight={localDevOptions.soilmoistureoptions.petAdj !== $devOptions.soilmoistureoptions.petAdj}
            label='PET Adjustment'
            helperText='PET adjustment to account for high tunnel environment'
            helperProps={{ persistent: true }}
            type='number'
            input$step='0.01'
            input$min='0'
            input$max='1'
          />
        </div>
      </div>
    </OptionsContainer>
  {/if}
  <div style='margin-top: 24px;'>
    <Button
      btnType='submit'
      onClick={handleUpdateOptions}
      style='margin: 0 auto;'
      disabled={JSON.stringify(localDevOptions) === JSON.stringify($devOptions) &&
        JSON.stringify(localUserOptions) === JSON.stringify($userOptions)}
      disabledText='No changes to submit'
    >Submit Changes</Button>
  </div>
</div>

<style lang='scss'>
  .kc-grid,
  .smo-grid {
    display: grid;
    align-items: center;
    justify-items: center;
    text-align: center;

    div {
      padding: 4px;
      height: 100%;
      width: 100%;
      box-sizing: border-box;
    }
  }

  .smo-grid {
    grid-template-columns: 120px repeat(3, 123px);
    grid-template-rows: 38px repeat(5, 68px);
    margin: 0 auto;
    width: fit-content;

    .highlighted {
      background-color: rgb(255, 219, 198);
    }

    .header {
      font-weight: bold;
      font-size: 12px;
    }
  }

  .kc-grid {
    grid-template-columns: repeat(4, 215px);
    grid-template-rows: repeat(2, 100px);
    gap: 6px;

    .span2 {
      grid-column: 3/5;
      display: flex;
      justify-content: center;
    }
  }

  .other-vars {
    display: flex;
    justify-content: space-evenly;
    gap: 12px;
  }
</style>