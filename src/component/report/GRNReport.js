import React from "react";
import { companyInfo, companyDetailLines } from "../../utils/companyInfo";

const GRNReport = ({
  companyName = "",
  grnNo = "",
  date = "",
  supplier = "",
  poRefNo = "",
  invoiceNo = "",
  data = [],
  deliveries = [],
}) => {
  const money = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grandTotal = deliveries.reduce((sum, d) => sum + Number(d.total || 0), 0);
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "30px",
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        boxSizing: "border-box",
        color: "#000",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h2 style={{ margin: 0, textDecoration: "underline" }}>
          Goods Received Note
        </h2>
      </div>

      {/* Logo & Company */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
        <img src="/logo.png" alt="Company Logo"
          style={{
            height: "50px",
            marginRight: "15px",
          }} />
        <div>
          <h3 style={{ margin: 0 }}>{companyName}</h3>
          {companyDetailLines().map((line) => <div key={line} style={{ fontSize: "12px" }}>{line}</div>)}
        </div>
      </div>

      {/* Details */}
      <div style={{ lineHeight: "1" }}>
        <p style={{ lineHeight: "1" }}><strong>GRN No:</strong> {grnNo}</p>
        <p style={{ lineHeight: "1" }}><strong>Date:</strong> {date}</p>
        <p style={{ lineHeight: "1" }}><strong>Supplier:</strong> {supplier}</p>
        <p style={{ lineHeight: "1" }}><strong>PO Ref No:</strong> {poRefNo}</p>
        {invoiceNo && <p style={{ lineHeight: "1" }}><strong>Invoice No:</strong> {invoiceNo}</p>}
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={styles.th}>Item Code</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Brand</th>
            <th style={styles.th}>Unit</th>
            <th style={styles.th}>Qty Ordered</th>
            <th style={styles.th}>Qty Received</th>
            <th style={styles.th}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.code}</td>
                <td style={styles.td}>{item.description}</td>
                <td style={styles.td}>{item.brand}</td>
                <td style={styles.td}>{item.unit}</td>
                <td style={styles.td}>{item.qtyOrdered}</td>
                <td style={styles.td}>{item.qtyReceived}</td>
                <td style={styles.td}>{item.remarks}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={styles.td} colSpan="7" align="center">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Each supplier bill received on this GRN */}
      {deliveries.length > 0 && (
        <>
          <h4 style={{ margin: "0 0 8px" }}>Deliveries</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Invoice No</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Batch</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.flatMap((d) =>
                (d.items || []).map((it, i) => (
                  <tr key={`${d.deliveryId}-${i}`}>
                    <td style={styles.td}>{i === 0 && d.receivedDate ? new Date(d.receivedDate).toLocaleDateString() : ""}</td>
                    <td style={styles.td}>{i === 0 ? d.invoiceNumber : ""}</td>
                    <td style={styles.td}>{it.materialName}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{it.actualQuantity} {it.unit || ""}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{money(it.actualPrice)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>{money(it.lineTotal)}</td>
                    <td style={styles.td}>{it.batchNo}</td>
                  </tr>
                ))
              )}
              <tr>
                <td style={{ ...styles.td, fontWeight: "bold" }} colSpan="5" align="right">Total</td>
                <td style={{ ...styles.td, textAlign: "right", fontWeight: "bold" }}>{money(grandTotal)}</td>
                <td style={styles.td}></td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* Notes */}
      <div style={{ marginBottom: "40px", lineHeight: "1.8" }}>
        <p>Above goods were received in good condition and in correct quantity.</p>
        <p style={{ lineHeight: "0.5", marginTop: "20px" }}>....................................</p>
        <p style={{ lineHeight: "0.5" }}>(Signature)</p>

        <p style={{ marginTop: "20px" }}>
          The above mentioned items have been delivered.
        </p>
        <p style={{ lineHeight: "0.5", marginTop: "20px" }}>....................................</p>
        <p style={{ lineHeight: "0.5" }}>(Signature)</p>
      </div>
    </div>
  );
};

const styles = {
  th: {
    border: "1px solid black",
    padding: "6px",
    backgroundColor: "#f2f2f2",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: "13px",
  },
  td: {
    border: "1px solid black",
    padding: "6px",
    fontSize: "13px",
  },
};

export default GRNReport;
