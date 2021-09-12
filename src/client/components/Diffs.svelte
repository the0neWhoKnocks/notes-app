<script>
  export let diffs = undefined;
  export let transformPath = undefined;
  export let type = undefined;
  
  const objKeys = Object.keys(diffs);
</script>

{#each objKeys as typeProp}
  {#if diffs[typeProp].length}
    <div class={`diff-group for--${typeProp}`}>
      <header>{typeProp}</header>
      {#each diffs[typeProp] as diff, ndx}
        <div class="diff">
          <label class="path">
            <input type="checkbox" name={`changes[${type}][${typeProp}][]`} value={ndx} checked />
            <div>
              {#if transformPath}
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
    border: solid 1px var(--color--app--bg);
    margin: 0.5em;
  }
  .diff-group header {
    color: var(--color--app--fg);
    text-transform: capitalize;
    padding: 0.25em 0.5em;
    background: var(--color--app--bg);
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
    color: var(--color--app--fg);
    background: var(--color--app--bg);
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
    text-shadow: 1px 1px 6px #001d5a, -1px 2px 6px #001d5a;
    background: linear-gradient(180deg, #1c2e4a, #90afde);
  }
  .diff .prop {
    grid-area: prop;
    color: var(--color--app--bg);
    font-size: 0.8em;
    font-weight: bold;
    line-height: 1em;
    text-align: center;
    padding: 0.25em 0.5em;
    border-top: solid 2px var(--color--app--bg);
    background: #fff;
    display: inline-block;
  }
  .diff .from,
  .diff .to {
    padding: 0.5em;
    border-top: solid 2px var(--color--app--bg);
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
