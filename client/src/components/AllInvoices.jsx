import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FileTextIcon, SearchIcon } from "lucide-react";

const AllInvoices = ({ setUploadedInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/invoice/getInvoiceDetailsByUserId/${userId}`);
        setInvoices(res.data);
        setFilteredInvoices(res.data);
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
      const filtered = invoices.filter((inv) =>
        inv?.template?.company?.name?.toLowerCase().includes(term) ||
        inv?.date?.toLowerCase().includes(term)
      );
      setFilteredInvoices(filtered);
    }
  }, [search, invoices]);

  const handleClick = (invoice) => {
    if (!invoice) return;

    const extractedData = {
      ...invoice.data,
      pdfUrl: invoice.pdfUrl,
      templateId: invoice.template?._id || null,
      companyName: invoice.template?.company?.name || "",
      companyLogo: invoice.template?.company?.logo || ""
    };

    setUploadedInvoice(extractedData);
    navigate(`/dashboard/template-editor/${invoice.template?._id}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">All Invoices</h1>
      <div className="mb-6 flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by company or date..."
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
              <FileTextIcon className="w-5 h-5 text-blue-500 mr-2" />
              <div className="font-medium text-gray-800 truncate">
                {invoice.template?.company?.name || "Untitled Company"}
              </div>
            </div>
            <div className="p-4 text-sm text-gray-500 space-y-1">
              <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
              <p><strong>Invoice ID:</strong> {invoice._id}</p>
            </div>
          </div>
        ))}
        {filteredInvoices.length === 0 && (
          <p className="text-gray-500 text-center col-span-full">No invoices found.</p>
        )}
      </div>
    </div>
  );
};

export default AllInvoices;
