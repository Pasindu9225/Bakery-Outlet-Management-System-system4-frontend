import React, { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { Download, FileSpreadsheet, Upload, X, CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import axiosInstance from "../services/api";
import { friendlyError } from "../utils/friendlyError";
import { exportToExcel } from "../utils/exportToExcel";

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * One entry per importable sheet. `sheet` is the tab name in the templates (public/templates);
 * `signature` are headings that identify the sheet when the tab was renamed or copied alone.
 */
export const IMPORT_TYPES = {
  "production-centres": { label: "Production Centres", sheet: "1 Production Centres", template: "Production Centres.xlsx", signature: ["production centre name", "type"] },
  suppliers: { label: "Suppliers", sheet: "2 Suppliers", template: "Suppliers.xlsx", signature: ["supplier name"] },
  "raw-materials": { label: "Raw Materials", sheet: "3 Raw Materials", template: "Raw Materials.xlsx", signature: ["item code", "material type (generic name)"] },
  products: { label: "Products", sheet: "4 Products", template: "Products.xlsx", signature: ["product code", "selling price (rs.)"] },
  bom: { label: "BOM (Recipes)", sheet: "5 BOM (Recipes)", template: "BOM (Recipes).xlsx", signature: ["product code", "ingredient code"] },
  users: { label: "Users", sheet: "Users", template: "Staff User Accounts.xlsx", signature: ["first name", "role", "email"] },
};

const norm = (s) => String(s ?? "").replace(/\*/g, "").trim().replace(/\s+/g, " ").toLowerCase();

/** The sheet for this import: the template's tab name, else the first tab whose headings carry the signature. */
export function pickSheet(workbook, type) {
  const cfg = IMPORT_TYPES[type];
  if (workbook.Sheets[cfg.sheet]) return cfg.sheet;
  return workbook.SheetNames.find((name) => {
    const [header = []] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" });
    const heads = header.map(norm);
    return cfg.signature.every((s) => heads.includes(s));
  });
}

/** The template's grey hint row: starts with ℹ (older copies: the first row holding an "e.g." example). */
const isHintRow = (first, index) =>
  first.startsWith("ℹ") || (index === 0 && (/\be\.g\./i.test(first) || /^code from the /i.test(first)));

/** Rows below the heading row as {heading: text, _row: excel row}; the hint row is left out. */
export function sheetRows(sheet) {
  const start = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]).s.r : 0;
  const all = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", blankrows: true });
  const [header = [], ...body] = all;
  const out = [];
  body.forEach((cells, i) => {
    if (isHintRow(String(cells[0] ?? "").trim(), i)) return;
    if (cells.every((c) => String(c).trim() === "")) return;
    const row = { _row: start + i + 2 };
    header.forEach((h, c) => {
      if (String(h).trim()) row[String(h).trim()] = String(cells[c] ?? "").trim();
    });
    out.push(row);
  });
  return out;
}

const STATUS = {
  OK: { label: "Ready", cls: "bg-success/10 text-success border-success/30", Icon: CheckCircle2 },
  SKIP: { label: "Already exists", cls: "bg-hover text-fg-secondary border-line", Icon: MinusCircle },
  ERROR: { label: "Problem", cls: "bg-error/10 text-error border-error/30", Icon: AlertTriangle },
};

/**
 * "Download template" + "Upload Excel" buttons for one master-data page. The upload is checked by the
 * server first (nothing saved), shown row by row, and saved - all rows or none - only when every row is fine.
 */
