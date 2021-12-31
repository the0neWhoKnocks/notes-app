const NAME = 'tableOfContents';

module.exports = {
  name: NAME,
  level: 'inline',
  tokenizer(src) {
    const match = src.match(/^::TOC::$/);
    if (match) {
      // find all headings for later mapping
      const headings = this.lexer.tokens.reduce((arr, token) => {
        if (token.type === 'heading') arr.push(token);
        return arr;
      }, []);
      
      // replace any current TOC tokens with TOC token
      this.lexer.tokens.forEach((token, ndx) => {
        if (
          token.type === 'paragraph'
          && token.raw === '::TOC::'
        ) {
          this.lexer.tokens[ndx] = {
            headings,
            raw: match[0],
            slugger: new window.marked.Slugger(),
            type: NAME,
          };
        }
      });
    }
  },
  renderer({ headings, slugger }) {
    let prevDepth = 1;
    const listItems = headings.map(({ depth, text }) => {
      const { headerIds, headerPrefix } = this.parser.options;
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
