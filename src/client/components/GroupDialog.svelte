<script>
  import {
    DATA_ACTION__EDIT,
    DATA_TYPE__GROUP,
  } from '../../constants';
  import {
    dialogDataForGroup,
    setUserData,
    userData,
  } from '../stores';
  import Dialog from './Dialog.svelte';
  import GroupNoteNameInput from './GroupNoteNameInput.svelte';
  
  let editingGroup = $state.raw(false);
  let formRef = $state();
  let saveBtnDisabled = $state(true);
  
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
  
  async function handleSubmit(ev) {
    ev.preventDefault();
    
    try {
      await setUserData(formRef);
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
  
  $effect(() => {
    if ($dialogDataForGroup) {
      editingGroup = $dialogDataForGroup.action === DATA_ACTION__EDIT;
      saveBtnDisabled = editingGroup;
    }
  });
</script>

{#if $dialogDataForGroup}
  <Dialog onCloseClick={handleCloseClick}>
    {#snippet s_dialogTitle()}
      {#if editingGroup}Edit{:else}Add{/if} Group
    {/snippet}
    {#snippet s_dialogBody()}
      <form
        class="group-form"
        bind:this={formRef}
        oninput={handleChange}
        onsubmit={handleSubmit}
      >
        <input type="hidden" name="username" value={$userData.username} />
        <input type="hidden" name="password" value={$userData.password} />
        <input type="hidden" name="action" value={$dialogDataForGroup.action} />
        <input type="hidden" name="path" value={$dialogDataForGroup.path} />
        <input type="hidden" name="type" value={DATA_TYPE__GROUP} />
        
        <GroupNoteNameInput
          editing={editingGroup}
          label="Name"
          nameAttr="name"
          oldNameAttr="oldName"
          path={$dialogDataForGroup.path}
          valueAttr={$dialogDataForGroup.name}
        />
        <nav class="group-form__btm-nav">
          <button type="button" onclick={handleCloseClick}>Cancel</button>
          <button disabled={saveBtnDisabled}>Save</button>
        </nav>
      </form>
    {/snippet}
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
  
  .group-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .group-form__btm-nav button {
    width: 49%;
  }
  
  :global(.group-form .query) {
    padding-left: 4em;
  }
</style>
