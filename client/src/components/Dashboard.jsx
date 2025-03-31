import React from "react";
import {
  FileTextIcon,
  SendIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";

const Dashboard = () => {
  // Mock data for the dashboard
  const stats = [
    {
      title: "Total Invoices",
      value: "124",
      icon: FileTextIcon,
      color: "bg-blue-500",
    },
    {
      title: "Sent Today",
      value: "8",
      icon: SendIcon,
      color: "bg-green-500",
    },
    {
      title: "Completed",
      value: "96",
      icon: CheckCircleIcon,
      color: "bg-purple-500",
    },
    {
      title: "Pending",
      value: "28",
      icon: AlertCircleIcon,
      color: "bg-yellow-500",
    },
  ];

  const recentInvoices = [
    {
      id: "INV-001",
      client: "John Smith",
      date: "2023-06-15",
      amount: "$450.00",
      status: "Sent",
    },
    {
      id: "INV-002",
      client: "Sarah Johnson",
      date: "2023-06-14",
      amount: "$720.00",
      status: "Pending",
    },
    {
      id: "INV-003",
      client: "Michael Brown",
      date: "2023-06-13",
      amount: "$300.00",
      status: "Completed",
    },
    {
      id: "INV-004",
      client: "Emily Davis",
      date: "2023-06-12",
      amount: "$550.00",
      status: "Sent",
    },
    {
      id: "INV-005",
      client: "Robert Wilson",
      date: "2023-06-11",
      amount: "$890.00",
      status: "Completed",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-full`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </h2>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Recent Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {invoice.client}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : invoice.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
