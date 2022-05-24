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
  import Icon, {
    ICON__BOLD,
    ICON__CODE_BLOCK,
    ICON__HEADING,
    ICON__HR,
    ICON__INDENT,
    ICON__INLINE_CODE,
    ICON__ITALIC,
    ICON__LINK,
    ICON__NON_BREAKING,
    ICON__ORDERED_LIST,
    ICON__OUTDENT,
    ICON__PREVIEW,
    ICON__QUOTE,
    ICON__STRIKETHROUGH,
    ICON__TABLE,
    ICON__TOC,
    ICON__UNORDERED_LIST,
  } from './Icon.svelte';
  import LabeledInput from './LabeledInput.svelte';
  import TagsInput from './TagsInput.svelte';
  
  const TABLE_COLUMN_DEFAULT_COUNT = 2;
  const TABLE_COLUMN_MIN_COUNT = 1;
  let anchorDialogData;
  let contentText = '';
  let contentWrapperRef;
  let editingNote;
  let formRef;
  let keyDownContentData;
  let oldTags = [];
  let previewing = false;
  let previewRef;
  let queryParams;
  let saveBtnDisabled;
  let tableDialogData;
  let tags = [];
  let textareaRef;
  let textSelected = false;
  let titleValue;
  let wrap = true;
  
  function parseForm(form) {
    return [...(new FormData(form)).entries()].reduce((obj, [prop, val]) => {
      obj[prop] = val;
      return obj;
    }, {});
  }
  
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
  
  function listItemCheck(lineData) {
    const { indexes: { end, start }, lines } = lineData;
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
      insertText(`${leadingSpace}${type}`);
      return true;
    }
    // previous line is a blank list item, User probably want to exit out of list
    else if (type) {
      // update text, minus the empty list item
      updateEditorValue('', {
        preSelect: { end, start },
        postSelect: {
          end: start + newline,
          start: start + newline,
        },
      });
      return false;
    }
  }
  
  function tableRowCheck(lineData) {
    const { indexes: { end, start }, lines } = lineData;
    const newline = 1;
    const [prevLine] = lines;
    const leadingSpaceRegEx = /^\s+/;
    const rowRegEx = /(^\|\s|\s\|\s|\s\|$)/g;
    
    if (rowRegEx.test(prevLine)) {
      const leadingSpace = prevLine.match(leadingSpaceRegEx) || '';
      const pipes = prevLine.match(rowRegEx) || [];
      
      // there could be a pipe in some text, only care if there are multiple
      if (pipes.length > 1) {
        const rowText = prevLine.replace(/\|/g, '').trim();
        
        // create a blank row
        if (rowText) {
          const columns = pipes.map((pipe, ndx) => {
            // first pipe could have leading space so don't rely on it's spacing
            return (ndx === 0) ? '| ' : pipe;
          }).join('');
          
          insertText(`${leadingSpace}${columns}`);
          return true;
        }
        // previous row was blank, User wants to exit out of the Table
        else {
          // update text, minus the empty list item
          updateEditorValue('', {
            preSelect: { end, start },
            postSelect: {
              end: start + newline,
              start: start + newline,
            },
          });
          return false;
        }
      }
    }
  }
  
  function getLeadingSpace(line) {
    if (line === undefined) {
      const { lines } = getSelectedLines();
      // since multiple lines could be selected, only process the last line
      line = lines.pop();
    }
    
    return (line.match(/^\s+/) || [''])[0];
  }
  
  function handleContentKeyDown(ev) {
    const { key, shiftKey } = ev;
    
    if (key === 'Enter') {
      if (shiftKey) insertText(`\n${getLeadingSpace()}`);
      else keyDownContentData = getSelectedLines();
    }
    else handleToolClick(ev);
    
    handleSelection(ev);
  }
  
  function handleContentKeyUp(ev) {
    const { key, shiftKey } = ev;
    
    autoChecks: if (
      keyDownContentData // when Dialogs (for anchors/tables) are open, this'll be undefined
      && (key === 'Enter' && !shiftKey)
    ) {
      if (listItemCheck(keyDownContentData)) break autoChecks;
      else if (tableRowCheck(keyDownContentData)) break autoChecks;
    }
    
    keyDownContentData = undefined;
  }
  
  function handleChange({ target }) {
    switch (target.name) {
      case 'content':
        tick().then(() => {
          textareaRef.focus(); // prevents Mobile Soft Keyboard from popping up and down when WYSIWYG button is clicked
          diffCheck();
        });
        break;
      
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
  
  function updateEditorValue(newText, { postSelect, preSelect } = {}) {
    const selStart = preSelect?.start || textareaRef.selectionStart;
    const selEnd = preSelect?.end || textareaRef.selectionEnd;
    
    // add changes
    selectText(selStart, selEnd);
    document.execCommand('insertText', false, newText);
    
    // select anything that needs selecting
    if (postSelect) selectText(postSelect.start, postSelect.end);
    
    diffCheck();
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
    let newSelEnd = selEnd;
    
    if (selEnd > selStart) {
      const selIsSurrounded = selectionIsSurroundedBy(char);
      const selIsWrapped = selectionIsWrappedWith(char);
      let wrapper = selIsSurrounded ? '' : char;
      let selection = contentText.substring(selStart, selEnd);
      
      if (selIsWrapped) {
        selection = contentText.substring(selStart + char.length, selEnd - char.length);
        newSelEnd = selEnd - (char.length * 2);
        wrapper = '';
      }
      else {
        newSelEnd = selEnd + (wrapper.length * 2);
      }
      
      updateEditorValue(`${wrapper}${selection}${wrapper}`, {
        postSelect: {
          end: newSelEnd,
          start: selStart,
        },
      });
    }
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
      const charRegEx = new RegExp(`(\\s+)?${char}`);
      let currBlock = {};
      let lineNdx = 0;
      
      for (let i=0; i<lines.length; i++) {
        const line = lines[i];
        const newline = 1;
        
        if (charRegEx.test(line)) {
          if (currBlock.start === undefined) {
            currBlock.start = lineNdx;
          }
          else {
            currBlock.leadingSpace = getLeadingSpace(line);
            currBlock.end = lineNdx + currBlock.leadingSpace.length + char.length;
            
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
    let indexes;
    let leadingSpace = '';
    
    let startIndex, endChunk, endIndex, wrapper, nl;
    if (block) {
      startIndex = block.start;
      endIndex = block.end;
      leadingSpace = block.leadingSpace;
      wrapper = '';
      nl = '';
      endChunk = `${nl}${wrapper}`;
    }
    else {
      indexes = getCharIndex('\n', '\n');
      leadingSpace = getLeadingSpace();
      startIndex = indexes.start;
      endIndex = indexes.end;
      wrapper = char;
      nl = '\n';
      endChunk = `${nl}${leadingSpace}${wrapper}`;
    }
    
    const addedNewLines = 2;
    let endPos;
    let preSelect;
    let selection = contentText.substring(startIndex, endIndex);
    let startPos;
    
    if (block) {
      endPos = block.end - (leadingSpace.length * 2) - (char.length * 2) - addedNewLines;
      startPos = block.start + leadingSpace.length;
      preSelect = block;
      selection = selection
        .replace(new RegExp(`^(\\s+)?${char}\\n`, 'm'), '')
        .replace(new RegExp(`\\n(\\s+)?${char}$`, 'm'), '');
    }
    else {
      endPos = indexes.end + endChunk.length;
      startPos = indexes.start + (leadingSpace.length * 2) + char.length + addedNewLines;
    }
    
    updateEditorValue(`${wrapper}${selection}${endChunk}`, {
      preSelect,
      postSelect: { end: endPos, start: startPos },
    });
  }
  
  function toggleCharAtLineStart(transformOrChar) {
    const _transform = (typeof transformOrChar === 'function')
      ? transformOrChar
      : (line) => {
        const char = transformOrChar;
        const leadingSpace = getLeadingSpace(line);
        
        return (line.startsWith(`${leadingSpace}${char}`))
          ? line.replace(new RegExp(`^${leadingSpace}${char}`), leadingSpace)
          : `${leadingSpace}${char}${line.replace(new RegExp(`^${leadingSpace}`), '')}`;
      };
    const selStart = textareaRef.selectionStart;
    const selEnd = textareaRef.selectionEnd;
    const { indexes, lines: selLines } = getSelectedLines();
    const updatedLengths = [];
    let updates = selLines
      .map(line => {
        const updated = _transform(line);
        updatedLengths.push(updated.length - line.length);
        return updated;
      })
      .join('\n');
    let updatedSelStart = selStart + updatedLengths[0];
    let updatedSelEnd = selEnd + updatedLengths.reduce((num, val) => num + val, 0);
    
    let preEnd = indexes.end;
    let preStart = indexes.start;
    if (!updates) {
      updates = '\n';
      preStart -= 1;
    }
    
    // Ensures that a selection stays on the first selected line, even after an
    // updated line has all it's content removed.
    if (updatedSelStart < indexes.start) updatedSelStart = indexes.start;
    if (updatedSelEnd < indexes.start) updatedSelEnd = indexes.start;
    
    updateEditorValue(updates, {
      preSelect: {
        end: preEnd,
        start: preStart,
      },
      postSelect: {
        end: updatedSelEnd,
        start: updatedSelStart,
      },
    });
  }
  
  function insertText(text) {
    updateEditorValue(text);
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
    const data = parseForm(form);
    const link = `[${data.text}](${data.url})`;
    
    selectText(selStart, selEnd);
    insertText(link);
    
    anchorDialogData.selEnd = selStart + link.length;
    
    closeAnchorDialog();
  }
  
  function openTableDialog() {
    tableDialogData = {
      columnCount: TABLE_COLUMN_DEFAULT_COUNT,
    };
  }
  
  function closeTableDialog() {
    tableDialogData = undefined;
  }
  
  function addTable(ev) {
    ev.preventDefault();
    
    const { currentTarget: form } = ev;
    const cols = [...Object.values(parseForm(form))];
    const table = [
      `| ${cols.join(' | ')} |`,
      `| ${cols.map(col => Array(col.length).fill('-').join('')).join(' | ')} |`,
      `| ${Array(cols.length).join(' | ')} |`,
    ].join('\n');
    
    insertText(table);
    closeTableDialog();
  }
  
  function handleTableColumnChange({ target: { value } }) {
    const count = +value;
    if (
      !isNaN(count)
      && count >= TABLE_COLUMN_MIN_COUNT
    ) tableDialogData.columnCount = count;
  }
  
  async function handleToolClick(ev) {
    const INDENT = '   '; // needs to be 3 for MD nested lists
    const { ctrlKey, key, target, type: keyType } = ev;
    let toolType;
    
    if (ctrlKey && keyType === 'keydown') {
      switch (key) {
        case ']': { toolType = 'indent'; break; }
        case '[': { toolType = 'outdent'; break; }
        case 'b': { toolType = 'bold'; break; }
        case 'i': { toolType = 'italic'; break; }
      }
    }
    else if (target.dataset && target.dataset.type) {
      toolType = target.dataset.type;
    }
    
    switch (toolType) {
      case 'heading':
        toggleCharAtLineStart((line) => {
          let hashes = (line.match(/[#]+/) || [''])[0].length + 1;
          if (hashes > 6) hashes = 0;
          
          hashes = Array(hashes).fill('#').join('');
          if (hashes.length) hashes = `${hashes} `;
          
          return line.replace(
            /^(\n?)([#]+\s)?(.)?/,
            `$1${hashes}$3`
          );
        });
        break;
      
      case 'hr':
        toggleCharAtLineStart('---');
        break;
      
      case 'bold':
        wrapSelectionWithChar('**');
        break;
      
      case 'italic':
        wrapSelectionWithChar('_');
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
      
      case 'table':
        openTableDialog();
        break;
      
      case 'wrap':
        wrap = !wrap;
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
  
  function handleSelection({ key, type }) {
    clearTimeout(window.contentBlurTimeout);
    
    // NOTE: If text selected, and User presses SHIFT (and only SHIFT), the 
    // buttons become disabled, so exit out before processing anything else.
    if (type === 'keydown' && key === 'Shift') return;
    if (type === 'blur') {
      // NOTE: Delay the blur in case a User hits a toolbar button
      window.contentBlurTimeout = setTimeout(() => {
        textSelected = false;
      }, 100);
    }
    else if (type === 'selectionchange') {
      const { focusNode } = window.getSelection();
      let selected = false;
      
      if (focusNode === contentWrapperRef) {
        selected = textareaRef.selectionStart !== textareaRef.selectionEnd;
      }
      
      textSelected = selected;
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
  
  $: if ($dialogDataForNote) {
    deriveNoteData();
    document.addEventListener('selectionchange', handleSelection);
  }
  else {
    document.removeEventListener('selectionchange', handleSelection);
  }
</script>

{#if $dialogDataForNote}
  <Dialog
    modal
    onCloseClick={handleCloseClick}
  >
    <svelte:fragment slot="dialogTitle">
      {#if editingNote}Edit{:else}Add{/if} Note
    </svelte:fragment>
    <form
      bind:this={formRef}
      class="note-form"
      class:previewing={previewing}
      class:wrap={wrap}
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
          >
            <Icon type="{ICON__HEADING}" />
          </button>
          <button
            type="button" title="Horizontal Rule" data-type="hr" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__HR}" />
          </button>
          <button
            type="button" title="Bold &#013; CTRL + B" data-type="bold" tabindex="-1"
            disabled={previewing || !textSelected}
          >
            <Icon type="{ICON__BOLD}" />
          </button>
          <button
            type="button" title="Italic &#013; CTRL + I" data-type="italic" tabindex="-1"
            disabled={previewing || !textSelected}
          >
            <Icon type="{ICON__ITALIC}" />
          </button>
          <button 
            type="button" title="Strike Through" data-type="strikethrough" tabindex="-1"
            disabled={previewing || !textSelected}
          >
            <Icon type="{ICON__STRIKETHROUGH}" />
          </button>
          <button
            type="button" title="Inline Code" data-type="inlineCode" tabindex="-1"
            disabled={previewing || !textSelected}
          >
            <Icon type="{ICON__INLINE_CODE}" />
          </button>
          <button
            type="button" title="Link" data-type="anchor" tabindex="-1"
            disabled={previewing || !textSelected}
          >
            <Icon type="{ICON__LINK}" />
          </button>
          <button
            type="button" title="Unordered List" data-type="ul" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__UNORDERED_LIST}" />
          </button>
          <button
            type="button" title="Ordered List" data-type="ol" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__ORDERED_LIST}" />
          </button>
          <button
            type="button" title="Indent &#013; CTRL + ]" data-type="indent" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__INDENT}" />
          </button>
          <button
            type="button" title="Outdent &#013; CTRL + [" data-type="outdent" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__OUTDENT}" />
          </button>
          <button
            type="button" title="Wrap" data-type="wrap" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__NON_BREAKING}" />
          </button>
          <div class="note-form__sep"></div>
          <button
            type="button" title="Code Block" data-type="codeBlock" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__CODE_BLOCK}" />
          </button>
          <button
            type="button" title="Block Quote" data-type="blockquote" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__QUOTE}" />
          </button>
          <button
            type="button" title="Table" data-type="table" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__TABLE}" />
          </button>
          <div class="note-form__sep"></div>
          <button
            type="button" title="Table of Contents" data-type="toc" tabindex="-1"
            disabled={previewing}
          >
            <Icon type="{ICON__TOC}" />
          </button>
          <div class="note-form__sep"></div>
          <button type="button" title="Preview" data-type="preview" tabindex="-1">
            <Icon type="{ICON__PREVIEW}" />
          </button>
        </nav>
        <div
          class="note-form__content-wrapper"
          bind:this={contentWrapperRef}
        >
          <textarea
            class="note-form__content"
            name="content"
            bind:this={textareaRef}
            bind:value={contentText}
            on:blur={handleSelection}
            on:click={handleSelection}
            on:keydown={handleContentKeyDown}
            on:keyup={handleContentKeyUp}
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
{#if tableDialogData}
  <Dialog for="table" onCloseClick={closeTableDialog}>
    <form class="table-form" on:submit={addTable}>
      <div class="table-form__items">
        <LabeledInput
          autoFocus
          label="Columns"
          min={TABLE_COLUMN_MIN_COUNT}
          onInput={handleTableColumnChange}
          type="number"
          value={tableDialogData.columnCount}
        />
        {#each Array(tableDialogData.columnCount) as col, colNdx}
          <LabeledInput
            label={`Column #${colNdx + 1}`}
            name={`col${colNdx + 1}`}
            value=""
          />
        {/each}
      </div>
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
    font-size: 1.2em;
    padding: 0.25em 0;
    border-radius: unset;
    margin: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  :global(.note-form__toolbar button *) {
    pointer-events: none;
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
  .note-form:not(.wrap) .note-form__content {
    white-space: nowrap;
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
  
  .note-form.previewing button[data-type="preview"],
  .note-form.wrap button[data-type="wrap"] {
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
  
  .table-form {
    max-height: 80vh;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  .table-form__items {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  
  @media (max-width: 780px) {
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
    .note-form__toolbar button[data-type="preview"] {
      grid-column: 1 / span 8;
    }
    
    .note-form__sep {
      display: none;
    }
  }
</style>
