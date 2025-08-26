import { tick } from 'svelte';
import { get as getStoreValue, writable } from 'svelte/store';
import {
  BASE_DATA_NODE,
  DATA_ACTION__EDIT,
  DATA_ACTION__MOVE,
  DATA_TYPE__GROUP,
  DATA_TYPE__PREFS,
  DATA_TYPE__RECENT,
  NAMESPACE__STORAGE__USER,
  ROUTE__API__USER__DATA__GET,
  ROUTE__API__USER__DATA__SET,
} from '../constants';
import { getGroupNode, getNoteNode } from '../utils/dataNodeUtils';
import {
  MSG_TYPE__CLEAR_OFFLINE_DATA,
  MSG_TYPE__GET_OFFLINE_DATA,
} from './serviceWorker/constants.mjs';
import kebabCase from '../utils/kebabCase';
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
export const loadingTaggedNotes = writable(false);
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
            action: DATA_ACTION__EDIT,
            recent,
            type: DATA_TYPE__RECENT,
          });
        }
      }
    },
  };
})();

export function editItem({ id, path, type } = {}) {
  const _noteGroups = getStoreValue(noteGroups);
  const base = { action: DATA_ACTION__EDIT, path };
  
  log.info(`Edit ${type} "${id}"`);
  
  if (type === DATA_TYPE__GROUP) {
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
  
  if (type === DATA_TYPE__GROUP) {
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
          action: DATA_ACTION__EDIT,
          prefs: { [prop]: value },
          type: DATA_TYPE__PREFS,
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

export async function logout() {
  const storageType = getStoreValue(userStorageType);
  window[storageType].removeItem(NAMESPACE__STORAGE__USER);
  
  await currentNote.set();
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
  return new Promise((resolve) => {
    const currEl = document.getElementById('prismTheme');
    const newEl = document.createElement('link');
    [...currEl.attributes].filter((attr) => attr.name !== 'href').forEach((attr) => {
      newEl[attr.name] = attr.value;
    });
    
    const url = `/css/vendor/prism/themes/prism${theme ? `-${theme}` : ''}.min.css`;
    
    newEl.addEventListener('load', () => {
      document.body.className = document.body.className.replace(/theme-[\w]+/, '');
      if (theme) document.body.classList.add(`theme-${theme}`);
      resolve();
    });
    newEl.href = url;
    // NOTE: Can't listen for the `load` state on a link element that's already
    // loaded, regardless if the `href` was updated. So I have to replace the
    // entire element with a 
    currEl.parentNode.replaceChild(newEl, currEl);
  });
}

function diff(objA, objB, { diffs, parentObjB, parentPath = '' } = {}) {
  const _diffs = diffs || {
    added: [],
    modified: [],
    removed: [],
  };
  
  if (!objA) return _diffs;
  const objAKeys = Object.keys(objA);
  
  let _objB = objB;
  if (!_objB) {
    const objBKeys = Object.keys(parentObjB);
    for (let i=0; i<objBKeys.length; i++) {
      const prop = objBKeys[i];
      const obj = parentObjB[prop];
      if (obj.created === objA.created) {
        _objB = obj;
        break;
      }
    }
  }

  if (!_objB) {
    _diffs.added.push({ obj: objA, path: parentPath });
  }
  else {
    const objBKeys = Object.keys(_objB);

    if (objBKeys.length > objAKeys.length) {
      objBKeys.forEach((prop) => {
        if (!objA[prop]) {
          const _parentPath = parentPath ? `${parentPath}/${prop}` : prop;
          _diffs.removed.push({ obj: _objB[prop], path: _parentPath });
        }
      });
    }

    objAKeys.forEach(prop => {
      const valA = objA[prop];
      const valB = _objB[prop];

      if (
        typeof valA === 'boolean'
        || typeof valA === 'number'
        || typeof valA === 'string'
      ) {
        if (
          prop !== 'modified' // already know that it's changed, don't need to track this
          && valA !== valB
        ) {
          _diffs.modified.push({
            from: valB,
            path: parentPath ? parentPath : prop,
            prop,
            to: valA,
          });
        }
      }
      else {
        diff(valA, valB, {
          diffs: _diffs,
          parentObjB: _objB,
          parentPath: parentPath ? `${parentPath}/${prop}` : prop,
        });
      }
    });
  }

  return _diffs;
}

function diffData(serverData, offlineData) {
  const serverJSON = JSON.stringify(serverData);
  const offlineJSON = JSON.stringify(offlineData);
  
  if (serverJSON !== offlineJSON) {
    const {
      notesData: serverNotesData,
      preferences: serverPreferences,
    } = serverData;
    const {
      notesData: offlineNotesData,
      preferences: offlinePreferences,
    } = offlineData;

    try {
      return {
        notesDiff: diff(offlineNotesData, serverNotesData),
        prefsDiff: diff(offlinePreferences, serverPreferences),
      };
    }
    catch (err) {
      log.error(err);
    }
  }
}

export async function clearOfflineChanges() {
  const creds = getStoreValue(userData);
  
  await window.sw.postOfflineDataMessage({
    creds,
    type: MSG_TYPE__CLEAR_OFFLINE_DATA,
  });
}

export async function syncOfflineData(creds) {
  if (creds) {
    try {
      let offlineChangesExist = false;
      let offlineData;
      if (window.sw?.activated?.()) {
        offlineData = await window.sw.postOfflineDataMessage({
          creds,
          type: MSG_TYPE__GET_OFFLINE_DATA,
        });
        offlineChangesExist = !!offlineData;
      }
      
      const serverData = await postData(ROUTE__API__USER__DATA__GET, {
        ...creds,
        offlineChangesExist,
      });
        
      if (offlineChangesExist) {
        const diffs = diffData(serverData, offlineData);
        const somethingChanged = Object.values(diffs)
          .reduce((arr, obj) => {
            arr.push(...Object.values(obj));
            return arr;
          }, [])
          .find((arr) => arr.length);
        
        // User could have made changes but then removed them (like adding a
        // note but then deleting it), so verify the Diff dialog actually needs
        // to be displayed.
        if (somethingChanged) dialogDataForDiff.set(diffs);
        else await clearOfflineChanges();
      }
      
      const {
        allTags: tags,
        notesData,
        preferences,
        recentlyViewed: recent,
      } = serverData;
      allTags.set(tags);
      noteGroups.set(notesData);
      recentlyViewed.set(recent);
      userPreferences.set(preferences);
      await tick(); // ensure components have rendered changes
      await loadThemeCSS(preferences.theme);
    }
    catch ({ message, stack }) {
      log.error(stack);
      alert(stack);
    }
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
  window.addEventListener('online', handleNetworkChange);
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

export async function updateHistory({ params, path } = {}) {
  const _url = new URL(window.location);
  _url.pathname = path || '/';
  _url.search = '';
  
  if (params) {
    Object.entries(params).forEach(([prop, val]) => {
      _url.searchParams.set(prop, val);
    });
  }
  
  if (_url.pathname === '/' && !_url.search) {
    await currentNote.set();
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

export async function updateCurrNote({ id, newData, params } = {}) {
  const cN = getStoreValue(currentNote);
  const dataRef = (newData?.draft) ? newData.draft : newData;
  const noteId = kebabCase(dataRef?.title) || id;
  
  let noteData;
  if (newData) {
    noteData = {
      ...cN,
      content: dataRef.content,
      draft: newData?.draft || null, // could be set in the currentNote, but undefined after a deletion so ensure it's overwritten in currentNote.
      id: noteId,
      tags: dataRef.tags,
      title: dataRef.title,
    };
  }
  
  // For the case where the User is on a Full Note page, and the User decided to 
  // edit/delete a note from the NotesNav, only update the URL and the currently
  // open note's data if the ids match.
  if (cN?.id === id) {
    if (noteData) await currentNote.set(noteData);
    updateHistory({ params });
  }
  
  return { noteId };
}

export async function loadTaggedNotes(tag) {
  const aT = getStoreValue(allTags);
  const cN = getStoreValue(currentNote);
  const nNFO = getStoreValue(notesNavFlyoutOpen);
  const sFO = getStoreValue(searchFlyoutOpen);
  
  loadingTaggedNotes.set(true);
  
  if (cN) await currentNote.set();
  
  if (nNFO) notesNavFlyoutOpen.set(false);
  else if (sFO) searchFlyoutOpen.set(false);
  
  // could be 'undefined' if a User hits up a dead URL
  if (tag && aT && aT[tag]) {
    currentTag.set(tag);
    updateHistory({ params: { tag: encodeURIComponent(tag) } });
  }
  // no note found, so update URL
  else updateHistory();
  
  loadingTaggedNotes.set(false);
}

export function getNoteBlurbs(notePaths) {
  const nG = getStoreValue(noteGroups);
  
  return notePaths.reduce((arr, path) => {
    const { note } = getNoteNode(nG, path);
    
    // in case something goes wrong updating paths, only return payloads for
    // notes that can be found.
    if (note) {
      const { content, title } = note;
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
      action: DATA_ACTION__MOVE,
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
    type === DATA_TYPE__GROUP
    && cN
    && cN.path.startsWith(`${path}/${id}/`)
  ) {
    updateCurrNote({ id: cN.id });
  }
  else updateCurrNote({ id });
}
