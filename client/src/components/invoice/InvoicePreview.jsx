import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

function InvoicePreview({ invoice = {}, onContinue, onBack, onEdit }) {
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Fetch countries
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data) => {
        const countryList = data.map((c) => c.name.common).sort();
        setCountries(countryList);
      });

    // Fetch currencies and exchange rates
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data.result === "success") {
          setExchangeRates(data.rates);
          // Create currency list from rates
          const currencyList = Object.keys(data.rates).sort();
          setCurrencies(currencyList);
        }
      });
  }, []);

  useEffect(() => {
    // Check if all required fields have values
    const hasRequiredFields =
      invoice.passportNumber?.trim() &&
      invoice.nationality?.trim() &&
      invoice.dob?.trim() &&
      invoice.gender?.trim() &&
      invoice.currency?.trim() &&
      invoice.paymentMethod?.trim() &&
      invoice.totalAmount?.toString().trim() &&
      !isNaN(invoice.totalAmount) &&
      parseFloat(invoice.totalAmount) > 0;

    // Check if we have flight details
    const hasFlightDetails =
      Array.isArray(invoice.flightDetails) && invoice.flightDetails.length > 0;

    // Set valid if both conditions are met
    setIsValid(hasRequiredFields && hasFlightDetails);
  }, [invoice]);

  const handleFieldEdit = (field, value) => {
    if (onEdit) {
      onEdit(field, value);
    }
  };

  const handleAmountChange = (value) => {
    // Validate that the value is a number and greater than 0
    if (value === '' || (!isNaN(value) && parseFloat(value) > 0)) {
      handleFieldEdit('totalAmount', value);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-white">
        Review Extracted Data
      </h1>
      <p className="text-gray-600 mb-8 dark:text-white">
        We've extracted the following information from the air ticket invoice.
        Please review and make any necessary corrections.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8 ">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Ticket Information
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Booking Reference"
              value={invoice.bookingReference}
              readOnly
            />
            {Array.isArray(invoice.passengerName) && invoice.passengerName.length > 1 ? (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Passenger Name</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  value={invoice.passengerName[0]}
                  readOnly
                >
                  {invoice.passengerName.map((name, idx) => (
                    <option key={idx} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <Field
                label="Passenger Name"
                value={Array.isArray(invoice.passengerName) ? invoice.passengerName[0] : invoice.passengerName}
                readOnly
              />
            )}
            {invoice.transactionId ? (
              <Field
                label="Ticket Number"
                value={invoice.transactionId}
                readOnly
              />
            ) : null}
            <Field
              label="Passport Number"
              value={invoice.passportNumber}
              placeholder="e.g., N1234567"
              required
              onEdit={(val) => handleFieldEdit("passportNumber", val)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nationality <span className="text-red-500">*</span>
              </label>
              <select
                value={invoice.nationality || ""}
                onChange={(e) => handleFieldEdit("nationality", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={invoice.dob || ""}
                onChange={(e) => handleFieldEdit("dob", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                value={invoice.gender || ""}
                onChange={(e) => handleFieldEdit("gender", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Flight Details
            </label>
            {invoice?.flightDetails?.length > 0 ? (
              invoice.flightDetails.map((flight, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">
                      {flight.flightNumber || `Flight #${index + 1}`}
                    </h4>
                    <span className="text-sm font-medium text-blue-600">
                      {flight.class}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium">{flight.from}</p>
                      <p className="text-sm text-gray-600">
                        {flight.departureDate} at {flight.departureTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium">{flight.to}</p>
                      <p className="text-sm text-gray-600">
                        {flight.arrivalDate} at {flight.arrivalTime}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Airline: {flight.airline || "-"} | Terminal:{" "}
                    {flight.departureTerminal || "-"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No flight details available.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoice.currency || ""}
                  onChange={(e) => handleFieldEdit("currency", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Currency</option>
                  {currencies.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoice.paymentMethod || ""}
                  onChange={(e) => handleFieldEdit("paymentMethod", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-500 font-bold">{invoice.currency}</span>
                <input
                  type="text"
                  value={invoice.totalAmount || ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g., 45000.00"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {invoice.totalAmount && (isNaN(invoice.totalAmount) || parseFloat(invoice.totalAmount) <= 0) && (
                <p className="text-red-500 text-sm mt-1">Amount must be a number greater than 0</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!isValid}
          className={`flex items-center px-6 py-2 rounded-md ${isValid
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          Continue
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}

const Field = ({ label, value, onEdit, readOnly, placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onEdit?.(e.target.value)}
      readOnly={readOnly}
      required={required}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

export default InvoicePreview;
