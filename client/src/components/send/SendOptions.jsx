import React, { useState } from "react";
import axios from "axios";
import {
  DownloadIcon,
  MailIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "lucide-react";

function SendOptions({ invoice, onBack }) {
  const [previewUrl, setPreviewUrl] = useState(
    "https://images.unsplash.com/photo-1601581987809-a874a81309c9?q=80&w=1000&auto=format&fit=crop"
  );
  const [sendMethod, setSendMethod] = useState(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (sendMethod === "email") {
        await axios.post("http://localhost:5000/user/sendInvoiceEmail", {
          email,
          // pdfUrl: invoice?.pdfUrl,
          pdfUrl: "https://res.cloudinary.com/dnvppgx1r/image/upload/v1743588156/Invoice_2086261185_uf4afd.pdf",
        });
      }
      setIsSent(true);
      setTimeout(() => setIsSent(false), 3000);
    } catch (err) {
      alert("Failed to send invoice. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Send Invoice</h1>
      <p className="text-gray-600 mb-8">
        Your invoice is ready! Preview it below and choose how you'd like to
        send it.
      </p>
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-medium text-gray-800">Invoice Preview</h2>
            <button className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
              <DownloadIcon className="w-4 h-4 mr-1" />
              Download PDF
            </button>
          </div>
          <div className="p-4 flex justify-center">
            <img
              src={previewUrl}
              alt="Invoice Preview"
              className="max-w-full border shadow-sm rounded"
            />
          </div>
        </div>
        <div className="md:w-1/2 bg-white rounded-lg shadow-md">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-medium text-gray-800">Send Options</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  How would you like to send this invoice?
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setSendMethod("email")}
                    className={`flex items-center w-full p-3 border rounded-md ${
                      sendMethod === "email"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mr-4 ${
                        sendMethod === "email" ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <MailIcon
                        className={`w-5 h-5 ${
                          sendMethod === "email"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        Send via Email
                      </h4>
                      <p className="text-sm text-gray-500">
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
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full mr-4 ${
                        sendMethod === "whatsapp"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <PhoneIcon
                        className={`w-5 h-5 ${
                          sendMethod === "whatsapp"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        Send via WhatsApp
                      </h4>
                      <p className="text-sm text-gray-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              {sendMethod === "whatsapp" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (123) 456-7890"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              {isSent && (
                <div className="bg-green-50 text-green-800 p-3 rounded-md flex items-center">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  <span>Invoice sent successfully!</span>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <button
                  onClick={onBack}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
