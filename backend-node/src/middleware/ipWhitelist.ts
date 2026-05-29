import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function ipWhitelist(req: Request, res: Response, next: NextFunction): void {
  const allowedIps = config.security.ipWhitelist;
  if (!allowedIps || allowedIps.length === 0) {
    next();
    return;
  }

  const clientIp = req.ip || req.socket?.remoteAddress || '';
  const normalizedIp = clientIp.replace('::ffff:', '');

  if (allowedIps.includes(normalizedIp) || allowedIps.includes('*')) {
    next();
    return;
  }

  res.status(403).json({ error: 'IP not allowed' });
}
