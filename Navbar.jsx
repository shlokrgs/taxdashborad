// src/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 flex flex-wrap justify-between items-center">
      <div className="text-2xl font-bold tracking-wide">
        <Link to="/" className="hover:text-gray-200">
          📊 Excel Dashboard
        </Link>
      </div>

      <div className="space-x-4 mt-2 sm:mt-0 text-sm sm:text-base flex items-center">
        {token ? (
          <>
            <Link to="/upload" className="hover:text-gray-200">
              Upload
            </Link>
            <Link to="/dashboard" className="hover:text-gray-200">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 transition font-medium"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-200">
              Login
            </Link>
            <Link to="/register" className="hover:text-gray-200">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
