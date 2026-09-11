<div align="center">

# Financial Fraud Risk Engine

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![scikit-learn](https://img.shields.io/badge/scikit--learn-Risk%20Modeling-green)
![SHAP](https://img.shields.io/badge/SHAP-Explainability-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![Streamlit](https://img.shields.io/badge/Streamlit-Reference%20Dashboard-red)
![Render](https://img.shields.io/badge/Render-Deployed-purple)
![CI](https://github.com/Rohan1-tech/Financial-Fraud-Risk-Engine/actions/workflows/ci.yml/badge.svg)

</div>

A production-minded fraud-risk workflow for detecting suspicious transactions with **cost-sensitive thresholding**, **validation**, **explainability**, **reason codes**, **batch scoring**, **API model serving**, **analyst dashboard review**, and **threshold policy artifacts**.

> **Important:** This project is a **portfolio and research demo**, not a production fraud detection system.
>
> The data is synthetic. The model, thresholds, and reason codes are designed to demonstrate a professional fraud-risk workflow, not to make real financial decisions without expert validation, monitoring, compliance review, governance, and security controls.

---

## Table of Contents

- [Project Overview](#project-overview)
- [What This Project Does](#what-this-project-does)
- [What This Project Does Not Do](#what-this-project-does-not-do)
- [Key Features](#key-features)
- [System Workflow](#system-workflow)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Synthetic Data Generator](#synthetic-data-generator)
- [Training and Evaluation](#training-and-evaluation)
- [Threshold Policy Artifacts](#threshold-policy-artifacts)
- [Batch Scoring](#batch-scoring)
- [FastAPI Backend](#fastapi-backend)
- [React Frontend](#react-frontend)
- [Streamlit Reference Dashboard](#streamlit-reference-dashboard)
- [Explainability and Reason Codes](#explainability-and-reason-codes)
- [Evaluation Metrics](#evaluation-metrics)
- [Verified Deployed Results](#verified-deployed-results)
- [Visual Reports](#visual-reports)
- [Testing and CI](#testing-and-ci)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Responsible Use](#responsible-use)
- [Future Improvements](#future-improvements)
- [Tech Stack](#tech-stack)
- [Author](#author)

---

## Project Overview

Fraud detection is not only a classification problem. Real fraud systems require careful handling of:

- class imbalance
- changing fraud patterns
- false-positive cost
- missed-fraud cost
- human review capacity
- model interpretability
- probability quality
- batch scoring and triage
- validation and monitoring
- threshold selection

This project demonstrates an end-to-end fraud-risk workflow using synthetic transaction data.

It includes:

- data preparation
- model training
- cost-sensitive evaluation
- threshold search
- policy artifacts
- transaction scoring
- risk-band classification
- SHAP explainability
- analyst-friendly reason codes
- FastAPI model serving
- React-based risk monitoring
- user-level risk analysis
- analytics
- model-performance review
- CSV export
- automated testing
- CI
- cloud deployment

The goal is to show how a fraud-risk model can be turned into a **decision-support system**, not just a metric on a notebook.

---

## What This Project Does

This project can:

- Generate a harder synthetic fraud dataset with overlap and label noise
- Prepare train/test transaction datasets
- Train a fraud-risk model using a scikit-learn pipeline
- Evaluate ROC-AUC, PR-AUC, Brier score, and classification metrics
- Compare against simple baselines
- Search thresholds using cost-sensitive metrics
- Generate threshold policy artifacts for analyst review
- Score new transaction CSV files
- Validate required input columns before training or scoring
- Add fraud probabilities and binary fraud flags
- Assign Low / Medium / High / Critical risk bands
- Add analyst-friendly reason codes to scored transactions
- Sort scored outputs by fraud probability
- Provide SHAP explanations for individual transactions
- Serve predictions through a FastAPI backend
- Provide transaction-level REST API access
- Provide user-level risk analysis
- Provide a React analyst-facing frontend
- Provide dashboard-level risk monitoring
- Provide analytics and model-performance views
- Export scored transaction data
- Run automated tests and CI smoke workflows
- Deploy the application for public portfolio demonstration

---

## What This Project Does Not Do

This project does **not**:

- Detect real fraud in production
- Use real banking or payment-network data
- Guarantee fraud decisions are fair, compliant, or deployable
- Replace human fraud analysts
- Replace compliance, legal, or model-risk review
- Provide real-time streaming detection
- Include production-grade drift monitoring
- Include automated production retraining
- Prove performance on real-world fraud distributions
- Provide production-grade authentication and authorization
- Provide production-grade audit logging
- Automatically block financial transactions

A production fraud system would need stronger governance, live monitoring, adversarial testing, compliance controls, access control, audit logging, and human escalation workflows.

---

## Key Features

- **Synthetic fraud data generator** with overlap, class imbalance, and label noise
- **Reusable scikit-learn pipeline** with preprocessing and model training
- **Data validation** for training and scoring inputs
- **Cost-sensitive threshold search**
- **PR-AUC and Brier score** for imbalanced probability evaluation
- **Baseline comparisons** for majority, prior, and stratified-random strategies
- **Threshold policy artifacts** for cost, recall, precision, and review-capacity tradeoffs
- **Batch scoring CLI** for new transaction files
- **Risk-band classification** for analyst-friendly risk interpretation
- **Reason-code generation** for analyst-friendly review
- **SHAP explainability** for selected transactions
- **FastAPI backend** for model serving
- **REST API endpoints** for prediction, scoring, transactions and explanations
- **React frontend** for professional risk monitoring
- **Transaction analysis** for individual risk investigation
- **User risk analysis** for user-level transaction review
- **Analytics dashboard** for portfolio-level monitoring
- **Model Performance dashboard** for model-quality review
- **CSV export** for scored transaction data
- **Streamlit reference dashboard**
- **Unit tests and GitHub Actions CI**
- **Generated reports and figures**
- **Render deployment**

---

## System Workflow

```text
Synthetic or raw transactions
          ↓
Data preparation and validation
          ↓
Train/test split
          ↓
Preprocessing + fraud model pipeline
          ↓
Evaluation metrics and baselines
          ↓
Threshold search and policy artifacts
          ↓
Fraud probability scoring
          ↓
Fraud flag + risk band
          ↓
Reason codes + SHAP explanation
          ↓
FastAPI model-serving API
          ↓
React analyst application
          ↓
Dashboard / Transactions / Users / Analytics
          ↓
Analyst review and CSV export
```

---

## Application Architecture

The project separates the machine-learning workflow from the application and presentation layers.

```text
                    ┌─────────────────────────┐
                    │   Synthetic / Input Data │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Validation & Preparation│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Preprocessing + ML Model │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Fraud Probability     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Threshold Decision Policy│
                    └────────────┬────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
                   ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐
          │ Fraud Flag /    │         │ SHAP Explanation│
          │ Risk Band       │         │                 │
          └────────┬────────┘         └────────┬────────┘
                   │                           │
                   └─────────────┬─────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │     Reason Codes        │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      FastAPI Backend     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      React Frontend      │
                    └────────────┬────────────┘
                                 │
          ┌──────────────┬───────┴───────┬──────────────┐
          ▼              ▼               ▼              ▼
     Dashboard     Transactions       Users        Analytics
          │              │               │              │
          └──────────────┴───────────────┴──────────────┘
                                 │
                                 ▼
                       Analyst Risk Review
```

### Architecture Principles

The implementation separates:

1. **Data and ML logic**
2. **Saved model artifacts**
3. **API/model serving**
4. **Frontend presentation**
5. **Testing and CI**

This makes the trained model reusable independently of the user interface.

---

## Project Structure

```text
Financial-Fraud-Risk-Engine/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── data/
│   ├── raw/
│   │   └── synthetic_fraud_dataset.csv
│   └── processed/
│       ├── transactions_train.csv
│       └── transactions_test.csv
│
├── models/
│   ├── fraud_pipeline.joblib
│   └── threshold.json
│
├── reports/
│   ├── figures/
│   │   ├── confusion_matrix.png
│   │   ├── roc_curve.png
│   │   ├── pr_curve.png
│   │   ├── calibration_curve.png
│   │   ├── threshold_cost_curve.png
│   │   └── threshold_tradeoffs.png
│   │
│   └── metrics/
│       ├── metrics.json
│       ├── evaluation_summary.json
│       ├── threshold_search.json
│       ├── threshold_search.csv
│       ├── threshold_policy.json
│       ├── threshold_policy.csv
│       └── threshold_policy.md
│
├── src/
│   ├── config.py
│   ├── data_prep.py
│   ├── dashboard_utils.py
│   ├── evaluate.py
│   ├── explain.py
│   ├── features.py
│   ├── generate_synthetic_data.py
│   ├── reason_codes.py
│   ├── score_new_transactions.py
│   ├── threshold_policy.py
│   ├── train_model.py
│   └── validation.py
│
├── tests/
│   ├── test_dashboard_helpers.py
│   ├── test_evaluation_improvements.py
│   ├── test_project_integrity.py
│   ├── test_reason_codes.py
│   ├── test_synthetic_data_generation.py
│   ├── test_threshold_policy.py
│   ├── test_validation_and_scoring.py
│   └── test_workflow_contracts.py
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── api.py
├── app.py
├── pyproject.toml
├── requirements.txt
└── README.md
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `src/` | Data preparation, modeling, evaluation, scoring and explainability |
| `models/` | Trained model and saved threshold artifacts |
| `reports/` | Evaluation metrics, policy artifacts and charts |
| `api.py` | FastAPI model-serving and application API |
| `frontend/` | React analyst-facing monitoring application |
| `app.py` | Original Streamlit reference dashboard |
| `tests/` | Automated project and workflow validation |
| `.github/workflows/` | Continuous integration |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Rohan1-tech/Financial-Fraud-Risk-Engine.git
cd Financial-Fraud-Risk-Engine
```

### 2. Create a Virtual Environment

#### Windows CMD

```bash
python -m venv .venv
.venv\Scripts\activate
```

#### macOS / Linux

```bash
python -m venv .venv
source .venv/bin/activate
```

### 3. Install Requirements

```bash
pip install -r requirements.txt
```

---

## Quick Start

Run the full local ML workflow:

```bash
python -m src.generate_synthetic_data \
  --rows 3500 \
  --fraud-rate 0.08 \
  --label-noise 0.04 \
  --seed 42 \
  --output data/raw/synthetic_fraud_dataset.csv

python -m src.data_prep

python -m src.train_model

python -m src.evaluate

python -m src.score_new_transactions \
  data/processed/transactions_test.csv \
  --output_csv reports/metrics/test_scored.csv
```

---

## Synthetic Data Generator

The project includes a synthetic fraud-data generator:

```bash
python -m src.generate_synthetic_data \
  --rows 3500 \
  --fraud-rate 0.08 \
  --label-noise 0.04 \
  --seed 42 \
  --output data/raw/synthetic_fraud_dataset.csv
```

The generator creates a harder dataset than a deterministic toy example by adding:

- overlapping legitimate and fraud patterns
- controlled label noise
- false-positive-looking legitimate transactions
- lower-risk-looking fraud transactions
- class imbalance
- stochastic fraud labels

This makes threshold selection and precision/recall tradeoffs more meaningful.

---

## Training and Evaluation

### Prepare Train/Test Data

```bash
python -m src.data_prep
```

### Train the Fraud Model

```bash
python -m src.train_model
```

### Evaluate the Model

```bash
python -m src.evaluate
```

Evaluation outputs include:

```text
reports/metrics/metrics.json
reports/metrics/evaluation_summary.json
reports/metrics/threshold_search.json
reports/metrics/threshold_search.csv

reports/figures/roc_curve.png
reports/figures/pr_curve.png
reports/figures/calibration_curve.png
reports/figures/threshold_cost_curve.png
reports/figures/threshold_tradeoffs.png
reports/figures/confusion_matrix.png
```

---

## Threshold Policy Artifacts

Fraud thresholds are business decisions.

A low threshold catches more fraud but creates more false positives.

A high threshold reduces review volume but can miss fraud.

This project generates policy artifacts to make those tradeoffs easier to inspect:

```text
reports/metrics/threshold_policy.json
reports/metrics/threshold_policy.csv
reports/metrics/threshold_policy.md
```

Policy candidates include:

| Policy | Purpose |
|---|---|
| `cost_optimized` | Minimizes configured false-positive / false-negative cost |
| `balanced_f1` | Balances precision and recall using F1 score |
| `high_recall` | Prioritizes catching fraud cases |
| `high_precision` | Prioritizes reducing false positives |
| `review_capacity` | Keeps the flagged transaction rate within review capacity |

> These policies are decision-support artifacts, not automatic approval or rejection rules.

---

## Batch Scoring

Score a transaction file:

```bash
python -m src.score_new_transactions \
  data/processed/transactions_test.csv \
  --output_csv reports/metrics/scored_transactions.csv
```

The scored output includes:

| Column | Description |
|---|---|
| `fraud_probability` | Model-estimated fraud probability |
| `fraud_flag` | Binary flag based on the saved or provided threshold |
| `risk_band` | Low / Medium / High / Critical |
| `reason_codes` | Human-readable risk drivers for analyst review |

The output is sorted by descending fraud probability so the riskiest transactions appear first.

---

# FastAPI Backend

The trained machine-learning pipeline is exposed through a **FastAPI backend**.

The API provides a serving layer between the machine-learning model and the React frontend.

### Backend Responsibilities

The backend handles:

- health/status checks
- model metadata
- transaction retrieval
- individual transaction prediction
- transaction explanations
- SHAP explanations
- batch scoring
- CSV scoring
- scored-data export
- threshold handling
- frontend integration

### API Endpoints

```text
GET  /
GET  /health
GET  /metadata

GET  /transactions
GET  /transactions/{transaction_id}
GET  /transactions/{transaction_id}/explanation

POST /predict
POST /score
POST /score-csv

GET  /export.csv
```

### Run the Backend Locally

```bash
python -m uvicorn api:app --port 8001
```

The local backend runs at:

```text
http://127.0.0.1:8001
```

FastAPI also provides automatically generated OpenAPI documentation for inspecting and testing the available API endpoints.

### Model Serving Flow

```text
API Request
    ↓
Input Validation
    ↓
Feature Preparation
    ↓
Saved ML Pipeline
    ↓
Fraud Probability
    ↓
Threshold Decision
    ↓
Risk Band
    ↓
Reason Codes
    ↓
API Response
```

---

# React Frontend

The project includes a professional **React + Vite** frontend.

The frontend consumes the FastAPI backend and provides an analyst-oriented interface for reviewing fraud risk.

## Dashboard

The Dashboard provides portfolio-level monitoring including:

- total transactions
- flagged transactions
- flagged rate
- P95 fraud probability
- average probability
- maximum probability
- true fraud rate
- selected threshold
- model quality snapshot
- risk distribution
- probability distribution
- risk-band counts
- top high-risk transactions

---

## Analyze Transaction

The Analyze Transaction view allows an analyst to enter transaction attributes and evaluate an individual transaction.

The result includes:

- fraud probability
- fraud flag
- risk band
- analyst reason codes
- transaction details
- model explanation

The interface was verified with both high-risk and low-risk inputs.

---

## Transactions

The Transactions view provides transaction-level review.

It supports:

- transaction browsing
- fraud probability
- risk-band classification
- fraud flag
- transaction details
- individual transaction inspection
- SHAP explanation
- analyst reason codes

Selecting a transaction opens a detailed review view.

---

## Users

The Users view provides user-level fraud-risk analysis.

It supports:

- user selection
- transaction count
- flagged transaction count
- flagged rate
- average fraud probability
- risk-band distribution
- user risk summary
- user transaction history
- transaction-level drill-down
- SHAP explanation for selected transactions

This adds a second level of analysis beyond individual transaction scoring.

---

## Analytics

The Analytics view provides portfolio-level analysis of:

- risk-band distribution
- fraud probability distribution
- transaction risk patterns
- flagged transaction behavior
- aggregate risk statistics

The purpose is to provide a broader view of the scored transaction population.

---

## Model Performance

The Model Performance view provides model-quality information including:

- ROC-AUC
- PR-AUC / Average Precision
- Brier Score
- saved threshold
- evaluation context

This separates model-quality monitoring from individual transaction review.

---

## Frontend Configuration

The frontend connects to the backend through:

```text
VITE_API_URL
```

For local development:

```text
VITE_API_URL=http://127.0.0.1:8001
```

For the deployed application, this environment variable points to the public FastAPI backend.

---

## Run the React Frontend Locally

From the project root:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will provide the local frontend URL.

---

# Streamlit Reference Dashboard

The original Streamlit application remains in the repository as a reference implementation of the analytical fraud-risk workflow.

Launch the dashboard:

```bash
streamlit run app.py
```

The dashboard supports:

- uploading transaction CSV files
- validating uploaded columns
- adjusting fraud threshold
- viewing risk distribution
- reviewing top-risk transactions
- downloading scored CSV files
- inspecting selected transactions with SHAP
- viewing analyst-friendly reason codes
- checking model metadata and saved threshold

The Streamlit application remains useful as a local analytical reference.

The **deployed application uses the FastAPI + React architecture**.

---

# Explainability and Reason Codes

The project includes two explanation layers.

## SHAP Explanations

SHAP is used to inspect how transformed model features contribute to an individual prediction.

The explanation workflow uses the trained tree-based model to identify the strongest feature contributions.

The application displays the most important contributions for the selected transaction.

---

## Analyst Reason Codes

Reason codes convert risk signals into short, reviewable explanations.

Examples include:

```text
High device risk score
High IP risk score
Transaction amount is high for this batch
Transaction occurred during unusual hours
Merchant category is higher risk in the demo data
Critical model risk score
Model score is above the review threshold
```

Reason codes are not causal explanations.

They are analyst-facing summaries designed to make transaction triage easier.

---

# Evaluation Metrics

The evaluation layer includes metrics designed for imbalanced fraud-risk workflows.

| Metric | Why it matters |
|---|---|
| ROC-AUC | Measures ranking quality across thresholds |
| Average Precision / PR-AUC | More informative for imbalanced fraud datasets |
| Brier Score | Measures probability quality and calibration |
| Precision | Measures how many flagged cases are actually fraud |
| Recall | Measures how many fraud cases are caught |
| False-positive rate | Measures legitimate-user friction |
| Flagged rate | Estimates review workload |
| Cost | Encodes false-positive and false-negative tradeoffs |

### Original Reproducible Workflow Example

The original analytical workflow includes example results for the synthetic-data configuration documented in the project.

| Metric | Example Value |
|---|---:|
| ROC-AUC | 0.976 |
| Average precision / PR-AUC | 0.838 |
| Brier score | 0.061 |
| Selected threshold | 0.35 |
| Precision at selected threshold | 0.481 |
| Recall at selected threshold | 0.974 |
| Flagged rate | 0.223 |

> These values are from the synthetic demonstration workflow documented in the repository. They should not be interpreted as real-world fraud detection performance.

---

# Verified Deployed Results

The deployed application was separately verified using the actual trained model, FastAPI backend, and React frontend.

## Model Evaluation

| Metric | Verified Value |
|---|---:|
| ROC-AUC | ~0.948 |
| Average Precision / PR-AUC | ~0.754 |
| Brier Score | ~0.058 |
| Saved Threshold | 0.35 |

## Dashboard Scoring Results

| Metric | Verified Value |
|---|---:|
| Transactions Scored | 1,000 |
| Flagged Transactions | 217 |
| Flagged Rate | 21.70% |
| P95 Fraud Probability | 82.28% |
| Average Fraud Probability | 21.36% |
| Maximum Fraud Probability | 98.91% |
| True Fraud Rate | 10.50% |

These values were verified through the deployed application and actual API/model flow.

---

## Individual Transaction Verification

### High-Risk Transaction

A high-risk transaction was tested through the deployed Analyze Transaction workflow.

Verified result:

```text
Fraud Probability: 98.91%
Risk Band: Critical
Decision: FLAGGED
```

The transaction contained signals including:

```text
Amount: 125.47
Hour: 2
Device Risk: 0.789
IP Risk: 0.4796
Transaction Type: transfer
Merchant Category: crypto
Country: CN
```

The application returned both analyst reason codes and SHAP feature contributions.

---

### Low-Risk Transaction

A low-risk transaction was also tested.

Verified result:

```text
Fraud Probability: 2.64%
Risk Band: Low
Decision: CLEAR
```

This confirms that the deployed application is connected to the actual FastAPI/model workflow rather than displaying hardcoded demonstration values.

> All results in this section are based on synthetic demonstration data and should not be interpreted as real-world fraud detection performance.

---

# Visual Reports

The project includes generated model-evaluation charts.

## ROC Curve

```text
reports/figures/roc_curve.png
```

ROC-AUC summarizes the model's ranking ability across thresholds.

It should be considered together with precision-recall metrics when the positive class is imbalanced.

---

## Precision-Recall Curve

```text
reports/figures/pr_curve.png
```

PR-AUC is especially useful for fraud detection because the positive class is relatively rare and false positives affect review workload.

---

## Calibration Curve

```text
reports/figures/calibration_curve.png
```

Calibration shows whether predicted probabilities behave like meaningful probabilities.

This is important because the system uses probabilities for threshold-based risk decisions.

---

## Threshold Cost Curve

```text
reports/figures/threshold_cost_curve.png
```

The cost curve shows how false-positive and false-negative assumptions affect threshold selection.

---

## Threshold Tradeoffs

```text
reports/figures/threshold_tradeoffs.png
```

This chart compares:

- precision
- recall
- false-positive rate
- flagged rate

across different thresholds.

---

## Confusion Matrix

```text
reports/figures/confusion_matrix.png
```

The confusion matrix provides a direct view of:

- true positives
- true negatives
- false positives
- false negatives

---

# Testing and CI

The project includes automated tests covering important parts of the workflow.

## Run Unit Tests

```bash
python -m unittest discover -s tests -v
```

## Compile Source Files

```bash
python -m compileall src app.py tests
```

The test suite covers areas including:

- dashboard helpers
- evaluation behavior
- project integrity
- reason-code generation
- synthetic data generation
- threshold policy
- validation
- scoring
- workflow contracts
- SHAP explanation functionality

The project was verified with the automated test suite, with the Streamlit-only checks treated separately from the core workflow.

---

## GitHub Actions

The GitHub Actions workflow is defined in:

```text
.github/workflows/ci.yml
```

The workflow checks:

- dependency installation
- source compilation
- unit tests
- synthetic-data generation
- data preparation
- model training
- evaluation
- scoring
- scored CSV schema validation
- expected model artifacts
- expected report artifacts

This helps ensure that changes do not silently break the ML workflow.

---

# Code Quality

The project separates major responsibilities across modules.

| Module | Purpose |
|---|---|
| `src/generate_synthetic_data.py` | Creates harder synthetic fraud data |
| `src/data_prep.py` | Prepares train/test datasets |
| `src/features.py` | Builds preprocessing and model pipeline |
| `src/train_model.py` | Trains and saves the fraud model |
| `src/evaluate.py` | Evaluates metrics, thresholds and plots |
| `src/threshold_policy.py` | Generates threshold policy artifacts |
| `src/score_new_transactions.py` | Scores new transaction CSV files |
| `src/validation.py` | Validates training and scoring input schemas |
| `src/reason_codes.py` | Generates analyst-friendly risk explanations |
| `src/dashboard_utils.py` | Provides dashboard helper logic |
| `src/explain.py` | Provides SHAP explanation utilities |
| `api.py` | Provides FastAPI model-serving endpoints |
| `frontend/` | Provides the React analyst application |

The separation allows the machine-learning workflow, API layer, and presentation layer to evolve independently.

---

# Deployment

The completed application is deployed as separate frontend and backend services.

## Backend

The FastAPI backend is deployed as a Render web service.

It provides:

- model health
- metadata
- prediction
- scoring
- transaction retrieval
- explanations
- SHAP
- CSV export

## Frontend

The React/Vite frontend is deployed as a Render static site.

The frontend communicates with the backend through the configured:

```text
VITE_API_URL
```

## Deployment Architecture

```text
                    Public User
                         |
                         v
                ┌─────────────────┐
                │ React Frontend  │
                │     Render      │
                └────────┬────────┘
                         |
                         | HTTPS / REST API
                         v
                ┌─────────────────┐
                │ FastAPI Backend │
                │     Render      │
                └────────┬────────┘
                         |
                         v
                ┌─────────────────┐
                │  ML Pipeline    │
                │  Saved Model     │
                └────────┬────────┘
                         |
                ┌────────┴────────┐
                │                 │
                v                 v
        Risk Prediction     SHAP Explanation
                │                 │
                └────────┬────────┘
                         v
                  Analyst Review
```

The deployment demonstrates separation between:

- frontend
- backend
- model-serving logic

while maintaining a complete end-to-end workflow.

---

# Production-Oriented Engineering Decisions

Although the project uses synthetic data and is not a production fraud platform, the implementation demonstrates several engineering practices relevant to production ML systems.

## Separation of Concerns

```text
Data / ML
    ↓
Model Artifacts
    ↓
FastAPI
    ↓
React Frontend
```

The model is not directly coupled to the frontend.

---

## Input Validation

Required transaction columns are validated before scoring.

This reduces the risk of malformed input reaching the model.

---

## Saved Model Artifact

The trained model pipeline is saved and reused during inference.

This keeps preprocessing and model inference consistent.

---

## Saved Threshold

The decision threshold is stored separately from the trained model.

This allows decision-policy changes without necessarily retraining the model.

---

## Explainability

SHAP and reason codes provide complementary explanation layers.

SHAP focuses on model feature contributions, while reason codes summarize analyst-relevant risk signals.

---

## Automated Testing

The project includes automated tests for data generation, validation, scoring, threshold logic, reason codes, project integrity, and workflow contracts.

---

## Environment Configuration

The frontend/backend connection is configured through an environment variable rather than hardcoding the production API URL into the frontend application.

---


# Future Improvements

Potential future improvements include:

- Add drift simulation and drift monitoring
- Add calibration model comparison
- Add time-based train/test split
- Add reviewer feedback loop
- Add Docker support
- Add model card and data statement
- Add fairness and subgroup analysis
- Add model registry-style metadata
- Add alerting and monitoring examples
- Add richer transaction sequence features
- Add behavioral user features
- Add production-style authentication
- Add role-based access control
- Add persistent audit logging
- Add real-time event-stream processing
- Add automated model retraining
- Add deployment validation gates

---

# Tech Stack

## Machine Learning

- Python
- pandas
- NumPy
- scikit-learn
- SciPy
- SHAP
- joblib

## Backend

- FastAPI
- Uvicorn
- Pydantic
- REST APIs

## Frontend

- React
- Vite
- Recharts
- Lucide React
- CSS

## Data Visualization

- matplotlib

## Testing

- unittest
- GitHub Actions

## Engineering

- Git
- GitHub

## Deployment

- Render

## Reference Dashboard

- Streamlit

---

# Key Technical Concepts Demonstrated

## Machine Learning

- Binary classification
- Random Forest
- Feature preprocessing
- Probability prediction
- Class imbalance
- Model evaluation
- Probability calibration

## Fraud-Risk Modeling

- Cost-sensitive thresholding
- Precision/recall tradeoffs
- Review-capacity considerations
- Fraud probability ranking
- Risk-band classification
- Analyst triage

## Explainable AI

- SHAP
- Feature contributions
- Analyst reason codes
- Individual prediction explanations

## ML Engineering

- Reusable pipelines
- Saved model artifacts
- Input validation
- Batch scoring
- API model serving
- Automated testing
- CI workflows

## Application Engineering

- REST APIs
- FastAPI
- React
- Vite
- Frontend/backend integration
- Environment configuration
- Cloud deployment

---

# Project Status

The current project includes:

```text
Machine Learning Model             ✓
Data Validation                   ✓
Threshold Optimization            ✓
Risk Bands                        ✓
Reason Codes                      ✓
SHAP Explainability               ✓
Batch Scoring                     ✓
FastAPI Backend                   ✓
React Frontend                    ✓
Transaction Analysis              ✓
User Risk Analysis                ✓
Analytics                         ✓
Model Performance                 ✓
CSV Export                        ✓
Automated Tests                   ✓
GitHub Actions CI                 ✓
Cloud Deployment                  ✓
End-to-End Verification           ✓
```

The deployed application has been tested across the major workflows:

- Dashboard
- Analyze Transaction
- Transactions
- Users
- Analytics
- Model Performance
- Individual transaction explanations
- SHAP explanations
- Backend/API connectivity
- CSV export

---

# Author

**Rohan Pagare**

Data Scientist 

GitHub:  
https://github.com/Rohan1-tech

Project Repository:  
https://github.com/Rohan1-tech/Financial-Fraud-Risk-Engine

---

# Final Project Workflow

```text
Business Problem
       ↓
Synthetic Data Generation
       ↓
Data Validation
       ↓
Feature Engineering
       ↓
Model Training
       ↓
Model Evaluation
       ↓
Cost-Sensitive Thresholding
       ↓
Fraud Probability
       ↓
Fraud Flag + Risk Band
       ↓
SHAP + Reason Codes
       ↓
FastAPI Model Serving
       ↓
React Analyst Interface
       ↓
Transaction Analysis
       ↓
User Risk Analysis
       ↓
Analytics
       ↓
Model Performance Review
       ↓
Testing & CI
       ↓
Cloud Deployment
```
