import { get as getStoreValue, writable } from 'svelte/store';
import {
  BASE_DATA_NODE,
  NAMESPACE__STORAGE__USER,
  ROUTE__API__USER__DATA__GET,
  ROUTE__API__USER__DATA__SET,
} from '../constants';
import { getGroupNode, getNoteNode } from '../utils/dataNodeUtils';
import logger from '../utils/logger';
import postData from './utils/postData';
import {
  getStorageType,
  setStorage,
} from './utils/storage';

const log = logger('stores');

export const allTags = writable([]);
export const currentTag = writable();
export const dialogDataForDelete = writable();
export const dialogDataForDiff = writable();
export const dialogDataForGroup = writable();
export const dialogDataForMove = writable();
export const dialogDataForNote = writable();
export const initialUserDataLoaded = writable(false);
export const loggedInStateChecked = writable(false);
export const noteGroups = writable();
export const notesNavFlyoutOpen = writable(false);
export const offline = writable(false);
export const recentlyViewed = writable();
export const recentlyViewedOpen = writable(false);
export const searchFlyoutOpen = writable(false);
export const themeSelectorOpen = writable(false);
export const userData = writable();
export const userIsLoggedIn = writable(false);
export const userNavOpen = writable(false);
export const userProfileOpened = writable(false);
export const userStorageType = writable();

export async function setUserData(payload) {
  const oldNotes = JSON.stringify(getStoreValue(noteGroups));
  const oldPrefs = JSON.stringify(getStoreValue(userPreferences));
  const oldRecent = JSON.stringify(getStoreValue(recentlyViewed));
  const oldTags = JSON.stringify(getStoreValue(allTags));
  
  const newData = await postData(ROUTE__API__USER__DATA__SET, payload);
  const {
    allTags: tags,
    notesData,
    preferences,
    recentlyViewed: recent,
  } = newData;
  
  if (
    notesData
    && JSON.stringify(notesData) !== oldNotes
  ) noteGroups.set(notesData);
  
  if (
    preferences
    && JSON.stringify(preferences) !== oldPrefs
  ) userPreferences.set(preferences);
  
  if (
    recent
    && JSON.stringify(recent) !== oldRecent
  ) recentlyViewed.set(recent);
  
  if (
    tags
    && JSON.stringify(tags) !== oldTags
  ) {
    allTags.set(tags);
    
    const cT = getStoreValue(currentTag);
    if (cT && !tags[cT]) {
      currentTag.set();
      updateHistory();
    }
  }
  
  return newData;
}

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
        
        if (recent?.length) {
          const otherItems = recent.filter(path => path !== note.path);
          // make sure current item is at top of list
          const current = [note.path, ...otherItems];
          // truncate list to max length
          const oldRecent = JSON.stringify(recent);
          recent = (current.length > MAX_ITEMS)
            ? current.slice(0, MAX_ITEMS)
            : current;
          changed = JSON.stringify(recent) !== oldRecent;
        }
        else {
          recent = [note.path];
          changed = true;
        }
        
        if (changed) {
          await setUserData({
            ...getStoreValue(userData),
            action: 'edit',
            recent,
            type: 'recentlyViewed',
          });
        }
      }
    },
  };
})();

export function editItem({ id, path, type } = {}) {
  const _noteGroups = getStoreValue(noteGroups);
  const base = { action: 'edit', path };
  
  log.info(`Edit ${type} "${id}"`);
  
  if (type === 'group') {
    const { groupName } = getGroupNode(_noteGroups, path).group;
    dialogDataForGroup.set({ ...base, id, name: groupName });
  }
  else {
    const { draft, ...rest } = getNoteNode(_noteGroups, path).note;
    let content, fromDraft, tags, title;
    
    if (draft) {
      ({ content, tags, title } = draft);
      fromDraft = true;
    }
    else {
      ({ content, tags, title } = rest);
    }
    
    dialogDataForNote.set({ ...base, content, fromDraft, id, tags, title });
  }
}

export function deleteItem({ id, path, type } = {}) {
  const _noteGroups = getStoreValue(noteGroups);
  let groupName, title;
  
  if (type === 'group') {
    ({ groupName, title } = getGroupNode(_noteGroups, path).group);
  }
  else {
    const { note } = getNoteNode(_noteGroups, path);
    ({ groupName, title } = (note.draft) ? note.draft : note);
  }
  
  log.info(`Delete ${type} "${id}"`);
  dialogDataForDelete.set({ groupName, id, path, title, type });
}

export const userPreferences = (function createPrefsStore() {
  const { subscribe, set, update } = writable({});

  return {
    clear: () => {
      update(() => ({}));
    },
    set,
    setPreference: async (prop, value) => {
      try {
        await setUserData({
          ...getStoreValue(userData),
          action: 'edit',
          prefs: { [prop]: value },
          type: 'preferences',
        });
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
  
  loggedInStateChecked.set(true);
}

export function login({ data, persistent }) {
  setStorage({ data, key: NAMESPACE__STORAGE__USER, persistent });
  checkLoggedInState();
}

export function logout() {
  const storageType = getStoreValue(userStorageType);
  window[storageType].removeItem(NAMESPACE__STORAGE__USER);
  
  currentNote.set();
  initialUserDataLoaded.set(false);
  loggedInStateChecked.set(true);
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
  document.body.className = document.body.className.replace(/theme-[\w]+/, '');
  if (theme) document.body.classList.add(`theme-${theme}`);
  
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
    currentTag.set();
  }
  
  window.history.replaceState({}, '', _url);
}

export async function loadNote(notePath) {
  if (notePath) {
    const nG = getStoreValue(noteGroups);
    const nNFO = getStoreValue(notesNavFlyoutOpen);
    const sFO = getStoreValue(searchFlyoutOpen);
    const cT = getStoreValue(currentTag);
    const path = decodeURIComponent(notePath);
    const { id, note } = getNoteNode(nG, path);
    
    if (cT) currentTag.set();
    
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
  if (cN?.id === id) {
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
    currentTag.set(tag);
    updateHistory({ params: { tag: encodeURIComponent(tag) } });
  }
  // no note found, so update URL
  else updateHistory();
}

export function getNoteBlurbs(notePaths) {
  const nG = getStoreValue(noteGroups);
  
  return notePaths.reduce((arr, path) => {
    const { note } = getNoteNode(nG, path);
    
    // in case something goes wrong updating paths, only return payloads for
    // notes that can be found.
    if (note) {
      const { content, title } = note
      arr.push({
        content,
        path,
        subTitle: path.replace(BASE_DATA_NODE, ''),
        title,
      });
    }
    
    return arr;
  }, []);
}

export async function updateItemPath(payload) {
  try {
    const cN = getStoreValue(currentNote);
    
    await setUserData({
      ...getStoreValue(userData),
      ...payload,
      action: 'move',
    });
    
    // If a Note is open, update the URL
    if (cN) {
      const { id, newParentPath } = payload;
      updateHistory({
        params: { note: encodeURIComponent(`${newParentPath}/${id}`) },
      });
    }
    
    dialogDataForMove.set();
  }
  catch ({ message }) {
    alert(`Error during move:\n${message}`);
  }
}

export async function deleteNoteData(data) {
  const cN = getStoreValue(currentNote);
  const { id, path, type } = getStoreValue(dialogDataForDelete);
  
  await setUserData(data);
  
  if (
    type === 'group'
    && cN
    && cN.path.startsWith(`${path}/${id}/`)
  ) {
    updateCurrNote({ id: cN.id });
  }
  else updateCurrNote({ id });
}
