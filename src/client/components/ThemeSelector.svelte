<script>
  import {
    loadThemeCSS,
    themeSelectorOpen,
    userPreferences,
  } from '../stores';
  import DropDown from './DropDown.svelte';
  import Icon, { ICON__THEME } from './Icon.svelte';
  
  const themes = [
    { label: 'default', value: '' },
    { label: 'Coy', value: 'coy' },
    { label: 'Dark', value: 'dark' },
    { label: 'Okaidia', value: 'okaidia' },
    { label: 'Solarized Light', value: 'solarizedlight' },
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'Twilight', value: 'twilight' },
  ];
  
  function handleThemeSelect({ target: { value } }) {
    if (value !== undefined) {
      loadThemeCSS(value);
      userPreferences.setPreference('theme', value);
    }
  }
</script>

<DropDown bind:open={$themeSelectorOpen}>
  <svelte:fragment slot="label">
    <Icon type={ICON__THEME} />
    Theme
  </svelte:fragment>
  <div on:click={handleThemeSelect}>
    {#each themes as {label, value}}
      <button
        type="button"
        class="theme-opt"
        class:current={(!$userPreferences.theme && value === '') || $userPreferences.theme === value}
        {value}
      >{label}</button>
    {/each}
  </div>
</DropDown>

<style>
  .theme-opt.current {
    background: var(--color--app--highlight);
  }
</style>
