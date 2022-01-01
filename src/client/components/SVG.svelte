<script context="module">
  const DEFAULT__ICON__DIAMETER = 100;
  const DEFAULT__ICON__STROKE_WIDTH = 1;
  
  const plotPoints = ({
    height = DEFAULT__ICON__DIAMETER,
    points,
    strokeWidth = DEFAULT__ICON__STROKE_WIDTH,
    width = DEFAULT__ICON__DIAMETER,
  }) => {
    return points.split(' ').map((coords) => {
      const offset = strokeWidth / 2;
      const [x, y] = coords.split(',');
      let _x = +x;
      let _y = +y;
      
      if ((_x - offset) < 0) _x += offset;
      else if ((_x + offset) > width) _x -= offset;
      
      if ((_y - offset) < 0) _y += offset;
      else if ((_y + offset) > height) _y -= offset;
      
      return `${_x},${_y}`;
    }).join(' ');
  };
</script>
<script>
  export let symbols = undefined;
  export let use = undefined;
</script>

{#if symbols}
  <svg style="display:none; position:absolute" width="0" height="0">
    {#each symbols as {height, id, items, width}}
      <symbol
        {id}
        viewBox="0 0 {width || DEFAULT__ICON__DIAMETER} {height || DEFAULT__ICON__DIAMETER}"
        xmlns="http://www.w3.org/2000/svg"
      >
        {#each items as {points, strokeWidth, type}}
          {#if type === 'polygon'}
            <polygon
              points={plotPoints({ height, points, strokeWidth, width })}
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={strokeWidth || DEFAULT__ICON__STROKE_WIDTH}
            />
          {:else if type === 'polyline'}
            <polyline
              points={plotPoints({ height, points, strokeWidth, width })}
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={strokeWidth || DEFAULT__ICON__STROKE_WIDTH}
            />
          {/if}
        {/each}
      </symbol>
    {/each}
  </svg>
{:else if use}
  <svg class="icon">
    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#{use}"></use>
  </svg>
{/if}

<style>
  svg.icon {
    width: 1em;
    height: 1em;
    pointer-events: none;
  }
</style>
