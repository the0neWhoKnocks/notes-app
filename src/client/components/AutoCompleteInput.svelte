<script module>
  const KEY__ARROW_DOWN = 'ArrowDown';
  const KEY__ARROW_UP = 'ArrowUp';
  const KEY__ENTER = 'Enter';
  
  const formatItemData = (str) => str.toLowerCase().replace(/(\s|_)/g, '-');
</script>
<script>
  import { onMount, tick } from 'svelte';
  
  const uid = $props.id();
  let {
    hasClear = true,
    name,
    placeholder = '',
    onInit,
    onSelect,
    options,
    s_option,
    sizeToText = false,
  } = $props();
  
  const styleId = `autocompleteStyles_${uid}`;
  let currentInputValue = $state.raw('');
  let hasFocus = $state.raw(false);
  let inputRef;
  let inputSize = $derived.by(() => {
    const minSize = 2;
    let s = (overlayContent?.length || currentInputValue?.length || placeholder?.length || 2);
    return ((s < minSize) ? minSize : s) - 1;
  });
  let itemIndex = $state.raw(0);
  let listRef;
  let listStyles = $state.raw('');
  let listVisible = $state.raw(false);
  let overlayContent = $state.raw('');
  let visibleOpts = $state.raw([]);
  
  function handleArrowKeysInList(ev) {
    if (ev.key !== KEY__ARROW_DOWN && ev.key !== KEY__ARROW_UP) { return; }
  
    ev.preventDefault();
    
    switch (ev.key) {
      case KEY__ARROW_DOWN:
        itemIndex += 1;
        if (itemIndex === visibleOpts.length) { itemIndex = 0; }
        break;
  
      case KEY__ARROW_UP:
        itemIndex -= 1;
        if (itemIndex < 0) {
          updateInputOverlayText(inputRef);
          inputRef.focus();
          return;
        }
        break;
    }
    
    const currItem = visibleOpts[itemIndex];
    
    updateInputOverlayText(currItem);
    currItem.focus();
  }
  
  async function handleBlur() {
    await tick(); // when switching focus from input to opt, it temporarily goes to body, so wait
    
    const internalItemSelected = (
      document.activeElement === inputRef
      || document.activeElement.classList.contains('auto-complete-input__option')
    );
    
    if (!internalItemSelected) {
      hasFocus = false;
      listVisible = false;
      await updateListStyles('');
      updateInputOverlayText();
      currentInputValue = undefined;
    }
  }
  
  async function handleClear() {
    updateInputOverlayText();
    await updateListStyles('');
    inputRef.value = '';
    listVisible = false;
    
    if (document.activeElement !== inputRef) { inputRef.focus(); }
  }
  
  async function handleInputChange(ev) {
    const { currentTarget: { value }, type } = ev;
    
    let rules = '';
    
    if (type === 'focus') { hasFocus = true; }
    
    if (value) {
      listVisible = true;
      rules = `
        .auto-complete-input__option[data-opt*="${formatItemData(value)}"] {
          display: flex;
        }
      `;
    }
    
    if (value !== currentInputValue) { await updateListStyles(rules); }
    
    if (listRef.offsetHeight !== 0) {
      // find visible items in the drop down to select
      visibleOpts = [...listRef.children].filter((opt) => {
        return opt.offsetHeight !== 0;
      });
      
      if (!visibleOpts.length) { listVisible = false; }
    }
    
    if (type !== 'focus') { currentInputValue = value; }
  }
  
  async function handleItemSelection(ev) {
    const { target } = ev;
    const { nodeName } = target;
    let opt;
    
    if (nodeName !== 'INPUT') {
      ev.preventDefault();
      
      opt = target;
      inputRef.value = opt.dataset.opt;
      
      updateInputOverlayText();
      await updateListStyles('');
      
      if (document.activeElement !== inputRef) { inputRef.focus(); }
    }
    
    listVisible = false;
    
    onSelect?.(inputRef.value, ev);
    
    overlayContent = '';
    currentInputValue = '';
  }
  
  function handleKeyDown(ev) {
    if (ev.key === KEY__ENTER) { return handleItemSelection(ev); }
    
    const item = ev.target;
    
    if (item === inputRef) {
      if (ev.key === KEY__ARROW_DOWN) { itemIndex = -1; }
    }
    
    handleArrowKeysInList(ev);
  }
  
  function updateInputOverlayText(item = {}) {
    const value = (item.nodeName === 'BUTTON') ? item.innerText : '';
    overlayContent = value;
  }
  
  async function updateListStyles(rules = '') {
    listStyles = rules;
    await tick();
  }
  
  onMount(() => {
    onInit?.(inputRef);
  });
