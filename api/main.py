from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from statsmodels.tsa.arima.model import ARIMA
import numpy as np
import pandas as pd

app = FastAPI()

# Allow CORS (React frontend calls backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define input schema
class CropData(BaseModel):
    crop: str

@app.post("/predict")
async def predict_price(data: CropData):
    # Dummy sample data (you will replace with real API fetch later)
    price_history = np.random.uniform(10, 100, size=30)  # 30 days random prices

    # Train ARIMA model
    model = ARIMA(price_history, order=(2, 1, 2))
    model_fit = model.fit()

    # Predict next 7 days
    forecast = model_fit.forecast(steps=7)
    forecast = forecast.tolist()

    return {"predicted_prices": forecast}
