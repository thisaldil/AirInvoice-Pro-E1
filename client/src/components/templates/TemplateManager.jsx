import React, { useState } from "react";
import { PlusIcon, CheckIcon, EditIcon, TrashIcon } from "lucide-react";

function TemplateManager({ onSelectTemplate, onCreateTemplate }) {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Standard Template",
      description: "Default company invoice template",
      isDefault: true,
      preview:
        "https://images.unsplash.com/photo-1635025728933-0f16b54f1218?q=80&w=1000&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Premium Template",
      description: "High-end design for VIP clients",
      isDefault: false,
      preview:
        "https://images.unsplash.com/photo-1601581987809-a874a81309c9?q=80&w=1000&auto=format&fit=crop",
    },
  ]);

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates.find((t) => t.isDefault)?.id || null
  );

  const handleSetDefault = (templateId) => {
    setTemplates(
      templates.map((template) => ({
        ...template,
        isDefault: template.id === templateId,
      }))
    );
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter((template) => template.id !== templateId));
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
    }
  };

  const handleSelectTemplate = () => {
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Invoice Templates
      </h1>
      <p className="text-gray-600 mb-8">
        Select a template to use for your new invoice or create a new template.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedTemplateId(template.id)}
            className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedTemplateId === template.id
                ? "ring-2 ring-blue-500 border-transparent"
                : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <div className="relative h-48 bg-gray-100">
              <img
                src={template.preview}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {template.isDefault && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Default
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-800">{template.name}</h3>
              <p className="text-sm text-gray-500">{template.description}</p>
              <div className="mt-4 flex justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(template.id);
                  }}
                  className={`text-sm ${
                    template.isDefault
                      ? "text-blue-600 cursor-default"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  <div className="flex items-center">
                    <CheckIcon className="w-4 h-4 mr-1" />
                    Set as Default
                  </div>
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Edit template", template.id);
                    }}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  {!template.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {selectedTemplateId === template.id && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center">
                <div className="bg-white rounded-full p-2 shadow-md">
                  <CheckIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            )}
          </div>
        ))}
        <div
          onClick={onCreateTemplate}
          className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors h-full"
        >
          <div className="bg-blue-100 rounded-full p-3 mb-4">
            <PlusIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-800 mb-1">
            Create New Template
          </h3>
          <p className="text-sm text-gray-500 text-center">
            Design a custom invoice template for your business
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSelectTemplate}
          disabled={!selectedTemplateId}
          className={`px-6 py-2 rounded-md ${
            selectedTemplateId
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Use Selected Template
        </button>
      </div>
    </div>
  );
}

export default TemplateManager;
