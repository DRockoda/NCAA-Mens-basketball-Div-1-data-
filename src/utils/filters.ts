import type { ColumnConfig } from '../config/columns';

export type StringFilter = { type: 'string'; value: string };
export type NumberFilter = { type: 'number'; min?: number; max?: number };
export type DateFilter = { type: 'date'; from?: string; to?: string };
export type CategoricalFilter = { type: 'categorical'; values: string[] };

export type Filter = StringFilter | NumberFilter | DateFilter | CategoricalFilter;
export type Filters = Record<string, Filter | undefined>;

export function applyFilters(
  data: any[],
  filters: Filters,
  searchQuery: string,
  columns: ColumnConfig[]
): any[] {
  const searchableCols = columns.filter(c => c.searchable);
  const q = searchQuery.toLowerCase().trim();

  return data.filter(row => {
    // Apply column-specific filters
    for (const [colId, filter] of Object.entries(filters)) {
      if (!filter) continue;
      const value = row[colId];

      if (filter.type === 'string') {
        const filterValue = filter.value.toLowerCase().trim();
        if (filterValue && !String(value ?? '').toLowerCase().includes(filterValue)) {
          return false;
        }
      }

      if (filter.type === 'number') {
        const num = Number(value);
        if (!Number.isFinite(num)) return false;
        if (filter.min !== undefined && num < filter.min) return false;
        if (filter.max !== undefined && num > filter.max) return false;
      }

      if (filter.type === 'date') {
        if (!value) return false;
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        if (filter.from && date < new Date(filter.from)) return false;
        if (filter.to && date > new Date(filter.to)) return false;
      }

      if (filter.type === 'categorical') {
        if (filter.values.length > 0 && !filter.values.includes(String(value ?? ''))) {
          return false;
        }
      }
    }

    // Apply global search query (across searchable columns)
    if (q) {
      const match = searchableCols.some(col => {
        const v = String(row[col.id] ?? '').toLowerCase();
        return v.includes(q);
      });
      if (!match) return false;
    }

    return true;
  });
}

