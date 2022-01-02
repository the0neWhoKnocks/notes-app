<script>
  import {
    ROUTE__API__USER__PROFILE__DELETE,
    ROUTE__API__USER__PROFILE__GET,
    ROUTE__API__USER__PROFILE__SET,
  } from '../../constants';
  import {
    logout,
    profileUpdated,
    userData,
    userProfileOpened,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  let oldPassword = '';
  let oldUsername = '';
  let password = '';
  let username = '';
  let dataLoaded = false;
  let formRef;
  let inputRef;
  let dataUpdated = false;
  let initialFormData;
  let clickedDelete = false;

  function handleSubmit() {
    postData(formRef.action, formRef)
      .then((data) => { profileUpdated(data); })
      .catch(({ message }) => { alert(message); });
  }
  
  function handleCloseClick() {
    userProfileOpened.set(false);
  }
  
  function handleChange() {
    dataUpdated = initialFormData !== [...new FormData(formRef).values()].join('');
  }
  
  async function deleteProfile() {
    if (clickedDelete) {
      try {
        const { deleted } = await postData(ROUTE__API__USER__PROFILE__DELETE, $userData);
        if (deleted) {
          clickedDelete = false;
          handleCloseClick();
          logout();
        }
      }
      catch ({ message }) { alert(message); }
    }
    else clickedDelete = true;
  }
  
  async function loadProfileData() {
    try {
      const profileData = await postData(ROUTE__API__USER__PROFILE__GET, $userData);
      
      oldPassword = profileData.password;
      oldUsername = profileData.username;
      password = profileData.password;
      username = profileData.username;
      dataLoaded = true;
    }
    catch ({ message }) {
      userProfileOpened.set(false);
      alert(message);
    }
  }
  
  $: if (dataLoaded && inputRef) inputRef.focus();
  $: if (formRef && dataLoaded) {
    initialFormData = [...new FormData(formRef).values()].join('');
  }
  $: if ($userProfileOpened) loadProfileData();
</script>

{#if $userProfileOpened && dataLoaded}
  <Dialog
    onCloseClick={handleCloseClick}
    title="User Profile"
  >
    <form
      action={ROUTE__API__USER__PROFILE__SET}
      bind:this={formRef}
      class="user-profile-form"
      method="POST"
      on:input={handleChange}
      on:submit|preventDefault={handleSubmit}
    >
      <input type="hidden" name="oldPassword" value={oldPassword} />
      <input type="hidden" name="oldUsername" value={oldUsername} />
      <LabeledInput label="Username" name="username" value={username} autoFocus required />
      <LabeledInput label="Password" name="password" value={password} required />
      <nav>
        <button disabled={!dataUpdated}>Update</button>
      </nav>
      
      <div
        class="delete-profile"
        class:clicked-once={clickedDelete}
      >
        Delete Profile. This can't be undone.
        <button type="button" on:click={deleteProfile}>
          {#if clickedDelete}
            Confirm Delete
          {:else}
            Delete
          {/if}
        </button>
      </div>
    </form>
  </Dialog>
{/if}

<style>
  .user-profile-form {
    padding: 1em;
  }
  .user-profile-form nav {
    margin: 0;
  }
  
  .user-profile-form button {
    width: 100%;
  }
  .user-profile-form button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .delete-profile {
    text-align: center;
    padding: 0.5em;
    border: groove 2px;
    margin-top: 1em;
    background: rgba(0, 0, 0, 0.06);
  }
  .delete-profile button {
    margin-top: 0.5em;
  }
  .delete-profile.clicked-once {
    background: rgba(255, 0, 0, 0.3);
  }
  .delete-profile.clicked-once button {
    background: #a50000;
  }
</style>
