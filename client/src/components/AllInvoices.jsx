import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SearchIcon, TrashIcon } from "lucide-react";

const AllInvoices = ({ setGeneratedInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/invoice/getInvoiceDetailsByUserId/${userId}`
        );
        const sortedInvoices = res.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setInvoices(sortedInvoices);
        setFilteredInvoices(sortedInvoices);
      } catch (err) {
        console.error("Failed to load invoices:", err);
      }
    };

    fetchInvoices();
  }, [userId]);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredInvoices(invoices);
    } else {
      const term = search.toLowerCase();
      const filtered = invoices.filter(
        (inv) =>
          inv?.invoiceDetails?.passengerName?.toLowerCase().includes(term) ||
          inv?.invoiceDetails?.passportNumber?.toLowerCase().includes(term)
      );
      setFilteredInvoices(filtered);
    }
  }, [search, invoices]);

  const handleClick = (invoice) => {
    if (!invoice) return;

    setGeneratedInvoice({
      template: {
        _id: invoice.template?._id,
        company: {
          name: invoice.template?.company?.name,
          logo: invoice.template?.company?.logo,
          address: invoice.template?.company?.address,
        },
      },
      invoiceId: invoice._id,
      invoiceDetails: {
        ...invoice.invoiceDetails,
        ...invoice.priceDetails,
        pdfUrl: invoice.pdfUrl,
      },
    });

    navigate(`/dashboard/send`);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await axios.delete(
          `http://localhost:5000/invoice/deleteInvoice/${invoiceId}`
        );
        setInvoices((prev) =>
          prev.filter((invoice) => invoice._id !== invoiceId)
        );
      } catch (err) {
        console.error("Failed to delete invoice:", err);
        alert("Failed to delete invoice. Please try again.");
      }
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
        All Invoices
      </h1>
      <div className="mb-6 flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by name or passport no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10"
          />
          <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.map((invoice) => (
          <div
            key={invoice._id}
            onClick={() => handleClick(invoice)}
            className="cursor-pointer border rounded-lg bg-white shadow-md hover:border-blue-500 hover:shadow-lg transition"
          >
            <div className="p-4 flex items-center border-b">
              <img
                src={invoice.template.company?.logo}
                alt="logo"
                className="w-10 h-10 mr-3 object-contain"
              />
              <div className="flex flex-row justify-between items-center w-full">
                <span className="font-medium text-gray-800">
                  {invoice.template?.company?.name || "Untitled Company"}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(invoice.date).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
            <div className="p-4 text-sm text-gray-500 space-y-1">
              <p className="text-2xl">
                <strong> {invoice.invoiceDetails.passengerName}</strong>
              </p>
              <p>
                <strong>Passport No:</strong>{" "}
                {invoice.invoiceDetails.passportNumber}
              </p>
              <div className="flex flex-row justify-between items-center w-full">
                <p>
                  <strong>Invoice ID:</strong> {invoice._id}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteInvoice(invoice._id);
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredInvoices.length === 0 && (
          <p className="text-gray-500 text-center col-span-full">
            No invoices found.
          </p>
        )}
      </div>
    </div>
  );
};

export default AllInvoices;
