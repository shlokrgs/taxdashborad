// src/api.js
import axios from "axios";

// 🔗 Backend Base URL
const API_URL = "http://localhost:8000";

// 🔐 Auth Headers Helper
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 🔐 AUTH
export const registerUser = (username, password) =>
  axios.post(`${API_URL}/register`, { username, password });

export const loginUser = (username, password) =>
  axios.post(
    `${API_URL}/login`,
    new URLSearchParams({ username, password }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

// 📤 UPLOAD
export const uploadExcelFiles = (files) => {
  const formData = new FormData();
  for (let file of files) {
    formData.append("files", file);
  }
  return axios.post(`${API_URL}/upload`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
};

// 🔄 MERGE
export const triggerMerge = () =>
  axios.get(`${API_URL}/merge`, { headers: getAuthHeaders() });

// 👁️ PREVIEW
export const fetchPreview = () =>
  axios.get(`${API_URL}/preview`, { headers: getAuthHeaders() });

// 📊 SUMMARY (with filters)
export const fetchSummary = (filters) =>
  axios.get(`${API_URL}/summary`, {
    headers: getAuthHeaders(),
    params: filters,
  });

// ⬇️ DOWNLOAD FILTERED DATA
export const downloadMergedExcel = () =>
  axios.get(`${API_URL}/download`, {
    headers: getAuthHeaders(),
    responseType: "blob",
  });

// 💾 SAVE EDITED DATA
export const saveEditedData = (data) =>
  axios.post(`${API_URL}/save-edits`, data, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

// 🔁 RESET ALL USER DATA
export const resetAllData = () =>
  axios.delete(`${API_URL}/reset`, { headers: getAuthHeaders() });
