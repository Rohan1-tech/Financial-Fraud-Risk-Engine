from __future__ import annotations

import io
import json
from pathlib import Path
from typing import Any

import pandas as pd
import scipy.sparse as sp
import shap

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.config import (
    METRICS_DIR,
    PROCESSED_DATA_DIR,
    TARGET_COL,
)

from src.dashboard_utils import (
    add_risk_band,
    build_model_metadata,
    summarize_scored_transactions,
)

from src.reason_codes import (
    positive_class_shap_values,
    shap_reason_codes,
    split_reason_codes,
)

from src.score_new_transactions import (
    load_model_and_threshold,
    score_dataframe,
)

from src.validation import (
    REQUIRED_FEATURE_COLUMNS,
    DataValidationError,
    validate_scoring_dataframe,
    validate_threshold,
)


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "fraud_pipeline.joblib"
)

THRESHOLD_PATH = (
    PROJECT_ROOT
    / "models"
    / "threshold.json"
)

TEST_DATA_PATH = (
    PROCESSED_DATA_DIR
    / "transactions_test.csv"
)

METRICS_PATH = (
    METRICS_DIR
    / "metrics.json"
)

EVALUATION_SUMMARY_PATH = (
    METRICS_DIR
    / "evaluation_summary.json"
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Financial Fraud Risk Engine API",
    description=(
        "Backend API for the Financial Fraud Risk Engine. "
        "Provides fraud scoring, dashboard analytics, "
        "transaction explanations, SHAP explanations, "
        "CSV scoring and CSV export."
    ),
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# LOAD MODEL + SAVED THRESHOLD
# ============================================================

try:
    model, saved_threshold = (
        load_model_and_threshold()
    )

except Exception as exc:
    raise RuntimeError(
        "Failed to load fraud model or threshold: "
        f"{exc}"
    ) from exc


# ============================================================
# REQUEST SCHEMA
# ============================================================

class Transaction(BaseModel):
    amount: float
    hour: int
    device_risk_score: float
    ip_risk_score: float
    transaction_type: str
    merchant_category: str
    country: str


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def resolve_threshold(
    threshold: float | None,
) -> float:
    """
    Resolve the decision threshold.

    If the frontend sends a threshold, use it.
    Otherwise use the saved project threshold.
    """

    if threshold is None:
        return float(saved_threshold)

    try:
        return validate_threshold(
            float(threshold)
        )

    except DataValidationError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


def load_json_file(
    path: Path,
) -> dict[str, Any]:
    """
    Safely load a JSON file.
    """

    if not path.exists():
        return {}

    try:
        with path.open(
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    except (
        json.JSONDecodeError,
        OSError,
    ):
        return {}


def load_sample_data() -> pd.DataFrame:
    """
    Load the same processed test dataset
    used by the Streamlit application.
    """

    if not TEST_DATA_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=(
                "Processed test dataset not found: "
                f"{TEST_DATA_PATH}"
            ),
        )

    try:
        return pd.read_csv(
            TEST_DATA_PATH
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load processed test "
                f"dataset: {exc}"
            ),
        ) from exc


def score_transactions_dataframe(
    df: pd.DataFrame,
    threshold: float,
) -> pd.DataFrame:
    """
    Validate and score a transaction dataframe
    using the project's existing ML pipeline.
    """

    try:
        validate_scoring_dataframe(
            df,
            context="transaction data",
        )

        scored = score_dataframe(
            df,
            threshold=threshold,
            model=model,
        )

        # Same risk-band logic used by Streamlit.
        scored = add_risk_band(
            scored
        )

        return scored

    except DataValidationError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Transaction scoring failed: "
                f"{exc}"
            ),
        ) from exc


def make_json_safe(
    value: Any,
) -> Any:
    """
    Convert pandas/numpy values to JSON-safe values.
    """

    if value is None:
        return None

    try:
        if pd.isna(value):
            return None
    except (
        TypeError,
        ValueError,
    ):
        pass

    if hasattr(value, "item"):
        try:
            return value.item()
        except (
            TypeError,
            ValueError,
        ):
            pass

    return value


def transaction_to_dict(
    row: pd.Series,
) -> dict[str, Any]:
    """
    Convert one transaction row into a JSON-safe dict.
    """

    result: dict[str, Any] = {}

    for column, value in row.items():

        if column == "reason_codes":
            result[column] = split_reason_codes(
                value
            )

        else:
            result[column] = make_json_safe(
                value
            )

    return result


def dataframe_to_records(
    df: pd.DataFrame,
) -> list[dict[str, Any]]:
    """
    Convert a dataframe into JSON-safe records.
    """

    return [
        transaction_to_dict(row)
        for _, row in df.iterrows()
    ]


