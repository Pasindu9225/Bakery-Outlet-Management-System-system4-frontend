import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  X,
  ShoppingCart,
  AlertTriangle,
  Info,
  CheckCircle
} from "lucide-react";

import notificationService from "../services/notificationService";

export default function NavBar({ sidebarOpen, setSidebarOpen }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    const notificationTimer = setInterval(fetchNotifications, 30000); // Poll every 30s
    
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(notificationTimer);
      clearInterval(timeTimer);
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order': return <ShoppingCart size={16} className="text-[#0F50AA]" />;
      case 'warning': return <AlertTriangle size={16} className="text-[#F4A100]" />;
      case 'success': return <CheckCircle size={16} className="text-[#51CC5D]" />;
      default: return <Info size={16} className="text-[#667085]" />;
    }
  };

  return (
    <>
      <header className="bg-white shadow-lg border-b border-[#E4E6EA] px-4 sm:px-6 lg:px-8 py-4 flex-shrink-0 z-10 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-[#667085] hover:bg-[#F0F1F3]"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-[24px] leading-[36px] font-[600] font-inter text-[#383E49]">
                Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085]" size={16} />
              <input
                type="text"
                placeholder="Search modules..."
                className="pl-10 pr-4 py-2 border border-[#E4E6EA] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-[#667085] hover:bg-[#F0F1F3] rounded-lg"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.25)] border border-[#E4E6EA] z-50">
                  <div className="p-4 border-b border-[#E4E6EA] flex items-center justify-between">
                    <h3 className="text-[16px] font-[600] text-[#383E49]">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllAsRead}
                        className="text-[12px] text-[#0F50AA] hover:underline"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={() => setNotificationOpen(false)}
                        className="p-1 hover:bg-[#F0F1F3] rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-[#667085]">
                        <Bell size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-[#E4E6EA] hover:bg-[#F8F9FA] cursor-pointer group ${!notification.isRead ? 'bg-blue-50' : ''
                            }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[14px] font-[500] text-[#383E49]">
                                  {notification.title}
                                </h4>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-[#0F50AA] rounded-full"></div>
                                )}
                              </div>
                              <p className="text-[12px] text-[#667085] mb-1">
                                {notification.message}
                              </p>
                              <span className="text-[10px] text-[#667085]">
                                {notification.timeAgo}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 hover:bg-[#F0F1F3] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current Date/Time */}
            <div className="hidden md:block text-right">
              <p className="text-[12px] text-[#667085]">
                {currentTime.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-[10px] text-[#667085] font-[600]">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Notification Overlay - Close when clicking outside */}
        {notificationOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setNotificationOpen(false)}
          />
        )}
      </header>
    </>
  );
}