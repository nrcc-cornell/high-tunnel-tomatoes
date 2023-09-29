<script>
  export let sectionName = null;
</script>

<div class='options-section'>
  <div class='options-section-name'><h4>{sectionName}</h4></div>
  <slot />
</div>

<style lang="scss">
  .options-section {
    box-sizing: border-box;
    width: fit-content;
    min-width: 200px;
    max-width: 95%;
    height: fit-content;
    padding: 24px 12px;
    border: 2px solid rgb(200,200,200);
    border-radius: 6px;
    position: relative;
    margin: 9px auto 0px auto;
  }

  .options-section-name {
    background-color: white;
    padding: 0px 12px;
    position: absolute;
    top: -9px;
    left: 20px;

    h4 {
      font-size: 0.8rem;
      color: rgb(100,100,100);
      margin: 0;
    }
  }
</style>