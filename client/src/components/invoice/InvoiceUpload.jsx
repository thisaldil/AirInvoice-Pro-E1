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

  const extractTextFromPDF = async (file) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("apikey", "K89085700888957");
      formData.append("OCREngine", "2");
      formData.append("isOverlayRequired", "false");

      const response = await axios.post("https://api.ocr.space/parse/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const raw = response.data?.ParsedResults?.[0]?.ParsedText || "";
      console.log("RAW:", raw);

      const bookingRefMatch = raw.match(/Booking Ref:\s*(\d+)/i);
      const airlineRefMatch = raw.match(/Airline Ref:\s*(\d+)/i);
      const bookingReference = bookingRefMatch
        ? bookingRefMatch[1].trim()
        : airlineRefMatch
          ? airlineRefMatch[1].trim()
          : "";

      const passengerNameMatch = raw.match(/P\s+[A-Z]+\/[A-Z]\s+[A-Z]+\s+[A-Z]+/i);
      const passengerName = passengerNameMatch ? passengerNameMatch[0].trim() : "";

      const ticketNumberMatch = raw.match(/Ticket Number\s*(\d+)/i);
      const ticketNumber = ticketNumberMatch ? ticketNumberMatch[1].trim() : "";

      const flightRegex = /(G9\s+\d{3,4})\s+([\s\S]*?)(?=G9\s+\d{3,4}|$)/g;
      let flightMatch;
      const flightDetails = [];

      while ((flightMatch = flightRegex.exec(raw)) !== null) {
        const flightNumber = flightMatch[1].trim();
        const section = flightMatch[2];

        const airline = section.match(/AirArabia|Emirates|Qatar Airways|FlyDubai|Etihad/i)?.[0] || "";
        const status = section.match(/Status:\s*(.*)/i)?.[1]?.trim() || "Confirmed";

        const dateMatches = [...section.matchAll(/(\d{2}\s+[A-Z]{3}\s+\d{4})/g)];
        const departureDate = dateMatches[0]?.[1] || "";
        const arrivalDate = dateMatches[1]?.[1] || departureDate;

        const timeMatches = [...section.matchAll(/(\d{2}:\d{2})/g)];
        const departureTime = timeMatches[0]?.[1] || "";
        const arrivalTime = timeMatches[1]?.[1] || "";

        const fromMatch = section.match(/\bCMB\b/)?.[0] || "";
        const toMatch = section.match(/\bSHJ\b/)?.[0] || "";

        const terminal = section.match(/Terminal:\s*(.*)/i)?.[1]?.trim() || "";
        const travelClass = section.match(/ECONOMY|BUSINESS|FIRST/i)?.[0] || "";

        flightDetails.push({
          flightNumber,
          airline,
          from: fromMatch,
          to: toMatch,
          departureDate,
          arrivalDate,
          departureTime,
          arrivalTime,
          departureTerminal: terminal,
          class: travelClass,
          status,
          ticketNumber,
        });
      }

      // Sort by date+time
      flightDetails.sort((a, b) => {
        const aDT = new Date(`${a.departureDate} ${a.departureTime}`);
        const bDT = new Date(`${b.departureDate} ${b.departureTime}`);
        return aDT - bDT;
      });

      const ssrSection = raw.split("SSR Description")?.[1] || "";

      if (flightDetails.length > 0) {
        flightDetails[0].seatNumber = ssrSection.match(/SEAT\s*(\S+)/i)?.[1] || "";
        flightDetails[0].meal = ssrSection.match(/MEAL\s*(\S+)/i)?.[1] || "";
        flightDetails[0].baggageAllowance = ssrSection.match(/BAGGAGE\s*(.*)/i)?.[1]?.trim() || "";
      }

      const formattedInvoice = {
        passengerName,
        bookingReference,
        transactionId: ticketNumber,
        flightDetails,
      };

      console.log("details", flightDetails);
      onUpload(formattedInvoice);
    } catch (err) {
      console.error("OCR.space error:", err);
      setError("An error occurred while extracting text from PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessInvoice = () => {
    if (!file) return;
    extractTextFromPDF(file);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Invoice</h1>
      <p className="text-gray-600 mb-8">Upload an invoice to extract its text.</p>

      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"}`}
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
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-800">Selected File</h3>
            <button onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500">
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
              className={`px-4 py-2 rounded-md font-medium ${isProcessing ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
            >
              {isProcessing ? "Processing..." : "Extract Text"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceUpload;
