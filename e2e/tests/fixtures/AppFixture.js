import { BASE_DATA_NODE } from '@src/constants';
import BaseFixture, { createTest, expect } from './BaseFixture';

export const CREDS__PASS = 'pass';
export const CREDS__USER = 'user';
const LOG_PREFIX = '[AppFixture]';
export const PATH__DATA = `/e2e/mnt/data`;
const SELECTOR__LOGIN_FORM = '.login-form';

class AppFixture extends BaseFixture {
  constructor({ browser, context, page, testCtx, testInfo }) {
    super({ browser, context, page, testCtx, testInfo });
    
    // `visibilitychange` doesn't work when creating new pages. All pages are
    // considered active and don't go into a background state. This is a known
    // issue/feature: https://github.com/microsoft/playwright/issues/3570.
    // This hack, gets around that for now.
    this.pageVisibility = {
      hide: () => this.pageVisibility.toggle('hide'),
      show: () => this.pageVisibility.toggle('show'),
      toggle: (state) => {
        return this.fx.page.evaluate((state) => {
          Object.defineProperty(document, 'visibilityState', { value: (state === 'hide') ? 'hidden' : 'visible', writable: true });
          Object.defineProperty(document, 'hidden', { value: state === 'hide', writable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        }, state);
      },
    };
  }
  
  async clearStorage() {
    await this.fx.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }
  
  async createConfig() {
    await this.getElBySelector('input[name="cipherKey"]').fill('zeffer');
    await this.getElBySelector('input[name="salt"]').fill('pepper');
    await this.fx.screenshot('[config] filled out');
    await this.getElBySelector('button[value="create"]').click();
    
    await this.waitForDialog(SELECTOR__LOGIN_FORM);
  }
  
  async createUser({ user, pass } = {}) {
    let dialog = await this.waitForDialog(SELECTOR__LOGIN_FORM);
    await dialog.locator('button[value="create"]').click();
    await expect(dialog).not.toBeAttached();
    
    dialog = await this.waitForDialog('.create-form');
    await dialog.locator('[name="username"]').fill(user);
    await dialog.locator('[name="password"]').fill(pass);
    await dialog.locator('[name="passwordConfirmed"]').fill(pass);
    await this.fx.screenshot('[create_user] filled out');
    await dialog.locator('button[value="create"]').click();
    await expect(dialog).not.toBeAttached();
    
    await this.waitForDialog(SELECTOR__LOGIN_FORM);
  }
  
  async deleteGroup(groupName, selector = '.group') {
    await (await this.getItemNav('group', selector, groupName)).delete();
  }
  
  async deleteNote(noteName, selector = '.item') {
    await (await this.getItemNav('note', selector, noteName)).delete();
  }
  
  async deleteUserData() {
    await this.exec(`rm -rf ${PATH__DATA}/data_*.json`);
    console.log(`${LOG_PREFIX} [DELETED] User data`);
    await this.fx.page.reload();
  }
  
  async getItemNav(type, selector, itemName) {
    const labelSelector = type === 'group' ? '.group__name-text' : '.item__label-text';
    const parentSelector = type === 'group' ? '.group' : '.item';
    const _selector = `${selector} ${labelSelector}`;
    const label = this.getElBySelector(`${selector} ${labelSelector}:text-is("${itemName}")`);
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
          const resp = this.fx.page.waitForResponse((res) => {
            const req = res.request();
            if (
              res.status() === 200
              && req.method() === 'POST'
              && req.url().includes('/api/user/data/set')
            ) {
              return req.postDataJSON().action === 'delete';
            }
          });
          
          await subNav.locator('.modify-nav [title="Delete"]').click();
          await this.getElBySelector('.delete-form__btm-nav :text-is("Yes")').click();
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
              return req.postDataJSON().action === 'move';
            }
          });
          
          await subNav.locator('.modify-nav [title="Move"]').click();
          await this.getElBySelector('.move-to .group__name')
            .filter({
              has: this.getElBySelector(`.group__name-text:text-is("${moveToPath}")`),
            })
            .locator('.move-nav :text-is("Here")')
            .click();
          await this.getElBySelector('.move-to__btm-nav :text-is("Move")').click();
          await resp;
          await expect(this.getElBySelector('.move-to')).not.toBeAttached();
        }
        else console.log(`${LOG_PREFIX} Skipping move, no nav found`);
      },
    };
  }
  
  async loadNotePage(noteName, parentPath = BASE_DATA_NODE) {
    await this.loadPage(`?note=${encodeURIComponent(`${parentPath}/${noteName}`.toLowerCase().replaceAll(' ', '-'))}`);
    await expect(this.getElBySelector('.full-note')).toHaveCount(1);
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
      await expect(this.getElBySelector('.app')).toContainClass('is--loaded');
    }
    
    return dialog;
  }
  
  async moveNote(noteName, moveToPath, selector = '.item') {
    await (await this.getItemNav('note', selector, noteName)).move(moveToPath);
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
