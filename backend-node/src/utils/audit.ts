import { v4 as uuidv4 } from 'uuid';
import { AuditLog, LoginLog } from '../db/models';

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  detail?: string;
  ipAddress?: string;
}): Promise<void> {
  try {
    await AuditLog.create({
      id: uuidv4(),
      user_id: params.userId ?? null,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      target_name: params.targetName ?? null,
      change_summary: params.detail ?? null,
      ip_address: params.ipAddress ?? null,
    });
  } catch (e) {
    console.error('[AuditLog] Failed to write audit log:', e);
  }
}

export async function logLogin(params: {
  userId?: string | null;
  username: string;
  loginStatus: 'success' | 'failed';
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}): Promise<void> {
  try {
    await LoginLog.create({
      id: uuidv4(),
      user_id: params.userId ?? null,
      username: params.username,
      login_status: params.loginStatus,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      failure_reason: params.failureReason ?? null,
    });
  } catch (e) {
    console.error('[LoginLog] Failed to write login log:', e);
  }
}
