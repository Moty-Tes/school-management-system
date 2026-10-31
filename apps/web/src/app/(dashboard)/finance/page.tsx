'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign, CreditCard, Clipboard, TrendingUp, Folder, Shield,
  Users, Calendar, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Invoice {
  id: string;
  studentName: string;
  amount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

interface Payment {
  status?: string;
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'cash' | 'card' | 'bank' | 'check';
}

interface FinancialSummary {
  totalRevenue: number;
  pendingAmount: number;
  totalInvoices: number;
  paidInvoices: number;
}

export default function FinancePage() {
  const [role, setRole] = useState<'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'PARENT'>('ADMIN');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isAccountant = userRoles.includes('ACCOUNTANT');
      const isParent = userRoles.includes('PARENT');

      setRole(isSuperAdmin || isTenantAdmin || isAccountant ? 'ACCOUNTANT' : isParent ? 'PARENT' : 'ADMIN');
    });

    // Load financial data
    async function loadFinancialData() {
      try {
        const [summary, invoicesData, paymentsData] = await Promise.all([
          api.get<any>('/api/v1/finance/summary'),
          api.get<any[]>('/api/v1/finance/invoices'),
          api.get<any[]>('/api/v1/finance/payments'),
        ]);

        setFinancialSummary(summary || { totalRevenue: 0, pendingAmount: 0, totalInvoices: 0, paidInvoices: 0 });
        setInvoices(invoicesData || []);
        setPayments(paymentsData || []);
      } catch (err) {
        setFinancialSummary({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0, paidInvoices: 0 });
        setInvoices([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    loadFinancialData();
  }, []);

  const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'paid');
  const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'overdue');
  const totalRevenue = financialSummary?.totalRevenue ?? invoices.reduce((s: number, inv: Invoice) => inv.status === 'paid' ? s + inv.amount : s, 0);
  const pendingAmount = financialSummary?.pendingAmount ?? invoices.filter((inv: Invoice) => inv.status !== 'paid').reduce((s: number, inv: Invoice) => s + inv.amount, 0);

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Financial Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <KpiCard
                value={totalRevenue.toLocaleString()}
                label="Total Revenue"
                trend="up"
                trendValue="+12.5% vs last year"
                subtitle="Fiscal Year 2026"
                variant="primary"
              />
            </Card>

            <Card>
              <KpiCard
                value={pendingAmount.toLocaleString()}
                label="Pending Payments"
                trend="up"
                trendValue="+8.3% vs last month"
                subtitle="Outstanding invoices"
                variant="warning"
              />
            </Card>

            <Card>
              <KpiCard
                value={financialSummary?.totalInvoices?.toLocaleString() ?? '0'}
                label="Total Invoices"
                trend="up"
                trendValue="+15 vs last period"
                subtitle="All invoice types"
                variant="default"
              />
            </Card>

            <Card>
              <KpiCard
                value={financialSummary?.paidInvoices?.toLocaleString() ?? '0'}
                label="Paid Invoices"
                trend="neutral"
                trendValue="—"
                subtitle="Collected this year"
                variant="success"
              />
            </Card>
          </div>

          {/* Invoices Table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-neutral-900">
                All Invoices
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-brand-primary hover:underline"
              >
                Add Invoice
              </Button>
            </div>
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Invoice #</TableHeadCell>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Amount</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Due Date</TableHeadCell>
                <TableHeadCell style="primary">Actions</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {invoices.slice(0, 15).map((inv: Invoice, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-brand-primary" />
                      <span className="font-medium text-neutral-700">INV-{inv.id}</span>
                    </div>
                    <span className="font-medium text-neutral-700">{inv.studentName}</span>
                    <span className="font-medium text-neutral-700">${inv.amount.toLocaleString()}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'partial' ? 'bg-amber-100 text-amber-800' : inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-amber-800'}`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-neutral-500 text-xs">{new Date(inv.dueDate).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
                        Edit
                      </Button>
                    </div>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          </Card>

          {/* Payment History */}
          <Card>
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              Recent Payments
            </h3>
            {payments.length === 0 ? (
              <KpiEmptyStateComponent
                icon="Clipboard"
                title="No payments yet"
                description="Record payments to get started"
                actionLabel="Record Payment"
              />
            ) : (
              <Table>
                <TableSection.head>
                  <TableHeadCell style="primary">Date</TableHeadCell>
                  <TableHeadCell style="primary">Invoice</TableHeadCell>
                  <TableHeadCell style="primary">Amount</TableHeadCell>
                  <TableHeadCell style="primary">Method</TableHeadCell>
                  <TableHeadCell style="primary">Status</TableHeadCell>
                </TableSection.head>
                <TableSection.body>
                  {payments.slice(0, 10).map((pay: Payment, index: number) => (
                    <TableRowCell key={index} style="primary">
                      <span className="text-neutral-500 text-xs">{new Date(pay.date).toLocaleDateString()}</span>
                      <span className="font-medium text-neutral-700">INV-{pay.invoiceId}</span>
                      <span className="font-medium text-neutral-700">${pay.amount.toLocaleString()}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${pay.method}`}
                      >
                        {pay.method}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${pay.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-amber-800'}`}
                      >
                        {pay.status}
                      </span>
                    </TableRowCell>
                  ))}
                </TableSection.body>
              </Table>
            )}
          </Card>
                </div>
      </motion.div>
    </div>
  );
}