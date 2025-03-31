import React from "react";
import {
  HomeIcon,
  UploadIcon,
  FileTextIcon,
  SendIcon,
  SettingsIcon,
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: HomeIcon,
    },
    {
      id: "upload",
      label: "Upload Invoice",
      icon: UploadIcon,
    },
    {
      id: "templates",
      label: "Templates",
      icon: FileTextIcon,
    },
    {
      id: "communication",
      label: "Send Invoices",
      icon: SendIcon,
    },
    {
      id: "settings",
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">AirInvoice Pro</h1>
        <p className="text-xs text-gray-500 mt-1">Invoice Management System</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            U
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">User Name</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
