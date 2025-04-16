import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  HomeIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  BoxIcon,
  FilesIcon,
} from "lucide-react";
import logo from "../images/logo.png";
import darklogo from "../images/drklogo.png";

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: HomeIcon,
    },
    {
      path: "/dashboard/upload",
      label: "New Invoice",
      icon: FileTextIcon,
    },
    {
      path: "/dashboard/templates",
      label: "Templates",
      icon: BoxIcon,
    },
    {
      path: "/dashboard/invoices",
      label: "All Invoices",
      icon: FilesIcon,
    },
    {
      path: "/dashboard/settings",
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md relative">
        <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Light logo */}
          <img src={logo} alt="logo" className="max-w-32 block dark:hidden" />

          {/* Dark logo */}
          <img
            src={darklogo}
            alt="dark logo"
            className="max-w-32 hidden dark:block"
          />
        </div>

        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => navigate(item.path)}
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
      <div className="flex-1 overflow-auto p-8 bg-white dark:bg-gray-900">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
