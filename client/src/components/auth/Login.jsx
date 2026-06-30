import React, { useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bg from "../../images/bg.png";
import toast from "react-hot-toast";
import { apiUrl, clearAuthData, saveAuthData } from "../../utils/api";

const Login = ({ onAuth }) => {
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!usernameOrEmail.trim() || !password) {
      toast.error("Please enter username/email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Invalid username/email or password");
        return;
      }

      if (data.token) {
        saveAuthData(data);
        onAuth?.(data.user);
        toast.success("Login successful");
        navigate("/dashboard");
      } else {
        toast.error("Login failed. Token not found.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (response) => {
    try {
      const res = await fetch(apiUrl("/auth/google/callback"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: response.credential,
        }),
      });

      if (res.status === 404) {
        clearAuthData();
        toast.info("Account not registered. Please register first.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to authenticate");
        return;
      }

      if (data.token) {
        saveAuthData(data);
        onAuth?.(data.user);
        toast.success("Google login successful");
        navigate("/dashboard");
      } else {
        toast.error("Login failed. Token not found.");
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <GoogleOAuthProvider clientId="536656085214-lflgf5vpabtlh57mt6jj5f4v2qpdu6o0.apps.googleusercontent.com">
      <div
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="relative flex h-screen w-full overflow-hidden bg-gray-100"
      >
        {/* Left Side */}
        <div className="hidden md:block absolute left-0 top-0 h-full w-1/2 text-white z-0">
          <div className="flex flex-col justify-center items-center h-full px-12">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              src="/logo.png"
              alt="Logo"
              className="w-72 mb-6"
            />

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl leading-relaxed font-medium text-center max-w-lg text-gray-700"
            >
              Manage your invoices with ease. Automate, track, and send invoices
              effortlessly using AirInvoice Pro.
            </motion.p>
          </div>
        </div>

        {/* Right Side Login Form */}
        <div className="w-full md:w-1/2 z-10 flex justify-center items-center ml-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white p-10 rounded-lg shadow-xl text-center w-full max-w-sm"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Login
            </h1>

            <form onSubmit={handleLogin} className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Username or Email"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-3 rounded-md font-semibold hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-3 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                console.error("Google Login Failed");
                toast.error("Google Login Failed");
              }}
            />

            <div className="mt-6 text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-blue-500 hover:underline">
                Register here
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
