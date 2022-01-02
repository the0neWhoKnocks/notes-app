<script>
  import {
    ROUTE__API__USER__DATA__SET,
  } from '../../constants';
  import {
    dialogDataForGroup,
    noteGroups,
    userData,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import GroupNoteNameInput from './GroupNoteNameInput.svelte';  
  
  let editingGroup;
  let formRef;
  let saveBtnDisabled;
  
  function closeDialog() {
    dialogDataForGroup.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  function handleChange({ target }) {
    if (target.name === 'name') {
      if (editingGroup) saveBtnDisabled = target.value === $dialogDataForGroup.name;
    }
  }
  
  async function handleSubmit() {
    try {
      const { notesData } = await postData(formRef.getAttribute('action'), formRef);
      noteGroups.set(notesData);
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
  
  $: if ($dialogDataForGroup) {
    editingGroup = $dialogDataForGroup.action === 'edit';
    saveBtnDisabled = editingGroup;
  }
</script>

{#if $dialogDataForGroup}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <form
      action={ROUTE__API__USER__DATA__SET}
      bind:this={formRef}
      class="group-form"
      method="POST"
      on:input={handleChange}
      on:submit|preventDefault={handleSubmit}
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value={$dialogDataForGroup.action} />
      <input type="hidden" name="path" value={$dialogDataForGroup.path} />
      <input type="hidden" name="type" value="group" />
      
      <GroupNoteNameInput
        editing={editingGroup}
        label="Name"
        nameAttr="name"
        oldNameAttr="oldName"
        path={$dialogDataForGroup.path}
        valueAttr={$dialogDataForGroup.name}
      />
      <nav class="group-form__btm-nav">
        <button type="button" on:click={handleCloseClick}>Cancel</button>
        <button disabled={saveBtnDisabled}>Save</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  .group-form {
    --labeled-input__input-width: 100%;
    
    width: 70vw;
    max-width: 25em;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  .group-form button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .group-form__query {
    font-size: 0.8em;
    padding-left: 3em;
    margin: 0;
    opacity: 0.5;
    transform: translateY(-12px);
  }
  
  .group-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .group-form__btm-nav button {
    width: 49%;
  }
</style>
