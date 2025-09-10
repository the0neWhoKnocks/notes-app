import {
  BASE_DATA_NODE,
  DATA_ACTION__DELETE,
  DATA_ACTION__MOVE,
  DATA_TYPE__GROUP,
  PATH__DATA,
} from '@src/constants'; // eslint-disable-line n/no-missing-import
import BaseFixture, { createTest, expect } from './BaseFixture';

export const CREDS__PASS = 'pass';
export const CREDS__USER = 'user';
const LOG_PREFIX = '[AppFixture]';
const SELECTOR__LOGIN_FORM = '.login-form';

export class AppFixture extends BaseFixture {
  constructor({ browser, context, page, testCtx, testInfo }) {
    super({ browser, context, page, testCtx, testInfo });
    
    this.els = {
      editBtn: () => this.getEl('.modify-nav button[title="Edit"]'),
    };
  }
  
  async clearStorage() {
    await this.fx.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }
  
  async createConfig() {
    await this.getEl('input[name="cipherKey"]').fill('zeffer');
    await this.getEl('input[name="salt"]').fill('pepper');
    await this.fx.screenshot('[config] filled out');
    await this.getEl('button[value="create"]').click();
    
    await this.waitForDialog(SELECTOR__LOGIN_FORM);
  }
  
  async createUser({ user, pass, errorMsg } = {}) {
    let dialog = await this.waitForDialog(SELECTOR__LOGIN_FORM);
    await dialog.locator('button[value="create"]').click();
    await expect(dialog).not.toBeAttached();
    
    dialog = await this.waitForDialog('.create-form');
    await dialog.locator('[name="username"]').fill(user);
    await dialog.locator('[name="password"]').fill(pass);
    await dialog.locator('[name="passwordConfirmed"]').fill(pass);
    await this.fx.screenshot('[create_user] filled out');
    
    const createBtn = dialog.locator('button[value="create"]');
    if (errorMsg) {
      await expect(this.fx.page).toHaveAlertMsg(
        async () => { await createBtn.click(); },
        errorMsg
      );
    }
    else {
      await createBtn.click();
      await expect(dialog).not.toBeAttached();
      await this.waitForDialog(SELECTOR__LOGIN_FORM);
    }
  }
  
  async deleteGroup(groupName, selector = '.group') {
    await (await this.getItemNav('group', selector, groupName)).delete();
  }
  
  async deleteNote(noteName, selector = '.item') {
    await (await this.getItemNav('note', selector, noteName)).delete();
  }
  
  async deleteUserData(reload = false) {
    await AppFixture.exec(`rm -rf ${PATH__DATA}/user_*`);
    console.log(`${LOG_PREFIX} [DELETED] User data`);
    if (reload) await this.fx.page.reload();
  }
  
  genDeleteNoteReqPromise() {
    return this.fx.page.waitForResponse((res) => {
      const req = res.request();
      if (
        res.status() === 200
        && req.method() === 'POST'
        && req.url().includes('/api/user/data/set')
      ) {
        return req.postDataJSON().action === DATA_ACTION__DELETE;
      }
    });
  }
  
  async getItemNav(type, selector, itemName) {
    const labelSelector = type === DATA_TYPE__GROUP ? '.group__name-text' : '.item__label-text';
    const parentSelector = type === DATA_TYPE__GROUP ? '.group' : '.item';
    const _selector = `${selector} ${labelSelector}`;
    const label = this.getEl(`${selector} ${labelSelector}:text-is("${itemName}")`);
    let subNav;
    
    if (await label.count()) {
      // NOTE: Since Playwright hasn't implemented a `closest()` locator I have to resort to xpath.
      const el = label
        .locator(`xpath=//./ancestor::*[contains(@class, '${parentSelector.replace('.', '')}')]`)
        .locator('.sub-nav');
      
      if (await el.count()) {
        subNav = el;
        console.log(`${LOG_PREFIX} ${type} nav found via selector: '${_selector}'`);
      }
    }
    else console.log(`${LOG_PREFIX} No ${type} nav found via selector: '${_selector}'`);
    
    return {
      delete: async () => {
        if (subNav) {
          const resp = this.genDeleteNoteReqPromise();
          await subNav.locator('.modify-nav [title="Delete"]').click();
          await this.getEl('.delete-form__btm-nav :text-is("Yes")').click();
          await resp;
        }
        else console.log(`${LOG_PREFIX} Skipping delete, no nav found`);
      },
      move: async (moveToPath) => {
        if (subNav) {
          const resp = this.fx.page.waitForResponse((res) => {
            const req = res.request();
            if (
              res.status() === 200
              && req.method() === 'POST'
              && req.url().includes('/api/user/data/set')
            ) {
              return req.postDataJSON().action === DATA_ACTION__MOVE;
            }
          });
          
          await subNav.locator('.modify-nav [title="Move"]').click();
          await this.getEl('.move-to .group__name')
            .filter({
              has: this.getEl(`.group__name-text:text-is("${moveToPath}")`),
            })
            .locator('.move-nav :text-is("Here")')
            .click();
          await this.getEl('.move-to__btm-nav :text-is("Move")').click();
          await resp;
          await expect(this.getEl('.move-to')).not.toBeAttached();
        }
        else console.log(`${LOG_PREFIX} Skipping move, no nav found`);
      },
    };
  }
  
