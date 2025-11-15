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

    // Try to load each sheet
    for (const [datasetName, sheetName] of Object.entries(SHEET_NAMES)) {
      const sheet = workbook.Sheets[sheetName];
      if (sheet) {
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        datasets[datasetName as DatasetName] = json as Row[];
        console.log(`Loaded sheet "${sheetName}" with ${json.length} rows`);
      } else {
        // If exact name doesn't match, try to find a similar sheet
        const sheetNames = workbook.SheetNames;
        const foundSheet = sheetNames.find(name => 
          name.toLowerCase().includes(sheetName.toLowerCase()) ||
          sheetName.toLowerCase().includes(name.toLowerCase())
        );
        if (foundSheet) {
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[foundSheet], { defval: '' });
          datasets[datasetName as DatasetName] = json as Row[];
          console.log(`Loaded sheet "${foundSheet}" (matched "${sheetName}") with ${json.length} rows`);
        } else {
          console.warn(`Sheet "${sheetName}" not found. Available sheets:`, sheetNames);
          // If no sheets match, try to use the first sheet(s) as fallback
          if (sheetNames.length > 0) {
            console.warn(`Using first available sheet "${sheetNames[0]}" as fallback for ${datasetName}`);
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { defval: '' });
            datasets[datasetName as DatasetName] = json as Row[];
          }
        }
      }
    }

    // Check if we got any data
    const totalRows = datasets.teams.length + datasets.players.length + datasets.transfers.length;
    if (totalRows === 0) {
      console.error('No data loaded from any sheet. Available sheets:', workbook.SheetNames);
      throw new Error(`No data found in Excel file. Available sheets: ${workbook.SheetNames.join(', ')}. Expected sheets: Teams, Players, Transfers`);
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

