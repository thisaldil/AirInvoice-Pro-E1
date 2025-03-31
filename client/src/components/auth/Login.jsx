import React from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();

  const handleSuccess = async (response) => {
    try {
      const res = await fetch("http://localhost:5000/auth/google/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-10 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Login</h1>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error("Google Login Failed")}
            render={(renderProps) => (
              <button
                className="flex items-center px-4 py-2 border rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600"
                onClick={renderProps.onClick}
                disabled={renderProps.disabled}
              >
                <FcGoogle className="text-2xl mr-2" />
                Login with Google
              </button>
            )}
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
