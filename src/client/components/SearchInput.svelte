<script>
  import { onMount } from 'svelte';
  
  let {
    disabled = false,
    focused = false,
    placeholder = 'Query',
    onInput = undefined,
    onSearch = undefined,
  } = $props();
  
  let searchInputRef;
  let searchValue = $state.raw();
  
  function handleSearch(ev) {
    ev.preventDefault();
    if (onSearch) onSearch(searchValue);
  }
  
  function handleFocus(ev) {
    ev.currentTarget.select();
  }
  
  function handleInput() {
    if (onInput) onInput(searchValue);
  }
  
  function handleClear() {
    searchValue = '';
    if (onInput) onInput(searchValue);
  }
  
  onMount(() => {
    if (focused) searchInputRef.focus();
  });
</script>

<form
  class="search"
  class:is--disabled={disabled}
  onsubmit={handleSearch}
>
  <div class="search__input-wrapper">
    <input
      bind:this={searchInputRef}
      bind:value={searchValue}
      type="text"
      {placeholder}
      disabled={disabled}
      onfocus={handleFocus}
      oninput={handleInput}
    />
    <button
      class="search__clear-btn"
      type="button"
      aria-label="Clear Search"
      disabled={!searchValue}
      onclick={handleClear}
    >
      <svg viewBox="0 0 100 100">
        <polyline points="0,0 100,100" />
        <polyline points="100,0 0,100" />
      </svg>
    </button>
  </div>
  <button disabled={disabled}>Search</button>
</form>

<style>
  :root {
    --padding--input: 0.5em;
  }

  .is--disabled,
  *:disabled {
    opacity: 0.75;
  }
  
  .search {
    display: flex;
    
    & :where(:global(button, input)) {
      font-size: 1.2rem;
      line-height: 1em;
      padding: var(--padding--input);
      border: solid 2px;
      background: #fff;
    }
    
    & :where(:global(button, input)):focus {
      outline: solid 1px hsl(0deg 0% 0% / 50%);
      outline-offset: -5px;
    }
    
    & > *:not(:last-child) {
      margin-bottom: 0;
    }
    
    & input {
      width: 100%;
      height: 100%;
      padding-right: 2.5em; /* account for clear button */
      border-right: none;
      border-radius: 0.5em 0 0 0.5em;
      margin: 0;
    }
    
    & > button {
      border-radius: 0 0.5em 0.5em 0;
    }
  }
  
  .search,
  * :where(:global(button, input)) {
    transition: opacity 300ms;
  }
  
  .search__input-wrapper {
    width: 100%;
    position: relative;
  }
  
  .search__clear-btn {
    width: 1em;
    height: 1em;
    color: #666;
    padding: 0.5em;
    border: none;
    outline: none;
    background: transparent;
    box-sizing: content-box;
    position: absolute;
    top: 50%;
    right: 0.1em;
    transform: translateY(-50%);
  }
  .search__clear-btn:disabled {
    opacity: 0.25;
  }
  .search__clear-btn svg {
    stroke: currentColor;
    stroke-width: 1.5em;
    overflow: visible;
    pointer-events: none;
  }
</style>
