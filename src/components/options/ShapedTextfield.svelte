<script lang="ts">
  export let value;
  export let invalid = false;
  export let label = '';
  export let helperText = '';
  export let suffix = '';
  export let inputPattern = '';
</script>
<!-- <Textfield
      class="shaped-outlined"
      variant="outlined"
      invalid
      bind:value={valueD}
      label="Invalid"
      >
      <HelperText slot="helper">Helper Text</HelperText>
    </Textfield> -->

<!-- <Textfield
  class="shaped-outlined"
  variant="outlined"
  bind:value={value}
  invalid={invalid}
  label={label}
  suffix={suffix}
  input$pattern={inputPattern}
>
  {#if helperText}
    <HelperText slot="helper">{helperText}</HelperText>
  {/if}
</Textfield> -->

<!-- <Textfield
  variant="outlined"
  bind:value={value}
  label={label}
>
  {#if helperText}
    <HelperText slot="helper">{helperText}</HelperText>
  {/if}
</Textfield> -->

<style>

</style>
