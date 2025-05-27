import React, { useEffect, useState } from "react";
import { FileTextIcon, FileUpIcon, SendIcon, BoxIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    // Fetch recent invoices
    fetch("https://air-invoice-server.vercel.app/invoice/recent")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((inv) => ({
          id: inv._id,
          customer: inv.invoiceDetails?.passengerName || "N/A",
          passport: inv.invoiceDetails?.passportNumber || "N/A",
          nationality: inv.invoiceDetails?.nationality || "N/A",
          amount: inv.priceDetails?.totalAmount
            ? `$${inv.priceDetails.totalAmount}`
            : "N/A",
          date: inv.createdAt
            ? new Date(inv.createdAt).toLocaleDateString()
            : "N/A",
          status: "Sent",
        }));
        setRecentInvoices(formatted);
      })
      .catch((err) => {
        console.error("Failed to load recent invoices", err);
      });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>
        {user && (
          <div className="flex items-center space-x-3 ">
            <span className="hidden md:block text-gray-700 font-medium dark:text-white">
              {user.name}
            </span>
            <img
              src={user.picture
                .replace("=s96-c", "")
                .replace("http://", "https://")}
              alt={user.name}
              className="w-10 h-10 object-cover rounded-full border border-gray-300 "
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Link
          to={`/dashboard/upload`}
          className='bg-blue-500 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'
        >
          <div className="flex items-center">
            <div className="bg-white bg-opacity-30 p-3 rounded-full">
              <FileUpIcon className="w-6 h-6" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-xl font-semibold">Upload New Invoice</h3>
              <p className="text-sm text-white text-opacity-90">
                Create a new invoice from airline ticket
              </p>
            </div>
          </div>
        </Link>
        <Link
          to={`/dashboard/templates`}
          className='bg-purple-500 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow'
        >
          <div className="flex items-center">
            <div className="bg-white bg-opacity-30 p-3 rounded-full">
              <BoxIcon className="w-6 h-6" />
            </div>
            <div className="ml-4 text-left">
              <h3 className="text-xl font-semibold">Manage Templates</h3>
              <p className="text-sm text-white text-opacity-90">
                Create a new invoice from airline ticket
              </p>
            </div>
          </div>
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 dark:bg-gray-700 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Recent Invoices
          </h2>
          <button className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                  Customer
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                  Amount
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-sm font-medium text-gray-500 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="py-4 px-4 text-sm text-gray-800 dark:text-white">
                    {invoice.customer}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {invoice.date}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-800 font-medium dark:text-white">
                    {invoice.amount}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${invoice.status === "Sent"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                      <FileTextIcon className="w-4 h-4" />
                    </button>
                    <button className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                      <SendIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {stat.label}
            </p>
            <div className="flex justify-between items-end">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {stat.value}
              </h3>
              <span
                className={`text-sm ${stat.change.startsWith("+")
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
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
