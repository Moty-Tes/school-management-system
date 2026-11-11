'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getMe } from '@/lib/auth';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Shield,
  QrCode,
  Clock,
  UserCheck,
  AlertTriangle,
  Send,
  Building,
  Bell,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  Skeleton,
  Table,
  TableHeadCell,
  TableRowCell,
  KpiEmptyStateComponent,
  TableSection,
  Button,
} from '@/components/ui';
import { use_reducedMotion } from '@/hooks/use-reduced-motion';

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  period: string;
  className: string;
}

interface FilterState {
  search: string;
  status: 'all' | 'present' | 'absent' | 'late' | 'excused';
  dateRange: 'today' | 'this-week' | 'this-month' | 'custom';
}

interface GateScanResult {
  scanId: string;
  direction: 'ENTRY' | 'EXIT';
  timestamp: string;
  duplicateScanSuppressed?: boolean;
  message?: string;
  student: {
    id: string;
    admissionNumber: string;
    name: string;
    class: string;
    photoUrl?: string;
  };
  attendance?: {
    status: 'PRESENT' | 'LATE';
    recordedAt: string;
  };
  simulatedNotification?: {
    recipient: string;
    message: string;
    sentAt: string;
    status: string;
  };
}

interface PostDismissalReport {
  currentTime: string;
  dismissalTime: string;
  graceMinutes: number;
  totalEnrolled: number;
  checkedOutCount: number;
  remainingCount: number;
  verificationNotice: string;
  recommendedStaffAction: string;
  studentsRequiringVerification: Array<{
    id: string;
    admissionNumber: string;
    name: string;
    class: string;
    lastSeenAt?: string;
  }>;
}

interface EarlyWarningInsights {
  period: {
    startDate: string;
    endDate: string;
  };
  policy: {
    thresholdPercent: number;
    criticalPercent: number;
    minSessions: number;
    formula: string;
  };
  summary: {
    totalRecords: number;
    uniqueStudents: number;
    flaggedCount: number;
    criticalCount: number;
    warningCount: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    overallAttendanceRate: number;
  };
  flaggedStudents: Array<{
    studentId: string;
    admissionNumber: string;
    studentName: string;
    classId: string;
    className: string;
    totalSessions: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
    attendanceRate: number;
    riskLevel: 'CRITICAL' | 'WARNING';
    lastRecordedDate: string;
  }>;
}

function getIsoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [role, setRole] = useState<'ADMIN' | 'TEACHER' | 'REGISTRAR' | 'PARENT'>('ADMIN');
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'EARLY_WARNING' | 'GATE_SCANNER'>('ROSTER');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', dateRange: 'this-week' });
  const reducedMotion = use_reducedMotion();

  // Early-Warning Insights state
  const [insightsStartDate, setInsightsStartDate] = useState<string>(() => getIsoDaysAgo(29));
  const [insightsEndDate, setInsightsEndDate] = useState<string>(() => getIsoDaysAgo(0));
  const [insightsThreshold, setInsightsThreshold] = useState<number>(85);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsData, setInsightsData] = useState<EarlyWarningInsights | null>(null);

  // Gate Scanner state
  const [scanAdmissionNumber, setScanAdmissionNumber] = useState('');
  const [scanDirection, setScanDirection] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [scanLoading, setScanLoading] = useState(false);
  const [latestScanResult, setLatestScanResult] = useState<GateScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Post-dismissal check state
  const [dismissalLoading, setDismissalLoading] = useState(false);
  const [dismissalReport, setDismissalReport] = useState<PostDismissalReport | null>(null);

  useEffect(() => {
    getMe().then((me: any) => {
      const userRoles: string[] = me?.roles || [];
      const isSuperAdmin = userRoles.includes('SUPER_ADMIN');
      const isTenantAdmin = userRoles.includes('TENANT_ADMIN');
      const isRegistrar = userRoles.includes('REGISTRAR');
      const isParent = userRoles.includes('PARENT');

      setRole(isSuperAdmin || isTenantAdmin ? 'ADMIN' : isRegistrar ? 'REGISTRAR' : isParent ? 'PARENT' : 'TEACHER');
    });

    loadAttendance();
    loadRecentGateScans();
    loadEarlyWarningInsights(insightsStartDate, insightsEndDate, insightsThreshold);
  }, []);

  async function loadEarlyWarningInsights(
    start = insightsStartDate,
    end = insightsEndDate,
    threshold = insightsThreshold
  ) {
    if (start && end && start > end) {
      setInsightsError('Start date must be on or before the end date.');
      return;
    }

    try {
      setInsightsLoading(true);
      setInsightsError(null);
      const params = new URLSearchParams({
        startDate: start,
        endDate: end,
        thresholdPercent: String(threshold),
      });
      const res = await api.get<EarlyWarningInsights>(`/api/v1/attendance/insights?${params.toString()}`);
      setInsightsData(res);
    } catch (err: any) {
      setInsightsError(err?.message || 'Unable to load attendance early-warning insights.');
    } finally {
      setInsightsLoading(false);
    }
  }

  async function loadAttendance() {
    try {
      setLoading(true);
      const res = await api.get<any>('/api/v1/attendance');
      const records = Array.isArray(res) ? res : res?.data || [];
      setAttendanceRecords(records);
    } catch {
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentGateScans() {
    try {
      const res = await api.get<any>('/api/v1/gate/recent');
      if (res?.data) {
        setRecentScans(res.data);
      }
    } catch {
      // Gate scanner may be restricted or empty
    }
  }

  async function handleGateScan(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!scanAdmissionNumber.trim()) return;

    setScanLoading(true);
    setScanError(null);
    try {
      const res = await api.post<any>('/api/v1/gate/scan', {
        admissionNumber: scanAdmissionNumber.trim().toUpperCase(),
        direction: scanDirection,
      });

      if (res?.data) {
        setLatestScanResult(res.data);
        setScanAdmissionNumber('');
        loadRecentGateScans();
      }
    } catch (err: any) {
      setScanError(err.message || 'Failed to record gate scan. Please verify student admission number.');
    } finally {
      setScanLoading(false);
    }
  }

  async function handlePostDismissalCheck() {
    setDismissalLoading(true);
    try {
      const res = await api.get<any>('/api/v1/gate/post-dismissal-check?graceMinutes=5');
      if (res?.data) {
        setDismissalReport(res.data);
      }
    } catch (err: any) {
      setScanError(err.message || 'Unable to retrieve post-dismissal verification.');
    } finally {
      setDismissalLoading(false);
    }
  }

  const filteredRecords = attendanceRecords.filter((record: AttendanceRecord) => {
    const matchesSearch = filters.search
      ? record.studentName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        record.studentId?.toLowerCase().includes(filters.search.toLowerCase())
      : true;
    const matchesStatus = filters.status === 'all' || record.status === filters.status;

    return matchesSearch && matchesStatus;
  });

  const totalRecords = filteredRecords.length;
  const presentCount = filteredRecords.filter((r) => r.status === 'present').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'absent').length;
  const lateCount = filteredRecords.filter((r) => r.status === 'late').length;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="reduced-motion:transition-none"
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Attendance & Campus Entry Security
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Real-time student arrival verification, classroom roll call, and campus gate tracking
              </p>
            </div>

            <div className="flex flex-wrap rounded-xl bg-neutral-200 dark:bg-neutral-800 p-1 self-start sm:self-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('ROSTER')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'ROSTER'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Classroom Roster
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('EARLY_WARNING')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'EARLY_WARNING'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Early Warning
                {insightsData && insightsData.summary.flaggedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[10px] font-bold">
                    {insightsData.summary.flaggedCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('GATE_SCANNER')}
                className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'GATE_SCANNER'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                Gate Scanner Terminal
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>
          </div>

          {/* TAB 1: CLASSROOM ROSTER */}
          {activeTab === 'ROSTER' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">{totalRecords}</div>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Total Records</div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{presentCount}</div>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Present</div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">{absentCount}</div>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Absent</div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4 text-center">
                    <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{lateCount}</div>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">Late Arrivals</div>
                  </div>
                </Card>
              </div>

              {/* Attendance Filters */}
              <Card>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                      Filter Roster
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        Date Range
                      </label>
                      <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="today">Today</option>
                        <option value="this-week">This Week</option>
                        <option value="this-month">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="all">All Statuses</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        Search Student
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Name or Admission ID..."
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Attendance Table */}
              {loading ? (
                <Skeleton className="h-96 rounded-xl" />
              ) : filteredRecords.length === 0 ? (
                <KpiEmptyStateComponent
                  icon="CalendarX"
                  title="No attendance records found"
                  description="No matching classroom records found for this period."
                  actionLabel="Refresh Records"
                  actionOnClick={loadAttendance}
                />
              ) : (
                <Table>
                  <TableSection.head>
                    <TableHeadCell style="primary">Student</TableHeadCell>
                    <TableHeadCell style="primary">Date</TableHeadCell>
                    <TableHeadCell style="primary">Period</TableHeadCell>
                    <TableHeadCell style="primary">Status</TableHeadCell>
                    <TableHeadCell style="primary">Class</TableHeadCell>
                  </TableSection.head>
                  <TableSection.body>
                    {filteredRecords.slice(0, 20).map((record: AttendanceRecord, index: number) => (
                      <TableRowCell key={record.id || index} style="primary">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{record.studentName}</span>
                        <span className="text-neutral-500 text-xs">{new Date(record.date).toLocaleDateString()}</span>
                        <span className="text-neutral-500 text-xs">{record.period || 'Morning Session'}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            record.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : record.status === 'late'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {record.status}
                        </span>
                        <span className="text-neutral-500 text-xs">{record.className}</span>
                      </TableRowCell>
                    ))}
                  </TableSection.body>
                </Table>
              )}
            </div>
          )}

          {/* TAB 2: EARLY WARNING INSIGHTS */}
          {activeTab === 'EARLY_WARNING' && (
            <div className="space-y-6">
              <Card>
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Attendance Early-Warning Policy &amp; Period Filter
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Flags students with at least {insightsData?.policy.minSessions ?? 3} recorded sessions whose attendance rate falls below {insightsThreshold}% (Critical below {Math.max(0, insightsThreshold - 10)}%). Rate = (Present + Late) / Total Sessions.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => loadEarlyWarningInsights(insightsStartDate, insightsEndDate, insightsThreshold)}
                      disabled={insightsLoading}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                      Analyze Period
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={insightsStartDate}
                        onChange={(e) => setInsightsStartDate(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={insightsEndDate}
                        onChange={(e) => setInsightsEndDate(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                        Alert Threshold (%)
                      </label>
                      <select
                        value={insightsThreshold}
                        onChange={(e) => {
                          const nextVal = Number(e.target.value);
                          setInsightsThreshold(nextVal);
                          loadEarlyWarningInsights(insightsStartDate, insightsEndDate, nextVal);
                        }}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-xs"
                      >
                        <option value={80}>Below 80% (Strict)</option>
                        <option value={85}>Below 85% (School Standard)</option>
                        <option value={90}>Below 90% (Early Watch)</option>
                      </select>
                    </div>
                  </div>

                  {insightsError && (
                    <div className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{insightsError}</span>
                    </div>
                  )}
                </div>
              </Card>

              {insightsLoading ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : insightsData ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <div className="p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                          {insightsData.summary.overallAttendanceRate}%
                        </div>
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">
                          Period Attendance Rate
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                          {insightsData.summary.uniqueStudents}
                        </div>
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">
                          Students Tracked
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                          {insightsData.summary.warningCount}
                        </div>
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">
                          Warning Tier
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="p-4 text-center">
                        <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                          {insightsData.summary.criticalCount}
                        </div>
                        <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mt-1">
                          Critical Tier
                        </div>
                      </div>
                    </Card>
                  </div>

                  {insightsData.flaggedStudents.length === 0 ? (
                    <KpiEmptyStateComponent
                      icon="CheckCircle2"
                      title="No Early-Warning Alerts"
                      description={`All students with at least ${insightsData.policy.minSessions} sessions met the ${insightsData.policy.thresholdPercent}% attendance threshold between ${insightsData.period.startDate} and ${insightsData.period.endDate}.`}
                      actionLabel="Refresh Analysis"
                      actionOnClick={() => loadEarlyWarningInsights(insightsStartDate, insightsEndDate, insightsThreshold)}
                    />
                  ) : (
                    <Card>
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Student</th>
                              <th className="py-2.5 px-3">Class</th>
                              <th className="py-2.5 px-3">Sessions</th>
                              <th className="py-2.5 px-3">Absent / Late</th>
                              <th className="py-2.5 px-3">Rate</th>
                              <th className="py-2.5 px-3">Risk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {insightsData.flaggedStudents.map((item) => (
                              <tr key={item.studentId}>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {item.studentName}
                                  </div>
                                  <div className="text-[11px] font-mono text-neutral-400">
                                    {item.admissionNumber}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                                  {item.className}
                                </td>
                                <td className="py-3 px-3 font-mono">{item.totalSessions}</td>
                                <td className="py-3 px-3 text-neutral-600 dark:text-neutral-300">
                                  {item.absentCount} absent / {item.lateCount} late
                                </td>
                                <td className="py-3 px-3 font-bold text-neutral-900 dark:text-neutral-100">
                                  {item.attendanceRate}%
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      item.riskLevel === 'CRITICAL'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    }`}
                                  >
                                    {item.riskLevel}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* TAB 3: GATE SCANNER TERMINAL */}
          {activeTab === 'GATE_SCANNER' && (
            <div className="space-y-6">
              {/* Hardware Disconnected Notice */}
              <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-mono text-[10px] font-bold">
                        DEMO SIMULATION
                      </span>
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Physical Turnstile Disconnected - Simulated ID Input Terminal
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      In production, automated optical barcode scanners and RFID turnstiles stream check-ins directly via
                      campus local LAN. Use the interactive input below to simulate student arrival badges, verify least-privilege
                      field projection, test duplicate scan dampening, and queue parent notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scanner Control Box */}
              <Card>
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                        Virtual Turnstile Station
                      </h3>
                    </div>

                    {/* Direction Toggle */}
                    <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700">
                      <button
                        type="button"
                        onClick={() => setScanDirection('ENTRY')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                          scanDirection === 'ENTRY'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        Morning Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanDirection('EXIT')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                          scanDirection === 'EXIT'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        Afternoon Exit
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleGateScan} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Scan or enter student Admission ID (e.g., ET-2026-9-001)..."
                        value={scanAdmissionNumber}
                        onChange={(e) => setScanAdmissionNumber(e.target.value)}
                        className="w-full pl-3 pr-24 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-mono text-neutral-400">
                        BARCODE_IN
                      </span>
                    </div>

                    <Button type="submit" variant="primary" loading={scanLoading}>
                      Record Scan
                    </Button>
                  </form>

                  {/* Quick-Fill Sample Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Quick Demo Badges:
                    </span>
                    {[
                      { id: 'ET-2026-9-001', label: 'Grade 9-A (Abebe)' },
                      { id: 'ET-2026-10-001', label: 'Grade 10-A (Yonas)' },
                      { id: 'ET-2026-11-001', label: 'Grade 11-A Nat (Haile)' },
                      { id: 'ET-2026-12-001', label: 'Grade 12-A Soc (Solomon)' },
                    ].map((badge) => (
                      <button
                        key={badge.id}
                        type="button"
                        onClick={() => setScanAdmissionNumber(badge.id)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-indigo-500 transition-colors font-mono"
                      >
                        {badge.id} <span className="text-[10px] text-neutral-400 font-sans">({badge.label})</span>
                      </button>
                    ))}
                  </div>

                  {scanError && (
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Scan Feedback & Least-Privilege Card */}
              {latestScanResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gate Turnstile Feedback */}
                  <Card>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                        <div className="flex items-center gap-2">
                          {latestScanResult.duplicateScanSuppressed ? (
                            <Clock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                            {latestScanResult.duplicateScanSuppressed
                              ? 'Duplicate Scan Suppressed'
                              : 'Gate Scan Accepted'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {new Date(latestScanResult.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {latestScanResult.student.photoUrl ? (
                          <img
                            src={latestScanResult.student.photoUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 dark:border-neutral-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                            {latestScanResult.student.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {latestScanResult.student.name}
                          </h4>
                          <p className="text-xs font-mono text-neutral-500">
                            {latestScanResult.student.admissionNumber} • {latestScanResult.student.class}
                          </p>
                        </div>
                      </div>

                      {latestScanResult.attendance && (
                        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2.5 flex items-center justify-between text-xs">
                          <span className="text-neutral-600 dark:text-neutral-400">Classroom Roll Status:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                              latestScanResult.attendance.status === 'PRESENT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {latestScanResult.attendance.status}
                          </span>
                        </div>
                      )}

                      {/* Least Privilege Notice */}
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>
                          Least privilege enforced: Turnstile operator cannot see student grades, health records, or fee ledgers.
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Simulated Guardian Dispatch Notification */}
                  <Card>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                            Guardian Notification Dispatch
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          SIMULATED DISPATCH
                        </span>
                      </div>

                      {latestScanResult.simulatedNotification ? (
                        <div className="space-y-2 text-xs">
                          <div className="text-neutral-500">
                            Recipient:{' '}
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {latestScanResult.simulatedNotification.recipient}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-sans text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 italic">
                            &ldquo;{latestScanResult.simulatedNotification.message}&rdquo;
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                            <Send className="w-3 h-3 text-emerald-500" />
                            <span>Queued in SMS/App Notification Queue • Zero Carrier Fees Incurred</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400">No guardian notification queued for this event.</p>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Post-Dismissal Grace Period Check Station */}
              <Card>
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Post-Dismissal Grace Period Reconciliation
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Verifies students remaining on campus after standard 3:30 PM dismissal with non-alarming verification guidance.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handlePostDismissalCheck}
                      loading={dismissalLoading}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Run 5-Min Grace Check
                    </Button>
                  </div>

                  {dismissalReport && (
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2.5">
                          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {dismissalReport.totalEnrolled}
                          </div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                            Total Students
                          </div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5 border border-emerald-200 dark:border-emerald-900">
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {dismissalReport.checkedOutCount}
                          </div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase tracking-wider font-semibold">
                            Exited Gate
                          </div>
                        </div>
                        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2.5 border border-indigo-200 dark:border-indigo-900">
                          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {dismissalReport.remainingCount}
                          </div>
                          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 uppercase tracking-wider font-semibold">
                            On Campus
                          </div>
                        </div>
                        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-2.5">
                          <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {dismissalReport.graceMinutes} min
                          </div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                            Grace Window
                          </div>
                        </div>
                      </div>

                      {/* Calm Staff Guidance Banner */}
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3.5 space-y-1">
                        <div className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Staff Protocol Guidance</span>
                        </div>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          {dismissalReport.recommendedStaffAction}
                        </p>
                      </div>

                      {/* Remaining Students List */}
                      {dismissalReport.studentsRequiringVerification.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                            Active Students on Campus ({dismissalReport.studentsRequiringVerification.length})
                          </h4>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
                            {dismissalReport.studentsRequiringVerification.slice(0, 15).map((st) => (
                              <div key={st.id} className="p-2.5 flex items-center justify-between text-xs bg-white dark:bg-neutral-900">
                                <div>
                                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{st.name}</span>
                                  <span className="text-neutral-400 font-mono ml-2">({st.admissionNumber})</span>
                                </div>
                                <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                  {st.class}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Gate Scans Feed */}
              {recentScans.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    Recent Gate Scanner Logs ({recentScans.length})
                  </h3>
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                    {recentScans.slice(0, 10).map((scan: any, idx: number) => (
                      <div key={scan.id || idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              scan.direction === 'ENTRY' ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                              {scan.student?.firstName} {scan.student?.lastName}
                            </span>
                            <span className="text-neutral-400 font-mono ml-2">
                              {scan.student?.admissionNumber}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-neutral-500">
                          <span className="font-mono">{scan.direction || 'ENTRY'}</span>
                          <span className="font-mono text-[11px]">
                            {new Date(scan.scannedAt || scan.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
