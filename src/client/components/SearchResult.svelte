<script>
  import Icon, {
    ICON__FILE,
    ICON__FOLDER,
  } from './Icon.svelte';
  
  export let item = undefined;
  export let path = undefined;
  export let type = undefined;
</script>

<article class="search-result">
  <header>
    {#if type === 'group'}
      <Icon type={ICON__FOLDER} />
    {:else}
      <Icon type={ICON__FILE} />
    {/if}
    <div class="search-result__title">
      {#if type === 'group'}
        {item.groupName}
      {:else}
        {item.title}
      {/if}
    </div>
    <sub>{path}</sub>
  </header>
</article>

<style>
  .search-result {
    padding: 1em;
    border: solid 1px;
  }
  
  .search-result header {
    font-size: 1.25rem;
    line-height: 1em;
    display: grid;
    grid-gap: 0.25em;
    grid-template-columns: 1em auto;
  }
  
  .search-result header sub {
    color: #666;
    font-size: 0.75em;
    grid-column: 2;
  }
</style>
