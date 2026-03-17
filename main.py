from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from gradio_client import Client, handle_file
import tempfile

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to HuggingFace Space
client = Client("san1802/lung-cancer-ai")

@app.get("/")
def home():
    return {"message": "Backend running 🚀"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            temp.write(contents)
            temp_path = temp.name

        # Send file to model using gradio client
        result = client.predict(
            handle_file(temp_path)
        )

        return {"data": result}

    except Exception as e:
        return {"error": str(e)}
