import React, { useState, useEffect, useRef } from "react";
import {
  SaveIcon,
  XIcon,
  PlusIcon,
  LayoutIcon,
  TypeIcon,
  SunIcon,
  MoonIcon,
} from "lucide-react";
import logo from "../../images/logo-placeholder.jpg";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { pdf } from "@react-pdf/renderer";
import PdfInvoice from "../PdfInvoice";
import toast from "react-hot-toast";

function TemplateEditor({ invoiceData, onSave, onCancel }) {
  // Internal theme state - no external context needed
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme || "light";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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
        .get(
          `https://air-invoice-server.vercel.app/template/getTemplateById/${id}`
        )
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
          toast.error("Failed to load template for editing.");
          navigate("/template-manager");
        });
    }
  }, [id]);

  const checkDuplicateInvoice = async (userId, bookingRef) => {
    try {
      const { data } = await axios.get(
        `https://air-invoice-server.vercel.app/invoice/getInvoiceDetailsByUserId/${userId}`
      );
      return (
        Array.isArray(data) &&
        data.some((inv) => inv?.invoiceDetails?.bookingReference === bookingRef)
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        return false;
      }
      console.error("Error checking duplicates:", error);
      throw new Error("Unable to verify existing invoices");
    }
  };

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
        const bookingRef = invoiceData.bookingReference || "DRAFT";
        const currentDate = new Date().toISOString().split("T")[0];
        const fileName = `${bookingRef}-invoice-${currentDate}.pdf`;

        let duplicateExists = false;
        try {
          duplicateExists = await checkDuplicateInvoice(userId, bookingRef);
        } catch (err) {
          toast.error(err.message);
          setUploading(false);
          return;
        }

        if (duplicateExists) {
          const confirmed = window.confirm(
            "An invoice with the same booking reference already exists. Do you want to continue anyway?"
          );
          if (!confirmed) {
            toast.error("Invoice creation cancelled.");
            setUploading(false);
            return;
          } else {
            toast.warning("Proceeding despite duplicate booking reference.");
          }
        }

        const blob = await pdf(
          <PdfInvoice
            invoiceData={invoiceData}
            templateData={updatedTemplate}
          />
        ).toBlob();

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", blob, fileName);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("resource_type", "raw");

        const cloudinaryRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const cloudinaryUrl = cloudinaryRes.data.secure_url;

        const saveInvoiceRes = await axios.post(
          "https://air-invoice-server.vercel.app/invoice/saveInvoiceDetails",
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
              bookingReference: bookingRef,
              passengerName: invoiceData.passengerName,
              passengers: invoiceData.passengers || [],
            },
            priceDetails: {
              totalAmount: invoiceData.totalAmount,
              transactionId: invoiceData.transactionId,
              currency: invoiceData.currency,
              paymentMethod: invoiceData.paymentMethod,
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
          `https://air-invoice-server.vercel.app/template/updateTemplate/${id}`,
          updatedTemplate
        );
        toast.success("Template updated successfully!");
      } else {
        response = await axios.post(
          "https://air-invoice-server.vercel.app/template/createTemplate",
          updatedTemplate
        );
        toast.success("Template created successfully!");
      }

      onSave?.(response.data);
      navigate("/dashboard/templates");
    } catch (err) {
      console.error("Failed to save template or PDF:", err);
      toast.error("Error saving template or uploading PDF. Please try again.");
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

  const sectionRefs = {
    header: useRef(null),
    info: useRef(null),
    flights: useRef(null),
    pricing: useRef(null),
    footer: useRef(null),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Template Editor
          </h1>
          <div className="flex flex-col md:flex-row md:space-x-3 items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-2 md:mb-0"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <MoonIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <SunIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center mb-2 md:mb-0 transition-colors"
              disabled={uploading}
            >
              <XIcon className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-md flex items-center transition-colors ${
                uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <SaveIcon className="w-8 h-8 md:w-4 md:h-4 mr-2" />
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
          <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors">
            <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="font-medium text-gray-800 dark:text-gray-200">
                Preview
              </h2>
            </div>
            <div className="p-8 overflow-auto" ref={previewRef}>
              {/* Invoice Template Preview */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-md overflow-visible bg-white dark:bg-gray-800">
                {/* Header */}
                <div
                  ref={sectionRefs.header}
                  className={`p-6 border-b border-gray-200 dark:border-gray-600 flex justify-between items-start cursor-pointer transition-all ${
                    selectedSection === "header"
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
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
                    <p className="text-gray-500 dark:text-gray-400">
                      Booking Ref: {invoiceData?.bookingReference || ""}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
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
                  ref={sectionRefs.info}
                  className={`p-6 grid grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-600 cursor-pointer transition-all ${
                    selectedSection === "info"
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                  }`}
                  onClick={() => setSelectedSection("info")}
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      From
                    </h3>
                    <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                      {companyAddress}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      To
                    </h3>
                    {Array.isArray(invoiceData?.passengerName) &&
                    invoiceData.passengerName.length > 0 ? (
                      invoiceData.passengerName.map((name, idx) => (
                        <div
                          key={idx}
                          className="mb-3 border-b border-gray-200 dark:border-gray-600 pb-2 last:border-none last:pb-0"
                        >
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {name}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Passport:{" "}
                            {invoiceData.passengers?.[idx]?.passportNumber ||
                              "--"}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Nationality:{" "}
                            {invoiceData.passengers?.[idx]?.nationality || "--"}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            DOB: {invoiceData.passengers?.[idx]?.dob || "--"}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Gender:{" "}
                            {invoiceData.passengers?.[idx]?.gender || "--"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No passenger details available.
                      </p>
                    )}
                  </div>
                </div>

                {/* Flight Details */}
                <div
                  ref={sectionRefs.flights}
                  className={`p-6 border-b border-gray-200 dark:border-gray-600 cursor-pointer transition-all ${
                    selectedSection === "flights"
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                  }`}
                  onClick={() => setSelectedSection("flights")}
                >
                  <h3
                    className="font-medium mb-4"
                    style={{ color: accentColor }}
                  >
                    Flight Details
                  </h3>
                  {invoiceData?.flightDetails?.map((flight, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {flight.flightNumber || `Flight #${i + 1}`}
                        </h4>
                        <span
                          className="text-sm font-medium"
                          style={{ color: accentColor }}
                        >
                          {flight.class}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            From
                          </p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {flight.from}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {flight.departureDate} at {flight.departureTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            To
                          </p>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {flight.to}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {flight.arrivalDate} at {flight.arrivalTime}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Airline: {flight.airline || "-"} | Terminal:{" "}
                        {flight.departureTerminal || "-"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div
                  ref={sectionRefs.pricing}
                  className={`p-6 border-b border-gray-200 dark:border-gray-600 cursor-pointer transition-all ${
                    selectedSection === "pricing"
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                  }`}
                  onClick={() => setSelectedSection("pricing")}
                >
                  <h3
                    className="font-medium mb-4"
                    style={{ color: accentColor }}
                  >
                    Pricing Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Total Amount
                      </span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2 text-gray-800 dark:text-gray-200">
                          {invoiceData?.currency || "USD"}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {invoiceData?.totalAmount || "--"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Payment Method
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {invoiceData?.paymentMethod || "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">
                        Transaction ID
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {invoiceData?.transactionId || "--"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {showFooter && (
                  <div
                    ref={sectionRefs.footer}
                    className={`p-6 text-center cursor-pointer transition-all ${
                      selectedSection === "footer"
                        ? "ring-2 ring-blue-500 dark:ring-blue-400"
                        : ""
                    }`}
                    onClick={() => setSelectedSection("footer")}
                    style={{
                      backgroundColor:
                        theme === "dark"
                          ? accentColor + "20"
                          : accentColor + "10",
                    }}
                  >
                    <p className="text-gray-700 dark:text-gray-300">
                      {footerText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editor Controls */}
          <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors">
            <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="font-medium text-gray-800 dark:text-gray-200">
                Template Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Logo
                </label>
                <div className="flex items-center mb-2">
                  <img
                    src={companyLogo}
                    alt="Logo Preview"
                    className="h-10 mr-4 rounded"
                  />
                  <label className="bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-3 py-1 rounded cursor-pointer transition-colors">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Company Address
                </label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-10 h-10 rounded mr-4 cursor-pointer border border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showFooter"
                  checked={showFooter}
                  onChange={(e) => setShowFooter(e.target.checked)}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <label
                  htmlFor="showFooter"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  Show Footer
                </label>
              </div>

              {showFooter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Template Sections
                </h3>
                <div className="space-y-2">
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
                      onClick={() => {
                        setSelectedSection(section.id);
                        sectionRefs[section.id]?.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className={`flex items-center w-full p-2 rounded-md text-left transition-colors ${
                        selectedSection === section.id
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
    </div>
  );
}

export default TemplateEditor;
