<script>
  let {
    diffs = undefined,
    transformPath = undefined,
    type = undefined,
  } = $props();
  
  const objKeys = Object.keys(diffs);
</script>

{#each objKeys as typeProp (typeProp)}
  {#if diffs[typeProp].length}
    <div class={`diff-group for--${typeProp}`}>
      <header>{typeProp}</header>
      {#each diffs[typeProp] as diff, ndx (diff)}
        <div class="diff">
          <label class="path">
            <input type="checkbox" name={`changes[${type}][${typeProp}][]`} value={ndx} checked />
            <div>
              {#if transformPath}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html transformPath(diff)}
              {:else}
                {diff.path}
              {/if}
            </div>
          </label>
          {#if typeProp === 'modified'}
            <div class="prop">{diff.prop}</div>
            <div class="from">{diff.from}</div>
            <div class="to">{diff.to}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/each}

<style>
  .diff-group {
    border: solid 1px var(--diff--ui--bg-color);
    margin: 0.5em;
  }
  .diff-group header {
    color: var(--diff--ui--fg-color);
    text-transform: capitalize;
    padding: 0.25em 0.5em;
    background: var(--diff--ui--bg-color);
  }

  .diff {
    font-family: monospace;
    border: solid 2px;
    border-radius: 0.25em;
    margin: 0.5em;
    display: grid;
    grid-template-areas:
      "path path"
      "prop prop"
      "old  new";
    grid-template-columns: repeat(2, 1fr);
  }
  .diff .path {
    grid-area: path;
    color: var(--diff--ui--fg-color);
    background: var(--diff--ui--bg-color);
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  .diff .path > input {
    width: 1.75em;
    height: 1em;
    margin: 0;
    flex-shrink: 0;
  }
  .diff .path > div {
    width: 100%;
    line-height: 1em;
    padding: 6px;
  }
  .diff .prop {
    grid-area: prop;
    color: var(--diff--ui--bg-color);
    font-size: 0.8em;
    font-weight: bold;
    line-height: 1em;
    text-align: center;
    padding: 0.25em 0.5em;
    border-top: solid 2px var(--diff--ui--bg-color);
    background: #fff;
    display: inline-block;
  }
  .diff .from,
  .diff .to {
    max-height: 20em;
    white-space: pre-line;
    overflow: auto;
    padding: 0.5em;
    border-top: solid 2px var(--diff--ui--bg-color);
  }
  .diff .from {
    grid-area: old;
    border-right: dashed 1px;
    background: rgba(255, 0, 0, 0.1);
  }
  .diff .to {
    grid-area: new;
    background: rgba(0, 128, 0, 0.1);
  }
</style>
