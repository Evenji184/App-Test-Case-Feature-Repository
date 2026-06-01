"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissions = getUserPermissions;
exports.userHasPermission = userHasPermission;
exports.getPermissionTree = getPermissionTree;
const sequelize_1 = require("sequelize");
const models_1 = require("../db/models");
async function getUserPermissions(userId) {
    const user = await models_1.User.findByPk(userId);
    if (!user)
        return [];
    if (user.is_super_admin)
        return ['*'];
    const userRoles = await models_1.UserRole.findAll({ where: { user_id: userId } });
    if (!userRoles.length)
        return [];
    const roleIds = userRoles.map(ur => ur.role_id);
    const activeRoles = await models_1.Role.findAll({
        where: { id: { [sequelize_1.Op.in]: roleIds }, status: 'active', deleted_at: null },
    });
    if (!activeRoles.length)
        return [];
    const activeRoleIds = activeRoles.map(r => r.id);
    const rolePerms = await models_1.RolePermission.findAll({
        where: { role_id: { [sequelize_1.Op.in]: activeRoleIds } },
    });
    if (!rolePerms.length)
        return [];
    const permIds = rolePerms.map(rp => rp.permission_id);
    const permissions = await models_1.Permission.findAll({
        where: { id: { [sequelize_1.Op.in]: permIds }, deleted_at: null },
    });
    return permissions.map(p => p.code);
}
function userHasPermission(permCodes, required) {
    if (permCodes.includes('*'))
        return true;
    return permCodes.includes(required);
}
async function getPermissionTree() {
    const permissions = await models_1.Permission.findAll({
        where: { deleted_at: null },
        order: [['module', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']],
    });
    const moduleMap = new Map();
    for (const perm of permissions) {
        if (!moduleMap.has(perm.module)) {
            moduleMap.set(perm.module, new Map());
        }
        const resourceMap = moduleMap.get(perm.module);
        if (!resourceMap.has(perm.resource)) {
            resourceMap.set(perm.resource, []);
        }
        resourceMap.get(perm.resource).push(perm);
    }
    const result = [];
    for (const [module, resourceMap] of moduleMap) {
        const resources = [];
        for (const [resource, actions] of resourceMap) {
            resources.push({
                resource,
                actions: actions.map(p => ({
                    id: p.id,
                    name: p.name,
                    code: p.code,
                    action: p.action,
                    description: p.description,
                })),
            });
        }
        result.push({ module, resources });
    }
    return result;
}
//# sourceMappingURL=rbacService.js.map