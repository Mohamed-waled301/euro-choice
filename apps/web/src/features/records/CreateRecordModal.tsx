import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Search, AlertCircle } from 'lucide-react';

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRecordModal: React.FC<CreateRecordModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [shortText, setShortText] = useState('');
  const [longText, setLongText] = useState('');
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Search clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-search', clientSearch],
    queryFn: () => api.get('/clients', { search: clientSearch, limit: 10 }),
    enabled: isOpen,
  });

  // Fetch reference entities
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/reference/departments'),
    enabled: isOpen,
  });
  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/reference/jobs'),
    enabled: isOpen,
  });
  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/reference/areas'),
    enabled: isOpen,
  });
  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: () => api.get('/reference/types'),
    enabled: isOpen,
  });

  // Fetch dynamic custom fields for records
  const { data: customFieldsData } = useQuery({
    queryKey: ['custom-fields', 'record'],
    queryFn: () => api.get('/custom-fields', { appliesTo: 'record' }),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/records', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
      resetForm();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create record');
    },
  });

  const resetForm = () => {
    setSelectedClientId('');
    setClientSearch('');
    setSelectedDeptId('');
    setSelectedJobId('');
    setSelectedAreaId('');
    setSelectedTypeId('');
    setShortText('');
    setLongText('');
    setCustomFieldValues({});
    setError(null);
  };

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }
    if (!selectedDeptId || !selectedJobId || !selectedAreaId || !selectedTypeId) {
      setError('Please fill in all required operational classifications (Department, Job, Area, Type)');
      return;
    }

    const formattedCustomFields = Object.entries(customFieldValues).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));

    createMutation.mutate({
      client: selectedClientId,
      department: selectedDeptId,
      job: selectedJobId,
      area: selectedAreaId,
      type: selectedTypeId,
      shortText,
      longText,
      endDate: new Date(endDate).toISOString(),
      customFieldValues: formattedCustomFields,
    });
  };

  const selectedClient = clientsData?.data?.find((c: any) => c._id === selectedClientId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Record"
      subtitle="Unique ID and Expiration are computed server-side automatically"
      maxWidth="2xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Client Searchable Select */}
        <div>
          <label className="font-semibold text-slate-800 block mb-1">
            Client Account <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                if (selectedClientId) setSelectedClientId('');
              }}
              placeholder="Type client or company name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
            />
          </div>

          {/* Search results dropdown */}
          {!selectedClientId && clientSearch && (
            <div className="mt-1 max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-lg divide-y divide-slate-100">
              {clientsData?.data?.length > 0 ? (
                clientsData.data.map((c: any) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      setSelectedClientId(c._id);
                      setClientSearch(c.name);
                    }}
                    className="w-full text-left p-2.5 hover:bg-yellow-50 text-xs transition-colors flex justify-between"
                  >
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-400">{c.company || c.email}</span>
                  </button>
                ))
              ) : (
                <div className="p-2.5 text-center text-slate-400">No matching clients found</div>
              )}
            </div>
          )}

          {selectedClientId && (
            <div className="mt-1 text-[11px] text-emerald-600 font-medium">
              ✓ Client Selected: {clientSearch}
            </div>
          )}
        </div>

        {/* Short Summary Text */}
        <div>
          <label className="font-semibold text-slate-800 block mb-1">
            Short Summary / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={shortText}
            onChange={(e) => setShortText(e.target.value)}
            placeholder="e.g. Express customs clearance for container #4021"
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Reference Data 4-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Select...</option>
              {deptsData?.data?.map((d: any) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Job <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Select...</option>
              {jobsData?.data?.map((j: any) => (
                <option key={j._id} value={j._id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Area <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Select...</option>
              {areasData?.data?.map((a: any) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Select...</option>
              {typesData?.data?.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* End Date (Deadline) */}
        <div>
          <label className="font-semibold text-slate-800 block mb-1">
            End Date (Target Deadline) <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        {/* Dynamic Custom Fields Section */}
        {customFieldsData?.data && customFieldsData.data.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-2">Custom Fields</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customFieldsData.data.map((cf: any) => {
                const val = customFieldValues[cf._id] ?? '';
                return (
                  <div key={cf._id}>
                    <label className="font-semibold text-slate-700 block mb-1">
                      {cf.label} {cf.required && <span className="text-red-500">*</span>}
                    </label>

                    {cf.type === 'dropdown' ? (
                      <select
                        value={val}
                        required={cf.required}
                        onChange={(e) => handleCustomFieldChange(cf._id, e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">Select option...</option>
                        {cf.options?.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : cf.type === 'number' ? (
                      <input
                        type="number"
                        value={val}
                        required={cf.required}
                        onChange={(e) =>
                          handleCustomFieldChange(cf._id, e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    ) : cf.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={!!val}
                        onChange={(e) => handleCustomFieldChange(cf._id, e.target.checked)}
                        className="h-4 w-4 text-yellow-500 rounded border-slate-300"
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        required={cf.required}
                        onChange={(e) => handleCustomFieldChange(cf._id, e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Long Notes */}
        <div>
          <label className="font-semibold text-slate-800 block mb-1">Detailed Description / Instructions</label>
          <textarea
            rows={3}
            value={longText}
            onChange={(e) => setLongText(e.target.value)}
            placeholder="Additional customs documents, container inspection notes, or handover specs..."
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
            Create Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
