import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermission } from '../../hooks/usePermission';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { ClientDetailsModal } from './ClientDetailsModal';
import { CreateClientModal } from './CreateClientModal';
import { Search, Plus, Building2, Mail, Phone, ChevronRight } from 'lucide-react';

export const ClientsListPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const canManageClients = usePermission('clients:manage');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clients', debouncedSearch, page],
    queryFn: () =>
      api.get('/clients', {
        search: debouncedSearch,
        page,
        limit,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered commercial stakeholders, freight partners, and cross-record timelines
          </p>
        </div>

        {canManageClients && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Client Account</span>
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Search by client name, email, or company..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading clients...</div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-600">Failed to load clients list</div>
        ) : !data?.data || data.data.length === 0 ? (
          <EmptyState
            title="No clients found"
            description="No client accounts match your query. Register a new client above."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Client Name</th>
                    <th className="px-5 py-3.5">Company</th>
                    <th className="px-5 py-3.5">Contact Email</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Created</th>
                    <th className="px-5 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {data.data.map((c: any) => (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedClientId(c._id)}
                      className="hover:bg-yellow-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{c.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{c.company || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{c.email || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{c.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="p-1 rounded text-slate-400 hover:text-slate-800">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page}
              pageCount={data.pageCount}
              total={data.total}
              limit={limit}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {selectedClientId && (
        <ClientDetailsModal
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
        />
      )}

      {isCreateModalOpen && (
        <CreateClientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};
