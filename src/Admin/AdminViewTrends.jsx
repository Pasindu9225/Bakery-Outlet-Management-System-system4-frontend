import React, { useState, useRef, useEffect } from "react";
import { TrendingUp, Calendar, Download, FileText, FileSpreadsheet, Filter, BarChart3, Activity } from "lucide-react";
import axios from "axios";
import { Line, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { logExport } from "../services/auditLog";
import autoTable from 'jspdf-autotable';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

import AdminNavBar from "../component/AdminNavBar.jsx";
import AdminSidebar from "../component/AdminSidebar.jsx";
import toast from "react-hot-toast";
import Skeleton from "../component/Skeleton";

export default function AdminViewTrends() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('View Trends');
    const [isLoading, setIsLoading] = useState(true);
    const chartRef = useRef(null);

    // Filter states
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [metric, setMetric] = useState('Sales');
    const [chartType, setChartType] = useState('line');
    const [compareEnabled, setCompareEnabled] = useState(false);
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [showCustomDate, setShowCustomDate] = useState(false);

    const [chartData, setChartData] = useState({ labels: [], datasets: [], summary: {} });

    // Initial data fetch on mount
    useEffect(() => {
        handleApplyFilters();
    }, []);

    // Sample data for charts
    const generateChartData = () => {
        if (!chartData || !chartData.datasets) return { labels: [], datasets: [] };

        const datasets = chartData.datasets.map((ds, index) => {
            const isPrimary = index === 0;
            return {
                ...ds,
                borderColor: isPrimary ? '#0F50AA' : '#B3A5FF',
                backgroundColor: chartType === 'area' 
                    ? (isPrimary ? 'rgba(15, 80, 170, 0.1)' : 'rgba(179, 165, 255, 0.1)') 
                    : (isPrimary ? '#0F50AA' : '#B3A5FF'),
                tension: 0.4,
                fill: chartType === 'area'
            };
        });

        return { labels: chartData.labels || [], datasets };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        family: 'Inter',
                        size: 12
                    },
                    color: '#383E49',
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: '#383E49',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                padding: 12,
                borderColor: '#E4E6EA',
                borderWidth: 1,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (metric === 'Sales') {
                            label += 'Rs. ' + context.parsed.y.toLocaleString();
                        } else {
                            label += context.parsed.y.toLocaleString() + ' units';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    font: {
                        family: 'Inter',
                        size: 11
                    },
                    color: '#667085',
                    callback: function (value) {
                        if (metric === 'Sales') {
                            return 'Rs. ' + value.toLocaleString();
                        }
                        return value.toLocaleString();
                    }
                },
                grid: {
                    color: '#F0F1F3',
                    drawBorder: false
                }
            },
            x: {
                ticks: {
                    font: {
                        family: 'Inter',
                        size: 11
                    },
                    color: '#667085'
                },
                grid: {
                    display: false
                }
            }
        }
    };

    const handleDateRangeChange = (value) => {
        setDateRange(value);
        if (value === 'Custom Range') {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
        }
    };

    const handleApplyFilters = async () => {
        const baseUrl = process.env.REACT_APP_BASE_URL || "";
        console.log('Applying filters:', { dateRange, metric, compareEnabled, customDateFrom, customDateTo });
        try {
            setIsLoading(true);
            const response = await axios.get(`${baseUrl}/api/admin/dashboard/trends`, {
                params: {
                    dateRange: dateRange,
                    customDateFrom: showCustomDate && customDateFrom ? customDateFrom : undefined,
                    customDateTo: showCustomDate && customDateTo ? customDateTo : undefined,
                    metric: metric,
                    compareEnabled: compareEnabled
                }
            });
            setChartData(response.data);
            toast.success("Trends updated");
        } catch (error) {
            console.error("Error fetching trends:", error);
            toast.error("Failed to fetch trends");
            setChartData({ labels: [], datasets: [], summary: {} });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetFilters = () => {
        setDateRange('Last 30 Days');
        setMetric('Sales');
        setChartType('line');
        setCompareEnabled(false);
        setCustomDateFrom('');
        setCustomDateTo('');
        setShowCustomDate(false);
    };

    // Export to CSV
    const handleExportCSV = () => {
        const data = generateChartData();
        let csvContent = "data:text/csv;charset=utf-8,";

        // Header row
        const headers = ['Period', ...data.datasets.map(ds => ds.label)];
        csvContent += headers.join(',') + '\n';

        // Data rows
        data.labels.forEach((label, index) => {
            const row = [label, ...data.datasets.map(ds => ds.data[index])];
            csvContent += row.join(',') + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${metric}_trend_${dateRange.replace(/\s+/g, '_')}.csv`);
        logExport("ADMIN", `Exported ${metric} trend (${dateRange}) as CSV`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export to Excel (HTML table format)
    const handleExportExcel = () => {
        const data = generateChartData();

        let excelContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>${metric} Trend Report</x:Name>
                                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th { background-color: #0F50AA; color: white; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: right; }
                    .header-cell { background-color: #f0f1f3; font-weight: bold; text-align: left; }
                </style>
            </head>
            <body>
                <h2>${metric} Trend Analysis</h2>
                <p><strong>Date Range:</strong> ${dateRange}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Period</th>
                            ${data.datasets.map(ds => `<th>${ds.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.labels.map((label, index) => `
                            <tr>
                                <td class="header-cell">${label}</td>
                                ${data.datasets.map(ds => `<td>${metric === 'Sales' ? 'Rs. ' : ''}${ds.data[index].toLocaleString()}</td>`).join('')}
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
        link.download = `${metric}_trend_${dateRange.replace(/\s+/g, '_')}.xls`;
        logExport("ADMIN", `Exported ${metric} trend (${dateRange}) as Excel`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };

    // Export to PDF
    const handleExportPDF = () => {
        const data = generateChartData();
        const doc = new jsPDF("p", "mm", "a4");

        const marginX = 14;
        let y = 15;

        // === HEADER SECTION ===
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Performance Trends Report", marginX, y);
        y += 15;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(50);

        const infoItems = [
            { label: "Metric", value: metric },
            { label: "Date Range", value: dateRange },
            { label: "Chart Type", value: chartType === "line" ? "Line Chart" : chartType === "bar" ? "Bar Chart" : "Area Chart" },
            { label: "Comparison", value: compareEnabled ? "Enabled (Previous Period)" : "Disabled" },
            { label: "Generated", value: new Date().toLocaleString() },
            { label: "Total Sales", value: "Rs. 58,100 (+15% from last period)" },
            { label: "Peak Day", value: "2025-11-08 (1,200 units sold)" },
            { label: "Average Daily Sales", value: "Rs. 14,525" },
        ];

        // Arrange all items in responsive "rows"
        const colWidth = 90;
        const rowHeight = 8;
        let col = 0;
        infoItems.forEach((item, index) => {
            const x = marginX + col * colWidth;
            doc.text(`${item.label}: ${item.value}`, x, y);
            col++;
            if (col >= 2) {
                col = 0;
                y += rowHeight;
            }
        });

        if (col !== 0) y += rowHeight;

        // === CHART SECTION ===
        const chartStartY = y + 5;
        const chartCanvas = chartRef.current?.canvas;
        if (chartCanvas) {
            const chartImage = chartCanvas.toDataURL("image/png", 1.0);
            doc.addImage(chartImage, "PNG", marginX, chartStartY, 180, 90);
            y += 100;
        }

        // === TABLE SECTION ===
        const tableStartY = y + 5;
        const tableHeaders = ["Period", ...data.datasets.map(ds => ds.label)];
        const tableRows = data.labels.map((label, i) => [
            label,
            ...data.datasets.map(ds =>
                metric === "Sales"
                    ? `Rs. ${ds.data[i].toLocaleString()}`
                    : `${ds.data[i].toLocaleString()} units`
            ),
        ]);

        autoTable(doc, {
            startY: tableStartY,
            head: [tableHeaders],
            body: tableRows,
            theme: "grid",
            styles: {
                lineColor: [0, 0, 0],
                lineWidth: 0.2,
                textColor: [0, 0, 0],
                fontSize: 9,
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
        doc.save(`${metric}_Trend_Report_${dateRange.replace(/\s+/g, "_")}.pdf`);
        logExport("ADMIN", `Exported ${metric} trend (${dateRange}) as PDF`);
    };

    const renderChart = () => {
        const data = generateChartData();

        if (chartType === 'bar') {
            return <Bar ref={chartRef} data={data} options={chartOptions} />;
        }
        return <Line ref={chartRef} data={data} options={chartOptions} />;
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
                            Performance Trends
                        </h1>
                        <p className="text-[14px] leading-[20px] font-[400] text-[#667085]">
                            Analyze daily, weekly, and monthly trends for informed decisions
                        </p>
                    </div>

                    {/* Filters & Controls Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 mb-6">


                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Date Range Selector */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Date Range
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#667085]" />
                                    <select
                                        value={dateRange}
                                        onChange={(e) => handleDateRangeChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                    >
                                        <option value="Last 7 Days">Last 7 Days</option>
                                        <option value="Last 30 Days">Last 30 Days</option>
                                        <option value="This Month">This Month</option>
                                        <option value="Last Month">Last Month</option>
                                        <option value="Custom Range">Custom Range</option>
                                    </select>
                                </div>
                            </div>

                            {/* Metric Selector */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Metric
                                </label>
                                <select
                                    value={metric}
                                    onChange={(e) => setMetric(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                >
                                    <option value="Sales">Sales</option>
                                    <option value="Production">Production</option>
                                    <option value="Inventory Movement">Inventory Movement</option>
                                    <option value="Returns">Returns</option>
                                    <option value="POS Transactions">POS Transactions</option>
                                </select>
                            </div>

                            {/* Chart Type Selector */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Chart Type
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setChartType('line')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-[14px] font-[500] transition-colors ${chartType === 'line'
                                            ? 'bg-[#0F50AA] text-white'
                                            : 'bg-[#F8F9FA] text-[#48505E] hover:bg-[#E4E6EA]'
                                            }`}
                                        title="Line Chart"
                                    >
                                        <Activity size={16} />
                                    </button>
                                    <button
                                        onClick={() => setChartType('bar')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-[14px] font-[500] transition-colors ${chartType === 'bar'
                                            ? 'bg-[#0F50AA] text-white'
                                            : 'bg-[#F8F9FA] text-[#48505E] hover:bg-[#E4E6EA]'
                                            }`}
                                        title="Bar Chart"
                                    >
                                        <BarChart3 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setChartType('area')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-[14px] font-[500] transition-colors ${chartType === 'area'
                                            ? 'bg-[#0F50AA] text-white'
                                            : 'bg-[#F8F9FA] text-[#48505E] hover:bg-[#E4E6EA]'
                                            }`}
                                        title="Area Chart"
                                    >
                                        <TrendingUp size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Comparison Toggle */}
                            <div>
                                <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                    Comparison
                                </label>
                                <label className="flex items-center gap-3 px-4 py-2.5 border border-[#E4E6EA] rounded-md bg-white cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={compareEnabled}
                                        onChange={(e) => setCompareEnabled(e.target.checked)}
                                        className="w-4 h-4 text-[#0F50AA] border-[#E4E6EA] rounded focus:ring-2 focus:ring-[#0F50AA]"
                                    />
                                    <span className="text-[14px] text-[#48505E]">
                                        With previous period
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        {showCustomDate && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-[#F8F9FA] rounded-md">
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customDateFrom}
                                        onChange={(e) => setCustomDateFrom(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customDateTo}
                                        onChange={(e) => setCustomDateTo(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleApplyFilters}
                                className="px-6 py-2.5 bg-[#0F50AA] hover:bg-[#1366D9] text-white rounded-md text-[14px] font-[500] transition-colors"
                            >
                                Apply Filters
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Total Sales Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[14px] font-[500] text-[#667085]">Total Sales</p>
                                <div className="p-2 bg-[#EBF8FF] rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-[#0F50AA]" />
                                </div>
                            </div>
                            <h3 className="text-[24px] font-[600] text-[#383E49] mb-1">
                                Rs. {chartData.summary?.totalValue?.toLocaleString() || '0'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-[500] bg-[#DDFFE0] text-[#199D26]">
                                    {chartData.summary?.percentageChange || '+0%'}
                                </span>
                                <span className="text-[12px] text-[#667085]">from last period</span>
                            </div>
                        </div>

                        {/* Peak Day Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[14px] font-[500] text-[#667085]">Peak Day</p>
                                <div className="p-2 bg-[#FFF4ED] rounded-lg">
                                    <Calendar className="w-5 h-5 text-[#F97316]" />
                                </div>
                            </div>
                            <h3 className="text-[24px] font-[600] text-[#383E49] mb-1">
                                {chartData.summary?.peakDay || '-'}
                            </h3>
                            <p className="text-[12px] text-[#667085]">
                                {chartData.summary?.peakValue?.toLocaleString() || '0'} units
                            </p>
                        </div>

                        {/* Average Daily Sales Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[14px] font-[500] text-[#667085]">Average Daily Sales</p>
                                <div className="p-2 bg-[#F0F9FF] rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-[#60A5FA]" />
                                </div>
                            </div>
                            <h3 className="text-[24px] font-[600] text-[#383E49] mb-1">
                                Rs. {chartData.summary?.averageDaily?.toLocaleString() || '0'}
                            </h3>
                            <p className="text-[12px] text-[#667085]">
                                Based on selected period
                            </p>
                        </div>
                    </div>

                    {/* Trend Visualization Area */}
                    <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div>
                                <h3 className="text-[18px] font-[600] text-[#383E49] mb-1">
                                    {metric} Trend
                                </h3>
                                <p className="text-[14px] text-[#667085]">
                                    {dateRange} • {chartType === 'line' ? 'Line Chart' : chartType === 'bar' ? 'Bar Chart' : 'Area Chart'}
                                </p>
                            </div>

                            {/* Export Options */}
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
                        </div>

                        {/* Chart Container */}
                        <div className="w-full h-[400px]">
                            {renderChart()}
                        </div>

                        {/* Chart Legend and Info */}
                        <div className="mt-6 pt-6 border-t border-[#E4E6EA]">
                            <p className="text-[12px] text-[#667085]">
                                <strong>Note:</strong> Hover over data points to view detailed information.
                                {compareEnabled && ' Comparison data shows the previous equivalent period.'}
                            </p>
                        </div>
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