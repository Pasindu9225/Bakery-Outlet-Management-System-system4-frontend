import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "./context/ThemeContext";
import { themeColor } from "./utils/themeColors";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import {
  ShoppingCart,
  ChefHat,
  Package,
  BarChart3,
  Users,
  Truck,
  DollarSign,
  TrendingUp,
  Activity
} from "lucide-react";
import { NavLink } from "react-router-dom";

// Import the separated components
import NavBar from "./component/NavBar.jsx";
import Sidebar from "./component/Sidebar.jsx";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function MainDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  // Sales chart data
  const salesChartData = {
    labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
    datasets: [
      {
        label: 'Sales Today',
        data: [12000, 19000, 25000, 32000, 28000, 15000],
        borderColor: themeColor('brand-fg'),
        backgroundColor: themeColor('brand-fg', 0.1),
        fill: true,
        tension: 0.4,
        pointBackgroundColor: themeColor('brand-fg'),
        pointBorderColor: themeColor('surface'),
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Sales Yesterday',
        data: [10000, 16000, 22000, 29000, 25000, 13000],
        borderColor: themeColor('border-strong'),
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: themeColor('border-strong'),
        pointBorderColor: themeColor('surface'),
        pointBorderWidth: 2,
        pointRadius: 3,
      }
    ]
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          color: themeColor('fg-secondary'),
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: themeColor('elevated'),
        titleColor: themeColor('fg'),
        bodyColor: themeColor('fg-secondary'),
        borderColor: themeColor('border'),
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            return context.dataset.label + ': Rs. ' + context.parsed.y.toLocaleString();
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: themeColor('border'),
          drawBorder: false
        },
        ticks: {
          color: themeColor('fg-secondary'),
          font: {
            size: 11
          },
          callback: function (value) {
            return 'Rs. ' + (value / 1000) + 'K';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: themeColor('fg-secondary'),
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 6,
      }
    }
  };

  // Module data - main system modules
  const modules = [
    {
      id: 1,
      name: "POS System",
      description: "Point of Sale transactions and billing",
      icon: <ShoppingCart size={32} />,
      color: "bg-gradient-to-br from-brand to-brand",
      iconBg: "bg-brand/10",
      iconColor: "text-brand-fg",
      path: "/posDashboard",
      stats: "145 sales today"
    },
    {
      id: 2,
      name: "KOT Management",
      description: "Kitchen Order Tickets and production",
      icon: <ChefHat size={32} />,
      color: "bg-gradient-to-br from-warning-solid to-warning-solid",
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      path: "/kot-dashboard",
      stats: "23 pending orders"
    },
    {
      id: 3,
      name: "Inventory",
      description: "Stock management and tracking",
      icon: <Package size={32} />,
      color: "bg-gradient-to-br from-success-solid to-success-solid",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      path: "/inventory-dashboard",
      stats: "892 items in stock"
    },
    {
      id: 4,
      name: "Reports & Analytics",
      description: "Sales reports and business insights",
      icon: <BarChart3 size={32} />,
      color: "bg-gradient-to-br from-plum-solid to-plum-solid",
      iconBg: "bg-plum/10",
      iconColor: "text-plum",
      path: "/analytics",
      stats: "15 reports available"
    },
    {
      id: 5,
      name: "Staff Management",
      description: "Employee management and scheduling",
      icon: <Users size={32} />,
      color: "bg-gradient-to-br from-plum-solid to-plum-solid",
      iconBg: "bg-plum/10",
      iconColor: "text-plum",
      path: "/staff-dashboard",
      stats: "12 active staff"
    },
    {
      id: 6,
      name: "Store Management",
      description: "Store operations and transfers",
      icon: <Truck size={32} />,
      color: "bg-gradient-to-br from-success-solid to-success-solid",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      path: "/store-dashboard",
      stats: "5 transfers pending"
    }
  ];

  // Quick stats data
  // const quickStats = [
  //   {
  //     label: "Today's Sales",
  //     value: "Rs. 145,230",
  //     icon: <DollarSign size={20} />,
  //     change: "+12.5%",
  //     changeType: "increase"
  //   },
  //   {
  //     label: "Orders Processed",
  //     value: "234",
  //     icon: <ShoppingCart size={20} />,
  //     change: "+8.2%",
  //     changeType: "increase"
  //   },
  //   {
  //     label: "Active Tables",
  //     value: "18/25",
  //     icon: <Activity size={20} />,
  //     change: "72% occupied",
  //     changeType: "neutral"
  //   },
  //   {
  //     label: "Revenue Growth",
  //     value: "23.4%",
  //     icon: <TrendingUp size={20} />,
  //     change: "vs last month",
  //     changeType: "increase"
  //   }
  // ];

  return (
    <div className="flex bg-app h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Quick Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-surface p-6 rounded-lg shadow-sm border border-line">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-app rounded-lg text-brand-fg">
                    {stat.icon}
                  </div>
                  <span className={`text-[12px] font-[500] px-2 py-1 rounded-full ${stat.changeType === 'increase'
                      ? 'text-success bg-hover'
                      : stat.changeType === 'decrease'
                        ? 'text-error bg-hover'
                        : 'text-fg-secondary bg-app'
                    }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-[24px] font-[600] text-fg mb-1">{stat.value}</h3>
                <p className="text-[14px] text-fg-secondary">{stat.label}</p>
              </div>
            ))}
          </div> */}

          {/* Modules Section */}
          <div className="mb-6">
            <h2 className="text-[20px] leading-[30px] font-[600] font-inter text-fg mb-2">
              System Modules
            </h2>
            <p className="text-[14px] text-fg-secondary mb-6">
              Select a module to access specific functionality
            </p>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <NavLink
                  to={module.path}
                  key={module.id}
                  className="group bg-surface rounded-lg shadow-sm border border-line p-6 hover:shadow-lg hover:border-brand-fg transition-all duration-200 transform hover:-translate-y-1 w-full text-left"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${module.iconBg} ${module.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[18px] leading-[28px] font-[600] text-fg group-hover:text-brand-fg transition-colors">
                        {module.name}
                      </h3>
                      <p className="text-[14px] text-fg-secondary mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <span className="text-[12px] text-fg-secondary font-[500]">
                      {module.stats}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-brand text-on-brand flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      →
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-[18px] leading-[28px] font-[600] text-fg">
                  Sales Performance
                </h3>
                <p className="text-[14px] text-fg-secondary mt-1">
                  Today vs Yesterday comparison
                </p>
              </div>
              <div className="flex items-center gap-4 text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand rounded-full"></div>
                  <span className="text-fg-secondary">Today: Rs. 131,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-line rounded-full"></div>
                  <span className="text-fg-secondary">Yesterday: Rs. 115,000</span>
                </div>
              </div>
            </div>

            <div className="h-64">
              <Line key={theme} data={salesChartData} options={salesChartOptions} />
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}