import * as XLSX from 'xlsx';
import type { ColumnConfig } from '../config/columns';

function downloadFile(content: BlobPart, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(rows: any[], fileName: string, visibleColumns?: string[], columns?: ColumnConfig[]) {
  if (rows.length === 0) {
    alert('No data to download');
    return;
  }

  // Use visible columns if provided, otherwise use all columns
  const columnIds = visibleColumns && visibleColumns.length > 0 
    ? visibleColumns 
    : Object.keys(rows[0]);
  
  // Map column IDs to labels for headers
  const headerLabels = columnIds.map(colId => {
    if (columns) {
      const col = columns.find(c => c.id === colId);
      return col ? col.label : colId;
    }
    return colId;
  });
  
  // Filter rows to only include visible columns
  const filteredRows = rows.map(row => {
    const filteredRow: any = {};
    columnIds.forEach(colId => {
      filteredRow[colId] = row[colId];
    });
    return filteredRow;
  });

  const csvRows = [
    headerLabels.join(','),
    ...filteredRows.map(row =>
      columnIds.map(colId => {
        const value = row[colId] ?? '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, 'text/csv', `${fileName}.csv`);
}

export function downloadXLSX(rows: any[], fileName: string, visibleColumns?: string[], columns?: ColumnConfig[]) {
  if (rows.length === 0) {
    alert('No data to download');
    return;
  }

  // Use visible columns if provided, otherwise use all columns
  const columnIds = visibleColumns && visibleColumns.length > 0 
    ? visibleColumns 
    : Object.keys(rows[0]);
  
  // Map column IDs to labels for headers
  const headerLabels = columnIds.map(colId => {
    if (columns) {
      const col = columns.find(c => c.id === colId);
      return col ? col.label : colId;
    }
    return colId;
  });
  
  // Filter rows to only include visible columns, using column IDs as keys
  const filteredRows = rows.map(row => {
    const filteredRow: any = {};
    columnIds.forEach(colId => {
      filteredRow[colId] = row[colId];
    });
    return filteredRow;
  });

  // Create worksheet with filtered rows
  const worksheet = XLSX.utils.json_to_sheet(filteredRows);
  
  // Update headers to use labels instead of column IDs
  if (worksheet['!ref']) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    headerLabels.forEach((label, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].v = label;
        worksheet[cellAddress].w = label;
      }
    });
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `${fileName}.xlsx`);
}

