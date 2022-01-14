<script>
  import { onMount } from 'svelte';
  import kebabCase from '../../utils/kebabCase';
  import parsePath from '../../utils/parsePath';
  import LabeledInput from './LabeledInput.svelte';

  export let editing = false;
  export let label = undefined;
  export let nameAttr = undefined;
  export let oldNameAttr = undefined;
  export let onQueryChange = undefined;
  export let path = '';
  export let valueAttr = undefined;
  
  let query = '';
  
  const genQuery = (str = '') => {
    const id = kebabCase(str);
    let val = path;
    
    if (str) {
      const { rawPrefix } = parsePath(path);
      val = `${rawPrefix}/${id}`;
    }
    const queryParams = { note: val }; // has to happen before encode
    
    val = encodeURIComponent(val);
    query = `?note=${val}`;
    
    if (onQueryChange) onQueryChange(queryParams);
  };
  
  function handleInput(ev) {
    genQuery(ev.currentTarget.value);
  }
  
  onMount(() => {
    genQuery(valueAttr);
  });
</script>

{#if editing}
  <input type="hidden" name={oldNameAttr} value={valueAttr} />
{/if}
<LabeledInput
  autoFocus
  {label}
  name={nameAttr}
  onInput={handleInput}
  required
  value={valueAttr}
/>
<div class="query">{query}</div>

<style>
  .query {
    font-size: 0.8em;
    padding-left: 3em;
    margin: 0;
    opacity: 0.5;
    transform: translateY(-12px);
  }
</style>
