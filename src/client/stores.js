import { derived, writable } from 'svelte/store';
import getPathNode from '../utils/getPathNode';

export const noteGroups = writable();

export const currentGroupPath = writable('root');

export const currentNoteGroupNotes = derived(
	[noteGroups, currentGroupPath],
	([groups, path], set) => {
    if (groups) { // will be undefined until initial load of User data
      const { notes } = getPathNode(groups, path);
      set(notes);
    }
  }
);

export const userData = writable();

export const groupDialogData = writable();
export const noteDialogData = writable();
