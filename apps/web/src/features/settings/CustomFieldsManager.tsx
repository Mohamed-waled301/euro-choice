import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import { Plus, Edit2, Trash2, Eye, Sliders, ArrowDown, ArrowUp } from 'lucide-react';

export const CustomFieldsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const canManage = usePermission('custom_fields:manage');

  const [activeTab, setActiveTab] = useState<'record' | 'client'>('record');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<string>('short_text');
  const [optionsStr, setOptionsStr] = useState('');
  const [required, setRequired] = useState(false);
  const [deletingField, setDeletingField] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['custom-fields', activeTab],
    queryFn: () => api.get('/custom-fields', { appliesTo: activeTab }),
  });

  const saveMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingField) {
        return api.patch(`/custom-fields/${editingField._id}`, body);
      }
      return api.post('/custom-fields', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      closeModal();
    },
    onError: (err: any) => setError(err.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/custom-fields/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setDeletingField(null);
    },
  });

  const openCreate = () => {
    setEditingField(null);
    setKey('');
    setLabel('');
    setType('short_text');
    setOptionsStr('');
    setRequired(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (field: any) => {
    setEditingField(field);
    setKey(field.key);
    setLabel(field.label);
    setType(field.type);
    setOptionsStr(field.options ? field.options.join(', ') : '');
    setRequired(field.required || false);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingField(null);
    setError(null);
  };

  const optionsList = optionsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Custom Fields Architecture</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Schema-defined field registry applied directly without MongoDB collections alter
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Target Entity Switcher */}
          <div className="p-1 bg-slate-100 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'record'
                  ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Record Fields
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'client'
                  ? 'bg-yellow-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Client Fields
            </button>
          </div>

          {canManage && (
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" />
              <span>Add Field</span>
            </Button>
          )}
        </div>
      </div>

      {/* Fields List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading custom fields...</div>
        ) : (
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Field Label</th>
                <th className="px-5 py-3">Key (Slug)</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Options</th>
                <th className="px-5 py-3">Required</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {data?.data?.map((field: any) => (
                <tr key={field._id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-mono text-slate-500">{field.order}</td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{field.label}</td>
                  <td className="px-5 py-3 font-mono text-yellow-700">{field.key}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {field.options && field.options.length > 0 ? field.options.join(', ') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {field.required ? (
                      <span className="text-red-600 font-bold">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEdit(field)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingField(field)}
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

      {/* Field Create/Edit Modal with Live Preview */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={`${editingField ? 'Edit' : 'Create'} Custom Field`}
          subtitle={`Applies to: ${activeTab === 'record' ? 'Record creation & details' : 'Client registration & details'}`}
          maxWidth="lg"
        >
          {error && (
            <div className="mb-3 p-2.5 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Form inputs */}
            <form
              id="cf-form"
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate({
                  key,
                  label,
                  type,
                  options: optionsList,
                  appliesTo: activeTab,
                  required,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Field Label *</label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => {
                    setLabel(e.target.value);
                    if (!editingField) {
                      setKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_')
                          .replace(/_+/g, '_')
                      );
                    }
                  }}
                  placeholder="e.g. Priority Level"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Field Key (Slug) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingField}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. priority_level"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono disabled:opacity-60"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Data Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="short_text">Short Text</option>
                  <option value="long_text">Long Text</option>
                  <option value="dropdown">Dropdown (Single Select)</option>
                  <option value="selector">Selector (Multi Select)</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean (Checkbox)</option>
                  <option value="date">Date</option>
                  <option value="area">Area</option>
                </select>
              </div>

              {(type === 'dropdown' || type === 'selector') && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                    className="h-4 w-4 text-yellow-500 rounded border-slate-300"
                  />
                  <span className="font-semibold text-slate-700">Required field</span>
                </label>
              </div>
            </form>

            {/* Live Field Preview Container */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-3">
                  <Eye className="h-3.5 w-3.5" />
                  Live Form Preview
                </span>

                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-2">
                  <label className="font-semibold text-slate-900 block text-xs">
                    {label || 'Field Label'}{' '}
                    {required && <span className="text-red-500">*</span>}
                  </label>

                  {type === 'dropdown' ? (
                    <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" disabled>
                      <option>Select...</option>
                      {optionsList.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : type === 'boolean' ? (
                    <input type="checkbox" disabled className="h-4 w-4 rounded" />
                  ) : type === 'number' ? (
                    <input
                      type="number"
                      disabled
                      placeholder="0.00"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder="Input value..."
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  )}

                  <span className="text-[10px] text-slate-400 block font-mono">
                    Schema key: {key || 'none'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" size="sm" type="button" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  form="cf-form"
                  type="submit"
                  isLoading={saveMutation.isPending}
                >
                  Save Field
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate dialog */}
      {deletingField && (
        <ConfirmDialog
          isOpen={!!deletingField}
          onClose={() => setDeletingField(null)}
          onConfirm={() => deleteMutation.mutate(deletingField._id)}
          title="Deactivate Custom Field"
          itemName={deletingField.label}
          message={`Deactivating "${deletingField.label}" will hide it from future forms while preserving historical values on existing records.`}
          actionName="Deactivate"
        />
      )}
    </div>
  );
};
