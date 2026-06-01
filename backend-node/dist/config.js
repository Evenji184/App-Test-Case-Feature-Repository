"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
exports.config = {
    app: {
        name: process.env.APP_NAME || 'APP Feature Repository Backend',
        version: process.env.APP_VERSION || '1.0.0',
        env: process.env.ENVIRONMENT || 'development',
        debug: process.env.DEBUG === 'true',
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT || '8001', 10),
    },
    auth: {
        secretKey: process.env.SECRET_KEY || 'change-this-secret-in-production',
        jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
        accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '60', 10),
    },
    database: {
        url: process.env.DATABASE_URL || 'mysql://evenji:evenji@localhost:3306/app_feature_repository',
    },
    cors: {
        origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(s => s.trim()),
    },
    security: {
        ipWhitelist: process.env.IP_WHITELIST
            ? process.env.IP_WHITELIST.split(',').map(s => s.trim()).filter(Boolean)
            : [],
    },
};
//# sourceMappingURL=config.js.map