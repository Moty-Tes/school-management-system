'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Megaphone, Search,
  CheckCircle2, X, Clock
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'academic' | 'event' | 'holiday' | 'urgent' | 'general';
  author: string;
  createdAt: string;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  expiryDate: string | null;
  priority: 'low' | 'medium' | 'high';
}

interface FilterState {
  search: string;
  category: 'all' | 'academic' | 'event' | 'holiday' | 'urgent' | 'general';
  priority: 'all' | 'low' | 'medium' | 'high';
  audience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
}

export default function AnnouncementsPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all', priority: 'all', audience: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');
      const isParent = userRoles.includes('PARENT');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : isParent ? 'PARENT' : 'ADMIN');
    });

    // Load announcements
    async function loadAnnouncements() {
      try {
        const data = await api.get<any[]>('/api/v1/announcements');
        setAnnouncements(data || []);
      } catch (err) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter((ann: Announcement) => {
    const matchesSearch = filters.search
      ? ann.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        ann.content.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || ann.category === filters.category;
    const matchesPriority = filters.priority === 'all' || ann.priority === filters.priority;
    const matchesAudience = filters.audience === 'all' || ann.targetAudience === filters.audience;

    return matchesSearch && matchesCategory && matchesPriority && matchesAudience;
  });

  // Compute summary stats
  const totalAnnouncements = filteredAnnouncements.length;
  const highPriority = filteredAnnouncements.filter(a => a.priority === 'high').length;
  const urgentCount = filteredAnnouncements.filter(a => a.category === 'urgent').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Announcements Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalAnnouncements}</div>
                <div className="text-sm text-neutral-500">Announcements</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">{highPriority}</div>
                <div className="text-sm text-neutral-500">High Priority</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">{urgentCount}</div>
                <div className="text-sm text-neutral-500">Urgent</div>
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
              <div className="grid grid-cols-4 gap-3">
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
                    <option value="academic">Academic</option>
                    <option value="event">Event</option>
                    <option value="holiday">Holiday</option>
                    <option value="urgent">Urgent</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Audience</label>
                  <select
                    value={filters.audience}
                    onChange={(e) => setFilters({ ...filters, audience: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Audiences</option>
                    <option value="students">Students</option>
                    <option value="parents">Parents</option>
                    <option value="teachers">Teachers</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Announcements Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredAnnouncements.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Megaphone"
              title="No announcements found"
              description="Post announcements to get started"
              actionLabel="Post Announcement"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Title</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Priority</TableHeadCell>
                <TableHeadCell style="primary">Audience</TableHeadCell>
                <TableHeadCell style="primary">Created</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredAnnouncements.slice(0, 15).map((ann: Announcement, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{ann.title}</span>
                    <span className="text-neutral-500 text-xs">{ann.category}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${ann.priority}`}>{ann.priority}</span>
                    <span className="text-neutral-500 text-xs">{ann.targetAudience}</span>
                    <span className="text-neutral-500 text-xs">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredAnnouncements.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredAnnouncements.length} of {announcements.length} announcements</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export List</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}