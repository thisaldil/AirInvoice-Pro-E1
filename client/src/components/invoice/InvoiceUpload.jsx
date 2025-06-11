import React, { useCallback, useState } from "react";
import { FileUpIcon, FileIcon, CheckCircleIcon, XIcon } from "lucide-react";
import axios from "axios";

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
        setFile(null);
        setError("Please upload a valid PDF file.");
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
        setFile(null);
        setError("Please upload a valid PDF file.");
      }
    }
  };

  const processTicket = async (file) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("ticket", file);

      const response = await axios.post(
        "https://air-invoice-server.vercel.app/ocr/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data) {
        onUpload(response.data);
      } else {
        throw new Error("Failed to extract ticket details");
      }
    } catch (err) {
      console.error("Ticket processing error:", err);
      setError("Failed to process the ticket. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessInvoice = () => {
    if (!file) return;
    processTicket(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
        Upload Air Ticket
      </h1>
      <p className="text-gray-600 mb-8 dark:text-white">
        Upload an air ticket to extract flight details.
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
          <FileUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4 dark:text-white" />
          <h3 className="text-xl font-medium text-gray-700 mb-2 dark:text-white">
            Drag & Drop your ticket here
          </h3>
          <p className="text-gray-500 mb-6">or</p>
          <label className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md cursor-pointer transition-colors dark:text-white">
            Browse Files
            <input
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>
          <p className="text-sm text-gray-500 mt-4 dark:text-white">
            Supported file: PDF
          </p>
          {error && (
            <div className="mt-4 text-red-500 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Selected Ticket
            </h3>
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
          <div className="flex justify-end">
            <button
              onClick={handleProcessInvoice}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-md font-medium ${
                isProcessing
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isProcessing ? "Processing..." : "Extract Details"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceUpload;
