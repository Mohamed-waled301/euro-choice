import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  total,
  limit,
  onPageChange,
}) => {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white sm:px-6 rounded-b-xl">
      <div className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-800">{start}</span> to{' '}
        <span className="font-medium text-slate-800">{end}</span> of{' '}
        <span className="font-medium text-slate-800">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2.5 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>

        <span className="text-xs text-slate-600 px-2">
          Page {page} of {pageCount || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="h-8 px-2.5 text-xs"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
