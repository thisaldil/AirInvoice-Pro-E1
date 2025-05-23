import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Toaster } from 'react-hot-toast';

import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import InvoiceUpload from "./components/invoice/InvoiceUpload.jsx";
import InvoicePreview from "./components/invoice/InvoicePreview.jsx";
import TemplateManager from "./components/templates/TemplateManager.jsx";
import TemplateEditor from "./components/templates/TemplateEditor.jsx";
import SendOptions from "./components/send/SendOptions.jsx";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register.jsx";
import AllInvoices from "./components/AllInvoices";
import Settings from "./components/Settings";
import Crm from "./components/Crm";

function AppWrapper() {
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem("theme") || "system";

    const applyTheme = (mode) => {
      if (mode === "dark") {
        html.classList.add("dark");
      } else if (mode === "light") {
        html.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        html.classList.toggle("dark", prefersDark);
      }
    };

    applyTheme(savedTheme);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  if (
    !isAuthenticated &&
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/register"
  ) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      <Toaster position="top-center" />
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
                onSelectTemplate={({ template }) => {
                  setSelectedTemplate(template);
                  navigate(`/dashboard/template-editor/${template._id}`);
                }}
                onCreateTemplate={() => navigate("/dashboard/template-editor")}
              />
            }
          />

          <Route
            path="template-editor"
            element={
              <TemplateEditor
                invoiceData={uploadedInvoice}
                onSave={({ template, invoiceId }) => {
                  setSelectedTemplate(template);
                  setGeneratedInvoice({ template, invoiceId });
                  navigate("/dashboard/send");
                }}
                onCancel={() => navigate("/dashboard/templates")}
              />
            }
          />

          <Route
            path="template-editor/:id"
            element={
              <TemplateEditor
                invoiceData={uploadedInvoice}
                onSave={({ template, invoiceId }) => {
                  setSelectedTemplate(template);
                  setGeneratedInvoice({ template, invoiceId });
                  navigate("/dashboard/send");
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
                onBack={() => navigate("/dashboard/invoices")}
              />
            }
          />

          <Route
            path="invoices"
            element={
              <AllInvoices
                setGeneratedInvoice={(invoice) => {
                  setGeneratedInvoice(invoice);
                }}
              />
            }
          />
          <Route path="crm" element={<Crm />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
          }
        />
      </Routes>
    </div>
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
