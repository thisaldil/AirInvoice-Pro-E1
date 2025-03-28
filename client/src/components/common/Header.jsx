import React from "react";
import { BellIcon, SearchIcon } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center rounded-md bg-gray-100 px-3 py-2 w-72">
        <SearchIcon className="h-4 w-4 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search invoices..."
          className="bg-transparent border-none text-sm focus:outline-none w-full"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-700">
          <BellIcon className="h-5 w-5" />
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
          New Invoice
        </button>
      </div>
    </header>
  );
};

export default Header;
