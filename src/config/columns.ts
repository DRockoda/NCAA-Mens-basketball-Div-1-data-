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
  { id: 'Team_Rank', label: 'Team_Rank', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Name', label: 'Team_Name', type: 'categorical', filterable: false, searchable: true, defaultVisible: true },
  { id: 'Conference', label: 'Conference', type: 'categorical', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Win%', label: 'Team_Win%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Q1_Wins', label: 'Team_Q1_Wins', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Conf_Wins%', label: 'Team_Conf_Wins%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Conf_Rank', label: 'Team_Conf_Rank', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'NCAA_Seed', label: 'NCAA_Seed', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_GP', label: 'Team_GP', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_PTS', label: 'Team_PTS', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Reb', label: 'Team_Reb', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Off_Reb', label: 'Team_Off_Reb', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Def_Reb', label: 'Team_Def_Reb', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_BLK', label: 'Team_BLK', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_STL', label: 'Team_STL', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_TO', label: 'Team_TO', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_FG%', label: 'Team_FG%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_3P%', label: 'Team_3P%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_FT%', label: 'Team_FT%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Adj_Off_Eff', label: 'Team_Adj_Off_Eff', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Adj_Def_Eff', label: 'Team_Adj_Def_Eff', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_OBPR', label: 'Team_OBPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_DBPR', label: 'Team_DBPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_BPR', label: 'Team_BPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Adj_Tempo', label: 'Team_Adj_Tempo', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_BARTHAG', label: 'Team_BARTHAG', type: 'number', filterable: true, searchable: false, defaultVisible: true },
];

export const playerColumns: ColumnConfig[] = [
  { id: 'P_Rank', label: 'P_Rank', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Name', label: 'Name', type: 'string', filterable: false, searchable: true, defaultVisible: true },
  { id: 'Team', label: 'Team', type: 'categorical', filterable: false, searchable: true, defaultVisible: true },
  { id: 'Conference', label: 'Conference', type: 'categorical', filterable: true, searchable: true, defaultVisible: true },
  { id: 'Hometown', label: 'Hometown', type: 'string', filterable: false, searchable: false, defaultVisible: true },
  { id: 'Height', label: 'Height', type: 'string', filterable: false, searchable: false, defaultVisible: true },
  { id: 'Position', label: 'Position', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Season', label: 'Season', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Class', label: 'Class', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'GP', label: 'GP', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'MIN', label: 'MIN', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'PTS', label: 'PTS', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'AST', label: 'AST', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'REB', label: 'REB', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Off_Reb', label: 'Off_Reb', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Def_Reb', label: 'Def_Reb', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'BLK', label: 'BLK', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'STL', label: 'STL', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'TO', label: 'TO', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'FG%', label: 'FG%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: '3P%', label: '3P%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'FT%', label: 'FT%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'TS%', label: 'TS%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'OBPR', label: 'OBPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'DBPR', label: 'DBPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'BPR', label: 'BPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'POSS', label: 'POSS', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'USG%', label: 'USG%', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Box_OBPR', label: 'Box_OBPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Box_DBPR', label: 'Box_DBPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Box_BPR', label: 'Box_BPR', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_PRPG', label: 'Team_PRPG', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Adj_team_Off_Eff', label: 'Adj_team_Off_Eff', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Adj_team_Deff_Eff', label: 'Adj_team_Deff_Eff', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Adj_team_Eff_Margn', label: 'Adj_team_Eff_Margn', type: 'number', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Team_Net_Score', label: 'Team_Net_Score', type: 'number', filterable: true, searchable: false, defaultVisible: true },
];

export const transferColumns: ColumnConfig[] = [
  { id: 'Season', label: 'Season', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Transfer_Rank', label: 'TransferRank', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
  { id: 'Name', label: 'Name', type: 'string', filterable: false, searchable: true, defaultVisible: true },
  { id: 'Team', label: 'Team', type: 'string', filterable: false, searchable: false, defaultVisible: true },
  { id: 'New_Team', label: 'NewTeam', type: 'string', filterable: false, searchable: false, defaultVisible: true },
  { id: 'HS_Ranking', label: 'HSRanking', type: 'categorical', filterable: true, searchable: false, defaultVisible: true },
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

      // Check if it's Name column (for players/transfers)
      if (key.toLowerCase() === 'name' && (mode === 'players' || mode === 'transfers')) {
        return {
          id: key, // Keep 'Name' as the actual column ID
          label: mode === 'players' ? 'Name' : 'Name', // Use 'Name' label for players and transfers
          type: 'string' as ColumnType,
          filterable: mode === 'players', // Filterable for players, not for transfers
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
          label: 'TransferRank',
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
          label: 'HSRanking',
          type: 'categorical' as ColumnType,
          filterable: true,
          searchable: false,
          defaultVisible: true,
        };
      }

      return {
        id: key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim().replace(/\s+/g, ''),
        type,
        filterable: true,
        searchable: type === 'string' || type === 'categorical',
        defaultVisible: ['name', 'team', 'player', 'season', 'date'].some(term => key.toLowerCase().includes(term)),
      };
    });
}

