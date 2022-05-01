<script>
  import { onDestroy, onMount, tick } from 'svelte';
  import Icon, {
    ICON__ARROW_DOWN,
    ICON__ARROW_UP,
  } from './Icon.svelte';
  
  export let onClose = undefined;
  export let onSearch = undefined;
  export let selector = '';
  
  let closing = false;
  let contentEl;
  let currentMatch = 1;
  let domSnapshot;
  let inputDebounce;
  let inputRef;
  let styleRef;
  let totalMatches = 0;
  
  function encodeString(str) {
    return str.replace(/[\u00A0-\u9999<>&]/g, (i) => {
      return `&#${i.charCodeAt(0)};`;
    });
  }
  
  function getTextNodes(el) {
    const a = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    let n;
    
    while ( (n = walk.nextNode()) ) {
      const text = n.textContent.trim().replace(/[\n\s]+/g, '');
      if (text) a.push(n);
    }
    
    return a;
  }
  
  function renderResults(markup) {
    if (onSearch) onSearch(markup);
  }
  
  function resetSearch() {
    renderResults(domSnapshot.innerHTML);
  }
  
  function resetMatches() {
    currentMatch = 1;
    totalMatches = 0;
  }
  
  async function selectMatch() {
    const matchSelector = `[data-find-ndx="${currentMatch}"]`;
    styleRef.textContent = `
      ${matchSelector} {
        outline: solid 3px #ff6a00;
        outline-offset: 4px;
      }
    `;
    
    await tick();
    const yOffset = 15; 
    const matchEl = document.querySelector(matchSelector);
    const yPos = (matchEl.getBoundingClientRect().top + contentEl.scrollTop) - yOffset - contentEl.offsetTop;
    
    contentEl.scrollTo({ top: yPos, behavior: 'smooth' });
  }
  
  function handleInput() {
    clearTimeout(inputDebounce);
    
    const query = inputRef.value;
    if (query) {
      const regEx = new RegExp(query, 'gmi');
      
      inputDebounce = setTimeout(() => {
        const contentClone = domSnapshot.cloneNode(true); // copy the snapshot so there's still a clean version to work from
        const textNodes = getTextNodes(contentClone); // get only raw text nodes to search against (to ensure markup/syntax highlighting isn't effected)
        let ndx = 0;
        
        resetMatches();
        
        for (let i=0; i<textNodes.length; i++) {
          const node = textNodes[i];
          const text = encodeString(node.textContent); // `textContent` doesn't return unencoded items, which can lead to issues when `mark`s are added and HTML is re-rendered
          
          if (regEx.test(text)) {
            const markup = text.replace(regEx, (match) => {
              ndx += 1;
              return `<mark data-find-ndx="${ndx}">${match}</mark>`;
            });
            const temp = document.createElement('div');
            temp.innerHTML = markup;
            node.replaceWith(...temp.childNodes);
          }
        }
        
        if (ndx) {
          totalMatches = ndx;
          renderResults(contentClone.innerHTML);
          selectMatch();
        }
      }, 300);
    }
    else {
      resetMatches();
      resetSearch();
    }
  }
  
  function handlePrevClick() {
    currentMatch = (currentMatch === 1) ? totalMatches : currentMatch - 1;
    selectMatch();
  }
  
  function handleNextClick() {
    currentMatch = (currentMatch === totalMatches) ? 1 : currentMatch + 1;
    selectMatch();
  }
  
  function handleClose() {
    closing = true;
    resetSearch();
  }
  
  function handleKeyUp(ev) {
    if (ev.code === 'Enter') {
      if (totalMatches) handleNextClick();
    }
    else if (
      ev.code === 'Escape'
      && ev.target.closest('.find-nav')
    ) {
      handleClose(ev);
    }
  }
  
  function handleAnimEnd(ev) {
    if (ev.animationName.endsWith('show')) {
      contentEl = document.querySelector(selector);
      
      if (contentEl) {
        domSnapshot = contentEl.cloneNode(true);
        
        styleRef = document.createElement('style');
        styleRef.id = 'findNavStyles';
        document.head.appendChild(styleRef);
        
        inputRef.focus();
        window.addEventListener('keyup', handleKeyUp);
      }
      else alert(`No element found for selector "${selector}"`);
    }
    else if (ev.animationName.endsWith('hide')) {
      if (styleRef) styleRef.remove();
      if (onClose) onClose();
    }
  }
  
  onMount(() => {
    window.addEventListener('animationend', handleAnimEnd);
  });
  
  onDestroy(() => {
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('animationend', handleAnimEnd);
  });
</script>

<nav
  class="find-nav"
  class:hide={closing}
>
  <div class="find-nav__input-wrapper">
    <input
      type="text"
      placeholder="Find..."
      bind:this={inputRef}
      on:input={handleInput}
    />
    {#if totalMatches}
      <div class="find-nav__matches">
        <span>{currentMatch}</span>/<span>{totalMatches}</span>
      </div>
    {/if}
  </div>
  <button on:click={handlePrevClick} title="Previous Match">
    <Icon type="{ICON__ARROW_UP}" />
  </button>
  <button on:click={handleNextClick} title="Next Match">
    <Icon type="{ICON__ARROW_DOWN}" />
  </button>
  <button on:click={handleClose} title="Close Find Nav">&#10005;</button>
</nav>

<style>
  @keyframes show {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0%);
      opacity: 1;
    }
  }
  @keyframes hide {
    0% {
      transform: translateY(0%);
      opacity: 1;
    }
    100% {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
  
  .find-nav {
    padding: 0.25em;
    border-radius: 0.25em;
    background-color: #fff;
    display: flex;
    animation: show 300ms;
  }
  .find-nav.hide {
    animation: hide 300ms;
  }
  
  .find-nav__input-wrapper {
    width: 14em;
    display: flex;
    align-items: center;
  }
  .find-nav__input-wrapper::after {
    content: '';
    height: 100%;
    border-right: solid 1px #666;
    margin: 0 0.25em;
    display: inline-block;
    vertical-align: top;
  }
  
  .find-nav__input-wrapper input {
    width: 100%;
  }
  
  .find-nav__matches {
    color: #999;
    font-weight: normal;
    line-height: 1em;
    padding: 0 0.25em;
  }
  
  .find-nav button {
    width: 2em;
    color: #000;
    padding: 0;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.find-nav button > *) {
    pointer-events: none;
  }
  
  .find-nav :is(button, input) {
    border: none;
  }
  .find-nav :is(button, input):where(:focus, :hover) {
    border: none;
    outline: none;
    background-color: #eee;
  }
</style>
