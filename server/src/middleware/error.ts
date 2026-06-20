import type { Request, Response, NextFunction } from 'express';

/**
 * Global Express error handler.
 * Catches thrown errors (or next(err)) and returns a consistent
 * ApiErrorResponse shape.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ERROR]', err.message, err.stack);

  const status = (err as any).status || (err as any).statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}
