import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/token.js';
import type { UserSession } from '../types/auth.types.js';

/**
 * Express middleware that verifies the JWT from the Authorization header
 * and attaches `req.user` if valid.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      display_name: payload.display_name,
      role: payload.role,
    } satisfies UserSession;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}
