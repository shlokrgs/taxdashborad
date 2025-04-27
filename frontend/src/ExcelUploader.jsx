// src/ExcelUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from "./AuthContext";  // Import AuthContext for token

export default function ExcelUploader({ onUploadSuccess }) {
  const { token } = useAuth();  // Use the token from context
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(e.target.files);
    setMessage('');
    setError('');
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError('Please select at least one Excel file.');
      return;
    }

    const formData = new FormData();
    for (let file of files) {
      formData.append('files', file);
    }

    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,   // <-- Attach token properly
        },
      });
      setMessage(res.data.message);
      setError('');
      onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
      setMessage('');
    }
  };

  const handleReset = async () => {
    try {
      await axios.delete('http://localhost:8000/reset', {
        headers: {
          'Authorization': `Bearer ${token}`,   // <-- Attach token on reset too
        },
      });
      setFiles([]);
      setMessage('Reset successful. You can re-upload now.');
      setError('');
    } catch (err) {
      setError('Failed to reset.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-xl">
      <h2 className="text-xl font-bold mb-4">Upload Multiple Excel Files</h2>
      <input
        type="file"
        multiple
        accept=".xls,.xlsx"
        onChange={handleFileChange}
        className="block w-full mb-4 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-gray-300 file:bg-white file:text-gray-700 hover:file:bg-gray-100"
      />
      <div className="flex gap-4">
        <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Upload Files
        </button>
        <button onClick={handleReset} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
          Reset & Re-upload
        </button>
      </div>
      {message && <p className="mt-4 text-green-600">✅ {message}</p>}
      {error && <p className="mt-4 text-red-600">❌ {error}</p>}
    </div>
  );
}
