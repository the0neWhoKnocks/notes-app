<script>
  import {
    ROUTE__API__USER__PROFILE__DELETE,
    ROUTE__API__USER__PROFILE__GET,
    ROUTE__API__USER__PROFILE__SET,
  } from '../../constants';
  import {
    errorMessage,
    logout,
    profileUpdated,
    userData,
    userProfileOpened,
  } from '../stores';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  let clickedDelete = $state.raw(false);
  let dataLoaded = $state.raw(false);
  let dataUpdated = $state.raw(false);
  let formRef = $state();
  let initialFormData = $state();
  let inputRef;
  let oldPassword = $state.raw('');
  let oldUsername = $state.raw('');
  let password = $state.raw('');
  let username = $state.raw('');

  async function handleSubmit(ev) {
    ev.preventDefault();
    
    try {
      const data = await postData(formRef.action, formRef);
      profileUpdated(data);
    }
    catch ({ message }) { errorMessage.set(message); }
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
  
  $effect(() => {
    if (dataLoaded && inputRef) inputRef.focus();
  });
  
  $effect(() => {
    if (formRef && dataLoaded) {
      initialFormData = [...new FormData(formRef).values()].join('');
    }
  });
  
  $effect(() => {
    if ($userProfileOpened) loadProfileData();
  });
</script>

{#if $userProfileOpened && dataLoaded}
  <Dialog
    onCloseClick={handleCloseClick}
    title="User Profile"
  >
    {#snippet s_dialogBody()}
      <form
        class="user-profile-form"
        action={ROUTE__API__USER__PROFILE__SET}
        method="POST"
        bind:this={formRef}
        oninput={handleChange}
        onsubmit={handleSubmit}
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
          <button type="button" onclick={deleteProfile}>
            {#if clickedDelete}
              Confirm Delete
            {:else}
              Delete
            {/if}
          </button>
        </div>
      </form>
    {/snippet}
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
