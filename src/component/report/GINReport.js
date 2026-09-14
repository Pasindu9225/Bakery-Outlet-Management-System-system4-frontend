import React from "react";

const getItemEmoji = (item = {}) => {
  if (item.type === "header") return "📋 ";
  if (item.isRawMaterial || item.type === "raw-material") return "📦 ";

  const productTypes = [
    "product",
    "Product",
    "semi-product",
    "Semi-Product",
    "semi-finished",
    "Semi-Finished",
  ];
  if (productTypes.includes(item.type)) return "🎯 ";

  const doughTypes = ["dough", "Dough", "filling", "Filling"];
  if (doughTypes.includes(item.type)) return "🧩 ";

  return "🧩 ";
};

const GINReport = ({
  dept_name = "",
  date = "",
  receiving = "",
  title = "",
  companyName = "",
  data = [],
  treeData = [],
}) => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "30px",
        width: "297mm",
        minHeight: "210mm",
        margin: "0 auto",
        boxSizing: "border-box",
        color: "#000",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h2 style={{ margin: 0, textDecoration: "underline" }}>
          Goods Issue Note
        </h2>
      </div>

      {/* Logo & Company */}
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
      >
        <img
          src="/logo.png"
          alt="Company Logo"
          style={{
            height: "50px",
            marginRight: "15px",
          }}
        />
        <h3 style={{ margin: 0 }}>{companyName}</h3>
      </div>

      {/* Details */}
      <div style={{ lineHeight: "1" }}>
        <p style={{ lineHeight: "1" }}>
          <strong>Issuing Dept Name:</strong> {dept_name}
        </p>
        <p style={{ lineHeight: "1" }}>
          <strong>Date:</strong> {date}
        </p>
        <p style={{ lineHeight: "1" }}>
          <strong>Receiving Dept:</strong> {receiving}
        </p>
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
            <th style={styles.th}>Qty Issued</th>
            <th style={styles.th}>Mini Store QTY</th>
            <th style={styles.th}>Total QTY</th>
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
                <td style={{ ...styles.td, fontWeight: "bold" }}>{item.qty}</td>
                <td style={styles.td}>
                  {item.miniStoreQty !== undefined && item.miniStoreQty !== null
                    ? item.miniStoreQty
                    : ""}
                </td>
                <td style={styles.td}>
                  {Number(item.qty) + Number(item.miniStoreQty)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={styles.td} colSpan="9" align="center">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Notes */}
      <div style={{ marginTop: "30px" }}>
        <p>
          <strong>Issued by:</strong>{" "}
          ................................................
        </p>
        <p style={{ lineHeight: "0.5", marginTop: "30px" }}>
          <strong>Received by:</strong>{" "}
          ................................................
        </p>
        <p style={{ lineHeight: "0.5", fontSize: "12px" }}>
          (Name & Signature)
        </p>
      </div>

      {treeData && treeData.length > 0 && (
        <>
          {/* ✅ PAGE BREAK ADDED HERE */}
          <div
            style={{
              pageBreakBefore: "always",
              marginTop: "30px",
              marginBottom: "15px",
              borderBottom: "2px solid #000",
              paddingBottom: "5px",
            }}
          >
            <h3 style={{ margin: 0 }}>Production Workflow Details</h3>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={styles.th}>Item Code</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Type</th>
                {/* <th style={styles.th}>Production Center</th> */}
                <th style={styles.th}>Unit</th>
                <th style={styles.th}>Material QTY</th>
                <th style={styles.th}>QTY</th>
                <th style={styles.th}>Actual Production</th>
                <th style={styles.th}>Wastage</th>
                <th style={styles.th}>Issued QTY</th>
                <th style={styles.th}>Issued Department</th>
                <th style={styles.th}>Received QTY</th>
              </tr>
            </thead>
            <tbody>
              {treeData.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    backgroundColor: item.level % 2 === 0 ? "#fff" : "#f9f9f9",
                  }}
                >
                  <td style={styles.td}>{item.code}</td>
                  <td
                    style={{
                      ...styles.td,
                      paddingLeft: `${item.level * 20 + 6}px`,
                      fontWeight: item.level === 0 ? "bold" : "normal",
                      fontStyle: item.type === "header" ? "italic" : "normal",
                      color: item.type === "header" ? "#666" : "inherit",
                    }}
                  >
                    {item.level > 0 && "└─ "}
                    {getItemEmoji(item)}
                    {item.description}
                  </td>
                  <td style={styles.td}>
                    {item.category && String(item.category).trim() !== ""
                      ? item.category
                      : item.type === "header"
                      ? "Header"
                      : item.isRawMaterial
                      ? "Raw Material"
                      : item.type === "semi-product"
                      ? "Semi-Product"
                      : item.type === "usage"
                      ? "Usage"
                      : "Product"}
                  </td>
                  {/* <td style={styles.td}>{item.productionCenter}</td> */}
                  <td style={styles.td}>{item.unit}</td>

                  {/* ✅ Logic for Material QTY and QTY */}
                  <td style={{ ...styles.td, fontWeight: "bold" }}>
                    {item.isRawMaterial ||
                    item.type === "raw-material" ||
                    item.type === "semi-product" ||
                    item.category === "Dough" ||
                    item.category === "Filling"
                      ? item.qty
                      : ""}
                  </td>
                  <td style={{ ...styles.td, fontWeight: "bold" }}>
                    {item.isRawMaterial ||
                    item.type === "raw-material" ||
                    item.type === "semi-product" ||
                    item.category === "Dough" ||
                    item.category === "Filling"
                      ? ""
                      : item.plannedQuantity !== null &&
                        item.plannedQuantity !== undefined
                      ? item.plannedQuantity
                      : item.qty}
                  </td>

                  <td style={styles.td}>{""}</td>
                  <td style={styles.td}>{""}</td>
                  <td style={styles.td}>{""}</td>
                  <td style={styles.td}>{""}</td>
                  <td style={styles.td}>{""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "30px" }}>
            <p>
              <strong>Issued by:</strong>{" "}
              ................................................
            </p>
            <p style={{ lineHeight: "0.5", marginTop: "30px" }}>
              <strong>Received by:</strong>{" "}
              ................................................
            </p>
            <p style={{ lineHeight: "0.5", fontSize: "12px" }}>
              (Name & Signature)
            </p>
          </div>
        </>
      )}
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

export default GINReport;
