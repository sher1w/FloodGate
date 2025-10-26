import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceDot
} from 'recharts';
import './Home.css';

const Home = () => {
    const [mode, setMode] = useState('business'); // or 'stocks'
    const [stockName, setStockName] = useState('');
    const [forecastMsg, setForecastMsg] = useState('Balance');
    const [predictedValue, setPredictedValue] = useState('—');
    const [aiInsight, setAiInsight] = useState('Awaiting data...');
    const [chartData, setChartData] = useState([]); // Empty initially
    const [csvFile, setCsvFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const BACKEND_URL = 'http://localhost:8000';

   
    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCsvFile(file);
            setAiInsight(`Uploaded file: ${file.name}. Ready for prediction.`);
        }
    };

    
    const handlePredict = async () => {
        setLoading(true);
        try {
            let response;
            if (mode === 'business') {
                if (!csvFile) {
                    alert('Please upload a CSV file first.');
                    setLoading(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', csvFile);

                response = await fetch(`${BACKEND_URL}/predict/business`, {
                    method: 'POST',
                    body: formData,
                });
            } else {
                if (!stockName) {
                    alert('Please enter a stock symbol.');
                    setLoading(false);
                    return;
                }
                const formData = new FormData();
                formData.append('symbol', stockName);

                response = await fetch(`${BACKEND_URL}/predict/stock`, {
                    method: 'POST',
                    body: formData,
                });
            }

            const data = await response.json();

            // Update state with backend response
            setPredictedValue(data.forecast_value);
            setForecastMsg(data.trend);
            setAiInsight(data.ai_insight);
            setChartData(data.chart_data); // Use chart data from backend

        } catch (err) {
            console.error(err);
            alert('Error predicting. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-container">
            <h1>Forecast Dashboard</h1>

            {/* Mode Switch */}
            <div className="mode-switch">
                <button
                    className={mode === 'business' ? 'active' : ''}
                    onClick={() => {
                        setMode('business');
                        setChartData([]); // Clear chart when switching modes
                        setPredictedValue('—');
                        setForecastMsg('Balance');
                        setAiInsight('Awaiting data...');
                    }}
                >
                    Business Forecast
                </button>
                <button
                    className={mode === 'stocks' ? 'active' : ''}
                    onClick={() => {
                        setMode('stocks');
                        setChartData([]); // Clear chart when switching modes
                        setPredictedValue('—');
                        setForecastMsg('Balance');
                        setAiInsight('Awaiting data...');
                    }}
                >
                    Stock Forecast
                </button>
            </div>

            {/* Input Section */}
            <div className="input-section">
                {mode === 'business' ? (
                    <>
                        <label>Upload Sales CSV:</label>
                        <input type="file" accept=".csv" onChange={handleCSVUpload} />
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
                <button 
                    className="predict-btn" 
                    onClick={handlePredict}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Run Prediction'}
                </button>
            </div>

            {/* Forecast Summary */}
            <div className="forecast-summary">
                <div className={`forecast-card ${forecastMsg.toLowerCase()}`}>
                    <h3>Forecast</h3>
                    <p>{forecastMsg}</p>
                </div>

                <div className="forecast-card">
                    <h3>Predicted Next-Month Value</h3>
                    <p>{predictedValue}</p>
                </div>

                <div className="forecast-card">
                    <h3>AI Insight</h3>
                    <p>{aiInsight}</p>
                </div>
            </div>

            {/* Trend Chart */}
            <div className="chart-container">
                <h2>Trend Overview</h2>

                {chartData.length === 0 ? (
                    <div style={{ 
                        height: '350px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        color: '#6b7280'
                    }}>
                        <p>No data yet. Run a prediction to see the trend.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />

                            {/* Actual Line (all except predicted point) */}
                            <Line
                                type="monotone"
                                data={chartData.filter(d => !d.predicted)}
                                dataKey="value"
                                stroke="#2563EB"
                                strokeWidth={3}
                                dot={{ r: 5 }}
                                activeDot={{ r: 7 }}
                                name="Actual"
                            />

                            {/* Predicted Segment (connecting last actual to prediction) */}
                            {chartData.some(d => d.predicted) && (
                                <Line
                                    type="monotone"
                                    data={chartData.slice(chartData.length - 2)}
                                    dataKey="value"
                                    stroke="#F59E0B"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    dot={{ r: 8, fill: '#F59E0B' }}
                                    name="Predicted"
                                />
                            )}

                            {/* Highlight last predicted point */}
                            {chartData[chartData.length - 1]?.predicted && (
                                <ReferenceDot
                                    x={chartData[chartData.length - 1].month}
                                    y={chartData[chartData.length - 1].value}
                                    r={6}
                                    fill="#F59E0B"
                                    label="Forecast"
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default Home;