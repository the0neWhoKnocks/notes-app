import { get as getStoreValue, writable } from 'svelte/store';
import {
	BASE_DATA_NODE,
	NAMESPACE__STORAGE__USER,
	ROUTE__API__USER__DATA__GET,
	ROUTE__API__USER__DATA__SET,
} from '../constants';
import getPathNode from '../utils/getPathNode';
import logger from '../utils/logger';
import postData from './utils/postData';
import {
	getStorageType,
	setStorage,
} from './utils/storage';

const log = logger('stores');

export const allTags = writable([]);
export const dialogDataForDelete = writable();
export const dialogDataForDiff = writable();
export const dialogDataForGroup = writable();
export const dialogDataForNote = writable();
export const initialUserDataLoaded = writable(false);
export const noteGroups = writable();
export const notesNavFlyoutOpen = writable(false);
export const offline = writable(false);
export const recentlyViewed = writable();
export const recentlyViewedOpen = writable(false);
export const searchFlyoutOpen = writable(false);
export const tagsList = writable();
export const themeSelectorOpen = writable(false);
export const userData = writable();
export const userIsLoggedIn = writable(false);
export const userNavOpen = writable(false);
export const userProfileOpened = writable(false);
export const userStorageType = writable();

export const currentNote = (function curentNoteStore() {
	const store = writable();
	const MAX_ITEMS = 10;

	return {
		...store,
		set: async (note) => {
			store.set(note);
			
			if (note) {	
				let changed = false;
				let recent = getStoreValue(recentlyViewed);
				
				if (recent && recent.length) {
					const trimmed = recent.filter(path => path !== note.path);
					// current item removed
					changed = (trimmed.length < recent.length);
					// make sure current item is at top of list
					const current = [note.path, ...trimmed];
					// new item was added
					if (!changed) changed = (current.length > recent.length);
					// truncate list to max length
					recent = (current.length > MAX_ITEMS)
						? current.slice(0, MAX_ITEMS)
						: current;
				}
				else {
					recent = [note.path];
					changed = true;
				}
				
				if (changed) {
					await postData(ROUTE__API__USER__DATA__SET, {
						...getStoreValue(userData),
						action: 'edit',
						recent,
						type: 'recentlyViewed',
					});
					
					recentlyViewed.set(recent);
				}
			}
		},
	};
})();

