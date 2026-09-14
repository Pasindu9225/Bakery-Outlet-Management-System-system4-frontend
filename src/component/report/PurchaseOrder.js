import React from "react";

const PurchaseOrder = ({
    companyName = "",
    address = "",
    telephone = "",
    poNo = "",
    date = "",
    supplierName = "",
    supplierAddress = "",
    supplierContact = "",
    deliveryAddress = "",
    expectedDate = "",
    paymentTerms = "",
    totalAmount = "",
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
                <h2 style={{ margin: 0, textDecoration: "underline" }}>Purchase Order</h2>
            </div>

            {/* Logo and Company Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <img src="/logo.png" alt="Company Logo"
                        style={{
                            height: "50px",
                            marginRight: "15px",
                        }} />
                    <h3 style={{ margin: 0 }}>{companyName}</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", }}>
                    <strong>Date:</strong> {date}
                </div>
            </div>

            {/* Address & Contact */}
            <div style={{ marginBottom: "30px", lineHeight: "1" }}>
                <p style={{ lineHeight: "1" }}><strong>Address:</strong> {address}</p>
                <p style={{ lineHeight: "1" }}><strong>Telephone No:</strong> {telephone}</p>
            </div>

            {/* Supplier & PO Info */}
            <div style={{ marginBottom: "20px", lineHeight: "1" }}>
                <p style={{ lineHeight: "1" }}><strong>PO No:</strong> {poNo}</p>
                <p style={{ lineHeight: "1" }}><strong>Supplier Name:</strong> {supplierName}</p>
                <p style={{ lineHeight: "1" }}><strong>Address:</strong> {supplierAddress}</p>
                <p style={{ lineHeight: "1" }}><strong>Contact No:</strong> {supplierContact}</p>
            </div>

            {/* Table */}
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "30px",
                }}
            >
                <thead>
                    <tr>
                        <th style={styles.th}>Item Code</th>
                        <th style={styles.th}>Description</th>
                        <th style={styles.th}>Brand</th>
                        <th style={styles.th}>Qty</th>
                        <th style={styles.th}>Unit</th>
                        <th style={styles.th}>Unit Price</th>
                        <th style={styles.th}>Total Price</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{item.code}</td>
                                <td style={styles.td}>{item.description}</td>
                                <td style={styles.td}>{item.brand}</td>
                                <td style={styles.td}>{item.qty}</td>
                                <td style={styles.td}>{item.unit}</td>
                                <td style={styles.td}>{item.unitPrice}</td>
                                <td style={styles.td}>{item.totalPrice}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td style={styles.td} colSpan="7" align="center">
                                No items listed
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals and Notes */}
            <div style={{ marginBottom: "20px", lineHeight: "1" }}>
                <p style={{ lineHeight: "1" }}><strong>Total Amount:</strong> {totalAmount}</p>
                <p style={{ lineHeight: "1" }}><strong>Delivery Address:</strong> {deliveryAddress}</p>
                <p style={{ lineHeight: "1" }}><strong>Expected Delivery Date:</strong> {expectedDate}</p>
                <p style={{ lineHeight: "1" }}><strong>Payment Terms:</strong> {paymentTerms}</p>
            </div>

            {/* Authorized Officer */}
            <div style={{ marginTop: "40px" }}>
                <p style={{ lineHeight: "0.5" }}>--------------------------------------------</p>
                <p style={{ lineHeight: "0.5" }}>(Authorized Officer)</p>
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

export default PurchaseOrder;
