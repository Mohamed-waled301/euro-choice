import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Mail, Phone, Building, Calendar, FileText, Activity, FolderArchive } from 'lucide-react';

interface ClientDetailsModalProps {
  clientId: string | null;
  onClose: () => void;
  onRecordClick?: (recordId: string) => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  clientId,
  onClose,
  onRecordClick,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'activity'>('overview');
  const [recordFilter, setRecordFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => api.get(`/clients/${clientId}`),
    enabled: !!clientId,
  });

  const { data: recordsData } = useQuery({
    queryKey: ['client-records', clientId, recordFilter],
    queryFn: () =>
      api.get(`/clients/${clientId}/records`, {
        status: recordFilter === 'all' ? undefined : recordFilter,
      }),
    enabled: !!clientId && activeTab === 'records',
  });

  const { data: activityData } = useQuery({
    queryKey: ['client-activity', clientId],
    queryFn: () => api.get(`/clients/${clientId}/activity`),
    enabled: !!clientId && activeTab === 'activity',
  });

  if (!clientId) return null;

  return (
    <Modal
      isOpen={!!clientId}
      onClose={onClose}
      title={client?.name || 'Client Details'}
      subtitle={client?.company || undefined}
      maxWidth="3xl"
    >
      {isLoading || !client ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading client account...</div>
      ) : (
        <div className="space-y-5">
          {/* Quick info row */}
          <div className="flex flex-wrap items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {client.email && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${client.email}`} className="text-yellow-700 hover:underline font-medium">
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Building className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800">{client.company}</span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200">
            {[
              { id: 'overview', label: 'Overview & Specs', icon: FileText },
              { id: 'records', label: 'Associated Records', icon: FolderArchive },
              { id: 'activity', label: 'Cross-Record Activity', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'border-yellow-400 text-slate-950 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              {client.notes && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Account Notes & Profile</h4>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {client.notes}
                  </p>
                </div>
              )}

              {/* Custom fields */}
              {client.customFieldValues && client.customFieldValues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Custom Field Attributes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {client.customFieldValues.map((cf: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">Attribute #{cf.fieldId}</span>
                        <span className="font-semibold text-slate-800">{String(cf.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Associated Records */}
          {activeTab === 'records' && (
            <div className="space-y-4 text-xs">
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Filter:</span>
                {(['all', 'active', 'completed', 'expired'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRecordFilter(mode)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                      recordFilter === mode
                        ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Records List */}
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                {recordsData?.data?.length > 0 ? (
                  recordsData.data.map((r: any) => (
                    <div
                      key={r._id}
                      onClick={() => onRecordClick && onRecordClick(r._id)}
                      className="p-3 hover:bg-yellow-50/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900">{r.uniqueId}</span>
                        <span className="text-slate-600 ml-2">{r.shortText}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span>{r.department?.name}</span>
                          <span>·</span>
                          <span>Deadline: {new Date(r.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge color={r.status?.color} isExpired={r.isExpired}>
                        {r.status?.name || 'Status'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="p-8 text-center text-slate-400">No records found for this filter.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Activity Timeline */}
          {activeTab === 'activity' && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activityData?.data?.length > 0 ? (
                activityData.data.map((h: any) => (
                  <div
                    key={h._id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 capitalize">
                        {h.action.replace('_', ' ')}
                      </span>{' '}
                      {h.record?.uniqueId && (
                        <span className="font-mono font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">
                          {h.record.uniqueId}
                        </span>
                      )}
                      <span className="text-slate-500 ml-1">by {h.user?.name || 'System Automated Job'}</span>
                      {h.meta && (
                        <p className="text-slate-500 mt-0.5 text-[11px]">
                          {h.meta.from && h.meta.to
                            ? `Status changed from "${h.meta.from}" to "${h.meta.to}"`
                            : JSON.stringify(h.meta)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-8 text-center text-slate-400 text-xs">No cross-record activity found.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
