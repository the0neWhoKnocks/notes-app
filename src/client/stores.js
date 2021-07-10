import { derived, writable } from 'svelte/store';
import getPathNode from './utils/getPathNode';

export const noteGroups = writable(Promise.resolve({
  root: {
    groups: {},
    notes: [],
  },
}));

export const currentGroupPath = writable('root');

export const currentNoteGroupNotes = derived(
	[noteGroups, currentGroupPath],
	async ([groups, path], set) => {
    const { notes } = getPathNode(await groups, path);
    set(notes);
  }
);

export const userData = writable();
