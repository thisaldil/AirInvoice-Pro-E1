import React, { useState } from "react";
import { Pencil, PlusCircle, X } from "lucide-react";
import RichTextEditor from "./templates/RichTextEditor";
const defaultTemplates = [
  {
    id: 1,
    title: "Promotions",
    category: "Marketing",
    description: "Special discount campaigns for customers.",
    content: "<p>Get 20% off on all flights this weekend!</p>",
  },
  {
    id: 2,
    title: "Deals",
    category: "Sales",
    description: "Limited-time offers and deal emails.",
    content: "<p>Exclusive 48-hour deal for your next booking.</p>",
  },
  {
    id: 3,
    title: "Birthday Wishes",
    category: "Celebration",
    description: "Personal birthday greetings.",
    content: "<p>Happy Birthday! Here's a surprise for you 🎉</p>",
  },
  {
    id: 4,
    title: "New Year Wishes",
    category: "Festival",
    description: "Start the new year with warm wishes.",
    content: "<p>Wishing you a successful year ahead!</p>",
  },
  {
    id: 5,
    title: "Festival Wishes",
    category: "Festival",
    description: "Celebrate special holidays with customers.",
    content: "<p>Enjoy your holidays! Happy Sinhala & Tamil New Year!</p>",
  },
];

const Crm = () => {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTitle(template.title);
      setCategory(template.category);
      setContent(template.content);
    } else {
      setEditingTemplate(null);
      setTitle("");
      setCategory("");
      setContent("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = () => {
    if (!title || !category || !content) return;

    const newTemplate = {
      id: editingTemplate ? editingTemplate.id : Date.now(),
      title,
      category,
      content,
      description: content.replace(/<[^>]+>/g, "").substring(0, 80) + "...",
    };

    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((tpl) => (tpl.id === editingTemplate.id ? newTemplate : tpl))
      );
    } else {
      setTemplates((prev) => [...prev, newTemplate]);
    }

    closeModal();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Create Template</span>
          </button>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-md hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">{template.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                  {template.category}
                </span>
                <button
                  onClick={() => openModal(template)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full max-w-2xl rounded-lg p-6 shadow-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
            >
              <X />
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h2>

            <input
              type="text"
              placeholder="Template Title"
              className="w-full mb-3 px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Category (e.g., Promotions, Birthday)"
              className="w-full mb-3 px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-800"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <RichTextEditor value={content} onChange={setContent} />
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Crm;
