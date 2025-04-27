import React, { useEffect, useState } from "react";
import {
  fetchPreview,
  fetchSummary,
  downloadMergedExcel,
} from "./api";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [previewData, setPreviewData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [filters, setFilters] = useState({});
  const [columns, setColumns] = useState([]);
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const preview = await fetchPreview();
      setPreviewData(preview.data);
      setColumns(preview.data.length > 0 ? Object.keys(preview.data[0]) : []);

      const summary = await fetchSummary(filters);
      setSummaryData(summary.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = async () => {
    const filterParams = {};
    if (filters["Month"]) filterParams.month = filters["Month"];
    if (filters["Financial Year"]) filterParams.financial_year = filters["Financial Year"];
    if (filters["Product"]) filterParams.product = filters["Product"];
    if (filters["Tax Rate"]) filterParams.tax_rate = filters["Tax Rate"];

    try {
      const filteredSummary = await fetchSummary(filterParams);
      setSummaryData(filteredSummary.data);
    } catch (error) {
      console.error("Filter error:", error);
    }
  };

  const handleDownload = () => {
    downloadMergedExcel()
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "merged_data.xlsx");
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => console.error("Download failed", err));
  };

  const getDropdownValues = (key) =>
    [...new Set(previewData.map((row) => row[key]).filter(Boolean))];

  const totalRow = summaryData.reduce(
    (acc, row) => {
      acc["Qty"] += Number(row["Qty"] || 0);
      acc["Sale Value"] += Number(row["Sale Value"] || 0);
      acc["Tax Value"] += Number(row["Tax Value"] || 0);
      acc["Invoice Value"] += Number(row["Invoice Value"] || 0);
      return acc;
    },
    { "Qty": 0, "Sale Value": 0, "Tax Value": 0, "Invoice Value": 0 }
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded shadow-md">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">📊 Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/upload")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              ⬆ Upload More
            </button>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              ⬇ Download Merged Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {["Month", "Financial Year", "Product", "Tax Rate"].map((filterKey) => (
            <select
              key={filterKey}
              name={filterKey}
              onChange={handleFilterChange}
              className="border p-2 rounded"
            >
              <option value="">{filterKey}</option>
              {getDropdownValues(filterKey).map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>
          ))}
        </div>

        <button
          onClick={applyFilters}
          className="mb-6 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          Apply Filters
        </button>

        {/* Summary Table */}
        {summaryData.length > 0 && (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border">Month</th>
                    <th className="p-2 border">Financial Year</th>
                    <th className="p-2 border">Product</th>
                    <th className="p-2 border">Qty</th>
                    <th className="p-2 border">Sale Value</th>
                    <th className="p-2 border">Tax Value</th>
                    <th className="p-2 border">Invoice Value</th>
                    <th className="p-2 border">Tax Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 border">{row["Month"]}</td>
                      <td className="p-2 border">{row["Financial Year"]}</td>
                      <td className="p-2 border">{row["Product"]}</td>
                      <td className="p-2 border">{row["Qty"]}</td>
                      <td className="p-2 border">{row["Sale Value"]}</td>
                      <td className="p-2 border">{row["Tax Value"]}</td>
                      <td className="p-2 border">{row["Invoice Value"]}</td>
                      <td className="p-2 border">{row["Tax Rate"]}</td>
                    </tr>
                  ))}
                  <tr className="bg-yellow-200 font-bold">
                    <td className="p-2 border" colSpan={3}>
                      TOTAL
                    </td>
                    <td className="p-2 border">{totalRow["Qty"]}</td>
                    <td className="p-2 border">{totalRow["Sale Value"].toFixed(2)}</td>
                    <td className="p-2 border">{totalRow["Tax Value"].toFixed(2)}</td>
                    <td className="p-2 border">{totalRow["Invoice Value"].toFixed(2)}</td>
                    <td className="p-2 border">--</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sale Value" fill="#3b82f6" />
                  <Bar dataKey="Tax Value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Qty" fill="#f59e0b" />
                  <Bar dataKey="Invoice Value" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
