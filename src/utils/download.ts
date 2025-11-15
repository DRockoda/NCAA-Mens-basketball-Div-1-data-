import * as XLSX from 'xlsx';

function downloadFile(content: BlobPart, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(rows: any[], fileName: string) {
  if (rows.length === 0) {
    alert('No data to download');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        const value = row[header] ?? '';
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

export function downloadXLSX(rows: any[], fileName: string) {
  if (rows.length === 0) {
    alert('No data to download');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadFile(wbout, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `${fileName}.xlsx`);
}

