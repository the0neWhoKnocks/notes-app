<script>
  import {
    ROUTE__API__USER__DATA__SET,
  } from '../../constants';
  import {
    allTags,
    noteGroups,
    userData,
    userNavOpen,
    userPreferences,
  } from '../stores.js';
  import pickJSONFile from '../utils/pickJSONFile';
  import postData from '../utils/postData';

  async function importData() {
    userNavOpen.set(false);
    
    try {
      const data = await pickJSONFile();
      const {
        allTags: tags,
        notesData,
        preferences,
      } = await postData(ROUTE__API__USER__DATA__SET, {
        ...$userData,
        action: 'importData',
        importedData: data,
        type: 'all',
      });
      allTags.set(tags);
      noteGroups.set(notesData);
      userPreferences.set(preferences);
    }
    catch ({ message }) { alert(message); }
  }
</script>

<button on:click={importData}>Import</button>
