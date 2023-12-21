<script lang="ts">
  export let btnType = 'default';
  export let onClick = () => null;
  export let hidden = false;
  export let disabled = false;
  export let disabledText = '';
</script>

<button on:click={onClick} class='btn-container btn-{btnType}{disabled ? ' disabled' : ''}{hidden ? ' hidden' : ' visible'}' {...$$restProps} disabled={disabled}>
  {#if disabled && disabledText}
    {disabledText}
  {:else}
    <slot />
  {/if}
</button>

<style lang="scss">
  .btn-container {
    width: fit-content;
    height: 30px;
    letter-spacing: 0.5px;
    line-height: 30px;
    padding: 0px 8px;
    font-size: 11px;
    text-transform: uppercase;
    font-family: 'Roboto', 'Helvetica Neue', sans-serif;
    font-weight: bolder;
    border: none;
    cursor: pointer;
    display: flex;
    justify-content: center;
    white-space: nowrap;
    border-radius: 5px;
    transition: all 0.15s ease-in;
    margin: 0;
  }

  .btn-default {
    background-color: black;
    color: white;
    border: 1px solid black;

    &:hover {
      background-color: rgb(50,50,50);
      color: rgb(240,240,240);
    }
  }

  .btn-orange {
    background-color: #FF3E00;
    color: white;
    border: 1px solid #FF3E00;
    
    &:hover {
      background-color: #fa6a3a;
      color: white;
    }
  }

  .btn-green {
    background-color: #01c71c;
    color: white;
    border: 1px solid #01c71c;
    
    &:hover {
      background-color: #00a516;
      color: white;
    }
  }

  .btn-edit {
    background-color: #3357EB;
    color: white;
    border: 1px solid #3357EB;
    padding: 3px;
    height: fit-content;
    width: fit-content;
    
    &:hover {
      background-color: #0027c2;
      color: rgb(230,230,230);
    }
  }

  .btn-delete {
    background-color: #eb3333;
    color: white;
    border: 1px solid #eb3333;
    padding: 3px;
    height: fit-content;
    width: fit-content;
    
    &:hover {
      background-color: #bb0707;
      color: rgb(230,230,230);
    }
  }

  .btn-red {
    background-color: #eb3333;
    color: white;
    border: 1px solid #eb3333;
    
    &:hover {
      background-color: #bb0707;
      color: rgb(230,230,230);
    }
  }
  
  .disabled {
    background-color: rgb(210,210,210);
    color: rgb(120,120,120);
    border: 1px solid rgb(210,210,210);
    transform: scale(0.8);

    &:hover {
      background-color: rgb(210,210,210);
      color: rgb(120,120,120);
      cursor: auto;
    }
  }

  .hidden {
    opacity: 0;
  }

  .visible {
    opacity: 1;
  }

  @media (max-width: 785px), (max-height: 550px) {
    .button-container {
      height: 34px;
      line-height: 34px;
      padding: 0px 12px;
    }
  }

  @media (max-width: 590px) {
    .button-container {
      font-size: 10px;
      height: 26px;
      line-height: 26px;
      padding: 0px 8px;
    }
  }
</style>