def get_summary(
    scored: pd.DataFrame,
    threshold: float,
) -> dict[str, Any]:
    """
    Generate the exact dashboard summary
    using the project's summary function.
    """

    summary = (
        summarize_scored_transactions(
            scored,
            threshold,
        )
    )

    true_fraud_rate = (
        summary.get("true_fraud_rate")
    )

    return {
        "total_transactions": int(
            summary["total_transactions"]
        ),
        "flagged_transactions": int(
            summary["flagged_count"]
        ),
        "flagged_rate": float(
            summary["flagged_rate"]
        ),
        "p95_fraud_probability": float(
            summary["p95_probability"]
        ),
        "average_probability": float(
            summary["average_probability"]
        ),
        "max_probability": float(
            summary["max_probability"]
        ),
        "true_fraud_rate": (
            None
            if true_fraud_rate is None
            else float(true_fraud_rate)
        ),
        "threshold": float(
            summary["selected_threshold"]
        ),
    }


def get_risk_counts(
    scored: pd.DataFrame,
) -> dict[str, int]:
    """
    Return risk-band counts in the same order
    used by the Streamlit dashboard.
    """

    counts = (
        scored["risk_band"]
        .value_counts()
        .reindex(
            [
                "Low",
                "Medium",
                "High",
                "Critical",
            ],
            fill_value=0,
        )
    )

    return {
        "Low": int(
            counts["Low"]
        ),
        "Medium": int(
            counts["Medium"]
        ),
        "High": int(
            counts["High"]
        ),
        "Critical": int(
            counts["Critical"]
        ),
    }


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": (
            "Financial Fraud Risk Engine API"
        ),
        "status": "online",
        "version": "2.0.0",
        "endpoints": {
            "health": "/health",
            "metadata": "/metadata",
            "transactions": "/transactions",
            "transaction_detail": (
                "/transactions/{transaction_id}"
            ),
            "transaction_explanation": (
                "/transactions/{transaction_id}/explanation"
            ),
            "predict": "/predict",
            "score": "/score",
            "score_csv": "/score-csv",
            "export_csv": "/export.csv",
            "docs": "/docs",
        },
    }


# ============================================================
# HEALTH ENDPOINT
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "threshold": float(
            saved_threshold
        ),
        "shap_available": True,
    }


# ============================================================
# MODEL METADATA
# ============================================================

@app.get("/metadata")
def metadata():
    """
    Return model metadata used by the dashboard.
    """

    threshold_info = load_json_file(
        THRESHOLD_PATH
    )

    train_metrics = load_json_file(
        METRICS_PATH
    )

    evaluation_summary = load_json_file(
        EVALUATION_SUMMARY_PATH
    )

    model_metadata = (
        build_model_metadata(
            model,
            threshold_info,
            train_metrics,
            evaluation_summary,
        )
    )

    return {
        "model_type": model_metadata.get(
            "model_type"
        ),
        "saved_threshold": model_metadata.get(
            "saved_threshold"
        ),
        "roc_auc": model_metadata.get(
            "roc_auc"
        ),
        "average_precision": model_metadata.get(
            "average_precision"
        ),
        "brier_score": model_metadata.get(
            "brier_score"
        ),
        "positive_rate_train": model_metadata.get(
            "positive_rate_train"
        ),
        "positive_rate_test": model_metadata.get(
            "positive_rate_test"
        ),
        "n_train_samples": model_metadata.get(
            "n_train_samples"
        ),
        "n_test_samples": model_metadata.get(
            "n_test_samples"
        ),
        "threshold_cost": model_metadata.get(
            "threshold_cost"
        ),
        "threshold_recall": model_metadata.get(
            "threshold_recall"
        ),
        "threshold_precision": model_metadata.get(
            "threshold_precision"
        ),
        "data_note": model_metadata.get(
            "data_note"
        ),
        "required_columns": list(
            REQUIRED_FEATURE_COLUMNS
        ),
        "target_column": TARGET_COL,
        "disclaimer": (
            "This dashboard uses a synthetic demo "
            "dataset with overlapping classes and "
            "label noise. It demonstrates fraud-risk "
            "workflow design, not real-world fraud "
            "benchmark performance."
        ),
    }


# ============================================================
# ALL TRANSACTIONS
# ============================================================

@app.get("/transactions")
def transactions(
    threshold: float | None = Query(
        default=None,
        ge=0.0,
        le=1.0,
    ),
):
    """
    Return all scored transactions.

    Used by:
        Dashboard
        Transactions
        Analytics
    """

    selected_threshold = (
        resolve_threshold(threshold)
    )

    raw_data = load_sample_data()

    scored = score_transactions_dataframe(
        raw_data,
        selected_threshold,
    )

    return {
        "summary": get_summary(
            scored,
            selected_threshold,
        ),
        "risk_counts": get_risk_counts(
            scored
        ),
        "transactions": dataframe_to_records(
            scored
        ),
    }


