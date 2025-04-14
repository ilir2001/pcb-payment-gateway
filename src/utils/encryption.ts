import CryptoJS from 'crypto-js';

export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}