<script>
  export let href = undefined;
  export let type = undefined;
  let _class = '';
  export { _class as class };
</script>

{#if type === 'a'}
  <a class={_class} {href}><slot /></a>
{:else}
  <div class={_class}><slot /></div>
{/if}
