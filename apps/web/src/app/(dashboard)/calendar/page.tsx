'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Shield, TrendingUp, FileText,
  Archive, Eye, X, Search, UsersAdd, MapPin
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: 'academic' | 'exam' | 'holiday' | 'event' | 'parent' | 'admin';
  color: string;
  allDay: boolean;
  recurrence: 'none' | 'weekly' | 'monthly' | 'yearly';
}

interface FilterState {
  category: 'all' | 'academic' | 'exam' | 'holiday' | 'event' | 'parent' | 'admin';
  dateRange: 'today' | 'this-week' | 'this-month' | 'this-term' | 'custom';
  search: string;
}

export default function CalendarPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | 'REGISTRAR'>('ADMIN');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ category: 'all', dateRange: 'this-month', search: '' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isTeacher = userRoles.includes('TEACHER');
      const isParent = userRoles.includes('PARENT');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isTeacher ? 'TEACHER' : isParent ? 'PARENT' : isRegistrar ? 'REGISTRAR' : 'ADMIN');
    });

    // Load events
    async function loadEvents() {
      try {
        const data = await api.get<any[]>('/api/v1/calendar');
        setEvents(data || []);
      } catch (err) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const filteredEvents = events.filter((event: Event) => {
    const matchesCategory = filters.category === 'all' || event.category === filters.category;
    const matchesSearch = filters.search
      ? event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.location.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  // Compute summary stats
  const totalEvents = filteredEvents.length;
  const academicEvents = filteredEvents.filter(e => e.category === 'academic').length;
  const examEvents = filteredEvents.filter(e => e.category === 'exam').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Calendar Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalEvents}</div>
                <div className="text-sm text-neutral-500">Events</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{academicEvents}</div>
                <div className="text-sm text-neutral-500">Academic</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-red-600">{examEvents}</div>
                <div className="text-sm text-neutral-500">Exams</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Holidays</div>
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
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Categories</option>
                    <option value="academic">Academic</option>
                    <option value="exam">Exam</option>
                    <option value="holiday">Holiday</option>
                    <option value="event">Event</option>
                    <option value="parent">Parent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="today">Today</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="this-term">This Term</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search event or location..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Events List */}
          {loading ? (
            <Skeleton className="h-80 rounded-md animate-bounce" />
          ) : filteredEvents.length === 0 ? (
            <KpiEmptyStateComponent
              icon="CalendarX"
              title="No events found"
              description="Add events to the calendar to get started"
              actionLabel="Add Event"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Title</TableHeadCell>
                <TableHeadCell style="primary">Date</TableHeadCell>
                <TableHeadCell style="primary">Time</TableHeadCell>
                <TableHeadCell style="primary">Location</TableHeadCell>
                <TableHeadCell style="primary">Category</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredEvents.slice(0, 20).map((event: Event, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{event.title}</span>
                    <span className="text-neutral-500 text-xs">{new Date(event.date).toLocaleDateString()}</span>
                    <span className="text-neutral-500 text-xs">
                      {event.startTime} - {event.endTime}
                    </span>
                    <span className="text-neutral-500 text-xs">{event.location}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${event.category}`}
                    >
                      {event.category}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & iCal */}
          {filteredEvents.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredEvents.length} of {events.length} events</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export iCal</Button>
                <Button variant="primary" size="sm">Print Month</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}