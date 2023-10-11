<script>
  export let sectionName = null;
  export let style = '';
</script>

<div class='options-section' {style}>
  <div class='options-section-name'><h4>{sectionName}</h4></div>
  <slot />
</div>

<style lang="scss">
  .options-section {
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    padding: 24px 12px;
    border: 2px solid rgb(200,200,200);
    border-radius: 6px;
    position: relative;
    margin-top: 12px;
  }

  .options-section-name {
    background-color: white;
    padding: 0px 8px;
    position: absolute;
    top: -9px;
    left: 12px;

    h4 {
      font-size: 0.8rem;
      color: rgb(100,100,100);
      margin: 0;
    }
  }
</style>