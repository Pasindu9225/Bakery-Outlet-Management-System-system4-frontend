import * as XLSX from "xlsx";
import { logExport } from "../services/auditLog";

/**
 * Downloads an array of plain objects as an .xlsx file - keys become column headers.
 */
export function exportToExcel(rows, filename, sheetName = "Sheet1") {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const name = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, name);
    logExport(null, `Exported ${name} (Excel, ${rows.length} rows)`);
}

/** Sheet rows for a titled report: title, info lines, a blank row, then the table. */
export function reportSheetRows({ title, notes = [], headers, rows }) {
    return [[title], ...notes.filter(Boolean).map((note) => [note]), [], headers, ...rows];
}

/** Downloads a titled report (title and info lines above the table) as a real .xlsx file. */
export function exportReportToExcel({ title, notes, headers, rows, filename, sheetName = "Report" }) {
    const worksheet = XLSX.utils.aoa_to_sheet(reportSheetRows({ title, notes, headers, rows }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31)); // Excel's sheet-name limit
    const name = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, name);
    logExport(null, `Exported ${name} (Excel, ${rows.length} rows)`);
}
