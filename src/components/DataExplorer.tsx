import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { getColumnsForMode, inferColumnsFromData, type ColumnConfig } from '../config/columns';
import { applyFilters, type Filters } from '../utils/filters';
import { downloadCSV, downloadXLSX } from '../utils/download';
import { SearchBar } from './SearchBar';
import { FiltersPanel } from './FiltersPanel';
import { DataTable } from './DataTable';

type Mode = 'teams' | 'players' | 'transfers';

interface DataExplorerProps {
  mode: Mode;
}

const MODE_LABELS: Record<Mode, string> = {
  teams: 'Team Data',
  players: 'Player Data',
  transfers: 'Transfer Data',
};

const MODE_DESCRIPTIONS: Record<Mode, string> = {
  teams: 'Explore team statistics, records, and performance metrics',
  players: 'Browse individual player statistics and achievements',
  transfers: 'Track player transfers between schools and seasons',
};

export function DataExplorer({ mode }: DataExplorerProps) {
  const { datasets, loading, error } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);

  const rawData = datasets ? datasets[mode] : [];
  
  // Infer columns from data if needed
  useEffect(() => {
    if (rawData.length > 0 && columns.length === 0) {
      const inferred = inferColumnsFromData(rawData, mode);
      const defaultCols = getColumnsForMode(mode);
      
      // Merge inferred with defaults, preferring defaults when available
      const merged = inferred.map(inferredCol => {
        const defaultCol = defaultCols.find(c => c.id === inferredCol.id);
        return defaultCol || inferredCol;
      });
      
      setColumns(merged);
      
      // Set default visible columns only if not already set
      const defaultVisible = new Set(
        merged.filter(c => c.defaultVisible).map(c => c.id)
      );
      if (defaultVisible.size > 0) {
        setVisibleColumns(defaultVisible);
      }
    }
  }, [rawData, mode, columns.length]);

  const filteredData = useMemo(() => {
    if (columns.length === 0) return [];
    return applyFilters(rawData, filters, searchQuery, columns);
  }, [rawData, filters, searchQuery, columns]);

  const handleFilterChange = (columnId: string, filter: Filters[string]) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: filter,
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleToggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  const handleDownloadCSV = () => {
    downloadCSV(filteredData, `${mode}_data`);
  };

  const handleDownloadXLSX = () => {
    downloadXLSX(filteredData, `${mode}_data`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-text-main mb-2">Loading data...</div>
          <div className="text-gray-600">Please wait while we load the dataset</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8 max-w-2xl mx-4">
          <div className="text-2xl font-semibold text-red-600 mb-2">Error Loading Data</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <div className="text-sm text-gray-500 space-y-2">
            <div>
              Make sure the Excel file is located at: <code className="bg-gray-100 px-2 py-1 rounded">public/data/NCAA Mens basketball Data (2).xlsx</code>
            </div>
            <div className="mt-4">
              <strong>Expected sheet names:</strong> Teams, Players, Transfers
            </div>
            <div className="mt-2">
              Check the browser console (F12) to see what sheets are available in your Excel file.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-text-main mb-2">No data available</div>
          <div className="text-gray-600">The dataset appears to be empty</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-text-main mb-2">{MODE_LABELS[mode]}</h1>
          <p className="text-gray-600">{MODE_DESCRIPTIONS[mode]}</p>
        </div>

        {/* Search and Download Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              data={rawData}
              columns={columns}
              onSelectSuggestion={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCSV}
              disabled={filteredData.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-text-main transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={handleDownloadXLSX}
              disabled={filteredData.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Download XLSX
            </button>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
          <FiltersPanel
            columns={columns}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            filters={filters}
            onFilterChange={handleFilterChange}
            data={rawData}
          />
          <DataTable
            data={filteredData}
            columns={columns}
            visibleColumns={visibleColumns}
            currentPage={currentPage}
            pageSize={50}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}

