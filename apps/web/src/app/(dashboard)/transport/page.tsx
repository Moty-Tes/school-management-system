'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, Bus, Users, Search,
  CheckCircle2, X, UsersAdd, Circle
} from 'lucide-react';
import {
  Card, KpiEmptyState, Skeleton, Table, TableHeadCell, TableRowCell,
  EmptyState as KpiEmptyStateComponent
} from '@/components/ui';
import { use reducedMotion } from '@/hooks/use-reduced-motion';

interface TransportRecord {
  id: string;
  vehicleType: 'bus' | 'van' | 'car' | 'motorcycle';
  route: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  currentOccupancy: number;
  status: 'scheduled' | 'running' | 'delayed' | 'completed' | 'cancelled';
  driverName: string;
  routeId: string;
}

interface FilterState {
  search: string;
  vehicleType: 'all' | 'bus' | 'van' | 'car' | 'motorcycle';
  status: 'all' | 'scheduled' | 'running' | 'delayed' | 'completed' | 'cancelled';
}

export default function TransportPage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR'>('ADMIN');
  const [records, setRecords] = useState<TransportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', vehicleType: 'all', status: 'all' });
  const reducedMotion = use_reducedMotion();

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : 'TEACHER');
    });

    // Load transport records
    async function loadRecords() {
      try {
        const data = await api.get<any[]>('/api/v1/transport');
        setRecords(data || []);
      } catch (err) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }

    loadRecords();
  }, []);

  const filteredRecords = records.filter((record: TransportRecord) => {
    const matchesSearch = filters.search
      ? record.route.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.driverName.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesType = filters.vehicleType === 'all' || record.vehicleType === filters.vehicleType;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Compute summary stats
  const totalRecords = filteredRecords.length;
  const runningCount = filteredRecords.filter(r => r.status === 'running').length;
  const scheduledCount = filteredRecords.filter(r => r.status === 'scheduled').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Transport Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-neutral-900">{totalRecords}</div>
                <div className="text-sm text-neutral-500">Trips</div>
              </div>
            </Card>

            <Card>
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-brand-primary">{runningCount}</div>
                <div className="text-sm text-neutral-500">Running</div>
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
                <div className="text-sm text-neutral-500">Delayed</div>
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
                    placeholder="Search route or driver..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-colors ${reducedMotion ? 'transition-none' : ''}`}
                    defaultValue=""
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-1">Vehicle Type</label>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value } as any)}
                    className={`w-full rounded-lg border border-border dark:border-border-overlay px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 ${reducedMotion ? 'transition-none' : ''}`}
                  >
                    <option value="all">All Types</option>
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
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
                    <option value="scheduled">Scheduled</option>
                    <option value="running">Running</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Transport Table */}
          {loading ? (
            <Skeleton className="h-72 rounded-md animate-bounce" />
          ) : filteredRecords.length === 0 ? (
            <KpiEmptyStateComponent
              icon="Truck"
              title="No transport records found"
              description="Set up transport routes to get started"
              actionLabel="Add Route"
            />
          ) : (
            <Table>
              <TableSection.head>
                <TableHeadCell style="primary">Route</TableHeadCell>
                <TableHeadCell style="primary">Vehicle</TableHeadCell>
                <TableHeadCell style="primary">Departure</TableHeadCell>
                <TableHeadCell style="primary">Arrival</TableHeadCell>
                <TableHeadCell style="primary">Occupancy</TableHeadCell>
                <TableHeadCell style="primary">Status</TableHeadCell>
              </TableSection.head>
              <TableSection.body>
                {filteredRecords.slice(0, 15).map((record: TransportRecord, index: number) => (
                  <TableRowCell key={index} style="primary">
                    <span className="font-medium text-neutral-700">{record.route}</span>
                    <span className="text-neutral-500 text-xs">{record.vehicleType}</span>
                    <span className="text-neutral-500 text-xs">{new Date(record.departureTime).toLocaleTimeString()}</span>
                    <span className="text-neutral-500 text-xs">{new Date(record.arrivalTime).toLocaleTimeString()}</span>
                    <span className="text-neutral-500 text-xs">{record.currentOccupancy}/{record.capacity}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 rounded text-xs font-medium ${record.status}`}
                    >
                      {record.status}
                    </span>
                  </TableRowCell>
                ))}
              </TableSection.body>
            </Table>
          )}

          {/* Export & Reports */}
          {filteredRecords.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
              <span>Showing {filteredRecords.length} of {records.length} records</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Export Routes</Button>
                <Button variant="primary" size="sm">Generate Report</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}