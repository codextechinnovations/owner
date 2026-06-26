export const exportToCsv = (filename, headers, rows) => {
  if (!rows || rows.length === 0) return;

  const escapeCsv = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map((h) => (typeof h === 'string' ? h : h.label)).join(',');
  const keys = headers.map((h) => (typeof h === 'string' ? h : h.key));
  const dataRows = rows.map((row) => keys.map((key) => escapeCsv(typeof key === 'function' ? key(row) : row[key])).join(','));

  const csv = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
