<script>
  import { onMount } from 'svelte';
  
  export let disabled = false;
  export let focused = false;
  export let placeholder = 'Query';
  export let onInput = undefined;
  export let onSearch = undefined;
  
  let searchInputRef;
  let searchValue;
  
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
  on:submit={handleSearch}
>
  <div class="search__input-wrapper">
    <input
      bind:this={searchInputRef}
      bind:value={searchValue}
      type="text"
      {placeholder}
      disabled={disabled}
      on:focus={handleFocus}
      on:input={handleInput}
    />
    <button
      class="search__clear-btn"
      type="button"
      disabled={!searchValue}
      on:click={handleClear}
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
  
  * :where(button, input) {
    font-size: 1.2rem;
    line-height: 1em;
    padding: var(--padding--input);
    border: solid 2px;
    background: #fff;
  }
  * :where(button, input):focus {
    outline: solid 1px hsl(0deg 0% 0% / 50%);
    outline-offset: -5px;
  }
  
  .search {
    display: flex;
  }
  .search > *:not(:last-child) {
    margin-bottom: auto;
  }
  
  .search input {
    width: 100%;
    height: 100%;
    padding-right: 2.5em; /* account for clear button */
    border-right: none;
    border-radius: 0.5em 0 0 0.5em;
    margin: 0;
  }
  
  .search > button {
    border-radius: 0 0.5em 0.5em 0;
  }
  
  .search,
  * :where(button, input) {
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
