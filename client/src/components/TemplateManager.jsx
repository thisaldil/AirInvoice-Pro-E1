import React, { useState } from "react";
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";

const TemplateManager = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Default Template",
      createdAt: "2023-05-10",
      isDefault: true,
    },
    {
      id: 2,
      name: "Premium Template",
      createdAt: "2023-05-15",
      isDefault: false,
    },
    {
      id: 3,
      name: "Simple Template",
      createdAt: "2023-06-02",
      isDefault: false,
    },
  ]);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");

  const handleCreateTemplate = () => {
    if (newTemplateName.trim()) {
      const newTemplate = {
        id: templates.length + 1,
        name: newTemplateName,
        createdAt: new Date().toISOString().split("T")[0],
        isDefault: false,
      };
      setTemplates([...templates, newTemplate]);
      setNewTemplateName("");
      setShowNewTemplate(false);
    }
  };

  const handleSetDefaultTemplate = (id) => {
    setTemplates(
      templates.map((template) => ({
        ...template,
        isDefault: template.id === id,
      }))
    );
  };

  const handleDeleteTemplate = (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((template) => template.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Invoice Templates</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center"
          onClick={() => setShowNewTemplate(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </button>
      </div>
      {showNewTemplate && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Create New Template
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="templateName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter template name"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
