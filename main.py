from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import requests
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_URL = "https://san1802-lung-cancer-ai.hf.space/call/predict"

@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = "data:image/png;base64," + base64.b64encode(contents).decode()

    response = requests.post(
        HF_URL,
        json={"data": [base64_image]}
    )

    return response.json()
