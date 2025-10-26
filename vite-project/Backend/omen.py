from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import requests

# Set your Gemini API key
GEMINI_KEY = "AIzaSyD0aE4WSVcN5yrXbtN0uWZO_H_hsXCrRwE"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_KEY}"

app = FastAPI(title="Omen Backend", version="1.0")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/oment/chat')
async def oment_chat(
    user_type: str = Form(...),  # 'investor' or 'business'
    description: str = Form(...),
    stock_name: str = Form(None),
    file: UploadFile = File(None)
):
    if user_type not in ('investor', 'business'):
        raise HTTPException(status_code=400, detail="user_type must be 'investor' or 'business'")
    
    # Prepare input content
    content = description
    
    if user_type == 'investor' and stock_name:
        content = f"Stock: {stock_name}\n{description}"
    elif user_type == 'business' and file:
        try:
            df = pd.read_csv(io.BytesIO(await file.read()))
            content = f"Business CSV data:\n{df.head(5).to_csv(index=False)}\n{description}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV read error: {str(e)}")
    
    # Build prompt
    system_prompt = (
        "You are Omen, an AI advisor for investors. Provide 3 simple actionable insights. dont overdo the text response, search the web for latest headlines/sentiments to give the best possible response" 
        if user_type == 'investor'
        else "You are Omen, an AI advisor for small business owners. Provide 3 simple actionable insights. dont overdo the text response, search the web for latest headlines/sentiments to give the best possible response"
    )
    
    prompt = f"{system_prompt}\n\nUser input:\n{content}"
    
    # Call Gemini API
    try:
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
        
        return {"reply": reply}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.get('/oment/health')
def health():
    return {"status": "ok"}