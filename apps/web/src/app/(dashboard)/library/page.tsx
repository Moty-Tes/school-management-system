'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, Library, Search,
  FileText, TrendingUp, CheckCircle2, X
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: 'textbook' | 'reference' | 'fiction' | 'non-fiction' | 'children';
  availableCopies: number;
  totalCopies: number;
  status: 'available' | 'borrowed' | 'lost' | 'maintenance';
  studentId: string | null;
  borrowDate: string | null;
  dueDate: string | null;
}

interface FilterState {
  search: string;
  category: 'all' | 'textbook' | 'reference' | 'fiction' | 'non-fiction' | 'children';
  status: 'all' | 'available' | 'borrowed' | 'lost' | 'maintenance';
}

export default function LibraryPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [books, setBooks] = useState<Book[]>([]);
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

    // Load books
    async function loadBooks() {
      try {
        const data = await api.get<any[]>('/api/v1/library');
        setBooks(data || []);
      } catch (err) {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  const filteredBooks = books.filter((book: Book) => {
    const matchesSearch = filters.search
      ? book.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.author.toLowerCase().includes(filters.search.toLowerCase()) ||
        book.isbn.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || book.category === filters.category;
    const matchesStatus = filters.status === 'all' || book.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Compute summary stats
  const totalBooks = filteredBooks.length;
  const availableCount = filteredBooks.filter(b => b.status === 'available').length;
  const borrowedCount = filteredBooks.filter(b => b.status === 'borrowed').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Library Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalBooks}</div>
                <div className="text-sm text-neutral-500">Books</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{availableCount}</div>
                <div className="text-sm text-neutral-500">Available</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-amber-600">{borrowedCount}</div>
                <div className="text-sm text-neutral-500">Borrowed</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Maintenance</div>
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
                    placeholder="Search title, author, or ISBN..."
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
                    <option value="textbook">Textbook</option>
                    <option value="reference">Reference</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                    <option value="children">Children</option>
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
                    <option value="available">Available</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="lost">Lost</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Books Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredBooks.length === 0 ? (
            <KpiEmptyStateComponent
              icon="BookOpen"
              title="No books found"
              description="Add books to the library to get started"
              actionLabel="Add Book"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Title</TableHeadCell>
                <TableHeadCell style="primary">Author</TableHeadCell>
                <TableHeadCell style="primary">ISBN</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
                <TableHeadCell style="primary">Available</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredBooks.slice(0, 15).map((book: Book, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{book.title}</span>
                    <span className="text-neutral-500 text-xs">{book.author}</span>
                    <span className="text-neutral-500 text-xs">{book.isbn}</span>
                    <span className="text-neutral-500 text-xs">{book.category}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${book.status}`}
                    >
                      {book.status}
                    </span>
                    <span className="text-neutral-500 text-xs">{book.availableCopies}/{book.totalCopies}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredBooks.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredBooks.length} of {books.length} books</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Catalog</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}