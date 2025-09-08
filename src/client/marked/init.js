import tableOfContents from './extensions/tableOfContents';

// NOTE: When adding in support for a new lang, look in the source lang file 
// (prismjs/components/prism-<lang>.js) for:
// - (regex) `Prism\.languages\.[\w]+=` to find any `langAliases`.
// - `clone` and `extend`, to find any `langDeps`.
const langAliases = {
  atom: 'markup',
  env: 'nix',
  html: 'markup',
  js: 'javascript',
  mathml: 'markup',
  py: 'python',
  rss: 'markup',
  sh: 'bash',
  ssml: 'markup',
  svg: 'markup',
  xml: 'markup',
  yml: 'yaml',
};
const langDeps = {
  arduino: ['cpp'],
  c: ['clike'],
  cpp: ['c'],
  groovy: ['clike'],
  javascript: ['clike'],
  jsdoc: ['javadoclike'],
  json5: ['json'],
  jsonp: ['json'],
  jsx: ['javascript', 'markup'],
  markdown: ['markup'],
};
const loadedLangs = [];
let langs = [];

function deDupeArray(arr) {
  return arr.reduce((_arr, item) => {
    if (!_arr.includes(item)) _arr.push(item);
    return _arr;
  }, []);
}

function mapLangAliases(arr) {
  return arr.map(lang => langAliases[lang] || lang);
}

function addLangDeps(arr) {
  return arr.reduce((_arr, lang) => {
    if (langDeps[lang]) _arr.push(...addLangDeps(langDeps[lang]));
    _arr.push(lang);
    return _arr;
  }, []);
}

function highlightCode() {
  // Sometimes the aliases get auto-assigned and sometimes they're left blank.
  // This ensures that they get assigned.
  Object.entries(langAliases).forEach(([ alias, lang ]) => {
    if (
      // since the langs are lazy loaded, only assign after the lang exists
      window.Prism.languages[lang]
      // if the alias was already assigned, leave it alone
      && !window.Prism.languages[alias]
    ) {
      window.Prism.languages[alias] = window.Prism.languages[lang];
    }
  });
  
  const noteEl = (window.previewingNote)
    ? document.getElementById('notePreview')
    : document.getElementById('note');
  window.Prism.highlightAllUnder(noteEl);
}

function loadLangs() {
  if (window.langsTO) clearTimeout(window.langsTO);
  window.langsTO = setTimeout(async () => {
    langs = deDupeArray(langs);
    langs = mapLangAliases(langs);
    langs = addLangDeps(langs);
    
    const langPromises = langs.reduce((arr, lang) => {
      if (!loadedLangs.includes(lang)) {
        arr.push(new Promise((resolve) => {
          // NOTE: If the User enters an unsupported lang, the load will fail
          // leaving an unresolved Promise. So no matter what, resolve the
          // attempt of a load.
          try {
            const script = document.createElement('script');
            script.src = `/js/vendor/prism/langs/prism-${lang}.min.js`;
            script.onload = () => {
              loadedLangs.push(lang);
              resolve(script.src);
            };
            script.onerror = () => { resolve(); };
            document.head.appendChild(script);
          }
          catch (err) { resolve(); }
        }));
      }
      
      return arr;
    }, []);
    
    if (langPromises.length) {
      await Promise.all(langPromises).then(() => {
        highlightCode();
      });
    }
    else highlightCode();
    
    langs = [];
  }, 100);
}

export default function init() {
  const renderer = new window.marked.Renderer();
  // NOTE:
  // - Custom `code` renderer is needed to apply the `language` class to the
  //   parent `pre` for `prism`.
  // - https://github.com/markedjs/marked/blob/af14068b99618242c9dee6147ea3432f7903322e/src/Renderer.js
  //   Rendering with the original functions since there's extra logic in there
  //   I don't want to duplicate.
  // - Even if no `language` is specified, the class `language-` needs to be
  //   add so that base Prism styles kick in.
  const origCodeBlockFn = renderer.code;
  const origInlineCodeFn = renderer.codespan;
  
  renderer.code = (code, language, escaped) => {
    const lang = language || 'none';
    const rendered = origCodeBlockFn.call(renderer, code, lang, escaped);
    const dataAttr = language ? `data-lang="${lang}"` : '';
    
    if (lang !== 'none') langs.push(lang);
    loadLangs();
    
    return rendered.replace(/^<pre/, `<pre class="language-${lang}" ${dataAttr}`);
  };
  
  renderer.codespan = (code, language, escaped) => {
    const lang = language || 'none';
    const rendered = origInlineCodeFn.call(renderer, code, lang, escaped);
    return rendered.replace(/^<code/, `<code class="language-${lang}"`);
  };
  
  window.Prism.hooks.add('complete', (env) => {
    const el = env.element.parentNode.parentNode;
    
    if (!el.classList.contains('code-toolbar')) return;
    
    // NOTE: This is dependant on the Toolbar plugin wrapping everything in the
    // `.code-toolbar` el. Without it, I can't absolutely position the lang and
    // line numbers.
    
    const codeEl = env.element;
    const preEl = codeEl.parentNode;
    const toolbar = el;
    const lineNumsEl = codeEl.querySelector('.line-numbers-rows');
    
    if (preEl.dataset.lang) toolbar.setAttribute('data-lang', preEl.dataset.lang);
    
    if (lineNumsEl) {
      toolbar.appendChild(lineNumsEl);
    }
  });
  
  // https://marked.js.org/using_advanced#options
  window.marked.setOptions({
    headerPrefix: 'header_',
    renderer,
  });
  
  window.marked.use({
    extensions: [tableOfContents],
  });
}
