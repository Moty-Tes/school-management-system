import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loginSchema, registerSchema, refreshSchema } from './auth.schema.js';

describe('Auth Schema Validation Suite', () => {
  describe('loginSchema', () => {
    test('accepts valid credentials with proper normalization', () => {
      const input = {
        email: '  Admin@School.edu  ',
        password: 'securePassword123!',
        tenantCode: '  DEMO-SCHOOL  ',
      };

      const result = loginSchema.safeParse(input);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.email, 'admin@school.edu');
        assert.strictEqual(result.data.tenantCode, 'demo-school');
        assert.strictEqual(result.data.password, 'securePassword123!');
      }
    });

    test('rejects invalid email formats', () => {
      const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@com'];
      for (const email of invalidEmails) {
        const result = loginSchema.safeParse({
          email,
          password: 'password123',
          tenantCode: 'demo-school',
        });
        assert.strictEqual(result.success, false, `Expected ${email} to fail validation`);
      }
    });

    test('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@school.edu',
        password: '',
        tenantCode: 'demo-school',
      });
      assert.strictEqual(result.success, false);
    });

    test('rejects missing tenantCode', () => {
      const result = loginSchema.safeParse({
        email: 'user@school.edu',
        password: 'password123',
        tenantCode: '',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('registerSchema', () => {
    test('accepts valid registration payload', () => {
      const input = {
        email: 'Teacher@School.ORG ',
        password: 'Passw0rdLength8Plus',
        firstName: ' Abebe ',
        lastName: ' Bikila ',
        tenantCode: ' Addis-Academy ',
      };

      const result = registerSchema.safeParse(input);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.email, 'teacher@school.org');
        assert.strictEqual(result.data.firstName, 'Abebe');
        assert.strictEqual(result.data.lastName, 'Bikila');
        assert.strictEqual(result.data.tenantCode, 'addis-academy');
      }
    });

    test('rejects password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'user@school.edu',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
        tenantCode: 'demo',
      });
      assert.strictEqual(result.success, false);
    });

    test('rejects empty names', () => {
      const result = registerSchema.safeParse({
        email: 'user@school.edu',
        password: 'validPassword123',
        firstName: '   ',
        lastName: 'Doe',
        tenantCode: 'demo',
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('refreshSchema', () => {
    test('accepts valid refresh token', () => {
      const result = refreshSchema.safeParse({
        refreshToken: 'valid-jwt-token-string',
      });
      assert.strictEqual(result.success, true);
    });

    test('rejects empty refresh token', () => {
      const result = refreshSchema.safeParse({
        refreshToken: '',
      });
      assert.strictEqual(result.success, false);
    });
  });
});
