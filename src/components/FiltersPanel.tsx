import { useState } from 'react';
import type { ColumnConfig } from '../config/columns';
import type { Filter, Filters } from '../utils/filters';

interface FiltersPanelProps {
  columns: ColumnConfig[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
  filters: Filters;
  onFilterChange: (columnId: string, filter: Filter | undefined) => void;
  data: any[];
}

export function FiltersPanel({
  columns,
  visibleColumns,
  onToggleColumn,
  filters,
  onFilterChange,
  data,
}: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getDistinctValues = (columnId: string, maxValues = 50): string[] => {
    const values = new Set<string>();
    for (const row of data) {
      const value = String(row[columnId] ?? '').trim();
      if (value) values.add(value);
      if (values.size >= maxValues) break;
    }
    return Array.from(values).sort();
  };

  const renderFilter = (col: ColumnConfig) => {
    if (!col.filterable) return null;

    const currentFilter = filters[col.id];

    if (col.type === 'string') {
      const stringFilter = currentFilter as { type: 'string'; value: string } | undefined;
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {col.label}
          </label>
          <input
            type="text"
            value={stringFilter?.value || ''}
            onChange={(e) =>
              onFilterChange(col.id, e.target.value ? { type: 'string', value: e.target.value } : undefined)
            }
            placeholder={`Filter ${col.label}...`}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      );
    }

    if (col.type === 'number') {
      const numberFilter = currentFilter as { type: 'number'; min?: number; max?: number } | undefined;
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      );
    }

    if (col.type === 'categorical') {
      const categoricalFilter = currentFilter as { type: 'categorical'; values: string[] } | undefined;
      const distinctValues = getDistinctValues(col.id);
      const isMultiSelect = distinctValues.length <= 20;

      if (isMultiSelect) {
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label}
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2 space-y-1">
              {distinctValues.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={categoricalFilter?.values?.includes(value) || false}
                    onChange={(e) => {
                      const currentValues = categoricalFilter?.values || [];
                      const newValues = e.target.checked
                        ? [...currentValues, value]
                        : currentValues.filter(v => v !== value);
                      onFilterChange(col.id, newValues.length > 0 ? { type: 'categorical', values: newValues } : undefined);
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">{value}</span>
                </label>
              ))}
            </div>
          </div>
        );
      } else {
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {col.label}
            </label>
            <input
              type="text"
              value={categoricalFilter?.values?.[0] || ''}
              onChange={(e) =>
                onFilterChange(col.id, e.target.value ? { type: 'categorical', values: [e.target.value] } : undefined)
              }
              placeholder={`Filter ${col.label}...`}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 font-semibold text-text-main"
      >
        <span>Filters & Columns</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Column Selection */}
          <div>
            <h3 className="font-medium text-text-main mb-2">Visible Columns</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {columns.map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.id)}
                    onChange={() => onToggleColumn(col.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-text-main mb-2">Filters</h3>
            <div className="space-y-2">
              {columns.filter(col => col.filterable).map((col) => (
                <div key={col.id}>{renderFilter(col)}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

