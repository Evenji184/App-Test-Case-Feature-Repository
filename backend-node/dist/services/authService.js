"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.authenticate = authenticate;
exports.resetPassword = resetPassword;
exports.changeMyPassword = changeMyPassword;
const models_1 = require("../db/models");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const rbacService_1 = require("./rbacService");
const audit_1 = require("../utils/audit");
class AppError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.AppError = AppError;
async function authenticate(username, password, ipAddress, userAgent) {
    const user = await models_1.User.findOne({
        where: { username, deleted_at: null },
    });
    if (!user) {
        await (0, audit_1.logLogin)({ username, loginStatus: 'failed', ipAddress, userAgent, failureReason: '用户不存在' });
        throw new AppError('UNAUTHORIZED', '用户名或密码错误');
    }
    const valid = await (0, password_1.verifyPassword)(password, user.password_hash);
    if (!valid) {
        await (0, audit_1.logLogin)({ userId: user.id, username, loginStatus: 'failed', ipAddress, userAgent, failureReason: '密码错误' });
        throw new AppError('UNAUTHORIZED', '用户名或密码错误');
    }
    if (user.status !== 'active') {
        await (0, audit_1.logLogin)({ userId: user.id, username, loginStatus: 'failed', ipAddress, userAgent, failureReason: '账号已禁用' });
        throw new AppError('FORBIDDEN', '账号已禁用');
    }
    await models_1.User.update({ last_login_at: new Date(), last_login_ip: ipAddress ?? null }, { where: { id: user.id } });
    const permissions = await (0, rbacService_1.getUserPermissions)(user.id);
    const token = (0, jwt_1.createToken)(user.id, user.username);
    await (0, audit_1.logLogin)({ userId: user.id, username, loginStatus: 'success', ipAddress, userAgent });
    await (0, audit_1.logAudit)({ userId: user.id, action: 'login', ipAddress });
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            fullName: user.display_name,
            email: user.email,
            avatar: user.avatar_url,
            isSuperAdmin: user.is_super_admin,
            permissions,
        },
    };
}
async function resetPassword(userId, newPassword, operatorId, operatorUsername, ipAddress) {
    if (newPassword.length < 6) {
        throw new AppError('VALIDATION_ERROR', '密码长度不能少于6位');
    }
    const hashed = await (0, password_1.hashPassword)(newPassword);
    await models_1.User.update({ password_hash: hashed, updated_by: operatorId }, { where: { id: userId } });
    await (0, audit_1.logAudit)({
        userId: operatorId,
        action: 'reset_password',
        targetType: 'user',
        targetId: userId,
        ipAddress,
    });
}
async function changeMyPassword(userId, oldPassword, newPassword) {
    if (newPassword.length < 6) {
        throw new AppError('VALIDATION_ERROR', '新密码长度不能少于6位');
    }
    const user = await models_1.User.findByPk(userId);
    if (!user)
        throw new AppError('NOT_FOUND', '用户不存在');
    const valid = await (0, password_1.verifyPassword)(oldPassword, user.password_hash);
    if (!valid)
        throw new AppError('UNAUTHORIZED', '原密码错误');
    const hashed = await (0, password_1.hashPassword)(newPassword);
    await models_1.User.update({ password_hash: hashed, updated_by: userId }, { where: { id: userId } });
}
//# sourceMappingURL=authService.js.map