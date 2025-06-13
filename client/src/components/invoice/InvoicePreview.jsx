import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon } from "lucide-react";

function InvoicePreview({ invoice = {}, onContinue, onBack, onEdit }) {
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Fetch countries
    fetch("https://restcountries.com/v3.1/all?fields=name")
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
    const allPassengersValid =
      Array.isArray(invoice.passengerName) &&
      invoice.passengerName.length > 0 &&
      invoice.passengers &&
      invoice.passengers.length === invoice.passengerName.length &&
      invoice.passengers.every(
        (p) =>
          p.passportNumber?.trim() &&
          p.nationality?.trim() &&
          p.dob?.trim() &&
          p.gender?.trim()
      );

    const hasRequiredFields =
      allPassengersValid &&
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
    if (value === "" || (!isNaN(value) && parseFloat(value) > 0)) {
      handleFieldEdit("totalAmount", value);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Review Extracted Data
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        We've extracted the following information from the air ticket invoice.
        Please review and make any necessary corrections.
      </p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Ticket Information
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Booking Reference"
              value={invoice.bookingReference}
              readOnly
            />
            {invoice.transactionId ? (
              <Field
                label="Ticket Number"
                value={invoice.transactionId}
                readOnly
              />
            ) : null}
          </div>
          <div>
            {Array.isArray(invoice.passengerName) &&
              invoice.passengerName.length > 0 && (
                <div className="space-y-6">
                  {invoice.passengerName.map((name, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 dark:border-gray-600 p-4 space-y-2 rounded-md bg-gray-50 dark:bg-gray-700"
                    >
                      <button
                        onClick={() => {
                          const updated = [...invoice.passengerName];
                          updated.splice(idx, 1);
                          handleFieldEdit("passengerName", updated);
                        }}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove Passenger"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          label={`Passenger Name`}
                          value={name}
                          readOnly
                          placeholder="eg: Example user"
                        />

                        <Field
                          label="Passport Number"
                          value={
                            invoice.passengers?.[idx]?.passportNumber || ""
                          }
                          required
                          placeholder="e.g., N1234567"
                          onEdit={(val) => {
                            const updated = [...(invoice.passengers || [])];
                            updated[idx] = {
                              ...updated[idx],
                              passportNumber: val,
                            };
                            handleFieldEdit("passengers", updated);
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Nationality <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={invoice.passengers?.[idx]?.nationality || ""}
                            onChange={(e) => {
                              const updated = [...(invoice.passengers || [])];
                              updated[idx] = {
                                ...updated[idx],
                                nationality: e.target.value,
                              };
                              handleFieldEdit("passengers", updated);
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
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
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Date of Birth{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            value={invoice.passengers?.[idx]?.dob || ""}
                            onChange={(e) => {
                              const updated = [...(invoice.passengers || [])];
                              updated[idx] = {
                                ...updated[idx],
                                dob: e.target.value,
                              };
                              handleFieldEdit("passengers", updated);
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Gender <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={invoice.passengers?.[idx]?.gender || ""}
                            onChange={(e) => {
                              const updated = [...(invoice.passengers || [])];
                              updated[idx] = {
                                ...updated[idx],
                                gender: e.target.value,
                              };
                              handleFieldEdit("passengers", updated);
                            }}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Flight Details
            </label>
            {invoice?.flightDetails?.length > 0 ? (
              invoice.flightDetails.map((flight, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {flight.flightNumber || `Flight #${index + 1}`}
                    </h4>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {flight.class}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        From
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
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
                      <p className="font-medium text-gray-900 dark:text-white">
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
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No flight details available.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoice.currency || ""}
                  onChange={(e) => handleFieldEdit("currency", e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoice.paymentMethod || ""}
                  onChange={(e) =>
                    handleFieldEdit("paymentMethod", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Amount <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="mr-2 text-gray-500 dark:text-gray-400 font-bold">
                  {invoice.currency}
                </span>
                <input
                  type="text"
                  value={invoice.totalAmount || ""}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="e.g., 45000.00"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {invoice.totalAmount &&
                (isNaN(invoice.totalAmount) ||
                  parseFloat(invoice.totalAmount) <= 0) && (
                  <p className="text-red-500 text-sm mt-1">
                    Amount must be a number greater than 0
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!isValid}
          className={`flex items-center px-6 py-2 rounded-md ${
            isValid
              ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onEdit?.(e.target.value)}
      readOnly={readOnly}
      required={required}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50 dark:read-only:bg-gray-700 read-only:text-gray-500 dark:read-only:text-gray-400"
    />
  </div>
);

export default InvoicePreview;
