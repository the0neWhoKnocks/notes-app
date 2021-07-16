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
  let titleValue = $noteDialogData.title;
  
  const genQuery = (title = '') => {
    let query = `?p=${encodeURIComponent($noteDialogData.path)}`;
    if (title) query += `&t=${encodeURIComponent(title)}`;
    return query;
  };
  
  const editingNote = $noteDialogData.action === 'edit';
  let saveBtnDisabled = editingNote;
  let query = genQuery();
  
  function closeDialog() {
    noteDialogData.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  function diffCheck() {
    if (editingNote) {
      saveBtnDisabled = (
        textareaRef.value === $noteDialogData.content
        && titleValue === $noteDialogData.title
      );
    }
  }
  
  function handleChange({ target }) {
    switch (target.name) {
      case 'content': {
        diffCheck();
        break;
      }
      
      case 'title': {
        titleValue = target.value;
        query = genQuery(kebabCase(titleValue));
        diffCheck();
        break;
      }
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
    const scrollPos = textareaRef.scrollTop;
    
    if (newValue && newValue !== textareaRef.value) textareaRef.value = newValue;
    textareaRef.focus();
    textareaRef.setSelectionRange(newSelStart, newSelEnd);
    textareaRef.scrollTop = scrollPos;
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
  
  function getSelectedLines() {
    const textVal = textareaRef.value;
    let selStart = textareaRef.selectionStart;
    let selEnd = textareaRef.selectionEnd;
    
    const s = textVal.substring(0, selStart).split('\n').pop();
    const m = textVal.substring(selStart, selEnd);
    const e = textVal.substring(selEnd, textVal.length).split('\n').shift();
    
    return {
      indexes: {
        start: selStart - s.length,
        end: selEnd + e.length,
      },
      lines: `${s}${m}${e}`.split('\n'),
    };
  }
  
  function getCharIndex(startChar, endChar) {
    const textVal = textareaRef.value;
    let selStart = textareaRef.selectionStart;
    let selEnd = textareaRef.selectionEnd;
    let startIndex = 0;
    let endIndex = textVal.length;
    
    if (startChar) {
      for (let i=selStart; i>=0; i--) {
        if (textVal[i] === startChar) {
          startIndex = i;
          break;
        }
      }
    }
    
    if (endChar) {
      for (let i=selEnd; i<textVal.length; i++) {
        if (textVal[i] === endChar) {
          endIndex = i;
          break;
        }
      }
    }
    
    return { start: startIndex, end: endIndex };
  }
  
  function blockCheck(char) {
    const textVal = textareaRef.value;
    const selStart = textareaRef.selectionStart;
    let block;
    
    // first check if there are any blocks
    if (textVal.includes(char)) {
      // gather all blocks
      const lines = textVal.split('\n');
      let currBlock = {};
      let lineNdx = 0;
      
      for (let i=0; i<lines.length; i++) {
        const line = lines[i];
        const newline = 1;
        
        if (line.startsWith(char)) {
          if (currBlock.start === undefined) {
            currBlock.start = lineNdx;
          }
          else {
            currBlock.end = lineNdx + char.length + newline;
            
            if (
              selStart >= currBlock.start
              && selStart <= currBlock.end
            ) {
              block = currBlock;
              break;
            }
            
            currBlock = {};
          }
        }
        
        lineNdx += line.length + newline;
      }
    }
    
    return block;
  }
  
  function wrapSelectionWithBlock(char) {
    const textVal = textareaRef.value;
    const block = blockCheck(char);
    
    let startIndex, endIndex, wrapper, nl;
    if (block) {
      startIndex = block.start;
      endIndex = block.end;
      wrapper = '';
      nl = '';
    }
    else {
      const indexes = getCharIndex('\n', '\n');
      startIndex = indexes.start;
      endIndex = indexes.end;
      wrapper = char;
      nl = '\n';
    }
    
    let newSelStart = startIndex;
    let newSelEnd = endIndex;
    let newValue;
    const firstNL = startIndex === 0 ? '' : nl;
    
    const s = textVal.substring(0, startIndex);
    let selection = textVal.substring(startIndex, endIndex);
    const e = textVal.substring(endIndex, textVal.length);
    
    if (block) {
      selection = selection
        .replace(new RegExp(`^${char}\n`, 'm'), '')
        .replace(new RegExp(`\n${char}\n$`, 'm'), '');
    }
    
    newValue = `${s}${firstNL}${wrapper}${nl}${selection}${nl}${wrapper}${nl}${e}`;
    
    updateEditorValue(newSelStart, newSelEnd, newValue);
  }
  
  function toggleCharAtLineStart(transform) {
    const textVal = textareaRef.value;
    const selStart = textareaRef.selectionStart;
    const selEnd = textareaRef.selectionEnd;
    const { indexes, lines: selLines } = getSelectedLines();
    const updatedLengths = [];
    const updates = selLines
      .map(line => {
        if (selLines.length > 1 && !line) return '';
        const updated = transform(line);
        updatedLengths.push(updated.length - line.length);
        return updated;
      })
      .join('\n');
    const s = textVal.substring(0, indexes.start);
    const e = textVal.substring(indexes.end, textVal.length);
    const updatedText = `${s}${updates}${e}`;
    // These start/end values are slightly off, but they do the job of keeping
    // the multiple lines selected
    let updatedSelStart = selStart + updatedLengths[0];
    let updatedSelEnd = selEnd + updatedLengths[updatedLengths.length - 1];
    
    // Ensures that a selection stays on the first selected line, even after an
    // updated line has all it's content removed.
    if (updatedSelStart < indexes.start) updatedSelStart = indexes.start;
    if (updatedSelEnd < indexes.start) updatedSelEnd = indexes.start;
    
    updateEditorValue(updatedSelStart, updatedSelEnd, updatedText);
  }
  
  function handleToolClick({ target }) {
    if (target.dataset) {
      switch (target.dataset.type) {
        case 'heading':
          toggleCharAtLineStart((line) => {
            let hashes = (line.match(/[#]+/) || [''])[0].length + 1;
            if (hashes > 6) hashes = 1;
            
            return line.replace(
              /^(\n?)([#]+\s)?(.)?/,
              `$1${Array(hashes).fill('#').join('')} $3`
            );
          });
          break;
        
        case 'bold':
          wrapSelectionWithChar('**');
          break;
        
        case 'italic':
          wrapSelectionWithChar('__');
          break;
        
        case 'strikethrough':
          wrapSelectionWithChar('~~');
          break;
        
        case 'inlineCode':
          wrapSelectionWithChar('`');
          break;
        
        case 'codeBlock':
          wrapSelectionWithBlock('```');
          break;
        
        case 'blockquote':
          toggleCharAtLineStart((line) => {
            const char = '> ';
            return (line.startsWith(char))
              ? line.replace(new RegExp(`^${char}`), '')
              : `${char}${line}`;
          });
          break;
        
        case 'toc': {
          toggleCharAtLineStart((line) => {
            const char = '::TOC::';
            return (line.startsWith(char))
              ? line.replace(new RegExp(`^${char.replace(/(\[|\])/g, '\\$1')}`), '')
              : `${char}${line}`;
          });
          break;
        }
        
        // case 'preview': {
        //   break;
        // }
      }
      
      handleChange({ target: textareaRef });
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
      {#if editingNote}
        <input type="hidden" name="oldTitle" value={$noteDialogData.title} />
      {/if}
      <LabeledInput label="Title" name="title" value={$noteDialogData.title} autoFocus required />
      <div class="note-form__query">{query}</div>
      <div class="note-form__content-area">
        <nav class="note-form__toolbar" on:click={handleToolClick}>
          <button type="button" title="Heading" data-type="heading" tabindex="-1">#</button>
          <button type="button" title="Bold" data-type="bold" tabindex="-1">B</button>
          <button type="button" title="Italic" data-type="italic" tabindex="-1">I</button>
          <button type="button" title="Strike Through" data-type="strikethrough" tabindex="-1">S</button>
          <button type="button" title="Inline Code" data-type="inlineCode" tabindex="-1">`</button>
          <div class="note-form__sep"></div>
          <button type="button" title="Code Block" data-type="codeBlock" tabindex="-1">```</button>
          <button type="button" title="Block Quote" data-type="blockquote" tabindex="-1">"</button>
          <div class="note-form__sep"></div>
          <button type="button" title="Table of Contents" data-type="toc" tabindex="-1">TOC</button>
          <div class="note-form__sep"></div>
          <button type="button" data-type="preview" tabindex="-1">Preview</button>
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
