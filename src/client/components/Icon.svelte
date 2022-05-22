<script context="module">
  export const ICON__ANGLE_DOWN = 'angle-down';
  export const ICON__ANGLE_UP = 'angle-up';
  export const ICON__ARROW_DOWN = 'arrow-down';
  export const ICON__ARROW_UP = 'arrow-up';
  export const ICON__ASTERISK = 'asterisk';
  export const ICON__BOLD = 'bold';
  export const ICON__CODE_BLOCK = 'code-block';
  export const ICON__EDIT = 'edit';
  export const ICON__EXPORT = 'export';
  export const ICON__EYE = 'eye';
  export const ICON__FILE = 'file';
  export const ICON__FOLDER = 'folder';
  export const ICON__HEADING = 'heading';
  export const ICON__HR = 'horizontal-rule';
  export const ICON__INDENT = 'indent';
  export const ICON__INLINE_CODE = 'inline-code';
  export const ICON__ITALIC = 'italic';
  export const ICON__LINK = 'link';
  export const ICON__LOCK = 'lock';
  export const ICON__MENU = 'menu';
  export const ICON__NEW_TAB = 'new-tab';
  export const ICON__NON_BREAKING = 'non-breaking';
  export const ICON__ORDERED_LIST = 'ordered-list';
  export const ICON__OUTDENT = 'outdent';
  export const ICON__PREVIEW = 'preview';
  export const ICON__QUOTE = 'quote';
  export const ICON__SEARCH = 'search';
  export const ICON__SETTINGS = 'settings';
  export const ICON__STRIKETHROUGH = 'strikethrough';
  export const ICON__THEME = 'theme';
  export const ICON__TOC = 'toc';
  export const ICON__TRASH = 'trash';
  export const ICON__UNORDERED_LIST = 'unordered-list';
  export const ICON__UPLOAD = 'upload';
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