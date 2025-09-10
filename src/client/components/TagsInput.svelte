<script>
  import { tick } from 'svelte';
  import AutoCompleteInput from './AutoCompleteInput.svelte';
  
  let {
    autoCompleteItems = [],
    onTagChange = undefined,
    placeholder = 'Add Tag...',
    tags = $bindable([]),
  } = $props();
  
  let inputRef;
  
  function handleTagClick(ev) {
    if (ev.target !== inputRef) { inputRef.focus(); }
    if (ev.target.matches('.tags-input__tag-delete-btn')) { deleteTag(ev); }
  }
  
  function handleSelect(val, ev) {
    ev.preventDefault();
    addTag(val);
  }
  
  async function addTag(tag) {
    // remove spacing around tag, and punctuation
    tag.trim().replace(/[.,';"]/g, '');

    if (tag !== '') {
      // TODO: maybe just bind value
      inputRef.value = '';
      inputRef.dispatchEvent(new Event('change', { bubbles: true }));

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
  
  function handleInit(ref) {
    inputRef = ref;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="tags-input__container"
  onclick={handleTagClick}
>
  <input
    type="hidden"
    name="tags"
    value={tags.join(', ')}
  />
  
  {#each tags as tag (tag)}
    <div class="tags-input__tag">
      <span class="tags-input__tag-text">{tag}</span>
      <button
        type="button"
        class="tags-input__tag-delete-btn"
        data-tag={tag}
      >X</button>
    </div>
  {/each}
  
  <AutoCompleteInput
    hasClear={false}
    onInit={handleInit}
    onSelect={handleSelect}
    options={autoCompleteItems}
    {placeholder}
    sizeToText
  />
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
  
  :global(.tags-input__container .auto-complete-input) {
    --autoCompleteMaxHeight: 150px;
    
    display: contents;
    
    & .auto-complete-input__list {
      min-width: unset;
      border: solid 1px;
      border-top: none;
      margin: 0;
      background: #fff;
      top: 100%;
      left: 0.5em;
      right: 0.5em;
      z-index: 10;
    }
    
    & .auto-complete-input__input-wrapper {
      border: unset;
      
      :global(&:has(.auto-complete-input__txt .auto-complete-input__input:focus-visible)) {
        outline: unset;
      }
    }
    
    & .auto-complete-input__txt {
      margin-left: 4px;
      display: flex;
    }
    
    & .auto-complete-input__input,
    & .auto-complete-input__input-overlay {
      padding: 0;
      outline: none;
    }
  }
</style>
