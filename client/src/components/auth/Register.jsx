import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();

    const handleSuccess = async (response) => {
        try {
            const token = response.credential;

            const verify = await fetch("http://localhost:5000/auth/google/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            if (!verify.ok) {
                const msg = await verify.json();
                alert(msg.message || "Registration failed");
                return;
            }

            const data = await verify.json();

            if (data.token) {
                localStorage.setItem("token", data.token);
                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        name: data.user.name,
                        email: data.user.email,
                        picture: data.user.picture,
                    })
                );
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Google Registration Error:", error);
        }
    };

    return (
        <GoogleOAuthProvider clientId="536656085214-lflgf5vpabtlh57mt6jj5f4v2qpdu6o0.apps.googleusercontent.com">
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-10 rounded-lg shadow-lg text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Register</h1>
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => alert("Google Registration Failed")}
                    />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to={"/login"} className="text-blue-500 hover:underline">
                        Login here
                    </Link>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default Register;
