import React, { useState, useRef, useEffect } from "react";
import { FileText, Calendar, Download, Filter, FileSpreadsheet, TrendingUp, Package, ShoppingCart, AlertTriangle, Store, ChevronDown } from "lucide-react";
import axiosInstance from "../services/api";
import jsPDF from 'jspdf';
import { logExport } from "../services/auditLog";
import autoTable from 'jspdf-autotable';

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";

export default function AdminGenerateReports() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('Generate Reports');
    const tableRef = useRef(null);
    
    // Filter states
    const [reportType, setReportType] = useState('Sales');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [outlet, setOutlet] = useState('All Outlets');
    const [category, setCategory] = useState('All Categories');
    const [employee, setEmployee] = useState('All Employees');
    const [reportGenerated, setReportGenerated] = useState(false);

    const [fetchedReportData, setFetchedReportData] = useState([]);
    const [outlets, setOutlets] = useState(['All Outlets']);
    const [categories, setCategories] = useState(['All Categories']);
    const [employees, setEmployees] = useState(['All Employees']);

    // Fetch filters data from backend on mount
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const categoriesRes = await axiosInstance.get(`/api/v1/admin/product/categories`);
                if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
                    const fetchedCategories = categoriesRes.data.map(cat => cat.name || cat.categoryName).filter(Boolean);
                    const uniqueCats = [...new Set(fetchedCategories)];
                    setCategories(['All Categories', ...uniqueCats]);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
            }

            try {
                const employeesRes = await axiosInstance.get(`/ADMIN/v1/users`);
                if (employeesRes.data && Array.isArray(employeesRes.data)) {
                    const fetchedEmployees = employeesRes.data.map(u => `${u.firstName || ''} ${u.lastName || ''}`.trim()).filter(Boolean);
                    const uniqueEmps = [...new Set(fetchedEmployees)];
                    setEmployees(['All Employees', ...uniqueEmps]);
                }
            } catch (err) {
                console.error("Error fetching employees:", err);
            }

            try {
                const outletsRes = await axiosInstance.get(`/api/v1/admin/outlet/all`);
                if (outletsRes.data && Array.isArray(outletsRes.data)) {
                    const fetchedOutlets = outletsRes.data.map(o => o.name).filter(Boolean);
                    const uniqueOutlets = [...new Set(fetchedOutlets)];
                    setOutlets(['All Outlets', ...uniqueOutlets]);
                }
            } catch (err) {
                console.error("Error fetching outlets:", err);
            }
        };

        fetchFilterData();
    }, []);

    // Initial data fetch on mount
    useEffect(() => {
        handleApplyFilters();
    }, []);

    const handleApplyFilters = async () => {
        setReportGenerated(true);
        console.log('Generating report:', { reportType, dateFrom, dateTo, outlet, category, employee });
        try {
            const response = await axiosInstance.get(`/api/admin/dashboard/reports`, {
                params: {
                    reportType: reportType,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                    outlet: outlet !== 'All Outlets' ? outlet : undefined,
                    category: category !== 'All Categories' ? category : undefined,
                    employee: employee !== 'All Employees' ? employee : undefined
                }
            });
            setFetchedReportData(response.data);
        } catch (error) {
            console.error("Error generating report:", error);
            setFetchedReportData([]);
        }
    };

    const handleResetFilters = () => {
        setReportType('Sales');
        setDateFrom('');
        setDateTo('');
        setOutlet('All Outlets');
        setCategory('All Categories');
        setEmployee('All Employees');
        setReportGenerated(false);
    };

    const getCurrentData = () => {
        return fetchedReportData || [];
    };

    const getReportIcon = () => {
        switch(reportType) {
            case 'Sales': return <TrendingUp className="w-5 h-5" />;
            case 'Stock': return <Package className="w-5 h-5" />;
            case 'Production': return <ShoppingCart className="w-5 h-5" />;
            case 'Wastage': return <AlertTriangle className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const calculateSummary = () => {
        const data = getCurrentData();
        
        switch(reportType) {
            case 'Sales':
                const totalSales = data.reduce((sum, item) => sum + item.total, 0);
                const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
                return {
                    'Total Sales': `Rs. ${totalSales.toLocaleString()}`,
                    'Total Items Sold': totalQuantity.toLocaleString(),
                    'Average Transaction': `Rs. ${(totalSales / data.length).toFixed(2)}`,
                    'Number of Transactions': data.length
                };
            case 'Stock':
                const totalStockValue = data.reduce((sum, item) => sum + item.totalValue, 0);
                const lowStockItems = data.filter(item => item.status === 'Low Stock' || item.status === 'Critical').length;
                return {
                    'Total Stock Value': `Rs. ${totalStockValue.toLocaleString()}`,
                    'Total Items': data.length,
                    'Low Stock Items': lowStockItems,
                    'In Stock Items': data.filter(item => item.status === 'In Stock').length
                };
            case 'Production':
                const totalProduction = data.reduce((sum, item) => sum + item.quantity, 0);
                const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
                return {
                    'Total Production': `${totalProduction.toLocaleString()} units`,
                    'Total Cost': `Rs. ${totalCost.toLocaleString()}`,
                    'Batches Completed': data.filter(item => item.status === 'Completed').length,
                    'Total Batches': data.length
                };
            case 'Wastage':
                const totalWastage = data.reduce((sum, item) => sum + item.quantity, 0);
                const totalWastageCost = data.reduce((sum, item) => sum + item.cost, 0);
                return {
                    'Total Wastage': `${totalWastage} units`,
                    'Total Cost': `Rs. ${totalWastageCost.toLocaleString()}`,
                    'Average Loss per Item': `Rs. ${(totalWastageCost / data.length).toFixed(2)}`,
                    'Number of Incidents': data.length
                };
            default:
                return {};
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        const data = getCurrentData();
        if (data.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Get headers from first data item
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';
        
        // Add data rows
        data.forEach((item) => {
            const row = headers.map(header => {
                const value = item[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            });
            csvContent += row.join(',') + '\n';
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
        logExport("ADMIN", `Exported ${reportType} report as CSV`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export to Excel
    const handleExportExcel = () => {
        const data = getCurrentData();
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        
        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>${reportType} Report</x:Name>
                                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th { background-color: #0F50AA; color: white; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    .header-cell { background-color: #f0f1f3; font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>${reportType} Report</h2>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                ${dateFrom && dateTo ? `<p><strong>Period:</strong> ${dateFrom} to ${dateTo}</p>` : ''}
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                ${headers.map(h => `<td>${item[h]}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reportType}_Report_${new Date().toISOString().split('T')[0]}.xls`;
        logExport("ADMIN", `Exported ${reportType} report as Excel`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    // Export to PDF
    const handleExportPDF = () => {
        const data = getCurrentData();
        if (data.length === 0) return;

        const doc = new jsPDF("p", "mm", "a4");
        const marginX = 14;
        let y = 15;

        // === HEADER SECTION ===
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`${reportType} Report`, marginX, y);
        y += 15;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(50);

        const infoItems = [
            { label: "Report Type", value: reportType },
            { label: "Generated", value: new Date().toLocaleString() },
        ];

        if (dateFrom && dateTo) {
            infoItems.push({ label: "Period", value: `${dateFrom} to ${dateTo}` });
        }
        if (outlet !== 'All Outlets') {
            infoItems.push({ label: "Outlet", value: outlet });
        }
        if (category !== 'All Categories') {
            infoItems.push({ label: "Category", value: category });
        }

        const colWidth = 90;
        const rowHeight = 8;
        let col = 0;
        infoItems.forEach((item) => {
            const x = marginX + col * colWidth;
            doc.text(`${item.label}: ${item.value}`, x, y);
            col++;
            if (col >= 2) {
                col = 0;
                y += rowHeight;
            }
        });

        if (col !== 0) y += rowHeight;

        // === SUMMARY SECTION ===
        const summary = calculateSummary();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        col = 0;
        Object.entries(summary).forEach(([key, value]) => {
            const x = marginX + col * colWidth;
            doc.text(`${key}: ${value}`, x, y);
            col++;
            if (col >= 2) {
                col = 0;
                y += rowHeight;
            }
        });

        if (col !== 0) y += rowHeight;
        y += 5;

        // === TABLE SECTION ===
        const headers = Object.keys(data[0]);
        const tableRows = data.map(item => headers.map(h => String(item[h])));

        autoTable(doc, {
            startY: y,
            head: [headers],
            body: tableRows,
            theme: "grid",
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.2,
                textColor: [0, 0, 0],
                fontSize: 8,
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: "bold",
                lineWidth: 0.3,
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: marginX, right: marginX },
        });

        // === FOOTER SECTION ===
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(80);
            doc.text(
                `Page ${i} of ${pageCount} | © ${new Date().getFullYear()} Bakery Outlet System`,
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
            );
        }

        // === SAVE FILE ===
        doc.save(`${reportType}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        logExport("ADMIN", `Exported ${reportType} report as PDF`);
    };

    const renderTableContent = () => {
        const data = getCurrentData();
        
        if (!reportGenerated) {
            return (
                <div className="text-center py-20">
                    <FileText size={64} className="mx-auto text-[#667085] mb-4" />
                    <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">No Report Generated</h3>
                    <p className="text-[14px] text-[#667085]">
                        Select filters and click "Generate Report" to view data
                    </p>
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="text-center py-20">
                    <AlertTriangle size={64} className="mx-auto text-[#F4A100] mb-4" />
                    <h3 className="text-[18px] font-[600] text-[#383E49] mb-2">No Data Available</h3>
                    <p className="text-[14px] text-[#667085]">
                        No records found for the selected filters
                    </p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto" ref={tableRef}>
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-[#E4E6EA]">
                            {Object.keys(data[0]).map((header) => (
                                <th key={header} className="text-left py-4 text-[14px] font-[600] text-[#383E49] ">
                                    {header.replace(/([A-Z])/g, ' $1').trim()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E6EA]">
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-[#F8F9FA] transition-colors">
                                {Object.entries(row).map(([key, value], i) => (
                                    <td key={i} className="py-4 text-[14px] text-[#48505E]">
                                        {key === 'status' ? (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-[500] ${
                                                value === 'Active' || value === 'Completed' || value === 'In Stock' 
                                                    ? 'bg-[#DDFFE0] text-[#199D26]'
                                                    : value === 'Low Stock' || value === 'In Progress'
                                                    ? 'bg-[#FFF4ED] text-[#F4A100]'
                                                    : 'bg-[#FEE2E2] text-[#EF4444]'
                                            }`}>
                                                {value}
                                            </span>
                                        ) : typeof value === 'number' && (key.includes('total') || key.includes('price') || key.includes('cost') || key.includes('Value')) ? (
                                            `Rs. ${value.toLocaleString()}`
                                        ) : (
                                            value
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
            {/* Sidebar */}
            <AdminSidebar sidebarOpen={sidebarOpen} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Navbar */}
                <AdminNavBar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeSection={activeSection}
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-[20px] font-[600] text-[#383E49] mb-1">
                            Generate Reports
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-[#667085]">
                            Filter, view, and export detailed operational reports
                        </p>
                    </div>

                    {/* Filters & Controls Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-6">
                     

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {/* Report Type Selector */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Report Type
                                </label>
                                <div className="relative">
                                    <select
                                        value={reportType}
                                        onChange={(e) => setReportType(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white appearance-none"
                                    >
                                        <option value="Sales">Sales Report</option>
                                        <option value="Stock">Stock Report</option>
                                        <option value="Production">Production Report</option>
                                        <option value="Wastage">Wastage Report</option>
                                        <option value="Purchases">Purchases Report</option>
                                        <option value="Outlet Distribution">Outlet Distribution</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085] pointer-events-none" />
                                </div>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    From Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085]" />
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                    />
                                </div>
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    To Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085]" />
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                    />
                                </div>
                            </div>

                            {/* Outlet Selection */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Outlet
                                </label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085]" />
                                    <select
                                        value={outlet}
                                        onChange={(e) => setOutlet(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white appearance-none"
                                    >
                                        {outlets.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085] pointer-events-none" />
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Product Category
                                </label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085]" />
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white appearance-none"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085] pointer-events-none" />
                                </div>
                            </div>

                            {/* Employee Selection */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Employee/User
                                </label>
                                <select
                                    value={employee}
                                    onChange={(e) => setEmployee(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp} value={emp}>{emp}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleApplyFilters}
                                className="px-6 py-2.5 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors"
                            >
                                Generate Report
                            </button>
                            <button
                                onClick={handleResetFilters}
                                className="px-6 py-2.5 border border-[#E4E6EA] text-[#48505E] rounded-md text-[14px] font-[500] hover:bg-[#F8F9FA] transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Summary Statistics Panel */}
                    {reportGenerated && getCurrentData().length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {Object.entries(calculateSummary()).map(([key, value]) => (
                                <div key={key} className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[14px] font-[500] text-[#667085]">{key}</p>
                                        <div className="p-2 bg-[#EBF8FF] rounded-lg">
                                            {getReportIcon()}
                                        </div>
                                    </div>
                                    <h3 className="text-[20px] font-[600] text-[#383E49]">
                                        {value}
                                    </h3>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Report Preview Panel */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#EBF8FF] rounded-lg">
                                    {getReportIcon()}
                                </div>
                                <div>
                                    <h3 className="text-[18px] font-[600] text-[#383E49]">
                                        {reportType} Report
                                    </h3>
                                    <p className="text-[14px] text-[#667085]">
                                        {reportGenerated 
                                            ? `Showing ${getCurrentData().length} records`
                                            : 'Configure filters to generate report'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Export Options */}
                            {reportGenerated && getCurrentData().length > 0 && (
                                <div className="flex gap-2 mt-4 sm:mt-0">
                                    <button
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-2 px-4 py-2 border border-[#E4E6EA] text-[#48505E] rounded-md text-[14px] font-[500] hover:bg-[#F8F9FA] transition-colors"
                                        title="Export as CSV"
                                    >
                                        <FileText size={16} />
                                        <span className="hidden sm:inline">CSV</span>
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="flex items-center gap-2 px-4 py-2 border border-[#E4E6EA] text-[#48505E] rounded-md text-[14px] font-[500] hover:bg-[#F8F9FA] transition-colors"
                                        title="Export as PDF"
                                    >
                                        <Download size={16} />
                                        <span className="hidden sm:inline">PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Table Content */}
                        {renderTableContent()}

                        {/* Table Info Footer */}
                        {reportGenerated && getCurrentData().length > 0 && (
                            <div className="mt-6 pt-6 border-t border-[#E4E6EA]">
                                <p className="text-[12px] text-[#667085]">
                                    <strong>Note:</strong> This report displays data based on the selected filters. 
                                    Export options are available for further analysis and record-keeping.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}