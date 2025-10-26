import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Records.css';

const Records = () => {
  const [data, setData] = useState([]);
  const [file, setFile] = useState(null);

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a CSV file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8002/upload_csv/", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.records) {
      setData(result.records);
    } else {
      alert(result.error || "Upload failed");
    }
  };

  return (
    <div className="records-page">
      <h1>Forecast Records</h1>

      <div className="upload-section">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={handleFileUpload}>Upload CSV</button>
      </div>

      {data.length > 0 && (
        <div className="charts-container">
          <div className="chart-card">
            <h2>CSV Data Visualization</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="level" stroke="#82ca9d" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;