'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Star, Music, Film, PaintBrush,
  Search, CheckCircle2, X, UsersAdd, Trophy
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Club {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'arts' | 'sports' | 'technical' | 'cultural';
  sponsorTeacher: string;
  memberCount: number;
  meetingFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  status: 'active' | 'inactive' | 'pending';
}

interface FilterState {
  search: string;
  category: 'all' | 'academic' | 'arts' | 'sports' | 'technical' | 'cultural';
  status: 'all' | 'active' | 'inactive' | 'pending';
}

export default function ClubsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load clubs
    async function loadClubs() {
      try {
        const data = await api.get<any[]>('/api/v1/clubs');
        setClubs(data || []);
      } catch (err) {
        setClubs([]);
      } finally {
        setLoading(false);
      }
    }

    loadClubs();
  }, []);

  const filteredClubs = clubs.filter((club: Club) => {
    const matchesSearch = filters.search
      ? club.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        club.description.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || club.category === filters.category;
    const matchesStatus = filters.status === 'all' || club.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Compute summary stats
  const totalClubs = filteredClubs.length;
  const activeCount = filteredClubs.filter(c => c.status === 'active').length;
  const pendingCount = filteredClubs.filter(c => c.status === 'pending').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Clubs Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalClubs}</div>
                <div className="text-sm text-neutral-500">Clubs</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{activeCount}</div>
                <div className="text-sm text-neutral-500">Active</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{pendingCount}</div>
                <div className="text-sm text-neutral-500">Pending</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Inactive</div>
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
                    placeholder="Search club name or description..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Categories</option>
                    <option value="academic">Academic</option>
                    <option value="arts">Arts</option>
                    <option value="sports">Sports</option>
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Clubs Table */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredClubs.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Users"
              title="No clubs found"
              description="Start a club to get involved"
              actionLabel="Create Club"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Club Name</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Sponsor</TableHeadCell>
                <TableHeadCell style="primary">Members</TableHeadCell>
                <TableHeadCell style="primary">Meetings</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredClubs.slice(0, 15).map((club: Club, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{club.name}</span>
                    <span className="text-neutral-500 text-xs">{club.category}</span>
                    <span className="text-neutral-500 text-xs">{club.sponsorTeacher}</span>
                    <span className="text-neutral-500 text-xs">{club.memberCount}</span>
                    <span className="text-neutral-500 text-xs">{club.meetingFrequency}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${club.status}`}
                    >
                      {club.status}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredClubs.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredClubs.length} of {clubs.length} clubs</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export List</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}