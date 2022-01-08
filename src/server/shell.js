const {
  APP__TITLE,
  DOM__SVELTE_MOUNT_POINT,
} = require('../constants');

const buildNodes = (arr, template) => {
  return arr.map(asset => {
    let url = asset;
    let attrs = '';
    if (typeof asset === 'object') {
      url = asset.url;
      attrs = Object.keys(asset.attrs).map(attr => `${attr}="${asset.attrs[attr]}"`).join(' ');
    }
    return template
      .replace('[url]', url)
      .replace('[attrs]', attrs);
  });
};

const addNodes = (type, arr) => {
  let _arr = [];
  
  switch (type) {
    case 'link': {
      _arr = buildNodes(arr, '<link rel="stylesheet" href="[url]" [attrs]>');
      break;
    }
    case 'script': {
      _arr = buildNodes(arr, '<script src="[url]" [attrs]></script>');
      break;
    }
  }
  
  return _arr.join('\n');
};

// window.sw = {
//   assetsToCache: ${
//     JSON.stringify(
//       [
//         '/',
//         ...head.styles,
//         ...body.styles,
//         ...body.asyncStyles,
//         ...head.scripts,
//         ...body.scripts,
//         ...body.asyncScripts,
//       ]
//       .map(asset => {
//         return (typeof asset === 'object') ? asset.url : asset;
//       })
//     )
//   },
// };

