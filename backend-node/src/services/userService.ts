import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { User, Role, UserRole } from '../db/models';
import { hashPassword } from '../utils/password';
import { getUserPermissions } from './rbacService';
import { logAudit } from '../utils/audit';
import { AppError } from './authService';

export async function listUsers(params: {
  keyword?: string;
  page?: number;
  pageSize?: number;
}) {
  const { keyword, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = { deleted_at: null };
  if (keyword) {
    where[Op.or as unknown as string] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { display_name: { [Op.like]: `%${keyword}%` } },
      { email: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { count, rows } = await User.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { total: count, items: rows };
}

export async function getUserWithRolesAndPermissions(userId: string) {
  const user = await User.findOne({ where: { id: userId, deleted_at: null } });
  if (!user) return null;

  const userRoles = await UserRole.findAll({ where: { user_id: userId } });
  const roleIds = userRoles.map(ur => ur.role_id);
  const roles = roleIds.length
    ? await Role.findAll({ where: { id: { [Op.in]: roleIds }, deleted_at: null } })
    : [];

  const permissions = await getUserPermissions(userId);

  return { user, roles, permissions };
}

export async function createUser(params: {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const existing = await User.findOne({
    where: { username: params.username, deleted_at: null },
  });
  if (existing) throw new AppError('CONFLICT', '用户名已存在');

  if (params.password.length < 6) {
    throw new AppError('VALIDATION_ERROR', '密码长度不能少于6位');
  }

  const hashed = await hashPassword(params.password);
  const user = await User.create({
    id: uuidv4(),
    username: params.username,
    password_hash: hashed,
    email: params.email ?? null,
    display_name: params.fullName ?? null,
    status: 'active',
    is_super_admin: false,
    created_by: params.operatorId,
    updated_by: params.operatorId,
  });

  await logAudit({
    userId: params.operatorId,
    action: 'create_user',
    targetType: 'user',
    targetId: user.id,
    targetName: user.username,
    ipAddress: params.ipAddress,
  });

  return user;
}

export async function updateUser(params: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const user = await User.findOne({ where: { id: params.userId, deleted_at: null } });
  if (!user) throw new AppError('NOT_FOUND', '用户不存在');

  const updates: Partial<User['_attributes']> = {
    updated_by: params.operatorId,
    updated_at: new Date(),
  };
  if (params.email !== undefined) updates.email = params.email;
  if (params.fullName !== undefined) updates.display_name = params.fullName;

  await User.update(updates, { where: { id: params.userId } });
  const updated = await User.findByPk(params.userId);

  await logAudit({
    userId: params.operatorId,
    action: 'update_user',
    targetType: 'user',
    targetId: params.userId,
    ipAddress: params.ipAddress,
  });

  return updated!;
}

export async function enableUser(userId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const user = await User.findOne({ where: { id: userId, deleted_at: null } });
  if (!user) throw new AppError('NOT_FOUND', '用户不存在');

  await User.update({ status: 'active', updated_by: operatorId, updated_at: new Date() }, { where: { id: userId } });
  await logAudit({ userId: operatorId, action: 'enable_user', targetType: 'user', targetId: userId, ipAddress });
}

export async function disableUser(userId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const user = await User.findOne({ where: { id: userId, deleted_at: null } });
  if (!user) throw new AppError('NOT_FOUND', '用户不存在');
  if (user.is_super_admin) throw new AppError('FORBIDDEN', '超级管理员不可禁用');
  if (userId === operatorId) throw new AppError('FORBIDDEN', '不能禁用自己');

  await User.update({ status: 'disabled', updated_by: operatorId, updated_at: new Date() }, { where: { id: userId } });
  await logAudit({ userId: operatorId, action: 'disable_user', targetType: 'user', targetId: userId, ipAddress });
}

export async function assignRolesToUser(
  userId: string,
  roleIds: string[],
  operatorId: string,
  operatorUsername: string,
  ipAddress?: string
) {
  const user = await User.findOne({ where: { id: userId, deleted_at: null } });
  if (!user) throw new AppError('NOT_FOUND', '用户不存在');

  await UserRole.destroy({ where: { user_id: userId } });
  if (roleIds.length > 0) {
    const records = roleIds.map(roleId => ({
      id: uuidv4(),
      user_id: userId,
      role_id: roleId,
      created_by: operatorId,
      updated_by: operatorId,
    }));
    await UserRole.bulkCreate(records);
  }

  await logAudit({
    userId: operatorId, action: 'assign_roles',
    targetType: 'user', targetId: userId, ipAddress,
  });
}

export async function batchGetUsersWithRoles(userIds: string[]): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();
  const userRoles = await UserRole.findAll({ where: { user_id: { [Op.in]: userIds } } });
  const roleIds = [...new Set(userRoles.map(ur => ur.role_id))];
  if (roleIds.length > 0) {
    await Role.findAll({ where: { id: { [Op.in]: roleIds }, deleted_at: null } });
  }
  const map = new Map<string, string[]>();
  for (const ur of userRoles) {
    if (!map.has(ur.user_id)) map.set(ur.user_id, []);
    map.get(ur.user_id)!.push(ur.role_id);
  }
  return map;
}

export async function deleteUser(userId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const user = await User.findOne({ where: { id: userId, deleted_at: null } });
  if (!user) throw new AppError('NOT_FOUND', '用户不存在');
  if (user.is_super_admin) throw new AppError('FORBIDDEN', '超级管理员不可删除');
  if (userId === operatorId) throw new AppError('FORBIDDEN', '不能删除自己');

  await User.update(
    { deleted_at: new Date(), updated_by: operatorId },
    { where: { id: userId } }
  );
  await logAudit({ userId: operatorId, action: 'delete_user', targetType: 'user', targetId: userId, ipAddress });
}
