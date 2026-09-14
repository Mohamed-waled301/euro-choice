import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { History, ShieldCheck, User, Calendar } from 'lucide-react';

export const GlobalHistoryPage: React.FC = () => {
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Trail &amp; History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable server-side mutation audit log across all records, status changes, and client events
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        >
          Refresh Feed
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Live Immutable Activity Log</h2>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            Write-Only (Append-Only)
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : !dashboardData?.recentActivity || dashboardData.recentActivity.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activity recorded yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dashboardData.recentActivity.map((activity: any) => (
              <div
                key={activity._id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors text-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${
                      activity.action === 'expired'
                        ? 'bg-red-500 ring-4 ring-red-100'
                        : activity.action === 'deleted'
                        ? 'bg-red-600 ring-4 ring-red-100'
                        : 'bg-yellow-400 ring-4 ring-yellow-100'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {activity.user?.name || 'System Automated Job'}{' '}
                      <span className="font-normal text-slate-500">
                        executed <span className="font-semibold text-slate-800">{activity.action}</span>
                      </span>
                    </p>

                    {activity.record && (
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                          {activity.record.uniqueId}
                        </span>
                        <span className="text-slate-500 truncate max-w-sm">
                          {activity.record.shortText}
                        </span>
                      </div>
                    )}

                    {activity.meta && (
                      <p className="text-slate-500 mt-1 text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-100 max-w-xl">
                        {activity.meta.from && activity.meta.to
                          ? `Transition: "${activity.meta.from}" → "${activity.meta.to}"`
                          : JSON.stringify(activity.meta)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono self-end sm:self-center shrink-0">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
