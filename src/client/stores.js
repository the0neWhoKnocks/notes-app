import { get as getStoreValue, derived, writable } from 'svelte/store';
import {
	ROUTE__API__USER_SET_DATA,
} from '../constants';
import getPathNode from '../utils/getPathNode';
import postData from './utils/postData';

export const noteGroups = writable();

export const offline = writable(false);

export const currentGroupPath = writable('root');

export const currentNoteGroupNotes = derived(
	[noteGroups, currentGroupPath],
	([groups, path], set) => {
    if (groups) { // will be undefined until initial load of User data
      const { notes } = getPathNode(groups, path);
      set({ notes, path });
    }
  }
);

export const userData = writable();
export const userPreferences = (function createPrefsStore() {
	const { subscribe, set, update } = writable({});

	return {
		clear: () => {
			update(() => ({}));
		},
		set,
		setPreference: async (prop, value) => {
			try {
				const { preferences } = await postData(ROUTE__API__USER_SET_DATA, {
					...getStoreValue(userData),
					action: 'edit',
					prefs: { [prop]: value },
					type: 'preferences',
				});
				
				update(() => preferences);
			}
			catch ({ message }) { alert(`Error saving preference for "${prop}"\n${message}`); }
		},
		subscribe,
		update,
	};
})();

export const dialogDataForDelete = writable();
export const dialogDataForGroup = writable();
export const dialogDataForNote = writable();
