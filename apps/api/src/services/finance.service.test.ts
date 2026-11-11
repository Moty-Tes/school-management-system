import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { recordPayment, getFinanceSummary } from './finance.service.js';
import { recordPaymentHandler } from '../controllers/finance.controller.js';

function createSerializedFinanceDb(initialInvoice: {
  id: string;
  tenantId: string;
  amount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  payments?: Array<{ id: string; amount: number; method: string; reference?: string }>;
}) {
  const state = {
    invoice: {
      id: initialInvoice.id,
      tenantId: initialInvoice.tenantId,
      amount: initialInvoice.amount,
      status: initialInvoice.status,
    },
    payments: [...(initialInvoice.payments || [])] as Array<{
      id: string;
      tenantId: string;
      invoiceId: string;
      amount: number;
      method: string;
      reference?: string;
    }>,
    rawLockCalls: 0,
  };

  // Async mutex simulating PostgreSQL row lock (SELECT ... FOR UPDATE) serialization
  let lockChain = Promise.resolve();

  const db: any = {
    __state: state,
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      let release!: () => void;
      const prev = lockChain;
      lockChain = new Promise<void>((resolve) => {
        release = resolve;
      });
      await prev;
      try {
        const tx = {
          $queryRaw: async (_strings: TemplateStringsArray, ..._values: unknown[]) => {
            state.rawLockCalls++;
            return [{ id: state.invoice.id }];
          },
          invoice: {
            findFirst: async ({ where }: any) => {
              if (where.id !== state.invoice.id || where.tenantId !== state.invoice.tenantId) {
                return null;
              }
              return {
                ...state.invoice,
                payments: state.payments.map((p) => ({ ...p })),
              };
            },
            update: async ({ where, data }: any) => {
              if (where.id === state.invoice.id) {
                state.invoice.status = data.status;
              }
              return state.invoice;
            },
          },
          payment: {
            findFirst: async ({ where }: any) => {
              return (
                state.payments.find(
                  (p) => p.tenantId === where.tenantId && p.reference === where.reference
                ) || null
              );
            },
            create: async ({ data }: any) => {
              // Small async yield to exercise interleaving before lock release
              await new Promise((r) => setTimeout(r, 10));
              const created = {
                id: `pay-${state.payments.length + 1}`,
                ...data,
              };
              state.payments.push(created);
              return created;
            },
          },
        };
        return await fn(tx);
      } finally {
        release();
      }
    },
  };

  return { db, state };
}

