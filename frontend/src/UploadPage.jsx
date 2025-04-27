import React, { useState } from "react";
import {
  uploadExcelFiles,
  triggerMerge,
  fetchPreview,
  resetAllData,
} from "./api";
import { useNavigate } from "react-router-dom";

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    setError("");
    setMessage("");

    try {
      const res = await uploadExcelFiles(files);
      setMessage(res.data.message);

      await triggerMerge();
      const previewRes = await fetchPreview();
      setPreviewData(previewRes.data);
    } catch (err) {
      setError("Upload failed. Check your login or file format.");
    }
  };

  const handleReset = async () => {
    try {
      await resetAllData();
      setPreviewData([]);
      setMessage("All uploaded and merged data has been reset.");
    } catch (err) {
      setError("Reset failed.");
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Upload Multiple Excel Files</h2>

        <input
          type="file"
          multiple
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          className="mb-4"
        />

        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload Files
          </button>
          <button
            onClick={handleReset}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reset & Re-upload
          </button>
          <button
            onClick={handleGoToDashboard}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Go to Dashboard
          </button>
        </div>

        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {previewData.length > 0 && (
          <div className="overflow-x-auto max-h-[400px] border mt-4">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(previewData[0]).map((col) => (
                    <th key={col} className="p-2 border-b text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((val, i) => (
                      <td key={i} className="p-2">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
