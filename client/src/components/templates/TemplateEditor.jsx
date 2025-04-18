import React, { useState, useEffect, useRef } from "react";
import { SaveIcon, XIcon, PlusIcon, LayoutIcon, TypeIcon } from "lucide-react";
import logo from "../../images/logo-placeholder.jpg";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function TemplateEditor({ invoiceData, onSave, onCancel }) {
  const [templateName, setTemplateName] = useState("New Template");
  const [companyName, setCompanyName] = useState("Your Company Name");
  const [companyLogo, setCompanyLogo] = useState(logo);
  const [companyAddress, setCompanyAddress] = useState(
    "123 Business Street\nCity, State 12345\nPhone: (123) 456-7890\nEmail: info@yourcompany.com"
  );
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [showFooter, setShowFooter] = useState(true);
  const [footerText, setFooterText] = useState("Thank you for your business!");
  const [selectedSection, setSelectedSection] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const userId = localStorage.getItem("userId");
  const previewRef = useRef();
  const [uploading, setUploading] = useState(false);
  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      axios
        .get(`http://localhost:5000/template/getTemplateById/${id}`)
        .then((res) => {
          const t = res.data;
          setTemplateName(t.name);
          setCompanyName(t.company.name);
          setCompanyLogo(t.company.logo);
          setCompanyAddress(t.company.address);
          setAccentColor(t.design.accentColor);
          setShowFooter(t.design.showFooter);
          setFooterText(t.design.footerText);
        })
        .catch((err) => {
          console.error("Error loading template:", err);
          alert("Failed to load template for editing.");
          navigate("/template-manager");
        });
    }
  }, [id]);

  const handleSave = async () => {
    const updatedTemplate = {
      userId,
      name: templateName,
      description: "Custom invoice template",
      isDefault: false,
      company: {
        name: companyName,
        logo: companyLogo,
        address: companyAddress,
      },
      design: {
        accentColor,
        showFooter,
        footerText,
      },
    };

    setUploading(true);

    try {
      if (invoiceData) {
        const canvas = await html2canvas(previewRef.current);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "pt", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        const pdfBlob = pdf.output("blob");
        const formData = new FormData();
        formData.append("file", pdfBlob);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
          formData
        );

        const cloudinaryUrl = cloudinaryRes.data.secure_url;

        const saveInvoiceRes = await axios.post(
          "http://localhost:5000/invoice/saveInvoiceDetails",
          {
            userId,
            pdfUrl: cloudinaryUrl,
            template: {
              _id: id,
              company: {
                name: companyName,
                logo: companyLogo,
                address: companyAddress,
              },
            },
            invoiceDetails: {
              passengerName: invoiceData.passengerName,
              passportNumber: invoiceData.passportNumber,
              nationality: invoiceData.nationality,
              dob: invoiceData.dob,
              gender: invoiceData.gender,
            },
            priceDetails: {
              totalAmount: invoiceData.totalAmount,
              paymentMethod: invoiceData.paymentMethod,
              transactionId: invoiceData.transactionId,
            },
          }
        );

        onSave?.({
          template: updatedTemplate,
          invoiceId: saveInvoiceRes.data.invoice._id,
        });
        navigate("/dashboard/send");
        return;
      }

      let response;
      if (isEditing) {
        response = await axios.put(
          `http://localhost:5000/template/updateTemplate/${id}`,
          updatedTemplate
        );
        alert("Template updated successfully!");
      } else {
        response = await axios.post(
          "http://localhost:5000/template/createTemplate",
          updatedTemplate
        );
        alert("Template created successfully!");
      }

      onSave?.(response.data);
      navigate("/dashboard/templates");
    } catch (err) {
      console.error("Failed to save template or PDF:", err);
      alert("Error saving template or uploading PDF. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCompanyLogo(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Template Editor
        </h1>
        <div className="flex space-x-3 items-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center text-gray-800 dark:text-white"
            disabled={uploading}
          >
            <XIcon className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${
              uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            {uploading
              ? "Loading..."
              : invoiceData
              ? "Save & Continue"
              : "Save Template"}
          </button>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Template Preview */}
        <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="font-medium text-gray-800 dark:text-white">
              Preview
            </h2>
          </div>
          <div className="p-8 text-gray-800 dark:text-white" ref={previewRef}>
            {/* Invoice Template Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              {/* Header */}
              <div
                className={`p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start ${
                  selectedSection === "header" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedSection("header")}
              >
                <div>
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    className="max-h-16 mb-2"
                  />
                  <h2
                    className="text-xl font-bold"
                    style={{ color: accentColor }}
                  >
                    {companyName}
                  </h2>
                </div>
                <div className="text-right">
                  <h1
                    className="text-2xl font-bold mb-1"
                    style={{ color: accentColor }}
                  >
                    INVOICE
                  </h1>
                  <p className="text-gray-500 dark:text-gray-300">
                    #INV-2023-001
                  </p>
                  <p className="text-gray-500 dark:text-gray-300">
                    {new Date().toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Company & Client Info */}
              <div
                className={`p-6 grid grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 ${
                  selectedSection === "info" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedSection("info")}
              >
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
                    From
                  </h3>
                  <div className="whitespace-pre-line">{companyAddress}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
                    To
                  </h3>
                  <p className="font-medium flex justify-between">
                    {invoiceData?.passengerName}
                  </p>
                  <p className="flex justify-between">
                    Passport: {invoiceData?.passportNumber || "--"}
                  </p>
                  <p className="flex justify-between">
                    Nationality: {invoiceData?.nationality || "--"}
                  </p>
                  <p className="flex justify-between">
                    DOB: {invoiceData?.dob || "--"}
                  </p>
                  <p className="flex justify-between">
                    Gender: {invoiceData?.gender || "--"}
                  </p>
                </div>
              </div>

              {/* Flight Details */}
              <div
                className={`p-6 border-b border-gray-200 dark:border-gray-700 ${
                  selectedSection === "flights" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedSection("flights")}
              >
                <h3 className="font-medium mb-4" style={{ color: accentColor }}>
                  Flight Details
                </h3>
                {invoiceData?.flightDetails?.map((flight, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-gray-800 dark:text-white"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Flight #{i + 1}</h4>
                      <span
                        className="text-sm font-medium"
                        style={{ color: accentColor }}
                      >
                        {flight.flightNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          From
                        </p>
                        <p className="font-medium">{flight.from}</p>
                        <p className="text-sm">
                          {flight.departureDate} {flight.departureTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          To
                        </p>
                        <p className="font-medium">{flight.to}</p>
                        <p className="text-sm">
                          {flight.arrivalDate} {flight.arrivalTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                      Seat: {flight.seatNumber} | Class: {flight.class} |
                      Baggage: {flight.baggageAllowance}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div
                className={`p-6 border-b border-gray-200 dark:border-gray-700 ${
                  selectedSection === "pricing" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedSection("pricing")}
              >
                <h3 className="font-medium mb-4" style={{ color: accentColor }}>
                  Pricing Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount</span>
                    <span>{invoiceData?.totalAmount || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span>{invoiceData?.paymentMethod || "--"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span>{invoiceData?.transactionId || "--"}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              {showFooter && (
                <div
                  className={`p-6 text-center ${
                    selectedSection === "footer" ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedSection("footer")}
                  style={{ backgroundColor: accentColor + "10" }}
                >
                  <p className="text-gray-700 dark:text-white">{footerText}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editor Controls */}
        <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="font-medium text-gray-800 dark:text-white">
              Template Settings
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1   dark:text-white">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1  dark:text-white">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white">
                Company Logo
              </label>
              <div className="flex items-center mb-2  dark:text-white">
                <img
                  src={companyLogo}
                  alt="Logo Preview"
                  className="h-10 mr-4"
                />
                <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded cursor-pointer dark:bg-gray-700 dark:text-white">
                  Change Logo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1  dark:text-white">
                Company Address
              </label>
              <textarea
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1  dark:text-white">
                Accent Color
              </label>
              <div className="flex items-center ">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded mr-4 cursor-pointer "
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showFooter"
                checked={showFooter}
                onChange={(e) => setShowFooter(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label
                htmlFor="showFooter"
                className="ml-2 text-sm text-gray-700  dark:text-white"
              >
                Show Footer
              </label>
            </div>
            {showFooter && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1  dark:text-white ">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 dark:text-white">
                Template Sections
              </h3>
              <div className="space-y-2  dark:text-white">
                {[
                  {
                    id: "header",
                    label: "Header",
                    icon: LayoutIcon,
                  },
                  {
                    id: "info",
                    label: "Company & Client Info",
                    icon: TypeIcon,
                  },
                  {
                    id: "flights",
                    label: "Flight Details",
                    icon: PlusIcon,
                  },
                  {
                    id: "pricing",
                    label: "Pricing",
                    icon: PlusIcon,
                  },
                  {
                    id: "footer",
                    label: "Footer",
                    icon: PlusIcon,
                  },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`flex items-center w-full p-2 rounded-md text-left  ${
                      selectedSection === section.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-white"
                    }`}
                  >
                    <section.icon className="w-4 h-4 mr-2" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TemplateEditor;