const shell = ({
  body,
  head,
  props,
} = {}) => {
  return `
    <!doctype html>
    <html lang="en">
    <head>
      <title>${APP__TITLE}</title>

      <meta charset="utf-8">
      <meta name="viewport" content="initial-scale=1.0, width=device-width">
      
      <style>
        *, *::after, *::before {
          box-sizing: border-box;
        }

        html, body {
          width: 100vw;
          height: 100vh;
          padding: 0;
          margin: 0;
        }

        body {
          color: #333;
          font-family: Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        h1, h2, h3, h4, h5, h6 {
          margin: 0 0 0.5em 0;
          font-weight: 400;
          line-height: 1.2;
        }

        h1 {
          font-size: 2em;
        }

        a {
          color: inherit;
        }
        
        blockquote {
          padding: 0.5em;
          border-left: solid 4px;
          margin: 0;
          background: rgba(255, 255, 255, 0.15);
        }
        
        ol, ul {
          padding-left: 0;
          margin-left: 1em;
        }
        li {
          margin: 0.25em 0;
        }

        pre > code {
          display: block;
        }
        pre[data-lang] {
          position: relative;
        }
        pre[data-lang]::after {
          content: '[' attr(data-lang) ']';
          opacity: 0.5;
          position: absolute;
          top: 0.1em;
          right: 0.5em;
        }
        .app :not(pre) > code[class*="language-"] {          
          padding: 0.2em 0.4em;
        }
        .app .code-toolbar {
          margin: .5em 0;
          display: flex;
          flex-direction: column-reverse;
        }
        .app .code-toolbar > pre {
          margin: 0;
        }
        .app .code-toolbar > .toolbar {
          background: #0000004a;
          display: flex;
          justify-content: flex-end;
          opacity: 1;
          position: relative;
          top: 0;
          right: 0;
        }
        .app .code-toolbar > .toolbar > .toolbar-item > button {
          font-family: revert;
          padding: 0.35em 0.75em;
          border-radius: unset;
          box-shadow: none;
          background: transparent;
        }

        button {
          font-size: 1em;
          padding: 0.5em;
          display: block;
        }
        button:not(:disabled) {
          cursor: pointer;
        }

        input {
          font-size: 1em;
        }
        input[type="text"] {
          padding: 0.25em;
        }
        
        form > *:not(:last-child) {
          margin-bottom: 1em;
        }

        p {
          margin: 0;
        }
        p:not(:last-child) {
          margin-bottom: 1em;
        }

        q {
          color: #501600;
          font-style: italic;
          font-family: serif;
          font-weight: bold;
          padding: 0 0.5em;
          border-radius: 0.25em;
          background: #ffeb00;
          display: inline-block;
        }

        .loading-msg {
          width: 100%;
          height: 100%;
          padding: 2em;
          display: flex;
          justify-content: center;
          align-items: center;
          animation-name: showMsg;
          animation-duration: 300ms;
          animation-delay: 300ms;
          animation-fill-mode: both;
        }
        body.no-js .loading-msg .msg,
        body.view-loaded .loading-msg,
        body:not(.view-loaded) #${DOM__SVELTE_MOUNT_POINT} {
          display: none;
        }

        .root,
        #${DOM__SVELTE_MOUNT_POINT} {
          width: 100%;
          height: 100%;
        }
      </style>
      ${addNodes('link', head.styles)}

      <script>
        window.app = {
          props: ${JSON.stringify(props || {})},
        };
      </script>
      ${addNodes('script', head.scripts)}
    </head>
    <body class="no-js line-numbers">
      <svg style="display:none; position:absolute" width="0" height="0">
        <symbol id="asterisk" viewBox="0 0 32.275391 30.46875" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 14.355469l2.2460938-6.933594c5.1757707 1.8229802 8.9355322 3.401755 11.2792972 4.736328C12.906885 6.2663426 12.581365 2.2136123 12.548828 0h7.080078c-.09768 3.2227258-.472027 7.2591801-1.123047 12.109375 3.35284-1.692646 7.193982-3.2551444 11.523438-4.6875l2.246094 6.933594c-4.134146 1.367244-8.186877 2.278702-12.158204 2.734375 1.985652 1.725314 4.785129 4.801483 8.398438 9.228515L22.65625 30.46875c-1.888045-2.57157-4.11786-6.070915-6.689453-10.498047-2.408871 4.589892-4.524754 8.089238-6.3476564 10.498047l-5.7617187-4.150391c3.7760309-4.654896 6.4778511-7.731065 8.1054691-9.228515C7.763661 16.276098 3.7760348 15.364641 0 14.355469" font-family="arial" font-size="100"/>
        </symbol>
        <symbol id="user" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
          <circle cx="300" cy="300" r="265" fill="none" stroke="currentColor" stroke-width="30" />
          <circle cx="300" cy="230" r="115" />
          <path d="M106.819 481.4c37.887-106.691 155.09-162.469 261.781-124.582 58.165 20.654 103.927 66.417 124.582 124.582 0 0-61.682 83.6-193.182 83.6s-193.181-83.6-193.181-83.6z" />
        </symbol>
        <symbol id="angle-up" viewBox="0 0 10 5" xmlns="http://www.w3.org/2000/svg">
          <polyline points="0,5 5,0 10,5" fill="none" stroke="currentColor" />
        </symbol>
        <symbol id="angle-down" viewBox="0 0 10 5" xmlns="http://www.w3.org/2000/svg">
          <polyline points="0,0 5,5 10,0" fill="none" stroke="currentColor" />
        </symbol>
        <symbol
          id="menu"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <polyline points="2,4 18,4" />
          <polyline points="2,10 18,10" />
          <polyline points="2,16 18,16" />
        </symbol>
        <symbol id="theme" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="70" cy="30" r="30" fill="rgba(255,255,255,0.75)"></circle>
          <circle cx="70" cy="70" r="30" fill="rgba(255,255,255,0.5)"></circle>
          <circle cx="30" cy="50" r="30" fill="rgba(255,255,255,0.25)"></circle>
        </symbol>
        <symbol
          id="search"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
        >
          <circle cx="60" cy="38" r="30" fill="none"></circle>
          <polyline points="82,75 92,92"></polyline>
        </symbol>
        <symbol
          id="folder"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          fill="var(--color--folder--fill, yellow)"
          stroke="#000"
          stroke-width="1"
          stroke-linecap="round"
        >
          <!-- folder body -->
          <polygon points="1,5 2,5 3,3 10,3 12,5 19,5 19,18 1,18 1,5"></polygon>
          <!-- dividing line -->
          <polyline points="1,7 2,7 3,8 9,8 10,7, 19,7" fill="none"></polyline>
        </symbol>
        <symbol
          id="file"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          fill="var(--color--file--fill, #fff)"
          stroke="#000"
          stroke-width="1"
          stroke-linecap="round"
        >
          <!-- file body -->
          <polygon points="2,1 13,1 18,5 18,19 2,19, 2,1"></polygon>
          <!-- file bend -->
          <polyline points="13,1 13,5 18,5" fill="none"></polyline>
        </symbol>
        <symbol
          id="eye"
          viewBox="0 0 16 10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m 15.867135,4.8835356 c 0,0 -1.756271,4.7109178 -7.8671444,4.7225358 -6.1108726,0.01162 -7.86714413,-4.7225358 -7.86714413,-4.7225358 0,0 1.70068753,-4.7225356 7.86714413,-4.7225356 6.1664564,0 7.8671444,4.7225356 7.8671444,4.7225356 z"
            style="fill:none;stroke:#000000;stroke-width:0.5;stroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;paint-order:stroke fill markers"
          />
          <circle
            cx="50%" cy="50%" r="4.2194657"
            style="fill:none;stroke:#000000;stroke-width:0.75;stroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;paint-order:stroke fill markers"
          />
          <circle
            cx="50%" cy="50%" r="2.75"
            style="fill:#000000;stroke:nonestroke-linecap:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;paint-order:stroke fill markers"
          />
        </symbol>
      </svg>
      <script>
        document.body.classList.remove('no-js');
      </script>
      
      <div class="root">
        <div class="loading-msg">
          <span class="msg">Loading...</span>
          <noscript>
            This App requires Javascript. You'll have to enable it in order to proceed.
          </noscript>
        </div>
        <div id="${DOM__SVELTE_MOUNT_POINT}"></div>
        <div id=overlays></div>
      </div>
      
      ${addNodes('link', body.styles)}
      ${addNodes('script', body.scripts)}
    </body>
    </html>
  `;
};

module.exports = shell;
