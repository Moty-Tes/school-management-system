'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Broadcast, Search,
  CheckCircle2, X, UsersAdd, Clock
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  category: 'system' | 'academic' | 'event' | 'urgent' | 'general';
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  createdAt: string;
  expiryDate: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'archived';
  views: number;
}

interface FilterState {
  search: string;
  category: 'all' | 'system' | 'academic' | 'event' | 'urgent' | 'general';
  status: 'all' | 'draft' | 'scheduled' | 'live' | 'archived';
}

export default function BroadcastsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
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

    // Load broadcasts
    async function loadBroadcasts() {
      try {
        const data = await api.get<any[]>('/api/v1/broadcasts');
        setBroadcasts(data || []);
      } catch (err) {
        setBroadcasts([]);
      } finally {
        setLoading(false);
      }
    }

    loadBroadcasts();
  }, []);

  const filteredBroadcasts = broadcasts.filter((broadcast: Broadcast) => {
    const matchesSearch = filters.search
      ? broadcast.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        broadcast.content.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || broadcast.category === filters.category;
    const matchesStatus = filters.status === 'all' || broadcast.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Compute summary stats
  const totalBroadcasts = filteredBroadcasts.length;
  const liveCount = filteredBroadcasts.filter(b => b.status === 'live').length;
  const scheduledCount = filteredBroadcasts.filter(b => b.status === 'scheduled').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Broadcasts Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalBroadcasts}</div>
                <div className="text-sm text-neutral-500">Broadcasts</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{liveCount}</div>
                <div className="text-sm text-neutral-500">Live</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">{scheduledCount}</div>
                <div className="text-sm text-neutral-500">Scheduled</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Drafts</div>
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
                    placeholder="Search title or content..."
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
                    <option value="system">System</option>
                    <option value="academic">Academic</option>
                    <option value="event">Event</option>
                    <option value="urgent">Urgent</option>
                    <option value="general">General</option>
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
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Broadcasts Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredBroadcasts.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Broadcast"
              title="No broadcasts found"
              description="Schedule broadcasts to get started"
              actionLabel="Schedule Broadcast"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Title</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Audience</TableHeadCell>
                <TableHeadCell style="primary">Views</TableHeadCell>
                <TableHeadCell style="primary">Created</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredBroadcasts.slice(0, 15).map((broadcast: Broadcast, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{broadcast.title}</span>
                    <span className="text-neutral-500 text-xs">{broadcast.category}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${broadcast.status}`}>{broadcast.status}</span>
                    <span className="text-neutral-500 text-xs">{broadcast.targetAudience}</span>
                    <span className="text-neutral-500 text-xs">{broadcast.views}</span>
                    <span className="text-neutral-500 text-xs">{new Date(broadcast.createdAt).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredBroadcasts.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredBroadcasts.length} of {broadcasts.length} broadcasts</span>
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