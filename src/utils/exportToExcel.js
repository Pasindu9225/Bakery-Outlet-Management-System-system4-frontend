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
