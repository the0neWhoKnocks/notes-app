import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import {
  BASE_DATA_NODE,
  DATA_ACTION__EDIT,
  DATA_ACTION__IMPORT,
  DATA_TYPE__ALL,
  DATA_TYPE__PREFS,
  PATH__CONFIG,
  PATH__DATA,
} from '@src/constants'; // eslint-disable-line n/no-missing-import
import encrypt from '@src/server/utils/encrypt'; // eslint-disable-line n/no-missing-import
import {
  CREDS__PASS,
  CREDS__USER,
  AppFixture,
  expect,
  test,
} from './fixtures/AppFixture';

const SELECTOR__FLYOUT__CLOSE_BTN = '.flyout__close-btn';
const SELECTOR__FULLNOTE__CONTENT = '.full-note__body';
const SELECTOR__FULLNOTE__TITLE = '.full-note header';
const SELECTOR__START_MSG = '.start-msg';
const { exec } = AppFixture;

test.describe.configure({ mode: 'serial' }); // Required to stop tests on failure.

test.describe('Init', () => {
  test('Fill out config data', async ({ app }) => {
    await exec(`rm -rf ${PATH__DATA}/*`);
    await app.loadPage();
    await app.clearStorage();
    
    await app.loadPage();
    await app.createConfig();
  });
  
  test('Create a New User and Log In', async ({ app }) => {
    await app.loadPage();
    
    await app.createUser({ user: CREDS__USER, pass: CREDS__PASS });
    // going from create to login will persist what was entered, the doubling is expected
    await expect(app.page).toHaveAlertMsg(
      async () => {
        await app.logIn({
          user: CREDS__USER,
          pass: CREDS__PASS,
          screenshot: '[login_user] incorrect creds filled out',
          willFail: true,
        });
      },
      `An account for "${CREDS__USER}${CREDS__USER}" doesn't exist.`
    );
    
    await app.logIn({
      user: CREDS__USER,
      pass: CREDS__PASS,
      overwrite: true,
      screenshot: '[login_user] filled out',
    });
  });
  
  test("Don't Create the Same User Twice", async ({ app }) => {
    await app.loadPage();
    await app.createUser({
      user: CREDS__USER, pass: CREDS__PASS,
      errorMsg: `User "${CREDS__USER}" already exists`,
    });
  });
  
  test('Display Message When No Notes Exist', async ({ app }) => {
    await app.loadPage();
    await app.logIn();
    
    const startMsg = app.getEl(SELECTOR__START_MSG);
    await expect(startMsg).toContainText("Looks like you haven't added any notes yet.");
    await expect(startMsg.locator('button.notes-menu-btn')).toBeAttached();
    await expect(startMsg.locator('button.import-btn')).toBeAttached();
    await app.screenshot('no notes msg');
  });
});

test('Migrate Data to New Schema', async ({ app }) => {
  // Ensure base files are generated ===========================================
  await app.loadPage();
  await app.logIn();
  
  // Generate 1.0.0 file =======================================================
  const NOTE_TITLE = 'Old Format';
  const NOTE_ID = 'old-format';
  const NOTE_CONTENT = 'Old content, blah blah blah.';
  const [ userFolder ] = await app.getUserDataFolders();
  const [ , uid ] = userFolder.split('user_');
  const data = {
    allTags: {},
    notesData: {
      [BASE_DATA_NODE]: {
        groups: {},
        notes: {
          [NOTE_ID]: {
            content: NOTE_CONTENT,
            created: 1642016304599,
            tags: [],
            title: NOTE_TITLE,
          },
        },
      },
    },
    preferences: { theme: 'twilight' },
    recentlyViewed: [],
  };
  const filePath = `${PATH__DATA}/data_${uid}.json`;
  const config = JSON.parse(await readFile(PATH__CONFIG, 'utf8'));
  const { combined: encryptedData } = await encrypt(config, data, CREDS__PASS);
  await writeFile(filePath, JSON.stringify(encryptedData), 'utf8');
  await expect(existsSync(filePath)).toBeTruthy();
  await app.deleteUserData();
  
  await app.loadNotePage(NOTE_TITLE);
  await expect(app.getEl('.app')).toContainClass('is--loaded');
  await expect(existsSync(filePath)).toBeFalsy();
  await expect(existsSync(`${filePath}.bak`)).toBeTruthy();
  await expect(existsSync(`${PATH__DATA}/${userFolder}`)).toBeTruthy();
  await expect(app.getEl(SELECTOR__FULLNOTE__TITLE)).toContainText(NOTE_TITLE);
  await expect(app.getEl(SELECTOR__FULLNOTE__CONTENT)).toContainText(NOTE_CONTENT);
  await app.screenshot('old data migrated');
});

