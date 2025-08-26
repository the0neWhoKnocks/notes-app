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
      let importedData = await pickJSONFile();
      if (importedData) {
        if (importedData.app?.schema === '1.0.0') importedData = importedData.data;
        
        await setUserData({
          ...$userData,
          action: DATA_ACTION__IMPORT,
          importedData,
          type: DATA_TYPE__ALL,
        });
      }
    }
    catch ({ message }) { alert(message); }
  }
</script>

<button class="import-btn" onclick={importData}>
  <Icon type={ICON__UPLOAD} /> Import
</button>
