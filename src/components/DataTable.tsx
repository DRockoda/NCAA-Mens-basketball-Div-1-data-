import type { ColumnConfig } from '../config/columns';

interface DataTableProps {
  data: any[];
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function DataTable({
  data,
  columns,
  visibleColumns,
  currentPage,
  pageSize,
  onPageChange,
}: DataTableProps) {
  const visibleCols = columns.filter(c => visibleColumns.has(c.id));
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (type === 'number') {
      const num = Number(value);
      return Number.isFinite(num) ? num.toLocaleString() : '-';
    }
    if (type === 'date') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary text-white sticky top-0 z-10">
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.id}
                  className="px-4 py-3 text-left font-semibold text-sm whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-gray-200 ${
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-gray-100 transition-colors`}
                >
                  {visibleCols.map((col) => (
                    <td key={col.id} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatValue(row[col.id], col.type)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}–{Math.min(endIndex, data.length)} of {data.length.toLocaleString()} rows
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

