import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import InvoiceUpload from "./components/invoice/InvoiceUpload.jsx";
import InvoicePreview from "./components/invoice/InvoicePreview.jsx";
import TemplateManager from "./components/templates/TemplateManager.jsx";
import TemplateEditor from "./components/templates/TemplateEditor.jsx";
import SendOptions from "./components/send/SendOptions.jsx";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register.jsx";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "upload":
        return (
          <InvoiceUpload
            onUpload={(invoice) => {
              setUploadedInvoice(invoice);
              setCurrentPage("preview");
            }}
          />
        );
      case "preview":
        return (
          <InvoicePreview
            invoice={uploadedInvoice}
            onContinue={() => setCurrentPage("templates")}
            onBack={() => setCurrentPage("upload")}
          />
        );
      case "templates":
        return (
          <TemplateManager
            onSelectTemplate={(template) => {
              setSelectedTemplate(template);
              setGeneratedInvoice({
                template,
                data: uploadedInvoice,
              });
              setCurrentPage("send");
            }}
            onCreateTemplate={() => setCurrentPage("template-editor")}
          />
        );
      case "template-editor":
        return (
          <TemplateEditor
            onSave={(template) => {
              setSelectedTemplate(template);
              setCurrentPage("templates");
            }}
            onCancel={() => setCurrentPage("templates")}
          />
        );
      case "send":
        return (
          <SendOptions
            invoice={generatedInvoice}
            onBack={() => setCurrentPage("templates")}
          />
        );
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? (
            <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
              {renderContent()}
            </Layout>
          ) : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
