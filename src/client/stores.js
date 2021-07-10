import { derived, writable } from 'svelte/store';
import getPathNode from './utils/getPathNode';

export const noteGroups = writable({
  root: {
    groups: {},
    notes: [],
  },
});

export const currentGroupPath = writable('root');

export const currentNoteGroupNotes = derived(
	[noteGroups, currentGroupPath],
	([$noteGroups, $currentGroupPath]) => {
    const { notes } = getPathNode($noteGroups, $currentGroupPath);
    return notes;
  }
);

export const userData = writable();
