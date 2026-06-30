import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import bg from "../../images/bg.png";
import toast from "react-hot-toast";
import { apiUrl, saveAuthData } from "../../utils/api";

const OTP = ({ onAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || localStorage.getItem("pendingVerifyEmail") || "";
  const devOtpFromState = location.state?.devOtp || localStorage.getItem("pendingVerifyOtp") || "";

  const [email] = useState(emailFromState);
  const [devOtp, setDevOtp] = useState(devOtpFromState);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please register again.");
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(apiUrl("/auth/verify-otp"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Verification failed");
        return;
      }

      localStorage.removeItem("pendingVerifyEmail");
      localStorage.removeItem("pendingVerifyOtp");
      saveAuthData(data);
      onAuth?.(data.user);
      toast.success("Email verified successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("OTP Verify Error:", error);
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      setResending(true);

      const res = await fetch(apiUrl("/auth/resend-otp"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Could not resend OTP");
        return;
      }

      if (data.devOtp) {
        localStorage.setItem("pendingVerifyOtp", data.devOtp);
        setDevOtp(data.devOtp);
      } else {
        localStorage.removeItem("pendingVerifyOtp");
        setDevOtp("");
      }

      toast.success(data.devOtp ? "New OTP is shown below" : "A new OTP has been sent to your email");
      setCooldown(30);
    } catch (error) {
      console.error("Resend OTP Error:", error);
      toast.error("Could not resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative flex min-h-screen w-full overflow-hidden bg-gray-100 items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-10 rounded-lg shadow-xl text-center w-full max-w-sm"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify your email</h1>
        <p className="text-sm text-gray-600 mb-6">
          We sent a 6-digit code to <span className="font-semibold">{email}</span>
        </p>

        {devOtp && (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Development OTP</p>
            <p className="mt-1 text-2xl font-bold tracking-widest text-gray-900">{devOtp}</p>
            <button
              type="button"
              onClick={() => setOtp(String(devOtp).split(""))}
              className="mt-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              Use this code
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-md font-semibold hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-blue-500 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend OTP"}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <Link to="/login" className="text-blue-500 hover:underline">
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OTP;
