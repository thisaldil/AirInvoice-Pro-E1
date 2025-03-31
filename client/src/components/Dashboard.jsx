import React from "react";
import { FileTextIcon, FileUpIcon, SendIcon, BoxIcon } from "lucide-react";

function Dashboard({ onNavigate }) {
  const quickActions = [
    {
      id: "upload",
      label: "Upload New Invoice",
      icon: FileUpIcon,
      color: "bg-blue-500",
    },
    {
      id: "templates",
      label: "Manage Templates",
      icon: BoxIcon,
      color: "bg-purple-500",
    },
  ];

  const recentInvoices = [
    {
      id: 1,
      customer: "John Smith",
      date: "2023-06-15",
      amount: "$450.00",
      status: "Sent",
    },
    {
      id: 2,
      customer: "Sarah Johnson",
      date: "2023-06-14",
      amount: "$780.00",
      status: "Draft",
    },
    {
      id: 3,
      customer: "Michael Brown",
      date: "2023-06-12",
      amount: "$1,200.00",
      status: "Sent",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.id)}
            className={`${action.color} text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center">
              <div className="bg-white bg-opacity-30 p-3 rounded-full">
                <action.icon className="w-6 h-6" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-xl font-semibold">{action.label}</h3>
                <p className="text-sm text-white text-opacity-90">
                  {action.id === "upload"
                    ? "Create a new invoice from airline ticket"
                    : "Edit or create company templates"}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
