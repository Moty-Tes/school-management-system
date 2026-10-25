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