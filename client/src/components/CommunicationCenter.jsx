import React, { useState } from "react";
import { MailIcon, PhoneIcon, CheckIcon } from "lucide-react";

export const CommunicationCenter = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [communicationMethod, setCommunicationMethod] = useState("email");
  const [recipientInfo, setRecipientInfo] = useState("");
  const [message, setMessage] = useState("");

  // Mock data for invoices
  const invoices = [
    {
      id: "INV-001",
      client: "John Smith",
      date: "2023-06-15",
      amount: "$450.00",
    },
    {
      id: "INV-002",
      client: "Sarah Johnson",
      date: "2023-06-14",
      amount: "$720.00",
    },
    {
      id: "INV-003",
      client: "Michael Brown",
      date: "2023-06-13",
      amount: "$300.00",
    },
    {
      id: "INV-004",
      client: "Emily Davis",
      date: "2023-06-12",
      amount: "$550.00",
    },
    {
      id: "INV-005",
      client: "Robert Wilson",
      date: "2023-06-11",
      amount: "$890.00",
    },
  ];

  const handleSend = () => {
    if (!selectedInvoice || !recipientInfo) {
      alert("Please select an invoice and enter recipient information");
      return;
    }
    // In a real app, this would send the invoice via the selected method
    alert(
      `Invoice ${selectedInvoice} sent successfully via ${communicationMethod}!`
    );
    // Reset form
    setSelectedInvoice(null);
    setRecipientInfo("");
    setMessage("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Send Invoices</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Communication Center
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">
              Select Invoice
            </h3>
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className={`p-4 border-b last:border-b-0 cursor-pointer ${
                      selectedInvoice === invoice.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedInvoice(invoice.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {invoice.id}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.client}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          {invoice.amount}
                        </p>
                        <p className="text-sm text-gray-500">{invoice.date}</p>
                      </div>
                    </div>
                    {selectedInvoice === invoice.id && (
                      <div className="mt-2 flex justify-end">
                        <span className="flex items-center text-blue-600 text-sm">
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Selected
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">
              Send Options
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex space-x-4 mb-4">
                  <button
                    className={`flex-1 py-3 px-4 flex justify-center items-center rounded-md ${
                      communicationMethod === "email"
                        ? "bg-blue-50 border-2 border-blue-500 text-blue-700"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCommunicationMethod("email")}
                  >
                    <MailIcon className="h-5 w-5 mr-2" />
                    Email
                  </button>
                  <button
                    className={`flex-1 py-3 px-4 flex justify-center items-center rounded-md ${
                      communicationMethod === "whatsapp"
                        ? "bg-green-50 border-2 border-green-500 text-green-700"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCommunicationMethod("whatsapp")}
                  >
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    WhatsApp
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {communicationMethod === "email"
                      ? "Email Address"
                      : "Phone Number"}
                  </label>
                  <input
                    type={communicationMethod === "email" ? "email" : "tel"}
                    value={recipientInfo}
                    onChange={(e) => setRecipientInfo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      communicationMethod === "email"
                        ? "client@example.com"
                        : "+1 (555) 123-4567"
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Add a custom message to include with your invoice"
                ></textarea>
              </div>
              <button
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 flex items-center justify-center"
                onClick={handleSend}
                disabled={!selectedInvoice || !recipientInfo}
              >
                {communicationMethod === "email" ? (
                  <>
                    <MailIcon className="h-5 w-5 mr-2" />
                    Send Email
                  </>
                ) : (
                  <>
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    Send via WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
