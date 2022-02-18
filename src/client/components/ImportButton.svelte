<script>
  import {
    setUserData,
    userData,
    userNavOpen,
  } from '../stores.js';
  import pickJSONFile from '../utils/pickJSONFile';

  async function importData() {
    userNavOpen.set(false);
    
    try {
      const data = await pickJSONFile();
      if (data) {
        await setUserData({
          ...$userData,
          action: 'importData',
          importedData: data,
          type: 'all',
        });
      }
    }
    catch ({ message }) { alert(message); }
  }
</script>

<button class="import-btn" on:click={importData}>Import</button>
