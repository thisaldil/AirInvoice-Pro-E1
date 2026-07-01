import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import bg from "../../images/bg.png";
import toast from "react-hot-toast";
import { apiUrl, saveAuthData } from "../../utils/api";

const Login = ({ onAuth }) => {
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
          email: usernameOrEmail.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (data.requiresVerification) {
        const verifyEmail = data.email || usernameOrEmail.trim();
        localStorage.setItem("pendingVerifyEmail", verifyEmail);
        if (data.devOtp) {
          localStorage.setItem("pendingVerifyOtp", data.devOtp);
        } else {
          localStorage.removeItem("pendingVerifyOtp");
        }
        toast(data.message || "Please verify your email first");
        navigate("/otp", { state: { email: verifyEmail, devOtp: data.devOtp } });
        return;
      }

      if (!res.ok) {
        toast.error(data.message || "Invalid username/email or password");
        return;
      }

      if (data.success) {
        const authData = {
          ...data,
          user: data.user || {
            email: usernameOrEmail.trim(),
            name: usernameOrEmail.trim(),
          },
        };
        saveAuthData(authData);
        onAuth?.(authData.user);
        toast.success("Login successful");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Full page redirect to backend Google OAuth route.
    // This must be a normal navigation, not a fetch() call,
    // since the OAuth flow relies on the browser redirecting
    // to Google and back.
    window.location.href = apiUrl("/auth/google");
  };

  return (
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

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-xs uppercase text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white text-gray-700 py-3 rounded-md font-semibold hover:bg-gray-50 transition mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-blue-500 hover:underline">
                Register here
              </Link>
            </div>
          </motion.div>
        </div>
    </div>
  );
};

export default Login;
