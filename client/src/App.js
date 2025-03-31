import React, { useState } from "react";
import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";
import Dashboard from "./components/Dashboard";
import InvoiceUpload from "./components/invoice/InvoiceUpload.jsx";
import InvoicePreview from "./components/invoice/InvoicePreview.jsx";
import TemplateManager from "./components/templates/TemplateManager.jsx";
import TemplateEditor from "./components/templates/TemplateEditor.jsx";
import SendOptions from "./components/send/SendOptions.jsx";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);

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
}

export default App;
