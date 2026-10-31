'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageCircle, Search,
  CheckCircle2, X, Clock
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface Message {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  snippet: string;
  read: boolean;
  createdAt: string;
  category: 'general' | 'academic' | 'administrative' | 'urgent' | 'parent-teacher';
}

interface FilterState {
  search: string;
  category: 'all' | 'general' | 'academic' | 'administrative' | 'urgent' | 'parent-teacher';
  read: 'all' | 'unread' | 'read';
}

export default function MessagesPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', category: 'all', read: 'all' });
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

    // Load messages
    async function loadMessages() {
      try {
        const data = await api.get<any[]>('/api/v1/messages');
        setMessages(data || []);
      } catch (err) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  const filteredMessages = messages.filter((msg: Message) => {
    const matchesSearch = filters.search
      ? msg.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.snippet.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.sender.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.recipient.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesCategory = filters.category === 'all' || msg.category === filters.category;
    const matchesRead = filters.read === 'all'
      ? true
      : filters.read === 'unread' ? !msg.read : msg.read;

    return matchesSearch && matchesCategory && matchesRead;
  });

  // Compute summary stats
  const totalMessages = filteredMessages.length;
  const unreadCount = filteredMessages.filter(m => !m.read).length;
  const readCount = filteredMessages.filter(m => m.read).length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Messages Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalMessages}</div>
                <div className="text-sm text-neutral-500">Messages</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">{unreadCount}</div>
                <div className="text-sm text-neutral-500">Unread</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-green-600">{readCount}</div>
                <div className="text-sm text-neutral-500">Read</div>
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
                    placeholder="Search subject, sender, or recipient..."
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
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="administrative">Administrative</option>
                    <option value="urgent">Urgent</option>
                    <option value="parent-teacher">Parent-Teacher</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Read Status</label>
                  <select
                    value={filters.read}
                    onChange={(e) => setFilters({ ...filters, read: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Messages Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredMessages.length === 0 ? (
            <KpiEmptyStateComponent
              icon="MessageCircle"
              title="No messages found"
              description="Send and receive messages to get started"
              actionLabel="Send Message"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Subject</TableHeadCell>
                <TableHeadCell style="primary">Sender</TableHeadCell>
                <TableHeadCell style="primary">Recipient</TableHeadCell>
                <TableHeadCell style="primary">Read</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredMessages.slice(0, 15).map((msg: Message, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{msg.subject}</span>
                    <span className="text-neutral-500 text-xs">{msg.sender}</span>
                    <span className="text-neutral-500 text-xs">{msg.recipient}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${msg.read ? 'bg-brand-primary/20' : 'bg-neutral-200'}`}
                    >
                      {msg.read ? 'Read' : 'Unread'}
                    </span>
                    <span className="text-neutral-500 text-xs">{msg.category}</span>
                    <span className="text-neutral-500 text-xs">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredMessages.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredMessages.length} of {messages.length} messages</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Messages</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}