export default function ExcelImport({ type, onImported, note }) {
  const cfg = IMPORT_TYPES[type];
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [onlyProblems, setOnlyProblems] = useState(false);

  const reset = () => {
    setFileName("");
    setRows(null);
    setResult(null);
    setError(null);
    setOnlyProblems(false);
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    reset();
  };

  const check = async (file) => {
    reset();   // keeps the chosen file in the picker so the Admin sees which file was checked
    if (!file) return;
    setFileName(file.name);
    if (!/\.xlsx$/i.test(file.name)) return setError("Please choose an Excel file (.xlsx) made from the template.");
    if (file.size > MAX_BYTES) return setError("The file is larger than 2 MB. Split it into smaller files.");
    setBusy(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = pickSheet(workbook, type);
      if (!sheetName) {
        setError(`No "${cfg.label}" sheet found in this file. Use the ${cfg.label} template without changing the column headings.`);
        return;
      }
      const data = sheetRows(workbook.Sheets[sheetName]);
      setRows(data);
      const res = await axiosInstance.post(`/api/v1/admin/import/${type}?commit=false`, { fileName: file.name, rows: data });
      setResult(res.data);
      setOnlyProblems(res.data.errors > 0);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Could not read or check the file" }));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await axiosInstance.post(`/api/v1/admin/import/${type}?commit=true`, { fileName, rows });
      if (!res.data.committed) {
        // something changed since the check (e.g. another Admin added the same code): show the new findings
        setResult(res.data);
        setOnlyProblems(true);
        setError("Nothing was saved. Please look at the rows marked Problem.");
        return;
      }
      toast.success(`${res.data.created} ${res.data.created === 1 ? "row" : "rows"} imported to ${cfg.label}.`);
      setOpen(false);
      reset();
      onImported?.(res.data);
    } catch (err) {
      setError(friendlyError(err, { fallback: "Import failed. Nothing was saved." }));
    } finally {
      setBusy(false);
    }
  };

  const downloadProblems = () => {
    exportToExcel(
      result.rows.filter((r) => r.status !== "OK").map((r) => ({
        "Excel row": r.row,
        Item: r.label,
        Status: STATUS[r.status]?.label || r.status,
        Details: (r.messages || []).join("; "),
      })),
      `${cfg.label} - import problems`,
      "Problems"
    );
  };

  const canSave = result && !result.fileErrors?.length && result.errors === 0 && result.ok > 0 && !busy;
  const shown = result ? result.rows.filter((r) => !onlyProblems || r.status !== "OK") : [];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <a
          href={`${process.env.PUBLIC_URL || ""}/templates/${encodeURIComponent(cfg.template)}`}
          download={cfg.template}
          className="inline-flex items-center gap-2 px-3 py-2 border border-line rounded-lg text-[13px] font-[500] text-fg-secondary bg-surface hover:bg-subtle"
        >
          <Download size={15} /> Download template
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 border border-success/30 rounded-lg text-[13px] font-[500] text-success bg-success/10 hover:bg-success/20"
        >
          <Upload size={15} /> Upload Excel
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100000] bg-backdrop flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Import ${cfg.label}`}>
          <div className="bg-elevated rounded-2xl shadow-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between p-5 border-b border-line">
              <div>
                <h3 className="text-[18px] font-[700] text-fg-strong flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-success" /> Import {cfg.label} from Excel
                </h3>
                <p className="text-[13px] text-fg-secondary">
                  Rows are checked first. Nothing is saved until every row is fine and you press Import.
                  Items already in the system are skipped, never changed.
                </p>
              </div>
              <button aria-label="Close" onClick={close} className="p-1 text-fg-muted hover:text-fg"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <label className="block">
                <span className="block text-[12px] font-[600] text-fg mb-1">Excel file (.xlsx, up to 2 MB)</span>
                <input
                  onClick={(e) => { e.target.value = ""; }}  // choosing the same file again re-checks it
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={busy}
                  onChange={(e) => check(e.target.files?.[0])}
                  className="block w-full text-[13px] text-fg file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border file:border-line file:bg-surface file:text-fg"
                />
              </label>
              {note && <p className="text-[12px] text-fg-secondary bg-subtle border border-line rounded-lg p-3">{note}</p>}
              {busy && <p className="text-[13px] text-fg-secondary">Working…</p>}
              {error && <p className="text-[13px] text-error bg-error/10 border border-error/30 rounded-lg p-3">{error}</p>}

              {result && (
                <>
                  {result.fileErrors?.length > 0 && (
                    <ul className="text-[13px] text-error bg-error/10 border border-error/30 rounded-lg p-3 list-disc pl-6 space-y-1">
                      {result.fileErrors.map((m) => <li key={m}>{m}</li>)}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="px-2.5 py-1 rounded-full border bg-subtle border-line text-fg">{result.total} rows</span>
                    <span className={`px-2.5 py-1 rounded-full border ${STATUS.OK.cls}`}>{result.ok} ready</span>
                    <span className={`px-2.5 py-1 rounded-full border ${STATUS.SKIP.cls}`}>{result.skipped} already exist</span>
                    <span className={`px-2.5 py-1 rounded-full border ${STATUS.ERROR.cls}`}>{result.errors} with problems</span>
                    <label className="ml-auto inline-flex items-center gap-2 text-fg-secondary">
                      <input type="checkbox" checked={onlyProblems} onChange={(e) => setOnlyProblems(e.target.checked)} />
                      Show only rows that are not ready
                    </label>
                  </div>
                  {result.errors > 0 && (
                    <p className="text-[13px] text-error">
                      Fix the rows marked Problem in the Excel file and upload it again. Nothing has been saved.
                    </p>
                  )}
                  <div className="border border-line rounded-lg overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead className="bg-subtle text-left text-fg-secondary">
                        <tr>
                          <th className="px-3 py-2 w-[70px]">Row</th>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 w-[140px]">Status</th>
                          <th className="px-3 py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.length === 0 && (
                          <tr><td colSpan={4} className="px-3 py-4 text-center text-fg-secondary">No rows to show.</td></tr>
                        )}
                        {shown.map((r) => {
                          const s = STATUS[r.status] || STATUS.ERROR;
                          return (
                            <tr key={`${r.row}-${r.label}`} className="border-t border-line align-top">
                              <td className="px-3 py-2 text-fg-secondary">{r.row}</td>
                              <td className="px-3 py-2 text-fg">{r.label}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[12px] font-[600] ${s.cls}`}>
                                  <s.Icon size={12} /> {s.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-fg-secondary">
                                {(r.messages || []).map((m) => <div key={m}>{m}</div>)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3 p-5 border-t border-line">
              {result && result.rows.some((r) => r.status !== "OK") && (
                <button onClick={downloadProblems} className="px-4 py-2.5 bg-surface border border-line-strong text-fg rounded-lg text-[14px] font-[600]">
                  Download problem list
                </button>
              )}
              <div className="flex-1" />
              <button onClick={close} disabled={busy} className="px-4 py-2.5 bg-surface border border-line-strong text-fg rounded-lg text-[14px] font-[600]">Cancel</button>
              <button onClick={save} disabled={!canSave}
                className="px-4 py-2.5 bg-brand text-on-brand rounded-lg text-[14px] font-[600] disabled:opacity-50">
                {busy && result ? "Importing…" : `Import ${result?.ok || 0} row${result?.ok === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
