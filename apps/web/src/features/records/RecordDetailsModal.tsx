import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import {
  Clock,
  User,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  GitFork,
  MessageSquare,
  History,
  Trash2,
  Send,
  Plus,
  Link as LinkIcon,
  CheckCircle,
} from 'lucide-react';

interface RecordDetailsModalProps {
  recordId: string | null;
  onClose: () => void;
  onRecordDeleted?: () => void;
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  recordId,
  onClose,
  onRecordDeleted,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'history' | 'dependencies'>('overview');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDepOpen, setIsAddDepOpen] = useState(false);

  const [selectedStatusId, setSelectedStatusId] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [targetDepId, setTargetDepId] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canEdit = usePermission('records:edit');
  const canDelete = usePermission('records:delete');
  const canChangeStatus = usePermission('records:change_status');
  const canAddNote = usePermission('records:add_note');
  const canViewHistory = usePermission('records:view_history');
  const canManageDependencies = usePermission('records:manage_dependencies');

  // Record overview query
  const { data: record, isLoading } = useQuery({
    queryKey: ['record', recordId],
    queryFn: () => api.get(`/records/${recordId}`),
    enabled: !!recordId,
  });

  // Lazy-loaded notes query
  const { data: notesData, refetch: refetchNotes } = useQuery({
    queryKey: ['record-notes', recordId],
    queryFn: () => api.get(`/records/${recordId}/notes`),
    enabled: !!recordId && activeTab === 'notes',
  });

  // Lazy-loaded history query
  const { data: historyData } = useQuery({
    queryKey: ['record-history', recordId],
    queryFn: () => api.get(`/records/${recordId}/history`),
    enabled: !!recordId && activeTab === 'history' && canViewHistory,
  });

  // Query statuses for status change dialog
  const { data: statusesData } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => api.get('/statuses'),
  });

  // Query all active records for dependency selection
  const { data: allRecordsData } = useQuery({
    queryKey: ['records-simple-list'],
    queryFn: () => api.get('/records', { limit: 100 }),
    enabled: isAddDepOpen,
  });

  // Mutations
  const changeStatusMutation = useMutation({
    mutationFn: (body: { statusId: string; note: string }) =>
      api.patch(`/records/${recordId}/status`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record', recordId] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsStatusModalOpen(false);
      setStatusNote('');
      setActionError(null);
    },
    onError: (err: any) => setActionError(err.message),
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => api.post(`/records/${recordId}/notes`, { content }),
    onSuccess: () => {
      refetchNotes();
      setNewNoteContent('');
      setActionError(null);
    },
    onError: (err: any) => setActionError(err.message),
  });

  const addDepMutation = useMutation({
    mutationFn: (dependsOnId: string) =>
      api.post(`/records/${recordId}/dependencies`, { dependsOnId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record', recordId] });
      setIsAddDepOpen(false);
      setTargetDepId('');
      setActionError(null);
    },
    onError: (err: any) => setActionError(err.message),
  });

  const removeDepMutation = useMutation({
    mutationFn: (depId: string) =>
      api.delete(`/records/${recordId}/dependencies/${depId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['record', recordId] });
    },
    onError: (err: any) => setActionError(err.message),
  });

  const deleteRecordMutation = useMutation({
    mutationFn: () => api.delete(`/records/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsDeleteDialogOpen(false);
      onClose();
      if (onRecordDeleted) onRecordDeleted();
    },
    onError: (err: any) => setActionError(err.message),
  });

  if (!recordId) return null;

  return (
    <>
      <Modal
        isOpen={!!recordId}
        onClose={onClose}
        title={record ? record.uniqueId : 'Record Details'}
        subtitle={record?.client?.name ? `Client: ${record.client.name}` : undefined}
        maxWidth="3xl"
      >
        {isLoading || !record ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading record details...</div>
        ) : (
          <div className="space-y-5">
            {/* Header bar with Status, Expiry, and Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Badge
                  color={record.status?.color || '#3B82F6'}
                  isExpired={record.isExpired}
                >
                  {record.status?.name || 'Status'}
                </Badge>
                {record.isExpired ? (
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                    EXPIRED
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">
                    Expires: {new Date(record.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canChangeStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStatusId(record.status?._id || '');
                      setIsStatusModalOpen(true);
                    }}
                  >
                    Change Status
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'notes', label: 'Notes Timeline', icon: MessageSquare },
                { id: 'history', label: 'Audit History', icon: History },
                { id: 'dependencies', label: 'Dependencies', icon: GitFork },
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
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{record.shortText}</h4>
                  {record.longText && (
                    <p className="text-slate-600 mt-1.5 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {record.longText}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block">Department</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{record.department?.name || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block">Job Workflow</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{record.job?.name || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block">Area Zone</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{record.area?.name || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block">Document Type</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{record.type?.name || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block">Submission Date</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {new Date(record.submissionDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-400 font-medium block">End Date (Deadline)</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {new Date(record.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Custom Fields */}
                {record.customFieldValues && record.customFieldValues.length > 0 && (
                  <div className="pt-2">
                    <h5 className="font-semibold text-slate-800 mb-2">Custom Field Values</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {record.customFieldValues.map((cf: any, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[11px]">Field #{cf.fieldId}</span>
                          <span className="font-medium text-slate-800">{String(cf.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Notes Timeline (Append-Only) */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {canAddNote && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newNoteContent.trim()) {
                        addNoteMutation.mutate(newNoteContent);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Add an immutable note to this record..."
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-yellow-400"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      isLoading={addNoteMutation.isPending}
                      disabled={!newNoteContent.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Post Note</span>
                    </Button>
                  </form>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notesData?.data && notesData.data.length > 0 ? (
                    notesData.data.map((note: any) => (
                      <div
                        key={note._id}
                        className="p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                          <span className="font-semibold text-slate-700">{note.user?.name || 'User'}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">No notes recorded yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Action History / Audit Log (Immutable) */}
            {activeTab === 'history' && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {historyData?.data && historyData.data.length > 0 ? (
                  historyData.data.map((h: any) => (
                    <div
                      key={h._id}
                      className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 capitalize">
                          {h.action.replace('_', ' ')}
                        </span>{' '}
                        <span className="text-slate-500">
                          by {h.user?.name || 'System Automated Job'}
                        </span>
                        {h.meta && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {h.meta.from && h.meta.to
                              ? `Changed from "${h.meta.from}" to "${h.meta.to}"`
                              : JSON.stringify(h.meta)}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">No history events found.</p>
                )}
              </div>
            )}

            {/* Tab 4: Dependencies */}
            {activeTab === 'dependencies' && (
              <div className="space-y-4">
                {actionError && (
                  <div className="p-2.5 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {actionError}
                  </div>
                )}

                {canManageDependencies && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddDepOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Dependency</span>
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {record.dependencies && record.dependencies.length > 0 ? (
                    record.dependencies.map((dep: any) => (
                      <div
                        key={dep._id}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <LinkIcon className="h-4 w-4 text-slate-400" />
                          <div>
                            <span className="font-mono font-bold text-slate-900">{dep.uniqueId}</span>
                            <span className="text-slate-500 ml-2">{dep.shortText}</span>
                            <div className="mt-0.5">
                              <Badge color={dep.status?.color}>{dep.status?.name || 'Status'}</Badge>
                            </div>
                          </div>
                        </div>

                        {canManageDependencies && (
                          <button
                            onClick={() => removeDepMutation.mutate(dep._id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Remove dependency"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No dependencies attached to this record.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Change Status Modal */}
      {isStatusModalOpen && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title="Update Status"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Status</label>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {statusesData?.data?.map((st: any) => (
                  <option key={st._id} value={st._id}>
                    {st.name} {st.isTerminal ? '(Terminal)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason / Note (Optional)</label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Operational reason for status transition..."
                rows={2}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={changeStatusMutation.isPending}
                onClick={() =>
                  changeStatusMutation.mutate({
                    statusId: selectedStatusId,
                    note: statusNote,
                  })
                }
              >
                Confirm Status Change
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Dependency Modal with Cycle Detection */}
      {isAddDepOpen && (
        <Modal
          isOpen={isAddDepOpen}
          onClose={() => setIsAddDepOpen(false)}
          title="Add Dependency"
          subtitle="Server-side cycle detection prevents circular dependencies"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {actionError}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Select Record to Depend On
              </label>
              <select
                value={targetDepId}
                onChange={(e) => setTargetDepId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">-- Choose Record --</option>
                {allRecordsData?.data
                  ?.filter((r: any) => r._id !== recordId)
                  .map((r: any) => (
                    <option key={r._id} value={r._id}>
                      {r.uniqueId} — {r.shortText.slice(0, 40)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsAddDepOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!targetDepId}
                isLoading={addDepMutation.isPending}
                onClick={() => addDepMutation.mutate(targetDepId)}
              >
                Attach Dependency
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteRecordMutation.mutate()}
        title="Delete Record"
        itemName={record?.uniqueId || 'Record'}
        isLoading={deleteRecordMutation.isPending}
      />
    </>
  );
};
