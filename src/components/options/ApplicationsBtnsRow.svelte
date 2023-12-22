<script>
  import Button from "../Button.svelte";

  export let switcherBtnText = '';
  export let switcherFunc = () => null;
  export let cancelFunc = () => null;
  export let submitFunc = () => null;
  export let submitIsDisabled = false;
  export let submitDisabledText = '';
</script>

<div class="btns-row">
  <Button onClick={switcherFunc}>{switcherBtnText}</Button>

  <div class='btns-container'>
    <Button btnType='cancel' onClick={cancelFunc}>Cancel</Button>
    <Button btnType='green' disabled={submitIsDisabled} disabledText={submitDisabledText} onClick={submitFunc}>Submit</Button>
  </div>
</div>

<style lang="scss">
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
</style>