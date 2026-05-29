import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestLog } from '../db/models';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = uuidv4();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const userId = (req as Request & { userId?: string }).userId ?? null;

    RequestLog.create({
      id: uuidv4(),
      request_id: requestId,
      method: req.method,
      path: req.path,
      ip_address: req.ip || req.socket?.remoteAddress || null,
      user_id: userId,
      response_status: res.statusCode,
      duration_ms: durationMs,
      user_agent: req.headers['user-agent'] || null,
      created_at: new Date(),
    }).catch(() => {
      // silently ignore log write failures
    });
  });

  next();
}
