#!/usr/bin/env python3
"""
MLflow — Health score model for Kinetic Coach
Simple rule-based score (0-100) from customer features.
Run: MLFLOW_TRACKING_URI=http://localhost:5001 python train_health_model.py
"""

import os
import mlflow
import mlflow.sklearn
from sklearn.linear_model import LinearRegression
import numpy as np

# Health score = f(current_balance, savings_balance, has_savings, txn_count_30d, credit_utilization)
# Simple linear combo for demo; in prod use proper ML
FEATURE_NAMES = ["current_balance", "savings_balance", "has_savings", "txn_count_30d", "credit_utilization"]


def train():
    mlflow.set_tracking_uri(os.environ.get("MLFLOW_TRACKING_URI", "http://localhost:5001"))
    mlflow.set_experiment("kinetic-health-score")

    with mlflow.start_run(run_name="health_v1"):
        # Synthetic training data (in prod: from fct_customer_health)
        X = np.array([
            [1000, 5000, 1, 10, 0],   # healthy
            [500, 2000, 1, 5, 200],    # ok
            [0, 0, 0, 0, 500],        # poor
            [5000, 20000, 1, 20, 0],  # excellent
            [100, 0, 0, 2, 1000],     # at risk
        ])
        y = np.array([85, 70, 25, 95, 40])  # target health scores

        model = LinearRegression()
        model.fit(X, y)

        # Log params and metrics (coef/intercept for Node.js prediction without Python)
        coef_list = model.coef_.tolist() + [float(model.intercept_)]
        mlflow.log_params({
            "model_type": "linear_regression",
            "n_features": len(FEATURE_NAMES),
            "model_coef": ",".join(str(round(c, 6)) for c in coef_list),
        })
        mlflow.log_metric("train_mae", np.mean(np.abs(model.predict(X) - y)))
        mlflow.log_metric("train_r2", model.score(X, y))

        # Log model
        mlflow.sklearn.log_model(model, "model", registered_model_name="kinetic-health-score")

        print("Model logged. View at http://localhost:5001")


def predict_health(features: dict) -> float:
    """Score customer health (0-100) using registered model or fallback."""
    uri = os.environ.get("MLFLOW_TRACKING_URI", "http://localhost:5001")
    mlflow.set_tracking_uri(uri)
    try:
        model = mlflow.sklearn.load_model("models:/kinetic-health-score/latest")
        x = np.array([[
            features.get("current_balance", 0),
            features.get("savings_balance", 0),
            features.get("has_savings", 0),
            features.get("txn_count_30d", 0),
            features.get("credit_utilization", 0),
        ]])
        score = float(model.predict(x)[0])
        return max(0, min(100, score))
    except Exception:
        # Fallback: simple rule-based
        s = 50
        if features.get("has_savings"): s += 15
        if features.get("current_balance", 0) > 1000: s += 10
        if features.get("savings_balance", 0) > 5000: s += 10
        if features.get("credit_utilization", 0) > 500: s -= 20
        return max(0, min(100, s))


if __name__ == "__main__":
    train()
