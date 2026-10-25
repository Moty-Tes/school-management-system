import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createSession, revokeSession, rotateRefreshToken } from './session.service.js';
import { verifyRefreshToken } from '../lib/jwt.js';
import { AppError } from '../middleware/error.middleware.js';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantCode: string;
  deviceInfo: { userAgent?: string; ip?: string };
}

export interface LoginInput {
  email: string;
  password: string;
  tenantCode: string;
  deviceInfo: { userAgent?: string; ip?: string };
}

export interface AuthResult {
  user: { 
    id: string; 
    email: string; 
    firstName: string | null; 
    lastName: string | null; 
    roles: string[]; 
  };
  tenant: { id: string; code: string; name: string };
  tokens: { accessToken: string; refreshToken: string; expiresAt: Date };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const tenantCode = input.tenantCode.toLowerCase().trim();

  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant || tenant.status !== 'ACTIVE' || tenant.deletedAt) {
    throw new AppError('Invalid or inactive tenant', 400, 'INVALID_TENANT');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);

  const defaultRole = await prisma.role.findFirst({
    where: { slug: 'STUDENT', tenantId: null },
  });
  if (!defaultRole) {
    throw new AppError('System not seeded — run db:seed', 500, 'NOT_SEEDED');
  }

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        profile: {
          create: { firstName: input.firstName, lastName: input.lastName },
        },
      },
    });

    const userTenant = await tx.userTenant.create({
      data: { userId: newUser.id, tenantId: tenant.id, status: 'ACTIVE' },
    });

    await tx.userTenantRole.create({
      data: { userTenantId: userTenant.id, roleId: defaultRole.id },
    });

    return newUser;
  });

  const session = await createSession({
    userId: user.id,
    tenantId: tenant.id,
    deviceInfo: input.deviceInfo,
  });

  return {
    user: { 
      id: user.id, 
      email: user.email, 
      firstName: input.firstName, 
      lastName: input.lastName,
      roles: ['STUDENT']
    },
    tenant: { id: tenant.id, code: tenant.code, name: tenant.name },
    tokens: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const tenantCode = input.tenantCode.toLowerCase().trim();

  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant || tenant.status !== 'ACTIVE' || tenant.deletedAt) {
    await logAttempt(email, input.deviceInfo.ip, input.deviceInfo.userAgent, false, 'invalid_tenant');
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });
  if (!user || user.deletedAt || !user.passwordHash) {
    await logAttempt(email, input.deviceInfo.ip, input.deviceInfo.userAgent, false, 'user_not_found');
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'ACTIVE') {
    await logAttempt(email, input.deviceInfo.ip, input.deviceInfo.userAgent, false, 'inactive');
    throw new AppError('Account is not active', 403, 'ACCOUNT_INACTIVE');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    await logAttempt(email, input.deviceInfo.ip, input.deviceInfo.userAgent, false, 'bad_password');
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const membership = await prisma.userTenant.findUnique({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });

  if (!membership || membership.status !== 'ACTIVE') {
    await logAttempt(email, input.deviceInfo.ip, input.deviceInfo.userAgent, false, 'not_member');
    throw new AppError('You do not have access to this school', 403, 'NOT_A_MEMBER');
  }

  const roles = membership.roles.map(r => r.role.slug);

  const session = await createSession({
    userId: user.id,
    tenantId: tenant.id,
    deviceInfo: input.deviceInfo,
  });

  await logAttempt(email, input.deviceInfo.ip, input.deviceInfo.userAgent, true, null);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
      roles,
    },
    tenant: { id: tenant.id, code: tenant.code, name: tenant.name },
    tokens: {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    },
  };
}

export async function refresh(oldRefreshToken: string) {
  const payload = verifyRefreshToken(oldRefreshToken);
  const tokens = await rotateRefreshToken(oldRefreshToken, payload.sessionId);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  };
}

export async function logout(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
}

async function logAttempt(
  email: string,
  ip: string | undefined,
  userAgent: string | undefined,
  success: boolean,
  reason: string | null
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email, ip, userAgent, success, reason },
  });
}