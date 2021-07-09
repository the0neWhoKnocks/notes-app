import { DOM__SVELTE_MOUNT_POINT } from '../constants';
import App from './App.svelte';
import ConfigDialog from './components/ConfigDialog.svelte';

const props = {
  target: document.getElementById(DOM__SVELTE_MOUNT_POINT),
  props: window.app.props,
};
if (window.app.props.configExists) new App(props);
else new ConfigDialog(props);

document.body.classList.add('view-loaded');
