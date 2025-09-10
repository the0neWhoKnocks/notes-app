<script>
  import {
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
      userPreferences.setPreference('theme', value);
    }
  }
</script>

<DropDown bind:open={$themeSelectorOpen}>
  {#snippet s_label()}
    <Icon type={ICON__THEME} />
    Theme
  {/snippet}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div onclick={handleThemeSelect}>
    {#each themes as {label, value} (value)}
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
