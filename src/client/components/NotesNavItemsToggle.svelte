<script>
  let {
    s_toggleItems,
    s_toggleLabel,
  } = $props();
  let open = $state.raw(false);
  
  function toggle() { open = !open; }
</script>

<div class="notes-nav-items-toggle">
  <button
    class="notes-nav-items-toggle__btn"
    class:open={open}
    onclick={toggle}
  >
    {@render s_toggleLabel?.()}
  </button>
  {#if open}
    <nav class="notes-nav-items-toggle__items">
      {@render s_toggleItems?.()}
    </nav>
  {/if}
</div>

<style>
  .notes-nav-items-toggle {
    font-size: 1.3rem;
  }
  
  .notes-nav-items-toggle__btn {
    width: 100%;
    color: #000;
    padding: var(--nav-spacing);
    border: solid 3px #333;
    border-radius: unset;
    background: rgba(0, 0, 0, 0.05);
    display: flex;
    gap: 0.25em;
    align-items: center;
    position: relative;
  }
  .notes-nav-items-toggle__btn:focus,
  .notes-nav-items-toggle__btn:hover {
    outline: none;
  }
  .notes-nav-items-toggle__btn::after {
    content: '+';
    position: absolute;
    top: 50%;
    left: 0.5em;
    transform: translateY(-50%);
  }
  .notes-nav-items-toggle__btn.open::after {
    content: '\2212';  /* minus */
  }
  
  .notes-nav-items-toggle__items {
    padding: 0.3em;
    box-shadow: inset 0 0.2em 0.5em 0;
    background: #adadad;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
</style>
