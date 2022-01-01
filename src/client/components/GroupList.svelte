<script context="module">
  const ICON_DIAMETER = 20;
  const ICON_STROKE_WIDTH = 1;
  const itemStyles = {};
  
  const getGroupData = (item, expanded) => {
    const { subGroup } = item;
    const hasItems = !!subGroup.length;
    const empty = hasItems ? null : true;
    const open = (expanded && hasItems) ? true : null;
    
    return [{ ...item, empty, hasItems, open }];
  };
  
  const getFileData = (item, groupPath) => {
    const { id, name } = item;
    const [, ext] = name.match(/\.(.*)$/) || ['', ''];
    const dataAttrs = {
      'data-id': id,
      'data-path': `${groupPath}/${name}`,
    };
    
    if (ext) {
      dataAttrs['data-ext'] = ext;
      
      if (!itemStyles[ext]) {
        itemStyles[ext] = `
          .item[data-ext="${ext}"] .icon {
            fill: var(--color--item--${ext}--fill, var(--color--item--fill));
            stroke: var(--color--item--${ext}--stroke, var(--color--item--stroke));
          }
        `;
      }
    }
    
    return [{ ...item, dataAttrs }];
  };
</script>
<script>
  import SVG from './SVG.svelte';

  export let data = undefined;
  export let expanded = false;
  export let groupPath = '';
  export let onItemClick = undefined;
  
  function addFileStyles() {
    let ret;
    if (Object.keys(itemStyles).length) {
      ret = Object.values(itemStyles).join('\n');
    }
    return ret;
  }
  
  function handleClick(ev) {
    const { target } = ev;
    
    if (target.classList.contains('group__name')) {
      const group = target.closest('.group');
      if (!group.hasAttribute('empty')) {
        if (group.hasAttribute('open')) group.removeAttribute('open');
        else group.setAttribute('open', '');
      }
    }
    else if (target.classList.contains('item')) {
      if (onItemClick) {
        ev.preventDefault();
        onItemClick(target);
      }
    }
  }
  
  $: isRoot = !groupPath;
</script>

<div
  class="group-list"
  class:is--root={isRoot}
  style={addFileStyles(itemStyles)}
  on:click={isRoot && handleClick}
>
  {#if isRoot}
    <SVG symbols={[
      {
        width: ICON_DIAMETER,
        height: ICON_DIAMETER,
        id: 'folder',
        items: [
          { // folder body
            points: '0,5 1,5 2,3 10,3 12,5 20,5 20,18 0,18 0,5',
            strokeWidth: ICON_STROKE_WIDTH,
            type: 'polygon',
          },
          { // divider line
            points: '0,7 1,7 2,8 9,8 10,7, 20,7',
            strokeWidth: ICON_STROKE_WIDTH,
            type: 'polyline',
          },
        ],
      },
      {
        width: ICON_DIAMETER,
        height: ICON_DIAMETER,
        id: 'file',
        items: [
          { // file body
            points: '2,0 13,0 18,5 18,20 2,20, 2,0',
            strokeWidth: ICON_STROKE_WIDTH,
            type: 'polygon',
          },
          { // file bend
            points: '13,0 18,5 13,5 13,0',
            strokeWidth: ICON_STROKE_WIDTH,
            type: 'polygon',
          },
        ],
      },
    ]} />
  {/if}
  {#each data as item}
    {#if item.groupName}
      {#each getGroupData(item, expanded) as {empty, groupName, hasItems, nameComponent, open, subGroup}}
        <div class="group" {empty} {open}>
          <div class="group__name">
            <div class="group__name-wrapper">
              {#if hasItems}
                <span class="indicator"></span>
              {/if}
              <SVG use="folder" />{groupName}
            </div>
            {#if nameComponent}
              <svelte:component this={nameComponent} {...item} />
            {/if}
          </div>
          {#if hasItems}
            <div class="group__items">
              <svelte:self data={subGroup} groupPath={`${groupPath}/${groupName}`} />
            </div>
          {/if}
        </div>
      {/each}
    {:else}
      <!-- TODO: Can simplify if they ever merge the @const PR -->
      {#each getFileData(item, groupPath) as {dataAttrs, link, name, nameComponent}}
        {#if link}
          <a class="item" href={link} {...dataAttrs}>
            <SVG use="file" />{name}
            {#if nameComponent}
              <svelte:component this={nameComponent} {...item} />
            {/if}
          </a>
        {:else}
          <div class="item" {...dataAttrs}>
            <SVG use="file" />{name}
            {#if nameComponent}
              <svelte:component this={nameComponent} {...item} />
            {/if}
          </div>
        {/if}
      {/each}
    {/if}
  {/each}
</div>

<style>
  :root {
    --color--item--fill: #fff;
    --color--item--stroke: #000;
    --color--folder--fill: yellow;
    --color--folder--fill--hover: orange;
    --color--folder--stroke: #000;
    --color--folder--stroke--hover: #000;
    --color--text: #000;
    --color--text--hover: green;
  }
  
  :root,
  a, a:visited {
    color: var(--color--text);
  }
  
  .group-list.is--root {
    overflow: auto;
    padding-left: 0.75em;
    flex-shrink: 0;
  }
  
  .group {
    display: block;
    user-select: none;
    position: relative;
  }
  .group[open]:not([empty])::after {
    content: '';
    width: 2em;
    color: #b3b3b3;
    border-style: dashed;
    border-width: 0.08em;
    border-right: none;
    border-top: none;
    position: absolute;
    top: 1.75em;
    bottom: 0;
    left: 0.25em;
    pointer-events: none;
  }
  
  .group__name {
    display: flex;
    justify-content: space-between;
  }
  .group:not([empty]) > .group__name {
    cursor: pointer;
  }
  
  .group__name-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    pointer-events: none;
  }
  
  .group__name .indicator,
  :global(.group__name .icon) {
    display: inline-block;
  }
  
  .group__name .indicator {
    width: 1em;
    height: 1em;
    font-family: monospace;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
  }
  .group__name .indicator::before {
    content: '+';
  }
  .group[open] > .group__name .indicator::before {
    content: '-';
  }
  
  :global(.group__name .icon) {
    fill: var(--color--folder--fill);
    stroke: var(--color--folder--stroke);
    margin-right: 0.25em;
  }
  
  .group__items {
    margin-left: 1.3em;
    display: none;
    user-select: none;
    position: relative;
  }
  .group[open] > .group__items {
    padding-bottom: 0.25em;
    margin-bottom: 0.25em;
    display: block;
  }
  
  .item {
    min-width: 100%;
    user-select: none;
    white-space: nowrap;
    display: flex;
    align-items: center;
    position: relative;
  }
  
  :global(.item .icon) {
    fill: var(--color--item--fill);
    stroke: var(--color--item--stroke);
    margin-right: 0.25em;
    display: inline-block;
  }
  
  .group[open]:not([empty]):hover::after,
  .group[open]:not([empty]):hover > .group__name,
  a.item:hover {
    color: var(--color--text--hover);
    text-shadow: 1px 0px 0px var(--color--text--hover);
  }
  
  :global(.group[open]:not([empty]):hover > .group__name .icon) {
    fill: var(--color--folder--fill--hover);
    stroke: var(--color--folder--stroke--hover);
  }
</style>
