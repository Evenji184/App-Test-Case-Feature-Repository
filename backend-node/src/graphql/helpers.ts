import { AppContext } from './context';
import { AppError } from '../services/authService';
import { getUserPermissions, userHasPermission } from '../services/rbacService';

export function requireAuth(ctx: AppContext): void {
  if (!ctx.userId) {
    throw new AppError('UNAUTHORIZED', '请先登录');
  }
}

export function requirePermission(ctx: AppContext, permission: string): void {
  requireAuth(ctx);
  if (!userHasPermission(ctx.permissionCodes, permission)) {
    throw new AppError('FORBIDDEN', '权限不足');
  }
}

export function makeErrorResult(err: unknown) {
  if (err instanceof AppError) {
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
