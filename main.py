from fastapi import FastAPI, File, UploadFile
import numpy as np
from PIL import Image
import tensorflow as tf
import gdown
import os

app = FastAPI()

model1 = tf.keras.models.load_model(MODEL1_PATH, compile=False)
model2 = tf.keras.models.load_model(MODEL2_PATH, compile=False)
model1 = None
model2 = None

# ✅ LOAD MODELS AFTER STARTUP
@app.on_event("startup")
def load_models():
    global model1, model2

    if not os.path.exists(MODEL1_PATH):
        gdown.download("https://drive.google.com/uc?id=1Ad8MFhBvdej4O8FDdUzJPBPrumUSIP6k", MODEL1_PATH, quiet=False)

    if not os.path.exists(MODEL2_PATH):
        gdown.download("https://drive.google.com/uc?id=1-QgGa_Z4-Q2fWNiAEiKeKGBWOzaRxmaL", MODEL2_PATH, quiet=False)

    model1 = tf.keras.models.load_model(MODEL1_PATH)
    model2 = tf.keras.models.load_model(MODEL2_PATH)

# ---------------- PREPROCESS ----------------

def preprocess(image):
    image = image.resize((224, 224))
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image

# ---------------- API ----------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(file.file).convert("RGB")
    img = preprocess(image)

    pred1 = model1.predict(img)
    class1 = np.argmax(pred1)
    confidence1 = float(np.max(pred1))

    labels1 = ["Normal", "Benign", "Malignant"]

    result = {
        "primary_prediction": labels1[class1],
        "confidence": confidence1
    }

    if labels1[class1] == "Malignant":
        pred2 = model2.predict(img)
        class2 = np.argmax(pred2)
        confidence2 = float(np.max(pred2))

        labels2 = ["Adenocarcinoma", "Large Cell", "Squamous"]

        result["subtype"] = labels2[class2]
        result["subtype_confidence"] = confidence2

    return result
