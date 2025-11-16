import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  const rawData = datasets ? datasets[mode] : [];
  
  // Infer columns from data if needed
  useEffect(() => {
    if (rawData.length > 0 && columns.length === 0) {
      const inferred = inferColumnsFromData(rawData, mode);
      const defaultCols = getColumnsForMode(mode);
      
      // Create a map of default columns by ID (case-insensitive for Season)
      const defaultColsMap = new Map(
        defaultCols.map(col => [col.id.toLowerCase(), col])
      );
      
      // Merge inferred with defaults, preferring defaults when available
      // Also ensure Season column is included even if not in inferred
      const merged: ColumnConfig[] = [];
      const processedIds = new Set<string>();
      
      // First, add all default columns (matching by ID or label)
      defaultCols.forEach(defaultCol => {
        // Skip if we already processed a column with the same label (for transfers, avoid duplicate Transfer Rank)
        if (mode === 'transfers' && defaultCol.label === 'Transfer Rank') {
          const alreadyHasTransferRank = merged.some(c => c.label === 'Transfer Rank');
          if (alreadyHasTransferRank && defaultCol.id !== 'Transfer_Rank') {
            return; // Skip alternative TransferRank if we already have Transfer_Rank
          }
        }
        
        // Try to find by exact ID match first
        let inferredCol = inferred.find(c => c.id.toLowerCase() === defaultCol.id.toLowerCase());
        
        // If not found, try to find by label (for Name -> PlayerName mapping)
        if (!inferredCol && defaultCol.label === 'Player Name') {
          inferredCol = inferred.find(c => c.id.toLowerCase() === 'name');
        }
        
        // If still not found and it's Season, try to find any season column
        if (!inferredCol && defaultCol.id.toLowerCase().includes('season')) {
          inferredCol = inferred.find(c => c.id.toLowerCase().includes('season'));
        }
        
        // If still not found and it's Transfer Rank, try to find any transfer rank column
        if (!inferredCol && defaultCol.label === 'Transfer Rank') {
          inferredCol = inferred.find(c => 
            (c.id.toLowerCase().includes('transfer') && c.id.toLowerCase().includes('rank'))
          );
        }
        
        if (inferredCol) {
          // Use inferred column but keep default column's label and settings
          // For Transfer_Rank, always use default's filterable setting (true)
          const useDefaultFilterable = (mode === 'transfers' && defaultCol.id === 'Transfer_Rank') 
            ? defaultCol.filterable 
            : (defaultCol.filterable ?? inferredCol.filterable);
          
          merged.push({
            ...inferredCol,
            label: defaultCol.label,
            filterable: useDefaultFilterable,
            searchable: defaultCol.searchable ?? inferredCol.searchable,
            defaultVisible: defaultCol.defaultVisible ?? inferredCol.defaultVisible,
          });
        } else {
          merged.push(defaultCol);
        }
        processedIds.add(defaultCol.id.toLowerCase());
        if (inferredCol) {
          processedIds.add(inferredCol.id.toLowerCase());
        }
      });
      
      // Then add inferred columns that aren't in defaults (but skip duplicates for transfers)
      inferred.forEach(inferredCol => {
        if (processedIds.has(inferredCol.id.toLowerCase())) {
          return; // Already processed
        }
        
        // For transfers, skip if it's a duplicate Transfer Rank
        if (mode === 'transfers' && inferredCol.label === 'Transfer Rank') {
          const alreadyHasTransferRank = merged.some(c => c.label === 'Transfer Rank');
          if (alreadyHasTransferRank) {
            return; // Skip duplicate
          }
        }
        
        merged.push(inferredCol);
        processedIds.add(inferredCol.id.toLowerCase());
      });
      
      // For transfers, remove duplicate Transfer Rank columns before setting
      let finalCols = merged;
      if (mode === 'transfers') {
        const uniqueColsMap = new Map<string, ColumnConfig>();
        merged.forEach(col => {
          const key = col.label.toLowerCase();
          // For Transfer Rank, prefer the one with Transfer_Rank ID and ensure it's filterable
          if (col.label === 'Transfer Rank') {
            const existing = uniqueColsMap.get(key);
            if (!existing || col.id.toLowerCase() === 'transfer_rank') {
              // Ensure Transfer Rank is always filterable
              uniqueColsMap.set(key, {
                ...col,
                filterable: true,
              });
            }
          } else {
            // For other columns, just add them if not already added
            if (!uniqueColsMap.has(key)) {
              uniqueColsMap.set(key, col);
            }
          }
        });
        finalCols = Array.from(uniqueColsMap.values());
        
        // Ensure Transfer_Rank default column exists even if not in merged
        const hasTransferRank = finalCols.some(col => 
          col.label === 'Transfer Rank' || 
          (col.id.toLowerCase().includes('transfer') && col.id.toLowerCase().includes('rank'))
        );
        if (!hasTransferRank) {
          const transferRankCol = defaultCols.find(col => col.id === 'Transfer_Rank');
          if (transferRankCol) {
            finalCols.push(transferRankCol);
          }
        } else {
          // Ensure existing Transfer Rank column is filterable
          finalCols = finalCols.map(col => {
            if (col.label === 'Transfer Rank' || 
                (col.id.toLowerCase().includes('transfer') && col.id.toLowerCase().includes('rank') && !col.id.toLowerCase().includes('hs'))) {
              return { ...col, filterable: true };
            }
            return col;
          });
        }
      }
      
      setColumns(finalCols);
      
      // Set default visible columns only if not already set
      if (mode === 'transfers') {
        // For transfers, only show specific columns in this exact order: Season, Transfer_Rank, Name, Team, New_Team, HS_Ranking
        const transferColumnOrder = ['Season', 'Transfer_Rank', 'Name', 'Team', 'New_Team', 'HS_Ranking'];
        
        // Get columns in the specified order
        const orderedColumns: string[] = [];
        for (const colId of transferColumnOrder) {
          const found = finalCols.find(c => 
            c.id.toLowerCase() === colId.toLowerCase() || 
            (colId === 'Transfer_Rank' && c.label === 'Transfer Rank')
          );
          if (found && !orderedColumns.includes(found.id)) {
            orderedColumns.push(found.id);
          }
        }
        
        if (orderedColumns.length > 0) {
          setVisibleColumns(new Set(orderedColumns)); // All 6: Season, Transfer_Rank, Name, Team, New_Team, HS_Ranking
          // Always set column order to the default sequence for transfers
          setColumnOrder(orderedColumns);
        }
      } else {
        const defaultVisible = new Set(
          finalCols.filter(c => c.defaultVisible).map(c => c.id)
        );
        if (defaultVisible.size > 0) {
          setVisibleColumns(defaultVisible);
          // For non-transfers, maintain order from columns array
          const ordered = finalCols
            .filter(c => defaultVisible.has(c.id))
            .map(c => c.id);
          setColumnOrder(ordered);
        }
      }
      
      // Set initial column order if not already set (for transfers, this shouldn't be needed)
      if (columnOrder.length === 0 && finalCols.length > 0 && mode !== 'transfers') {
        const visibleIds = Array.from(visibleColumns.size > 0 ? visibleColumns : new Set(finalCols.filter(c => c.defaultVisible).map(c => c.id)));
        setColumnOrder(visibleIds.length > 0 ? visibleIds : finalCols.map(c => c.id));
      }
    }
  }, [rawData, mode, columns.length]);

  const filteredData = useMemo(() => {
    if (columns.length === 0) return [];
    let data = applyFilters(rawData, filters, searchTags, columns);
    
    // Remove duplicates for transfers based on player name
    if (mode === 'transfers') {
      const seen = new Set<string>();
      data = data.filter(row => {
        const name = String(row['Name'] || row['PlayerName'] || '').trim();
        if (!name || seen.has(name)) {
          return false;
        }
        seen.add(name);
        return true;
      });
    }
    
    return data;
  }, [rawData, filters, searchTags, columns, mode]);

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
    // Get visible columns in the correct order
    const visibleColsInOrder = columnOrder
      .filter(colId => visibleColumns.has(colId))
      .filter(Boolean) as string[];
    
    downloadCSV(filteredData, `${mode}_data`, visibleColsInOrder, columns);
  };

  const handleDownloadXLSX = () => {
    // Get visible columns in the correct order
    const visibleColsInOrder = columnOrder
      .filter(colId => visibleColumns.has(colId))
      .filter(Boolean) as string[];
    
    downloadXLSX(filteredData, `${mode}_data`, visibleColsInOrder, columns);
  };

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDownloadDropdown(false);
      }
    };

    if (showDownloadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadDropdown]);

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
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-main mb-2">{MODE_LABELS[mode]}</h1>
          <p className="text-sm sm:text-base text-gray-600">{MODE_DESCRIPTIONS[mode]}</p>
        </div>

        {/* Search and Download Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              searchTags={searchTags}
              onSearchTagsChange={(tags) => {
                setSearchTags(tags);
                setCurrentPage(1);
              }}
              data={rawData}
              columns={columns}
            />
          </div>
          <div className="relative" ref={downloadDropdownRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDownloadDropdown(!showDownloadDropdown);
              }}
              disabled={filteredData.length === 0}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm sm:text-base flex items-center gap-2"
            >
              Download
              <svg
                className={`w-4 h-4 transition-transform ${showDownloadDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showDownloadDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadCSV();
                    setShowDownloadDropdown(false);
                  }}
                  disabled={filteredData.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-t-lg transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadXLSX();
                    setShowDownloadDropdown(false);
                  }}
                  disabled={filteredData.length === 0}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-lg transition-colors border-t border-gray-200"
                >
                  Excel (XLSX)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters and Table */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] xl:grid-cols-[320px,1fr] gap-4 lg:gap-6">
          <div className="order-2 lg:order-1">
            <FiltersPanel
              columns={columns}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              onToggleColumn={(columnId) => {
                handleToggleColumn(columnId);
                // Update column order to maintain visible columns in order
                const newVisible = new Set(visibleColumns);
                if (newVisible.has(columnId)) {
                  newVisible.delete(columnId);
                } else {
                  newVisible.add(columnId);
                  // Add to end of columnOrder if not already there
                  if (!columnOrder.includes(columnId)) {
                    setColumnOrder([...columnOrder, columnId]);
                  }
                }
                setVisibleColumns(newVisible);
              }}
              onSelectAllColumns={() => {
                // Filter out S. No. and similar columns
                const filteredColumns = columns.filter(col => {
                  const lowerId = col.id.toLowerCase();
                  const lowerLabel = col.label.toLowerCase();
                  return !lowerId.includes('s. no') && 
                         !lowerId.includes('s no') && 
                         !lowerId.includes('sr. no') && 
                         !lowerId.includes('sr no') &&
                         !lowerLabel.includes('s. no') &&
                         !lowerLabel.includes('s no') &&
                         !lowerLabel.includes('sr. no') &&
                         !lowerLabel.includes('sr no');
                });
                
                // Create new visible set with all filtered columns
                const newVisible = new Set<string>();
                const newOrder: string[] = [];
                
                // Add existing column order first (maintain order)
                columnOrder.forEach(colId => {
                  if (filteredColumns.some(col => col.id === colId)) {
                    newVisible.add(colId);
                    newOrder.push(colId);
                  }
                });
                
                // Add remaining filtered columns
                filteredColumns.forEach(col => {
                  if (!newVisible.has(col.id)) {
                    newVisible.add(col.id);
                    newOrder.push(col.id);
                  }
                });
                
                // Update state
                setVisibleColumns(newVisible);
                setColumnOrder(newOrder);
              }}
              onDeselectAllColumns={() => {
                // Deselect all columns
                setVisibleColumns(new Set());
              }}
              onColumnOrderChange={(newOrder) => {
                // For all modes, just update the order
                // Allow users to reorder columns freely, including core columns in transfers
                setColumnOrder(newOrder);
                setVisibleColumns(new Set(newOrder.filter(id => visibleColumns.has(id))));
              }}
              filters={filters}
              onFilterChange={handleFilterChange}
              data={rawData}
              mode={mode}
              onResetFilters={() => {
                setFilters({});
                setSearchTags([]);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="order-1 lg:order-2">
            <DataTable
              data={filteredData}
              columns={columns}
              visibleColumns={visibleColumns}
              columnOrder={columnOrder}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

