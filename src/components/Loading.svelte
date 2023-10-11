<script>
  import { Circle2 } from 'svelte-loading-spinners';

  export let position = 'fixed';
</script>

<div class='loading-container' style='position: {position};'>
  <Circle2 />
</div>

<style>
  .loading-container {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(220,220,220,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
</style>