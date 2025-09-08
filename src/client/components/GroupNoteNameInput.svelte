<script>
  import { onMount } from 'svelte';
  import kebabCase from '../../utils/kebabCase';
  import parsePath from '../../utils/parsePath';
  import LabeledInput from './LabeledInput.svelte';

  let {
    editing = false,
    label = undefined,
    nameAttr = undefined,
    oldNameAttr = undefined,
    onQueryChange = undefined,
    path = '',
    valueAttr = undefined,
  } = $props();
  
  let query = $state.raw('');
  
  const genQuery = (str = '') => {
    const id = kebabCase(str);
    let val = path;
    
    if (str) {
      const _path = (!editing && !path.endsWith('/')) ? `${path}/` : path;
      const { rawPrefix } = parsePath(_path);
      val = `${rawPrefix}/${id}`;
    }
    const queryParams = { note: val }; // has to happen before encode
    
    val = encodeURIComponent(val);
    query = `?note=${val}`;
    
    onQueryChange?.(queryParams);
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
