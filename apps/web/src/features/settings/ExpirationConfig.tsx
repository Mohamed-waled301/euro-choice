import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Clock, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ExpirationConfig: React.FC = () => {
  const queryClient = useQueryClient();

  const [periodDays, setPeriodDays] = useState(7);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sweepResult, setSweepResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
  });

  useEffect(() => {
    if (data?.expirationPeriodDays) {
      setPeriodDays(data.expirationPeriodDays);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (days: number) =>
      api.patch('/settings', { expirationPeriodDays: days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSuccessMsg('Expiration period updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const sweepMutation = useMutation({
    mutationFn: () => api.post('/settings/expiration-sweep'),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSweepResult(
        `Sweep completed: ${res.result?.expiredCount ?? 0} overdue record(s) marked expired.`
      );
      setTimeout(() => setSweepResult(null), 5000);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Automatic Expiration Policy</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Server-side automated sweep powered by background cron jobs and indexed queries
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {sweepResult && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-yellow-600" />
          <span>{sweepResult}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <label className="font-semibold text-slate-800 block text-xs mb-1">
            Global Expiration Period (in Days)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={365}
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
              className="w-32 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
            />
            <span className="text-xs text-slate-500">days from submission date</span>
          </div>

          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <p>
              <strong>Notice on Retroactivity:</strong> Updating the global expiration period applies
              only to newly created records. It does not retroactively alter deadlines on existing records.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => updateMutation.mutate(periodDays)}
            isLoading={updateMutation.isPending}
            className="mt-4"
          >
            Update Expiration Period
          </Button>
        </div>

        {/* Manual Cron Sweep Trigger */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="font-semibold text-slate-800 text-xs mb-1">Manual Sweep Execution</h4>
          <p className="text-[11px] text-slate-500 mb-3">
            The background cron runs automatically every 15 minutes. You can trigger an immediate
            sweep to transition all past-due non-terminal records to Expired and create ActionHistory entries.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => sweepMutation.mutate()}
            isLoading={sweepMutation.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Trigger Expiration Sweep Now</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
