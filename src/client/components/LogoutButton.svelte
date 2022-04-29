<script>
  import { logout } from '../stores.js';
  import Icon, { ICON__LOCK } from './Icon.svelte';
</script>

<button on:click={logout}>
  <Icon type="{ICON__LOCK}" /> Logout
</button>
