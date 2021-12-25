import { get as getStoreValue, derived, writable } from 'svelte/store';
import {
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

export const currentGroupPath = writable('root');
export const currentNotes = writable();
export const dialogDataForDelete = writable();
export const dialogDataForDiff = writable();
export const dialogDataForGroup = writable();
export const dialogDataForNote = writable();
export const noteGroups = writable();
export const offline = writable(false);
export const userData = writable();
export const userIsLoggedIn = writable(false);
export const userNavOpen = writable(false);
export const userProfileOpened = writable(false);
export const userStorageType = writable();

export const currentNoteGroupNotes = derived( // current notes group
	[noteGroups, currentGroupPath],
	([groups, path], set) => {
    if (groups) { // will be undefined until initial load of User data
      const { notes } = getPathNode(groups, path);
			set({ notes, path });
    }
  }
);
currentNoteGroupNotes.subscribe(data => {
	currentNotes.set(data);
});

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
	
	currentNotes.set();
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
				notesData,
				preferences,
			} = await postData(ROUTE__API__USER__DATA__GET, creds);
			noteGroups.set(notesData);
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
