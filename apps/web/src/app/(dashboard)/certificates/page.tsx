'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Award, Shield, Clipboard, TrendingUp, FileText,
  Calendar, CheckCircle2, X, Search
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Certificate {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  issueDate: string;
  issuedBy: string;
  verificationCode: string;
  status: 'pending' | 'issued' | 'verified';
}

interface FilterState {
  search: string;
  status: 'all' | 'pending' | 'issued' | 'verified';
  course: string;
}

export default function CertificatesPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', course: '' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load certificates
    async function loadCertificates() {
      try {
        const data = await api.get<any[]>('/api/v1/certificates');
        setCertificates(data || []);
      } catch (err) {
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    }

    loadCertificates();
  }, []);

  const filteredCertificates = certificates.filter((cert: Certificate) => {
    const matchesSearch = filters.search
      ? cert.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        cert.course.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || cert.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Compute summary stats
  const totalCertificates = filteredCertificates.length;
  const issuedCount = filteredCertificates.filter(c => c.status === 'issued').length;
  const verifiedCount = filteredCertificates.filter(c => c.status === 'verified').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Certificate Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalCertificates}</div>
                <div className="text-sm text-neutral-500">Certificates</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{issuedCount}</div>
                <div className="text-sm text-neutral-500">Issued</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{verifiedCount}</div>
                <div className="text-sm text-neutral-500">Verified</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Pending</div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wider mb-2">
                Filters
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search student name or course..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="issued">Issued</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Course</label>
                  <select
                    value={filters.course}
                    onChange={(e) => setFilters({ ...filters, course: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="">All Courses</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="science">Science</option>
                    <option value="english">English</option>
                    <option value="history">History</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Certificates Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredCertificates.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Award"
              title="No certificates found"
              description="Issue certificates to get started"
              actionLabel="Issue Certificate"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Student</TableHeadCell>
                <TableHeadCell style="primary">Course</TableHeadCell>
                <TableHeadCell style="primary">Issue Date</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Verification</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredCertificates.slice(0, 15).map((cert: Certificate, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{cert.studentName}</span>
                    <span className="text-neutral-500 text-xs">{cert.course}</span>
                    <span className="text-neutral-500 text-xs">{new Date(cert.issueDate).toLocaleDateString()}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${cert.status}`}
                    >
                      {cert.status}
                    </span>
                    <span className="text-neutral-500 text-xs">{cert.verificationCode}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Verification */}
          {filteredCertificates.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredCertificates.length} of {certificates.length} certificates</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export List</Button>
                <Button variant="primary" size="sm">Verify Codes</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}