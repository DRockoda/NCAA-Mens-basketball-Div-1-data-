import { useState } from 'react';
import type { ColumnConfig } from '../config/columns';
import { filterEmptyColumns } from '../config/columns';
import type { Filter, Filters } from '../utils/filters';

// Separate component for Team Name filter to use useState
function TeamNameFilter({ 
  col, 
  selectedValues, 
  distinctValues, 
  onFilterChange 
}: { 
  col: ColumnConfig; 
  selectedValues: string[]; 
  distinctValues: string[]; 
  onFilterChange: (columnId: string, filter: Filter | undefined) => void;
}) {
  const [teamInput, setTeamInput] = useState('');
  const teamSuggestions = distinctValues.filter(v => 
    v.toLowerCase().includes(teamInput.toLowerCase())
  ).slice(0, 10);

  return (
    <div className="mb-4 min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
        {col.label}
      </label>
      <input
        type="text"
        value={teamInput}
        onChange={(e) => setTeamInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && teamInput.trim() && !selectedValues.includes(teamInput.trim())) {
            e.preventDefault();
            onFilterChange(col.id, { type: 'categorical', values: [...selectedValues, teamInput.trim()] });
            setTeamInput('');
          }
        }}
        placeholder="Type team name and press Enter"
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {teamInput && teamSuggestions.length > 0 && (
        <div className="mt-1 border border-gray-300 rounded bg-white max-h-32 overflow-y-auto">
          {teamSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                if (!selectedValues.includes(suggestion)) {
                  onFilterChange(col.id, { type: 'categorical', values: [...selectedValues, suggestion] });
                }
                setTeamInput('');
              }}
              className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      {selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedValues.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded"
            >
              {value}
              <button
                type="button"
                onClick={() => {
                  const newValues = selectedValues.filter(v => v !== value);
                  onFilterChange(col.id, newValues.length > 0 ? { type: 'categorical', values: newValues } : undefined);
                }}
                className="hover:text-primary/70"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface FiltersPanelProps {
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  columnOrder: string[];
  onToggleColumn: (columnId: string) => void;
  onColumnOrderChange: (newOrder: string[]) => void;
  onSelectAllColumns?: () => void;
  onDeselectAllColumns?: () => void;
  filters: Filters;
  onFilterChange: (columnId: string, filter: Filter | undefined) => void;
  data: any[];
  onResetFilters?: () => void;
  mode?: 'teams' | 'players' | 'transfers';
}

export function FiltersPanel({
  columns,
  visibleColumns,
  columnOrder,
  onToggleColumn,
  onColumnOrderChange,
  onSelectAllColumns,
  onDeselectAllColumns,
  filters,
  onFilterChange,
  data,
  onResetFilters,
  mode,
}: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'manage-columns' | 'filters'>('filters');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getDistinctValues = (columnId: string, maxValues = 200): string[] => {
    const values = new Set<string>();
    for (const row of data) {
      const value = String(row[columnId] ?? '').trim();
      if (value) values.add(value);
    }
    return Array.from(values).sort().slice(0, maxValues);
  };

  const renderFilter = (col: ColumnConfig) => {
    if (!col.filterable) return null;

    const currentFilter = filters[col.id];

    if (col.type === 'string') {
      const stringFilter = currentFilter as { type: 'string'; value: string } | undefined;
      return (
        <div className="mb-4 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
            {col.label}
          </label>
          <input
            type="text"
            value={stringFilter?.value || ''}
            onChange={(e) =>
              onFilterChange(col.id, e.target.value ? { type: 'string', value: e.target.value } : undefined)
            }
            placeholder={`Filter ${col.label}...`}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
          />
        </div>
      );
    }

    if (col.type === 'number') {
      const numberFilter = currentFilter as { type: 'number'; min?: number; max?: number; operator?: '>' | '>=' | '<' | '<='; value?: number } | undefined;
      
      // For players and teams mode, use operator-based filtering
      if (mode === 'players' || mode === 'teams') {
        return (
          <div className="mb-4 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
              {col.label}
            </label>
            <div className="flex gap-2">
              <select
                value={numberFilter?.operator || ''}
                onChange={(e) => {
                  const operator = e.target.value as '>' | '>=' | '<' | '<=' | '';
                  if (operator) {
                    onFilterChange(col.id, {
                      type: 'number',
                      operator: operator as '>' | '>=' | '<' | '<=',
                      value: numberFilter?.value,
                    });
                  } else {
                    onFilterChange(col.id, undefined);
                  }
                }}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-0"
              >
                <option value="">Select operator</option>
                <option value=">">&gt;</option>
                <option value=">=">&gt;=</option>
                <option value="<">&lt;</option>
                <option value="<=">&lt;=</option>
              </select>
              <input
                type="number"
                value={numberFilter?.value ?? ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined;
                  if (numberFilter?.operator) {
                    onFilterChange(col.id, {
                      type: 'number',
                      operator: numberFilter.operator,
                      value,
                    });
                  } else if (value !== undefined) {
                    // If operator is not selected but value is entered, don't apply filter yet
                    onFilterChange(col.id, {
                      type: 'number',
                      value,
                    });
                  } else {
                    onFilterChange(col.id, undefined);
                  }
                }}
                placeholder="Value"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                disabled={!numberFilter?.operator}
              />
            </div>
          </div>
        );
      }
      
      // For other modes, use min/max range filtering
      return (
        <div className="mb-4 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
            {col.label}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={numberFilter?.min ?? ''}
              onChange={(e) =>
                onFilterChange(col.id, {
                  type: 'number',
                  min: e.target.value ? Number(e.target.value) : undefined,
                  max: numberFilter?.max,
                })
              }
              placeholder="Min"
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
            />
            <input
              type="number"
              value={numberFilter?.max ?? ''}
              onChange={(e) =>
                onFilterChange(col.id, {
                  type: 'number',
                  min: numberFilter?.min,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Max"
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
            />
          </div>
        </div>
      );
    }

    if (col.type === 'date') {
      const dateFilter = currentFilter as { type: 'date'; from?: string; to?: string } | undefined;
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {col.label}
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={dateFilter?.from || ''}
              onChange={(e) =>
                onFilterChange(col.id, {
                  type: 'date',
                  from: e.target.value || undefined,
                  to: dateFilter?.to,
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={dateFilter?.to || ''}
              onChange={(e) =>
                onFilterChange(col.id, {
                  type: 'date',
                  from: dateFilter?.from,
                  to: e.target.value || undefined,
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      );
    }

    if (col.type === 'categorical') {
      const categoricalFilter = currentFilter as { type: 'categorical'; values: string[] } | undefined;
      const distinctValues = getDistinctValues(col.id);
      const selectedValues = categoricalFilter?.values || [];

      const isSeason = col.id.toLowerCase().includes('season');
      const isConference = col.id.toLowerCase().includes('conference');
      const isClass = col.id.toLowerCase().includes('class');
      const isTeam = col.id.toLowerCase().includes('team') && (col.id.toLowerCase().includes('name') || col.label.toLowerCase().includes('teamname'));

      // Season: Single select dropdown
      if (isSeason) {
        // Use the actual column ID to get distinct values
        // distinctValues should already have values if the column exists in data
        let seasonsToDisplay = distinctValues;
        
        // If still empty, try alternative column ID variations
        if (seasonsToDisplay.length === 0) {
          const altIds = ['Season', 'season', 'Year', 'year'];
          for (const altId of altIds) {
            const altValues = getDistinctValues(altId);
            if (altValues.length > 0) {
              seasonsToDisplay = altValues;
              break;
            }
          }
        }
        
        // Sort seasons numerically (years) - most recent first
        const sortedSeasons = [...seasonsToDisplay].sort((a, b) => {
          const yearA = parseInt(a) || 0;
          const yearB = parseInt(b) || 0;
          return yearB - yearA; // Most recent first
        });

        return (
          <div className="mb-4 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
              {col.label}
            </label>
            <select
              value={selectedValues[0] || ''}
              onChange={(e) =>
                onFilterChange(col.id, e.target.value ? { type: 'categorical', values: [e.target.value] } : undefined)
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-0"
            >
              <option value="">All Seasons</option>
              {sortedSeasons.length > 0 ? (
                sortedSeasons.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))
              ) : (
                <option disabled>No seasons found</option>
              )}
            </select>
          </div>
        );
      }

      // Conference: Multi-select checkboxes
      if (isConference) {
        return (
          <div className="mb-4 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
              {col.label}
            </label>
            <div className="max-h-60 overflow-y-auto overflow-x-hidden border border-gray-300 rounded p-2 space-y-1">
              {distinctValues.sort().map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(value)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...selectedValues, value]
                        : selectedValues.filter(v => v !== value);
                      onFilterChange(col.id, newValues.length > 0 ? { type: 'categorical', values: newValues } : undefined);
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">{value}</span>
                </label>
              ))}
            </div>
            {selectedValues.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {selectedValues.length} selected
              </div>
            )}
          </div>
        );
      }

      // Class: Dropdown (like Season)
      if (isClass && mode === 'players') {
        const sortedClasses = [...distinctValues].sort();
        return (
          <div className="mb-4 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 truncate">
              {col.label}
            </label>
            <select
              value={selectedValues[0] || ''}
              onChange={(e) =>
                onFilterChange(col.id, e.target.value ? { type: 'categorical', values: [e.target.value] } : undefined)
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white min-w-0"
            >
              <option value="">All Classes</option>
              {sortedClasses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        );
      }

      // Team Name: Text input with multi-select capability
      if (isTeam) {
        // We'll create a separate component for team filter to use useState
        return <TeamNameFilter 
          col={col} 
          selectedValues={selectedValues}
          distinctValues={distinctValues}
          onFilterChange={onFilterChange}
        />;
      }

      // Check for Transfer Rank early and explicitly
      // Check by label first (more reliable), then by ID patterns
      const isTransferRank = (mode === 'transfers' && 
                              ((col.label.toLowerCase().includes('transferrank') || 
                                (col.label.toLowerCase().includes('transfer') && 
                                col.label.toLowerCase().includes('rank') && 
                                !col.label.toLowerCase().includes('hs'))) ||
                               col.id.toLowerCase().includes('transfer_rank') || 
                               col.id.toLowerCase() === 'transfer_rank' ||
                               col.id.toLowerCase().includes('transferrank') ||
                               (col.id.toLowerCase().includes('transfer') && 
                                col.id.toLowerCase().includes('rank') && 
                                !col.id.toLowerCase().includes('hs'))));
      
      // Check for HS Ranking
      const isHSRanking = col.label.toLowerCase().includes('hsranking') ||
                         col.id.toLowerCase().includes('hs_ranking') || 
                         col.id.toLowerCase().includes('hsranking') ||
                         (col.id.toLowerCase().includes('hs') && col.id.toLowerCase().includes('rank'));
      
      // Check for Transfer Type
      const isTransferType = col.id.toLowerCase().includes('transfertype');
      
      // Handle Transfer Rank and HS Ranking as dropdowns with 1-5 FIRST (before other checks)
      if (isTransferRank || isHSRanking) {
        // Always show 1-5 for Transfer Rank and HS Ranking, regardless of data
        const options = ['1', '2', '3', '4', '5'];
        
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label}
            </label>
            <select
              value={selectedValues[0] || ''}
              onChange={(e) =>
                onFilterChange(col.id, e.target.value ? { type: 'categorical', values: [e.target.value] } : undefined)
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">All {col.label}</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        );
      }
      
      // Handle Transfer Type as dropdown with distinct values
      if (isTransferType) {
        const options = distinctValues.sort();
        
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label}
            </label>
            <select
              value={selectedValues[0] || ''}
              onChange={(e) =>
                onFilterChange(col.id, e.target.value ? { type: 'categorical', values: [e.target.value] } : undefined)
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">All {col.label}</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        );
      }

      // Other categorical fields: text input
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {col.label}
          </label>
          <input
            type="text"
            value={selectedValues[0] || ''}
            onChange={(e) =>
              onFilterChange(col.id, e.target.value ? { type: 'categorical', values: [e.target.value] } : undefined)
            }
            placeholder={`Filter ${col.label}...`}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 lg:p-4 w-full max-w-full overflow-hidden" style={{ maxWidth: '100%' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 font-semibold text-text-main"
      >
        <span>Filters & Columns</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="w-full" style={{ maxWidth: '100%' }}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                activeTab === 'filters'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Filters
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage-columns')}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                activeTab === 'manage-columns'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Manage Columns
            </button>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)] pr-1 w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Manage Columns Tab */}
            {activeTab === 'manage-columns' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-main">Visible Columns</h3>
                  <div className="flex gap-1">
                    <button
                  type="button"
                  onClick={() => {
                    if (onSelectAllColumns) {
                      onSelectAllColumns();
                    } else {
                      // Fallback: Select all filtered columns
                      let filteredColumns = filterEmptyColumns(columns);
                      filteredColumns = filteredColumns.filter(col => {
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
                      
                      // Toggle each column that's not visible
                      filteredColumns.forEach(col => {
                        if (!visibleColumns.has(col.id)) {
                          onToggleColumn(col.id);
                        }
                      });
                    }
                  }}
                  className="text-xs text-primary hover:text-primary/80 underline px-1"
                  title="Select All"
                >
                  All
                </button>
                <span className="text-xs text-gray-400">|</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeselectAllColumns) {
                      onDeselectAllColumns();
                    } else {
                      // Fallback: Deselect all columns
                      Array.from(visibleColumns).forEach(colId => {
                        onToggleColumn(colId);
                      });
                    }
                  }}
                  className="text-xs text-primary hover:text-primary/80 underline px-1"
                  title="Deselect All"
                >
                  None
                </button>
                  </div>
                </div>
                <div className="space-y-2">
              {(() => {
                // First filter out empty columns (_EMPTY, etc.)
                let filteredColumns = filterEmptyColumns(columns);
                
                // Additional safety check: filter out any columns with truly blank labels or IDs
                filteredColumns = filteredColumns.filter(col => {
                  const id = String(col.id || '').trim();
                  const label = String(col.label || '').trim();
                  // Must have both non-empty ID and label
                  return id.length > 0 && label.length > 0;
                });
                
                // Then filter out S. No. and similar columns
                filteredColumns = filteredColumns.filter(col => {
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
                
                // Sort columns by columnOrder, maintaining the order from columnOrder
                // First, create a map for quick lookup
                const orderMap = new Map<string, number>();
                columnOrder.forEach((colId, index) => {
                  orderMap.set(colId, index);
                });
                
                // Sort filtered columns by their position in columnOrder
                const sortedColumns = [...filteredColumns].sort((a, b) => {
                  const aIndex = orderMap.get(a.id);
                  const bIndex = orderMap.get(b.id);
                  
                  // If both are in columnOrder, sort by their index
                  if (aIndex !== undefined && bIndex !== undefined) {
                    return aIndex - bIndex;
                  }
                  // If only a is in columnOrder, a comes first
                  if (aIndex !== undefined) return -1;
                  // If only b is in columnOrder, b comes first
                  if (bIndex !== undefined) return 1;
                  // If neither is in columnOrder, maintain original order
                  return 0;
                });
                
                // Insert missing columns at their correct positions
                const finalSorted: ColumnConfig[] = [];
                columnOrder.forEach(colId => {
                  const existing = sortedColumns.find(c => c.id === colId);
                  if (existing) {
                    finalSorted.push(existing);
                  }
                });
                
                // Add any columns not in columnOrder to the end
                sortedColumns.forEach(col => {
                  if (!orderMap.has(col.id)) {
                    finalSorted.push(col);
                  }
                });
                
                const sortedColumnsFinal = finalSorted.length > 0 ? finalSorted : sortedColumns;
                
                return sortedColumnsFinal.map((col) => {
                  const isDragging = draggedColumn === col.id;
                  const isDragOver = dragOverColumn === col.id;
                  
                  return (
                    <label
                      key={col.id}
                      className={`flex items-center gap-2 text-sm p-2 rounded transition-all duration-150 ${
                        isDragging 
                          ? 'opacity-30 bg-gray-100 cursor-grabbing' 
                          : isDragOver
                          ? 'bg-primary/10 border-2 border-primary border-dashed cursor-grabbing'
                          : 'hover:bg-gray-100 cursor-grab border-2 border-transparent'
                      }`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedColumn(col.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.dropEffect = 'move';
                        // Add a slight delay to improve drag responsiveness
                        setTimeout(() => {
                          e.dataTransfer.effectAllowed = 'move';
                        }, 0);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (draggedColumn && draggedColumn !== col.id) {
                          setDragOverColumn(col.id);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        if (draggedColumn && draggedColumn !== col.id) {
                          setDragOverColumn(col.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        // Only clear dragOver if we're actually leaving the element
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const x = e.clientX;
                        const y = e.clientY;
                        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                          setDragOverColumn(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverColumn(null);
                        
                        if (draggedColumn && draggedColumn !== col.id) {
                          // Create new order array for all modes
                          // Allow free reordering including for transfers
                          const newOrder = [...columnOrder];
                          const draggedIndex = newOrder.indexOf(draggedColumn);
                          const targetIndex = newOrder.indexOf(col.id);
                          
                          // Only proceed if both columns exist in the order
                          if (draggedIndex !== -1 && targetIndex !== -1) {
                            // Reorder: remove dragged column from its current position
                            newOrder.splice(draggedIndex, 1);
                            // Insert at target position (adjust index if dragging down)
                            const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
                            newOrder.splice(newTargetIndex, 0, draggedColumn);
                            
                            // Update column order
                            onColumnOrderChange(newOrder);
                          } else {
                            // Handle edge cases where columns aren't in order yet
                            if (targetIndex === -1 && draggedIndex === -1) {
                              // Neither is in order, add both
                              const updatedOrder = [...columnOrder, draggedColumn, col.id];
                              onColumnOrderChange(updatedOrder);
                            } else if (targetIndex !== -1 && draggedIndex === -1) {
                              // Target is in order, dragged is not - add dragged before target
                              const updatedOrder = [...columnOrder];
                              updatedOrder.splice(targetIndex, 0, draggedColumn);
                              onColumnOrderChange(updatedOrder);
                            } else if (targetIndex === -1 && draggedIndex !== -1) {
                              // Dragged is in order, target is not - move dragged to end and add target
                              const updatedOrder = [...columnOrder];
                              updatedOrder.splice(draggedIndex, 1);
                              updatedOrder.push(draggedColumn);
                              updatedOrder.push(col.id);
                              onColumnOrderChange(updatedOrder);
                            }
                          }
                        }
                        setDraggedColumn(null);
                      }}
                      onDragEnd={(e) => {
                        e.preventDefault();
                        setDraggedColumn(null);
                        setDragOverColumn(null);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.id)}
                        onChange={() => onToggleColumn(col.id)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        draggable={false}
                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="flex-1 text-gray-700 select-none">{col.label || col.id || 'Unnamed Column'}</span>
                      <div className="flex flex-col gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                        <svg
                          className="w-4 h-4 text-gray-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      </div>
                    </label>
                  );
                });
              })()}
                </div>
              </div>
            )}

            {/* Filters Tab */}
            {activeTab === 'filters' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-main">Filters</h3>
                  {onResetFilters && (
                    <button
                      onClick={onResetFilters}
                      className="text-xs text-primary hover:text-primary/80 underline"
                    >
                      Reset All
                    </button>
                  )}
                </div>
                <div className="space-y-2 overflow-x-hidden w-full" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
              {mode === 'transfers' ? (
                // For transfers, show Season, Transfer_Rank, and HS_Ranking
                (() => {
                  // Get filterable columns matching our criteria
                  const filterableCols = columns.filter(col => 
                    col.filterable && 
                    (col.id.toLowerCase().includes('season') || 
                     (col.id.toLowerCase().includes('transfer') && col.id.toLowerCase().includes('rank')) ||
                     (col.id.toLowerCase().includes('hs') && col.id.toLowerCase().includes('rank')))
                  );
                  
                  // Ensure we have the right columns in order: Season, Transfer Rank, HS Ranking
                  const orderedFilters: ColumnConfig[] = [];
                  
                  // Find Season
                  const seasonCol = filterableCols.find(col => col.id.toLowerCase().includes('season'));
                  if (seasonCol) orderedFilters.push(seasonCol);
                  
                  // Find Transfer Rank
                  const transferRankCol = filterableCols.find(col => 
                    col.id.toLowerCase().includes('transfer') && col.id.toLowerCase().includes('rank') &&
                    !col.id.toLowerCase().includes('hs')
                  );
                  if (transferRankCol) orderedFilters.push(transferRankCol);
                  
                  // Find HS Ranking
                  const hsRankingCol = filterableCols.find(col => 
                    col.id.toLowerCase().includes('hs') && col.id.toLowerCase().includes('rank')
                  );
                  if (hsRankingCol) orderedFilters.push(hsRankingCol);
                  
                  return orderedFilters.map((col) => (
                    <div key={col.id}>{renderFilter(col)}</div>
                  ));
                })()
              ) : mode === 'players' ? (
                // For players, show only specified filterable columns in order (without Name)
                (() => {
                  const playerFilterIds = [
                    'P_Rank', 'Conference', 'Position', 'Season', 'Class',
                    'GP', 'MIN', 'PTS', 'AST', 'REB', 'Off_Reb', 'Def_Reb', 'BLK', 'STL', 'TO',
                    'FG%', '3P%', 'FT%', 'TS%', 'OBPR', 'DBPR', 'BPR', 'POSS', 'USG%',
                    'Box_OBPR', 'Box_DBPR', 'Box_BPR', 'Team_PRPG',
                    'Adj_team_Off_Eff', 'Adj_team_Deff_Eff', 'Adj_team_Eff_Margn', 'Team_Net_Score'
                  ];
                  
                  const orderedFilters: ColumnConfig[] = [];
                  for (const colId of playerFilterIds) {
                    const found = columns.find(col => 
                      col.filterable && 
                      (col.id.toLowerCase() === colId.toLowerCase() || 
                       col.id.toLowerCase().replace(/_/g, '') === colId.toLowerCase().replace(/_/g, '') ||
                       col.id.toLowerCase().replace(/%/g, '') === colId.toLowerCase().replace(/%/g, ''))
                    );
                    if (found && !orderedFilters.some(f => f.id === found.id)) {
                      orderedFilters.push(found);
                    }
                  }
                  
                  return orderedFilters.map((col) => (
                    <div key={col.id}>{renderFilter(col)}</div>
                  ));
                })()
              ) : mode === 'teams' ? (
                // For teams, show only specified filterable columns in order
                (() => {
                  const teamFilterIds = [
                    'Team_Rank', 'Season', 'Conference', 'Team_Win%', 'Team_Q1_Wins', 'Team_Conf_Wins%', 'Team_Conf_Rank',
                    'NCAA_Seed', 'Team_GP', 'Team_PTS', 'Team_Reb', 'Team_Off_Reb', 'Team_Def_Reb', 'Team_BLK', 'Team_STL', 'Team_TO',
                    'Team_FG%', 'Team_3P%', 'Team_FT%', 'Team_Adj_Off_Eff', 'Team_Adj_Def_Eff',
                    'Team_OBPR', 'Team_DBPR', 'Team_BPR', 'Team_Adj_Tempo', 'Team_BARTHAG'
                  ];
                  
                  const orderedFilters: ColumnConfig[] = [];
                  for (const colId of teamFilterIds) {
                    const found = columns.find(col => {
                      if (!col.filterable) return false;
                      
                      // Special handling for Season column - check both ID and label
                      if (colId.toLowerCase() === 'season') {
                        return col.id.toLowerCase().includes('season') || 
                               col.label.toLowerCase().includes('season');
                      }
                      
                      // For other columns, use existing matching logic
                      return col.id.toLowerCase() === colId.toLowerCase() || 
                             col.id.toLowerCase().replace(/_/g, '') === colId.toLowerCase().replace(/_/g, '') ||
                             col.id.toLowerCase().replace(/%/g, '') === colId.toLowerCase().replace(/%/g, '');
                    });
                    if (found && !orderedFilters.some(f => f.id === found.id)) {
                      orderedFilters.push(found);
                    }
                  }
                  
                  return orderedFilters.map((col) => (
                    <div key={col.id}>{renderFilter(col)}</div>
                  ));
                })()
              ) : (
                // Fallback: show all filterable columns
                columns.filter(col => col.filterable).map((col) => (
                  <div key={col.id}>{renderFilter(col)}</div>
                ))
              )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

