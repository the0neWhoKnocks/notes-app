<script>
  import {
    DATA_ACTION__IMPORT,
    DATA_TYPE__ALL,
  } from '../../constants';
  import {
    setUserData,
    userData,
    userNavOpen,
  } from '../stores.js';
  import pickJSONFile from '../utils/pickJSONFile';
  import Icon, { ICON__UPLOAD } from './Icon.svelte';

  async function importData() {
    userNavOpen.set(false);
    
    try {
      const data = await pickJSONFile();
      if (data) {
        await setUserData({
          ...$userData,
          action: DATA_ACTION__IMPORT,
          importedData: data,
          type: DATA_TYPE__ALL,
        });
      }
    }
    catch ({ message }) { alert(message); }
  }
</script>

<button class="import-btn" on:click={importData}>
  <Icon type="{ICON__UPLOAD}" /> Import
</button>
