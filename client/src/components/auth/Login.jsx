import React, { useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      navigate("/dashboard");
    }
  }, []);

  const handleSuccess = async (response) => {
    try {
      const res = await fetch("http://localhost:5000/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      if (!res.ok) {
        throw new Error("Failed to authenticate");
      }

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          name: data.user.name,
          picture: data.user.picture,
          email: data.user.email,
        }));
        setIsAuthenticated(true);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="536656085214-lflgf5vpabtlh57mt6jj5f4v2qpdu6o0.apps.googleusercontent.com">
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-10 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Login</h1>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error("Google Login Failed")}
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
