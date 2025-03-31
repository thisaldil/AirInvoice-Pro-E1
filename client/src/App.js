import React, { useState } from "react";
import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";
import Dashboard from "./components/Dashboard";
import InvoiceUpload from "./components/InvoiceUpload";
import TemplateManager from "./components/TemplateManager";
import CommunicationCenter from "./components/CommunicationCenter";
import "./index.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "upload" && <InvoiceUpload />}
          {activeTab === "templates" && <TemplateManager />}
          {activeTab === "communication" && <CommunicationCenter />}
        </main>
      </div>
    </div>
  );
};

export default App;
