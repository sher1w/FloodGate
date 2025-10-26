import React, { useState } from 'react';
import './Omen.css';

const Omen = () => {
  const [mode, setMode] = useState('business'); // business or investor
  const [stockName, setStockName] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [aiResponse, setAiResponse] = useState('Provide input and run the omen to get insights...');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = 'http://localhost:8001';

  // Handle file upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFile(file);
  };

  // Call backend API
  const handleRunOmen = async () => {
    // Validation
    if (mode === 'investor' && !stockName) {
      alert('Please enter a stock symbol for investor mode.');
      return;
    }
    if (mode === 'business' && !uploadedFile) {
      alert('Please upload a CSV file for business mode.');
      return;
    }
    if (!userDescription) {
      alert('Please provide a description or context.');
      return;
    }

    setLoading(true);
    setAiResponse('Analyzing...');

    try {
      const formData = new FormData();
      formData.append('user_type', mode);
      formData.append('description', userDescription);

      if (mode === 'investor') {
        formData.append('stock_name', stockName);
      } else if (mode === 'business') {
        formData.append('file', uploadedFile);
      }

      const response = await fetch(`${BACKEND_URL}/oment/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get response');
      }

      const data = await response.json();
      setAiResponse(data.reply);

    } catch (err) {
      console.error(err);
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="omen-container">
      <h1>Omens Dashboard</h1>

      {/* Mode Switch */}
      <div className="mode-switch">
        <button
          className={mode === 'business' ? 'active' : ''}
          onClick={() => {
            setMode('business');
            setAiResponse('Provide input and run the omen to get insights...');
          }}
        >
          Business
        </button>
        <button
          className={mode === 'investor' ? 'active' : ''}
          onClick={() => {
            setMode('investor');
            setAiResponse('Provide input and run the omen to get insights...');
          }}
        >
          Investor
        </button>
      </div>

      {/* Input Section */}
      <div className="input-section">
        {mode === 'business' ? (
          <>
            <label>Upload Sales CSV:</label>
            <input type="file" accept=".csv" onChange={handleCSVUpload} />
            {uploadedFile && <p style={{ fontSize: '0.9em', color: '#666' }}>Selected: {uploadedFile.name}</p>}
          </>
        ) : (
          <>
            <label>Enter Stock Symbol:</label>
            <input
              type="text"
              placeholder="e.g. AAPL"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
            />
          </>
        )}
        
        <label>Add Description / Notes:</label>
        <textarea
          placeholder="Describe context, concerns, or queries..."
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          rows={3}
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '5px', 
            border: '1px solid #ddd',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}
        />
        
        <button 
          className="predict-btn" 
          onClick={handleRunOmen}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Run Omens'}
        </button>
      </div>

      {/* AI Response */}
      <div className="forecast-summary">
        <div className="forecast-card omens-response">
          <h3>AI Insight</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
        </div>
      </div>
    </div>
  );
};

export default Omen;