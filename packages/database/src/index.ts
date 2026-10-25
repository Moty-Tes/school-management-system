import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __smsPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__smsPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__smsPrisma = prisma;
}

export * from '@prisma/client';