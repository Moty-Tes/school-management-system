import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema.js';

const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const IS_PROD = process.env.NODE_ENV === 'production';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register({
      ...input,
      deviceInfo: { userAgent: req.headers['user-agent'], ip: req.ip },
    } as any);

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        tenant: result.tenant,
        accessToken: result.tokens.accessToken,
        expiresAt: result.tokens.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login({
      ...input,
      deviceInfo: { userAgent: req.headers['user-agent'], ip: req.ip },
    } as any);

    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tenant: result.tenant,
        accessToken: result.tokens.accessToken,
        expiresAt: result.tokens.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const bodyToken = req.body?.refreshToken;
    const cookieToken = req.cookies?.refresh_token;
    const refreshToken = bodyToken || cookieToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token required' },
      });
      return;
    }

    refreshSchema.parse({ refreshToken });

    const tokens = await authService.refresh(refreshToken);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: { accessToken: tokens.accessToken, expiresAt: tokens.expiresAt },
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.auth?.sessionId) {
      await authService.logout(req.auth.sessionId);
    }
    clearAuthCookies(res);
    res.status(200).json({ success: true, data: { message: 'Logged out' } });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
      return;
    }
    res.status(200).json({ success: true, data: { userId: req.auth.sub, tenantId: req.auth.tenantId, sessionId: req.auth.sessionId } });
  } catch (err) {
    next(err);
  }
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: ACCESS_COOKIE_MAX_AGE,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}