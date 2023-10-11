<script>
  export let open = false;
  export let handleClose = () => null;
  
	function handleEsc(e) {
		if (e.keyCode === 27 && open) {
			handleClose();
		}
	}
</script>

{#if open}
  <div
    class="modal"
    on:click={handleClose}
    on:keydown={handleEsc}
  >
    <div
      class="modal-content"
      on:click|stopPropagation
      on:keydown={handleEsc}
    >
      <slot />
    </div>
  </div>
{/if}

<style>
  .modal {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(150,150,150,0.7);
		z-index: 100;
	}
	
	.modal-content {
		position: relative;
    width: fit-content;
    height: fit-content;
	}
</style>