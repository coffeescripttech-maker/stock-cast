import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/auth.types.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as any });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as unknown as JwtPayload;
}
