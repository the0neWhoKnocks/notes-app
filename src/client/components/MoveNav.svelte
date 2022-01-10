<script>
  export let currentPath = undefined;
  export let onClick = undefined;
  export let path = undefined;
  
  function handleClick() {
    if (onClick) onClick(path);
  }
</script>

<nav class="move-nav">
  <button 
    disabled={currentPath === path}
    on:click={handleClick}
  >Here</button>
</nav>
