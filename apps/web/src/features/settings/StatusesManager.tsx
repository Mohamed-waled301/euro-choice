import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';

export const StatusesManager: React.FC = () => {
  const queryClient = useQueryClient();
  const canManage = usePermission('settings:manage');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [order, setOrder] = useState(0);
  const [isTerminal, setIsTerminal] = useState(false);
  const [deletingStatus, setDeletingStatus] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => api.get('/statuses'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingStatus) {
        return api.patch(`/statuses/${editingStatus._id}`, body);
      }
      return api.post('/statuses', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      closeModal();
    },
    onError: (err: any) => setError(err.message || 'Failed to save status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statuses'] });
      setDeletingStatus(null);
    },
    onError: (err: any) => setError(err.message || 'Failed to delete status'),
  });

  const openCreate = () => {
    setEditingStatus(null);
    setName('');
    setColor('#3B82F6');
    setOrder((data?.data?.length || 0) + 1);
    setIsTerminal(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (status: any) => {
    setEditingStatus(status);
    setName(status.name);
    setColor(status.color || '#3B82F6');
    setOrder(status.order || 0);
    setIsTerminal(status.isTerminal || false);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStatus(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Status System</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-configurable status stages with automated terminal rules and audit protection
          </p>
        </div>

        {canManage && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add Status</span>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading statuses...</div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Status Name</th>
                <th className="px-5 py-3">Pill Preview</th>
                <th className="px-5 py-3">Terminal Stage</th>
                <th className="px-5 py-3">System Protected</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {data?.data?.map((status: any) => (
                <tr key={status._id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-mono text-slate-500">{status.order}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{status.name}</td>
                  <td className="px-5 py-3">
                    <Badge color={status.color}>{status.name}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    {status.isTerminal ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                        Terminal (Stops Expiration)
                      </span>
                    ) : (
                      <span className="text-slate-400">In-flight</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {status.isSystemStatus ? (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-700 font-medium">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Protected
                      </span>
                    ) : (
                      <span className="text-slate-400">Custom</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEdit(status)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {!status.isSystemStatus && (
                          <button
                            onClick={() => setDeletingStatus(status)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`${editingStatus ? 'Edit' : 'Create'} Status`}
          maxWidth="sm"
        >
          {error && (
            <div className="mb-3 p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate({
                name,
                color,
                order: Number(order),
                isTerminal,
              });
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Color Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-8 w-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Display Order</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            {(!editingStatus || !editingStatus.isSystemStatus) && (
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTerminal}
                    onChange={(e) => setIsTerminal(e.target.checked)}
                    className="h-4 w-4 text-yellow-500 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-700">Mark as Terminal Stage</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5 ml-6">
                  Terminal records are protected from automatic background expiration
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
                Save Status
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deletingStatus && (
        <ConfirmDialog
          isOpen={!!deletingStatus}
          onClose={() => setDeletingStatus(null)}
          onConfirm={() => deleteMutation.mutate(deletingStatus._id)}
          title="Deactivate Status"
          itemName={deletingStatus.name}
          actionName="Deactivate"
        />
      )}
    </div>
  );
};
