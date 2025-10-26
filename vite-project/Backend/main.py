from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from prophet import Prophet
import yfinance as yf
import requests
import json
from typing import List, Dict

# Set your Gemini API key
GEMINI_KEY = "AIzaSyD0aE4WSVcN5yrXbtN0uWZO_H_hsXCrRwE"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_KEY}"

app = FastAPI()

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChartDataPoint(BaseModel):
    month: str
    value: float
    predicted: bool = False

class ForecastResponse(BaseModel):
    forecast_value: float
    trend: str
    ai_insight: str
    chart_data: List[ChartDataPoint]

# Helper function for AI insight using Gemini
def generate_ai_insight(summary_text: str):
    try:
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"You are a financial forecasting assistant. {summary_text} Provide a brief insight in 1-2 sentences."
                }]
            }]
        }
        
        response = requests.post(GEMINI_URL, json=payload)
        response.raise_for_status()
        
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        return f"Unable to generate insight: {str(e)}"


@app.post("/predict/business", response_model=ForecastResponse)
async def predict_business(file: UploadFile = File(...)):
    try:
        # Read CSV
        df = pd.read_csv(file.file)
        
        # Validate required columns
        if 'ds' not in df.columns or 'y' not in df.columns:
            raise ValueError("CSV must contain 'ds' (date) and 'y' (value) columns")
        
        # Ensure ds is datetime
        df['ds'] = pd.to_datetime(df['ds'])
        
        # Prophet model
        model = Prophet(daily_seasonality=False, yearly_seasonality=True)
        model.fit(df)
        
        # Forecast next month
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        next_value = forecast['yhat'].iloc[-1]

        # Determine trend
        mean_value = df['y'].mean()
        trend = "Balance"
        if next_value > mean_value * 1.1:
            trend = "Flood"
        elif next_value < mean_value * 0.9:
            trend = "Famine"

        # Generate AI insight using Gemini
        ai_insight = generate_ai_insight(f"Next month's forecast is {next_value:.2f}. Trend: {trend}.")

        # Prepare chart data (last 6 months + prediction)
        chart_data = []
        last_6_months = df.tail(6)
        
        for idx, row in last_6_months.iterrows():
            chart_data.append({
                "month": row['ds'].strftime('%b'),
                "value": round(float(row['y']), 2),
                "predicted": False
            })
        
        # Add predicted value
        chart_data.append({
            "month": "Next (Pred)",
            "value": round(next_value, 2),
            "predicted": True
        })

        return {
            "forecast_value": round(next_value, 2),
            "trend": trend,
            "ai_insight": ai_insight,
            "chart_data": chart_data
        }
    
    except Exception as e:
        return {
            "forecast_value": 0,
            "trend": "Error",
            "ai_insight": f"Error processing business data: {str(e)}",
            "chart_data": []
        }


@app.post("/predict/stock", response_model=ForecastResponse)
async def predict_stock(symbol: str = Form(...)):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="6mo")
        
        if hist.empty:
            raise ValueError(f"No data found for symbol: {symbol}")
        
        
        hist = hist.tail(6)
        
        # Prepare historical data for chart
        chart_data = []
        for date, row in hist.iterrows():
            chart_data.append({
                "month": date.strftime('%b'),
                "value": round(float(row['Close']), 2),
                "predicted": False
            })
        
        # Get current average for context
        avg_price = hist['Close'].mean()
        last_price = hist['Close'].iloc[-1]
        
        # Use Gemini to predict next value
        prompt = (
            f"You are a financial advisor analyzing the stock '{symbol}'. "
            f"The last 6 months closing prices are: {hist['Close'].tolist()}. "
            f"The current price is ${last_price:.2f} and the 6-month average is ${avg_price:.2f}. "
            f"Predict the next day's closing price. "
            f"Also determine the trend: 'Flood' if predicted price is >10% above average, "
            f"'Famine' if <10% below average, otherwise 'Balance'. "
            f"Provide a brief insight (max 50 words). "
            f"Return ONLY valid JSON in this exact format with no markdown: "
            f'{{"forecast_value": <number>, "trend": "<Balance/Flood/Famine>", "ai_insight": "<string>"}}'
        )

        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        response = requests.post(GEMINI_URL, json=payload)
        response.raise_for_status()
        
        result = response.json()
        reply = result['candidates'][0]['content']['parts'][0]['text'].strip()
        
        # Remove markdown code blocks if present
        if reply.startswith('```'):
            reply = reply.split('```')[1]
            if reply.startswith('json'):
                reply = reply[4:]
            reply = reply.strip()
        
        # Parse JSON response
        prediction = json.loads(reply)
        
        # Add predicted value to chart
        chart_data.append({
            "month": "Next (Pred)",
            "value": round(float(prediction['forecast_value']), 2),
            "predicted": True
        })
        
        return {
            "forecast_value": round(float(prediction['forecast_value']), 2),
            "trend": prediction['trend'],
            "ai_insight": prediction['ai_insight'],
            "chart_data": chart_data
        }

    except Exception as e:
        return {
            "forecast_value": 0,
            "trend": "Error",
            "ai_insight": f"Error: {str(e)}",
            "chart_data": []
        }