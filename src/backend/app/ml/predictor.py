"""
ML Predictor for the L1 Congestion Risk model.

Loads the two production artifacts saved by the training notebook:
  l1_congestion_production/xgboost_pipeline.joblib
  l1_congestion_production/lightgbm_pipeline.joblib
  l1_congestion_production/metadata.joblib

The artifacts are expected relative to src/backend/ (the project root
from which uvicorn is launched).  The path can be overridden via the
ML_MODEL_DIR environment variable.

Architecture
────────────
The training script saves two full sklearn Pipelines:
  xgb_pipeline  : ColumnTransformer(imputer+onehot) → XGBClassifier
  lgbm_pipeline : ColumnTransformer(imputer+onehot) → LGBMClassifier

At inference time we reproduce the ensemble:
  prob = 0.50 × xgb_pipeline.predict_proba(X)[:,1]
       + 0.50 × lgbm_pipeline.predict_proba(X)[:,1]
  label = int(prob >= threshold)          # threshold from metadata

Model loading happens once at first call (lazy init) so that the FastAPI
application can start even when the .joblib files are not yet present.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# ── Artifact paths ─────────────────────────────────────────────────────────────
# __file__ = src/backend/app/ml/predictor.py → .parent×3 = src/backend/
_DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "l1_congestion_production"


def _model_dir() -> Path:
    env_override = os.environ.get("ML_MODEL_DIR")
    return Path(env_override) if env_override else _DEFAULT_MODEL_DIR


# ── Module-level singletons (populated on first use) ──────────────────────────
_xgb_pipeline: Optional[Any] = None
_lgbm_pipeline: Optional[Any] = None
_metadata: Optional[Dict[str, Any]] = None
_load_error: Optional[str] = None
_loaded: bool = False


def _load_artifacts() -> None:
    """
    Attempt to load the three .joblib files once.
    Sets _load_error if they cannot be loaded; does NOT raise.
    """
    global _xgb_pipeline, _lgbm_pipeline, _metadata, _load_error, _loaded
    _loaded = True

    try:
        import joblib
    except ImportError:
        _load_error = "joblib is not installed. Run: pip install -r requirements.txt"
        logger.error(_load_error)
        return

    mdir = _model_dir()
    xgb_path  = mdir / "xgboost_pipeline.joblib"
    lgbm_path = mdir / "lightgbm_pipeline.joblib"
    meta_path = mdir / "metadata.joblib"

    if not xgb_path.exists() or not lgbm_path.exists():
        _load_error = (
            f"Trained model artifacts not found in {mdir}. "
            "Train the model first by running "
            "app/ml/l1_congestion_balanced_highaccuracy_executed.py "
            "with the tracking dataset, then place the generated "
            "l1_congestion_production/ folder alongside this backend."
        )
        logger.warning(_load_error)
        return

    try:
        _xgb_pipeline  = joblib.load(xgb_path)
        _lgbm_pipeline = joblib.load(lgbm_path)
        logger.info("Loaded XGBoost pipeline from %s", xgb_path)
        logger.info("Loaded LightGBM pipeline from %s", lgbm_path)
    except Exception as exc:
        _load_error = f"Failed to load model pipelines: {exc}"
        logger.error(_load_error)
        return

    if meta_path.exists():
        try:
            _metadata = joblib.load(meta_path)
            logger.info("Loaded model metadata from %s", meta_path)
        except Exception as exc:
            # Metadata is optional — log but continue
            logger.warning("Could not load metadata: %s", exc)
            _metadata = None

    _load_error = None  # clear on success


def _ensure_loaded() -> None:
    if not _loaded:
        _load_artifacts()


# ── Public interface ───────────────────────────────────────────────────────────

MODEL_NAME = "L1 Congestion Predictor — XGBoost + LightGBM 50/50 Ensemble"


def is_available() -> bool:
    """Return True if the model artifacts loaded successfully."""
    _ensure_loaded()
    return _load_error is None and _xgb_pipeline is not None and _lgbm_pipeline is not None


def load_error() -> Optional[str]:
    """Return the load error message, or None if the model is available."""
    _ensure_loaded()
    return _load_error


def predict_congestion(feature_df: Any) -> Dict[str, Any]:
    """
    Run the ensemble and return a prediction dict.

    Parameters
    ----------
    feature_df : pd.DataFrame
        One-row DataFrame produced by app.ml.features.build_feature_row().

    Returns
    -------
    dict with keys:
        congestion_risk_flag   (int)   0 or 1
        congestion_risk_label  (str)   "Normal" or "Congestion Risk"
        congestion_risk_score  (float) ensemble probability 0–1
        threshold              (float) decision threshold
        model                  (str)   model identifier string
        model_metrics          (dict|None) test-set metrics if available
        features_used          (list|None)

    Raises
    ------
    RuntimeError  if model is not available or prediction fails
    """
    _ensure_loaded()

    if not is_available():
        raise RuntimeError(
            f"ML model is unavailable. {_load_error or 'Unknown reason.'}"
        )

    try:
        import numpy as np

        xgb_prob  = _xgb_pipeline.predict_proba(feature_df)[:, 1]
        lgbm_prob = _lgbm_pipeline.predict_proba(feature_df)[:, 1]
        ensemble_prob = float(0.50 * xgb_prob[0] + 0.50 * lgbm_prob[0])

        # Use the threshold saved in metadata; fall back to the default
        # the training script converges to for safety.
        threshold = float(
            _metadata["threshold"]
            if _metadata and "threshold" in _metadata
            else 0.35
        )

        flag  = int(ensemble_prob >= threshold)
        label = "Congestion Risk" if flag == 1 else "Normal"

        metrics = (
            {k: round(v, 4) for k, v in _metadata["metrics"].items()}
            if _metadata and "metrics" in _metadata
            else None
        )
        features = (
            _metadata.get("features")
            if _metadata
            else None
        )

        return {
            "congestion_risk_flag":  flag,
            "congestion_risk_label": label,
            "congestion_risk_score": round(ensemble_prob, 6),
            "threshold":             round(threshold, 4),
            "model":                 MODEL_NAME,
            "model_metrics":         metrics,
            "features_used":         features,
        }

    except Exception as exc:
        logger.exception("Prediction failed")
        raise RuntimeError(f"Prediction failed: {exc}") from exc
