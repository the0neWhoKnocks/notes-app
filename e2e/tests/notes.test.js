context('Notes', () => {
  const E2E_FOLDER = '/repo/e2e';
  const PATH__CONSTANTS = `${E2E_FOLDER}/mnt/constants`;
  const PATH__DATA = `${E2E_FOLDER}/mnt/data`;
  const CREDS__USERNAME = 'user';
  const CREDS__PASSWORD = 'pass';
  let constants = {};
  
  const pad = (num, token='00') => token.substring(0, token.length-`${ num }`.length) + num;
  
  let screenshotNdx = 0;
  function screenshot(selectorOrEl, name) {
    let el = cy;
    screenshotNdx++;
    
    if (selectorOrEl) {
      el = (typeof selectorOrEl === 'string')
        ? cy.get(selectorOrEl, { timeout: 3000 })
        : selectorOrEl;
    }
    
    el.screenshot(`${ pad(screenshotNdx) }__${ name.replace(/\s/g, '-') }`);
  }
  
  function loadPage(path = '/') {
    cy.window().then((win) => {
      const { NAMESPACE__STORAGE__USER } = constants;
      
      if (
        win.localStorage[NAMESPACE__STORAGE__USER]
        || win.sessionStorage[NAMESPACE__STORAGE__USER]
      ) {
        cy.intercept({ method: 'POST', url: '/api/user/data' }).as('RESP__USER_DATA');
        cy.log('Alias added for User data');
      }
      else cy.log('No alias added for User data');
    });
    
    cy.log('[PAGE] start load');
    cy.visit(path);
    cy.log('[PAGE] loaded');
    
    cy.window().then((win) => {
      const { NAMESPACE__STORAGE__USER } = constants;
      
      if (
        win.localStorage[NAMESPACE__STORAGE__USER]
        || win.sessionStorage[NAMESPACE__STORAGE__USER]
      ) {
        // have to wait for user data, otherwise the tests execute too quickly and fail
        cy.log('Wait for User data');
        cy.wait('@RESP__USER_DATA');
      }
      else cy.log('Not waiting for User data');
    });
  }
  
  Cypress.Commands.add('login', (username, password, { label, overwrite } = {}) => {
    cy.get('.login-form').as('LOGIN');
    cy.get('@LOGIN').find('[name="username"]').type(`${overwrite ? '{selectall}' : ''}${CREDS__USERNAME}`);
    cy.get('@LOGIN').find('[name="password"]').type(`${overwrite ? '{selectall}' : ''}${CREDS__PASSWORD}`);
    if (label) screenshot(null, label);
    cy.get('@LOGIN').find('button[value="login"]').click();
  });
  
  before(() => {
    cy.task('require', PATH__CONSTANTS).then(data => {
      constants = data;
    });
    
    cy.exec(`rm -rf ${E2E_FOLDER}/cypress/downloads/*`, { log: true }).then(() => {
      console.log('[DELETED] Previous downloads');
    });
    
    cy.exec(`rm -rf ${E2E_FOLDER}/cypress/screenshots/*`, { log: true }).then(() => {
      console.log('[DELETED] Previous screenshots');
    });
    
    loadPage();
  });
  
  describe('init', () => {
    before(() => {
      cy.exec(`rm -rf ${PATH__DATA}/*`, { log: true }).then(() => {
        console.log('[DELETED] Previous app data');
      });
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
      cy.reload();
    });
    
    it('should have the correct title', () => {
      cy.get('title').contains('Notes');
    });
    
    it('should fill out config data', () => {
      cy.get('input[name="cipherKey"]').type('zeffer');
      cy.get('input[name="salt"]').type('pepper');
      screenshot(null, '[config] filled out');
      
      cy.get('button[value="create"]').click();
    });
    
    it('should create a new User', () => {
      cy.get('.login-form').as('LOGIN');
      cy.get('@LOGIN').find('button[value="create"]').click();
      
      cy.get('.create-form').as('CREATE');
      cy.get('@CREATE').find('[name="username"]').type(CREDS__USERNAME);
      cy.get('@CREATE').find('[name="password"]').type(CREDS__PASSWORD);
      cy.get('@CREATE').find('[name="passwordConfirmed"]').type(CREDS__PASSWORD);
      screenshot(null, '[create_user] filled out');
      cy.get('@CREATE').find('button[value="create"]').click();
      
      cy.get('.login-form').as('LOGIN');
      cy.login(CREDS__USERNAME, CREDS__PASSWORD, {
        label: '[login_user] incorrect creds filled out',
      });
      
      // going from create to login will persist what was entered, the doubling is expected
      cy.on('window:alert', (txt) => {
        expect(txt).to.contains(`An account for "${CREDS__USERNAME}${CREDS__USERNAME}" doesn't exist.`);
      });
      
      cy.login(CREDS__USERNAME, CREDS__PASSWORD, {
        label: '[login_user] filled out',
        overwrite: true,
      });
    });
    
    it('should display message when no notes exist', () => {
      cy.get('.start-msg').contains("Looks like you haven't added any notes yet.");
      cy.get('.start-msg button.notes-menu-btn').should('exist');
      cy.get('.start-msg button.import-btn').should('exist');
      screenshot(null, 'no notes msg');
    });
  });
  
  describe('Notes', () => {
    function getItemNav(type, selector, itemName) {
      const labelSelector = type === 'group' ? '.group__name-text' : '.item__label-text';
      const parentSelector = type === 'group' ? '.group' : '.item';
      
      cy.window().then((win) => {
        const _selector = `${selector} ${labelSelector}`;
        const el = win.document.querySelector(_selector);
        
        if (el && el.textContent === itemName) {
          cy.log(`${type} found via selector: '${_selector}'`);
          cy.get(_selector).first().contains(itemName)
            .parents(parentSelector)
            .find('.sub-nav').first()
            .as('SUB_NAV');
          cy.wrap(true).as('NAV_FOUND');
        }
        else {
          cy.log(`No ${type} found via selector: '${_selector}'`);
          cy.wrap(false).as('NAV_FOUND');
        }
      });
      
      return {
        delete: () => {
          cy.get('@NAV_FOUND').then((navFound) => {
            if (navFound) {
              const alias = type === 'group' ? 'RESP__DELETED_GROUP' : 'RESP__DELETED_NOTE';
              
              cy.intercept('POST', '/api/user/data/set', (req) => {
                const { action } = req.body;
                if (action === 'delete') req.alias = alias;
              });
              cy.get('@SUB_NAV').find('.modify-nav [title="Delete"]').first().click();
              cy.get('.delete-form__btm-nav').contains('Yes').click();
              cy.wait(`@${alias}`);
            }
            else cy.log('Skipping delete, no nav found');
          });
        },
        move: (moveToPath) => {
          cy.get('@NAV_FOUND').then((navFound) => {
            if (navFound) {
              const alias = type === 'group' ? 'RESP__MOVED_GROUP' : 'RESP__MOVED_NOTE';
              
              cy.intercept('POST', '/api/user/data/set', (req) => {
                const { action } = req.body;
                if (action === 'move') req.alias = alias;
              });
              cy.get('@SUB_NAV').find('.modify-nav [title="Move"]').first().click();
              cy.get('.move-to .group__name-text')
                .contains(moveToPath)
                .parents('.group__name')
                .find('.move-nav').contains('Here')
                .click();
              cy.get('.move-to__btm-nav').contains('Move').click();
              cy.wait(`@${alias}`);
              cy.get('.move-to').should('not.exist');
            }
            else cy.log('Skipping delete, no nav found');
          });
        },
      };
    }
    
    function setTopNavAliases() {
      cy.get('.top-nav .search-btn').as('TOP_NAV__SEARCH');
      cy.get('.top-nav .notes-menu-btn').as('TOP_NAV__NOTES');
      cy.get('.top-nav .user-nav .drop-down__toggle').as('TOP_NAV__USER');
    }
    
    Cypress.Commands.add('highlight', { prevSubject: true }, (subject, count) => {
      return cy.wrap(subject).then($el => {
        if (count < 0) $el[0].selectionStart += count;
        else $el[0].selectionEnd += count;
      });
    });
    
    Cypress.Commands.add('deleteGroup', (selector, groupName) => {
      getItemNav('group', selector, groupName).delete();
    });
    Cypress.Commands.add('deleteNote', (selector, noteName) => {
      getItemNav('note', selector, noteName).delete();
    });
    
    Cypress.Commands.add('moveNote', (selector, noteName, moveToPath) => {
      getItemNav('note', selector, noteName).move(moveToPath);
    });
    
    const GROUP_NAME = 'Test Group';
    const NOTE_NAME = 'Full Test Note';
    
    beforeEach(() => {
      // sometimes a test can be isolated, and a login may be required
      cy.window().then((win) => {
        if (win.document.querySelector('.login-form')) {
          cy.log('Login prompted');
          cy.login(CREDS__USERNAME, CREDS__PASSWORD);
        }
        else cy.log('No Login prompted');
      });
      
      setTopNavAliases();
    });
    
    it('should add full test note', () => {
      cy.get('@TOP_NAV__NOTES').click();
      
      // reset data
      cy.deleteNote('.item', NOTE_NAME);
      
      cy.get('.flyout .sub-nav button[title="Add Note"]').first().click();
      
      cy.get('.note-form').as('FORM');
      cy.get('@FORM').find('.note-form__toolbar').as('TOOLBAR');
      cy.get('@FORM').find('.note-form__content').as('CONTENT');
      cy.get('@TOOLBAR').find('button[data-type="heading"]').as('WYSIWYG_BTN__HEADING');
      cy.get('@TOOLBAR').find('button[data-type="bold"]').as('WYSIWYG_BTN__BOLD');
      cy.get('@TOOLBAR').find('button[data-type="italic"]').as('WYSIWYG_BTN__ITALIC');
      cy.get('@TOOLBAR').find('button[data-type="strikethrough"]').as('WYSIWYG_BTN__STRIKE');
      cy.get('@TOOLBAR').find('button[data-type="strikethrough"]').as('WYSIWYG_BTN__STRIKE');
      cy.get('@TOOLBAR').find('button[data-type="inlineCode"]').as('WYSIWYG_BTN__CODE');
      cy.get('@TOOLBAR').find('button[data-type="anchor"]').as('WYSIWYG_BTN__LINK');
      cy.get('@TOOLBAR').find('button[data-type="ul"]').as('WYSIWYG_BTN__UL');
      cy.get('@TOOLBAR').find('button[data-type="ol"]').as('WYSIWYG_BTN__OL');
      cy.get('@TOOLBAR').find('button[data-type="indent"]').as('WYSIWYG_BTN__INDENT');
      cy.get('@TOOLBAR').find('button[data-type="blockquote"]').as('WYSIWYG_BTN__QUOTE');
      cy.get('@TOOLBAR').find('button[data-type="toc"]').as('WYSIWYG_BTN__TOC');
      cy.get('@TOOLBAR').find('button[data-type="preview"]').as('WYSIWYG_BTN__PREVIEW');
      
      cy.get('@FORM').find('[name="title"]').type(NOTE_NAME);
      cy.get('@FORM').find('.query').contains('?note=root%2Ffull-test-note');
      
      cy.get('@FORM').find('.tags-input__input').type('test{enter}');
      
      cy.get('@CONTENT').type(' {selectall}{backspace}');
      cy.get('@WYSIWYG_BTN__TOC').click();
      cy.get('@CONTENT').type('{enter}{enter}');
      cy.get('@WYSIWYG_BTN__HEADING').click();
      cy.get('@CONTENT').type('Section 1{enter}');
      cy.get('@WYSIWYG_BTN__HEADING').click().click();
      cy.get('@CONTENT').type('Section 1.a{enter}');
      cy.get('@WYSIWYG_BTN__HEADING').click().click().click();
      cy.get('@CONTENT').type('Section 1.a.1{enter}');
      cy.get('@WYSIWYG_BTN__HEADING').click();
      cy.get('@CONTENT').type('Section 2{enter}{enter}');
      cy.get('@CONTENT').type('---{enter}{enter}');
      cy.get('@CONTENT').type('Bold text').highlight(-4);
      cy.get('@WYSIWYG_BTN__BOLD').click();
      cy.get('@CONTENT').type('{end}{enter}{enter}Italic text').highlight(-4);
      cy.get('@WYSIWYG_BTN__ITALIC').click();
      cy.get('@CONTENT').type('{end}{enter}{enter}Strikethrough text').highlight(-4);
      cy.get('@WYSIWYG_BTN__STRIKE').click();
      cy.get('@CONTENT').type('{end}{enter}{enter}Inline code').highlight(-4);
      cy.get('@WYSIWYG_BTN__CODE').click();
      cy.get('@CONTENT').type('{end}{enter}{enter}A link').highlight(-6);
      cy.get('@WYSIWYG_BTN__LINK').click();
      cy.get('#Y2xpX3VybA').type('/relative/path');
      cy.get('.dialog__body button').contains('Add').click();
      cy.get('@CONTENT').scrollTo('bottom');
      
      cy.get('@CONTENT').type('{end}{enter}{enter}Some random test text to test search.{enter}{enter}');
      cy.get('@CONTENT').scrollTo('bottom');
      
      cy.get('@WYSIWYG_BTN__UL').click();
      cy.get('@CONTENT').type('{end}unordered{enter}unordered{enter}{enter}');
      cy.get('@WYSIWYG_BTN__OL').click();
      cy.get('@CONTENT').type('{end}ordered{enter}ordered{enter}{enter}');
      cy.get('@WYSIWYG_BTN__UL').click();
      cy.get('@CONTENT').type('{end}parent{enter}');
      cy.get('@WYSIWYG_BTN__UL').click(); // remove list formatting
      cy.get('@WYSIWYG_BTN__INDENT').click();
      cy.get('@WYSIWYG_BTN__OL').click();
      cy.get('@CONTENT').type('{end}child{enter}child{enter}{enter}');
      cy.get('@CONTENT').scrollTo('bottom');
      
      cy.get('@CONTENT').type('```{enter}// no lang specified{enter}blah{enter}```{enter}');
      cy.get('@CONTENT').type('```html{enter}<!-- comment -->{enter}<div att="val">{enter}  <span>blah</span>{enter}</div>{enter}```{enter}');
      cy.get('@CONTENT').type('```js{enter}// code block{enter}var x = \'y\';{enter}```{enter}{enter}');
      cy.get('@CONTENT').scrollTo('bottom');
      
      cy.get('@WYSIWYG_BTN__QUOTE').click();
      cy.get('@CONTENT').type('block  {enter}');
      cy.get('@WYSIWYG_BTN__QUOTE').click();
      cy.get('@CONTENT').type('quote{enter}');
      cy.get('@CONTENT').scrollTo('bottom');
      
      cy.get('@WYSIWYG_BTN__PREVIEW').click();
      screenshot(null, 'previewing note');
      cy.get('@WYSIWYG_BTN__PREVIEW').click();
      
      cy.get('@FORM').find('button').contains('Save').click();
      
      cy.get('.notes-nav .tags').as('TAGS');
      cy.get('@TAGS').find('.notes-nav-items-toggle__btn').click();
      cy.get('@TAGS').find('.notes-nav-items-toggle__items .tag')
        .should('have.length', 1)
        .should('have.attr', 'href', '?tag=test');
        
      cy.get('.group-list.is--root > .item .item__label')
        .should('have.length', 1)
        .should('have.attr', 'href', '?note=root%2Ffull-test-note');
        
      cy.get('.flyout__close-btn').click();
    });
    
    it('should add group', () => {
      cy.get('@TOP_NAV__NOTES').click();
      
      // reset test data
      cy.deleteGroup('.group', GROUP_NAME);
      
      cy.get('.flyout .sub-nav button[title="Add Group"]').first().click();
      cy.get('#Y2xpX25hbWU').type(GROUP_NAME);
      cy.get('.query').contains('?note=root%2Ftest-group');
      cy.get('.group-form__btm-nav button').contains('Save').click();
      
      cy.get('.group__name-text')
        .should('have.length', 1)
        .contains('Test Group');
        
      cy.get('.flyout__close-btn').click();
    });
  
    it('should move Note to Group', () => {
      cy.get('@TOP_NAV__NOTES').click();
      
      // move note, verify the number of notes in the group is displayed
      cy.moveNote('.item', NOTE_NAME, GROUP_NAME);
      cy.get('.group__name-text').first().invoke('text').should('eq', `(1) ${GROUP_NAME}`);
      
      // open group to execute actions on note
      cy.get('.group').first().click();
      
      // verify query preview maintains group path(s)
      cy.get('.group .item [title="Edit"]').click();
      cy.get('.note-form .query').invoke('text').should('eq', '?note=root%2Ftest-group%2Ffull-test-note');
      cy.get('.note-form [name="title"]').type(' update');
      cy.get('.note-form .query').invoke('text').should('eq', '?note=root%2Ftest-group%2Ffull-test-note-update');
      cy.get('.note-form__btm-nav button').contains('Cancel').click();
      
      // move the note back to the root
      cy.moveNote('.item', NOTE_NAME, '/');
      cy.get('.group__name-text').first().invoke('text').should('eq', GROUP_NAME);
      
      cy.get('.flyout__close-btn').click();
    });
  
    it('should display a list of related Search results', () => {
      cy.get('@TOP_NAV__SEARCH').click();
      cy.get('.search__input-wrapper input').type('test{enter}');
      cy.get('.search-result')
        .should('have.length', 3)
        .then((els) => {
          expect(els[0].dataset.tag).to.equal('test');
          expect(els[0].querySelector('.search-result__title').innerHTML).to.equal('<mark>test</mark>');
          
          expect(els[1].dataset.path).to.equal('root/full-test-note');
          expect(els[1].querySelector('.search-result__title').innerHTML).to.equal('Full <mark>Test</mark> Note');
          expect(els[1].querySelector('.search-result__content').innerHTML).to.equal('me random <mark>test</mark> text to t ... t text to <mark>test</mark> search.\n\n');
          
          expect(els[2].dataset.path).to.equal('root/test-group');
          expect(els[2].disabled).to.be.true;
          expect(els[2].querySelector('.search-result__title').innerHTML).to.equal('<mark>Test</mark> Group');
        });
      screenshot(null, 'search results');
      
      cy.get('.flyout__close-btn').click();
    });
  
    it('should export and import User data', () => {
      const PATH__DOWNLOADS = Cypress.config('downloadsFolder');
      
      cy.get('@TOP_NAV__USER').click();
      cy.get('.user-nav button').contains('Export').click();
      
      cy.wait(1000); // eslint-disable-line
      cy.exec(`ls ${PATH__DOWNLOADS}/`).then(({ stdout }) => {
        const BACKUP_FILE = `${PATH__DOWNLOADS}/${stdout}`;
        
        cy.readFile(BACKUP_FILE, 'utf8').then(data => {
          cy.wrap(data).as('EXPORTED_DATA');
        });
        
        cy.exec(`rm -rf ${PATH__DATA}/data_*.json`, { log: true }).then(() => {
          console.log('[DELETED] Previous app data');
        });
        cy.reload();
        setTopNavAliases();
        
        cy.get('.start-msg').should('exist');
        
        cy.get('@TOP_NAV__USER').click();
        cy.get('.user-nav button').contains('Import').click();
        cy.get('#tmpFileInput').selectFile(BACKUP_FILE, { force: true });
        
        cy.get('.start-msg').should('not.exist');
      });
    });
  });
});

