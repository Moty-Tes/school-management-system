import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { requireRoles } from './auth.middleware.js';
import { AppError } from './error.middleware.js';

describe('Server-Side Role Authorization Middleware Suite', () => {
  test('rejects unauthenticated requests without req.auth with 401', () => {
    const middleware = requireRoles('TENANT_ADMIN');
    const req: any = {};
    const res: any = {};
    let passedError: any = null;

    middleware(req, res, (err?: any) => {
      passedError = err;
    });

    assert.ok(passedError instanceof AppError);
    assert.strictEqual(passedError.status, 401);
    assert.strictEqual(passedError.code, 'UNAUTHENTICATED');
  });

  test('rejects requests when user lacks required roles with 403', () => {
    const middleware = requireRoles('TENANT_ADMIN', 'ACCOUNTANT');
    const req: any = {
      auth: {
        sub: 'user-student-1',
        sessionId: 'sess-1',
        tenantId: 'tenant-1',
        roles: ['STUDENT'],
        type: 'access',
      },
    };
    const res: any = {};
    let passedError: any = null;

    middleware(req, res, (err?: any) => {
      passedError = err;
    });

    assert.ok(passedError instanceof AppError);
    assert.strictEqual(passedError.status, 403);
    assert.strictEqual(passedError.code, 'FORBIDDEN');
  });

  test('allows requests when user possesses an authorized role', () => {
    const middleware = requireRoles('TENANT_ADMIN', 'ACCOUNTANT');
    const req: any = {
      auth: {
        sub: 'user-bursar-1',
        sessionId: 'sess-2',
        tenantId: 'tenant-1',
        roles: ['ACCOUNTANT'],
        type: 'access',
      },
    };
    const res: any = {};
    let passedError: any = null;
    let nextCalled = false;

    middleware(req, res, (err?: any) => {
      passedError = err;
      nextCalled = true;
    });

    assert.strictEqual(passedError, undefined);
    assert.strictEqual(nextCalled, true);
  });

  test('allows global SUPER_ADMIN regardless of specified role requirements', () => {
    const middleware = requireRoles('SAFEGUARDING_LEAD');
    const req: any = {
      auth: {
        sub: 'user-super-1',
        sessionId: 'sess-3',
        tenantId: 'tenant-1',
        roles: ['SUPER_ADMIN'],
        type: 'access',
      },
    };
    const res: any = {};
    let passedError: any = null;
    let nextCalled = false;

    middleware(req, res, (err?: any) => {
      passedError = err;
      nextCalled = true;
    });

    assert.strictEqual(passedError, undefined);
    assert.strictEqual(nextCalled, true);
  });
});
