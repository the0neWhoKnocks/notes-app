<script>
  import { tick } from 'svelte';

  export let autoCompleteItems = [];
  export let onTagChange = undefined;
  export let placeholder = 'Add Tag...';
  export let tags = [];
  
  const KEY__ENTER = 13;
  const KEY__ESC = 27;
  const KEY__UP = 38;
  const KEY__DOWN = 40;
  let autoCompleteItemSelector = '.tags-input__auto-complete-btn';
  let autoCompleteRef;
  let inputRef;
  let items = [];
  let measureRef;
  
  function handleTagClick(ev) {
    if (ev.target !== inputRef) inputRef.focus();
    if (ev.target.matches('.tags-input__tag-delete-btn')) deleteTag(ev);
  }
  
  function handleTagInput() {
    const val = inputRef.value || placeholder;

    measureRef.textContent = val;
    inputRef.style.cssText = `width: ${measureRef.offsetWidth + 1}px`;
    
    items = autoCompleteItems
      .filter((item) => item.toLowerCase().includes(val.toLowerCase()))
      .map((item) => {
        const ndx = item.toLowerCase().indexOf(val.toLowerCase());
        return {
          start: item.substring(0, ndx),
          middle: item.substring(ndx, ndx + val.length),
          end: item.substring(ndx + val.length, item.length),
          tag: item,
        };
      });
    
    if (items.length && autoCompleteRef) autoCompleteRef.scrollTop = 0;
  }
  
  function handleKeyDown(ev) {
    switch (ev.which) {
      case KEY__ENTER:
        ev.preventDefault();
        addTag(ev.currentTarget.value);
        break;
    }
  }
  
  function handleKeyUp(ev) {
    switch (ev.which) {
      case KEY__DOWN:
        if (items.length) {
          autoCompleteRef.querySelector(autoCompleteItemSelector).focus();
        }
        break;
    }
  }
  
  function triggerAutoCompleteSelection(ev) {
    inputRef.value = ev.target.innerText;
    inputRef.focus();
    inputRef.dispatchEvent(new KeyboardEvent('keydown', {
      keyCode: KEY__ENTER,
      which: KEY__ENTER,
    }));
  }
  
  function handleAutoCompleteSelect(ev) {
    if (!ev.target.matches(autoCompleteItemSelector)) return;
    
    const getSiblingsFor = (el) => {
      const getSib = (selector, sibType) => {
        if (autoCompleteItems.length === 1) return;
        
        let currEl = el;
        let sibling;
        
        do {
          const _el = currEl[sibType];
          if (_el && _el.matches(selector)) sibling = _el;
          else currEl = _el;
        }
        while (currEl && currEl[sibType] && !sibling);
        
        return sibling;
      };
      
      return {
        next: (selector) => getSib(selector, 'nextElementSibling'),
        prev: (selector) => getSib(selector, 'previousElementSibling'),
      };
    };
    
    switch (ev.type) {
      case 'click':
        triggerAutoCompleteSelection(ev);
        break;

      case 'keydown': {
        // stop the element from scroll via the down key
        ev.preventDefault();
        const el = ev.target;

        switch (ev.which) {
          case KEY__DOWN: {
            let nextEl = getSiblingsFor(el).next(autoCompleteItemSelector);
            if (!nextEl) nextEl = el.parentNode.querySelector(autoCompleteItemSelector);
            nextEl.focus();
            break;
          }

          case KEY__UP: {
            let prevEl = getSiblingsFor(el).prev(autoCompleteItemSelector);
            if (!prevEl) prevEl = inputRef;
            prevEl.focus();
            break;
          }

          case KEY__ENTER:
            triggerAutoCompleteSelection(ev);
            break;

          case KEY__ESC:
            inputRef.focus();
            break;
        }

        break;
      }
    }
  }
  
  async function addTag(tag) {
    // remove spacing around tag, and punctuation
    tag.trim().replace(/[.,';"]/g, '');

    if (tag !== '') {
      // TODO: maybe just bind value
      inputRef.value = '';
      inputRef.dispatchEvent(new Event('change'));

      // only add new tags
      if (tags.includes(tag)) return;
      
      tags = [...tags, tag];
      
      if (onTagChange) {
        await tick();
        onTagChange(tags);
      }
    }
  }
  
  async function deleteTag({ target: btn }) {
    const { tag } = btn.dataset;

    const tagNdx = tags.findIndex(t => t === tag);
    tags.splice(tagNdx, 1);
    tags = [...tags];
    
    if (onTagChange) {
      await tick();
      onTagChange(tags);
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="tags-input__container"
  on:click={handleTagClick}
>
  <input
    type="hidden"
    name="tags"
    value={tags.join(', ')}
  />
  
  {#each tags as tag}
    <div class="tags-input__tag">
      <span class="tags-input__tag-text">{tag}</span>
      <button
        type="button"
        class="tags-input__tag-delete-btn"
        data-tag={tag}
      >X</button>
    </div>
  {/each}
  <input
    class="tags-input__input"
    type="text"
    {placeholder}
    enterkeyhint="enter"
    bind:this={inputRef}
    on:change={handleTagInput}
    on:input={handleTagInput}
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
  />
  <div
    class="tags-input__measure"
    bind:this={measureRef}
  >{placeholder}</div>
  {#if items.length}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <nav
      class="tags-input__auto-complete-list"
      bind:this={autoCompleteRef}
      on:click={handleAutoCompleteSelect}
      on:keydown={handleAutoCompleteSelect}
    >
    {#each items as { start, middle, end, tag }}
      <button
        type="button"
        class="tags-input__auto-complete-btn"
        data-tag={tag}
      >
        {start}<mark>{middle}</mark>{end}
      </button>
    {/each}
    </nav>
  {/if}
</div>

<style>
  .tags-input__container {
    font-size: 1rem;
    padding: 0.5em;
    border: solid 1px #808080;
    border-radius: 0.5em;
    background: #fff;
    vertical-align: top;
    position: relative;
    cursor: text;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
  }
  
  .tags-input__tag {
    line-height: 1.75em;
    border: 1px solid #808080;
    border-radius: 0.25em;
    background: #eee;
    display: flex;
    align-items: center;
    cursor: default;
  }
  .tags-input__tag-text {
    padding: 0 0.5em;
  }
  .tags-input__tag-delete-btn {
    width: auto;
    height: 100%;
    color: #fff;
    font-size: 0.65em;
    font-weight: 700;
    text-align: center;
    padding: 0.25em 0.75em;
    border-radius: 0 0.5em 0.5em 0;
    background: #808080;
    cursor: pointer;
  }
  .tags-input__tag-delete-btn:hover {
    background: #B32D0D;
    outline: none;
  }
  /*
    The tag input and the measure element need to have the same sizing so that
    accurate measurements can be taken.
  */
  .tags-input__input,
  .tags-input__measure {
    font: inherit;
    border: none;
    outline: none;
    white-space: pre;
  }
  .tags-input__input {
    height: 2em;
    padding:0;
    margin-left: 4px;
    display: inline-block;
  }
  .tags-input__measure {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    visibility: hidden;
  }
  
  .tags-input__auto-complete-list {
    max-height: 150px;
    overflow-y: scroll;
    border: solid 1px;
    border-top: none;
    margin: 0;
    background: #fff;
    position: absolute;
    top: 100%;
    left: 0.5em;
    right: 0.5em;
    z-index: 10;
  }
  .tags-input__auto-complete-btn {
    width: 100%;
    color: #444;
    font-weight: bold;
    text-align: left;
    padding: 0.5rem;
    border: none;
    border-bottom: solid 1px #bbb;
    border-radius: unset;
    background: #eee;
    cursor: pointer;
  }
  .tags-input__auto-complete-btn:hover,
  .tags-input__auto-complete-btn:focus {
    color: #eee;
    background: #333;
    outline: none;
  }
</style>
