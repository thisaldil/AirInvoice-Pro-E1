import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

function InvoicePreview({ invoice = {}, onContinue, onBack, onEdit }) {
  const [countries, setCountries] = useState([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data) => {
        const countryList = data.map((c) => c.name.common).sort();
        setCountries(countryList);
      });
  }, []);

  useEffect(() => {
    const requiredFields = [
      invoice.passportNumber,
      invoice.nationality,
      invoice.dob,
      invoice.gender,
      invoice.totalAmount,
    ];
    const allFlightsValid = invoice.flightDetails?.length > 0;
    setIsValid(requiredFields.every(Boolean) && allFlightsValid);
  }, [invoice]);

  const handleFieldEdit = (field, value) => {
    if (onEdit) {
      onEdit(field, value);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Review Extracted Data
      </h1>
      <p className="text-gray-600 mb-8">
        We've extracted the following information from the air ticket invoice.
        Please review and make any necessary corrections.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Ticket Information
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Booking Reference"
              value={invoice.bookingReference}
              readOnly
              placeholder="e.g., 621368349"
            />
            <Field
              label="Passenger Name"
              value={invoice.passengerName}
              readOnly
              placeholder="e.g., P KOCHCHIKKAN/A JAYANATH MR"
            />
            <Field
              label="Ticket Number"
              value={invoice.transactionId}
              readOnly
              placeholder="e.g., 5142372016237"
            />
            <Field
              label="Passport Number"
              value={invoice.passportNumber}
              placeholder="e.g., N1234567"
              required
              onEdit={(val) => handleFieldEdit("passportNumber", val)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Nationality
              </label>
              <select
                value={invoice.nationality || "Sri Lanka"}
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
                Date of Birth
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
                Gender
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
                    Airline: {flight.airline || "-"} | Ticket No:{" "}
                    {flight.ticketNumber || "-"}
                  </div>
                  {/* <div className="text-sm text-gray-500">
                    Seat: {flight.seatNumber || "-"} | Baggage:{" "}
                    {flight.baggageAllowance || "-"}
                  </div> */}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No flight details available.</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Total Amount"
              value={invoice.totalAmount}
              required
              placeholder="e.g., 45000.00"
              onEdit={(val) => handleFieldEdit("totalAmount", val)}
            />
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
          className={`flex items-center px-6 py-2 rounded-md ${
            isValid
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
      {label}
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
