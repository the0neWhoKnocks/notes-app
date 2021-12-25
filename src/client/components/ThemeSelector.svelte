<script>
  import {
    loadThemeCSS,
    userPreferences,
  } from '../stores';

  function handleThemeSelect({ currentTarget: { value } }) {
    loadThemeCSS(value);
    userPreferences.setPreference('theme', value);
  }
</script>

<label class="theme-selector">
  Theme:
  <select on:input={handleThemeSelect} bind:value={$userPreferences.theme}>
    <option value="">default</option>
    <option value="coy">Coy</option>
    <option value="dark">Dark</option>
    <option value="okaidia">Okaidia</option>
    <option value="solarizedlight">Solarized Light</option>
    <option value="tomorrow">Tomorrow</option>
    <option value="twilight">Twilight</option>
  </select>
</label>

<style>
  .theme-selector {
    display: flex;
    align-items: center;
  }
  
  .theme-selector select {
    padding: 0.25em;
    margin-left: 0.5em;
  }
</style>
