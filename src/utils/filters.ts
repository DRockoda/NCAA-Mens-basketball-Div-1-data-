import type { ColumnConfig } from '../config/columns';

export type StringFilter = { type: 'string'; value: string };
export type NumberFilter = { type: 'number'; min?: number; max?: number; operator?: '>' | '>=' | '<' | '<='; value?: number };
export type DateFilter = { type: 'date'; from?: string; to?: string };
export type CategoricalFilter = { type: 'categorical'; values: string[] };

export type Filter = StringFilter | NumberFilter | DateFilter | CategoricalFilter;
export type Filters = Record<string, Filter | undefined>;

export function applyFilters(
  data: any[],
  filters: Filters,
  searchTags: string[],
  columns: ColumnConfig[]
): any[] {
  const searchableCols = columns.filter(c => c.searchable);

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
        
        // Support operator-based filtering (>, >=, <, <=) with single value
        if (filter.operator && filter.value !== undefined) {
          const filterValue = filter.value;
          switch (filter.operator) {
            case '>':
              if (!(num > filterValue)) return false;
              break;
            case '>=':
              if (!(num >= filterValue)) return false;
              break;
            case '<':
              if (!(num < filterValue)) return false;
              break;
            case '<=':
              if (!(num <= filterValue)) return false;
              break;
          }
        } else {
          // Fallback to min/max range filtering
          if (filter.min !== undefined && num < filter.min) return false;
          if (filter.max !== undefined && num > filter.max) return false;
        }
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

    // Apply global search tags (across searchable columns)
    // A row must match ALL search tags (AND logic)
    if (searchTags.length > 0) {
      for (const tag of searchTags) {
        const q = tag.toLowerCase().trim();
        if (q) {
          const match = searchableCols.some(col => {
            const v = String(row[col.id] ?? '').toLowerCase();
            return v.includes(q);
          });
          if (!match) return false;
        }
      }
    }

    return true;
  });
}

