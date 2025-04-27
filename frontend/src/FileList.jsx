// FileList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function FileList({ onDelete }) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    try {
      const res = await axios.get('http://localhost:8000/files');
      setFiles(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load uploaded files.');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await axios.delete(`http://localhost:8000/delete/${filename}`);
      setFiles((prev) => prev.filter((file) => file !== filename));
      if (onDelete) onDelete(filename);
    } catch (err) {
      alert('Failed to delete the file.');
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">📁 Uploaded Files</h3>
      {error && <p className="text-red-500">{error}</p>}
      {files.length === 0 ? (
        <p className="text-gray-600 italic">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file} className="flex justify-between items-center p-2 bg-gray-100 rounded-md">
              <span className="truncate text-sm text-gray-700">{file}</span>
              <button
                onClick={() => handleDelete(file)}
                className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}