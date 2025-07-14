import {
  BASE_DATA_NODE,
  DATA_ACTION__EDIT,
  DATA_ACTION__IMPORT,
  DATA_TYPE__ALL,
  DATA_TYPE__PREFS,
} from '@src/constants';
import {
  CREDS__PASS,
  CREDS__USER,
  PATH__DATA,
  expect,
  test,
} from './fixtures/AppFixture';

const SELECTOR__FLYOUT__CLOSE_BTN = '.flyout__close-btn';
const SELECTOR__START_MSG = '.start-msg';

test.describe.configure({ mode: 'serial' }); // Required to stop tests on failure.

test.describe('Init', () => {
  
  test('Fill out config data', async ({ app }) => {
    await app.exec(`rm -rf ${PATH__DATA}/*`);
    await app.loadPage();
    await app.clearStorage();
    
    await app.loadPage();
    await app.createConfig();
  });
  
  test('Create a New User and Log In', async ({ app }) => {
    await app.loadPage();
    
    await app.createUser({ user: CREDS__USER, pass: CREDS__PASS });
    // going from create to login will persist what was entered, the doubling is expected
    await app.validateAlert(
      `An account for "${CREDS__USER}${CREDS__USER}" doesn't exist.`,
      async () => {
        await app.logIn({
          user: CREDS__USER,
          pass: CREDS__PASS,
          screenshot: '[login_user] incorrect creds filled out',
          willFail: true,
        });
      }
    );
    
    await app.logIn({
      user: CREDS__USER,
      pass: CREDS__PASS,
      overwrite: true,
      screenshot: '[login_user] filled out',
    });
  });
  
  test('Display Message When No Notes Exist', async ({ app }) => {
    await app.loadPage();
    await app.logIn();
    
    const startMsg = app.getElBySelector(SELECTOR__START_MSG);
    await expect(startMsg).toContainText("Looks like you haven't added any notes yet.");
    await expect(startMsg.locator('button.notes-menu-btn')).toBeAttached();
    await expect(startMsg.locator('button.import-btn')).toBeAttached();
    await app.screenshot('no notes msg');
  });
});