test.describe('Notes', () => {
  const GROUP_NAME = 'Test Group';
  const NOTE_NAME = 'Full Test Note';
  let note, notesBtn, search, searchBtn, themeBtn;
  let cancelBtn, content, deleteDraftBtn, form, saveBtn, tagsInput, title, toolbar,
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
  
  async function typeStuff(loc, txt) {
    const parts = txt.split(/(\{[^}]+\})/).filter((str) => !!str);
    const keyReg = /^\{([^}]+)\}$/;
    
    for (let t of parts) {
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
    
    notesBtn = app.getEl('.top-nav .notes-menu-btn');
    searchBtn = app.getEl('.top-nav .search-btn');
    themeBtn = app.getEl('.top-nav :text-is("Theme")');
    
    note = {
      async clickAdd() {
        if ( !(await app.getEl('.flyout .notes').count()) ) {
          await this.openNotesFlyout();
        }
        await app.getEl('.flyout .notes > .sub-nav button[title="Add Note"]').click();
        this.setUpLocs();
      },
      async clickEdit() {
        await app.els.editBtn().click();
        await expect(form).toBeAttached();
      },
      async deleteNote({ btn, title: nTitle }) {
        await btn.click();
        await app.waitForDialog('.delete-form');
        if (nTitle) {
          await expect(app.getEl('.delete-form__msg')).toContainText(`Delete note ${nTitle} from /?`);
        }
        const delResp = app.genDeleteNoteReqPromise();
        await app.getEl('.delete-form__btm-nav :text-is("Yes")').click();
        await delResp;
      },
      async loadNote(nTitle) {
        await expect(form).not.toBeAttached();
        await app.getEl(`.notes .item__label-text:text-is("${nTitle}")`).click();
        await expect(app.getEl('.flyout')).not.toBeAttached();
      },
      async openNotesFlyout() {
        await notesBtn.click();
        await expect(app.getEl('[flyout-for="notesNav"]')).toBeVisible();
      },
      async resetTestNote(nTitle) {
        const noteItems = app.getEl(`.notes .item:has(.item__label-text:has-text("${nTitle}"))`);
        if (await noteItems.count()) {
          for (let n of (await noteItems.all()).reverse()) {
            await note.deleteNote({ btn: n.locator('button[title="Delete"]') });
          }
        }
        return noteItems;
      },
      async setUpLocs() {
        form = app.getEl('.note-form');
        tagsInput = form.locator('input[placeholder="Add Tag..."]');
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
        
        await expect(form).toBeVisible();
      },
    };
    
    search = {
      find: async (query) => {
        await searchBtn.click();
        await typeStuff(app.getEl('.search__input-wrapper input'), `${query}{Enter}`);
        const results = app.getEl('.search-result');
        return results;
      },
    };
  });
  
  test('Add Full Test Note', async ({ app }) => {
    await app.deleteUserData();
    await app.loadPage();
    
    await note.clickAdd();
    
    await title.fill(NOTE_NAME);
    await expect(form.locator('.query')).toContainText('?note=root%2Ffull-test-note');
    
    await typeStuff(tagsInput, 'test{Enter}');
    
    await content.fill('');
    await content.focus();
    await wysiwygTOCBtn.click();
    await typeStuff(content, '{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
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
    await app.scroll(content).toBottom();
    
    await wysiwygHRBtn.click();
    await typeStuff(content, '{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await content.type('Bold text');
    await highlight(content, -4);
    await wysiwygBoldBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await content.type('Italic text');
    await highlight(content, -4);
    await wysiwygItalicBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await content.type('Strikethrough text');
    await highlight(content, -4);
    await wysiwygStrikeBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await content.type('Inline code');
    await highlight(content, -4);
    await wysiwygCodeBtn.click();
    await typeStuff(content, '{End}{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await content.type('A link');
    await highlight(content, -6);
    await wysiwygLinkBtn.click();
    await app.getEl('#Y2xpX3VybA').type('/relative/path');
    await app.getEl('.dialog__body :text-is("Add")').click();
    await app.scroll(content).toBottom();
    
    await typeStuff(content, '{End}{Enter}{Enter}Some random test text to test search.{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
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
    await app.scroll(content).toBottom();
    
    await typeStuff(content, '```{Enter}// no lang specified{Enter}blah{Enter}```{Enter}');
    await app.scroll(content).toBottom();
    await typeStuff(content, '```html{Enter}<!-- comment -->{Enter}<div att="val">{Enter}  <span>blah</span>{Enter}{Backspace}{Backspace}</div>{Enter}```{Enter}');
    await app.scroll(content).toBottom();
    await typeStuff(content, '```js{Enter}// code block{Enter}var x = \'y\';{Enter}```{Enter}');
    await app.scroll(content).toBottom();
    
    const codeBlockTxt = 'code block from button';
    await content.type(codeBlockTxt);
    await highlight(content, -22);
    await wysiwygCodeBlockBtn.click();
    const langDialog = await app.waitForDialog('.code-lang-form');
    const langInput = langDialog.locator('.auto-complete-input__input');
    const langList = langDialog.locator('.auto-complete-input__list');
    await langInput.type('j');
    await expect(langList).toBeAttached();
    await langDialog.locator('.auto-complete-input__option:text-is("js")').click();
    await expect(langInput).toHaveValue('js');
    await langDialog.locator('button:text-is("Add")').click();
    const contentVal = await content.inputValue();
    expect(contentVal).toContain(`\`\`\`js\n${codeBlockTxt}\n\`\`\``);
    await app.scroll(content).toBottom();
    await typeStuff(content, '{Control+End}{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await wysiwygQuoteBtn.click();
    await typeStuff(content, 'block  {Enter}');
    await wysiwygQuoteBtn.click();
    await typeStuff(content, 'quote{Enter}{Enter}');
    await app.scroll(content).toBottom();
    
    await wysiwygTableBtn.click();
    await typeStuff(app.getFocusedEl(), '{ArrowUp}');
    await app.getEl('.table-form [name="col1"]').type('col1');
    await app.getEl('.table-form [name="col2"]').type('col2');
    await app.getEl('.table-form [name="col3"]').type('col3');
    await app.getEl('.table-form button:text-is("Add")').click();
    await highlight(content, -3);
    await typeStuff(content, ' col3 value |{Enter}');
    await app.scroll(content).toBottom();
    
    await typeStuff(content, '{Enter}askdjlaksdjf;laksjdfla;skjdfla;ksdjflskajdfl;askjdfla;skdjfl;sakdjflsa;kdjfal;skdjfl;askjdf;adf {Enter}');
    let contWidth = await content.evaluate((el) => el.scrollWidth);
    await expect(contWidth).toEqual(651);
    await expect(form).toContainClass('wrap');
    await app.screenshot('editor is wrapping text');
    await wysiwygWrapBtn.click();
    contWidth = await content.evaluate((el) => el.scrollWidth);
    await expect(contWidth).toEqual(784);
    await expect(form).not.toContainClass('wrap');
    await app.screenshot('editor is not wrapping text');
    await wysiwygWrapBtn.click();
    
    await wysiwygPreviewBtn.click();
    const preview = app.getEl('.note-form__content-preview');
    await expect(preview.locator('hr')).toBeAttached();
    await expect(preview.locator('thead')).toContainText('col1 col2 col3');
    await expect(preview.locator('tbody')).toContainText('col3 value');
    await expect(preview.locator('tbody tr')).toHaveCount(1);
    await app.screenshot('previewing note');
    await wysiwygPreviewBtn.click();
    
    // make sure no accidental loss of note occurs
    await app.getEl('.dialog-mask').click({ force: true }); // eslint-disable-line playwright/no-force-option
    await expect(content).toBeAttached();
    
    await saveBtn.click();
    
    const tags = app.getEl('.notes-nav .tags');
    await tags.locator('.notes-nav-items-toggle__btn').click();
    const noteTag = tags.locator('.notes-nav-items-toggle__items .note-tag');
    await expect(noteTag).toHaveCount(1);
    await expect(noteTag).toHaveAttribute('href', '?tag=test');
    
    const label = app.getEl('.group-list.is--root > .item .item__label');
    await expect(label).toHaveCount(1);
    await expect(label).toHaveAttribute('href', '?note=root%2Ffull-test-note');
    
    await app.getEl(SELECTOR__FLYOUT__CLOSE_BTN).click();
  });
  
  test('Tag Auto-Completion', async ({ app }) => {
    const NOTE_TITLE = 'Tags';
    
    await note.openNotesFlyout();
    const noteItem = await note.resetTestNote(NOTE_TITLE);
    const noteLink = noteItem.locator('.item__label');
    const deleteTagBtn = app.getEl('.tags-input__tag-delete-btn');
    
    await note.clickAdd();
    await title.fill(NOTE_TITLE);
    await typeStuff(tagsInput, 'bar{Enter}');
    await content.fill('tags');
    await saveBtn.click();
    await noteLink.click();
    await expect(app.getEl('.flyout')).not.toBeAttached();
    
    await note.clickEdit();
    await deleteTagBtn.click();
    await expect(deleteTagBtn).not.toBeAttached();
    await tagsInput.type('ba');
    await expect(app.getEl('.auto-complete-input__list')).toBeAttached();
    await app.page.keyboard.down('ArrowDown');
    await expect(app.getEl('[data-opt="bar"]')).toBeFocused();
    await app.page.keyboard.down('Enter');
    await expect(app.getEl('.tags-input__tag:has-text("bar")')).toBeAttached();
    
    await deleteTagBtn.click();
    await expect(deleteTagBtn).not.toBeAttached();
    await tagsInput.type('ba');
    await expect(app.getEl('.auto-complete-input__list')).toBeAttached();
    await app.getEl('[data-opt]:has-text("bar")').click();
    await expect(app.getEl('.tags-input__tag:has-text("bar")')).toBeAttached();
  });
  
  test('URL Updates After Edit & Delete', async ({ app }) => {
    const NOTE_TITLE = 'Temp';
    
    await note.openNotesFlyout();
    const noteItem = await note.resetTestNote(NOTE_TITLE);
    const noteLink = noteItem.locator('.item__label');
    
    await note.clickAdd();
    await title.fill(NOTE_TITLE);
    await content.fill('dfasdfasdf');
    await saveBtn.click();
    await noteLink.click();
    await expect(app.getEl('.flyout')).not.toBeAttached();
    await expect(app.page).toHaveQueryParam({ note: 'root/temp' });
    
    // Param shouldn't have been altered after editing content =================
    await note.clickEdit();
    await content.fill('dfasd');
    await saveBtn.click();
    await expect(form).not.toBeAttached();
    await expect(app.page).toHaveQueryParam({ note: 'root/temp' });
    
    // Param should change after title change ==================================
    await note.clickEdit();
    await title.fill('Temp 2');
    await saveBtn.click();
    await expect(form).not.toBeAttached();
    await expect(app.page).toHaveQueryParam({ note: 'root/temp-2' });
    
    // Param should be removed if the note was deleted =========================
    await note.deleteNote({ btn: app.getEl('.full-note__nav button[title="Delete"]') });
    await expect(app.page).not.toHaveQueryParam({ note: 'root/temp-2' });
    await expect(app.getEl('.dialog')).not.toBeAttached();
    await expect(app.getEl('.recently-viewed')).toBeAttached();
  });
  
  test.describe('Group', () => {
    test('Add Group', async ({ app }) => {
      await note.openNotesFlyout();
        
      // reset test data
      await app.deleteGroup(GROUP_NAME);
      
      await app.getEl('.flyout .sub-nav button[title="Add Group"]').click();
      await app.getEl('#Y2xpX25hbWU').type(GROUP_NAME);
      await expect(app.getEl('.query')).toContainText('?note=root%2Ftest-group');
      await app.getEl('.group-form__btm-nav :text-is("Save")').click();
      
      const groupName = app.getEl('.group__name-text');
      await expect(groupName).toHaveCount(1);
      await expect(groupName).toContainText(GROUP_NAME);
        
      await app.getEl(SELECTOR__FLYOUT__CLOSE_BTN).click();
    });
    
    test('Move Note to Group', async ({ app }) => {
      await note.openNotesFlyout();
        
      // move note, verify the number of notes in the group is displayed
      await app.moveNote(NOTE_NAME, GROUP_NAME);
      await expect(app.getEl('.group__name-text')).toContainText(`(1) ${GROUP_NAME}`);
      
      // open group to execute actions on note
      await app.getEl('.group').click();
      
      // verify query preview maintains group path(s)
      await app.getEl('.group .item [title="Edit"]').click();
      await note.setUpLocs();
      await expect(app.getEl('.note-form .query')).toContainText('?note=root%2Ftest-group%2Ffull-test-note');
      await title.type(' update');
      await expect(app.getEl('.note-form .query')).toContainText('?note=root%2Ftest-group%2Ffull-test-note-update');
      await cancelBtn.click();
      
      // move the note back to the root
      await app.moveNote(NOTE_NAME, '/');
      await expect(app.getEl('.group__name-text')).toContainText(GROUP_NAME);
      
      await app.getEl(SELECTOR__FLYOUT__CLOSE_BTN).click();
    });
  });
  
  test('Display a List of Related Search Results', async ({ app }) => {
    const getInnerHTML = (loc) => loc.evaluate((el) => el.innerHTML.replaceAll(/<!---->/g, ''));
    
    const results = await search.find('test');
    await expect(results).toHaveCount(3);
    
    const res1 = results.nth(0);
    await expect(res1).toHaveAttribute('data-tag', 'test');
    expect(await getInnerHTML(res1.locator('.search-result__title'))).toEqual('<mark>test</mark>');
    
    const res2 = results.nth(1);
    await expect(res2).toHaveAttribute('data-path', 'root/full-test-note');
    expect(await getInnerHTML(res2.locator('.search-result__title'))).toEqual('Full <mark>Test</mark> Note');
    expect(await getInnerHTML(res2.locator('.search-result__content'))).toEqual('me random <mark>test</mark> text to t ... t text to <mark>test</mark> search.\n\n');
    
    const res3 = results.nth(2);
    await expect(res3).toHaveAttribute('data-path', 'root/test-group');
    await expect(res3).toBeDisabled();
    expect(await getInnerHTML(res3.locator('.search-result__title'))).toEqual('<mark>Test</mark> Group');
    
    await app.screenshot('search results');
    
    await app.getEl(SELECTOR__FLYOUT__CLOSE_BTN).click();
  });
  
  test('Export and Import User Data', async ({ app }) => {
    const backupFilePath = await app.downloadFile(async () => {
      await app.getUserBtn().click();
      await app.getEl('.user-nav :text-is("Export")').click();
    });
    
    await app.deleteUserData(true);
    
    await expect(app.getEl(SELECTOR__START_MSG)).toBeAttached();
    
    await app.waitForDataUpdate({ action: DATA_ACTION__IMPORT, type: DATA_TYPE__ALL }, async () => {
      await app.chooseFile(backupFilePath, async () => {
        await app.getUserBtn().click();
        await app.getEl('.user-nav :text-is("Import")').click();
      });
    });
    
    await expect(app.getEl(SELECTOR__START_MSG)).not.toBeAttached();
  });
  
  test('Switch Themes', async ({ app }) => {
    await themeBtn.click();
    await expect(app.getEl('.theme-opt.current')).toContainText('default');
    await expect(app.getEl('body[class*="theme-"]')).toHaveCount(0);
    
    const opts = await app.getEl('.theme-opt:not(.current)').all();
    for (const opt of opts) {
      const theme = await opt.getAttribute('value');
      await app.waitForDataUpdate({ action: DATA_ACTION__EDIT, type: DATA_TYPE__PREFS }, async () => {
        await opt.click();
      });
      await expect(app.getEl(`body.theme-${theme}`)).toHaveCount(1);
      await app.screenshot(`theme '${theme}' applied`);
    }
    
    await app.getEl('.theme-opt:text-is("default")').click();
    await themeBtn.click();
  });
  
  test.describe('Draft', () => {
    test('While Creating a New Note', async ({ app }) => {
      const NOTE_TITLE = 'Draft Note';
      const NOTE_ID = 'draft-note';
      const NOTE_CONTENT = 'asdf asdf asdf asdf asdf sadf';
      const editBtn = app.els.editBtn();
      
      // await app.deleteUserData(true); // NOTE: uncomment when tweaking test to get past partially created data
      
      // Create and start filling out note =====================================
      await note.clickAdd();
      await title.fill(NOTE_TITLE);
      await content.fill(NOTE_CONTENT);
      await expect(app.getEl('.dialog__title')).toContainText('Add Note');
      await expect(cancelBtn).toHaveCount(1);
      await app.screenshot('[draft] creating new note');
      
      // Create draft, verify note UI updated to reflect draft creation ========
      await app.pageVisibility.hide();
      await app.pageVisibility.show();
      await expect(app.getEl('.dialog__title')).toContainText('Edit Note');
      await expect(deleteDraftBtn).toHaveCount(1);
      await app.screenshot('[draft] created from unsaved new note');
      
      // Ensure Draft data is being used in Search =============================
      await app.loadPage();
      const results = await search.find(NOTE_TITLE);
      await expect(results).toHaveCount(1);
      await app.screenshot('[draft] data used in search results');
      
      // Load and verify note from Search ======================================
      await app.getEl(`.search-result[data-path="${BASE_DATA_NODE}/${NOTE_ID}"]`).click();
      await expect(app.getEl(SELECTOR__FULLNOTE__TITLE)).toContainText(NOTE_TITLE);
      await expect(app.getEl(SELECTOR__FULLNOTE__CONTENT)).toContainText(NOTE_CONTENT);
      await app.screenshot('[draft] content used in note view');
      
      // Delete draft and verify it's deletion =================================
      await expect(editBtn).toContainText('Draft');
      await editBtn.click();
      await note.deleteNote({ btn: deleteDraftBtn, title: NOTE_TITLE });
      await note.openNotesFlyout();
      await expect(app.getEl(`.notes .item__label:text-is("${NOTE_TITLE}")`)).toHaveCount(0);
      await app.screenshot('[draft] deletion deletes note since there was no previous data');
      
      // Verify note saved from a draft ========================================
      await note.clickAdd();
      await title.fill(NOTE_TITLE);
      await content.fill(NOTE_CONTENT);
      await app.pageVisibility.hide();
      await app.pageVisibility.show();
      await expect(app.getEl('.dialog__title')).toContainText('Edit Note');
      await saveBtn.click();
      await app.getEl(`.notes .item__label-text:text-is("${NOTE_TITLE}")`).click();
      await expect(app.getEl('.flyout')).toBeHidden();
      await expect(app.getEl(SELECTOR__FULLNOTE__TITLE)).toContainText(NOTE_TITLE);
      await expect(app.getEl(SELECTOR__FULLNOTE__CONTENT)).toContainText(NOTE_CONTENT);
      await app.screenshot('[draft] data converted to note data');
    });
      
    test('While Editing Existing Note', async ({ app }) => {
      const CHANGED_TXT = '::TOC::\n\nedit\n\n';
      let editBtn = app.els.editBtn();
      
      await app.loadNotePage(NOTE_NAME);
      
      await expect(editBtn).not.toContainText('Draft');
      await editBtn.click();
      await note.setUpLocs();
      
      // edit note ===============================================================
      const origTxt = await content.inputValue();
      await content.fill(origTxt.replace('::TOC::', CHANGED_TXT));
      await expect(saveBtn).toBeEnabled();
      
      // create new tab and close tab w note edits ===============================
      await app.createPage(); // new blank tab
      await app.switchToPage(2); // draft saved in background
      await app.closePage(1); // note page closed
      
      // verify draft saved ======================================================
      await app.loadPage();
      await app.logIn();
      await app.loadNotePage(NOTE_NAME);
      editBtn = app.els.editBtn();
      await expect(editBtn).toContainText('Draft');
      await app.screenshot('[draft] Edit button displays Draft');
      await editBtn.click();
      await note.setUpLocs();
      let txt = await content.inputValue();
      await expect(txt).toContain(CHANGED_TXT);
      await app.screenshot('[draft] Editor has Draft content');
      
      // disregard draft =========================================================
      await app.getEl('.note-form__btm-nav :text-is("Delete Draft")').click();
      await expect(editBtn).not.toContainText('Draft');
      await app.screenshot('[draft] Edit button does not display Draft');
      await editBtn.click();
      txt = await content.inputValue();
      await expect(txt).not.toContain(CHANGED_TXT);
      await app.screenshot('[draft] Editor reverted to original content');
    });
  });
  
  test('User Data Should Be Accessible After Credentials Updated', async ({ app }) => {
    const NOTE_TITLE = 'Changed User Info';
    const NOTE_CONTENT = 'Super important info, hopefully it exists after I change my username & password.';
    const CREDS__CHANGED_USER = 'uzer';
    const CREDS__CHANGED_PASS = 'pazz';
    
    await note.clickAdd();
    await title.fill(NOTE_TITLE);
    await content.fill(NOTE_CONTENT);
    await saveBtn.click();
    await note.loadNote(NOTE_TITLE);
    
    // NOTE: Since the config generates unique data on creation, I can only verify
    // that User folder names are changing, not that they equal a static value.
    const [ oldFolder ] = await app.getUserDataFolders();
    await app.updateUserCreds({ user: CREDS__CHANGED_USER, pass: CREDS__CHANGED_PASS });
    const [ newFolder ] = await app.getUserDataFolders();
    await expect(newFolder).not.toEqual(oldFolder);
    await app.loadNotePage(NOTE_TITLE);
    await expect(app.getEl(SELECTOR__FULLNOTE__TITLE)).toContainText(NOTE_TITLE);
    await expect(app.getEl(SELECTOR__FULLNOTE__CONTENT)).toContainText(NOTE_CONTENT);
    await app.screenshot('user credentials changed');
    
    await app.updateUserCreds({ user: CREDS__USER, pass: CREDS__PASS });
    const [ resetFolder ] = await app.getUserDataFolders();
    await expect(resetFolder).toEqual(oldFolder);
    await app.loadNotePage(NOTE_TITLE);
    await expect(app.getEl(SELECTOR__FULLNOTE__TITLE)).toContainText(NOTE_TITLE);
    await expect(app.getEl(SELECTOR__FULLNOTE__CONTENT)).toContainText(NOTE_CONTENT);
    await app.screenshot('user credentials reverted');
  });
});
