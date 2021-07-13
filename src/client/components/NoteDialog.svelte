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
  
  function updateEditorValue(newSelStart, newSelEnd, newValue) {
    if (newValue && newValue !== textareaRef.value) textareaRef.value = newValue;
    textareaRef.focus();
    textareaRef.setSelectionRange(newSelStart, newSelEnd);
  }
  
  function selectionIsSurroundedBy(char) {
    const textVal = textareaRef.value;
    const selStart = textareaRef.selectionStart;
    const selEnd = textareaRef.selectionEnd;
    return (
      textVal.substring(selStart - char.length, selStart) === char
      && textVal.substring(selEnd, selEnd + char.length) === char
    );
  }
  
  function selectionIsWrappedWith(char) {
    const selection = textareaRef.value.substring(textareaRef.selectionStart, textareaRef.selectionEnd);
    return selection.startsWith(char) && selection.endsWith(char);
  }
  
  function wrapSelectionWithChar(char) {
    const textVal = textareaRef.value;
    let selStart = textareaRef.selectionStart;
    let selEnd = textareaRef.selectionEnd;
    let newSelStart = selStart;
    let newSelEnd = selEnd;
    let newValue;
    
    if (selEnd > selStart) {
      const selIsSurrounded = selectionIsSurroundedBy(char);
      const selIsWrapped = selectionIsWrappedWith(char);
      let wrapper = selIsSurrounded ? '' : char;
      const padding = selIsSurrounded ? char.length : 0;
      let selPadding = selIsSurrounded ? -padding : wrapper.length;
      const s = textVal.substring(0, selStart - padding);
      let selection = textVal.substring(selStart, selEnd);
      const e = textVal.substring(selEnd + padding, textVal.length);
      
      if (selIsWrapped) {
        wrapper = '';
        selStart = selStart + char.length;
        selEnd = selEnd - char.length;
        selection = textVal.substring(selStart, selEnd);
        selPadding = -char.length;
      }
      
      newSelStart = selStart + selPadding;
      newSelEnd = selEnd + selPadding;
      newValue = `${s}${wrapper}${selection}${wrapper}${e}`;
    }
    
    updateEditorValue(newSelStart, newSelEnd, newValue);
  }
  
  function handleToolClick({ target }) {
    if (target.dataset) {
      const textVal = textareaRef.value;
      const selStart = textareaRef.selectionStart;
      
      switch (target.dataset.type) {
        case 'heading': {
          const leadingText = textVal.substring(0, selStart);
          const line = leadingText.match(/^\n?.*/gm).pop();
          
          let hashes = (line.match(/[#]+/) || [''])[0].length + 1;
          if (hashes > 6) hashes = 1;
          
          const s = textVal.substring(0, selStart - line.length);
          const e = textVal.substring(selStart, textVal.length);
          const updatedLine = line.replace(/^(\n?)([#]+\s)?(.)?/, `$1${Array(hashes).fill('#').join('')} $3`);
          const updatedText = `${s}${updatedLine}${e}`;
          const newCursorPos = selStart + (updatedLine.length - line.length);
          
          updateEditorValue(newCursorPos, newCursorPos, updatedText);
          
          break;
        }
        
        case 'bold': {
          wrapSelectionWithChar('**');
          break;
        }
        
        case 'italic': {
          wrapSelectionWithChar('__');
          break;
        }
        
        case 'strikethrough': {
          wrapSelectionWithChar('~~');
          break;
        }
        
        case 'inlineCode': {
          wrapSelectionWithChar('`');
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
    
    height: 80vh;
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
  .note-form__content:focus {
    outline: none;
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