</script>

<svelte:window onclick={(hasFocus) ? handleBlur : null} />
<svelte:element this={'style'} id={styleId}>{listStyles}</svelte:element>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="auto-complete-input"
  onkeydown={handleKeyDown}
>
  <div class="auto-complete-input__input-wrapper">
    <div class="auto-complete-input__txt">
      <input
        class="auto-complete-input__input"
        class:size-to-text={sizeToText}
        {name}
        {placeholder}
        size={(sizeToText) ? inputSize : null}
        type="text"
        enterkeyhint="enter"
        autocomplete="off"
        bind:this={inputRef}
        onfocus={handleInputChange}
        oninput={handleInputChange}
      >
      <div class="auto-complete-input__input-overlay">{overlayContent}</div>
    </div>
    {#if hasClear}
      <button
        class="auto-complete-input__clear-btn"
        type="button"
        onclick={handleClear}
      >&#10005;</button>
    {/if}
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="auto-complete-input__list"
    class:is--visible={listVisible}
    bind:this={listRef}
    onclick={handleItemSelection}
  >
    {#each options as opt (opt)}
      <button class="auto-complete-input__option" type="button" data-opt={opt}>
        {#if s_option}{@render s_option()}{:else}{opt}{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  :root {
    --autoCompleteBGColor: #fff;
    --autoCompleteMaxHeight: 8em;
    --autoCompleteWidth: 16em;
  }
  
  .auto-complete-input {
    width: var(--autoCompleteWidth);
    background: var(--autoCompleteBGColor);
    position: relative;
  }
  
  .auto-complete-input__input-wrapper {
    border: solid 1px;
    display: flex;
    
    &:has(.auto-complete-input__txt .auto-complete-input__input:focus-visible) {
      outline: solid 1px;
    }
  }
  
  .auto-complete-input__txt {
    width: 100%;
    position: relative;
  }
  
  .auto-complete-input__input,
  .auto-complete-input__input-overlay {
    width: 100%;
    font: 400 1em system-ui;
    padding: 0.5em 1em;
    user-select: none;
  }
  
  .auto-complete-input__input {
    border: none;
    
    &:focus-visible {
      outline: none;
    }
    
    &.size-to-text {
      font-family: monospace;
    }
  }
  
  .auto-complete-input__input-overlay {
    display: flex;
    align-items: center;
    position: absolute;
    top: 1px;
    left: 0;
    bottom: 1px;
    right: 0;
    pointer-events: none;
  
    &:not(:empty) {
      background: var(--autoCompleteBGColor);
    }
  }
  
  .auto-complete-input__clear-btn {
    width: auto;
    color: #000;
    padding: 0 0.75em;
    border: none;
    border-radius: unset;
    background: var(--autoCompleteBGColor);
    cursor: pointer;
    display: none;
    
    .auto-complete-input__txt:has(.auto-complete-input__input:not(:placeholder-shown) + .auto-complete-input__input-overlay:empty) + &,
    .auto-complete-input__txt:has(.auto-complete-input__input-overlay:not(:empty)) + & {
      display: block;
    }
  }
  
  .auto-complete-input__list {
    min-width: 100%;
    max-height: var(--autoCompleteMaxHeight);
    overflow-y: auto;
    border: solid 1px #ddd;
    background: var(--autoCompleteBGColor);
    display: none;
    position: absolute;
    top: calc(100% - 1px);
    left: 0;
    
    &.is--visible {
      display: block;
    }
  }
  
  .auto-complete-input__option {
    width: 100%;
    color: #000;
    font-size: inherit;
    text-align: left;
    padding: 0.5em 1em;
    border: none;
    border-radius: unset;
    background: var(--autoCompleteBGColor);
    cursor: pointer;
    appearance: none;
    display: none;
    align-items: center;
    
    &:focus-visible,
    &:hover {
      outline: unset;
      background: rgb(0 0 0 / 6%);
    }
    
    & > :global(*) {
      pointer-events: none;
    }
  }
</style>
