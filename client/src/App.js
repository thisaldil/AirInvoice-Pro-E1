import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";
import Dashboard from "./components/Dashboard";
import InvoiceUpload from "./components/InvoiceUpload";
import TemplateManager from "./components/TemplateManager";
import CommunicationCenter from "./components/CommunicationCenter";
import Login from "./components/auth/Login";
import "./index.css";

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? (
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
          ) : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;
