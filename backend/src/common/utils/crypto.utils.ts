import crypto from 'crypto';
import { logger } from './logger';

export const encrypt = (text: string, secret: string): string | null => {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(secret).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    logger.error('Encryption failed:', error);
    return null;
  }
};

export const decrypt = (encryptedData: string, secret: string): string | null => {
  try {
    const parts = encryptedData.split(':'); // iv:content
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const key = crypto.createHash('sha256').update(secret).digest();

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  } catch (error) {
    logger.error('Decryption failed:', error);
    return null;
  }
};
