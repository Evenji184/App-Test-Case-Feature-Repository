import { Op } from 'sequelize';
import { User, Role, Permission, UserRole, RolePermission } from '../db/models';

export interface PermissionTree {
  module: string;
  resources: {
    resource: string;
    actions: {
      id: string;
      name: string;
      code: string;
      action: string;
      description: string | null;
    }[];
  }[];
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await User.findByPk(userId);
  if (!user) return [];
  if (user.is_super_admin) return ['*'];

  const userRoles = await UserRole.findAll({ where: { user_id: userId } });
  if (!userRoles.length) return [];

  const roleIds = userRoles.map(ur => ur.role_id);
  const activeRoles = await Role.findAll({
    where: { id: { [Op.in]: roleIds }, status: 'active', deleted_at: null },
  });
  if (!activeRoles.length) return [];

  const activeRoleIds = activeRoles.map(r => r.id);
  const rolePerms = await RolePermission.findAll({
    where: { role_id: { [Op.in]: activeRoleIds } },
  });
  if (!rolePerms.length) return [];

  const permIds = rolePerms.map(rp => rp.permission_id);
  const permissions = await Permission.findAll({
    where: { id: { [Op.in]: permIds }, deleted_at: null },
  });

  return permissions.map(p => p.code);
}

export function userHasPermission(permCodes: string[], required: string): boolean {
  if (permCodes.includes('*')) return true;
  return permCodes.includes(required);
}

export async function getPermissionTree(): Promise<PermissionTree[]> {
  const permissions = await Permission.findAll({
    where: { deleted_at: null },
    order: [['module', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']],
  });

  const moduleMap = new Map<string, Map<string, typeof permissions>>();
  for (const perm of permissions) {
    if (!moduleMap.has(perm.module)) {
      moduleMap.set(perm.module, new Map());
    }
    const resourceMap = moduleMap.get(perm.module)!;
    if (!resourceMap.has(perm.resource)) {
      resourceMap.set(perm.resource, []);
    }
    resourceMap.get(perm.resource)!.push(perm);
  }

  const result: PermissionTree[] = [];
  for (const [module, resourceMap] of moduleMap) {
    const resources = [];
    for (const [resource, actions] of resourceMap) {
      resources.push({
        resource,
        actions: actions.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          module: p.module,
          resource: p.resource,
          action: p.action,
          description: p.description,
        })),
      });
    }
    result.push({ module, resources });
  }
  return result;
}
