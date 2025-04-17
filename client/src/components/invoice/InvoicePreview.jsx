import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, EditIcon } from "lucide-react";

function InvoicePreview({ invoice = {}, onContinue, onBack, onEdit }) {
  const handleFieldEdit = (field, value) => {
    if (onEdit) {
      onEdit(field, value);
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 text-gray-900 dark:text-white">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          Ticket Information
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Booking Reference"
              value={invoice.bookingReference}
              onEdit={(val) => handleFieldEdit("bookingReference", val)}
            />
            <Field
              label="Passenger Name"
              value={invoice.passengerName}
              onEdit={(val) => handleFieldEdit("passengerName", val)}
            />
            <Field
              label="Passport Number"
              value={invoice.passportNumber}
              onEdit={(val) => handleFieldEdit("passportNumber", val)}
            />
            <Field
              label="Nationality"
              value={invoice.nationality}
              onEdit={(val) => handleFieldEdit("nationality", val)}
            />
            <Field
              label="Date of Birth"
              value={invoice.dob}
              onEdit={(val) => handleFieldEdit("dob", val)}
            />
            <Field
              label="Gender"
              value={invoice.gender}
              onEdit={(val) => handleFieldEdit("gender", val)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
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
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        From
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {flight.from}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {flight.departureDate} at {flight.departureTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        To
                      </p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {flight.to}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {flight.arrivalDate} at {flight.arrivalTime}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                    Seat: {flight.seatNumber} | Baggage:{" "}
                    {flight.baggageAllowance}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-300">
                No flight details available.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Total Amount"
              value={invoice.totalAmount}
              onEdit={(val) => handleFieldEdit("totalAmount", val)}
            />
            <Field
              label="Payment Method"
              value={invoice.paymentMethod}
              onEdit={(val) => handleFieldEdit("paymentMethod", val)}
            />
            <Field
              label="Transaction ID"
              value={invoice.transactionId}
              onEdit={(val) => handleFieldEdit("transactionId", val)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>
        <button
          onClick={onContinue}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:text-white"
        >
          Continue
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}

// Reusable input field with full dark mode support
const Field = ({ label, value, onEdit }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">
      {label}
    </label>
    <div className="flex">
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onEdit(e.target.value)}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
      />
      <button className="ml-2 text-gray-400 hover:text-blue-500">
        <EditIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
);

export default InvoicePreview;
