import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DashboardSummary } from '@eurochoice/shared';
import {
  FolderArchive,
  Clock,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary'),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-200 text-red-600">
        Failed to load dashboard summary metrics.{' '}
        <button onClick={() => refetch()} className="underline font-semibold ml-2">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Active Records',
      value: data.total,
      subtitle: `${data.byStatus['Open'] || 0} Open · ${data.byStatus['In Progress'] || 0} In Progress`,
      icon: FolderArchive,
      color: 'bg-yellow-400 text-slate-950',
      border: 'border-yellow-200',
      link: '/records',
    },
    {
      title: 'Planning Tomorrow',
      value: data.planningTomorrowCount,
      subtitle: 'Urgent active records queue',
      icon: CalendarClock,
      color: 'bg-slate-900 text-white',
      border: 'border-slate-800',
      link: '/planning',
    },
    {
      title: 'Expiring Soon (≤2 Days)',
      value: data.expiringSoon,
      subtitle: 'Approaching SLA deadline',
      icon: Clock,
      color: 'bg-amber-500 text-white',
      border: 'border-amber-200',
      link: '/records?sort=endDateAsc',
    },
    {
      title: 'Completed Terminal',
      value: data.byStatus['Completed'] || 0,
      subtitle: `${data.byStatus['Expired'] || 0} Expired automatically`,
      icon: CheckCircle2,
      color: 'bg-emerald-600 text-white',
      border: 'border-emerald-200',
      link: '/records',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status breakdown, operational urgency, and cross-record audit activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/records"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-950 shadow-sm transition-all"
          >
            <span>View All Records</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight group-hover:text-yellow-600 transition-colors">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.color} shadow-sm shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-100 pt-2 font-medium">
                {card.subtitle}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Status Distribution Pills */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-yellow-600" />
          <span>Workflow Status Distribution</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(data.byStatus).map(([statusName, count]) => {
            const isTerminalExpired = statusName === 'Expired';
            return (
              <div
                key={statusName}
                className={`p-3 rounded-lg border ${
                  isTerminalExpired
                    ? 'bg-red-50 border-red-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-xs font-medium text-slate-600 block">{statusName}</span>
                <span
                  className={`text-xl font-bold mt-1 block ${
                    isTerminalExpired ? 'text-red-700' : 'text-slate-900'
                  }`}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Audit Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Recent Operational Activity</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable ActionHistory</span>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recentActivity && data.recentActivity.length > 0 ? (
            data.recentActivity.map((activity: any) => {
              const dateStr = activity.createdAt
                ? new Date(activity.createdAt).toLocaleString()
                : '';
              const userName = activity.user?.name || 'System Automated Job';
              const recordCode = activity.record?.uniqueId;

              return (
                <div
                  key={activity._id}
                  className="px-6 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                        activity.action === 'expired'
                          ? 'bg-red-500 ring-2 ring-red-100'
                          : 'bg-yellow-400 ring-2 ring-yellow-100'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {userName}{' '}
                        <span className="font-normal text-slate-500">
                          {activity.action.replace('_', ' ')}
                        </span>{' '}
                        {recordCode && (
                          <span className="font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {recordCode}
                          </span>
                        )}
                      </p>
                      {activity.meta && (
                        <p className="text-slate-500 mt-0.5 text-[11px] truncate">
                          {activity.meta.from && activity.meta.to
                            ? `Status: "${activity.meta.from}" → "${activity.meta.to}"`
                            : activity.meta.note || activity.meta.shortText || JSON.stringify(activity.meta)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{dateStr}</span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">No activity recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
