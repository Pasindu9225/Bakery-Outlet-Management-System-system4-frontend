// Company details printed on bills, documents and PDF exports. Set them in this frontend's .env
// (REACT_APP_COMPANY_NAME, _ADDRESS, _PHONE, _VAT_NO, _TIN) and rebuild; an empty one is simply not printed.
export const companyInfo = {
  name: (process.env.REACT_APP_COMPANY_NAME || "").trim() || "Bakery Management System",
  address: (process.env.REACT_APP_COMPANY_ADDRESS || "").trim(),
  phone: (process.env.REACT_APP_COMPANY_PHONE || "").trim(),
  vatNo: (process.env.REACT_APP_COMPANY_VAT_NO || "").trim(),
  tin: (process.env.REACT_APP_COMPANY_TIN || "").trim(),
};

/** Address, phone, VAT and TIN lines, in print order, leaving out the ones that are not set. */
export const companyDetailLines = (info = companyInfo) =>
  [info.address, info.phone && `Tel: ${info.phone}`, info.vatNo && `VAT No: ${info.vatNo}`, info.tin && `TIN: ${info.tin}`]
    .filter(Boolean);

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Receipt header for bills printed as HTML text (e.g. special orders): company, outlet, then details. */
export const receiptHeaderHtml = (outlet = {}, info = companyInfo) => {
  const line = (text, style) => `<div style="${style}">${escapeHtml(text)}</div>`;
  return [
    line(info.name.toUpperCase(), "font-size: 16px; font-weight: bold;"),
    outlet.name ? line(outlet.name.toUpperCase(), "font-size: 12px;") : "",
    outlet.address ? line(outlet.address, "font-size: 11px;") : "",
    ...companyDetailLines(info).map((text) => line(text, "font-size: 11px;")),
  ].join("");
};
