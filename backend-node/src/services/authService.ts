import { v4 as uuidv4 } from 'uuid';
import { User } from '../db/models';
import { verifyPassword, hashPassword } from '../utils/password';
import { createToken } from '../utils/jwt';
import { getUserPermissions } from './rbacService';
import { logAudit, logLogin } from '../utils/audit';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    email: string | null;
    avatar: string | null;
    isSuperAdmin: boolean;
    permissions: string[];
  };
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export async function authenticate(
  username: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  const user = await User.findOne({
    where: { username, deleted_at: null },
  });

  if (!user) {
    await logLogin({ username, loginStatus: 'failed', ipAddress, userAgent, failureReason: '用户不存在' });
    throw new AppError('UNAUTHORIZED', '用户名或密码错误');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await logLogin({ userId: user.id, username, loginStatus: 'failed', ipAddress, userAgent, failureReason: '密码错误' });
    throw new AppError('UNAUTHORIZED', '用户名或密码错误');
  }

  if (user.status !== 'active') {
    await logLogin({ userId: user.id, username, loginStatus: 'failed', ipAddress, userAgent, failureReason: '账号已禁用' });
    throw new AppError('FORBIDDEN', '账号已禁用');
  }

  await User.update(
    { last_login_at: new Date(), last_login_ip: ipAddress ?? null },
    { where: { id: user.id } }
  );

  const permissions = await getUserPermissions(user.id);
  const token = createToken(user.id, user.username);

  await logLogin({ userId: user.id, username, loginStatus: 'success', ipAddress, userAgent });
  await logAudit({ userId: user.id, action: 'login', ipAddress });

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

export async function resetPassword(
  userId: string,
  newPassword: string,
  operatorId: string,
  operatorUsername: string,
  ipAddress?: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new AppError('VALIDATION_ERROR', '密码长度不能少于6位');
  }
  const hashed = await hashPassword(newPassword);
  await User.update({ password_hash: hashed, updated_by: operatorId }, { where: { id: userId } });
  await logAudit({
    userId: operatorId,
    action: 'reset_password',
    targetType: 'user',
    targetId: userId,
    ipAddress,
  });
}

export async function changeMyPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new AppError('VALIDATION_ERROR', '新密码长度不能少于6位');
  }
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('NOT_FOUND', '用户不存在');

  const valid = await verifyPassword(oldPassword, user.password_hash);
  if (!valid) throw new AppError('UNAUTHORIZED', '原密码错误');

  const hashed = await hashPassword(newPassword);
  await User.update({ password_hash: hashed, updated_by: userId }, { where: { id: userId } });
}
