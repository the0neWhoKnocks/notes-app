import { mount } from 'svelte';
import { DOM__SVELTE_MOUNT_POINT } from '../constants';
import App from './components/App.svelte';
import ConfigDialog from './components/ConfigDialog.svelte';

const props = {
  target: document.getElementById(DOM__SVELTE_MOUNT_POINT),
  props: window.app.props,
};
if (window.app.props.configExists) mount(App, props);
else mount(ConfigDialog, props);

document.body.classList.add('view-loaded');
