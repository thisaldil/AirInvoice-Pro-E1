import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, EditIcon } from "lucide-react";

function InvoicePreview({ invoice, onContinue, onBack }) {
  const handleFieldEdit = (field, value) => {
    console.log(`Editing ${field} to ${value}`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Review Extracted Data
      </h1>
      <p className="text-gray-600 mb-8">
        We've extracted the following information from the invoice. Please
        review and make any necessary corrections.
      </p>
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Ticket Information
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Airline Reference
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={invoice.airlineReference}
                  onChange={(e) =>
                    handleFieldEdit("airlineReference", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="ml-2 text-gray-400 hover:text-blue-500">
                  <EditIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Passenger Name
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={invoice.passengerName}
                  onChange={(e) =>
                    handleFieldEdit("passengerName", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="ml-2 text-gray-400 hover:text-blue-500">
                  <EditIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Flight Details
            </label>
            {invoice.flightDetails.map((flight, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-800">
                    {index === 0 ? "Outbound Flight" : "Return Flight"}
                  </h4>
                  <span className="text-sm font-medium text-blue-600">
                    {flight.flight}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="mb-3 md:mb-0">
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{flight.from}</p>
                    <p className="text-sm text-gray-600">
                      {flight.date}, {flight.departureTime}
                    </p>
                  </div>
                  <div className="self-center hidden md:block">
                    <div className="w-32 h-0.5 bg-gray-300 relative">
                      <div className="absolute -top-2 right-0 w-2 h-2 border-t-2 border-r-2 border-gray-300 transform rotate-45"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{flight.to}</p>
                    <p className="text-sm text-gray-600">
                      {flight.arrivalTime}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
}

export default InvoicePreview;
