import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "./api";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await registerUser(username, password);
      localStorage.setItem("token", res.data.access_token);
      navigate("/upload");
    } catch (err) {
      alert("Registration failed. User may already exist.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-teal-200">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-green-400"
          required
        />
        <input
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-green-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Register
        </button>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-600 font-semibold hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
