from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client
import tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Client("san1802/lung-cancer-ai")

@app.get("/")
def home():
    return {"message": "Backend running 🚀"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        temp.write(contents)
        temp_path = temp.name

    result = client.predict(temp_path)

    return {"data": result}
