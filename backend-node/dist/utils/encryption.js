"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptApiKey = encryptApiKey;
exports.decryptApiKey = decryptApiKey;
exports.maskApiKey = maskApiKey;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
/**
 * Python Fernet 格式兼容加密/解密
 * Fernet 使用 AES-128-CBC + HMAC-SHA256
 * key 派生: SHA-256(SECRET_KEY) 的前32字节 → base64url 编码作为 Fernet key
 *
 * Fernet token 格式 (全部 base64url 编码):
 * version(1) + timestamp(8) + iv(16) + ciphertext(n*16) + hmac(32)
 */
function getFernetKey() {
    const digest = crypto_1.default.createHash('sha256').update(config_1.config.auth.secretKey).digest();
    // Fernet key: base64url(digest) - 前16字节用于签名(HMAC), 后16字节用于加密(AES-128)
    // 实际上 Fernet 将32字节 key 拆分: 前16字节 = signing key, 后16字节 = encryption key
    return {
        signingKey: digest.subarray(0, 16),
        encryptionKey: digest.subarray(16, 32),
    };
}
function base64UrlDecode(s) {
    // base64url → base64
    const base64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return Buffer.from(padded, 'base64');
}
function base64UrlEncode(buf) {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function encryptApiKey(plaintext) {
    const { signingKey, encryptionKey } = getFernetKey();
    const iv = crypto_1.default.randomBytes(16);
    const timestamp = Buffer.alloc(8);
    const now = Math.floor(Date.now() / 1000);
    timestamp.writeUInt32BE(Math.floor(now / 0x100000000), 0);
    timestamp.writeUInt32BE(now >>> 0, 4);
    const cipher = crypto_1.default.createCipheriv('aes-128-cbc', encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const version = Buffer.from([0x80]);
    const payload = Buffer.concat([version, timestamp, iv, encrypted]);
    const hmac = crypto_1.default.createHmac('sha256', signingKey).update(payload).digest();
    const token = Buffer.concat([payload, hmac]);
    return base64UrlEncode(token);
}
function decryptApiKey(token) {
    const { signingKey, encryptionKey } = getFernetKey();
    const data = base64UrlDecode(token);
    if (data.length < 57) {
        throw new Error('Invalid Fernet token: too short');
    }
    const payload = data.subarray(0, data.length - 32);
    const hmacReceived = data.subarray(data.length - 32);
    const hmacExpected = crypto_1.default.createHmac('sha256', signingKey).update(payload).digest();
    if (!crypto_1.default.timingSafeEqual(hmacReceived, hmacExpected)) {
        throw new Error('Invalid Fernet token: HMAC mismatch');
    }
    const iv = data.subarray(9, 25);
    const ciphertext = data.subarray(25, data.length - 32);
    const decipher = crypto_1.default.createDecipheriv('aes-128-cbc', encryptionKey, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
}
function maskApiKey(plaintext) {
    if (plaintext.length <= 7)
        return '****';
    return `${plaintext.slice(0, 3)}****${plaintext.slice(-4)}`;
}
//# sourceMappingURL=encryption.js.map