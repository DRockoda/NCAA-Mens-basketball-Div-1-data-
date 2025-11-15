export type ColumnType = 'string' | 'number' | 'date' | 'categorical';

export type ColumnConfig = {
  id: string;       // object key from the dataset
  label: string;    // friendly label
  type: ColumnType;
  filterable?: boolean;
  searchable?: boolean; // include in autocomplete suggestions
  defaultVisible?: boolean;
};

// These will be auto-generated based on actual data, but we'll provide sensible defaults
// The actual columns will be inferred from the first row of data

export const teamColumns: ColumnConfig[] = [
  { id: 'TeamName', label: 'Team Name', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Conference', label: 'Conference', type: 'categorical', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'string', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Wins', label: 'Wins', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Losses', label: 'Losses', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'WinPercentage', label: 'Win %', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'PointsPerGame', label: 'Points/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'ReboundsPerGame', label: 'Rebounds/Game', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'AssistsPerGame', label: 'Assists/Game', type: 'number', filterable: true, searchable: false, defaultVisible: false },
];

export const playerColumns: ColumnConfig[] = [
  { id: 'PlayerName', label: 'Player Name', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Team', label: 'Team', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Position', label: 'Position', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'string', filterable: true, searchable: false, defaultVisible: true },
  { id: 'PointsPerGame', label: 'Points/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'ReboundsPerGame', label: 'Rebounds/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'AssistsPerGame', label: 'Assists/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'GamesPlayed', label: 'Games Played', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'MinutesPerGame', label: 'Minutes/Game', type: 'number', filterable: true, searchable: false, defaultVisible: false },
];

export const transferColumns: ColumnConfig[] = [
  { id: 'PlayerName', label: 'Player Name', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'FromSchool', label: 'From School', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'ToSchool', label: 'To School', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'string', filterable: true, searchable: false, defaultVisible: true },
  { id: 'TransferType', label: 'Transfer Type', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Date', label: 'Date', type: 'date', filterable: true, searchable: false, defaultVisible: false },
];

export function getColumnsForMode(mode: 'teams' | 'players' | 'transfers'): ColumnConfig[] {
  if (mode === 'teams') return teamColumns;
  if (mode === 'players') return playerColumns;
  return transferColumns;
}

// Auto-generate columns from actual data if they don't match
export function inferColumnsFromData(data: any[], mode: 'teams' | 'players' | 'transfers'): ColumnConfig[] {
  if (data.length === 0) {
    return getColumnsForMode(mode);
  }

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  
  return keys.map(key => {
    // Try to find existing config
    const existing = getColumnsForMode(mode).find(c => c.id === key);
    if (existing) return existing;

    // Infer type from first value
    const value = firstRow[key];
    let type: ColumnType = 'string';
    if (typeof value === 'number') {
      type = 'number';
    } else if (value && !isNaN(Date.parse(String(value)))) {
      type = 'date';
    } else {
      // Check if it's categorical (few unique values)
      const uniqueValues = new Set(data.slice(0, 100).map(row => String(row[key] || ''))).size;
      if (uniqueValues < 20 && uniqueValues < data.length / 10) {
        type = 'categorical';
      }
    }

    return {
      id: key,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim(),
      type,
      filterable: true,
      searchable: type === 'string' || type === 'categorical',
      defaultVisible: ['name', 'team', 'player', 'season', 'date'].some(term => key.toLowerCase().includes(term)),
    };
  });
}

