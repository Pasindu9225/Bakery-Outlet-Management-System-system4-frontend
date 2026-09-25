import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { logExport } from "../services/auditLog";

/**
 * Universal PDF Generator for Bakery Management System
 * Provides consistent branding, headers, footers, and styling.
 */
export const generatePDF = ({
    title,
    subtitle,
    headers,
    data,
    fileName,
    orientation = "p", // 'p' for portrait, 'l' for landscape
    summary = [] // Array of { label, value }
}) => {
    const doc = new jsPDF(orientation, "mm", "a4");
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    // ── COLORS ────────────────────────────────────────────────────────────
    const primaryColor = [15, 80, 170]; // #0F50AA
    const secondaryColor = [102, 112, 133]; // #667085
    const textColor = [56, 62, 73]; // #383E49

    // ── HEADER ───────────────────────────────────────────────────────────
    const drawHeader = () => {
        // Logo (Attempt to use public/logo.png if available, else use text)
        // Since we can't easily load local files into jsPDF in a utility without base64,
        // we'll draw a stylized "B" logo or a placeholder. 
        // In a real app, you'd pass a base64 logo string here.
        
        doc.setFillColor(...primaryColor);
        doc.roundedRect(margin, 10, 10, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("B", margin + 3.5, 17);

        doc.setTextColor(...textColor);
        doc.setFontSize(14);
        doc.text("Bakery Management System", margin + 14, 17);
        
        doc.setDrawColor(228, 230, 234); // #E4E6EA
        doc.line(margin, 25, pageWidth - margin, 25);
    };

    // ── FOOTER ───────────────────────────────────────────────────────────
    const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...secondaryColor);
            doc.setFont("helvetica", "normal");
            
            // Left: Date
            doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
            
            // Center: Page Number
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
            
            // Right: System Name
            doc.text("© Bakery Outlet System", pageWidth - margin, pageHeight - 10, { align: "right" });
        }
    };

    drawHeader();

    // ── TITLE & SUBTITLE ────────────────────────────────────────────────
    let yPos = 35;
    doc.setFontSize(18);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, yPos);
    yPos += 8;

    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(...secondaryColor);
        doc.setFont("helvetica", "normal");
        doc.text(subtitle, margin, yPos);
        yPos += 10;
    }

    // ── SUMMARY SECTION ────────────────────────────────────────────────
    if (summary && summary.length > 0) {
        doc.setFillColor(248, 249, 250); // #F8F9FA
        doc.setDrawColor(228, 230, 234);
        const summaryBoxHeight = 15;
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), summaryBoxHeight, 2, 2, "FD");
        
        doc.setFontSize(9);
        doc.setTextColor(...textColor);
        let xPos = margin + 5;
        summary.forEach((item) => {
            doc.setFont("helvetica", "bold");
            doc.text(`${item.label}:`, xPos, yPos + 9);
            const labelWidth = doc.getTextWidth(`${item.label}: `);
            doc.setFont("helvetica", "normal");
            doc.text(`${item.value}`, xPos + labelWidth, yPos + 9);
            xPos += (pageWidth - (margin * 2)) / summary.length;
        });
        yPos += summaryBoxHeight + 10;
    }

    // ── DATA TABLE ──────────────────────────────────────────────────────
    autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: data,
        theme: "grid",
        styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [228, 230, 234],
            lineWidth: 0.1,
            textColor: textColor,
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
            halign: "left",
        },
        alternateRowStyles: {
            fillColor: [250, 251, 252],
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data) => {
            // Placeholder for page-specific drawing if needed
        }
    });

    addFooter();

    // ── SAVE ────────────────────────────────────────────────────────────
    doc.save(`${fileName || "Report"}_${new Date().toISOString().split("T")[0]}.pdf`);
    logExport(null, `Exported ${title || fileName || "report"}${subtitle ? ` (${subtitle})` : ""} as PDF, ${data?.length ?? 0} rows`);
};

/**
 * Universal Excel (CSV) Generator
 */
export const generateExcel = ({ headers, data, fileName }) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    
    data.forEach((row) => {
        const rowContent = row.map(val => {
            const s = String(val);
            return s.includes(',') ? `"${s}"` : s;
        }).join(",");
        csvContent += rowContent + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName || "Report"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logExport(null, `Exported ${fileName || "report"} as CSV, ${data?.length ?? 0} rows`);
};
