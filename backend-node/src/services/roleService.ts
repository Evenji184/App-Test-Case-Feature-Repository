import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Role, Permission, RolePermission } from '../db/models';
import { logAudit } from '../utils/audit';
import { AppError } from './authService';

export async function listRoles(params: { keyword?: string; page?: number; pageSize?: number }) {
  const { keyword, page = 1, pageSize = 50 } = params;
  const where: Record<string, unknown> = { deleted_at: null };
  if (keyword) {
    where[Op.or as unknown as string] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { code: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { count, rows } = await Role.findAndCountAll({
    where,
    order: [['created_at', 'ASC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { total: count, items: rows };
}

export async function getRoleWithPermissions(roleId: string) {
  const role = await Role.findOne({ where: { id: roleId, deleted_at: null } });
  if (!role) return null;

  const rolePerms = await RolePermission.findAll({ where: { role_id: roleId } });
  const permIds = rolePerms.map(rp => rp.permission_id);
  const permissions = permIds.length
    ? await Permission.findAll({ where: { id: { [Op.in]: permIds }, deleted_at: null } })
    : [];

  return { role, permissions };
}

export async function createRole(params: {
  name: string;
  code: string;
  description?: string;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const existing = await Role.findOne({ where: { code: params.code, deleted_at: null } });
  if (existing) throw new AppError('CONFLICT', '角色代码已存在');

  const role = await Role.create({
    id: uuidv4(),
    name: params.name,
    code: params.code,
    description: params.description ?? null,
    is_system: false,
    status: 'active',
    created_by: params.operatorId,
    updated_by: params.operatorId,
  });

  await logAudit({
    userId: params.operatorId,
    action: 'create_role', targetType: 'role', targetId: role.id, targetName: role.name,
    ipAddress: params.ipAddress,
  });
  return role;
}

export async function updateRole(params: {
  roleId: string;
  name?: string;
  description?: string | null;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const role = await Role.findOne({ where: { id: params.roleId, deleted_at: null } });
  if (!role) throw new AppError('NOT_FOUND', '角色不存在');
  if (role.is_system) throw new AppError('FORBIDDEN', '系统内置角色不可修改');

  const updates: Record<string, unknown> = { updated_by: params.operatorId, updated_at: new Date() };
  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;

  await Role.update(updates, { where: { id: params.roleId } });
  const updated = await Role.findByPk(params.roleId);

  await logAudit({
    userId: params.operatorId,
    action: 'update_role', targetType: 'role', targetId: params.roleId,
    ipAddress: params.ipAddress,
  });
  return updated!;
}

export async function assignPermissionsToRole(
  roleId: string,
  permissionIds: string[],
  operatorId: string,
  operatorUsername: string,
  ipAddress?: string
) {
  const role = await Role.findOne({ where: { id: roleId, deleted_at: null } });
  if (!role) throw new AppError('NOT_FOUND', '角色不存在');
  if (role.is_system) throw new AppError('FORBIDDEN', '系统内置角色权限不可修改');

  await RolePermission.destroy({ where: { role_id: roleId } });
  if (permissionIds.length > 0) {
    const records = permissionIds.map(permId => ({
      id: uuidv4(),
      role_id: roleId,
      permission_id: permId,
      created_by: operatorId,
      updated_by: operatorId,
    }));
    await RolePermission.bulkCreate(records);
  }

  await logAudit({
    userId: operatorId, action: 'assign_permissions',
    targetType: 'role', targetId: roleId, ipAddress,
  });
}

export async function batchGetRolesWithPermissions(roleIds: string[]): Promise<Map<string, string[]>> {
  if (roleIds.length === 0) return new Map();
  const rolePerms = await RolePermission.findAll({ where: { role_id: { [Op.in]: roleIds } } });
  const permIds = [...new Set(rolePerms.map(rp => rp.permission_id))];
  if (permIds.length > 0) {
    await Permission.findAll({ where: { id: { [Op.in]: permIds }, deleted_at: null } });
  }
  const map = new Map<string, string[]>();
  for (const rp of rolePerms) {
    if (!map.has(rp.role_id)) map.set(rp.role_id, []);
    map.get(rp.role_id)!.push(rp.permission_id);
  }
  return map;
}

export async function deleteRole(roleId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const role = await Role.findOne({ where: { id: roleId, deleted_at: null } });
  if (!role) throw new AppError('NOT_FOUND', '角色不存在');
  if (role.is_system) throw new AppError('FORBIDDEN', '系统内置角色不可删除');

  await Role.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: roleId } });
  await logAudit({ userId: operatorId, action: 'delete_role', targetType: 'role', targetId: roleId, ipAddress });
}
