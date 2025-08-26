<script>
  import {
    ROUTE__API__USER__DATA__GET,
    SCHEMA_VERSION__EXPORTED_DATA,
  } from '../../constants';
  import {
    userData,
    userNavOpen,
  } from '../stores.js';
  import postData from '../utils/postData';
  import saveFile, { FILE_TYPE__JSON } from '../utils/saveFile';
  import timestamp from '../utils/timestamp';
  import Icon, { ICON__EXPORT } from './Icon.svelte';
  
  async function exportData() {
    const serverData = await postData(ROUTE__API__USER__DATA__GET, $userData);
    
    userNavOpen.set(false);
    
    saveFile({
      data: JSON.stringify({
        schema: SCHEMA_VERSION__EXPORTED_DATA,
        ...serverData,
      }, null, 2),
      name: `notes-backup-${timestamp({ format: '[y]-[mo]-[d]-[h][mi][s]' })}.json`,
      type: FILE_TYPE__JSON,
    });
  }
</script>

<button onclick={exportData}>
  <Icon type={ICON__EXPORT} /> Export
</button>
