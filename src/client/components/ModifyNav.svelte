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
  
  let {
    draft = false,
    id = undefined,
    path = undefined,
    type = undefined,
  } = $props();
  
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
  <button class:is--draft={draft} type="button" title="Edit" onclick={handleEditClick}>
    <Icon type={ICON__EDIT} />
    {#if draft}
      <div class="modify-nav__draft-txt">Draft</div>
    {/if}
  </button>
  <button type="button" title="Move" onclick={moveItem}>
    <Icon type={ICON__NEW_TAB} />
  </button>
  <button type="button" title="Delete" onclick={handleDeleteClick}>
    <Icon type={ICON__TRASH} />
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
