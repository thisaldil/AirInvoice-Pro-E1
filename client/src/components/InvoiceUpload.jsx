import React, { useState } from "react";
import { UploadIcon, FileIcon, CheckIcon, XIcon } from "lucide-react";

const InvoiceUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setTimeout(() => {
      setExtractedData({
        ticketNumber: "TKT12345678",
        passengerName: "John Smith",
        departure: "New York (JFK)",
        destination: "London (LHR)",
        departureDate: "2023-07-15",
        returnDate: "2023-07-22",
        airline: "British Airways",
        flightNumber: "BA178",
        amount: "$750.00",
        taxes: "$120.00",
        total: "$870.00",
      });
    }, 1500);
  };

  const handleProcessInvoice = () => {
    alert("Invoice processed successfully!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Upload Invoice</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Upload Air Ticket Invoice
          </h2>
          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop your invoice PDF here
              </p>
              <p className="text-gray-500 text-sm mb-4">or</p>
              <label className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <FileIcon className="h-8 w-8 text-blue-500 mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {Math.round(uploadedFile.size / 1024)} KB
                  </p>
                </div>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => {
                    setUploadedFile(null);
                    setExtractedData(null);
                  }}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceUpload;