# ============================================================
# SINGLE TRANSACTION DETAIL
# ============================================================

@app.get(
    "/transactions/{transaction_id}"
)
def transaction_detail(
    transaction_id: str,
    threshold: float | None = Query(
        default=None,
        ge=0.0,
        le=1.0,
    ),
):
    """
    Return complete information for one transaction.
    """

    selected_threshold = (
        resolve_threshold(threshold)
    )

    raw_data = load_sample_data()

    scored = score_transactions_dataframe(
        raw_data,
        selected_threshold,
    )

    matches = scored[
        scored["transaction_id"].astype(str)
        == str(transaction_id)
    ]

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Transaction {transaction_id} "
                "was not found."
            ),
        )

    row = matches.iloc[0]

    return transaction_to_dict(
        row
    )


# ============================================================
# SHAP EXPLANATION
# ============================================================

@app.get(
    "/transactions/{transaction_id}/explanation"
)
def transaction_explanation(
    transaction_id: str,
    threshold: float | None = Query(
        default=None,
        ge=0.0,
        le=1.0,
    ),
):
    """
    Compute SHAP feature contributions for
    a single transaction.

    This follows the same SHAP workflow
    implemented in app.py.
    """

    selected_threshold = (
        resolve_threshold(threshold)
    )

    raw_data = load_sample_data()

    scored = score_transactions_dataframe(
        raw_data,
        selected_threshold,
    )

    matches = scored[
        scored["transaction_id"].astype(str)
        == str(transaction_id)
    ]

    if matches.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Transaction {transaction_id} "
                "was not found."
            ),
        )

    # IMPORTANT:
    # score_dataframe sorts and resets the index.
    # Therefore use the position inside `matches`
    # and keep the selected row explicitly.
    row = matches.iloc[0]

    row_position = (
        scored.index[
            scored["transaction_id"].astype(str)
            == str(transaction_id)
        ][0]
    )

    try:
        # Same underlying model structure
        # used by the Streamlit application.
        preprocessor = (
            model.named_steps[
                "preprocess"
            ]
        )

        clf = (
            model.named_steps[
                "clf"
            ]
        )

        explainer = (
            shap.TreeExplainer(
                clf
            )
        )

        # Remove model-output columns before
        # passing the transaction through the
        # preprocessing pipeline.
        cols_to_drop = [
            TARGET_COL,
            "fraud_probability",
            "fraud_flag",
            "risk_band",
            "reason_codes",
        ]

        feature_columns = [
            column
            for column in scored.columns
            if column not in cols_to_drop
        ]

        features_df = scored[
            feature_columns
        ]

        # Same row-position logic as Streamlit.
        x_row = features_df.iloc[
            [row_position]
        ]

        x_transformed = (
            preprocessor.transform(
                x_row
            )
        )

        # TreeExplainer expects dense values
        # for sparse transformed matrices.
        if sp.issparse(
            x_transformed
        ):
            x_for_shap = (
                x_transformed.toarray()
            )
        else:
            x_for_shap = x_transformed

        shap_values_raw = (
            explainer.shap_values(
                x_for_shap
            )
        )

        # Normalize SHAP output across
        # supported SHAP versions.
        shap_for_fraud_class = (
            positive_class_shap_values(
                shap_values_raw
            )[0]
        )

        feature_names = (
            preprocessor
            .get_feature_names_out()
        )

        shap_values = []

        for feature_name, value in zip(
            feature_names,
            shap_for_fraud_class,
        ):
            numeric_value = float(
                value
            )

            shap_values.append(
                {
                    "feature": str(
                        feature_name
                    ),
                    "value": numeric_value,
                    "absolute_value": abs(
                        numeric_value
                    ),
                }
            )

        # Match Streamlit:
        # top features by absolute SHAP value.
        shap_values.sort(
            key=lambda item: item[
                "absolute_value"
            ],
            reverse=True,
        )

        top_shap_values = (
            shap_values[:10]
        )

        # Same SHAP reason-code function
        # used by the Streamlit app.
        shap_reasons = (
            shap_reason_codes(
                shap_for_fraud_class,
                feature_names,
                max_reasons=5,
            )
        )

        return {
            "transaction_id": str(
                transaction_id
            ),
            "fraud_probability": float(
                row["fraud_probability"]
            ),
            "fraud_flag": int(
                row["fraud_flag"]
            ),
            "risk_band": str(
                row["risk_band"]
            ),
            "shap_values": top_shap_values,
            "shap_reason_codes": (
                shap_reasons
            ),
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to calculate SHAP "
                f"explanation: {exc}"
            ),
        ) from exc


