<script>
  import {
    dialogDataForMove,
    deleteItem,
    editItem,
  } from '../stores.js';
  import Icon, {
    ICON__EDIT,
    ICON__NEW_TAB,
    ICON__TRASH,
  } from './Icon.svelte';
  
  export let draft = false;
  export let id = undefined;
  export let path = undefined;
  export let type = undefined;
  
  function handleDeleteClick() {
    deleteItem({ id, path, type });
  }
  
  function handleEditClick() {
    editItem({ id, path, type });
  }
  
  function moveItem() {
    dialogDataForMove.set({ path, type });
  }
</script>

<nav class="modify-nav">
  <button class:is--draft={draft} type="button" title="Edit" on:click={handleEditClick}>
    <Icon type="{ICON__EDIT}" />
    {#if draft}
      <div class="modify-nav__draft-txt">Draft</div>
    {/if}
  </button>
  <button type="button" title="Move" on:click={moveItem}>
    <Icon type="{ICON__NEW_TAB}" />
  </button>
  <button type="button" title="Delete" on:click={handleDeleteClick}>
    <Icon type="{ICON__TRASH}" />
  </button>
</nav>

<style>
  .modify-nav {
    display: flex;
    gap: 0.25em;
  }
  
  .modify-nav button {
    padding: 0.25em;
    display: flex;
    align-items: center;
  }
  
  .modify-nav__draft-txt {
    font-size: 0.8em;
    padding: 0 0.25em;
  }
</style>
