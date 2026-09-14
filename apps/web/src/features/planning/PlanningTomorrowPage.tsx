import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { RecordDetailsModal } from '../records/RecordDetailsModal';
import {
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Check,
  Building2,
  Briefcase,
  MapPin,
  Clock,
} from 'lucide-react';

export const PlanningTomorrowPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Fetch planning queue
  const { data: planningData, isLoading, isError, refetch } = useQuery({
    queryKey: ['planning-tomorrow', selectedDeptId, selectedAreaId, selectedJobId],
    queryFn: () =>
      api.get('/records/planning-tomorrow', {
        department: selectedDeptId || undefined,
        area: selectedAreaId || undefined,
        job: selectedJobId || undefined,
      }),
  });

  // Reference options for quick filters
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/reference/departments'),
  });
  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/reference/areas'),
  });
  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/reference/jobs'),
  });
  const { data: statusesData } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => api.get('/statuses'),
  });

  // Fast one-click status transition
  const completeMutation = useMutation({
    mutationFn: ({ recordId, statusId }: { recordId: string; statusId: string }) =>
      api.patch(`/records/${recordId}/status`, {
        statusId,
        note: 'Completed directly from Planning Tomorrow dispatch board',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning-tomorrow'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const completedStatus = statusesData?.data?.find((s: any) => s.name === 'Completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Planning Tomorrow</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
              Urgent Work Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Non-terminal operational tasks sorted by urgency with real-time SLA overdue detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Quick Filters Header */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-xs">
        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filter Queue:
        </span>

        <select
          value={selectedDeptId}
          onChange={(e) => setSelectedDeptId(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
        >
          <option value="">All Departments</option>
          {deptsData?.data?.map((d: any) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={selectedAreaId}
          onChange={(e) => setSelectedAreaId(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
        >
          <option value="">All Areas</option>
          {areasData?.data?.map((a: any) => (
            <option key={a._id} value={a._id}>
              {a.name}
            </option>
          ))}
        </select>

        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
        >
          <option value="">All Jobs</option>
          {jobsData?.data?.map((j: any) => (
            <option key={j._id} value={j._id}>
              {j.name}
            </option>
          ))}
        </select>

        {(selectedDeptId || selectedAreaId || selectedJobId) && (
          <button
            onClick={() => {
              setSelectedDeptId('');
              setSelectedAreaId('');
              setSelectedJobId('');
            }}
            className="text-xs text-red-600 hover:text-red-700 underline font-medium ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Computing urgent operational queue...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-600">Failed to load planning list</div>
        ) : !planningData?.data || planningData.data.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-900">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">No urgent pending submissions in this queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Urgency / Record</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Job Workflow</th>
                  <th className="px-5 py-3.5">Area Zone</th>
                  <th className="px-5 py-3.5">End Date</th>
                  <th className="px-5 py-3.5 text-right">Fast Complete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {planningData.data.map((r: any) => {
                  const isOverdue = r.isOverdue;
                  return (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedRecordId(r._id)}
                      className={`cursor-pointer transition-colors ${
                        isOverdue
                          ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-l-red-500'
                          : 'hover:bg-yellow-50/40'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isOverdue && (
                            <span className="p-1 rounded bg-red-100 text-red-700" title="Overdue!">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            </span>
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-950 block">
                              {r.uniqueId}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                              {r.shortText}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {r.client?.name || r.clientNameCache || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge color={r.status?.color}>{r.status?.name || 'Status'}</Badge>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {r.department?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{r.job?.name || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{r.area?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isOverdue ? 'text-red-700' : 'text-slate-800'
                          }`}
                        >
                          {new Date(r.endDate).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-red-600 font-bold uppercase tracking-wider">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {completedStatus && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={completeMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              completeMutation.mutate({
                                recordId: r._id,
                                statusId: completedStatus._id,
                              });
                            }}
                            className="h-7 px-2 text-[11px] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            <span>Mark Done</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecordId && (
        <RecordDetailsModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
    </div>
  );
};