test.describe('Notes', () => {
  const GROUP_NAME = 'Test Group';
  const NOTE_NAME = 'Full Test Note';
  let note, notesBtn, search, searchBtn, themeBtn, userBtn;
  let cancelBtn, content, deleteDraftBtn, form, saveBtn, title, toolbar,
    wysiwygBoldBtn, wysiwygCodeBlockBtn, wysiwygCodeBtn, wysiwygHRBtn,
    wysiwygIndentBtn, wysiwygItalicBtn, wysiwygLinkBtn, wysiwygOLBtn,
    wysiwygPreviewBtn, wysiwygQuoteBtn, wysiwygStrikeBtn, wysiwygTOCBtn,
    wysiwygTableBtn, wysiwygULBtn, wysiwygWrapBtn, wysiwygHeadingBtn;
  
  async function highlight(loc, count) {
    await loc.evaluate((el, _count) => {
      if (_count < 0) el.selectionStart += _count;
      else el.selectionEnd += _count;
    }, count);
  }
  
  async function scrollToBottom(loc) {
    await loc.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }
  
  async function typeStuff(loc, txt) {
    const parts = txt.split(/(\{[^}]+\})/).filter((str) => !!str);
    const keyReg = /^\{([^}]+)\}$/;
    
    for (let t of parts) {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (keyReg.test(t)) {
        const [ , key ] = t.match(keyReg);
        await loc.press(key);
      }
      else await loc.type(t);
    }
  }
  
  test.beforeEach(async ({ app }) => {
    await app.loadPage();
    await app.logIn();
    
    notesBtn = app.getElBySelector('.top-nav .notes-menu-btn');
    searchBtn = app.getElBySelector('.top-nav .search-btn');
    themeBtn = app.getElBySelector('.top-nav :text-is("Theme")');
    userBtn = app.getElBySelector('.top-nav .user-nav .drop-down__toggle');
    
    note = {
      async clickAdd() {
        if ( !(await app.getElBySelector('.flyout .notes').count()) ) {
          await this.openNotesFlyout();
        }
        await app.getElBySelector('.flyout .notes > .sub-nav button[title="Add Note"]').click();
        this.setUpLocs();
      },
      async openNotesFlyout() {
        await notesBtn.click();
        await expect(app.getElBySelector('[flyout-for="notesNav"]')).toBeVisible();
      },
      async setUpLocs() {
        form = app.getElBySelector('.note-form');
        title = form.locator('[name="title"]');
        toolbar = form.locator('.note-form__toolbar');
        content = form.locator('.note-form__content');
        cancelBtn = form.locator('.note-form__btm-nav :text-is("Cancel")');
        deleteDraftBtn = form.locator('.note-form__btm-nav :text-is("Delete Draft")');
        saveBtn = form.locator('.note-form__btm-nav :text-is("Save")');
        wysiwygHeadingBtn = toolbar.locator('button[data-type="heading"]');
        wysiwygHRBtn = toolbar.locator('button[data-type="hr"]');
        wysiwygBoldBtn = toolbar.locator('button[data-type="bold"]');
        wysiwygItalicBtn = toolbar.locator('button[data-type="italic"]');
        wysiwygStrikeBtn = toolbar.locator('button[data-type="strikethrough"]');
        wysiwygCodeBtn = toolbar.locator('button[data-type="inlineCode"]');
        wysiwygLinkBtn = toolbar.locator('button[data-type="anchor"]');
        wysiwygULBtn = toolbar.locator('button[data-type="ul"]');
        wysiwygOLBtn = toolbar.locator('button[data-type="ol"]');
        wysiwygIndentBtn = toolbar.locator('button[data-type="indent"]');
        wysiwygCodeBlockBtn = toolbar.locator('button[data-type="codeBlock"]');
        wysiwygQuoteBtn = toolbar.locator('button[data-type="blockquote"]');
        wysiwygTableBtn = toolbar.locator('button[data-type="table"]');
        wysiwygWrapBtn = toolbar.locator('button[data-type="wrap"]');
        wysiwygTOCBtn = toolbar.locator('button[data-type="toc"]');
        wysiwygPreviewBtn = toolbar.locator('button[data-type="preview"]');
        
        await expect(form).toBeVisible()
      },
    };
    
    search = {
      find: async (query) => {
        await searchBtn.click();
        await typeStuff(app.getElBySelector('.search__input-wrapper input'), `${query}{Enter}`);
        const results = app.getElBySelector('.search-result');
        return results;
      },
    };
  });
  
  test('Add Full Test Note', async ({ app }) => {
    await app.exec(`rm -rf ${PATH__DATA}/data_*`);
    await app.loadPage();
    
    await note.clickAdd();
    
    await title.fill(NOTE_NAME);
    await expect(form.locator('.query')).toContainText('?note=root%2Ffull-test-note');
    
    const tagsInput = form.locator('.tags-input__input');
    await tagsInput.fill('test');
    await typeStuff(tagsInput, '{Enter}');
    
    await content.fill('');
    await content.focus();
    await wysiwygTOCBtn.click();
    await typeStuff(content, '{Enter}{Enter}');
    await scrollToBottom(content);
    
    await wysiwygHeadingBtn.click();
    await content.type('Section 1');
    await typeStuff(content, '{Enter}');
    await wysiwygHeadingBtn.click();
    await wysiwygHeadingBtn.click();
    await content.type('Section 1.a');
    await typeStuff(content, '{Enter}');
    await wysiwygHeadingBtn.click();
    await wysiwygHeadingBtn.click();
    await wysiwygHeadingBtn.click();
    await content.type('Section 1.a.1');
    await typeStuff(content, '{Enter}');
    await wysiwygHeadingBtn.click();
    await content.type('Section 2');
    await typeStuff(content, '{Enter}{Enter}');
    await scrollToBottom(content);
    
    await wysiwygHRBtn.click();
    await typeStuff(content, '{Enter}{Enter}');
    await scrollToBottom(content);
    
    await content.type('Bold text');
    await highlight(content, -4);
    await wysiwygBoldBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await scrollToBottom(content);
    
    await content.type('Italic text')
    await highlight(content, -4);
    await wysiwygItalicBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await scrollToBottom(content);
    
    await content.type('Strikethrough text')
    await highlight(content, -4);
    await wysiwygStrikeBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await scrollToBottom(content);
    
    await content.type('Inline code');
    await highlight(content, -4);
    await wysiwygCodeBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await scrollToBottom(content);
    
    await content.type('A link')
    await highlight(content, -6);
    await wysiwygLinkBtn.click();
    await app.getElBySelector('#Y2xpX3VybA').type('/relative/path');
    await app.getElBySelector('.dialog__body :text-is("Add")').click();
    await scrollToBottom(content);
    
    await typeStuff(content, '{End}{Enter}{Enter}Some random test text to test search.{Enter}{Enter}');
    await scrollToBottom(content);
    
    await wysiwygULBtn.click();
    await typeStuff(content, '{End}unordered{Enter}unordered{Enter}{Enter}');
    await wysiwygOLBtn.click();
    await typeStuff(content, '{End}ordered{Enter}ordered{Enter}{Enter}');
    await wysiwygULBtn.click();
    await typeStuff(content, '{End}parent{Enter}');
    await wysiwygULBtn.click(); // remove list formatting
    await wysiwygIndentBtn.click();
    await wysiwygOLBtn.click();
    await typeStuff(content, '{End}child{Enter}child{Enter}{Enter}');
    await scrollToBottom(content);
    
    await typeStuff(content, '```{Enter}// no lang specified{Enter}blah{Enter}```{Enter}');
    await scrollToBottom(content);
    await typeStuff(content, '```html{Enter}<!-- comment -->{Enter}<div att="val">{Enter}  <span>blah</span>{Enter}{Backspace}{Backspace}</div>{Enter}```{Enter}');
    await scrollToBottom(content);
    await typeStuff(content, '```js{Enter}// code block{Enter}var x = \'y\';{Enter}```{Enter}');
    await scrollToBottom(content);
    await content.type('code block from button');
    await highlight(content, -22);
    await wysiwygCodeBlockBtn.click();
    await scrollToBottom(content);
    await typeStuff(content, '{Control+End}{Enter}{Enter}');
    await scrollToBottom(content);
    
    await wysiwygQuoteBtn.click();
    await typeStuff(content, 'block  {Enter}');
    await wysiwygQuoteBtn.click();
    await typeStuff(content, 'quote{Enter}{Enter}');
    await scrollToBottom(content);
    
    await wysiwygTableBtn.click();
    await typeStuff(app.getFocusedEl(), '{ArrowUp}');
    await app.getElBySelector('.table-form [name="col1"]').type('col1');
    await app.getElBySelector('.table-form [name="col2"]').type('col2');
    await app.getElBySelector('.table-form [name="col3"]').type('col3');
    await app.getElBySelector('.table-form button:text-is("Add")').click();
    await highlight(content, -3);
    await typeStuff(content, ' col3 value |{Enter}');
    await scrollToBottom(content);
    
    await typeStuff(content, '{Enter}askdjlaksdjf;laksjdfla;skjdfla;ksdjflskajdfl;askjdfla;skdjfl;sakdjflsa;kdjfal;skdjfl;askjdf;adf {Enter}');
    let contWidth = await content.evaluate((el) => el.scrollWidth);
    await expect(contWidth).toEqual(666);
    await expect(form).toContainClass('wrap');
    await app.screenshot('editor is wrapping text');
    await wysiwygWrapBtn.click();
    contWidth = await content.evaluate((el) => el.scrollWidth);
    await expect(contWidth).toEqual(784);
    await expect(form).not.toContainClass('wrap');
    await app.screenshot('editor is not wrapping text');
    await wysiwygWrapBtn.click();
    
    await wysiwygPreviewBtn.click();
    const preview = app.getElBySelector('.note-form__content-preview');
    await expect(preview.locator('hr')).toBeAttached();
    await expect(preview.locator('thead')).toContainText('col1 col2 col3');
    await expect(preview.locator('tbody')).toContainText('col3 value');
    await expect(preview.locator('tbody tr')).toHaveCount(1);
    await app.screenshot('previewing note');
    await wysiwygPreviewBtn.click();
    
    // make sure no accidental loss of note occurs
    await app.getElBySelector('.dialog-mask').click({ force: true }); // eslint-disable-line playwright/no-force-option
    await expect(content).toBeAttached();
    
    await saveBtn.click();
    
    const tags = app.getElBySelector('.notes-nav .tags');
    await tags.locator('.notes-nav-items-toggle__btn').click();
    const noteTag = tags.locator('.notes-nav-items-toggle__items .note-tag');
    await expect(noteTag).toHaveCount(1);
    await expect(noteTag).toHaveAttribute('href', '?tag=test');
    
    const label = app.getElBySelector('.group-list.is--root > .item .item__label');
    await expect(label).toHaveCount(1);
    await expect(label).toHaveAttribute('href', '?note=root%2Ffull-test-note');
    
    await app.getElBySelector(SELECTOR__FLYOUT__CLOSE_BTN).click();
  });
  
  test.describe('Group', () => {
    test('Add Group', async ({ app }) => {
      await note.openNotesFlyout();
        
      // reset test data
      await app.deleteGroup(GROUP_NAME);
      
      await app.getElBySelector('.flyout .sub-nav button[title="Add Group"]').click();
      await app.getElBySelector('#Y2xpX25hbWU').type(GROUP_NAME);
      await expect(app.getElBySelector('.query')).toContainText('?note=root%2Ftest-group');
      await app.getElBySelector('.group-form__btm-nav :text-is("Save")').click();
      
      const groupName = app.getElBySelector('.group__name-text');
      await expect(groupName).toHaveCount(1);
      await expect(groupName).toContainText(GROUP_NAME);
        
      await app.getElBySelector(SELECTOR__FLYOUT__CLOSE_BTN).click();
    });
    
    test('Move Note to Group', async ({ app }) => {
      await note.openNotesFlyout();
        
      // move note, verify the number of notes in the group is displayed
      await app.moveNote(NOTE_NAME, GROUP_NAME);
      await expect(app.getElBySelector('.group__name-text')).toContainText(`(1) ${GROUP_NAME}`);
      
      // open group to execute actions on note
      await app.getElBySelector('.group').click();
      
      // verify query preview maintains group path(s)
      await app.getElBySelector('.group .item [title="Edit"]').click();
      await note.setUpLocs();
      await expect(app.getElBySelector('.note-form .query')).toContainText('?note=root%2Ftest-group%2Ffull-test-note');
      await title.type(' update');
      await expect(app.getElBySelector('.note-form .query')).toContainText('?note=root%2Ftest-group%2Ffull-test-note-update');
      await cancelBtn.click();
      
      // move the note back to the root
      await app.moveNote(NOTE_NAME, '/');
      await expect(app.getElBySelector('.group__name-text')).toContainText(GROUP_NAME);
      
      await app.getElBySelector(SELECTOR__FLYOUT__CLOSE_BTN).click();
    });
  });
  
  test('Display a List of Related Search Results', async ({ app }) => {
    const results = await search.find('test');
    await expect(results).toHaveCount(3);
    
    const res1 = results.nth(0);
    await expect(res1).toHaveAttribute('data-tag', 'test');
    await expect(await res1.locator('.search-result__title').innerHTML()).toEqual('<mark>test</mark>');
    
    const res2 = results.nth(1);
    await expect(res2).toHaveAttribute('data-path', 'root/full-test-note');
    await expect(await res2.locator('.search-result__title').innerHTML()).toEqual('Full <mark>Test</mark> Note');
    await expect(await res2.locator('.search-result__content').innerHTML()).toEqual('me random <mark>test</mark> text to t ... t text to <mark>test</mark> search.\n\n');
    
    const res3 = results.nth(2);
    await expect(res3).toHaveAttribute('data-path', 'root/test-group');
    await expect(res3).toBeDisabled();
    await expect(await res3.locator('.search-result__title').innerHTML()).toEqual('<mark>Test</mark> Group');
    
    await app.screenshot('search results');
    
    await app.getElBySelector(SELECTOR__FLYOUT__CLOSE_BTN).click();
  });
  
  test('Export and Import User Data', async ({ app }) => {
    const backupFilePath = await app.downloadFile(async () => {
      await userBtn.click();
      await app.getElBySelector('.user-nav :text-is("Export")').click();
    });
    
    await app.deleteUserData();
    
    await expect(app.getElBySelector(SELECTOR__START_MSG)).toBeAttached();
    
    await app.waitForDataUpdate({ action: DATA_ACTION__IMPORT, type: DATA_TYPE__ALL }, async () => {
      await app.chooseFile(backupFilePath, async () => {
        await userBtn.click();
        await app.getElBySelector('.user-nav :text-is("Import")').click();
      });
    });
    
    await expect(app.getElBySelector(SELECTOR__START_MSG)).not.toBeAttached();
  });
  
  test('Switch Themes', async ({ app }) => {
    await themeBtn.click();
    await expect(app.getElBySelector('.theme-opt.current')).toContainText('default');
    await expect(app.getElBySelector('body[class*="theme-"]')).toHaveCount(0);
    
    const opts = await app.getElBySelector('.theme-opt:not(.current)').all();
    for (const opt of opts) {
      const theme = await opt.getAttribute('value');
      await app.waitForDataUpdate({ action: DATA_ACTION__EDIT, type: DATA_TYPE__PREFS }, async () => {
        await opt.click();
      });
      await expect(app.getElBySelector(`body.theme-${theme}`)).toHaveCount(1);
      await app.screenshot(`theme '${theme}' applied`);
    }
    
    await app.getElBySelector('.theme-opt:text-is("default")').click();
    await themeBtn.click();
  });
  
  test.describe('Draft', () => {
    const SELECTOR__EDIT_BTN = '.modify-nav button[title="Edit"]';
    
    test('While Creating a New Note', async ({ app }) => {
      const NOTE_TITLE = 'Draft Note';
      const NOTE_ID = 'draft-note'
      const NOTE_CONTENT = 'asdf asdf asdf asdf asdf sadf';
      
      // await app.exec(`rm -rf ${PATH__DATA}/data_*`); // NOTE: uncomment when tweaking test to get past partially created data
      
      // Create and start filling out note =====================================
      await note.clickAdd();
      await title.fill(NOTE_TITLE);
      await content.fill(NOTE_CONTENT);
      await expect(app.getElBySelector('.dialog__title')).toContainText('Add Note');
      await expect(cancelBtn).toHaveCount(1);
      await app.screenshot('[draft] creating new note');
      
      // Create draft, verify note UI updated to reflect draft creation ========
      await app.pageVisibility.hide();
      await app.pageVisibility.show();
      await expect(app.getElBySelector('.dialog__title')).toContainText('Edit Note');
      await expect(deleteDraftBtn).toHaveCount(1);
      await app.screenshot('[draft] created from unsaved new note');
      
      // Ensure Draft data is being used in Search =============================
      await app.loadPage();
      const results = await search.find(NOTE_TITLE);
      await expect(results).toHaveCount(1);
      await app.screenshot('[draft] data used in search results');
      
      // Load and verify note from Search ======================================
      await app.getElBySelector(`.search-result[data-path="${BASE_DATA_NODE}/${NOTE_ID}"]`).click();
      await expect(app.getElBySelector('.full-note header')).toContainText(NOTE_TITLE);
      await expect(app.getElBySelector('.full-note__body')).toContainText(NOTE_CONTENT);
      await app.screenshot('[draft] content used in note view');
      
      // Delete draft and verify it's deletion =================================
      const editBtn = app.getElBySelector(SELECTOR__EDIT_BTN);
      await expect(editBtn).toContainText('Draft');
      await editBtn.click();
      await deleteDraftBtn.click();
      await app.waitForDialog('.delete-form');
      await expect(app.getElBySelector('.delete-form__msg')).toContainText(`Delete note ${NOTE_TITLE} from /?`);
      await app.getElBySelector('.delete-form__btm-nav :text-is("Yes")').click();
      await note.openNotesFlyout();
      await expect(app.getElBySelector(`.notes .item__label:text-is("${NOTE_TITLE}")`)).toHaveCount(0);
      await app.screenshot('[draft] deletion deletes note since there was no previous data');
      
      // Verify note saved from a draft ========================================
      await note.clickAdd();
      await title.fill(NOTE_TITLE);
      await content.fill(NOTE_CONTENT);
      await app.pageVisibility.hide();
      await app.pageVisibility.show();
      await saveBtn.click();
      await app.getElBySelector(`.notes .item__label-text:text-is("${NOTE_TITLE}")`).click();
      await expect(app.getElBySelector('.flyout')).toBeHidden();
      await expect(app.getElBySelector('.full-note header')).toContainText(NOTE_TITLE);
      await expect(app.getElBySelector('.full-note__body')).toContainText(NOTE_CONTENT);
      await app.screenshot('[draft] data converted to note data');
    });
      
    test('While Editing Existing Note', async ({ app }) => {
      const CHANGED_TXT = '::TOC::\n\nedit\n\n';
      
      await app.loadNotePage(NOTE_NAME);
      
      let editBtn = app.getElBySelector(SELECTOR__EDIT_BTN);
      await expect(editBtn).not.toContainText('Draft');
      await editBtn.click();
      await note.setUpLocs();
      
      // edit note ===============================================================
      const origTxt = await content.inputValue();
      await content.fill(origTxt.replace('::TOC::', CHANGED_TXT));
      
      // create new tab and close tab w note edits ===============================
      await app.createPage(); // new blank tab
      await app.switchToPage(2); // draft saved in background
      await app.closePage(1); // note page closed
      
      // verify draft saved ======================================================
      await app.loadPage();
      await app.logIn();
      await app.loadNotePage(NOTE_NAME);
      editBtn = app.getElBySelector(SELECTOR__EDIT_BTN);
      await expect(editBtn).toContainText('Draft');
      await app.screenshot('[draft] Edit button displays Draft');
      await editBtn.click();
      await note.setUpLocs();
      let txt = await content.inputValue();
      await expect(txt).toContain(CHANGED_TXT);
      await app.screenshot('[draft] Editor has Draft content');
      
      // disregard draft =========================================================
      await app.getElBySelector('.note-form__btm-nav :text-is("Delete Draft")').click();
      await expect(editBtn).not.toContainText('Draft');
      await app.screenshot('[draft] Edit button does not displays Draft');
      await editBtn.click();
      txt = await content.inputValue();
      await expect(txt).not.toContain(CHANGED_TXT);
      await app.screenshot('[draft] Editor reverted to original content');
    });
  });
});
