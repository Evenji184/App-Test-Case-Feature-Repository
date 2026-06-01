"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
function requestLogger(req, res, next) {
    const startTime = Date.now();
    const requestId = (0, uuid_1.v4)();
    res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        const userId = req.userId ?? null;
        models_1.RequestLog.create({
            id: (0, uuid_1.v4)(),
            request_id: requestId,
            method: req.method,
            path: req.path,
            ip_address: req.ip || req.socket?.remoteAddress || null,
            user_id: userId,
            response_status: res.statusCode,
            duration_ms: durationMs,
            user_agent: req.headers['user-agent'] || null,
            created_at: new Date(),
        }).catch(() => {
            // silently ignore log write failures
        });
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map