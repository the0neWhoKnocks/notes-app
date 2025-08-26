<script>
  let {
    children,
    class: _class = '',
    href = undefined,
    onClick = undefined,
    type = undefined,
  } = $props();
</script>

{#if type === 'a'}
  <a class={_class} {href} onclick={onClick}>{@render children?.()}</a>
{:else}
  <div class={_class}>{@render children?.()}</div>
{/if}
