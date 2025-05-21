import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const Settings = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const html = document.documentElement;
    const applyTheme = (mode) => {
      if (mode === "dark") html.classList.add("dark");
      else if (mode === "light") html.classList.remove("dark");
      else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        html.classList.toggle("dark", prefersDark);
      }
    };
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  const themeOptions = [
    { label: "System", value: "system", icon: <Monitor className="w-6 h-6" /> },
    { label: "Light", value: "light", icon: <Sun className="w-6 h-6" /> },
    { label: "Dark", value: "dark", icon: <Moon className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen px-4 py-8 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Profile Card */}
        {user && (
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col sm:flex-row items-center gap-6">
            <img
              src={
                user.picture
                  ? user.picture
                      .replace("=s96-c", "")
                      .replace("http://", "https://")
                  : "https://via.placeholder.com/150"
              }
              alt={user.name}
              className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-700 shadow-md"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold">{user.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">he/him</p>
            </div>
          </div>
        )}

        {/* Theme Settings with Icons */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-md max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-center">Theme Settings</h2>
          <div className="flex justify-center space-x-4">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`p-3 rounded-full border-2 transition-all
                  ${
                    theme === option.value
                      ? "bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
