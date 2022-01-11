<script>
  import {
    ROUTE__API__USER__DATA__SET,
  } from '../../constants';
  import {
    allTags,
    currentNote,
    dialogDataForDelete,
    noteGroups,
    recentlyViewed,
    updateCurrNote,
    userData,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  
  let formRef;
  
  function closeDialog() {
    dialogDataForDelete.set();
  }
  
  function handleCloseClick() {
    closeDialog();
  }
  
  async function handleSubmit() {
    try {
      const { id, path, type } = $dialogDataForDelete;
      const {
        allTags: tags,
        notesData,
        recentlyViewed: recent,
      } = await postData(formRef.getAttribute('action'), formRef);
      
      allTags.set(tags);
      noteGroups.set(notesData);
      recentlyViewed.set(recent);
      
      if (
        type === 'group'
        && $currentNote
        && $currentNote.path.startsWith(`${path}/${id}/`)
      ) {
        updateCurrNote({ id: $currentNote.id });
      }
      else updateCurrNote({ id: $dialogDataForDelete.id });
      
      closeDialog();
    }
    catch (err) {
      alert(err.message);
      if (err.stack) throw (err);
    }
  }
</script>

{#if $dialogDataForDelete}
  <Dialog
    onCloseClick={handleCloseClick}
  >
    <form
      action={ROUTE__API__USER__DATA__SET}
      bind:this={formRef}
      class="delete-form"
      method="POST"
      on:submit|preventDefault={handleSubmit}
    >
      <input type="hidden" name="username" value={$userData.username} />
      <input type="hidden" name="password" value={$userData.password} />
      <input type="hidden" name="action" value="delete" />
      <input type="hidden" name="id" value={$dialogDataForDelete.id} />
      <input type="hidden" name="path" value={$dialogDataForDelete.path} />
      <input type="hidden" name="type" value={$dialogDataForDelete.type} />
      
      {#if $dialogDataForDelete.type === 'note'}
        <div class="delete-form__msg">
          Delete note "{$dialogDataForDelete.title}" from "{$dialogDataForDelete.path}"?
        </div>
      {:else}
        <div class="delete-form__msg">
          Delete group "{$dialogDataForDelete.groupName}" and all the notes in "{$dialogDataForDelete.path}/{$dialogDataForDelete.id}"?
        </div>
      {/if}
      <nav class="delete-form__btm-nav">
        <button type="button" on:click={handleCloseClick}>No</button>
        <button>Yes</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  .delete-form {
    width: 70vw;
    max-width: 25em;
    overflow: auto;
    padding: 1em;
    display: flex;
    flex-direction: column;
  }
  
  .delete-form__msg {
    text-align: center;
    padding: 1em;
    border: solid 1px orange;
    background: #fff39e;
  }
  
  .delete-form__btm-nav {
    display: flex;
    justify-content: space-between;
  }
  .delete-form__btm-nav button {
    width: 49%;
  }
</style>
