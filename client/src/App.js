import React, { useState } from "react";
import Layout from "./components/Layout";
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
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderContent()}
    </Layout>
  );
}

export default App;
