import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { AlertCircle } from 'lucide-react';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateClientModal: React.FC<CreateClientModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch dynamic custom fields for clients
  const { data: customFieldsData } = useQuery({
    queryKey: ['custom-fields', 'client'],
    queryFn: () => api.get('/custom-fields', { appliesTo: 'client' }),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/clients', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
      resetForm();
    },
    onError: (err: any) => setError(err.message || 'Failed to create client'),
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setNotes('');
    setCustomFieldValues({});
    setError(null);
  };

  const handleCustomFieldChange = (fieldId: string, val: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedCustomFields = Object.entries(customFieldValues).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));

    createMutation.mutate({
      name,
      email: email || undefined,
      phone,
      company,
      notes,
      customFieldValues: formattedCustomFields,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Client Account" maxWidth="md">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-800 block mb-1">
            Client Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Apex Freight Logistics GmbH"
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-800 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-800 block mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 40 555 0192"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-800 block mb-1">Company / Organization</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Parent group or corporate legal name"
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        {/* Dynamic Client Custom Fields */}
        {customFieldsData?.data && customFieldsData.data.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-2">Custom Fields</h4>
            <div className="space-y-3">
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

        <div>
          <label className="font-semibold text-slate-800 block mb-1">Internal Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Operational contacts, delivery instructions, billing terms..."
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={createMutation.isPending}>
            Register Client
          </Button>
        </div>
      </form>
    </Modal>
  );
};
