import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  DownloadIcon,
  MailIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "lucide-react";
import toast from 'react-hot-toast';

function SendOptions({ invoice, onBack }) {
  const [invoiceData, setInvoiceData] = useState(null);
  const [sendMethod, setSendMethod] = useState(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [countryCodes, setCountryCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await axios.get(
          `https://air-invoice-server.vercel.app/invoice/getInvoiceDetailsByInvoiceId/${invoice.invoiceId}`
        );
        setInvoiceData(res.data);
      } catch (err) {
        console.error("Failed to load invoice preview", err);
      }
    };

    if (invoice?.invoiceId) {
      fetchInvoice();
    }
  }, [invoice?.invoiceId]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (sendMethod === "email") {
        await axios.post("https://air-invoice-server.vercel.app/invoice/sendInvoiceEmail", {
          email,
          pdfUrl: invoiceData?.pdfUrl,
        });
      }
      if (sendMethod === "whatsapp") {
        const message = `Dear Customer,\n\nThis is ${invoice.template.company.name}. Please find your invoice below:\n\n${invoiceData?.pdfUrl}\n\nThank you for your business.`;
        const sanitizedPhone = `${selectedCode}${phone.replace(/\D/g, "")}`;
        const whatsappLink = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(
          message
        )}`;
        window.open(whatsappLink, "_blank");
      }
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
      toast.success("Invoice sent successfully!");
    } catch (err) {
      toast.error("Failed to send invoice. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(invoiceData.pdfUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Create meaningful filename with booking reference and date
      const bookingRef = invoiceData?.invoiceDetails.bookingReference || 'DRAFT';
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `${bookingRef}-invoice-${currentDate}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const res = await axios.get("https://restcountries.com/v3.1/all");
        const data = res.data;

        const codes = data
          .map((country) => ({
            name: country.name.common,
            code:
              country.idd?.root && country.idd?.suffixes
                ? `${country.idd.root}${country.idd.suffixes[0]}`
                : null,
          }))
          .filter((c) => c.code);

        const sortedCodes = codes.sort((a, b) => a.name.localeCompare(b.name));
        setCountryCodes(sortedCodes);

        const sriLanka = sortedCodes.find((c) => c.code === "+94");
        if (sriLanka) {
          setSelectedCode(sriLanka.code);
        }
      } catch (error) {
        console.error("Error fetching country codes:", error);
      }
    };

    fetchCountryCodes();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Send Invoice
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Your invoice is ready! Preview it below and choose how you'd like to
        send it.
      </p>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
            <h2 className="font-medium text-gray-800 dark:text-white">
              Invoice Preview
            </h2>
            {invoiceData?.pdfUrl && (
              <button
                onClick={handleDownload}
                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
              >
                <DownloadIcon className="w-4 h-4 mr-1" />
                {isDownloading ? "Downloading..." : "Download Invoice"}
              </button>
            )}
          </div>
          <div className="p-4 flex justify-center">
            {invoiceData?.pdfUrl ? (
              <iframe
                src={invoiceData.pdfUrl}
                title="PDF Preview"
                width="100%"
                height="500px"
                className="border rounded"
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-300">
                Loading preview...
              </p>
            )}
          </div>
        </div>

        <div className="md:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="font-medium text-gray-800 dark:text-white">
              Send Options
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  How would you like to send this invoice?
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSendMethod("email")}
                    className={`flex items-center w-full p-3 border rounded-md ${
                      sendMethod === "email"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mr-4 ${
                        sendMethod === "email"
                          ? "bg-blue-100"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <MailIcon
                        className={`w-5 h-5 ${
                          sendMethod === "email"
                            ? "text-blue-600"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Send via Email
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send the invoice directly to your client's email address
                      </p>
                    </div>
                    {sendMethod === "email" && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </button>

                  <button
                    onClick={() => setSendMethod("whatsapp")}
                    className={`flex items-center w-full p-3 border rounded-md ${
                      sendMethod === "whatsapp"
                        ? "border-green-500 bg-green-50 dark:bg-green-900"
                        : "border-gray-300 dark:border-gray-600 hover:border-green-300 hover:bg-green-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mr-4 ${
                        sendMethod === "whatsapp"
                          ? "bg-green-100"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <PhoneIcon
                        className={`w-5 h-5 ${
                          sendMethod === "whatsapp"
                            ? "text-green-600"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        Send via WhatsApp
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send the invoice through WhatsApp to your client's phone
                        number
                      </p>
                    </div>
                    {sendMethod === "whatsapp" && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>

              {sendMethod === "email" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                  />
                </div>
              )}

              {sendMethod === "whatsapp" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedCode}
                      onChange={(e) => setSelectedCode(e.target.value)}
                      className="w-1/3 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="712345678"
                      className="w-2/3 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {isSent && (
                <div className="bg-green-50 dark:bg-green-800 text-green-800 dark:text-green-200 p-3 rounded-md flex items-center">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  <span>Invoice sent successfully!</span>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={onBack}
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleSend}
                  disabled={
                    !sendMethod ||
                    (sendMethod === "email" && !email) ||
                    (sendMethod === "whatsapp" && !phone) ||
                    isSending
                  }
                  className={`px-6 py-2 rounded-md ${
                    !sendMethod ||
                    (sendMethod === "email" && !email) ||
                    (sendMethod === "whatsapp" && !phone) ||
                    isSending
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isSending ? "Sending..." : "Send Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SendOptions;
