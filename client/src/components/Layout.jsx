import React from "react";
import {
  HomeIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  BoxIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Layout({ children, currentPage, onNavigate }) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: HomeIcon,
    },
    {
      id: "upload",
      label: "New Invoice",
      icon: FileTextIcon,
    },
    {
      id: "templates",
      label: "Templates",
      icon: BoxIcon,
    },
    {
      id: "settings",
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">AirInvoice</h1>
          <p className="text-sm text-gray-500">Invoice Management</p>
        </div>
        <nav className="mt-6">
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center w-full px-6 py-3 text-left ${currentPage === item.id
                    ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-red-600">
            <LogOutIcon className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

export default Layout;
