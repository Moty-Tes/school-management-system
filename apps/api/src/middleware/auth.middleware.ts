import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from './error.middleware.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('Missing access token', 401, 'UNAUTHENTICATED');
    }

    const payload = verifyAccessToken(token);

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError('Session is invalid', 401, 'SESSION_REVOKED');
    }

    // Update last used (non-blocking)
    prisma.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date(), lastIp: req.ip },
      })
      .catch(() => {});

    req.auth = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Invalid or expired access token', 401, 'INVALID_TOKEN'));
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.access_token) return req.cookies.access_token as string;
  return null;
}

/**
 * Role-Based Access Control (RBAC) route middleware.
 * Enforces server-side authorization: requires that req.auth contains at least one of the allowed roles.
 * 'SUPER_ADMIN' role automatically bypasses tenant-scoped restrictions.
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }

    const userRoles = req.auth.roles || [];

    // Global super admin bypass
    if (userRoles.includes('SUPER_ADMIN')) {
      return next();
    }

    const hasAllowedRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasAllowedRole) {
      return next(
        new AppError(
          `Access forbidden: required role ${allowedRoles.join(' or ')}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
