import * as XLSX from 'xlsx';

export type DatasetName = 'teams' | 'players' | 'transfers';

export type Row = Record<string, any>;

export interface Datasets {
  teams: Row[];
  players: Row[];
  transfers: Row[];
}

const EXCEL_FILE_PATH = '/data/NCAA Mens basketball Data (2).xlsx';

// Map dataset names to Excel sheet names
const SHEET_NAMES: Record<DatasetName, string> = {
  teams: 'Teams',
  players: 'Players',
  transfers: 'Transfers',
};

let cachedDatasets: Datasets | null = null;

export async function loadAllDatasets(): Promise<Datasets> {
  if (cachedDatasets) {
    return cachedDatasets;
  }

  try {
    const response = await fetch(EXCEL_FILE_PATH);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}. Make sure the file is at ${EXCEL_FILE_PATH}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Log all available sheets for debugging
    console.log('Available sheets in Excel file:', workbook.SheetNames);

    const datasets: Datasets = {
      teams: [],
      players: [],
      transfers: [],
    };

    // Define keywords to match sheets for each dataset type
    const sheetKeywords: Record<DatasetName, string[]> = {
      teams: ['team', 'teams'],
      players: ['player', 'players'],
      transfers: ['transfer', 'transfers'],
    };

    // For each dataset type, find and merge ALL matching sheets
    for (const datasetName of ['teams', 'players', 'transfers'] as DatasetName[]) {
      const keywords = sheetKeywords[datasetName];
      const matchingSheets: string[] = [];

      // Find all sheets that match the keywords for this dataset type
      for (const sheetName of workbook.SheetNames) {
        const lowerSheetName = sheetName.toLowerCase();
        const matches = keywords.some(keyword => lowerSheetName.includes(keyword));
        
        // For transfers, be more strict to avoid matching player sheets
        if (datasetName === 'transfers') {
          // Transfer sheets should contain "transfer" but NOT "player"
          if (matches && !lowerSheetName.includes('player')) {
            matchingSheets.push(sheetName);
          }
        } else if (matches) {
          matchingSheets.push(sheetName);
        }
      }

      // If no matches found, try exact name match
      if (matchingSheets.length === 0) {
        const exactMatch = workbook.SheetNames.find(name => 
          name.toLowerCase() === SHEET_NAMES[datasetName].toLowerCase()
        );
        if (exactMatch) {
          matchingSheets.push(exactMatch);
        }
      }

      // Merge all matching sheets
      if (matchingSheets.length > 0) {
        const allRows: Row[] = [];
        for (const sheetName of matchingSheets) {
          const sheet = workbook.Sheets[sheetName];
          if (sheet) {
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Row[];
            allRows.push(...json);
            console.log(`Loaded sheet "${sheetName}" with ${json.length} rows for ${datasetName}`);
          }
        }
        datasets[datasetName] = allRows;
        console.log(`Total ${datasetName} rows after merging: ${allRows.length}`);
      } else {
        console.warn(`No sheets found for ${datasetName}. Available sheets:`, workbook.SheetNames);
      }
    }

    // Check if we got any data
    const totalRows = datasets.teams.length + datasets.players.length + datasets.transfers.length;
    if (totalRows === 0) {
      console.error('No data loaded from any sheet. Available sheets:', workbook.SheetNames);
      throw new Error(`No data found in Excel file. Available sheets: ${workbook.SheetNames.join(', ')}. Expected sheets containing: Teams, Players, Transfers`);
    }

    cachedDatasets = datasets;
    return datasets;
  } catch (error) {
    console.error('Error loading datasets:', error);
    throw error;
  }
}

export function getDataset(datasets: Datasets, name: DatasetName): Row[] {
  return datasets[name] || [];
}

