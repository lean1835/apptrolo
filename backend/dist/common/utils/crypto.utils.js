"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
const encrypt = (text, secret) => {
    try {
        const iv = crypto_1.default.randomBytes(16);
        const key = crypto_1.default.createHash('sha256').update(secret).digest();
        const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    }
    catch (error) {
        logger_1.logger.error('Encryption failed:', error);
        return null;
    }
};
exports.encrypt = encrypt;
const decrypt = (encryptedData, secret) => {
    try {
        const parts = encryptedData.split(':'); // iv:content
        if (parts.length !== 2)
            return null;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = Buffer.from(parts[1], 'hex');
        const key = crypto_1.default.createHash('sha256').update(secret).digest();
        const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    catch (error) {
        logger_1.logger.error('Decryption failed:', error);
        return null;
    }
};
exports.decrypt = decrypt;
