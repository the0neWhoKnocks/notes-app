# TODO
---

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

indexedDB
- https://github.com/jakearchibald/svgomg/blob/master/src/js/utils/storage.js#L5
- https://medium.com/jspoint/indexeddb-your-second-step-towards-progressive-web-apps-pwa-dcbcd6cc2076
