"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requirePermission = requirePermission;
exports.makeErrorResult = makeErrorResult;
const authService_1 = require("../services/authService");
const rbacService_1 = require("../services/rbacService");
function requireAuth(ctx) {
    if (!ctx.userId) {
        throw new authService_1.AppError('UNAUTHORIZED', '请先登录');
    }
}
function requirePermission(ctx, permission) {
    requireAuth(ctx);
    if (!(0, rbacService_1.userHasPermission)(ctx.permissionCodes, permission)) {
        throw new authService_1.AppError('FORBIDDEN', '权限不足');
    }
}
function makeErrorResult(err) {
    if (err instanceof authService_1.AppError) {
        return {
            success: false,
            message: err.message,
            error: { code: err.code, message: err.message },
        };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
        success: false,
        message: msg,
        error: { code: 'INTERNAL_ERROR', message: msg },
    };
}
//# sourceMappingURL=helpers.js.map