import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import InvoiceUpload from "./components/invoice/InvoiceUpload.jsx";
import InvoicePreview from "./components/invoice/InvoicePreview.jsx";
import TemplateManager from "./components/templates/TemplateManager.jsx";
import TemplateEditor from "./components/templates/TemplateEditor.jsx";
import SendOptions from "./components/send/SendOptions.jsx";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register.jsx";
import { Outlet } from "react-router-dom";

function AppWrapper() {
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  if (!isAuthenticated && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
    return <Navigate to="/login" />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />

        <Route
          path="upload"
          element={
            <InvoiceUpload
              onUpload={(invoice) => {
                setUploadedInvoice(invoice);
                navigate("/dashboard/preview");
              }}
            />
          }
        />

        <Route
          path="preview"
          element={
            <InvoicePreview
              invoice={uploadedInvoice}
              onContinue={() => navigate("/dashboard/templates")}
              onBack={() => navigate("/dashboard/upload")}
              onEdit={(field, value) => {
                setUploadedInvoice((prev) => ({
                  ...prev,
                  [field]: value,
                }));
              }}
            />
          }
        />

        <Route
          path="templates"
          element={
            <TemplateManager
              invoiceData={uploadedInvoice}
              onSelectTemplate={({ template, invoiceId }) => {
                setSelectedTemplate(template);
                setGeneratedInvoice({ template, data: uploadedInvoice, invoiceId });
                navigate("/dashboard/send");
              }}
              onCreateTemplate={() => navigate("/dashboard/template-editor")}
            />
          }
        />

        <Route
          path="template-editor"
          element={
            <TemplateEditor
              onSave={(template) => {
                setSelectedTemplate(template);
                navigate("/dashboard/templates");
              }}
              onCancel={() => navigate("/dashboard/templates")}
            />
          }
        />

        <Route
          path="template-editor/:id"
          element={
            <TemplateEditor
              onSave={(template) => {
                setSelectedTemplate(template);
                navigate("/dashboard/templates");
              }}
              onCancel={() => navigate("/dashboard/templates")}
            />
          }
        />

        <Route
          path="send"
          element={
            <SendOptions
              invoice={generatedInvoice}
              onBack={() => navigate("/dashboard/templates")}
            />
          }
        />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;