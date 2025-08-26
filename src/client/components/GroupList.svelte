<script>
  import Self from './GroupList.svelte';
  import Icon, {
    ICON__FILE,
    ICON__FOLDER,
  } from './Icon.svelte';

  let {
    data = undefined,
    expanded = false,
    groupPath = '',
    onItemClick = undefined,
  } = $props();
  
  let isRoot = $derived(!groupPath);
  
  function handleClick(ev) {
    const { ctrlKey, target } = ev;
    
    if (target.classList.contains('group__name')) {
      const group = target.closest('.group');
      if (!group.hasAttribute('data-empty')) {
        if (group.hasAttribute('data-open')) group.removeAttribute('data-open');
        else group.setAttribute('data-open', '');
      }
    }
    else if (target.classList.contains('item__label')) {
      if (onItemClick && !ctrlKey) {
        ev.preventDefault();
        onItemClick(target);
      }
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="group-list"
  class:is--root={isRoot}
  onclick={isRoot ? handleClick : null}
>
  {#each data as item (item.path)}
    {#if item.groupName}
      {@const { groupName, nameComponent: NameComponent, subGroup } = item}
      {@const hasItems = !!subGroup.length}
      {@const empty = hasItems ? null : true}
      {@const open = (expanded && hasItems) ? true : null}
      <div class="group" data-empty={empty} data-open={open}>
        <div class="group__name">
          <div class="group__name-wrapper">
            {#if hasItems}
              <span class="indicator"></span>
            {/if}
            <Icon type={ICON__FOLDER} /><span class="group__name-text">{groupName}</span>
          </div>
          {#if NameComponent}<NameComponent {...item} />{/if}
        </div>
        {#if hasItems}
          <div class="group__items">
            <Self data={subGroup} groupPath={`${groupPath}/${groupName}`} />
          </div>
        {/if}
      </div>
    {:else}
      {@const { id, link, name, nameComponent: NameComponent } = item}
      {@const dataAttrs = {
        'data-id': id,
        'data-path': `${groupPath}/${id}`,
      }}
      <div class="item">
        {#if link}
          <a class="item__label" href={link} {...dataAttrs}>
            <Icon type={ICON__FILE} /><span class="item__label-text">{name}</span>
          </a>
        {:else}
          <div class="item__label" {...dataAttrs}>
            <Icon type={ICON__FILE} /><span class="item__label-text">{name}</span>
          </div>
        {/if}
        {#if NameComponent}<NameComponent {...item} />{/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  :root {
    --color--text: #000;
    --color--text--hover: green;
  }
  
  :root,
  a, a:visited {
    color: var(--color--text);
  }
  
  .group-list.is--root {
    padding-left: 0.75em;
    flex-shrink: 0;
  }
  
  .group {
    display: block;
    user-select: none;
    position: relative;
  }
  .group[data-open]:not([data-empty])::after {
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
  .group:not([data-empty]) > .group__name {
    cursor: pointer;
  }
  
  .group__name-wrapper {
    display: flex;
    align-items: center;
    position: relative;
    pointer-events: none;
  }
  
  .group__name .indicator,
  :global(.group__name-wrapper .svg-icon) {
    display: inline-block;
  }
  
  .group__name .indicator {
    width: 1em;
    height: 1em;
    color: #000;
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
  .group[data-open] > .group__name .indicator::before {
    content: '\2212'; /* minus */
  }
  
  :global(.group__name-wrapper .svg-icon) {
    margin-right: 0.25em;
  }
  
  .group__items {
    margin-left: 1.3em;
    display: none;
    user-select: none;
    position: relative;
  }
  .group[data-open] > .group__items {
    padding-bottom: 0.25em;
    margin-bottom: 0.25em;
    display: block;
  }
  
  .group-list {
    padding-top: 0.25em;
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }
  
  .item {
    min-width: 100%;
    user-select: none;
    white-space: nowrap;
    display: flex;
    align-items: center;
    position: relative;
  }
  
  .item__label {
    line-height: 1em;
    display: flex;
  }
  .item__label > * {
    pointer-events: none;
  }
  
  :global(.item__label .svg-icon) {
    margin-right: 0.25em;
    display: inline-block;
  }
  
  .group[data-open]:not([data-empty]):hover::after,
  .group[data-open]:not([data-empty]):hover > .group__name,
  .item:hover,
  .item:hover a {
    color: var(--color--text--hover);
  }
  
  :global(.group[data-open]:not([data-empty]):hover > .group__name .svg-icon) {
    --color--folder--fill: orange;
  }
</style>