# ============================================================
# SINGLE TRANSACTION PREDICTION
# ============================================================

@app.post("/predict")
def predict(
    transaction: Transaction,
):
    """
    Score one transaction.
    """

    try:
        df = pd.DataFrame(
            [
                transaction.model_dump()
            ]
        )

        scored = score_dataframe(
            df,
            threshold=float(
                saved_threshold
            ),
            model=model,
        )

        result = scored.iloc[0]

        probability = float(
            result[
                "fraud_probability"
            ]
        )

        fraud_flag = int(
            result["fraud_flag"]
        )

        # Use the same risk-band boundaries
        # as dashboard_utils.add_risk_band().
        if probability <= 0.25:
            risk_band = "Low"

        elif probability <= 0.50:
            risk_band = "Medium"

        elif probability <= 0.75:
            risk_band = "High"

        else:
            risk_band = "Critical"

        reason_codes = (
            split_reason_codes(
                result.get(
                    "reason_codes"
                )
            )
        )

        return {
            "fraud_probability": probability,
            "fraud_flag": fraud_flag,
            "risk_level": risk_band,
            "risk_band": risk_band,
            "reason_codes": reason_codes,
            "threshold": float(
                saved_threshold
            ),
        }

    except DataValidationError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# ============================================================
# BATCH JSON SCORING
# ============================================================

@app.post("/score")
def score_batch(
    transactions_data: list[Transaction],
    threshold: float | None = Query(
        default=None,
        ge=0.0,
        le=1.0,
    ),
):
    """
    Score multiple transactions supplied as JSON.
    """

    if not transactions_data:
        raise HTTPException(
            status_code=400,
            detail=(
                "No transactions supplied."
            ),
        )

    selected_threshold = (
        resolve_threshold(threshold)
    )

    df = pd.DataFrame(
        [
            transaction.model_dump()
            for transaction in transactions_data
        ]
    )

    scored = score_transactions_dataframe(
        df,
        selected_threshold,
    )

    return {
        "summary": get_summary(
            scored,
            selected_threshold,
        ),
        "risk_counts": get_risk_counts(
            scored
        ),
        "transactions": dataframe_to_records(
            scored
        ),
    }


# ============================================================
# CSV UPLOAD + SCORING
# ============================================================

@app.post("/score-csv")
async def score_csv(
    file: UploadFile = File(...),
    threshold: float | None = Query(
        default=None,
        ge=0.0,
        le=1.0,
    ),
):
    """
    Upload a CSV and score it using
    the same project scoring pipeline
    used by Streamlit.
    """

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No CSV file supplied.",
        )

    if not file.filename.lower().endswith(
        ".csv"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV files are supported."
            ),
        )

    selected_threshold = (
        resolve_threshold(threshold)
    )

    try:
        contents = await file.read()

        df = pd.read_csv(
            io.BytesIO(contents)
        )

        scored = score_transactions_dataframe(
            df,
            selected_threshold,
        )

        return {
            "filename": file.filename,
            "summary": get_summary(
                scored,
                selected_threshold,
            ),
            "risk_counts": get_risk_counts(
                scored
            ),
            "transactions": dataframe_to_records(
                scored
            ),
        }

    except pd.errors.EmptyDataError as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded CSV is empty."
            ),
        ) from exc

    except pd.errors.ParserError as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not parse the uploaded CSV: "
                f"{exc}"
            ),
        ) from exc

    except DataValidationError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "CSV scoring failed: "
                f"{exc}"
            ),
        ) from exc


# ============================================================
# CSV EXPORT
# ============================================================

@app.get("/export.csv")
def export_csv(
    threshold: float | None = Query(
        default=None,
        ge=0.0,
        le=1.0,
    ),
):
    """
    Export the built-in scored test dataset.

    The exported file contains the same scored
    transaction information used by the dashboard.
    """

    selected_threshold = (
        resolve_threshold(threshold)
    )

    raw_data = load_sample_data()

    scored = score_transactions_dataframe(
        raw_data,
        selected_threshold,
    )

    csv_buffer = io.StringIO()

    scored.to_csv(
        csv_buffer,
        index=False,
    )

    csv_buffer.seek(0)

    filename = (
        "fraud_scored_transactions_"
        f"threshold_{selected_threshold:.2f}.csv"
    )

    return StreamingResponse(
        iter(
            [
                csv_buffer.getvalue()
            ]
        ),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )