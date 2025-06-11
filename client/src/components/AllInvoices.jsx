import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { SearchIcon, TrashIcon } from "lucide-react";
import toast from 'react-hot-toast';

const AllInvoices = ({ setGeneratedInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [duplicateRefs, setDuplicateRefs] = useState(new Set());

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get(
          `https://air-invoice-server.vercel.app/invoice/getInvoiceDetailsByUserId/${userId}`
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
    const bookingRefCounts = {};
    invoices.forEach((inv) => {
      const ref = inv.invoiceDetails?.bookingReference;
      if (ref) {
        bookingRefCounts[ref] = (bookingRefCounts[ref] || 0) + 1;
      }
    });
    setDuplicateRefs(new Set(Object.keys(bookingRefCounts).filter(ref => bookingRefCounts[ref] > 1)));
  }, [invoices]);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredInvoices(invoices);
    } else {
      const term = search.toLowerCase();
      const filtered = invoices.filter((inv) => {
        const names = inv?.invoiceDetails?.passengerName || [];
        const passport = inv?.invoiceDetails?.passportNumber;

        const nameMatch = Array.isArray(names)
          ? names.some((name) => name.toLowerCase().includes(term))
          : names?.toLowerCase().includes(term);

        const passportMatch = Array.isArray(passport)
          ? passport.some((p) => p.toLowerCase().includes(term))
          : passport?.toLowerCase().includes(term);

        return nameMatch || passportMatch;
      });
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
          `https://air-invoice-server.vercel.app/invoice/deleteInvoice/${invoiceId}`
        );
        setInvoices((prev) =>
          prev.filter((invoice) => invoice._id !== invoiceId)
        );
        toast.success("Invoice deleted.");
      } catch (err) {
        console.error("Failed to delete invoice:", err);
        toast.error("Failed to delete invoice. Please try again.");
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md pl-10 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.map((invoice) => (
          <div
            key={invoice._id}
            onClick={() => handleClick(invoice)}
            className="relative cursor-pointer border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:border-blue-500 hover:shadow-lg transition"
          >
            <div className="p-2 px-4 flex items-center border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-row justify-between items-center w-full">
                {invoice.template?.company?.logo ? (
                  <img
                    src={invoice.template.company.logo}
                    alt="logo"
                    className="w-16 h-16 mr-3 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 mr-3 bg-gray-200 dark:bg-gray-600 rounded" />
                )}

                <div className="flex flex-row justify-end space-x-4 items-center w-full">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(invoice.date).toLocaleDateString("en-GB")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteInvoice(invoice._id);
                    }}
                    className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 text-sm text-gray-500 space-y-1 min-h-48">
              <div className="space-y-1">
                {Array.isArray(invoice.invoiceDetails.passengerName) ? (
                  invoice.invoiceDetails.passengerName.map((name, idx) => (
                    <div key={idx}>
                      <p className="font-semibold text-gray-800">{name}</p>
                      <p className="text-gray-500 mb-2">
                        <strong>Passport No:</strong>{" "}
                        {invoice.invoiceDetails.passengers?.[idx]?.passportNumber || "--"}
                      </p>
                      {idx < invoice.invoiceDetails.passengerName.length - 1 && <hr />}
                    </div>
                  ))
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">{invoice.invoiceDetails.passengerName}</p>
                    <p className="text-gray-500">
                      <strong>Passport No:</strong>{" "}
                      {invoice.invoiceDetails.passportNumber || "--"}
                    </p>
                  </>
                )}
              </div>
              <div className="mt-3 border-t justify-between items-center w-full">
                <p>Invoice ID: {invoice._id}</p>

              </div>
            </div>
            {duplicateRefs.has(invoice.invoiceDetails?.bookingReference) && (
              <div className="absolute bottom-2 right-2 bg-yellow-100 border border-yellow-400 text-yellow-700 text-xs font-medium px-2 py-1 rounded shadow-sm">
                ⚠ Duplicate booking<br />
                Ref: {invoice.invoiceDetails?.bookingReference}
              </div>
            )}
          </div>
        ))}

        {filteredInvoices.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center col-span-full">
            No invoices found.
          </p>
        )}
      </div>
    </div>
  );
};

export default AllInvoices;
