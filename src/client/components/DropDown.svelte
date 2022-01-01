<script>
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
  } from './Icon.svelte';
  
  let _class = '';
  export let open = false;
  export { _class as class };
  
  let ddRef;
  
  function handleToggle() { open = !open; }
  
  function handleOuterClick({ target }) {
    if (open) {
      const outerClick = !ddRef.contains(target);
      if (outerClick) open = false;
    }
  }
</script>

<svelte:window on:click={handleOuterClick} />

<div class="{_class} drop-down" bind:this={ddRef}>
  <button class="drop-down__toggle" on:click={handleToggle}>
    <slot name="label" />
    
    {#if open}
      <Icon type={ICON__ANGLE_UP} />
    {:else}
      <Icon type={ICON__ANGLE_DOWN} />
    {/if}
  </button>
  <div class="drop-down__nav-wrapper">
    <nav class:open={open}>
      <slot />
    </nav>
  </div>
</div>

<style>
  .drop-down {
    position: relative;
  }
  .drop-down__toggle {
    height: 100%;
    color: currentColor;
    border: none;
    background: transparent;
    display: flex;
    gap: 0.5em;
    align-items: center;
    justify-content: space-between;
  }
  :global(.drop-down__toggle > *) {
    pointer-events: none;
  }
  :global(.drop-down__toggle .svg-icon.for--angle-up) ,
  :global(.drop-down__toggle .svg-icon.for--angle-down) {
    width: 0.6em;
    height: 0.6em;
  }
  .drop-down__nav-wrapper {
    min-width: 100%;
    overflow: hidden;
    position: absolute;
    z-index: 5;
    top: 100%;
    right: 0;
  }
  .drop-down nav {
    padding: 0.25em;
    padding-top: 0;
    border: solid 1px;
    border-top: none;
    margin: 0;
    background: var(--color--app--bg);
    transform: translateY(-101%);
    transition: transform 200ms;
    pointer-events: none;
  }
  .drop-down nav.open {
    transform: translateY(0%);
    pointer-events: all;
  }
  :global(.drop-down nav button) {
    width: 100%;
    color: currentColor;
    white-space: nowrap;
    border: solid 1px;
    background: transparent;
  }
</style>
