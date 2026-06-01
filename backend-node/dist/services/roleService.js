"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRoles = listRoles;
exports.getRoleWithPermissions = getRoleWithPermissions;
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.assignPermissionsToRole = assignPermissionsToRole;
exports.deleteRole = deleteRole;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
const audit_1 = require("../utils/audit");
const authService_1 = require("./authService");
async function listRoles(params) {
    const { keyword, page = 1, pageSize = 50 } = params;
    const where = { deleted_at: null };
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.Role.findAndCountAll({
        where,
        order: [['created_at', 'ASC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { total: count, items: rows };
}
async function getRoleWithPermissions(roleId) {
    const role = await models_1.Role.findOne({ where: { id: roleId, deleted_at: null } });
    if (!role)
        return null;
    const rolePerms = await models_1.RolePermission.findAll({ where: { role_id: roleId } });
    const permIds = rolePerms.map(rp => rp.permission_id);
    const permissions = permIds.length
        ? await models_1.Permission.findAll({ where: { id: { [sequelize_1.Op.in]: permIds }, deleted_at: null } })
        : [];
    return { role, permissions };
}
async function createRole(params) {
    const existing = await models_1.Role.findOne({ where: { code: params.code, deleted_at: null } });
    if (existing)
        throw new authService_1.AppError('CONFLICT', '角色代码已存在');
    const role = await models_1.Role.create({
        id: (0, uuid_1.v4)(),
        name: params.name,
        code: params.code,
        description: params.description ?? null,
        is_system: false,
        status: 'active',
        created_by: params.operatorId,
        updated_by: params.operatorId,
    });
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'create_role', targetType: 'role', targetId: role.id, targetName: role.name,
        ipAddress: params.ipAddress,
    });
    return role;
}
async function updateRole(params) {
    const role = await models_1.Role.findOne({ where: { id: params.roleId, deleted_at: null } });
    if (!role)
        throw new authService_1.AppError('NOT_FOUND', '角色不存在');
    if (role.is_system)
        throw new authService_1.AppError('FORBIDDEN', '系统内置角色不可修改');
    const updates = { updated_by: params.operatorId, updated_at: new Date() };
    if (params.name !== undefined)
        updates.name = params.name;
    if (params.description !== undefined)
        updates.description = params.description;
    await models_1.Role.update(updates, { where: { id: params.roleId } });
    const updated = await models_1.Role.findByPk(params.roleId);
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'update_role', targetType: 'role', targetId: params.roleId,
        ipAddress: params.ipAddress,
    });
    return updated;
}
async function assignPermissionsToRole(roleId, permissionIds, operatorId, operatorUsername, ipAddress) {
    const role = await models_1.Role.findOne({ where: { id: roleId, deleted_at: null } });
    if (!role)
        throw new authService_1.AppError('NOT_FOUND', '角色不存在');
    if (role.is_system)
        throw new authService_1.AppError('FORBIDDEN', '系统内置角色权限不可修改');
    await models_1.RolePermission.destroy({ where: { role_id: roleId } });
    if (permissionIds.length > 0) {
        const records = permissionIds.map(permId => ({
            id: (0, uuid_1.v4)(),
            role_id: roleId,
            permission_id: permId,
            created_by: operatorId,
            updated_by: operatorId,
        }));
        await models_1.RolePermission.bulkCreate(records);
    }
    await (0, audit_1.logAudit)({
        userId: operatorId, action: 'assign_permissions',
        targetType: 'role', targetId: roleId, ipAddress,
    });
}
async function deleteRole(roleId, operatorId, operatorUsername, ipAddress) {
    const role = await models_1.Role.findOne({ where: { id: roleId, deleted_at: null } });
    if (!role)
        throw new authService_1.AppError('NOT_FOUND', '角色不存在');
    if (role.is_system)
        throw new authService_1.AppError('FORBIDDEN', '系统内置角色不可删除');
    await models_1.Role.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: roleId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'delete_role', targetType: 'role', targetId: roleId, ipAddress });
}
//# sourceMappingURL=roleService.js.map