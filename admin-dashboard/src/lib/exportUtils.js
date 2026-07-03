// Generic Excel/PDF export — every list page in the dashboard reuses these
// two functions instead of re-implementing export logic per entity.
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * @param {Array<Object>} rows - plain row objects, already flattened/formatted for display.
 * @param {string} fileName - without extension.
 */
export const exportToExcel = (rows, fileName = 'export') => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * @param {Array<{header: string, key: string}>} columns
 * @param {Array<Object>} rows
 * @param {string} fileName - without extension.
 * @param {string} title - document title printed at the top of the PDF.
 */
export const exportToPDF = (columns, rows, fileName = 'export', title = 'Export') => {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 21);

  autoTable(doc, {
    startY: 27,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? '')),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [26, 63, 184] },
    alternateRowStyles: { fillColor: [242, 244, 248] },
  });

  doc.save(`${fileName}.pdf`);
};
