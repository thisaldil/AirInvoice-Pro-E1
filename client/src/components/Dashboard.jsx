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
      {/* Quick Actions */}
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
      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Recent Invoices</h2>
          <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  Customer
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  Amount
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-4 text-sm text-gray-800">
                    {invoice.customer}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {invoice.date}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-800 font-medium">
                    {invoice.amount}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === "Sent"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-blue-500 hover:text-blue-700 mr-3">
                      <FileTextIcon className="w-4 h-4" />
                    </button>
                    <button className="text-green-500 hover:text-green-700">
                      <SendIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Invoices This Month",
            value: "24",
            change: "+12%",
          },
          {
            label: "Total Revenue",
            value: "$12,450",
            change: "+8%",
          },
          {
            label: "Pending Invoices",
            value: "3",
            change: "-2",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <span
                className={`text-sm ${
                  stat.change.startsWith("+")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Dashboard;
