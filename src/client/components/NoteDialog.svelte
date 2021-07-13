<script>
  import {
    ROUTE__API__USER_SET_DATA,
  } from '../../constants';
  import kebabCase from '../../utils/kebabCase';
  import {
    noteDialogData,
    noteGroups,
    userData,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import LabeledInput from './LabeledInput.svelte';  
  
  let formRef;
  let textareaRef;
  
  const genQuery = (title = '') => {
    let query = `?p=${encodeURIComponent($noteDialogData.path)}`;
    if (title) query += `&t=${encodeURIComponent(title)}`;
    return query;
  };
  
  let saveBtnDisabled = $noteDialogData.action === 'edit';
  let query = genQuery();
  
  function closeDialog() {
    noteDialogData.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  function handleChange({ target }) {
    if (target.name === 'title') {
      query = genQuery(kebabCase(target.value));
    }
  }
  
  async function handleSubmit() {
    try {
      const data = await postData(formRef.getAttribute('action'), formRef);
      noteGroups.set(data);
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
  
  function handleToolClick({ target }) {
    if (target.dataset) {
      switch (target.dataset.type) {
        case 'heading': {
          const cursorStart = textareaRef.selectionStart;
          const leadingTxt = textareaRef.value.substring(0, cursorStart);
          const line = leadingTxt.match(/^\n?.*/gm).pop();
          
          let hashes = (line.match(/[#]+/) || [''])[0].length + 1;
          if (hashes > 6) hashes = 1;
          const updatedLine = line.replace(/^(\n?)([#]+\s)?(.)/, `$1${Array(hashes).fill('#').join('')} $3`);
          
          const s = textareaRef.value.substring(0, cursorStart - line.length);
          const e = textareaRef.value.substring(cursorStart, textareaRef.value.length);
          const newCursorPos = cursorStart + (updatedLine.length - line.length);
          
          textareaRef.value = `${s}${updatedLine}${e}`;
          textareaRef.focus();
          textareaRef.setSelectionRange(newCursorPos, newCursorPos);
          break;
        }
      }
    }
  }
</script>

{#if $noteDialogData}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <form
      action={ROUTE__API__USER_SET_DATA}
      bind:this={formRef}
      class="note-form"
      method="POST"
      on:input={handleChange}
      on:submit|preventDefault={handleSubmit}
      slot="dialogBody"
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value={$noteDialogData.action} />
      <input type="hidden" name="path" value={$noteDialogData.path} />
      <input type="hidden" name="type" value="note" />
      <LabeledInput label="Title" name="title" value={$noteDialogData.title} autoFocus required />
      <div class="note-form__query">{query}</div>
      <div class="note-form__content-area">
        <nav class="note-form__toolbar" on:click={handleToolClick}>
          <button type="button" title="Heading" data-type="heading">#</button>
          <button type="button" title="Bold" data-type="bold">B</button>
          <button type="button" title="Italic" data-type="italic">I</button>
          <button type="button" title="Strike Through" data-type="strikethrough">S</button>
          <button type="button" title="Inline Code" data-type="inlineCode">`</button>
          <div class="note-form__sep"></div>
          <button type="button" title="Code Block" data-type="codeBlock">```</button>
          <button type="button" title="Block Quote" data-type="blockquote">"</button>
          <div class="note-form__sep"></div>
          <button type="button" title="Table of Contents" data-type="toc">TOC</button>
          <div class="note-form__sep"></div>
          <button type="button" data-type="preview">Preview</button>
        </nav>
        <textarea
          bind:this={textareaRef}
          class="note-form__content"
          name="content"
          value={$noteDialogData.content || ''}
        ></textarea>
      </div>
      <nav class="note-form__btm-nav">
        <button type="button" on:click={handleCloseClick}>Cancel</button>
        <button disabled={saveBtnDisabled}>Save</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  .note-form {
    --labeled-input__input-width: 100%;
    
    height: 60vh;
    min-width: 50vw;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  .note-form__query {
    font-size: 0.8em;
    padding-left: 3em;
    margin: 0;
    opacity: 0.5;
    transform: translateY(-12px);
  }
  
  .note-form__content-area {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .note-form__toolbar {
    padding: 2px;
    background: var(--bg-color--app);
    display: flex;
  }
  .note-form__toolbar button {
    padding: 2px;
    border: solid 1px;
    border-radius: unset;
    margin: 2px;
    background: transparent;
  }
  
  .note-form__sep {
    width: 2px;
    height: 100%;
    margin: 0 6px;
    background: var(--fg-color--app);
  }
  
  .note-form__content {
    width: 100%;
    height: 100%;
    font-size: inherit;
    padding: 1em;
    resize: none;
  }
  
  .note-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .note-form__btm-nav button {
    width: 49%;
  }
  
  .note-form button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
