import {
  CRYPT__IV_LENGTH,
} from './constants.js';
const LOG_PREFIX = '[CRYPT]';
const PASSWORD_BASED_KEY_VERSION = 'PBKDF2';
const enc = new TextEncoder();
const dec = new TextDecoder();

const getPasswordKey = (password) => {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    PASSWORD_BASED_KEY_VERSION,
    false,
    ['deriveKey']
  );
}

const deriveKey = (passwordKey, salt, keyUsage) => {
  return crypto.subtle.deriveKey(
    {
      name: PASSWORD_BASED_KEY_VERSION,
      salt,
      iterations: 250000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    keyUsage
  );
}

export const bufferToBase64 = (buff) => btoa(String.fromCharCode.apply(null, buff));
export const base64ToBuffer = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));

export async function encrypt({ iv, salt }, data, password) {
  try {
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ['encrypt']);
    const encryptedContent = await crypto.subtle.encrypt(
      { iv, name: 'AES-GCM' },
      aesKey,
      enc.encode(data)
    );
    
    const encryptedContentArr = new Uint8Array(encryptedContent);
    const buff = new Uint8Array(
      iv.byteLength + encryptedContentArr.byteLength
    );
    buff.set(iv, 0);
    buff.set(encryptedContentArr, iv.byteLength);
    const result = bufferToBase64(buff);
    
    if (!result) throw Error(`${LOG_PREFIX} No data generated`);
    
    return result;
  }
  catch (err) {
    throw Error(`${LOG_PREFIX} Encryption failed: \n${err}`)
  }
}

export async function decrypt({ iv, salt }, encryptedData, password) {
  try {
    const encryptedDataBuff = base64ToBuffer(encryptedData);
    const data = encryptedDataBuff.slice(CRYPT__IV_LENGTH);
    const passwordKey = await getPasswordKey(password);
    const aesKey = await deriveKey(passwordKey, salt, ['decrypt']);
    const decryptedContent = await crypto.subtle.decrypt(
      { iv, name: 'AES-GCM' },
      aesKey,
      data
    );
    return dec.decode(decryptedContent);
  }
  catch (err) {
    throw Error(`${LOG_PREFIX} Decryption failed: \n${err}`);
  }
}
