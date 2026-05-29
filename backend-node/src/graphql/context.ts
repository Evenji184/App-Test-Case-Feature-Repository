import { Request, Response } from 'express';

export interface AppContext {
  req: Request;
  res: Response;
  userId: string | null;
  username: string | null;
  isSuperAdmin: boolean;
  permissionCodes: string[];
  ipAddress: string;
}
