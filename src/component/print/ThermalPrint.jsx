import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { companyInfo, companyDetailLines } from "../../utils/companyInfo";

/*
 * The one layout for everything printed on the 80 mm thermal printer: customer bills (tax invoice, proforma,
 * delivery copies, table / waiter bills, return receipt, special-order receipts) and KOT slips.
 * Inline styles only, so a slip looks the same printed from a page or from a pop-up window (printHtml).
 */

const FONT = "'Courier New', Courier, monospace";
const S = {
  slip: { fontFamily: FONT, fontSize: 11, lineHeight: 1.4, color: "#000", background: "#fff" },
  center: { textAlign: "center" },
  company: { textAlign: "center", fontWeight: 700, fontSize: 14 },
  small: { textAlign: "center", fontSize: 10 },
  title: { textAlign: "center", fontWeight: 700, fontSize: 12, margin: "4px 0" },
  rule: { borderTop: "1px dashed #000", margin: "6px 0" },
  row: { display: "flex", justifyContent: "space-between", gap: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 11 },
  th: { textAlign: "left", fontWeight: 700, paddingBottom: 2, borderBottom: "1px dashed #000" },
  heading: { fontWeight: 700, fontSize: 10, margin: "4px 0 2px" },
  footer: { textAlign: "center", fontSize: 10, fontStyle: "italic", marginTop: 4 },
  kotItem: { border: "1px dashed #000", borderRadius: 4, padding: "6px 8px", margin: "6px 0", fontWeight: 700, fontSize: 13 },
  credit: { textAlign: "center", fontSize: 9, marginTop: 6 },
  pageBreak: { pageBreakBefore: "always", breakBefore: "page", borderTop: "1px dashed #000", marginTop: 12, paddingTop: 12 },
};

/** Printed at the bottom of every bill. */
export const DEVELOPER_CREDIT = "Developed by - plover.lk | 077 990 98 96";

export const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const printedAt = (d = new Date()) => `${d.toLocaleDateString()} Time: ${d.toLocaleTimeString()}`;

/** Company name, then the outlet and its address, then address / phone / VAT / TIN from the settings. */
export function SlipHeader({ outlet = {} }) {
  return (
    <div>
      <div style={S.company}>{companyInfo.name.toUpperCase()}</div>
      {outlet.name && <div style={S.small}>{outlet.name.toUpperCase()}</div>}
      {outlet.address && <div style={S.small}>{outlet.address}</div>}
      {companyDetailLines().map((line) => <div key={line} style={S.small}>{line}</div>)}
    </div>
  );
}

const Rule = () => <div style={S.rule} />;

/** "Label: value" lines; entries without a value are left out. */
function InfoLines({ info }) {
  return info.filter(([, value]) => value !== undefined && value !== null && value !== "").map(([label, value]) => (
    <div key={label}>{label}: {value}</div>
  ));
}

