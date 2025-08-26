<script>
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
  } from './Icon.svelte';
  
  let {
    children,
    class: _class = '',
    open = $bindable(false),
    s_label,
  } = $props();
  
  let ddRef;
  let openedOnce = $state.raw(false);
  
  function handleToggle() {
    open = !open;
    if (open && !openedOnce) openedOnce = true;
  }
  
  function handleOuterClick({ target }) {
    if (open) {
      const outerClick = !ddRef.contains(target);
      if (outerClick) open = false;
    }
  }
</script>

<svelte:window onclick={handleOuterClick} />

<div
  class="{_class} drop-down"
  class:open={open}
  class:no-anim={!openedOnce}
  bind:this={ddRef}
>
  <button class="drop-down__toggle" onclick={handleToggle}>
    {@render s_label?.()}
    {#if open}
      <Icon type={ICON__ANGLE_UP} />
    {:else}
      <Icon type={ICON__ANGLE_DOWN} />
    {/if}
  </button>
  <div class="drop-down__nav-wrapper">
    <nav>{@render children?.()}</nav>
  </div>
</div>

<style>
  .drop-down {
    position: relative;
  }
  .drop-down__toggle {
    height: 100%;
    color: currentColor;
    line-height: 1em;
    border: none;
    border-radius: unset;
    background: transparent;
    display: flex;
    gap: 0.5em;
    align-items: center;
    justify-content: space-between;
  }
  .drop-down__toggle:focus,
  .drop-down__toggle:hover {
    outline-offset: 0;
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
    pointer-events: none;
  }
  .drop-down.open .drop-down__nav-wrapper {
    pointer-events: all;
  }
  
  @keyframes open {
    0% {
      visibility: visible;
      transform: translateY(-101%);
    }
    100% {
      transform: translateY(0%);
    }
  }
  @keyframes close {
    0% {
      transform: translateY(0%);
    }
    100% {
      transform: translateY(-101%);
      visibility: hidden;
    }
  }
  
  /*
    NOTE: this allows for an accessible nav that utilizes proper animations.
    The trick being, to use the closing animation in the default state. Normally
    this'd result in the closing animation playing on page load, but since
    animation is disabled until the first 'open' is triggered, no anomalies are
    displayed to the User.
   */
  .drop-down.no-anim nav {
    visibility: hidden;
  }
  
  .drop-down nav {
    padding: 0.25em;
    padding-top: 0;
    border: solid 1px;
    border-top: none;
    margin: 0;
    background: var(--color--app--bg);
    animation-name: close;
    animation-duration: 200ms;
    animation-fill-mode: both;
  }
  .drop-down.open nav {
    animation-name: open;
  }
  :global(.drop-down nav button) {
    width: 100%;
    color: currentColor;
    white-space: nowrap;
    border: solid 1px;
    border-radius: unset;
    background: transparent;
  }
</style>
