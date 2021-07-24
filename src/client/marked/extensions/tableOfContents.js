const NAME = 'tableOfContents';

module.exports = {
  name: NAME,
  level: 'inline',
  tokenizer(src) {
    const match = src.match(/^::TOC::$/);
    if (match) {
      const headings = this.tokens.reduce((arr, token) => {
        if (token.type === 'heading') arr.push(token);
        return arr;
      }, []);
      return {
        type: NAME,
        raw: match[0],
        headings,
        slugger: new window.marked.Slugger(),
      };
    }
  },
  renderer({ headings, slugger }) {
    let prevDepth = 1;
    const listItems = headings.map(({ depth, text }) => {
      const { headerIds, headerPrefix } = this.options;
      const wrapperStart = headerIds ? `<a href="#${headerPrefix}${slugger.slug(text)}">` : '';
      const wrapperEnd = headerIds ? `</a>` : '';
      const listStart = (depth > prevDepth)
        ? Array(depth - prevDepth).fill('<ul>').join('')
        : '';
      const listEnd = (depth < prevDepth)
        ? Array(prevDepth - depth).fill('</ul>').join('')
        : '';
      prevDepth = depth;
      return `${listStart}${listEnd}<li>${wrapperStart}${text}${wrapperEnd}</li>`;
    }).join('');
    
    return [
      '<div>',
      '  <b>Table of Contents</b>',
      '  <ul>',
      `    ${listItems}`,
      '  </ul>',
      '</div>',
    ].join('');
  },
};
