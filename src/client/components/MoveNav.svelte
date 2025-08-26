<script>
  let {
    currentPath = undefined,
    onClick = undefined,
    path = undefined,
  } = $props();
  
  function handleClick() {
    if (onClick) onClick(path);
  }
</script>

<nav class="move-nav">
  <button
    disabled={currentPath === path}
    onclick={handleClick}
  >Here</button>
</nav>
