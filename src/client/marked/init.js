import tableOfContents from './extensions/tableOfContents';

// NOTE: When adding in support for a new lang, look in the source lang file for
// - (regex) `Prism\.languages\.[\w]+=` to find any `langAliases`.
// - `clone` and `extend`, to find any `langDeps`.
const langAliases = {
  atom: 'markup',
  html: 'markup',
  js: 'javascript',
  mathml: 'markup',
  py: 'python',
  rss: 'markup',
  sh: 'bash',
  ssml: 'markup',
  svg: 'markup',
  xml: 'markup',
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

function loadLangs() {
  if (window.langsTO) clearTimeout(window.langsTO);
  window.langsTO = setTimeout(() => {
    langs = deDupeArray(langs);
    langs = mapLangAliases(langs);
    langs = addLangDeps(langs);
    
    const langPromises = langs.reduce((arr, lang) => {
      if (!loadedLangs.includes(lang)) {
        arr.push(new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = `/js/vendor/prism/langs/prism-${lang}.min.js`;
          script.onload = () => {
            loadedLangs.push(lang);
            resolve(script.src);
          };
          document.head.appendChild(script);
        }));
      }
      
      return arr;
    }, []);
    
    if (langPromises.length) {
      Promise.all(langPromises).then(() => {
        window.Prism.highlightAll();
      });
    }
    else window.Prism.highlightAll();
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
  
  window.marked.setOptions({
    headerPrefix: 'header_',
    highlight: (code, lang) => {
      return (window.Prism.languages[lang])
        ? window.Prism.highlight(code, window.Prism.languages[lang], lang)
        : code;
    },
    renderer,
  });
  
  window.marked.use({
    extensions: [tableOfContents],
  });
}
