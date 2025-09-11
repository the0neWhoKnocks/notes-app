<script>
  import logger from '../../utils/logger';
  import { errorMessage } from '../stores';
  import Dialog from './Dialog.svelte';
  
  const log = logger('App');
  let msg = $state.raw('');
  let type = $state.raw('string');
  
  function handleClose() {
    errorMessage.set();
  }
  
  $effect(() => {
    if ($errorMessage) {
      log.error($errorMessage);
      if (($errorMessage instanceof Error)) {
        msg = $errorMessage.stack;
        type = 'error';
      }
      else {
        msg = $errorMessage;
        type = 'string';
      }
    }
    else { msg = undefined; }
  });
</script>

{#if msg}
  <Dialog focusClose onCloseClick={handleClose}>
    {#snippet s_dialogBody()}
      <pre
        class="error-message"
        class:no-wrap={type === 'error'}
      >{msg}</pre>
    {/snippet}
  </Dialog>
{/if}

<style>
  :global(.dialog:has(.error-message)) {
    --dialog-body-color: #ffd0d0;
    --dialog-border-color: #5f0b0b;
    --dialog-title-bg-color: var(--dialog-border-color);
    --dialog-title-text-color: var(--dialog-body-color);
    
    color: var(--dialog-border-color);
  }
  
  .error-message {
    max-width: min(400px, calc(100vw - 2em));
    white-space: pre-wrap;
    padding: 1em;
    margin: 0;
    
    &.no-wrap {
      white-space: pre;
    }
    
  }
</style>
