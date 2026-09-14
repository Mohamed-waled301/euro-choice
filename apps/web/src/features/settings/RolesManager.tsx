import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Shield, Lock } from 'lucide-react';

export const RolesManager: React.FC = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [deletingRole, setDeletingRole] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles'),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['roles-permissions'],
    queryFn: () => api.get('/roles/permissions'),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingRole) {
        return api.patch(`/roles/${editingRole._id}`, body);
      }
      return api.post('/roles', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
    onError: (err: any) => setError(err.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeletingRole(null);
    },
  });

  const openCreate = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelectedPermissions([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setError(null);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Roles &amp; Granular Permissions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Role definitions stored in database allowing runtime custom role creation
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          <span>New Custom Role</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading roles...</div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Role Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Permissions Scope</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {rolesData?.data?.map((role: any) => (
                <tr key={role._id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                    {role.isSystemRole && <Lock className="h-3 w-3 text-yellow-600" />}
                    <span>{role.name}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{role.description || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {role.name === 'Admin' ? 'All Permissions (*)' : `${role.permissions?.length || 0} permissions`}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        role.isSystemRole
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {role.isSystemRole ? 'System' : 'Custom'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {!role.isSystemRole && (
                      <button
                        onClick={() => setDeletingRole(role)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Create/Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`${editingRole ? 'Edit' : 'Create'} Role`}
          maxWidth="md"
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
                description,
                permissions: selectedPermissions,
              });
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Role Name *</label>
              <input
                type="text"
                required
                disabled={editingRole?.isSystemRole}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Permission Checkboxes */}
            <div>
              <label className="font-semibold text-slate-700 block mb-2">Granted Permissions</label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                {permissionsData?.permissions?.map((perm: string) => {
                  const isChecked = selectedPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(perm)}
                        className="h-3.5 w-3.5 text-yellow-500 rounded border-slate-300"
                      />
                      <span className="font-mono text-[11px] text-slate-700">{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
                Save Role
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingRole && (
        <ConfirmDialog
          isOpen={!!deletingRole}
          onClose={() => setDeletingRole(null)}
          onConfirm={() => deleteMutation.mutate(deletingRole._id)}
          title="Delete Role"
          itemName={deletingRole.name}
        />
      )}
    </div>
  );
};
