import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';

export interface CreateSessionInput {
  userId: string;
  tenantId: string;
  deviceInfo: {
    userAgent?: string;
    ip?: string;
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
}

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(input: CreateSessionInput): Promise<SessionTokens> {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId,
      deviceInfo: input.deviceInfo as object,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({
    sub: input.userId,
    sessionId: session.id,
    tenantId: input.tenantId,
  });

  const jti = crypto.randomUUID();
  const refreshToken = signRefreshToken({
    sub: input.userId,
    sessionId: session.id,
    jti,
  });

  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: input.userId,
      sessionId: session.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
    expiresAt,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: now },
    }),
    prisma.refreshToken.updateMany({
      where: { sessionId },
      data: { revokedAt: now },
    }),
  ]);
}

export async function rotateRefreshToken(
  oldToken: string,
  sessionId: string
): Promise<SessionTokens> {
  const tokenHash = hashToken(oldToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) throw new Error('Refresh token not found');
  if (stored.revokedAt) throw new Error('Refresh token revoked');
  if (stored.expiresAt < new Date()) throw new Error('Refresh token expired');

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { usedAt: new Date(), revokedAt: new Date() },
  });

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt) throw new Error('Session revoked');

  const accessToken = signAccessToken({
    sub: session.userId,
    sessionId: session.id,
    tenantId: session.tenantId,
  });

  const jti = crypto.randomUUID();
  const newRefreshToken = signRefreshToken({
    sub: session.userId,
    sessionId: session.id,
    jti,
  });

  await prisma.refreshToken.create({
    data: {
      userId: session.userId,
      sessionId: session.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
