import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface ReferenceDataManagerProps {
  endpoint: 'departments' | 'jobs' | 'areas' | 'types';
  title: string;
  description: string;
}

export const ReferenceDataManager: React.FC<ReferenceDataManagerProps> = ({
  endpoint,
  title,
  description,
}) => {
  const queryClient = useQueryClient();
  const canManage = usePermission('settings:manage');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reference', endpoint],
    queryFn: () => api.get(`/reference/${endpoint}`),
  });

  const saveMutation = useMutation({
    mutationFn: (body: { name: string; description: string }) => {
      if (editingItem) {
        return api.patch(`/reference/${endpoint}/${editingItem._id}`, body);
      }
      return api.post(`/reference/${endpoint}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', endpoint] });
      closeModal();
    },
    onError: (err: any) => setError(err.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reference/${endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', endpoint] });
      setDeletingItem(null);
    },
  });

  const openCreate = () => {
    setEditingItem(null);
    setName('');
    setItemDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setItemDescription(item.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        {canManage && (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            <span>Add {title.replace(/s$/, '')}</span>
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading {title}...</div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {data?.data?.map((item: any) => (
                <tr key={item._id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="px-5 py-3 text-slate-500">{item.description || '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`${editingItem ? 'Edit' : 'Create'} ${title.replace(/s$/, '')}`}
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
              saveMutation.mutate({ name, description: itemDescription });
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Classification name"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Description</label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Operational purpose"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Deactivate Dialog */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={() => deleteMutation.mutate(deletingItem._id)}
          title="Deactivate Item"
          itemName={deletingItem.name}
          actionName="Deactivate"
        />
      )}
    </div>
  );
};
