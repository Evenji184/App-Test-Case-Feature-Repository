"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.logLogin = logLogin;
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
async function logAudit(params) {
    try {
        await models_1.AuditLog.create({
            id: (0, uuid_1.v4)(),
            user_id: params.userId ?? null,
            action: params.action,
            target_type: params.targetType ?? null,
            target_id: params.targetId ?? null,
            target_name: params.targetName ?? null,
            change_summary: params.detail ?? null,
            ip_address: params.ipAddress ?? null,
        });
    }
    catch (e) {
        console.error('[AuditLog] Failed to write audit log:', e);
    }
}
async function logLogin(params) {
    try {
        await models_1.LoginLog.create({
            id: (0, uuid_1.v4)(),
            user_id: params.userId ?? null,
            username: params.username,
            login_status: params.loginStatus,
            ip_address: params.ipAddress ?? null,
            user_agent: params.userAgent ?? null,
            failure_reason: params.failureReason ?? null,
        });
    }
    catch (e) {
        console.error('[LoginLog] Failed to write login log:', e);
    }
}
//# sourceMappingURL=audit.js.map