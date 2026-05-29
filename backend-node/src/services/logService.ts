import { Op } from 'sequelize';
import { AuditLog, RequestLog, LoginLog, User } from '../db/models';

export async function listAuditLogs(params: {
  keyword?: string;
  action?: string;
  operatorId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { keyword, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = {};
  if (params.operatorId) where.user_id = params.operatorId;
  if (params.action) where.action = params.action;
  if (keyword) {
    where[Op.or as unknown as string] = [
      { action: { [Op.like]: `%${keyword}%` } },
      { target_name: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean) as string[])];
  const users = userIds.length
    ? await User.findAll({ where: { id: { [Op.in]: userIds } } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const items = rows.map(l => ({
    ...l.toJSON(),
    operatorUsername: l.user_id ? (userMap.get(l.user_id)?.username ?? null) : null,
  }));

  return { total: count, items };
}

export async function listRequestLogs(params: {
  keyword?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { keyword, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = {};
  if (params.userId) where.user_id = params.userId;
  if (keyword) {
    where[Op.or as unknown as string] = [
      { path: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { count, rows } = await RequestLog.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean) as string[])];
  const users = userIds.length
    ? await User.findAll({ where: { id: { [Op.in]: userIds } } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const items = rows.map(l => ({
    ...l.toJSON(),
    username: l.user_id ? (userMap.get(l.user_id)?.username ?? null) : null,
  }));

  return { total: count, items };
}

export async function listLoginLogs(params: {
  keyword?: string;
  userId?: string;
  success?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const { keyword, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = {};
  if (params.userId) where.user_id = params.userId;
  if (params.success !== undefined) where.login_status = params.success ? 'success' : 'failed';
  if (keyword) {
    where[Op.or as unknown as string] = [
      { username: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { count, rows } = await LoginLog.findAndCountAll({
    where,
    order: [['occurred_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return { total: count, items: rows };
}
