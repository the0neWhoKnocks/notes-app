<script context="module">
  export const ICON__ANGLE_DOWN = 'angle-down';
  export const ICON__ANGLE_UP = 'angle-up';
  export const ICON__ASTERISK = 'asterisk';
  export const ICON__EYE = 'eye';
  export const ICON__FILE = 'file';
  export const ICON__FOLDER = 'folder';
  export const ICON__MENU = 'menu';
  export const ICON__SEARCH = 'search';
  export const ICON__THEME = 'theme';
  export const ICON__USER = 'user';
</script>
<script>
  export let type = undefined;
</script>

<svg class="svg-icon for--{type}">
  <use xlink:href="#{type}" xmlns:xlink="http://www.w3.org/1999/xlink"></use>
</svg>

<style>
  .svg-icon {
    width: 1em;
    height: 1em;
    fill: currentColor;
  }
</style>