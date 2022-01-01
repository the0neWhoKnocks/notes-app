# TODO
---

- [ ] Normalize how the query params are displayed in the GroupDialog, and NoteDialog.
- [ ] recently viewed
  - [ ] max 10 items
  - [ ] add currently opened to beginning of list, if it already exists, move it to front
  - [ ] display a column list in the main area on load, or after note is closed 
- [ ] search button opens flyout with input and results list
- [ ] For the SW, have it check the App name, if it's registered and it doesn't match, unregister itself so it doesn't try to run for other Apps while I'm working on localhost.
  - https://love2dev.com/blog/how-to-uninstall-a-service-worker/
- [ ] Support https cuz of login and service worker

In order to ensure all assets are cached, refactor how scripts and styles are
loaded into the shell. Use something like
```
// on Server (Shell model)
head: {
  scripts: [],
  styles: [],
},
body: {
  asyncScripts: [ // only needed for SW
    // scrape all lang files
  ],
  scripts: [],
  styles: [],
}
```

Views:
  - **Offline** - SW will need to have been registered, and cached the Apps assets.
    May have to push some sort of inlined `script` with an Array of all the
    possible MD langs so that they can be cached.
    - Not logged in
      - Display login modal
        - Since the Server can't be hit up to check credentials, will have to
          look at what's cached, and see if the credentials match something
          that's already been cached. If nothing exists, let the User know `No
          offline data exists for that User`.
          - While online, store the User's name but encrypted by their password.
            Then when checking for User data, iterate some Users DB in IndexedDB
            and see if any of the decrypted User names match what was entered by
            the User.
    - Logged in
      - Existing notes
        - Check if any exist in the cache, and use those
      - New notes
        - Submit to DB
          - Once online again, save data from DB, delete DB data.
  - **Online**
    - Logged in
      - Existing notes
        - First check if there are any saved-while-offline files.
          - If there are, display some sort of `Adding notes that were saved
            while offline` message.
          - Send off individual updates for each message. That way if something
            goes wrong with one note it can be addressed individually.
            - After each note is added, delete the entry in the offline DB, that
              way, if something does go wrong, things can pick up where they
              were left off if a page refresh is required.

Features:
  - The ability to Import/Export notes as a zip of folders and .md files or
    maybe as just JSON.

- [ ] Cache URLs after claim instead of refresh of page?
  - https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#activate
- [ ] In `fetch`, only log if offline `console.log(request.url);`
  - https://stackoverflow.com/a/46098981/5156659
- [ ] Cache POST requests
  - https://stackoverflow.com/a/52223285/5156659
- [ ] Diff the URLs in the cache, and only cache new items. So remove `await caches.delete(CACHE_KEY);`
- [ ] Serve all SW files from a nested public folder (instead of root)
  - https://medium.com/dev-channel/two-http-headers-related-to-service-workers-you-never-may-have-heard-of-c8862f76cc60
  - https://stackoverflow.com/a/35415127/5156659
    - May have to have a specific route for the `sw.js` file, that has the
      `static` middleware applied to it.
    - Will have to re-point WP asset for `register`
    - Will have to update prep-dist
- [ ] Disable `Create Account` when offline
- [ ] While offline, use the cached user data as a base. Then if a user modifies
  that data while offline, store the changes in something like `updatedData`.
  Then when back online, those changes can be added in, and `updatedData` can
  be cleared out.
- [ ] If Server request failed, check if offline data exists, use it, but inform
  the User that they're viewing possibly stale data.
- [ ] Check what happens if Groups or Notes have dots or slashes in the title
- [ ] After preferences are updated via an Offline update, or Import, a check
  needs to happen to verify the theme file is loaded.

---

## Notes

- All module imports within a SW are based on the root of your public static
  folder. So if you have files in a nested directory that access one another, you
  can't have `./file.js`, instead you have to have something like `/js/nested_path/file.js`.

- https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- https://developers.google.com/web/fundamentals/codelabs/offline
- https://developers.google.com/web/ilt/pwa/live-data-in-the-service-worker#using_indexeddb_and_the_cache_interface
- https://dev.to/halan/4-ways-of-symmetric-cryptography-and-javascript-how-to-aes-with-javascript-3o1b
encryption:
- https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto#methods
- https://github.com/bradyjoslin/webcrypto-example/blob/master/script.js
  - https://bradyjoslin.com/blog/encryption-webcrypto/

sw
- Stuff I wish I'd known sooner about service workers https://gist.github.com/Rich-Harris/fd6c3c73e6e707e312d7c5d7d0f3b2f9
- Possible fix for stalled SW install (while in Dev) https://stackoverflow.com/questions/63675460/chrome-85-service-worker-stuck-on-trying-to-install

indexedDB
- https://github.com/jakearchibald/svgomg/blob/master/src/js/utils/storage.js#L5
- https://medium.com/jspoint/indexeddb-your-second-step-towards-progressive-web-apps-pwa-dcbcd6cc2076
