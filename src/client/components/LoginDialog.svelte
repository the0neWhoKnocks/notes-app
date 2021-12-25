<script>
  import {
    ROUTE__API__USER__LOGIN,
    ROUTE__API__USER__PROFILE__CREATE,
  } from '../../constants';
  import postData from '../utils/postData';
  import {
    login,
    offline,
    userData,
    userIsLoggedIn,
    userStorageType,
  } from '../stores.js';
  import Dialog from './Dialog.svelte';
  import HRWithText from './HRWithText.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  let createUserOpen = false;
  let loginOpen = true;
  let rememberCredentials = false;
  let createFormRef;
  let loginFormRef;
  let loginPassword;
  let loginUsername;
  
  function handleLoginSubmit(ev) {
    ev.preventDefault();
    
    postData(loginFormRef.action, loginFormRef)
      .then((userData) => {
        login({
          data: userData,
          persistent: rememberCredentials,
        });
      })
      .catch(({ message }) => { alert(message); });
  }
  
  function closeCreateAccount() {
    createUserOpen = false;
    loginOpen = true;
  }
  
  function openCreateAccount() {
    loginOpen = false;
    createUserOpen = true;
  }
  
  function handleCreateSubmit(ev) {
    ev.preventDefault();
    
    const data = new FormData(createFormRef);
    const password = data.get('password');
    const username = data.get('username');
    
    if (password === data.get('passwordConfirmed')) {
      postData(createFormRef.action, createFormRef)
        .then(() => {
          loginUsername = username;
          loginPassword = password;
          closeCreateAccount();
        })
        .catch(({ error }) => { alert(error); });
    }
    else {
      alert("Your passwords don't match");
    }
  }
  
  function updateStorageType({ currentTarget: { checked } }) {
    if (checked) userStorageType.set('localStorage');
    else userStorageType.set('sessionStorage');
  }
  
  $: if (!$userIsLoggedIn) {
    if ($userData) {
      const { password, username } = $userData;
      loginUsername = username;
      loginPassword = password;
    }
    else {
      loginUsername = '';
      loginPassword = '';
    }
  }
  $: rememberCredentials = $userStorageType === 'localStorage';
</script>

{#if !$userIsLoggedIn}
  {#if loginOpen}
    <Dialog modal>
      <form
        action={ROUTE__API__USER__LOGIN}
        autocomplete='off'
        bind:this={loginFormRef}
        class="login-form"
        method="POST"
        on:submit={handleLoginSubmit}
        slot="dialogBody"
        spellcheck="false"
      >
        <HRWithText label="Log In" />
        <LabeledInput
          autoFocus
          label="Username"
          name="username"
          required
          value={loginUsername}
        />
        <LabeledInput
          label="Password"
          name="password"
          required
          type="password"
          value={loginPassword}
        />
        <label class="remember-me">
          <input
            type="checkbox"
            checked={rememberCredentials}
            on:change={updateStorageType}
          />
          Remember Me
        </label>
        <button value="login">Log In</button>
        {#if !$offline}
          <HRWithText label="or" />
          <button
            type="button"
            value="create"
            on:click={openCreateAccount}
          >Create Account</button>
        {/if}
      </form>
    </Dialog>
  {/if}
  {#if createUserOpen}
    <Dialog onCloseClick={closeCreateAccount}>
      <form
        action={ROUTE__API__USER__PROFILE__CREATE}
        autocomplete="off"
        bind:this={createFormRef}
        class="create-form"
        method="POST"
        on:submit={handleCreateSubmit}
        slot="dialogBody"
        spellcheck="false"
      >
        <HRWithText label="Create Account" />
        <LabeledInput
          autoFocus 
          label="Username"
          name="username"
          required
        />
        <LabeledInput
          label="Password"
          name="password"
          required
          type="password"
        />
        <LabeledInput
          label="Confirm Password"
          name="passwordConfirmed"
          required
          type="password"
        />
        <nav>
          <button
            on:click={closeCreateAccount}
            type="button"
            value="cancel"
          >Cancel</button>
          <button value="create">Create</button>
        </nav>
      </form>
    </Dialog>
  {/if}
{/if}

<style>
  form {
    padding: 1em;
  }
  
  .create-form nav {
    display: flex;
  }
  .create-form nav button:not(:first-of-type) {
    margin-left: 0.75em;
  }
  
  .remember-me {
    text-align: right;
    user-select: none;
    cursor: pointer;
    display: block;
  }
</style>
