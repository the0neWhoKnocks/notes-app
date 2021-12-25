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
  
  async function exportData() {
    const serverData = await postData(ROUTE__API__USER__DATA__GET, $userData);
    
    userNavOpen.set(false);
    
    saveFile({
      data: JSON.stringify({
        app: {
          schema: SCHEMA_VERSION__EXPORTED_DATA,
        },  
        data: serverData,
      }, null, 2),
      name: `notes-backup-${timestamp({ format: '[y]-[mo]-[d]-[h][mi][s]' })}.json`,
      type: FILE_TYPE__JSON,
    });
  }
</script>

<button on:click={exportData}>Export</button>
