// src/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

// A simple check if token exists
const isAuthenticated = () => !!localStorage.getItem("token");

export default function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    // 🚫 Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }
  // ✅ Logged in, show the page
  return children;
}
