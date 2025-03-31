import React, { useCallback, useState } from "react";
import { FileUpIcon, FileIcon, CheckCircleIcon, XIcon } from "lucide-react";

function InvoiceUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a PDF file");
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleProcessInvoice = () => {
    if (!file) return;
    setIsProcessing(true);
    setTimeout(() => {
      const mockInvoiceData = {
        airlineReference: "AB123456",
        passengerName: "John Smith",
        flightDetails: [
          {
            flight: "AA1234",
            from: "New York (JFK)",
            to: "London (LHR)",
            date: "2023-07-15",
            departureTime: "14:30",
            arrivalTime: "02:45 +1",
          },
          {
            flight: "AA1235",
            from: "London (LHR)",
            to: "New York (JFK)",
            date: "2023-07-22",
            departureTime: "10:15",
            arrivalTime: "13:20",
          },
        ],
        ticketPrice: 850.0,
        taxes: 120.0,
        totalAmount: 970.0,
        currency: "USD",
        issueDate: "2023-06-01",
      };
      setIsProcessing(false);
      onUpload(mockInvoiceData);
    }, 2000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Invoice</h1>
      <p className="text-gray-600 mb-8">
        Upload an airline ticket invoice to extract its data and create a new
        invoice with your company template.
      </p>
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <FileUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Drag & Drop your invoice here
          </h3>
          <p className="text-gray-500 mb-6">or</p>
          <label className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md cursor-pointer transition-colors">
            Browse Files
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>
          <p className="text-sm text-gray-500 mt-4">Supported file: PDF</p>
          {error && (
            <div className="mt-4 text-red-500 bg-red-50 p-3 rounded">
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-800">Selected File</h3>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-500"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center p-4 bg-gray-50 rounded-md mb-6">
            <div className="bg-blue-100 p-3 rounded">
              <FileIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="font-medium text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          </div>
          <button
            onClick={handleProcessInvoice}
            disabled={isProcessing}
            className={`w-full py-3 rounded-md font-medium ${
              isProcessing
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Processing..." : "Process Invoice"}
          </button>
        </div>
      )}
    </div>
  );
}

export default InvoiceUpload;
