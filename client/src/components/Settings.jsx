import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Save, KeyRound, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { authFetch, clearAuthData, saveAuthData } from "../utils/api";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: "", username: "", email: "", picture: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const navigate = useNavigate();

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
    setProfile({
      name: storedUser?.name || "",
      username: storedUser?.username || "",
      email: storedUser?.email || "",
      picture: storedUser?.picture || "",
    });
  }, []);

  const handleProfileChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (profile.username && !/^[a-zA-Z0-9_]{3,30}$/.test(profile.username.trim())) {
      toast.error("Username must be 3-30 characters and use letters, numbers or underscores");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await authFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Profile update failed");
        return;
      }

      saveAuthData(data);
      setUser(data.user);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Profile update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error("Please fill both password fields");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(passwords.newPassword)) {
      toast.error("New password needs 8 characters, uppercase, lowercase and a number");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await authFetch("/auth/password", {
        method: "PUT",
        body: JSON.stringify(passwords),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Password change failed");
        return;
      }

      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    } catch (error) {
      console.error("Password change failed:", error);
      toast.error("Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this account?");
    if (!confirmed) return;

    try {
      const res = await authFetch("/auth/account", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Account delete failed");
        return;
      }

      clearAuthData();
      toast.success("Account deleted");
      navigate("/login");
    } catch (error) {
      console.error("Account delete failed:", error);
      toast.error("Account delete failed");
    }
  };

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
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center gap-6">
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
              {user.username && (
                <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">@{user.username}</p>
              )}
              <p className="text-gray-400 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        )}

        <form onSubmit={updateProfile} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              placeholder="Name"
              className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
              placeholder="Username"
              className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              placeholder="Email"
              type="email"
              className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              name="picture"
              value={profile.picture}
              onChange={handleProfileChange}
              placeholder="Profile image URL"
              className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form onSubmit={changePassword} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-bold">Password</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Current password"
              type="password"
              className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              placeholder="New password"
              type="password"
              className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            <KeyRound className="w-4 h-4" />
            {savingPassword ? "Changing..." : "Change password"}
          </button>
        </form>

        {/* Theme Settings with Icons */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto">
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

        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-3">Danger Zone</h2>
          <button
            type="button"
            onClick={deleteAccount}
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-md font-semibold hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
