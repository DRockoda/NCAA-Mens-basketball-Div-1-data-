import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ColumnConfig } from '../config/columns';
import { teamSlugFromName } from '../utils/teamUtils';
import { PlayerLink } from './PlayerLink';
import { playerSlugFromRow } from '../utils/playerUtils';

interface DataTableProps {
  data: any[];
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  columnOrder: string[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  linkTeams?: boolean;
  linkPlayers?: boolean;
  linkTransfers?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;
type SortConfig = { column: string; direction: SortDirection };

export function DataTable({
  data,
  columns,
  visibleColumns,
  columnOrder,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  linkTeams = false,
  linkPlayers = false,
  linkTransfers = false,
}: DataTableProps) {
  // Filter and order columns based on columnOrder
  const visibleCols = columnOrder
    .map(colId => columns.find(c => c.id === colId))
    .filter((col): col is ColumnConfig => col !== undefined && visibleColumns.has(col.id));
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: '', direction: null });

  const pageSizeOptions = [25, 50, 100, 250, 500, 1000, 2000, 3000, 5000, 10000];

  // Sort data based on sortConfig
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.column || !sortConfig.direction) return 0;

    const col = visibleCols.find(c => c.id === sortConfig.column);
    if (!col) return 0;

    const aValue = a[sortConfig.column];
    const bValue = b[sortConfig.column];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    let comparison = 0;

    if (col.type === 'number') {
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      comparison = Number.isFinite(aNum) && Number.isFinite(bNum) ? aNum - bNum : 0;
    } else if (col.type === 'date') {
      const aDate = new Date(aValue).getTime();
      const bDate = new Date(bValue).getTime();
      comparison = aDate - bDate;
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (columnId: string) => {
    setSortConfig(prev => {
      if (prev.column === columnId) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { column: columnId, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { column: '', direction: null };
        }
      }
      return { column: columnId, direction: 'asc' };
    });
    onPageChange(1); // Reset to first page when sorting
  };

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 350px)' }}>
        <div className="inline-block min-w-full">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead className="bg-primary text-white sticky top-0 z-10">
            <tr>
              {visibleCols.map((col) => (
                <th
                  key={col.id}
                  className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer select-none hover:bg-primary/90 transition-colors"
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    <div className="flex flex-col">
                      <span
                        className={`text-[10px] leading-none ${
                          sortConfig.column === col.id && sortConfig.direction === 'asc'
                            ? 'text-white opacity-100'
                            : 'text-white/50 opacity-50'
                        }`}
                      >
                        ▲
                      </span>
                      <span
                        className={`text-[10px] leading-none -mt-0.5 ${
                          sortConfig.column === col.id && sortConfig.direction === 'desc'
                            ? 'text-white opacity-100'
                            : 'text-white/50 opacity-50'
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </div>
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
                  {visibleCols.map((col) => {
                    // Try to find the value using multiple key variations
                    let cellValue = row[col.id];
                    
                    // If not found, try case-insensitive matching
                    if (cellValue === undefined || cellValue === null || cellValue === '') {
                      const rowKeys = Object.keys(row);
                      const matchingKey = rowKeys.find(key => 
                        key.toLowerCase() === col.id.toLowerCase() ||
                        key.replace(/\s+/g, '_').toLowerCase() === col.id.toLowerCase() ||
                        key.replace(/\s+/g, '').toLowerCase() === col.id.replace(/_/g, '').toLowerCase() ||
                        key.replace(/_/g, '').toLowerCase() === col.id.replace(/_/g, '').toLowerCase()
                      );
                      if (matchingKey) {
                        cellValue = row[matchingKey];
                      }
                    }
                    
                    const isTeamColumn =
                      linkTeams &&
                      isTeamNameColumn(col.id, col.label) &&
                      typeof cellValue === 'string' &&
                      cellValue.trim().length > 0;
                    const isPlayerColumn =
                      (linkPlayers || linkTransfers) &&
                      isPlayerNameColumn(col.id, col.label) &&
                      typeof cellValue === 'string' &&
                      cellValue.trim().length > 0;
                    const isTransferTeamCol =
                      linkTransfers &&
                      isTransferTeamColumn(col.id, col.label) &&
                      typeof cellValue === 'string' &&
                      cellValue.trim().length > 0;

                    return (
                      <td key={col.id} className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 whitespace-nowrap">
                        {isTeamColumn || isTransferTeamCol ? (
                          <Link
                            to={`/teams/${teamSlugFromName(cellValue as string)}`}
                            className="text-primary font-semibold hover:underline"
                          >
                            {cellValue}
                          </Link>
                        ) : isPlayerColumn ? (
                          <PlayerLink
                            name={String(cellValue)}
                            row={row}
                            slug={playerSlugFromRow(row)}
                          />
                        ) : (
                          formatValue(cellValue, col.type)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-2 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs sm:text-sm text-gray-600">
            Showing {startIndex + 1}–{Math.min(endIndex, sortedData.length)} of {sortedData.length.toLocaleString()} rows
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to first page when changing page size
              }}
              className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function isTeamNameColumn(id: string, label?: string): boolean {
  const normalizedId = id.replace(/\s+/g, '_').toLowerCase();
  const normalizedLabel = label?.replace(/\s+/g, '_').toLowerCase();
  const candidateIds = ['team_name', 'team', 'teamname', 'school'];
  return (
    candidateIds.includes(normalizedId) ||
    (normalizedLabel ? candidateIds.includes(normalizedLabel) : false)
  );
}

function isTransferTeamColumn(id: string, label?: string): boolean {
  const normalizedId = id.replace(/\s+/g, '_').toLowerCase();
  const normalizedLabel = label?.replace(/\s+/g, '_').toLowerCase();
  // For transfers, check for Team and NewTeam columns
  const candidateIds = ['team', 'new_team', 'newteam', 'to_team', 'toteam'];
  return (
    candidateIds.includes(normalizedId) ||
    (normalizedLabel ? candidateIds.includes(normalizedLabel) : false)
  );
}

function isPlayerNameColumn(id: string, label?: string): boolean {
  const normalizedId = id.replace(/\s+/g, '_').toLowerCase();
  const normalizedLabel = label?.replace(/\s+/g, '_').toLowerCase();
  const candidateIds = ['name', 'player', 'player_name', 'playername'];
  return (
    candidateIds.includes(normalizedId) ||
    (normalizedLabel ? candidateIds.includes(normalizedLabel) : false)
  );
}


