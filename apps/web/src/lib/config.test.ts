import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl } from './config.js';

describe('Web Client Configuration Engine', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
  });

  test('resolves default localhost when no environment variable is provided', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    assert.strictEqual(getApiBaseUrl(), 'http://localhost:4000');
  });

  test('preserves fully qualified https URL without trailing slash', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://sms-api.schoolerp.com/api///';
    assert.strictEqual(getApiBaseUrl(), 'https://sms-api.schoolerp.com/api');
  });

  test('prepends https:// when Render host domain is supplied without protocol', () => {
    process.env.NEXT_PUBLIC_API_URL = 'sms-backend-api.onrender.com';
    assert.strictEqual(getApiBaseUrl(), 'https://sms-backend-api.onrender.com');
  });

  test('resolves bare Render service name to onrender.com domain with https', () => {
    process.env.NEXT_PUBLIC_API_URL = 'sms-backend-api';
    assert.strictEqual(getApiBaseUrl(), 'https://sms-backend-api.onrender.com');
  });

  test('resolves bare Render service name with https protocol to onrender.com domain', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://sms-backend-api';
    assert.strictEqual(getApiBaseUrl(), 'https://sms-backend-api.onrender.com');
  });

  test('prepends http:// for local domain without protocol', () => {
    process.env.NEXT_PUBLIC_API_URL = 'localhost:4000/';
    assert.strictEqual(getApiBaseUrl(), 'http://localhost:4000');
  });
});
