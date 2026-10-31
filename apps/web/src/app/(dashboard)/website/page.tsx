'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Globe, Search,
  CheckCircle2, X
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  type: 'blog' | 'landing' | 'about' | 'contact' | 'privacy' | 'terms';
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  metaTitle: string;
  metaDescription: string;
  viewCount: number;
}

interface FilterState {
  search: string;
  type: 'all' | 'blog' | 'landing' | 'about' | 'contact' | 'privacy' | 'terms';
  status: 'all' | 'draft' | 'published' | 'archived';
}

export default function WebsitePage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', type: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load website pages
    async function loadPages() {
      try {
        const data = await api.get<any[]>('/api/v1/website');
        setPages(data || []);
      } catch (err) {
        setPages([]);
      } finally {
        setLoading(false);
      }
    }

    loadPages();
  }, []);

  const filteredPages = pages.filter((page: WebsitePage) => {
    const matchesSearch = filters.search
      ? page.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        page.slug.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.type === 'all' || page.type === filters.type;
    const matchesStatus = filters.status === 'all' || page.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Compute summary stats
  const totalPages = filteredPages.length;
  const publishedCount = filteredPages.filter(p => p.status === 'published').length;
  const draftCount = filteredPages.filter(p => p.status === 'draft').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Website Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalPages}</div>
                <div className="text-sm text-neutral-500">Website Pages</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{publishedCount}</div>
                <div className="text-sm text-neutral-500">Published</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{draftCount}</div>
                <div className="text-sm text-neutral-500">Drafts</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Archived</div>
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
                    placeholder="Search page title or slug..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Types</option>
                    <option value="blog">Blog</option>
                    <option value="landing">Landing</option>
                    <option value="about">About</option>
                    <option value="contact">Contact</option>
                    <option value="privacy">Privacy</option>
                    <option value="terms">Terms</option>
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
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Website Pages Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredPages.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Globe"
              title="No website pages found"
              description="Create website pages to get started"
              actionLabel="Create Page"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Title</TableHeadCell>
                <TableHeadCell style="primary">Type</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Views</TableHeadCell>
                <TableHeadCell style="primary">Last Published</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredPages.slice(0, 15).map((page: WebsitePage, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{page.title}</span>
                    <span className="text-neutral-500 text-xs">{page.type}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${page.status}`}>{page.status}</span>
                    <span className="text-neutral-500 text-xs">{page.viewCount}</span>
                    <span className="text-neutral-500 text-xs">{page.publishedAt ? new Date(page.publishedAt).toLocaleDateString() : '—'}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredPages.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredPages.length} of {pages.length} pages</span>
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