from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn

app = FastAPI()

# Allow requests from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to your frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload_csv/")
async def upload_csv(file: UploadFile = File(...)):
    try:
        # Read uploaded CSV
        df = pd.read_csv(file.file)
        
        # Ensure expected columns
        if not {"month", "level"}.issubset(df.columns):
            return {"error": "CSV must contain 'month' and 'level' columns"}

        # Convert to JSON for React chart
        records = df.to_dict(orient="records")

        return {"records": records, "message": "CSV processed successfully"}
    except Exception as e:
        return {"error": str(e)}
    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)