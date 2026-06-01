"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserWithRolesAndPermissions = getUserWithRolesAndPermissions;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.enableUser = enableUser;
exports.disableUser = disableUser;
exports.assignRolesToUser = assignRolesToUser;
exports.deleteUser = deleteUser;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
const password_1 = require("../utils/password");
const rbacService_1 = require("./rbacService");
const audit_1 = require("../utils/audit");
const authService_1 = require("./authService");
async function listUsers(params) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const where = { deleted_at: null };
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { username: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { display_name: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { email: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.User.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { total: count, items: rows };
}
async function getUserWithRolesAndPermissions(userId) {
    const user = await models_1.User.findOne({ where: { id: userId, deleted_at: null } });
    if (!user)
        return null;
    const userRoles = await models_1.UserRole.findAll({ where: { user_id: userId } });
    const roleIds = userRoles.map(ur => ur.role_id);
    const roles = roleIds.length
        ? await models_1.Role.findAll({ where: { id: { [sequelize_1.Op.in]: roleIds }, deleted_at: null } })
        : [];
    const permissions = await (0, rbacService_1.getUserPermissions)(userId);
    return { user, roles, permissions };
}
async function createUser(params) {
    const existing = await models_1.User.findOne({
        where: { username: params.username, deleted_at: null },
    });
    if (existing)
        throw new authService_1.AppError('CONFLICT', '用户名已存在');
    if (params.password.length < 6) {
        throw new authService_1.AppError('VALIDATION_ERROR', '密码长度不能少于6位');
    }
    const hashed = await (0, password_1.hashPassword)(params.password);
    const user = await models_1.User.create({
        id: (0, uuid_1.v4)(),
        username: params.username,
        password_hash: hashed,
        email: params.email ?? null,
        display_name: params.fullName ?? null,
        status: 'active',
        is_super_admin: false,
        created_by: params.operatorId,
        updated_by: params.operatorId,
    });
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'create_user',
        targetType: 'user',
        targetId: user.id,
        targetName: user.username,
        ipAddress: params.ipAddress,
    });
    return user;
}
async function updateUser(params) {
    const user = await models_1.User.findOne({ where: { id: params.userId, deleted_at: null } });
    if (!user)
        throw new authService_1.AppError('NOT_FOUND', '用户不存在');
    const updates = {
        updated_by: params.operatorId,
        updated_at: new Date(),
    };
    if (params.email !== undefined)
        updates.email = params.email;
    if (params.fullName !== undefined)
        updates.display_name = params.fullName;
    await models_1.User.update(updates, { where: { id: params.userId } });
    const updated = await models_1.User.findByPk(params.userId);
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'update_user',
        targetType: 'user',
        targetId: params.userId,
        ipAddress: params.ipAddress,
    });
    return updated;
}
async function enableUser(userId, operatorId, operatorUsername, ipAddress) {
    const user = await models_1.User.findOne({ where: { id: userId, deleted_at: null } });
    if (!user)
        throw new authService_1.AppError('NOT_FOUND', '用户不存在');
    await models_1.User.update({ status: 'active', updated_by: operatorId, updated_at: new Date() }, { where: { id: userId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'enable_user', targetType: 'user', targetId: userId, ipAddress });
}
async function disableUser(userId, operatorId, operatorUsername, ipAddress) {
    const user = await models_1.User.findOne({ where: { id: userId, deleted_at: null } });
    if (!user)
        throw new authService_1.AppError('NOT_FOUND', '用户不存在');
    if (user.is_super_admin)
        throw new authService_1.AppError('FORBIDDEN', '超级管理员不可禁用');
    if (userId === operatorId)
        throw new authService_1.AppError('FORBIDDEN', '不能禁用自己');
    await models_1.User.update({ status: 'disabled', updated_by: operatorId, updated_at: new Date() }, { where: { id: userId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'disable_user', targetType: 'user', targetId: userId, ipAddress });
}
async function assignRolesToUser(userId, roleIds, operatorId, operatorUsername, ipAddress) {
    const user = await models_1.User.findOne({ where: { id: userId, deleted_at: null } });
    if (!user)
        throw new authService_1.AppError('NOT_FOUND', '用户不存在');
    await models_1.UserRole.destroy({ where: { user_id: userId } });
    if (roleIds.length > 0) {
        const records = roleIds.map(roleId => ({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            role_id: roleId,
            created_by: operatorId,
            updated_by: operatorId,
        }));
        await models_1.UserRole.bulkCreate(records);
    }
    await (0, audit_1.logAudit)({
        userId: operatorId, action: 'assign_roles',
        targetType: 'user', targetId: userId, ipAddress,
    });
}
async function deleteUser(userId, operatorId, operatorUsername, ipAddress) {
    const user = await models_1.User.findOne({ where: { id: userId, deleted_at: null } });
    if (!user)
        throw new authService_1.AppError('NOT_FOUND', '用户不存在');
    if (user.is_super_admin)
        throw new authService_1.AppError('FORBIDDEN', '超级管理员不可删除');
    if (userId === operatorId)
        throw new authService_1.AppError('FORBIDDEN', '不能删除自己');
    await models_1.User.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: userId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'delete_user', targetType: 'user', targetId: userId, ipAddress });
}
//# sourceMappingURL=userService.js.map