<script lang="ts">
  import Textfield from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';

  export let value;
  export let helperText = '';
  export let helperProps = {};
  export let width = 215;
  export let highlight = false;
</script>

<div style='width: {width}px; margin-top: 6px;'>
  <Textfield
    class="shaped-outlined{highlight ? ' highlighted' : ''}"
    variant="outlined"
    bind:value={value}
    {...$$restProps}
  >
    <HelperText style='width: {width}px;' {...helperProps} slot="helper">{helperText}</HelperText>
  </Textfield>
</div>

<style>
  * :global(.shaped-outlined .mdc-notched-outline .mdc-notched-outline__leading) {
    border-radius: 28px 0 0 28px;
    width: 28px;
  }
  * :global(.shaped-outlined .mdc-notched-outline .mdc-notched-outline__trailing) {
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
  * :global(.highlighted .mdc-notched-outline .mdc-notched-outline__notch span) {
    color: #40B3FF;
  }

  * :global(.shaped-outlined.mdc-text-field--with-leading-icon:not(.mdc-text-field--label-floating) .mdc-floating-label) {
    left: 16px;
  }
  * :global(.shaped-outlined + .mdc-text-field-helper-line) {
    padding-left: 16px;
    padding-right: 12px;
  }
  * :global(.shaped-outlined .mdc-text-field__input) {
    padding-left: 15px;
  }
  * :global(.mdc-text-field__input::-webkit-calendar-picker-indicator) {
    display: initial !important;
  } 
</style>