export const userPreferences = (function createPrefsStore() {
	const { subscribe, set, update } = writable({});

	return {
		clear: () => {
			update(() => ({}));
		},
		set,
		setPreference: async (prop, value) => {
			try {
				const { preferences } = await postData(ROUTE__API__USER__DATA__SET, {
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

export function checkLoggedInState() {
	const storageType = getStorageType(NAMESPACE__STORAGE__USER);
	userStorageType.set(storageType);
	
	if (storageType) {
		userData.set(
			JSON.parse(window[storageType].getItem(NAMESPACE__STORAGE__USER))
		);
		
		userIsLoggedIn.set(true);
		log.info('[USER] logged in');
	}
}

export function login({ data, persistent }) {
	setStorage({ data, key: NAMESPACE__STORAGE__USER, persistent });
	checkLoggedInState();
}

export function logout() {
	const storageType = getStoreValue(userStorageType);
	window[storageType].removeItem(NAMESPACE__STORAGE__USER);
	
	currentNote.set();
	noteGroups.set();
	userIsLoggedIn.set(false);
	userNavOpen.set(false);
	userPreferences.clear();
	
	// Maintain the creds in case the User logged out on accident. If they
	// refresh, the inputs will have to be filled out again.
	if (storageType === 'sessionStorage') {
		userData.set();
		userStorageType.set();
	}
	
	log.info('[USER] logged out');
}

export function loadThemeCSS(theme) {
	document.getElementById('prismTheme').href = `/css/vendor/prism/themes/prism${theme ? `-${theme}` : ''}.css`;
}

export async function syncOfflineData(creds) {
	if (creds) {
		try {
			// const offlineData = (ignoreOfflineChanges)
			//   ? undefined
			//   : await window.sw.getOfflineData(creds);
			// const offlineChangesExist = offlineData && offlineData.data;
			// const serverData = await postData(ROUTE__API__USER__DATA__GET, {
			//   ...creds,
			//   offlineChangesExist,
			// });
			
			const {
				allTags: tags,
				notesData,
				preferences,
				recentlyViewed: recent,
			} = await postData(ROUTE__API__USER__DATA__GET, creds);
			allTags.set(tags);
			noteGroups.set(notesData);
			recentlyViewed.set(recent);
			userPreferences.set(preferences);
			loadThemeCSS(preferences.theme);
			
			// if (offlineChangesExist) {
			//   const diffs = diffData(serverData, offlineData.data);
			//   dialogDataForDiff.set(diffs);
			// }
			// else {
			//   const {
			//     notesData,
			//     preferences,
			//   } = serverData;
			//   noteGroups.set(notesData);
			//   userPreferences.set(preferences);
			//   loadThemeCSS(preferences.theme);
			// }
		}
		catch ({ message }) { alert(message); }
	} 
}

async function handleNetworkChange() {
	const wasOffline = getStoreValue(offline);
	
	offline.set(!navigator.onLine);
	
	if (wasOffline && navigator.onLine) {
		const data = getStoreValue(userData);
		await syncOfflineData(data);
	}
}
export function trackNetworkStatus() {
	window.addEventListener('online',  handleNetworkChange);
	window.addEventListener('offline', handleNetworkChange);
	window.addEventListener('load', handleNetworkChange);
}

export function profileUpdated(data) {
	const persistent = getStorageType(NAMESPACE__STORAGE__USER) === 'localStorage';
	setStorage({ data, key: NAMESPACE__STORAGE__USER, persistent });
	
	userData.set(data);
	closeUserProfile();
	
	log.info(`[USER] profile updated: ${JSON.stringify(data)}`);
}

export function openUserProfile() {
	userProfileOpened.set(true);
}
export function closeUserProfile() {
	userProfileOpened.set(false);
}

export function updateHistory({ params, path } = {}) {
	const _url = new URL(window.location);
	_url.pathname = path || '/';
	_url.search = '';
	
	if (params) {
		Object.entries(params).forEach(([prop, val]) => {
			_url.searchParams.set(prop, val);
		});
	}
	
	if (_url.pathname === '/' && !_url.search) {
		currentNote.set();
	}
	
	window.history.replaceState({}, '', _url);
}

export async function loadNote(notePath) {
	if (notePath) {
		const nG = getStoreValue(noteGroups);
		const nNFO = getStoreValue(notesNavFlyoutOpen);
		const sFO = getStoreValue(searchFlyoutOpen);
		const tL = getStoreValue(tagsList);
		const path = decodeURIComponent(notePath);
		const { id, notes } = getPathNode(nG, path);
		const note = notes[id];
		
		if (tL) tagsList.set();
		
		if (nNFO) notesNavFlyoutOpen.set(false);
		else if (sFO) searchFlyoutOpen.set(false);
		
		// could be 'undefined' if a User hits up a dead URL
		if (note) {
			updateHistory({ params: { note: encodeURIComponent(path) } });
			await currentNote.set({ ...note, id, path });
		}
		// no note found, so update URL
		else updateHistory();
	}
}

export function updateCurrNote({ id, noteData, params } = {}) {
	const cN = getStoreValue(currentNote);
	
	// For the case where another note is open, and the User decided to 
	// edit/delete a note from the NotesNav, only update the URL and the currently
	// open note's data if the ids match.
	if (cN && cN.id === id) {
		currentNote.set(noteData);
		updateHistory({ params });
	}
}

export function loadTaggedNotes(tag) {
	const aT = getStoreValue(allTags);
	const cN = getStoreValue(currentNote);
	const nNFO = getStoreValue(notesNavFlyoutOpen);
	const sFO = getStoreValue(searchFlyoutOpen);
	
	if (cN) currentNote.set();
	
	if (nNFO) notesNavFlyoutOpen.set(false);
	else if (sFO) searchFlyoutOpen.set(false);
	
	// could be 'undefined' if a User hits up a dead URL
	if (tag && aT && aT[tag]) {
		tagsList.set(aT[tag]);
		updateHistory({ params: { tag: encodeURIComponent(tag) } });
	}
	// no note found, so update URL
	else updateHistory();
}

export function getNoteBlurbs(notePaths) {
	const nG = getStoreValue(noteGroups);
	
	return notePaths.map((path) => {
		const { id, notes } = getPathNode(nG, path);
		const { content, title } = notes[id];
		return {
			content,
			path,
			subTitle: path.replace(BASE_DATA_NODE, ''),
			title,
		};
	});
}