function ItemTable({ items, amountLabel }) {
  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.th}>Item</th>
          <th style={{ ...S.th, textAlign: "center", width: "12%" }}>Qty</th>
          <th style={{ ...S.th, textAlign: "right", width: "36%" }}>{amountLabel}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td style={{ paddingTop: 2, wordBreak: "break-word" }}>{item.name}</td>
            <td style={{ paddingTop: 2, textAlign: "center" }}>{item.qty}</td>
            <td style={{ paddingTop: 2, textAlign: "right", whiteSpace: "nowrap" }}>{money(item.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * A customer bill.
 *  info:     [[label, value]] under the title (date, bill number, cashier ...)
 *  sections: [{ heading?, items: [{ name, qty, amount }] }]
 *  totals:   [{ label, value, bold?, rule? }]
 *  footer:   lines at the bottom
 */
export function BillSlip({ outlet, title, info = [], sections = [], amountLabel = "Price", totals = [], footer = [] }) {
  return (
    <div style={S.slip}>
      <SlipHeader outlet={outlet} />
      <Rule />
      <div style={S.title}>{title}</div>
      <InfoLines info={info} />
      {sections.map((section, i) => (
        <div key={i}>
          <Rule />
          {section.heading && <div style={S.heading}>{section.heading}</div>}
          <ItemTable items={section.items} amountLabel={amountLabel} />
        </div>
      ))}
      <Rule />
      {totals.map((t) => (
        <div key={t.label} style={{ ...S.row, fontWeight: t.bold ? 700 : 400, ...(t.rule ? { borderTop: "1px dashed #000", paddingTop: 3, marginTop: 3 } : {}) }}>
          <span>{t.label}</span><span>{typeof t.value === "number" ? money(t.value) : t.value}</span>
        </div>
      ))}
      <Rule />
      {footer.map((line) => <div key={line} style={S.footer}>{line}</div>)}
      <div style={S.credit}>{DEVELOPER_CREDIT}</div>
    </div>
  );
}

/** A kitchen order ticket: one slip per item, always the same fields in the same order. */
export function KotSlip({ outlet = {}, index = 0, count = 1, info = [], item }) {
  return (
    <div style={S.slip}>
      <div style={{ ...S.title, fontSize: 13 }}>KITCHEN ORDER TICKET (KOT)</div>
      <div style={{ ...S.small, fontWeight: 700 }}>SLIP #{index + 1} OF {count}</div>
      {outlet.name && <div style={S.small}>{outlet.name.toUpperCase()}</div>}
      <Rule />
      <InfoLines info={info} />
      <Rule />
      <div style={S.kotItem}>
        <div>KOT ITEM: {item.name}</div>
        <div style={{ marginTop: 2 }}>QTY: {item.qty}</div>
        {item.note && <div style={{ fontSize: 11, fontWeight: 400, fontStyle: "italic", marginTop: 2 }}>Note: {item.note}</div>}
      </div>
      <Rule />
      <div style={{ ...S.footer, fontWeight: 700 }}>* PLEASE PREPARE KOT ITEM IMMEDIATELY *</div>
    </div>
  );
}

/** Starts the next slip on a new piece of paper. */
export const PageBreak = ({ children }) => <div style={S.pageBreak}>{children}</div>;

/** Hidden on screen; when the page is printed only this block is printed, 80 mm wide. */
export function PrintArea({ id, children }) {
  return (
    <div id={id} className="hidden print:block" style={{ background: "#fff" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #${id}, #${id} * { visibility: visible !important; }
          #${id} { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 3mm !important; }
        }` }} />
      {children}
    </div>
  );
}

/** Opens a slip in its own window and prints it (used where the page itself cannot be printed). */
export function printInWindow(element, title) {
  const html = renderToStaticMarkup(element);
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(`<html><head><title>${title}</title><style>
    @page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 3mm; width: 74mm; background: #fff; }
    </style></head><body>${html}<script>window.onload = function () { window.print(); window.close(); }</script></body></html>`);
  win.document.close();
  return true;
}

// ---------------------------------------------------------------- POS bills and KOTs

const lineItems = (items = []) => items.map((item) => ({
  name: item.productName || item.name,
  qty: item.qty ?? item.quantity,
  amount: (item.unitPrice ?? item.price ?? 0) * (item.qty ?? item.quantity ?? 0),
}));

/** Totals block of a POS bill; a tax line appears when the total includes tax. */
export function posTotals({ subTotal = 0, discount = 0, finalTotal = 0 }) {
  const tax = finalTotal - (subTotal - (discount || 0));
  const taxed = subTotal - (discount || 0);
  return [
    { label: "Subtotal:", value: subTotal, bold: true },
    ...(discount > 0 ? [{ label: "Discount:", value: `- ${money(discount)}` }] : []),
    ...(tax > 0.005 ? [{ label: `Tax (${taxed > 0 ? Math.round((tax / taxed) * 100) : 0}%):`, value: tax }] : []),
    { label: "Total:", value: finalTotal, bold: true, rule: true },
  ];
}

/**
 * Everything a POS screen prints for one sale (the shape used by POS Sales, Table Billing and Waiter Billing):
 * the bill (twice for Uber / PickMe: customer and delivery copy) followed by one KOT slip per kitchen item.
 */
export function PosPrintout({ printData, outlet = {}, id = "print-receipt" }) {
  const when = printedAt();
  const proforma = printData.type === "PROFORMA";
  const copies = printData.printBill === false ? [] : printData.isUberOrPickMe ? ["CUSTOMER COPY", "DELIVERY COPY"] : [null];
  const kots = printData.kotItems || [];
  const slips = [
    ...copies.map((copy) => (
      <BillSlip
        outlet={outlet}
        title={proforma ? "PROFORMA INVOICE (UNPAID)" : copy ? `TAX INVOICE (${copy})` : "TAX INVOICE"}
        info={[
          ["Date", when],
          ["Bill ID", printData.transactionId],
          ["Table", printData.tableName],
          ["Waiter", printData.waiterName],
          ["Cashier", printData.cashierName],
          ["Payment", printData.paymentMethod],
          ["Channel", printData.deliveryOption],
        ]}
        sections={[{ items: lineItems(printData.items) }]}
        totals={posTotals(printData)}
        footer={proforma ? ["THIS IS A PROFORMA INVOICE.", "PLEASE SETTLE AT CASHIER TO GET THE TAX INVOICE."] : ["THANK YOU! COME AGAIN."]}
      />
    )),
    ...kots.map((item, i) => (
      <KotSlip
        outlet={{ name: item.outletName || outlet.name }}
        index={i}
        count={kots.length}
        info={[
          ["KOT No", item.kotNumber],
          ["Kitchen", item.mpcName],
          ["Table", printData.tableName],
          ["Waiter", printData.waiterName],
          ["Bill", printData.transactionId],
          ["Date", when],
          ["Cashier", printData.cashierName],
        ]}
        item={{ name: item.productName || item.name, qty: item.qty ?? item.quantity, note: item.specialInstructions }}
      />
    )),
  ];
  return (
    <PrintArea id={id}>
      {slips.map((slip, i) => (i === 0 ? <div key={i}>{slip}</div> : <PageBreak key={i}>{slip}</PageBreak>))}
    </PrintArea>
  );
}
