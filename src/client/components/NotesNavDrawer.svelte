<script>
  // NOTE: Using `hasContent` because `$$slots.default` returns true if you use
  // `if/else` (or any logic) within a named slot or default slot.
  // https://github.com/sveltejs/svelte/issues/5312
  export let hasContent = true;
  export let wrap = true;

  let opened = false;
  
  function handleBtnClick() {
    if (!hasContent) return;
    opened = !opened;
  }
</script>

{#if wrap}
  <div class="notes-nav-drawer">
    <button
      class="notes-nav-drawer__btn"
      on:click={handleBtnClick}
    >
      <div class="notes-nav-drawer__icon">
        {#if hasContent}
          {opened ? '-' : '+'}
        {:else}
          &nbsp;
        {/if}
      </div>
      <slot name="label"></slot>
    </button>
    {#if opened}
      <div class="notes-nav-drawer__content">
        <slot />
      </div>
    {/if}
  </div>
{:else}
  <slot />
{/if}

<style>
  .notes-nav-drawer {
    display: flex;
    flex-direction: column;
  }
  
  .notes-nav-drawer__btn {
    color: var(--color--app--fg);
    text-align: left;
    padding: 0;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
  }
  
  .notes-nav-drawer__icon {
    width: 1em;
    height: 1em;
    font-family: monospace;
    line-height: 0.85em;
  }
  
  .notes-nav-drawer__content {
    margin-left: 1em;
  }
</style>
