'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Grid, Eye, X, Search, Shield
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell, EmptyState, KpiEmptyStateComponent, KpiCard, TableSection, Button
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  subject: string;
  teacher: string;
  room: string;
  class: string;
}

interface FilterState {
  day: 'all' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7';
  search: string;
}

export default function TimetablePage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ day: 'all', period: 'all', search: '' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load timetable
    async function loadTimetable() {
      try {
        const data = await api.get<any[]>('/api/v1/timetable');
        setTimetable(data || []);
      } catch (err) {
        setTimetable([]);
      } finally {
        setLoading(false);
      }
    }

    loadTimetable();
  }, []);

  const filteredSlots = timetable.filter((slot: TimetableSlot) => {
    const matchesDay = filters.day === 'all' || slot.day === filters.day;
    const matchesPeriod = filters.period === 'all' || slot.period === filters.period;
    const matchesSearch = filters.search
      ? slot.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
        slot.teacher.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesDay && matchesPeriod && matchesSearch;
  });

  // Compute summary stats
  const totalSlots = filteredSlots.length;
  const daysCovered = new Set(filteredSlots.map(s => s.day)).size;
  const periodsCovered = new Set(filteredSlots.map(s => s.period)).size;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Timetable Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalSlots}</div>
                <div className="text-sm text-neutral-500">Time Slots</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-700">{daysCovered}</div>
                <div className="text-sm text-neutral-500">Days</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-700">{periodsCovered}</div>
                <div className="text-sm text-neutral-500">Periods</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-500">0</div>
                <div className="text-sm text-neutral-500">Sections</div>
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
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Day</label>
                  <select
                    value={filters.day}
                    onChange={(e) => setFilters({ ...filters, day: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Days</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Period</label>
                  <select
                    value={filters.period}
                    onChange={(e) => setFilters({ ...filters, period: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Periods</option>
                    <option value="1">Period 1</option>
                    <option value="2">Period 2</option>
                    <option value="3">Period 3</option>
                    <option value="4">Period 4</option>
                    <option value="5">Period 5</option>
                    <option value="6">Period 6</option>
                    <option value="7">Period 7</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Search</label>
                  <input
                    type="text"
                    placeholder="Search subject or teacher..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Timetable Grid */}
          {loading ? (
            <Skeleton className="h-64 rounded-md animate-bounce" />
          ) : filteredSlots.length === 0 ? (
            <KpiEmptyStateComponent
              icon="CalendarX"
              title="No timetable found"
              description="Generate timetable to get started"
              actionLabel="Generate Timetable"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Day</TableHeadCell>
                <TableHeadCell style="primary">Period</TableHeadCell>
                <TableHeadCell style="primary">Subject</TableHeadCell>
                <TableHeadCell style="primary">Teacher</TableHeadCell>
                <TableHeadCell style="primary">Room</TableHeadCell>
                <TableHeadCell style="primary">Class</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredSlots.slice(0, 25).map((slot: TimetableSlot, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{slot.day}</span>
                    <span className="text-neutral-500 text-xs">P{slot.period}</span>
                    <span className="font-medium text-neutral-700">{slot.subject}</span>
                    <span className="text-neutral-500 text-xs">{slot.teacher}</span>
                    <span className="text-neutral-500 text-xs">{slot.room}</span>
                    <span className="text-neutral-500 text-xs">{slot.class}</span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Print */}
          {filteredSlots.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredSlots.length} of {timetable.length} slots</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export iCal</Button>
                <Button variant="primary" size="sm">Print Schedule</Button>
              </div>
            </div>
          )}
                </div>
      </motion.div>
    </div>
  );
}