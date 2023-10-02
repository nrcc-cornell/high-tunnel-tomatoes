<script lang="ts">
  import Select, { Option } from '@smui/select';

  export let value;
  export let options;
  export let width = 215;
  export let helperText = '';
  export let highlight = false;
</script>

<div style='margin-top: 6px;'>
  <Select
    class="shaped-outlined{highlight ? ' highlighted' : ''}"
    style='width: {width}px;'
    variant="outlined"
    bind:value
    {...$$restProps}
  >
    {#each options as option}
      <Option value={option.value}>{option.name}</Option>
    {/each}
    <svelte:fragment slot="helperText">{helperText}</svelte:fragment>
  </Select>
</div>

<style lang="scss">
  * :global(.shaped-outlined),
  * :global(.shaped-outlined .mdc-select__anchor) {
    border-radius: 28px;
  }
  * :global(.shaped-outlined .mdc-text-field__input) {
    padding-left: 32px;
    padding-right: 0;
  }
  *
    :global(.shaped-outlined
      .mdc-notched-outline
      .mdc-notched-outline__leading) {
    border-radius: 28px 0 0 28px;
    width: 28px;
  }
  *
    :global(.shaped-outlined
      .mdc-notched-outline
      .mdc-notched-outline__trailing) {
    border-radius: 0 28px 28px 0;
  }
  * :global(.shaped-outlined .mdc-notched-outline .mdc-notched-outline__notch) {
    max-width: calc(100% - 28px * 2);
  }

  * :global(.highlighted .mdc-notched-outline .mdc-notched-outline__leading) {
    border-color: #40B3FF;
  }
  * :global(.highlighted .mdc-notched-outline .mdc-notched-outline__trailing) {
    border-color: #40B3FF;
  }
  * :global(.highlighted .mdc-notched-outline .mdc-notched-outline__notch) {
    border-color: #40B3FF;
  }
  
  * :global(.highlighted .mdc-notched-outline .mdc-notched-outline__notch label) {
    color: #40B3FF;
  }

  *
    :global(.shaped-outlined.mdc-select--with-leading-icon
      .mdc-notched-outline:not(.mdc-notched-outline--notched)
      .mdc-floating-label) {
    left: 16px;
  }
  * :global(.mdc-select-helper-text) {
    width: 215px;
    margin: 0;
    padding-left: 16px;
    padding-right: 12px;
    box-sizing: border-box;
  }
  * :global(.mdc-select__anchor) {
    padding-left: 30px !important;
  }
</style>