describe('Finance Payment Locking & Ledger Accounting', () => {
  test('transitions UNPAID -> PARTIAL -> PAID and enforces ETB balance bounds', async () => {
    const { db, state } = createSerializedFinanceDb({
      id: 'inv-1',
      tenantId: 'tenant-1',
      amount: 1000,
      status: 'UNPAID',
    });
    const auditCalls: any[] = [];
    const logAudit = async (tenantId: string, userId: string, action: string, entity: string, details: string) => {
      auditCalls.push({ tenantId, userId, action, entity, details });
    };

    const p1 = await recordPayment(
      'tenant-1',
      'inv-1',
      { amount: 400, method: 'CASH', reference: 'RCPT-001' },
      'accountant-1',
      db,
      logAudit
    );
    assert.equal(p1.amount, 400);
    assert.equal(state.invoice.status, 'PARTIAL');
    assert.equal(state.rawLockCalls, 1);

    // Reject duplicate reference
    await assert.rejects(
      recordPayment(
        'tenant-1',
        'inv-1',
        { amount: 100, method: 'CASH', reference: 'RCPT-001' },
        'accountant-1',
        db,
        logAudit
      ),
      (err: any) => err.status === 409 && err.code === 'DUPLICATE_PAYMENT_REFERENCE'
    );

    // Reject overpayment exceeding remaining 600 ETB balance
    await assert.rejects(
      recordPayment(
        'tenant-1',
        'inv-1',
        { amount: 700, method: 'BANK_TRANSFER' },
        'accountant-1',
        db,
        logAudit
      ),
      (err: any) => err.status === 400 && err.code === 'AMOUNT_EXCEEDS_BALANCE'
    );

    // Final settlement of exact remaining 600 ETB
    await recordPayment(
      'tenant-1',
      'inv-1',
      { amount: 600, method: 'BANK_TRANSFER', reference: 'RCPT-002' },
      'accountant-1',
      db,
      logAudit
    );
    assert.equal(state.invoice.status, 'PAID');
    assert.equal(auditCalls.length, 2);
    assert.equal(auditCalls[0].userId, 'accountant-1');
    assert.equal(auditCalls[0].details.includes('400'), false);

    // Reject any payment once already PAID
    await assert.rejects(
      recordPayment(
        'tenant-1',
        'inv-1',
        { amount: 10, method: 'CASH' },
        'accountant-1',
        db,
        logAudit
      ),
      (err: any) => err.status === 400 && err.code === 'INVOICE_ALREADY_PAID'
    );
  });

  test('serialized row-locked concurrent payments prevent double-pay race condition', async () => {
    const { db, state } = createSerializedFinanceDb({
      id: 'inv-concurrent',
      tenantId: 'tenant-1',
      amount: 1000,
      status: 'UNPAID',
    });

    const results = await Promise.allSettled([
      recordPayment('tenant-1', 'inv-concurrent', { amount: 1000, method: 'CASH', reference: 'REF-A' }, 'acct-1', db, async () => {}),
      recordPayment('tenant-1', 'inv-concurrent', { amount: 1000, method: 'CASH', reference: 'REF-B' }, 'acct-2', db, async () => {}),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal((rejected[0].reason as any).code, 'INVOICE_ALREADY_PAID');
    assert.equal(state.payments.length, 1);
    assert.equal(state.invoice.status, 'PAID');
    assert.equal(state.rawLockCalls, 2);
  });

  test('enforces tenant isolation on invoices and validates payment inputs', async () => {
    const { db } = createSerializedFinanceDb({
      id: 'inv-1',
      tenantId: 'tenant-1',
      amount: 500,
      status: 'UNPAID',
    });

    await assert.rejects(
      recordPayment('other-tenant', 'inv-1', { amount: 100, method: 'CASH' }, 'acct-1', db),
      (err: any) => err.status === 404 && err.code === 'NOT_FOUND'
    );

    await assert.rejects(
      recordPayment('tenant-1', 'inv-1', { amount: -50, method: 'CASH' }, 'acct-1', db),
      (err: any) => err.status === 400 && err.code === 'INVALID_PAYMENT_AMOUNT'
    );
  });

  test('getFinanceSummary reconciles pendingAmount accurately against partial payments', async () => {
    const mockDb: any = {
      invoice: {
        findMany: async () => [
          { amount: 1000, status: 'PARTIAL', payments: [{ amount: 400 }] },
          { amount: 500, status: 'PAID', payments: [{ amount: 500 }] },
          { amount: 300, status: 'UNPAID', payments: [] },
        ],
      },
      payment: {
        findMany: async () => [
          { amount: 400, createdAt: new Date() },
          { amount: 500, createdAt: new Date() },
        ],
      },
      expense: {
        findMany: async () => [{ amount: 200, date: new Date() }],
      },
    };

    const summary = await getFinanceSummary('tenant-1', mockDb);
    assert.equal(summary.totalInvoiced, 1800);
    assert.equal(summary.totalRevenue, 900);
    // Remaining balances: (1000 - 400) + 0 + 300 = 900
    assert.equal(summary.pendingAmount, 900);
    assert.equal(summary.totalRevenue + summary.pendingAmount, summary.totalInvoiced);
    assert.equal(summary.netIncome, 700);
  });

  test('recordPaymentHandler requires auth and extracts :id route param properly', async () => {
    let capturedErr: any = null;
    await recordPaymentHandler(
      {
        auth: { tenantId: 'tenant-1', sub: '' },
        params: { id: 'inv-1' },
        body: { amount: 100, method: 'CASH' },
      } as any,
      { status: () => ({ json: () => {} }) } as any,
      (err: any) => {
        capturedErr = err;
      }
    );
    assert.equal(capturedErr?.status, 401);

    let missingParamErr: any = null;
    await recordPaymentHandler(
      {
        auth: { tenantId: 'tenant-1', sub: 'user-1' },
        params: {},
        body: { amount: 100, method: 'CASH' },
      } as any,
      { status: () => ({ json: () => {} }) } as any,
      (err: any) => {
        missingParamErr = err;
      }
    );
    assert.equal(missingParamErr?.status, 400);
    assert.equal(missingParamErr?.code, 'INVALID_INVOICE_ID');
  });
});
