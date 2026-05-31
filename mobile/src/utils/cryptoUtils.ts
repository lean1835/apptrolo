import CryptoJS from "crypto-js";
import { APP_CONFIG } from "../constants";

/**
 * Mã hóa payload bằng thuật toán AES-256-CBC.
 * Trả về chuỗi định dạng: "iv_hex:encrypted_content_hex".
 * Khớp hoàn toàn với tiêu chuẩn bảo mật trong SkillFE.md.
 */
export const encryptData = (data: any, secret = APP_CONFIG.CRYPTO_SECRET): string => {
  if (!secret) {
    console.warn("Crypto Secret Key is not configured!");
    return typeof data === "string" ? data : JSON.stringify(data);
  }
  
  const key = CryptoJS.SHA256(secret);
  const iv = CryptoJS.lib.WordArray.random(16);
  const dataToEncrypt = typeof data === "string" ? data : JSON.stringify(data);

  const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};
