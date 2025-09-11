<script>
  import {
    ROUTE__API__USER__LOGIN,
    ROUTE__API__USER__PROFILE__CREATE,
  } from '../../constants';
  import postData from '../utils/postData';
  import {
    errorMessage,
    login,
    loggedInStateChecked,
    offline,
    userData,
    userIsLoggedIn,
    userStorageType,
  } from '../stores';
  import Dialog from './Dialog.svelte';
  import HRWithText from './HRWithText.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  let createUserOpen = $state.raw(false);
  let createFormRef = $state();
  let loginFormRef = $state();
  let loginOpen = $state.raw(true);
  let loginPassword = $state.raw();
  let loginUsername = $state.raw();
  
  let rememberCredentials = $derived($userStorageType === 'localStorage');
  
  function handleLoginSubmit(ev) {
    ev.preventDefault();
    
    postData(loginFormRef.action, loginFormRef)
      .then((userData) => {
        login({
          data: userData,
          persistent: rememberCredentials,
        });
      })
      .catch(({ message }) => { errorMessage.set(message); });
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
        .catch(({ message }) => { alert(message); });
    }
    else {
      alert("Your passwords don't match");
    }
  }
  
  function updateStorageType({ currentTarget: { checked } }) {
    if (checked) userStorageType.set('localStorage');
    else userStorageType.set('sessionStorage');
  }
  
  $effect(() => {
    if (!$userIsLoggedIn) {
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
  });
</script>

{#if $loggedInStateChecked && !$userIsLoggedIn}
  {#if loginOpen}
    <Dialog modal>
      {#snippet s_dialogBody()}
        <form
          action={ROUTE__API__USER__LOGIN}
          autocomplete='off'
          class="login-form"
          method="POST"
          spellcheck="false"
          bind:this={loginFormRef}
          onsubmit={handleLoginSubmit}
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
              onchange={updateStorageType}
            />
            Remember Me
          </label>
          <button value="login">Log In</button>
          {#if !$offline}
            <HRWithText label="or" />
            <button
              type="button"
              value="create"
              onclick={openCreateAccount}
            >Create Account</button>
          {/if}
        </form>
      {/snippet}
    </Dialog>
  {/if}
  {#if createUserOpen}
    <Dialog onCloseClick={closeCreateAccount}>
      {#snippet s_dialogBody()}
        <form
          action={ROUTE__API__USER__PROFILE__CREATE}
          autocomplete="off"
          class="create-form"
          method="POST"
          spellcheck="false"
          bind:this={createFormRef}
          onsubmit={handleCreateSubmit}
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
              onclick={closeCreateAccount}
              type="button"
              value="cancel"
            >Cancel</button>
            <button value="create">Create</button>
          </nav>
        </form>
      {/snippet}
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
