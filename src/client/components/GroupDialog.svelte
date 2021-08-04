<script>
  import {
    ROUTE__API__USER_SET_DATA,
  } from '../../constants';
  import kebabCase from '../../utils/kebabCase';
  import {
    dialogDataForGroup,
    noteGroups,
    userData,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import LabeledInput from './LabeledInput.svelte';  
  
  let formRef;
  
  const genQuery = (name = '') => {
    let query = `?p=${encodeURIComponent($dialogDataForGroup.path)}`;
    if (name) query += `/${encodeURIComponent(name)}`;
    return query;
  };
  
  const editingGroup = $dialogDataForGroup.action === 'edit';
  let saveBtnDisabled = editingGroup;
  let query = genQuery();
  
  function closeDialog() {
    dialogDataForGroup.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  function handleChange({ target }) {
    if (target.name === 'name') {
      if (editingGroup) saveBtnDisabled = target.value === $dialogDataForGroup.name;
      query = genQuery(kebabCase(target.value));
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
</script>

{#if $dialogDataForGroup}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <form
      action={ROUTE__API__USER_SET_DATA}
      bind:this={formRef}
      class="group-form"
      method="POST"
      on:input={handleChange}
      on:submit|preventDefault={handleSubmit}
      slot="dialogBody"
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value={$dialogDataForGroup.action} />
      <input type="hidden" name="path" value={$dialogDataForGroup.path} />
      <input type="hidden" name="type" value="group" />
      {#if editingGroup}
        <input type="hidden" name="oldName" value={$dialogDataForGroup.name} />
      {/if}
      <LabeledInput label="Name" name="name" value={$dialogDataForGroup.name} autoFocus required />
      <div class="group-form__query">{query}</div>
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
    
    width: 30vw;
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
