<script>
  import { onMount, tick } from 'svelte';
  import Icon, { ICON__ASTERISK } from './Icon.svelte';
  
  let {
    autoComplete = false,
    autoFocus = false,
    class: _class = '',
    disabled = false,
    helpText = '',
    hiddenValue = '',
    label = '',
    min = undefined,
    name = '',
    onInput = undefined,
    placeholder = '',
    required,
    type = 'text',
    value = '',
  } = $props();
  
  const id = window.btoa(`cli_${name}`).replace(/=/g, '');
  let inputRef;
  
  onMount(async () => {
    if (autoFocus) {
      await tick();
      inputRef.focus();
    }
  });
</script>

<div class="labeled-input {_class}">
  <div class="labeled-input__wrapper">
    {#if hiddenValue}
      <input type="hidden" name="{name}_hidden" value="{hiddenValue}" />
    {/if}
    <input
      autocomplete={autoComplete ? 'on' : 'off'}
      bind:this={inputRef}
      oninput={onInput}
      {id}
      {disabled}
      {min}
      {name}
      {placeholder}
      {required}
      {type}
      {value}
    />
    <label for="{id}">{label}</label>
    {#if required}
      <Icon type={ICON__ASTERISK} />
    {/if}
  </div>
  {#if helpText}
    <p class="help-text">{helpText}</p>
  {/if}
</div>

<style>
  .labeled-input input {
    width: var(--labeled-input__input-width, auto);
    padding: 0.5em;
    margin-left: 0.5em;
  }
  .labeled-input input:required {
    padding: 0.5em 1.75em 0.5em 0.5em;
  }
  :global(.labeled-input input:required ~ svg) {
    color: #ff7600;
    font-size: 1em;
    position: absolute;
    top: 50%;
    right: 0.5em;
    transform: translateY(-50%);
  }
  .labeled-input__wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row-reverse;
    position: relative;
  }
  
  .help-text {
    color: rgba(0 ,0, 0, 0.5);
    font-size: 0.75em;
    margin: 0.5em 0;
  }
</style>
