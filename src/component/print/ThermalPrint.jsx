import React, { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { companyInfo, companyDetailLines } from "../../utils/companyInfo";

/*
 * The one layout for everything printed on the 80 mm thermal printer: customer bills (tax invoice, proforma,
 * delivery copies, table / waiter bills, return receipt, special-order receipts) and KOT slips.
 * Inline styles only, so a slip looks the same printed from a page or from a pop-up window (printHtml).
 */

const FONT = "'Courier New', Courier, monospace";
const S = {
  slip: { fontFamily: FONT, fontSize: 12, fontWeight: 700, lineHeight: 1.35, color: "#000", background: "#fff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  center: { textAlign: "center" },
  company: { textAlign: "center", fontWeight: 700, fontSize: 17, letterSpacing: 1, marginBottom: 2 },
  small: { textAlign: "center", fontSize: 11 },
  title: { textAlign: "center", fontWeight: 700, fontSize: 13, margin: "4px 0" },
  big: { fontSize: 15, margin: "2px 0" },
  rule: { borderTop: "1px dashed #000", margin: "5px 0" },
  double: { borderTop: "3px double #000", margin: "6px 0" },
  row: { display: "flex", justifyContent: "space-between", gap: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12, fontWeight: 700 },
  th: { textAlign: "left", fontWeight: 700, paddingBottom: 2, borderBottom: "1px dashed #000" },
  heading: { fontWeight: 700, fontSize: 11, margin: "4px 0 2px" },
  total: { display: "flex", justifyContent: "space-between", fontSize: 20, padding: "4px 6px" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 2 },
  kotItem: { border: "1px dashed #000", borderRadius: 4, padding: "6px 8px", margin: "6px 0", fontWeight: 700, fontSize: 13 },
  credit: { textAlign: "center", fontSize: 10, marginTop: 6 },
  pageBreak: { pageBreakBefore: "always", breakBefore: "page", borderTop: "1px dashed #000", marginTop: 12, paddingTop: 12 },
};

/** Printed at the bottom of every bill. */
export const DEVELOPER_CREDIT = "Developed by - plover.lk | 077 990 98 96";

export const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const printedAt = (d = new Date()) => `${d.toLocaleDateString()} Time: ${d.toLocaleTimeString()}`;

/** Bill amounts as on the old bill: 1,250.00 (no "Rs."). */
export const amt = (n) => Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pad = (n) => String(n).padStart(2, "0");

/** Company name, the outlet's address (its name when it has none), then address / phone / e-mail / VAT / TIN from the settings. */
export function SlipHeader({ outlet = {} }) {
  const place = outlet.address || outlet.name;
  return (
    <div>
      <div style={S.company}>{companyInfo.name.toUpperCase()}</div>
      {place && <div style={S.small}>{place}</div>}
      {companyDetailLines().map((line) => <div key={line} style={S.small}>{line}</div>)}
    </div>
  );
}

const Rule = () => <div style={S.rule} />;
const Double = () => <div style={S.double} />;

/**
 * Info lines: [label, value] prints "label : value" (left out when there is no value);
 * { left, right, big } prints one row with text at both ends.
 */
function InfoLines({ info }) {
  return info.map((entry, i) => {
    if (Array.isArray(entry)) {
      const [label, value] = entry;
      return value === undefined || value === null || value === "" ? null : <div key={i}>{label} : {value}</div>;
    }
    return <div key={i} style={{ ...S.row, ...(entry.big ? S.big : {}) }}><span>{entry.left}</span><span>{entry.right}</span></div>;
  });
}

function ItemTable({ items, amountLabel }) {
  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.th}>Description</th>
          <th style={{ ...S.th, textAlign: "center", width: "12%" }}>QTY</th>
          <th style={{ ...S.th, textAlign: "right", width: "36%" }}>{amountLabel}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i}>
            <td style={{ paddingTop: 2, wordBreak: "break-word" }}>{item.name}</td>
            <td style={{ paddingTop: 2, textAlign: "center" }}>{item.qty}</td>
            <td style={{ paddingTop: 2, textAlign: "right", whiteSpace: "nowrap" }}>{amt(item.amount)}</td>
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
export function BillSlip({ outlet, title, info = [], sections = [], amountLabel = "Price", totals = [], footer = [], credit = true }) {
  return (
    <div style={S.slip}>
      <SlipHeader outlet={outlet} />
      <Rule />
      {title && <div style={S.title}>{title}</div>}
      <InfoLines info={info} />
      {sections.map((section, i) => (
        <div key={i}>
          <Rule />
          {section.heading && <div style={S.heading}>{section.heading}</div>}
          <ItemTable items={section.items} amountLabel={amountLabel} />
        </div>
      ))}
      <Rule />
      {(() => {
        const row = (t) => (
          <div key={t.label} style={{ ...S.row, ...(t.rule ? { borderTop: "1px dashed #000", paddingTop: 3, marginTop: 3 } : {}) }}>
            <span>{t.label}</span><span>{typeof t.value === "number" ? amt(t.value) : t.value}</span>
          </div>
        );
        const at = totals.findIndex((t) => t.big);
        if (at < 0) return <>{totals.map(row)}<Rule /></>;
        return (
          <>
            {totals.slice(0, at).map(row)}
            <Double />
            <div style={S.total}><span>{totals[at].label}</span><span>{amt(totals[at].value)}</span></div>
            {totals.slice(at + 1).map(row)}
            <Double />
          </>
        );
      })()}
      {footer.map((line) => <div key={line} style={S.footer}>{line}</div>)}
      {/* the phone number on its own line (owner 16 Nov) */}
      {credit && DEVELOPER_CREDIT.split(" | ").map((line, i) => <div key={line} style={i ? { ...S.credit, marginTop: 0 } : S.credit}>{line}</div>)}
    </div>
  );
}

/** A kitchen order ticket: one slip per kitchen listing its items, always the same fields in the same order. */
export function KotSlip({ outlet = {}, index = 0, count = 1, info = [], item, items = item ? [item] : [] }) {
  return (
    <div style={S.slip}>
      <div style={{ ...S.title, fontSize: 18 }}>KOT</div>
      <div style={{ ...S.center, fontWeight: 700, fontSize: 14 }}>SLIP #{index + 1} OF {count}</div>
      {outlet.name && <div style={S.small}>{outlet.name.toUpperCase()}</div>}
      <Rule />
      <InfoLines info={info} />
      <Rule />
      <div style={S.kotItem}>
        {items.map((it, i) => (
          <div key={i} style={i ? { marginTop: 6, paddingTop: 6, borderTop: "1px dashed #000" } : undefined}>
            <div>KOT ITEM: {it.name}</div>
            <div style={{ marginTop: 2 }}>QTY: {it.qty}</div>
          </div>
        ))}
      </div>
      {items.some((it) => it.note) && (
        <div style={{ border: "1px solid #000", borderRadius: 4, padding: "6px 8px", margin: "6px 0", fontSize: 12 }}>
          <div style={{ fontWeight: 700 }}>Comment:</div>
          {items.filter((it) => it.note).map((it, i) => <div key={i}>{items.length > 1 ? `${it.name}: ` : ""}{it.note}</div>)}
        </div>
      )}
    </div>
  );
}

/**
 * Day End Report, printed when the day end is finished (owner 17 Nov, laid out like the old system's): gross, discounts,
 * tax, net, money by payment method, Club / Outlet and the number of bills. report = GET /api/pos/v1/day-end/report.
 */
export function DayEndReportSlip({ report }) {
  const now = new Date();
  const line = (label, value, key = label) => (
    <div key={key} style={S.row}><span>{label}</span><span>{value}</span></div>
  );
  const tendersTotal = (report.tenders || []).reduce((s, t) => s + Number(t.amount || 0), 0);
  return (
    <div style={S.slip}>
      <div style={S.center}>***Start of Report***</div>
      <div style={{ ...S.title, fontSize: 15 }}>Day End Report<br />Sales Report</div>
      <div style={S.company}>{companyInfo.name.toUpperCase()}</div>
      {report.outletName && <div style={S.small}>{report.outletName}</div>}
      <Rule />
      <div style={S.row}>
        <span>{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
        <span>{`${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`}</span>
      </div>
      <div>Sales Date : {report.date}</div>
      {report.serial != null && <div>Day End Serial : {report.serial}</div>}
      <Rule />
      {line("Description", "Amount")}
      <Rule />
      {line("Gross Sales", amt(report.grossSales))}
      {Number(report.discounts) > 0 && line("Discounts", `-${amt(report.discounts)}`)}
      {line("Total Additions", amt(report.tax))}
      <Double />
      <div style={{ ...S.row, fontSize: 15 }}><span>Net Sales</span><span>{amt(report.netSales)}</span></div>
      <Double />
      <div style={S.heading}>Tenders</div>
      {(report.tenders || []).map((t) => line(t.name, amt(t.amount), "t-" + t.name))}
      <Rule />
      {line("Total Tenders", amt(tendersTotal))}
      <Double />
      <div style={S.heading}>Club / Outlet</div>
      {(report.sections || []).map((s) => line(`${s.name} (${s.bills} bills)`, amt(s.amount), "s-" + s.name))}
      <Rule />
      {line("No Of Bills", report.bills ?? 0)}
      <div style={{ ...S.center, marginTop: 8 }}>***End of Report***</div>
      <div style={S.credit}>{DEVELOPER_CREDIT.split(" | ").map((part) => <div key={part}>{part}</div>)}</div>
    </div>
  );
}

/** Starts the next slip on a new piece of paper. */
export const PageBreak = ({ children }) => <div style={S.pageBreak}>{children}</div>;

/**
 * The printed page is made as long as the longest slip: with the printer's own paper length a long bill ran onto a
 * second page and the cutter cut it in two (owner 16 Nov). Each slip still starts on its own page.
 */
/**
 * Printed page width. 100 mm (owner 16 Nov) made Chrome add its own date / title / web address and shrink the bill on the
 * client's printer (17 Nov), so back to 80 mm, which printed cleanly.
 */
export const PAPER_MM = 80;
const pageCss = (heightPx) => (heightPx > 0 ? `@page { size: ${PAPER_MM}mm ${Math.ceil((heightPx * 25.4) / 96) + 4}mm; margin: 0; }` : "");
const tallestSlip = (el) => Math.max(0, ...[...el.children].filter((c) => c.tagName !== "STYLE").map((c) => c.getBoundingClientRect().height));

/** Hidden on screen; when the page is printed only this block is printed, across the whole roll (PAPER_MM). */
export function PrintArea({ id, children }) {
  const ref = useRef(null);
  const pageRef = useRef(null);
  useEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el || !pageRef.current) return;
      const keep = el.style.cssText;   // hidden on screen: lay it out off screen for a moment to measure it
      el.style.cssText = `${keep};display:block;position:absolute;visibility:hidden;left:-9999px;top:0;width:${PAPER_MM - 3}mm`;
      pageRef.current.textContent = `@media print { ${pageCss(tallestSlip(el))} }`;
      el.style.cssText = keep;
    };
    window.addEventListener("beforeprint", fit);
    return () => window.removeEventListener("beforeprint", fit);
  }, []);
  return (
    <div id={id} ref={ref} className="hidden print:block" style={{ background: "#fff" }}>
      <style ref={pageRef} />
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #${id}, #${id} * { visibility: visible !important; }
          #${id} { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; box-sizing: border-box !important; margin: 0 !important; padding: 0 1.5mm !important; }
          html, body { margin: 0 !important; padding: 0 !important; } /* full paper width, nothing above the slip (owner 16 Nov) */
          @page { margin: 0; } /* no browser date / page title on the slip, no shrinking (owner 16 Nov) */
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
    @page { margin: 0; } html, body { margin: 0; padding: 0; } body { padding: 0 1.5mm; background: #fff; }
    </style></head><body>${html}<script>window.onload = function () { var s = document.createElement("style"); s.textContent = "@page { size: ${PAPER_MM}mm " + (Math.ceil(document.body.scrollHeight * 25.4 / 96) + 4) + "mm; margin: 0; }"; document.head.appendChild(s); window.print(); window.close(); }</script></body></html>`);
  win.document.close();
  return true;
}

// ---------------------------------------------------------------- POS bills and KOTs

const lineItems = (items = []) => items.map((item) => ({
  name: item.productName || item.name,
  qty: item.qty ?? item.quantity,
  amount: (item.unitPrice ?? item.price ?? 0) * (item.qty ?? item.quantity ?? 0),
}));

/** Totals block of a POS bill (as the old bill): Sub Total, discount / tax when there are any, Total, then Cash and Change. */
export function posTotals({ subTotal = 0, discount = 0, finalTotal = 0, cashGiven = 0, change = 0 }) {
  const cash = cashGiven > 0 ? [{ label: "Cash", value: cashGiven }, { label: "Change", value: change || 0 }] : [];
  const taxed = subTotal - (discount || 0);
  const tax = finalTotal - taxed;
  return [
    { label: "Sub Total", value: subTotal },
    ...(discount > 0 ? [{ label: "Discount", value: `-${amt(discount)}` }] : []),
    ...(tax > 0.005 ? [{ label: `Tax (${taxed > 0 ? Math.round((tax / taxed) * 100) : 0}%)`, value: tax }] : []),
    { label: "Total", value: finalTotal, big: true },
    ...cash,
  ];
}

/**
 * Everything a POS screen prints for one sale (the shape used by POS Sales, Table Billing and Waiter Billing):
 * the bill (twice for Uber / PickMe: customer and delivery copy) followed by one KOT slip per kitchen, listing its items.
 */
export function PosPrintout({ printData, outlet = {}, id = "print-receipt" }) {
  const when = printedAt();
  const now = new Date();
  const date = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const proforma = printData.type === "PROFORMA";
  const copies = printData.printBill === false ? [] : printData.isUberOrPickMe ? ["CUSTOMER COPY", "DELIVERY COPY"] : [null];
  // one slip per kitchen: two dishes for the same kitchen come out on one KOT
  const kotGroups = Object.values((printData.kotItems || []).reduce((groups, item) => {
    const key = `${item.outletName || ""}|${item.mpcName || ""}`;
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {}));
  const slips = [
    ...copies.map((copy) => (
      <BillSlip
        outlet={outlet}
        title={proforma ? "PROFORMA INVOICE (UNPAID)" : copy}
        info={[
          ["Order", printData.deliveryOption],
          ["Table", printData.tableName],
          { left: `Bill# : ${printData.transactionId || ""}`, big: true },
          { left: proforma ? "" : time, right: date },
          ["Cashier", printData.cashierName],
          ["Served by", printData.waiterName || printData.cashierName],
          ["Payment", printData.paymentMethod],
          ["Bill for", printData.saleSection === "CLUB" ? "Club" : printData.saleSection === "OUTLET" ? "Outlet" : null],
          ["Card", printData.cardLast4 ? `**** ${printData.cardLast4}` : null],
          ["Card Ref", printData.cardRef],
        ]}
        sections={[{ items: lineItems(printData.items) }]}
        amountLabel="Amount"
        totals={posTotals(printData)}
        footer={proforma ? ["THIS IS A PROFORMA INVOICE.", "PLEASE SETTLE AT CASHIER TO GET THE INVOICE."] : ["Thank you", "Visit Again"]}
        credit={!proforma}
      />
    )),
    ...kotGroups.map((group, i) => (
      <KotSlip
        outlet={{ name: group[0].outletName || outlet.name }}
        index={i}
        count={kotGroups.length}
        info={[
          ["Date", when],
          ["KOT No", [...new Set(group.map((item) => item.kotNumber).filter(Boolean))].join(", ")],
          ["Kitchen", group[0].mpcName],
          ["Table", printData.tableName],
          ["Waiter", printData.waiterName],
          ["Bill", printData.transactionId],
          ["Cashier", printData.cashierName],
        ]}
        items={group.map((item) => ({ name: item.productName || item.name, qty: item.qty ?? item.quantity, note: item.specialInstructions }))}
      />
    )),
  ];
  return (
    <PrintArea id={id}>
      {slips.map((slip, i) => (i === 0 ? <div key={i}>{slip}</div> : <PageBreak key={i}>{slip}</PageBreak>))}
    </PrintArea>
  );
}
