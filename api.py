from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from src.score_new_transactions import (
    load_model_and_threshold,
    score_dataframe,
)


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="Financial Fraud Risk Engine API",
    description="REST API for financial transaction fraud-risk scoring.",
    version="1.0.0",
)


# --------------------------------------------------
# CORS configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Load trained model + saved threshold
# --------------------------------------------------

try:
    model, threshold = load_model_and_threshold()
except Exception as exc:
    raise RuntimeError(
        f"Failed to load fraud model or threshold: {exc}"
    ) from exc


# --------------------------------------------------
# Input transaction schema
# --------------------------------------------------

class Transaction(BaseModel):
    amount: float
    hour: int
    device_risk_score: float
    ip_risk_score: float
    transaction_type: str
    merchant_category: str
    country: str


# --------------------------------------------------
# Root endpoint
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Financial Fraud Risk Engine API",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "predict": "/predict",
    }


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "threshold": float(threshold),
    }


# --------------------------------------------------
# Fraud prediction
# --------------------------------------------------

@app.post("/predict")
def predict(transaction: Transaction):

    try:
        # Convert API request into DataFrame
        df = pd.DataFrame(
            [transaction.model_dump()]
        )

        # Use the existing project scoring function
        scored = score_dataframe(
            df,
            threshold=threshold,
            model=model,
        )

        # Get the first scored transaction
        result = scored.iloc[0]

        # Extract reason codes safely
        reason_codes = result.get("reason_codes", [])

        if reason_codes is None:
            reason_codes = []

        if isinstance(reason_codes, str):
            reason_codes = [
                item.strip()
                for item in reason_codes.split(";")
                if item.strip()
            ]

        fraud_flag = int(result["fraud_flag"])

        return {
            "fraud_probability": float(
                result["fraud_probability"]
            ),
            "fraud_flag": fraud_flag,
            "risk_level": (
                "HIGH"
                if fraud_flag == 1
                else "LOW"
            ),
            "reason_codes": reason_codes,
            "threshold": float(threshold),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc