import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Users,
  HomeIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  BoxIcon,
  FilesIcon,
  Menu,
  X,
} from "lucide-react";
import logo from "../images/logo.png";
import darklogo from "../images/drklogo.png";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { path: "/dashboard/upload", label: "New Invoice", icon: FileTextIcon },
    { path: "/dashboard/templates", label: "Templates", icon: BoxIcon },
    { path: "/dashboard/invoices", label: "All Invoices", icon: FilesIcon },
    { path: "/dashboard/crm", label: "CRM", icon: Users },
    { path: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow px-4 py-3 flex justify-between items-center">
        <img src={logo} alt="logo" className="h-6 dark:hidden" />
        <img src={darklogo} alt="logo" className="h-6 hidden dark:block" />
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed pt-10 md:pt-0 md:relative z-40 top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-md transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="hidden md:block p-6 border-b border-gray-200 dark:border-gray-700">
          <img src={logo} alt="logo" className="max-w-32 block dark:hidden" />
          <img src={darklogo} alt="dark logo" className="max-w-32 hidden dark:block" />
        </div>

        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center w-full px-6 py-3 text-left transition-all ${
                    location.pathname === item.path
                      ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600 dark:border-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOutIcon className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 pt-20 md:pt-8 bg-white dark:bg-gray-900">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
