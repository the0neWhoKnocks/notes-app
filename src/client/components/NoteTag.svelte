<script>
  import { onMount } from 'svelte';
  import {
    loadTaggedNotes,
  } from '../stores.js';
  import getParams from '../utils/getParams';
  import Wrap from './Wrap.svelte';
  
  export let count = '';
  export let horizontalPadding = 10;
  export let rounded = false;
  export let strokeWidth = 1;
  export let text = '';
  export let verticalPadding = 5;
  
  const edgeSpacing = 30;
  const addAnchor = text.replace(/&nbsp;/g, '').trim();
  const wrapperProps = {
    class: 'note-tag',
    href: `?tag=${encodeURIComponent(text)}`,
    onClick: handleTagClick,
    type: (addAnchor) ? 'a' : undefined,
  };
  const offset = 5; // when the text's Y is set to zero, it's not aligned to the top, so fudging the numbers with this.
  let tagWidth = 60;
  let tagHeight = 30;
  let textHeight = 0;
  let textRef;
  let holeRadius;
  let pathPoints = [];
  let roundedPathPoints = [];
  
  function handleTagClick(ev) {
    ev.preventDefault();
    const { target: { href } } = ev;
    loadTaggedNotes( getParams(href).tag );
  }
  
  onMount(() => {
    const { width, height } = textRef.getBBox();
    const strokeOffset = strokeWidth / 2;
    tagWidth = width + (horizontalPadding * 2) + edgeSpacing;
    tagHeight = height + (verticalPadding * 2);
    textHeight = height;
    holeRadius = tagHeight / 5;
    const holeStartX = (tagWidth - edgeSpacing) + holeRadius;
    const holeStartY = (tagHeight / 2) - holeRadius;
    const cornerRadius = 5;
    
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
    // ---
    // MoveTo: M, m
    // LineTo: L, l, H, h, V, v
    // Cubic Bézier Curve: C, c, S, s
    // Quadratic Bézier Curve: Q, q, T, t
    // Elliptical Arc Curve: A, a
    // ClosePath: Z, z
    // ---
    // Commands are case-sensitive. An upper-case command specifies absolute 
    // coordinates, while a lower-case command specifies coordinates relative to
    // the current position.
    
    const hole = [
      `M ${holeStartX},${holeStartY}`,
      `A ${holeRadius} ${holeRadius} 0 0 1 ${holeStartX + holeRadius} ${holeStartY + holeRadius}`, // 3
      `A ${holeRadius} ${holeRadius} 0 0 1 ${holeStartX} ${holeStartY + (holeRadius * 2)}`, // 6
      `A ${holeRadius} ${holeRadius} 0 0 1 ${holeStartX - holeRadius} ${holeStartY + holeRadius}`, // 9
      `A ${holeRadius} ${holeRadius} 0 0 1 ${holeStartX} ${holeStartY}`, // 12
      'Z',
    ];
    pathPoints = [
      // body
      `M ${strokeOffset},${strokeOffset}`, // TL
      `L ${tagWidth - (edgeSpacing / 1.5)},${strokeOffset}`, // TR
      `L ${tagWidth - strokeOffset},${tagHeight / 2}`, // CR
      `L ${tagWidth - (edgeSpacing / 1.5)},${tagHeight - strokeOffset}`, // BR
      `L ${strokeOffset},${tagHeight - strokeOffset}`, // BL
      'Z', // close
      ...hole,
    ];
    roundedPathPoints = [
      // body
      `M ${strokeOffset},${strokeOffset + cornerRadius}`, // TL
      `C ${strokeOffset},${strokeOffset} ${strokeOffset + cornerRadius},${strokeOffset} ${strokeOffset + cornerRadius},${strokeOffset}`, // TL
      `L ${(tagWidth - (edgeSpacing / 1.5)) - cornerRadius},${strokeOffset}`, // TR
      `C ${tagWidth - (edgeSpacing / 1.5) + cornerRadius},${strokeOffset} ${tagWidth - strokeOffset},${(tagHeight / 2) - cornerRadius} ${tagWidth - strokeOffset},${tagHeight / 2}`,
      `C ${tagWidth - strokeOffset},${(tagHeight / 2) + cornerRadius} ${(tagWidth - (edgeSpacing / 1.5)) + cornerRadius},${tagHeight - strokeOffset} ${tagWidth - (edgeSpacing / 1.5)},${tagHeight - strokeOffset}`, // BR
      `L ${strokeOffset + cornerRadius},${tagHeight - strokeOffset}`, // BL
      `C ${strokeOffset + cornerRadius},${tagHeight - strokeOffset} ${strokeOffset},${tagHeight - strokeOffset} ${strokeOffset},${(tagHeight - strokeOffset) - cornerRadius}`, // BL
      'Z', // close
      ...hole,
    ];
  });
</script>

<Wrap {...wrapperProps}>
  <svg viewBox="0 0 {tagWidth} {tagHeight}">
    <path
      d={rounded ? roundedPathPoints.join(' ') : pathPoints.join(' ')}
      fill-rule="evenodd"
      stroke-width={strokeWidth}
    />
    <text
      x={horizontalPadding}
      y={(textHeight + verticalPadding) - offset}
      bind:this={textRef}
    >{count}{text}</text>
  </svg>
</Wrap>

<style>
  :global(.note-tag) { /* .tag is used by Prism's styles for HTML tags */
    height: 1.5em;
    font-size: 1.1em;
    display: inline-block;
  }
  :global(.note-tag > *) {
    pointer-events: none;
  }
  
  svg {
    height: 100%;
  }
  
  svg path {
    fill: var(--color--tag--bg, maroon);
    stroke: var(--color--tag--border, currentColor);
  }
  svg text {
    font-family: monospace;
    fill: var(--color--tag--text, currentColor);
  }
</style>
