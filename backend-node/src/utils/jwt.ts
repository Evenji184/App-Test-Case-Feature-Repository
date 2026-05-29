import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export function createToken(userId: string, username: string): string {
  return jwt.sign(
    { sub: userId, username },
    config.auth.secretKey,
    { expiresIn: `${config.auth.accessTokenExpireMinutes}m` }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.auth.secretKey) as JwtPayload;
}
