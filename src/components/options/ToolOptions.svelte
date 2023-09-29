<script>
  import OptionsContainer from "./OptionsContainer.svelte";
  // import ShapedTextfield from "./ShapedTextfield.svelte";

  // let value = 'test1'
  // let value2 = '';
  // let value3 = 0;
</script>

<div>
  <OptionsContainer sectionName='Development Only'>
    <!-- <ShapedTextfield
      value={value}
      label='First'
      helperText='Helper text'
    />
    <ShapedTextfield
      value={value2}
      invalid={true}
    />
    <ShapedTextfield
      value={value3}
      label='Number'
      suffix='kg'
      inputPattern='\d+'
    /> -->
  </OptionsContainer>
	<OptionsContainer sectionName='Options'></OptionsContainer>
</div>