'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Database,
  Calendar,
  HelpCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Check,
  RotateCcw,
  Clock,
} from 'lucide-react';

export interface PulseItem {
  id: string;
  category: 'ATTENDANCE' | 'FINANCE' | 'ADMISSIONS' | 'ACADEMIC' | 'SAFEGUARDING' | 'INTERVENTIONS' | 'OPERATIONS';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  detail: string;
  reason: string;
  source: string;
  dateRange: string;
  action: {
    label: string;
    href: string;
  };
  count: number;
  responsibleRole?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}

export interface SchoolPulseData {
  tenantId: string;
  evaluatedAt: string;
  summary: {
    totalItems: number;
    urgentCount: number;
    warningCount: number;
    infoCount: number;
  };
  items: PulseItem[];
}

interface SchoolPulseCardProps {
  pulse: SchoolPulseData | null;
  loading: boolean;
  onRefresh: () => Promise<void> | void;
}

export function SchoolPulseCard({ pulse, loading, onRefresh }: SchoolPulseCardProps) {
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'URGENT' | 'WARNING'>('ALL');
  const [itemStatuses, setItemStatuses] = useState<Record<string, 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>>({});
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const toggleReason = (id: string) => {
    setExpandedReasons((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = async (itemId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (updatingIds.has(itemId)) return;

    setUpdatingIds((prev) => new Set(prev).add(itemId));
    setItemStatuses((prev) => ({ ...prev, [itemId]: newStatus }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (loading && !pulse) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-5 shadow-sm animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-48 bg-slate-200 dark:bg-neutral-800 rounded-md" />
          <div className="h-5 w-24 bg-slate-200 dark:bg-neutral-800 rounded-md" />
        </div>
        <div className="h-20 bg-slate-100 dark:bg-neutral-800/40 rounded-xl" />
      </div>
    );
  }

  if (!pulse) return null;

  const urgentCount = pulse.summary?.urgentCount ?? 0;
  const warningCount = pulse.summary?.warningCount ?? 0;
  const actionItemsCount = urgentCount + warningCount;

  const displayedItems = (pulse.items || []).filter((item) => {
    if (filterSeverity === 'URGENT') return item.severity === 'urgent';
    if (filterSeverity === 'WARNING') return item.severity === 'warning';
    return true;
  });

  return (
    <section
      aria-label="Daily School Operations Pulse"
      className="rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm overflow-hidden transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-neutral-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
              urgentCount > 0
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                : warningCount > 0
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {urgentCount > 0 ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                School Operations Pulse
              </h2>
              {actionItemsCount > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                  {actionItemsCount} action{actionItemsCount > 1 ? 's' : ''} needed
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
                  All nominal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified daily briefing derived from institutional records • No predictive assumptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {actionItemsCount > 0 && (
            <div className="flex rounded-lg border border-slate-200 dark:border-neutral-700 text-xs overflow-hidden p-0.5 bg-slate-50 dark:bg-neutral-800">
              <button
                type="button"
                onClick={() => setFilterSeverity('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  filterSeverity === 'ALL'
                    ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({pulse.items.length})
              </button>
              {urgentCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterSeverity('URGENT')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    filterSeverity === 'URGENT'
                      ? 'bg-rose-500/20 text-rose-800 dark:text-rose-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Urgent ({urgentCount})
                </button>
              )}
              {warningCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterSeverity('WARNING')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    filterSeverity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Attention ({warningCount})
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onRefresh()}
            disabled={loading}
            aria-label="Refresh operational pulse"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1B4F8C]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Pulse Items List */}
      <div className="divide-y divide-slate-100 dark:divide-neutral-800">
        {displayedItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No items matching active filter.
          </div>
        ) : (
          displayedItems.map((item) => {
            const effectiveStatus = itemStatuses[item.id] || item.status || 'OPEN';
            const isUpdating = updatingIds.has(item.id);
            const isExpanded = !!expandedReasons[item.id];
            const isUrgent = item.severity === 'urgent';
            const isWarning = item.severity === 'warning';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors ${
                  isUrgent
                    ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05]'
                    : isWarning
                    ? 'bg-amber-500/[0.02] dark:bg-amber-500/[0.04]'
                    : 'hover:bg-slate-50/50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${
                          isUrgent
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
                        }`}
                      >
                        {item.category}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      {/* Operational Status Pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          effectiveStatus === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                            : effectiveStatus === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            effectiveStatus === 'RESOLVED'
                              ? 'bg-emerald-500'
                              : effectiveStatus === 'IN_PROGRESS'
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-amber-500'
                          }`}
                        />
                        {effectiveStatus === 'RESOLVED'
                          ? 'Resolved'
                          : effectiveStatus === 'IN_PROGRESS'
                          ? 'In Progress'
                          : 'Open'}
                      </span>
                      {/* Responsible Role Badge */}
                      {item.responsibleRole && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-400">
                          <UserCheck className="w-3 h-3 text-[#1B4F8C]" />
                          <span>{item.responsibleRole}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {item.detail}
                    </p>

                    {/* Explainability Accordion Trigger */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleReason(item.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Why am I seeing this?</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-neutral-800/80 border border-slate-200/80 dark:border-neutral-700/80 text-xs space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                              Trigger logic:
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {item.reason}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-neutral-700/50">
                            <Database className="w-3 h-3 text-[#1B4F8C]" />
                            <span className="text-[11px] font-mono">{item.source}</span>
                            <span className="text-slate-300 dark:text-neutral-600">•</span>
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px]">{item.dateRange}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive Workbench Controls & Action Link */}
                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                    {effectiveStatus === 'OPEN' && item.severity !== 'info' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                        title="Acknowledge and mark in-progress"
                      >
                        <Clock className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : 'text-blue-500'}`} />
                        <span>In Progress</span>
                      </button>
                    )}
                    {effectiveStatus === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(item.id, 'RESOLVED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 transition-colors disabled:opacity-50"
                        title="Mark resolved"
                      >
                        <Check className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <span>Resolve</span>
                      </button>
                    )}
                    {effectiveStatus === 'RESOLVED' && item.severity !== 'info' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(item.id, 'OPEN')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
                        title="Reopen operational item"
                      >
                        <RotateCcw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                        <span>Reopen</span>
                      </button>
                    )}
                    {item.action && (
                      <Link
                        href={item.action.href}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                          isUrgent
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : isWarning
                            ? 'bg-[#1B4F8C] hover:bg-[#143E6E] text-white'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-900 dark:text-white'
                        }`}
                      >
                        <span>{item.action.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Timestamp */}
      <div className="px-5 py-2.5 bg-slate-50/60 dark:bg-neutral-900/60 border-t border-slate-100 dark:border-neutral-800/70 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Grounded strictly in tenant database records</span>
        <span>
          Evaluated {new Date(pulse.evaluatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </section>
  );
}
