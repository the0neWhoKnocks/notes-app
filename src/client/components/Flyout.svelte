<script context="module">
  let flyoutNum = 0;
</script>
<script>
  import { cubicOut } from 'svelte/easing';
  import Portal from 'svelte-portal';
  
  flyoutNum += 1;
  
  export let animDuration = 300;
  export let bodyColor = '#eee';
  export let borderColor = '#000';
  let flyoutFor = undefined;
  export let onCloseClick = undefined;
  export let onCloseEnd = undefined;
  export let title = '';
  export let titlebar = true;
  export let titleBGColor = '#333';
  export let titleTextColor = '#eee';
  export { flyoutFor as for };
  
  const cssVars = `
    --dialog-anim-duration: ${animDuration}ms;
    --dialog-border-color: ${borderColor};
    --dialog-body-color: ${bodyColor};
    --dialog-title-bg-color: ${titleBGColor};
    --dialog-title-text-color: ${titleTextColor};
  `;
  let fNum = flyoutNum;
  
  const toggleFlyout = (_, { dir } = {}) => {
    return {
      duration: animDuration,
      css: t => {
        const perc = (t * 100);
        const eq = dir === 'in'
          ? -100 + perc
          : 0 - (100 - perc);
        
        return `
          transform: translateX(${eq}%);
        `;
      },
      easing: cubicOut,
    };
  };
  
  const toggleMask = () => ({
    duration: animDuration,
    css: t => `opacity: ${t};`,
    easing: cubicOut,
  });
  
  function handleCloseEnd() {
    if (onCloseEnd) onCloseEnd();
    flyoutNum -= 1;
  }
  
  function handleCloseClick() {
    if (onCloseClick) onCloseClick();
  }
  
  function handleKeyDown({ key }) {
    switch (key) {
      case 'Escape': {
        if (fNum === flyoutNum) handleCloseClick();
        break;
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown}/>

<Portal target="#overlays">
  <div 
    class="flyout-wrapper"
    flyout-for={flyoutFor}
    style={cssVars}
  >
    <div
      class="flyout-mask"
      aria-hidden="true"
      on:click={handleCloseClick}
      in:toggleMask
      out:toggleMask
    ></div>
    <dialog
      class="flyout"
      open
      in:toggleFlyout={{ dir: 'in' }}
      out:toggleFlyout={{}}
      on:outroend={handleCloseEnd}
    >
      {#if titlebar}
        <nav class="flyout__nav">
          <div class="flyout__title">
            <slot name="flyoutTitle">{title}</slot>
          </div>
          <button
            type="button"
            class="flyout__close-btn"
            on:click={handleCloseClick}
          >&#10005;</button>
        </nav>
      {/if}
      <div class="flyout__body">
        <slot></slot>
      </div>
    </dialog>
  </div>
</Portal>

<style>
  .flyout-wrapper {
    overflow: hidden;
    position: absolute;
    inset: 0;
    z-index: 10;
  }
  .flyout-wrapper *,
  .flyout-wrapper *::after,
  .flyout-wrapper *::before {
    box-sizing: border-box;
  }
  
  :global(.flyout-wrapper button),
  :global(.flyout-wrapper input),
  :global(.flyout-wrapper select),
  :global(.flyout-wrapper textarea) {
    fill: orange;
  }
  :global(.flyout-wrapper button:not(:disabled)) {
    cursor: pointer;
  }
  
  .flyout {
    width: calc(100% - 3em);
    height: 100%;
    overflow: hidden;
    padding: 0;
    border: solid 4px var(--dialog-border-color);
    margin: 0;
    background: var(--dialog-border-color);
    box-shadow: 0 0.75em 2em 0.25em rgba(0, 0, 0, 0.75);
    display: flex;
    flex-direction: column;
    position: absolute;
    inset: 0;
  }
  
  .flyout__nav {
    min-height: 2em;
    font-size: 1.25em;
    border-bottom: solid 1px;
    background-color: var(--dialog-title-bg-color);
    display: flex;
  }
  
  .flyout__title {
    width: 100%;
    color: var(--dialog-title-text-color);
    padding: 0.5em;
    padding-right: 1em;
    background: var(--dialog-title-bg-color);
  }
  
  .flyout__body {
    height: 100%;
    overflow: auto;
    background: var(--dialog-body-color);
  }
  
  .flyout__close-btn {
    color: var(--dialog-title-text-color);
    padding: 0 1em;
    border: none;
    background: var(--dialog-title-bg-color);
  }
  
  .flyout-mask {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    position: absolute;
    top: 0;
    left: 0;
    backdrop-filter: blur(10px);
  }
</style>
