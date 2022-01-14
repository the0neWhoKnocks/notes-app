<script>
  import { tick } from 'svelte';
  import kebabCase from '../../utils/kebabCase';
  import parseTags from '../../utils/parseTags';
  import {
    allTags,
    currentNote,
    dialogDataForNote,
    setUserData,
    updateCurrNote,
    userData,
  } from '../stores';
  import Dialog from './Dialog.svelte';
  import GroupNoteNameInput from './GroupNoteNameInput.svelte';
  import LabeledInput from './LabeledInput.svelte';
  import TagsInput from './TagsInput.svelte';
  
  let anchorDialogData;
  let previewing = false;
  let contentText = '';
  let editingNote;
  let formRef;
  let oldTags = [];
  let previewRef;
  let queryParams;
  let saveBtnDisabled;
  let tags = [];
  let textareaRef;
  let titleValue;
  
  function closeDialog() {
    dialogDataForNote.set();
    previewing = false;
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  function diffCheck() {
    if (editingNote) {
      const currTags = document.querySelector('[name="tags"]').value;
      
      saveBtnDisabled = (
        contentText === $dialogDataForNote.content
        && titleValue === $dialogDataForNote.title
        && currTags === oldTags
      );
    }
  }
  
  function listItemCheck() {
    const { indexes: { end, start }, lines } = getSelectedLines();
    const newline = 1;
    const [prevLine] = lines;
    const nextLine = contentText.substring(end + newline).split('\n').shift();
    const liRegEx = /^(?<leadingSpace>\s+)?(?<type>- |1\. )(?<liText>.*)/;
    const {
      groups: { leadingSpace = '', liText, type },
    } = prevLine.match(liRegEx) || { groups: {} };
    
    if (
      // previous line is a list item
      type
      && (
        // with a value
        liText
        // OR within a list and the User is adding blank items to fill later
        || liRegEx.test(nextLine)
      )
    ) {
      insertText(`\n${leadingSpace}${type}`);
      return true;
    }
    // previous line is a blank list item, User probably want to exit out of list
    else if (type) {
      const s = contentText.substring(0, start);
      const e = contentText.substring(end, contentText.length);
      // update text, minus the empty list item
      updateEditorValue(start + newline, start + newline, `${s}\n${e}`);
      return true;
    }
  }
  
  function handleContentKeyDown(ev) {
    const { keyCode } = ev;
    
    if (keyCode === 13) { // ENTER
      // NOTE: Prevent the textarea from randomly scrolling to the top after a
      // newline is added. There's still a flicker during the adjustment, but
      // it's better than all the content suddenly shifting to the top.
      // Only reference of the issue I could find: https://stackoverflow.com/questions/56329625/preventing-textarea-scroll-behaviour-in-chrome-after-newline-added
      ev.preventDefault();
      
      const liAdded = listItemCheck();
      
      if (!liAdded) insertText('\n');
    }
  }
  
  function handleChange({ target }) {
    switch (target.name) {
      case 'content': diffCheck(); break;
      
      case 'title': {
        titleValue = target.value;
        diffCheck();
        break;
      }
    }
  }
  
  function handleQueryChange(params) {
    queryParams = params;
  }
  
  async function handleSubmit() {
    try {
      const { newData } = await setUserData(formRef);
      const { id } = $dialogDataForNote;
      
      updateCurrNote({
        id,
        noteData: {
          ...$currentNote,
          content: newData.content,
          id: kebabCase(newData.title),
          tags: parseTags(newData.tags),
          title: newData.title,
        },
        params: queryParams,
      });
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
  
  function selectText(startPos, endPos) {
    textareaRef.focus();
    textareaRef.setSelectionRange(startPos, endPos);
  }
  
  function updateEditorValue(newSelStart, newSelEnd, newValue) {
    const scrollPos = textareaRef.scrollTop;
    
    if (newValue && newValue !== contentText) contentText = newValue;
    
    // wait a tick for the render
    setTimeout(() => {
      selectText(newSelStart, newSelEnd);
      textareaRef.scrollTop = scrollPos;
      
      diffCheck();
    }, 0);
  }
  
  function selectionIsSurroundedBy(char) {
    const selStart = textareaRef.selectionStart;
    const selEnd = textareaRef.selectionEnd;
    return (
      contentText.substring(selStart - char.length, selStart) === char
      && contentText.substring(selEnd, selEnd + char.length) === char
    );
  }
  
  function selectionIsWrappedWith(char) {
    const selection = contentText.substring(textareaRef.selectionStart, textareaRef.selectionEnd);
    return selection.startsWith(char) && selection.endsWith(char);
  }
  
  function wrapSelectionWithChar(char) {
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
      const s = contentText.substring(0, selStart - padding);
      let selection = contentText.substring(selStart, selEnd);
      const e = contentText.substring(selEnd + padding, contentText.length);
      
      if (selIsWrapped) {
        wrapper = '';
        selStart = selStart + char.length;
        selEnd = selEnd - char.length;
        selection = contentText.substring(selStart, selEnd);
        selPadding = -char.length;
      }
      
      newSelStart = selStart + selPadding;
      newSelEnd = selEnd + selPadding;
      newValue = `${s}${wrapper}${selection}${wrapper}${e}`;
    }
    
    updateEditorValue(newSelStart, newSelEnd, newValue);
  }
  
  function getSelectedLines() {
    let selStart = textareaRef.selectionStart;
    let selEnd = textareaRef.selectionEnd;
    
    const s = contentText.substring(0, selStart).split('\n').pop();
    const m = contentText.substring(selStart, selEnd);
    const e = contentText.substring(selEnd, contentText.length).split('\n').shift();
    
    return {
      indexes: {
        start: selStart - s.length,
        end: selEnd + e.length,
      },
      lines: `${s}${m}${e}`.split('\n'),
    };
  }
  
  function getCharIndex(startChar, endChar) {
    let selStart = textareaRef.selectionStart;
    let selEnd = textareaRef.selectionEnd;
    let startIndex = 0;
    let endIndex = contentText.length;
    
    if (startChar) {
      for (let i=selStart; i>=0; i--) {
        if (contentText[i] === startChar) {
          startIndex = i;
          break;
        }
      }
    }
    
    if (endChar) {
      for (let i=selEnd; i<contentText.length; i++) {
        if (contentText[i] === endChar) {
          endIndex = i;
          break;
        }
      }
    }
    
    return { start: startIndex, end: endIndex };
  }
  
  function blockCheck(char) {
    const selStart = textareaRef.selectionStart;
    let block;
    
    // first check if there are any blocks
    if (contentText.includes(char)) {
      // gather all blocks
      const lines = contentText.split('\n');
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
    
    const s = contentText.substring(0, startIndex);
    let selection = contentText.substring(startIndex, endIndex);
    const e = contentText.substring(endIndex, contentText.length);
    
    if (block) {
      selection = selection
        .replace(new RegExp(`^${char}\n`, 'm'), '')
        .replace(new RegExp(`\n${char}\n$`, 'm'), '');
    }
    
    newValue = `${s}${firstNL}${wrapper}${nl}${selection}${nl}${wrapper}${nl}${e}`;
    
    updateEditorValue(newSelStart, newSelEnd, newValue);
  }
  
  function toggleCharAtLineStart(transformOrChar) {
    const _transform = (typeof transformOrChar === 'function')
      ? transformOrChar
      : (line) => {
        const char = transformOrChar;
        return (line.startsWith(char))
          ? line.replace(new RegExp(`^${char}`), '')
          : `${char}${line}`;
      };
    const selStart = textareaRef.selectionStart;
    const selEnd = textareaRef.selectionEnd;
    const { indexes, lines: selLines } = getSelectedLines();
    const updatedLengths = [];
    const updates = selLines
      .map(line => {
        const updated = _transform(line);
        updatedLengths.push(updated.length - line.length);
        return updated;
      })
      .join('\n');
    const s = contentText.substring(0, indexes.start);
    const e = contentText.substring(indexes.end, contentText.length);
    const updatedText = `${s}${updates}${e}`;
    let updatedSelStart = selStart + updatedLengths[0];
    let updatedSelEnd = selEnd + updatedLengths.reduce((num, val) => num + val, 0);
    
    // Ensures that a selection stays on the first selected line, even after an
    // updated line has all it's content removed.
    if (updatedSelStart < indexes.start) updatedSelStart = indexes.start;
    if (updatedSelEnd < indexes.start) updatedSelEnd = indexes.start;
    
    updateEditorValue(updatedSelStart, updatedSelEnd, updatedText);
  }
  
  function insertText(text, pos) {
    let selStart = textareaRef.selectionStart;
    let selEnd = textareaRef.selectionEnd;
    
    const s = contentText.substring(0, selStart);
    const e = contentText.substring(selEnd, contentText.length);
    let updatedText;
    
    switch (pos) {
      case 'wrap': {
        const selText = contentText.substring(selStart, selEnd);
        const formattedText = text.replace('%s', selText);
        updatedText = `${s}${formattedText}${e}`;
        selEnd = selStart + formattedText.length;
        break;
      }
      default: {
        updatedText = `${s}${text}${e}`;
        selEnd = selStart + text.length;
        selStart = selEnd;
        break;
      }
    }
    
    updateEditorValue(selStart, selEnd, updatedText);
  }
  
  function openAnchorDialog() {
    const selStart = textareaRef.selectionStart;
    const selEnd = textareaRef.selectionEnd;
    
    anchorDialogData = {
      selEnd,
      selStart,
      text: contentText.substring(selStart, selEnd),
    };
  }
  
  function closeAnchorDialog() {
    const { selEnd, selStart } = anchorDialogData;
    anchorDialogData = undefined;
    selectText(selStart, selEnd);
  }
  
  function addAnchor(ev) {
    ev.preventDefault();
    
    const { currentTarget: form } = ev;
    const { selEnd, selStart } = anchorDialogData;
    const data = [...(new FormData(form)).entries()].reduce((obj, [prop, val]) => {
      obj[prop] = val;
      return obj;
    }, {});
    const link = `[${data.text}](${data.url})`;
    
    selectText(selStart, selEnd);
    insertText(link);
    
    anchorDialogData.selEnd = selStart + link.length;
    
    closeAnchorDialog();
  }
  
  async function handleToolClick({ target }) {
    if (target.dataset) {
      const INDENT = '   '; // needs to be 3 for MD nested lists
      
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
          wrapSelectionWithChar('*');
          break;
        
        case 'strikethrough':
          wrapSelectionWithChar('~~');
          break;
        
        case 'inlineCode':
          wrapSelectionWithChar('`');
          break;
        
        case 'anchor':
          openAnchorDialog();
          break;
        
        case 'ul':
          toggleCharAtLineStart('- ');
          break;
        
        case 'ol':
          toggleCharAtLineStart('1. ');
          break;
        
        case 'indent':
          toggleCharAtLineStart(line => `${INDENT}${line}`);
          break;
        
        case 'outdent':
          toggleCharAtLineStart(line => {
            return (line.startsWith(INDENT))
              ? line.replace(new RegExp(`^${INDENT}`), '')
              : line;
          });
          break;
        
        case 'codeBlock':
          wrapSelectionWithBlock('```');
          break;
        
        case 'blockquote':
          toggleCharAtLineStart('> ');
          break;
        
        case 'toc':
          toggleCharAtLineStart('::TOC::');
          break;
        
        case 'preview': {
          previewing = !previewing;
          
          // keep scroll positions in sync'ish
          if (previewRef) textareaRef.scrollTop = previewRef.scrollTop;
          await tick();
          if (previewRef) previewRef.scrollTop = textareaRef.scrollTop;
          
          break;
        }
      }
      
      handleChange({ target: textareaRef });
    }
  }
  
  function deriveNoteData() {
    const { action, content, tags: _tags, title } = $dialogDataForNote;
    
    tags = _tags;
    oldTags = (_tags || []).join(', ');
    titleValue = title;
    editingNote = action === 'edit';
    saveBtnDisabled = editingNote;
    contentText = content;
  }
  
  $: if ($dialogDataForNote) deriveNoteData();
</script>

{#if $dialogDataForNote}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <svelte:fragment slot="dialogTitle">
      {#if editingNote}Edit{:else}Add{/if} Note
    </svelte:fragment>
    <form
      bind:this={formRef}
      class="note-form"
      class:previewing={previewing}
      on:input={handleChange}
      on:submit|preventDefault={handleSubmit}
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value={$dialogDataForNote.action} />
      <input type="hidden" name="path" value={$dialogDataForNote.path} />
      <input type="hidden" name="type" value="note" />
      
      <GroupNoteNameInput
        editing={editingNote}
        label="Title"
        nameAttr="title"
        oldNameAttr="oldTitle"
        onQueryChange={handleQueryChange}
        path={$dialogDataForNote.path}
        valueAttr={$dialogDataForNote.title}
      />
      <TagsInput
        autoCompleteItems={Object.keys($allTags)}
        onTagChange={diffCheck}
        {tags}
      />
      <div class="note-form__content-area">
        <nav class="note-form__toolbar" on:click={handleToolClick}>
          <button
            type="button" title="Heading" data-type="heading" tabindex="-1"
            disabled={previewing}
          >#</button>
          <button
            type="button" title="Bold" data-type="bold" tabindex="-1"
            disabled={previewing}
          >B</button>
          <button
            type="button" title="Italic" data-type="italic" tabindex="-1"
            disabled={previewing}
          >I</button>
          <button 
            type="button" title="Strike Through" data-type="strikethrough" tabindex="-1"
            disabled={previewing}
          >S</button>
          <button
            type="button" title="Inline Code" data-type="inlineCode" tabindex="-1"
            disabled={previewing}
          >`</button>
          <button
            type="button" title="Link" data-type="anchor" tabindex="-1"
            disabled={previewing}
          >A</button>
          <button
            type="button" title="Unordered List" data-type="ul" tabindex="-1"
            disabled={previewing}
          >ul</button>
          <button
            type="button" title="Ordered List" data-type="ol" tabindex="-1"
            disabled={previewing}
          >ol</button>
          <button
            type="button" title="Indent" data-type="indent" tabindex="-1"
            disabled={previewing}
          >_&gt;</button>
          <button
            type="button" title="Outdent" data-type="outdent" tabindex="-1"
            disabled={previewing}
          >&lt;_</button>
          <div class="note-form__sep"></div>
          <button
            type="button" title="Code Block" data-type="codeBlock" tabindex="-1"
            disabled={previewing}
          >```</button>
          <button
            type="button" title="Block Quote" data-type="blockquote" tabindex="-1"
            disabled={previewing}
          >"</button>
          <div class="note-form__sep"></div>
          <button
            type="button" title="Table of Contents" data-type="toc" tabindex="-1"
            disabled={previewing}
          >TOC</button>
          <div class="note-form__sep"></div>
          <button type="button" data-type="preview" tabindex="-1">Preview</button>
        </nav>
        <div class="note-form__content-wrapper">
          <textarea
            bind:this={textareaRef}
            class="note-form__content"
            name="content"
            on:keydown={handleContentKeyDown}
            bind:value={contentText}
          ></textarea>
          {#if previewing}
            <div
              bind:this={previewRef}
              class="note-form__content-preview"
            >
              {@html window.marked.parse(contentText)}
            </div>
          {/if}
        </div>        
      </div>
      <nav class="note-form__btm-nav">
        <button type="button" on:click={handleCloseClick}>Cancel</button>
        <button disabled={saveBtnDisabled}>Save</button>
      </nav>
    </form>
  </Dialog>
{/if}
{#if anchorDialogData}
  <Dialog for="anchor" onCloseClick={closeAnchorDialog}>
    <form on:submit={addAnchor}>
      <LabeledInput
        autoFocus={!anchorDialogData.text}
        label="Text"
        name="text"
        required
        value={anchorDialogData.text}
      />
      <LabeledInput
        autoFocus={anchorDialogData.text}
        label="URL"
        name="url"
        required
      />
      <button>Add</button>
    </form>
  </Dialog>
{/if}

<style>
  :global([dialog-for="anchor"] .dialog__body) {
    padding: 1em;
  }
  
  .note-form {
    --labeled-input__input-width: 100%;
    
    height: 80vh;
    width: 85vw;
    max-width: 700px;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  .note-form__content-area {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .note-form__toolbar {
    color: var(--color--app--fg);
    padding: 0.75em;
    background: var(--color--app--bg);
    display: flex;
  }
  .note-form__toolbar button {
    width: 100%;
    color: inherit;
    border-radius: unset;
    margin: 2px;
  }
  
  .note-form__sep {
    width: 1px;
    height: 100%;
    margin: 0 6px;
    background: var(--color--app--fg);
    flex-shrink: 0;
  }
  
  .note-form__content-wrapper {
    height: 100%;
    position: relative;
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
  
  .note-form__content-preview {
    overflow: auto;
    padding: 1em;
    border: solid 1px;
    background: #fff;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
  
  .note-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .note-form__btm-nav button {
    width: 49%;
  }
  
  .note-form button:disabled {
    opacity: 0.35;
  }
  .note-form.previewing button[data-type="preview"] {
    color: var(--color--app--bg);
    background: var(--color--app--fg);
  }
  
  :global(.note-form .tags-input__container) {
    border-radius: 0.5em 0.5em 0 0;
    margin: 0;
    background: var(--color--app--bg);
  }
  :global(.note-form .tags-input__input) {
    color: var(--color--app--fg); 
    background: transparent;
  }
  :global(.note-form .tags-input__input::placeholder) {
    color: var(--color--app--fg); 
  }
  
  @media (max-width: 700px) {
    .note-form__toolbar {
      display: grid;
      grid-gap: 0.5em;
      grid-template-columns: repeat(8, 1fr);
    }
    
    .note-form__toolbar button {
      width: auto;
      padding: 0.25em 0;
      margin: 0;
    }
    .note-form__toolbar button[data-type="toc"] {
      grid-column: 5 / 7;
    }
    .note-form__toolbar button[data-type="preview"] {
      grid-column: 7 / 9;
    }
    
    .note-form__sep {
      display: none;
    }
  }
</style>
