import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermission } from '../../hooks/usePermission';
import { RecordDetailsModal } from './RecordDetailsModal';
import { CreateRecordModal } from './CreateRecordModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Drawer } from '../../components/common/Drawer';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Search,
  SlidersHorizontal,
  Plus,
  ArrowUpDown,
  X,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const RecordsListPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<{
    status?: string;
    department?: string;
    job?: string;
    area?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  // Sorting & Pagination
  const [sort, setSort] = useState<string>('endDateAsc');
  const [page, setPage] = useState<number>(1);
  const limit = 25;

  const canCreate = usePermission('records:create');

  // Query records
  const { data: recordsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['records', debouncedSearch, filters, sort, page],
    queryFn: () =>
      api.get('/records', {
        search: debouncedSearch,
        ...filters,
        sort,
        page,
        limit,
      }),
  });

  // Query reference options for filters
  const { data: statusesData } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => api.get('/statuses'),
  });
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/reference/departments'),
  });
  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/reference/jobs'),
  });
  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: () => api.get('/reference/areas'),
  });
  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: () => api.get('/reference/types'),
  });

  const handleRemoveFilter = (key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete (next as any)[key];
      return next;
    });
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setSearchInput('');
    setPage(1);
  };

  // Helper for computing client-side expiration display text
  const getExpirationBadge = (record: any) => {
    if (record.isExpired || record.status?.name === 'Expired') {
      return <Badge isExpired={true}>Expired</Badge>;
    }

    if (record.status?.isTerminal) {
      return <span className="text-xs text-slate-400">Terminal</span>;
    }

    const now = new Date().getTime();
    const expiry = new Date(record.expiresAt).getTime();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return <Badge isExpired={true}>Expired (Pending Sweep)</Badge>;
    } else if (diffDays <= 2) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
          <Clock className="h-3 w-3 animate-pulse" />
          Expiring in {diffDays} {diffDays === 1 ? 'day' : 'days'}
        </span>
      );
    } else {
      return (
        <span className="text-[11px] text-slate-500 font-mono">
          Expires in {diffDays} days
        </span>
      );
    }
  };

  const activeFilterCount = Object.keys(filters).filter((k) => (filters as any)[k]).length;

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Records Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-side filtered, status-driven operational submissions
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Record</span>
          </Button>
        )}
      </div>

      {/* Control Bar: Search Input, Filter Button, Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Debounced Search */}
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
            placeholder="Search unique ID or client name..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-yellow-400 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Drawer Trigger & Sort Dropdown */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="h-8 text-xs font-semibold relative"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-900 text-yellow-400 rounded-full text-[10px]">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-yellow-400"
            >
              <option value="endDateAsc">Deadline (Ascending)</option>
              <option value="endDateDesc">Deadline (Descending)</option>
              <option value="nameAsc">Client Name (A–Z)</option>
              <option value="nameDesc">Client Name (Z–A)</option>
              <option value="submissionDateDesc">Newest Submissions</option>
              <option value="submissionDateAsc">Oldest Submissions</option>
              <option value="statusOrder">Status Order</option>
            </select>
          </div>
        </div>
      </div>

      {/* Removable Active Filter Chips */}
      {(activeFilterCount > 0 || debouncedSearch) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Applied:</span>

          {debouncedSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              <span>Search: &quot;{debouncedSearch}&quot;</span>
              <button onClick={() => setSearchInput('')}>
                <X className="h-3 w-3 hover:text-black" />
              </button>
            </span>
          )}

          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            let displayVal = value;
            if (key === 'status') {
              displayVal = statusesData?.data?.find((s: any) => s._id === value)?.name || value;
            } else if (key === 'department') {
              displayVal = deptsData?.data?.find((d: any) => d._id === value)?.name || value;
            }
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300"
              >
                <span className="capitalize">{key}:</span>
                <span className="font-semibold">{displayVal}</span>
                <button onClick={() => handleRemoveFilter(key)}>
                  <X className="h-3 w-3 hover:text-black" />
                </button>
              </span>
            );
          })}

          <button
            onClick={handleClearAllFilters}
            className="text-xs text-red-600 hover:text-red-700 font-medium underline ml-1"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Table / Card List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading records from database...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-red-600">
            Error loading records.{' '}
            <button onClick={() => refetch()} className="underline font-bold">
              Retry
            </button>
          </div>
        ) : !recordsData?.data || recordsData.data.length === 0 ? (
          <EmptyState
            title="No records match these criteria"
            description="Try changing your search keywords or clearing active filters."
            actionLabel="Reset All Filters"
            onAction={handleClearAllFilters}
          />
        ) : (
          <>
            {/* Desktop Table View (>=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Record ID</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Department / Job</th>
                    <th className="px-5 py-3.5">Deadline</th>
                    <th className="px-5 py-3.5">Expiration SLA</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {recordsData.data.map((r: any) => (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedRecordId(r._id)}
                      className="hover:bg-yellow-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-950">
                        {r.uniqueId}
                        <span className="block text-[11px] font-sans font-normal text-slate-500 truncate max-w-xs">
                          {r.shortText}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {r.client?.name || r.clientNameCache || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge color={r.status?.color} isExpired={r.isExpired}>
                          {r.status?.name || 'Status'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold block text-slate-800">
                          {r.department?.name || '—'}
                        </span>
                        <span className="text-slate-400 block text-[11px]">
                          {r.job?.name || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">{getExpirationBadge(r)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordId(r._id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (<768px) */}
            <div className="md:hidden divide-y divide-slate-200">
              {recordsData.data.map((r: any) => (
                <div
                  key={r._id}
                  onClick={() => setSelectedRecordId(r._id)}
                  className="p-4 hover:bg-slate-50 space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-950 text-sm">
                      {r.uniqueId}
                    </span>
                    <Badge color={r.status?.color} isExpired={r.isExpired}>
                      {r.status?.name || 'Status'}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-slate-800">{r.shortText}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{r.client?.name || r.clientNameCache}</span>
                    <span>{getExpirationBadge(r)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              page={recordsData.page}
              pageCount={recordsData.pageCount}
              total={recordsData.total}
              limit={limit}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      {/* Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Records"
        subtitle="Narrow submissions across operational dimensions"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value || undefined }))
              }
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Statuses</option>
              {statusesData?.data?.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Department</label>
            <select
              value={filters.department || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, department: e.target.value || undefined }))
              }
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Departments</option>
              {deptsData?.data?.map((d: any) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Job Workflow</label>
            <select
              value={filters.job || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, job: e.target.value || undefined }))
              }
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Jobs</option>
              {jobsData?.data?.map((j: any) => (
                <option key={j._id} value={j._id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Area Zone</label>
            <select
              value={filters.area || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, area: e.target.value || undefined }))
              }
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Areas</option>
              {areasData?.data?.map((a: any) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Document Type</label>
            <select
              value={filters.type || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value || undefined }))
              }
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">All Types</option>
              {typesData?.data?.map((t: any) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Submitted From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))
                }
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Submitted To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }))
                }
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsFilterDrawerOpen(false);
                setPage(1);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Record Details Modal */}
      {selectedRecordId && (
        <RecordDetailsModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
          onRecordDeleted={() => setSelectedRecordId(null)}
        />
      )}

      {/* Create Record Modal */}
      {isCreateModalOpen && (
        <CreateRecordModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
};
