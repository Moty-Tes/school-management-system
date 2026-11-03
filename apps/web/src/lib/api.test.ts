import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, ApiError } from './api.js';

describe('Web Client API Resiliency Engine', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('deduplicates concurrent in-flight GET requests for the same endpoint', async () => {
    let callCount = 0;

    globalThis.fetch = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: { status: 'healthy', count: callCount } }),
      } as any;
    };

    // Dispatch two concurrent identical GET requests
    const [res1, res2] = await Promise.all([
      api.get<any>('/api/v1/auth/me'),
      api.get<any>('/api/v1/auth/me'),
    ]);

    assert.strictEqual(callCount, 1, 'Only 1 network fetch should occur for concurrent in-flight GET requests');
    assert.deepStrictEqual(res1, res2);
  });

  test('formats HTTP 429 with informative institutional rate-limit messaging', async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json', 'retry-after': '0.01' }),
        json: async () => ({}),
        text: async () => '',
      } as any;
    };

    await assert.rejects(
      async () => {
        await api.post('/api/v1/test-endpoint', { dummy: 1 });
      },
      (err: any) => {
        assert.ok(err instanceof ApiError);
        assert.strictEqual(err.status, 429);
        assert.strictEqual(err.code, 'RATE_LIMITED');
        assert.ok(err.message.includes('High traffic') || err.message.includes('traffic'));
        return true;
      }
    );
  });
});