  getUserBtn() {
    return this.getEl('.top-nav .user-nav .drop-down__toggle');
  }
  
  async getUserDataFolders() {
    const result = await AppFixture.exec(`find "${PATH__DATA}" -name "user_*" -type d`);
    return result.split('\n').filter((i) => !!i).map((i) => i.replace(`${PATH__DATA}/`, ''));
  }
  
  async loadNotePage(noteName, parentPath = BASE_DATA_NODE) {
    await this.loadPage(`?note=${encodeURIComponent(`${parentPath}/${noteName}`.toLowerCase().replaceAll(' ', '-'))}`);
    await expect(this.getEl('.full-note')).toHaveCount(1);
  }
  
  async logIn(opts) {
    if (!opts) { // auto login for most tests
      opts = {
        user: CREDS__USER,
        pass: CREDS__PASS,
      };
    }
    
    const { overwrite, pass, screenshot, user, willFail = false } = opts;
    const textFn = (overwrite) ? 'fill' : 'type';
    
    let dialog = await this.waitForDialog(SELECTOR__LOGIN_FORM);
    await dialog.locator('[name="username"]')[textFn](user);
    await dialog.locator('[name="password"]')[textFn](pass);
    if (screenshot) await this.fx.screenshot(screenshot);
    
    let uResp;
    if (!willFail) {
      uResp = this.fx.page.waitForResponse((res) => {
        const req = res.request();
        return req.url().includes('/api/user/data') && res.status() === 200 && req.method() === 'POST';
      });
    }
    
    const lResp = this.fx.page.waitForResponse((res) => {
      const req = res.request();
      return req.url().includes('/api/user/login') && req.method() === 'POST';
    });
    await dialog.locator('button[value="login"]').click();
    await lResp;
    console.log(`${LOG_PREFIX} Login response recieved`);
    
    if (!willFail) {
      await uResp;
      console.log(`${LOG_PREFIX} User data response recieved`);
      await expect(dialog).not.toBeAttached();
      await expect(this.getEl('.app')).toContainClass('is--loaded');
      await expect(this.getEl('.user-nav .username')).toContainText(user);
    }
    
    return dialog;
  }
  
  async moveNote(noteName, moveToPath, selector = '.item') {
    await (await this.getItemNav('note', selector, noteName)).move(moveToPath);
  }
  
  async updateUserCreds({ user, pass }) {
    await this.getUserBtn().click();
    await this.getEl('.user-nav :text-is("Profile")').click();
    const profileForm = this.getEl('.user-profile-form');
    const updateBtn = profileForm.locator('nav button:text-is("Update")');
    
    await expect(updateBtn).toBeDisabled();
    await profileForm.locator('[name="username"]').fill(user);
    await profileForm.locator('[name="password"]').fill(pass);
    await expect(updateBtn).toBeEnabled();
    await updateBtn.click();
    
    await this.getUserBtn().click();
    await this.getEl('.user-nav :text-is("Logout")').click();
    await this.logIn({ user, pass });
  }
  
  async waitForDataUpdate({ action, type }, fn) {
    const resp = this.fx.page.waitForResponse((res) => {
      const req = res.request();
      if (
        res.status() === 200
        && req.method() === 'POST'
        && req.url().includes('/api/user/data/set')
      ) {
        const data = req.postDataJSON();
        return data.action === action && data.type === type;
      }
    });
    await fn();
    const r = await resp;
    // This is only here to add a message in the Actions tab.
    await expect(r.status(), `[${action}:${type}] Request Complete`).toEqual(200);
  }
}

export const test = createTest({ FxClass: AppFixture, fxKey: 'app' });
export { expect };
