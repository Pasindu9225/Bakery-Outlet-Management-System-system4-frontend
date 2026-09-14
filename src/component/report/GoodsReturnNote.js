import React from "react";

const GoodsReturnNote = ({
  companyName = "",
  returnNoteNo = "",
  returningDept = "",
  grnNo = "",
  date = "",
  supplier = "",
  data = [],
}) => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "30px",
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        color: "#000",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h2 style={{ margin: 0, textDecoration: "underline" }}>
          Goods Return Note
        </h2>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
           <img src="/logo.png" alt="Company Logo"
          style={{
            height: "50px",
            marginRight: "15px",
          }} />
           <h3 style={{ margin: 0 }}>{companyName}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", }}>
          <strong>Return Note No: </strong> {returnNoteNo}
        </div>
      </div>

      {/* Details */}
      <div style={{ lineHeight: "1" }}>
        <p style={{ lineHeight: "1" }}><strong>Returning Dept:</strong> {returningDept}</p>
        <p style={{ lineHeight: "1" }}><strong>GRN No:</strong> {grnNo}</p>
        <p style={{ lineHeight: "1" }}><strong>Date:</strong> {date}</p>
        <p style={{ lineHeight: "1" }}><strong>Supplier:</strong> {supplier}</p>
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "30px",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={styles.th}>Item Code</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Brand</th>
            <th style={styles.th}>Unit</th>
            <th style={styles.th}>Return Qty</th>
            <th style={styles.th}>Reason</th>
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
                <td style={styles.td}>{item.returnQty}</td>
                <td style={styles.td}>{item.reason}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={styles.td} colSpan="6" align="center">
                No return items listed
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer Note */}
      <div style={{ marginBottom: "40px" }}>
        <p>Above items were accepted as returns.</p>
      </div>

      {/* Signature */}
      <div style={{ marginTop: "20px" }}>
        <p style={{ lineHeight: "0.5"}}>--------------------------------------------</p>
        <p style={{ lineHeight: "0.5", fontSize:'12px' }}>(Name & Signature of the supplier)</p>
      </div>
    </div>
  );
};

const styles = {
  th: {
    border: "1px solid black",
    padding: "6px",
    backgroundColor: "#f2f2f2",
    textAlign: "center",
    fontSize: "13px",
  },
  td: {
    border: "1px solid black",
    padding: "6px",
    fontSize: "13px",
  },
};

export default GoodsReturnNote;
