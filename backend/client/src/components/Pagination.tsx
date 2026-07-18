import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export default function Pagination({
  page,
  perPage,
  totalPages,
  total,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  const perPageOptions = [10, 25, 50, 100];

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (page > 3) pages.push('...');
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Info */}
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Halaman {page} dari {totalPages} ({total} total)
          </span>
          
          {onPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Tampilkan:</span>
              <select
                value={perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500"
              >
                {perPageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} item
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 justify-center sm:justify-end">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
            title="Halaman pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, i) =>
              typeof p === 'number' ? (
                <button
                  key={i}
                  onClick={() => onPageChange(p)}
                  className={`min-w-[36px] h-8 px-2 rounded text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={i} className="px-1 text-gray-400 dark:text-gray-500">
                  {p}
                </span>
              )
            )}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
            title="Halaman berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
            title="Halaman terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
