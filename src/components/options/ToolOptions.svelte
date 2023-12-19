<script>
  import OptionsContainer from "./OptionsContainer.svelte";
  import ShapedSelect from "./ShapedSelect.svelte";
  import ShapedTextfield from "./ShapedTextfield.svelte";
  import Button from "../Button.svelte";
  import TestResults from "./TestResults.svelte";
  import Applications from "./Applications.svelte";
  
  import { devOptions, userOptions, soilCharacteristics, activeLocationId, endDate } from "../../store/store";
  import { updateOptionsInStorage } from "../../lib/handleStorage";
  import { calcSoilConstants } from "../../lib/devNutrientModel";

  let localDevOptions = null;
  let localUserOptions = null;

  const updateLocalDevOptions = () => {
    localDevOptions = JSON.parse(JSON.stringify($devOptions));
  }
  $: $devOptions, updateLocalDevOptions();

  const updateLocalUserOptions = () => {
    localUserOptions = JSON.parse(JSON.stringify($userOptions));
    if ($userOptions) {
      updateOptionsInStorage($activeLocationId, localUserOptions);
    }
  }
  $: $userOptions, updateLocalUserOptions();

  function handleUpdateOptions() {
    if ($userOptions.rootDepth !== localUserOptions.rootDepth) {
      localDevOptions = {...localDevOptions, soilmoistureoptions: {...localDevOptions.soilmoistureoptions, ...calcSoilConstants(localUserOptions.rootDepth)}};
    }

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

<div style='margin-bottom: 50px;'>
  {#if localUserOptions && $soilCharacteristics}
    <div class='user-options-container'>
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
            bind:value={localUserOptions.rootDepth}
            highlight={localUserOptions.rootDepth !== $userOptions.rootDepth}
            label='Root Zone Depth (in)'
            helperText='Depth that plants have access to soil moisture'
            helperProps={{ persistent: true }}
            suffix='in'
            type='number'
            input$min='0'
            input$max='100'
          />
          <ShapedTextfield
            bind:value={localUserOptions.initialOrganicMatter}
            highlight={localUserOptions.initialOrganicMatter !== $userOptions.initialOrganicMatter}
            label='Initial Organic Matter'
            helperText='Percent organic matter in the soil on 1/1, default for this location is {$soilCharacteristics.organicMatter}%'
            helperProps={{ persistent: true }}
            suffix='%'
            type='number'
            input$min='0'
            input$max='100'
            input$step='1.0'
          />
          <ShapedTextfield
            bind:value={localUserOptions.plantingDate}
            highlight={localUserOptions.plantingDate !== $userOptions.plantingDate}
            label='Planting Date'
            helperText='Date the tomatoes were planted'
            helperProps={{ persistent: true }}
            type='date'
            input$min={`${parseInt(endDate.slice(0,4)) - 1}-01-01`}
            input$max={endDate}
          />
          <ShapedTextfield
            bind:value={localUserOptions.terminationDate}
            highlight={localUserOptions.terminationDate !== $userOptions.terminationDate}
            label='Termination Date'
            helperText='Date the tomatoes were terminated'
            helperProps={{ persistent: true }}
            type='date'
            disabled={!localUserOptions.plantingDate}
            input$min={localUserOptions.plantingDate}
            input$max={endDate}
          />
        </div>

        <div style='margin-top: 24px;'>
          <Button
            btnType='orange'
            onClick={handleUpdateOptions}
            style='margin: 0 auto;'
            disabled={JSON.stringify(localDevOptions) === JSON.stringify($devOptions) &&
              JSON.stringify(localUserOptions) === JSON.stringify($userOptions)}
            disabledText='No changes to submit'
          >Submit Changes</Button>
        </div>
      </OptionsContainer>
      <OptionsContainer sectionName='Water and Nutrient Applications' style='padding-bottom: 8px;'><Applications /></OptionsContainer>
      <OptionsContainer sectionName='Soil Nutrient Test Results' style='padding-bottom: 8px;'><TestResults /></OptionsContainer>
    </div>
  {/if}
  {#if localDevOptions && $userOptions}
    <div style='width: 925px; margin: 0 auto;'>
      <OptionsContainer sectionName='Development Only'>
        <div>
          <h4>Nitrogen Mineralization Constants</h4>
          <div class='other-vars'>
            <ShapedTextfield
              bind:value={localDevOptions.somKN}
              highlight={localDevOptions.somKN !== $devOptions.somKN}
              label='SOM'
              helperText='Soil Organic Matter Mineralization Rate'
              helperProps={{ persistent: true }}
              type='number'
              input$step='0.0000001'
              input$min='0'
              input$max='1'
            />
          </div>
        </div>
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
            <ShapedTextfield
              bind:value={localDevOptions.q10}
              highlight={localDevOptions.q10 !== $devOptions.q10}
              label='Q10'
              type='number'
              input$step='0.1'
              input$min='0'
              input$max='100'
            />
            <ShapedTextfield
              bind:value={localDevOptions.tempO}
              highlight={localDevOptions.tempO !== $devOptions.tempO}
              label='To'
              type='number'
              input$step='0.1'
              input$min='0'
              input$max='100'
            />
          </div>
        </div>

        <div style='margin-top: 24px;'>
          <Button
            btnType='orange'
            onClick={handleUpdateOptions}
            style='margin: 0 auto;'
            disabled={JSON.stringify(localDevOptions) === JSON.stringify($devOptions) &&
              JSON.stringify(localUserOptions) === JSON.stringify($userOptions)}
            disabledText='No changes to submit'
          >Submit Changes</Button>
        </div>
      </OptionsContainer>
    </div>
  {/if}
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
    flex-wrap: wrap;
    gap: 12px;
  }

  .user-options-container {
    width: fit-content;
    min-width: 240px;
    max-width: 95%;
    height: fit-content;
    margin: 0 auto;
  }
</style>