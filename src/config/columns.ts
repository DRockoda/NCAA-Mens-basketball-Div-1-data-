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
  { id: 'Team_Name', label: 'Team Name', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'TeamName', label: 'Team Name', type: 'string', filterable: true, searchable: true, defaultVisible: false }, // Alternative column name
  { id: 'Conference', label: 'Conference', type: 'categorical', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Rank', label: 'Team Rank', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Win%', label: 'Win %', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Q1_Wins', label: 'Q1 Wins', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Conf_Wins%', label: 'Conf Win %', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Conf_Rank', label: 'Conf Rank', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  // Legacy column names for backward compatibility
  { id: 'Wins', label: 'Wins', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'Losses', label: 'Losses', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'WinPercentage', label: 'Win %', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'PointsPerGame', label: 'Points/Game', type: 'number', filterable: true, searchable: false, defaultVisible: false },
];

export const playerColumns: ColumnConfig[] = [
  { id: 'Name', label: 'Player Name', type: 'string', filterable: true, searchable: true, defaultVisible: true },
  { id: 'PlayerName', label: 'Player Name', type: 'string', filterable: true, searchable: true, defaultVisible: false }, // Alternative
  { id: 'Team', label: 'Team', type: 'categorical', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Position', label: 'Position', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'PointsPerGame', label: 'Points/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'ReboundsPerGame', label: 'Rebounds/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'AssistsPerGame', label: 'Assists/Game', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_PRPG', label: 'Team PRPG', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'Adj_team_Off_Eff', label: 'Adj Off Eff', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'Adj_team_Deff_Eff', label: 'Adj Def Eff', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'GamesPlayed', label: 'Games Played', type: 'number', filterable: true, searchable: false, defaultVisible: false },
  { id: 'MinutesPerGame', label: 'Minutes/Game', type: 'number', filterable: true, searchable: false, defaultVisible: false },
];

export const transferColumns: ColumnConfig[] = [
  { id: 'Season', label: 'Season', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Transfer_Rank', label: 'Transfer Rank', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Name', label: 'Name', type: 'string', filterable: false, searchable: true, defaultVisible: true },
  { id: 'Team', label: 'Team', type: 'string', filterable: false, searchable: false, defaultVisible: true },
  { id: 'New_Team', label: 'New Team', type: 'string', filterable: false, searchable: false, defaultVisible: true },
  { id: 'HS_Ranking', label: 'HS Ranking', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
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
  
  // Columns to exclude
  const excludedColumns = ['Player_ID', 'Team_ID', 'Sr. No', 'Sr.No', 'Sr No', 'SrNo', 'ID', 'id'];
  
  return keys
    .filter(key => {
      // Exclude unwanted columns
      const lowerKey = key.toLowerCase().trim();
      return !excludedColumns.some(excluded => 
        lowerKey === excluded.toLowerCase() || 
        lowerKey.includes('_id') && (lowerKey.includes('player') || lowerKey.includes('team'))
      );
    })
    .map(key => {
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

      // Check if it's Season (case-insensitive)
      const isSeason = key.toLowerCase().includes('season');
      if (isSeason) {
        return {
          id: key,
          label: 'Season',
          type: 'categorical' as ColumnType,
          filterable: true,
          searchable: false,
          defaultVisible: true,
        };
      }

      // Check if it's Name column (for players/transfers) - map to PlayerName
      if (key.toLowerCase() === 'name' && (mode === 'players' || mode === 'transfers')) {
        return {
          id: key, // Keep 'Name' as the actual column ID
          label: 'Player Name',
          type: 'string' as ColumnType,
          filterable: false, // Not filterable for transfers
          searchable: true,
          defaultVisible: true,
        };
      }

      // Check if it's Transfer Rank (case-insensitive variations) - now filterable
      const isTransferRank = key.toLowerCase().includes('transfer') && 
                            (key.toLowerCase().includes('rank') || key.toLowerCase().includes('_rank'));
      if (isTransferRank && mode === 'transfers') {
        return {
          id: key,
          label: 'Transfer Rank',
          type: 'categorical' as ColumnType,
          filterable: true, // Now filterable with dropdown 1-5
          searchable: false,
          defaultVisible: true,
        };
      }

      // Check if it's HS_Ranking
      const isHSRanking = key.toLowerCase().includes('hs') && key.toLowerCase().includes('rank');
      if (isHSRanking && mode === 'transfers') {
        return {
          id: key,
          label: 'HS Ranking',
          type: 'categorical' as ColumnType,
          filterable: true,
          searchable: false,
          defaultVisible: true,
        };
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

