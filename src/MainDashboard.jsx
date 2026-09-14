import React, { useState } from "react";
import { Line } from "react-chartjs-2";
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

  // Sales chart data
  const salesChartData = {
    labels: ['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
    datasets: [
      {
        label: 'Sales Today',
        data: [12000, 19000, 25000, 32000, 28000, 15000],
        borderColor: '#0F50AA',
        backgroundColor: 'rgba(15, 80, 170, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0F50AA',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Sales Yesterday',
        data: [10000, 16000, 22000, 29000, 25000, 13000],
        borderColor: '#E4E6EA',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#E4E6EA',
        pointBorderColor: '#ffffff',
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
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#383E49',
        bodyColor: '#667085',
        borderColor: '#E4E6EA',
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
          color: '#F0F1F3',
          drawBorder: false
        },
        ticks: {
          color: '#667085',
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
          color: '#667085',
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
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      path: "/posDashboard",
      stats: "145 sales today"
    },
    {
      id: 2,
      name: "KOT Management",
      description: "Kitchen Order Tickets and production",
      icon: <ChefHat size={32} />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      path: "/kot-dashboard",
      stats: "23 pending orders"
    },
    {
      id: 3,
      name: "Inventory",
      description: "Stock management and tracking",
      icon: <Package size={32} />,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      path: "/inventory-dashboard",
      stats: "892 items in stock"
    },
    {
      id: 4,
      name: "Reports & Analytics",
      description: "Sales reports and business insights",
      icon: <BarChart3 size={32} />,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      path: "/analytics",
      stats: "15 reports available"
    },
    {
      id: 5,
      name: "Staff Management",
      description: "Employee management and scheduling",
      icon: <Users size={32} />,
      color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      path: "/staff-dashboard",
      stats: "12 active staff"
    },
    {
      id: 6,
      name: "Store Management",
      description: "Store operations and transfers",
      icon: <Truck size={32} />,
      color: "bg-gradient-to-br from-teal-500 to-teal-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
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
    <div className="flex bg-[#F0F1F3] h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <NavBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Quick Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-[#E4E6EA]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-[#F0F1F3] rounded-lg text-[#0F50AA]">
                    {stat.icon}
                  </div>
                  <span className={`text-[12px] font-[500] px-2 py-1 rounded-full ${stat.changeType === 'increase'
                      ? 'text-[#199D26] bg-[#DDFFE0]'
                      : stat.changeType === 'decrease'
                        ? 'text-[#EF4444] bg-[#FFE6E6]'
                        : 'text-[#667085] bg-[#F0F1F3]'
                    }`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-[24px] font-[600] text-[#383E49] mb-1">{stat.value}</h3>
                <p className="text-[14px] text-[#667085]">{stat.label}</p>
              </div>
            ))}
          </div> */}

          {/* Modules Section */}
          <div className="mb-6">
            <h2 className="text-[20px] leading-[30px] font-[600] font-inter text-[#383E49] mb-2">
              System Modules
            </h2>
            <p className="text-[14px] text-[#667085] mb-6">
              Select a module to access specific functionality
            </p>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <NavLink
                  to={module.path}
                  key={module.id}
                  className="group bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6 hover:shadow-lg hover:border-[#0F50AA] transition-all duration-200 transform hover:-translate-y-1 w-full text-left"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${module.iconBg} ${module.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                      {module.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[18px] leading-[28px] font-[600] text-[#383E49] group-hover:text-[#0F50AA] transition-colors">
                        {module.name}
                      </h3>
                      <p className="text-[14px] text-[#667085] mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#E4E6EA]">
                    <span className="text-[12px] text-[#667085] font-[500]">
                      {module.stats}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#0F50AA] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      →
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-[#E4E6EA] p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-[18px] leading-[28px] font-[600] text-[#383E49]">
                  Sales Performance
                </h3>
                <p className="text-[14px] text-[#667085] mt-1">
                  Today vs Yesterday comparison
                </p>
              </div>
              <div className="flex items-center gap-4 text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0F50AA] rounded-full"></div>
                  <span className="text-[#667085]">Today: Rs. 131,000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#E4E6EA] rounded-full"></div>
                  <span className="text-[#667085]">Yesterday: Rs. 115,000</span>
                </div>
              </div>
            </div>

            <div className="h-64">
              <Line data={salesChartData} options={salesChartOptions} />
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}