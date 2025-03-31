import React, { useState } from "react";
import { FileUpIcon, FileIcon, XIcon } from "lucide-react";
import * as pdfjs from "pdfjs-dist/build/pdf";

// ✅ Set the PDF.js worker location
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function InvoiceUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [extractedText, setExtractedText] = useState("");

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
        await extractTextFromPDF(selectedFile);
      } else {
        setError("Please upload a PDF file.");
      }
    }
  };

  const extractTextFromPDF = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async function (event) {
        try {
          const typedArray = new Uint8Array(event.target.result);
          const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
          let extractedText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            extractedText += pageText + "\n\n";
          }

          setExtractedText(extractedText);
          onUpload({ extractedText });
        } catch (err) {
          console.error("Error extracting text:", err);
          setError("Failed to extract text from the PDF.");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("PDF processing error:", err);
      setError("An error occurred while processing the PDF.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Invoice</h1>
      <p className="text-gray-600 mb-8">
        Upload an invoice to extract its text.
      </p>

      {!file ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center border-gray-300 hover:border-blue-400">
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
            <h3 className="text-lg font-medium text-gray-800">Extracted Text</h3>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-red-500"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-md mb-6">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {extractedText || "No text extracted"}
            </p>
          </div>
        </
