"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToken = createToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function createToken(userId, username) {
    return jsonwebtoken_1.default.sign({ sub: userId, username }, config_1.config.auth.secretKey, { expiresIn: `${config_1.config.auth.accessTokenExpireMinutes}m` });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, config_1.config.auth.secretKey);
}
//# sourceMappingURL=jwt.js.map