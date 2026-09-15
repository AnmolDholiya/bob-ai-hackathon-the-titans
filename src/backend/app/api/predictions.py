"""
Prediction API routes.

POST /api/predictions/delay
    Run the L1 Congestion Risk prediction on a single tracking snapshot.

GET  /api/predictions/model-info
    Return model metadata and availability status.
"""
import logging

from fastapi import APIRouter, HTTPException, status

from app.ml import features as feat
from app.ml import predictor
from app.schemas.predictions import (
    CongestionPredictionRequest,
    CongestionPredictionResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post(
    "/delay",
    summary="Predict congestion risk for a vessel tracking snapshot",
    response_model=CongestionPredictionResponse,
)
async def predict_delay(req: CongestionPredictionRequest) -> CongestionPredictionResponse:
    """
    Submit a vessel tracking snapshot and receive a congestion risk prediction.

    The model predicts **Congestion Risk = 1** when it expects the vessel
    will arrive more than 30 minutes after its scheduled ETA.

    All input fields are optional; the underlying sklearn pipeline imputes
    missing values using medians/modes from the training distribution.
    Supplying more accurate values (lat, long, sog, cog, hdg, eta_gap_min,
    lead_time_min) will yield more reliable predictions.

    **Returns**
    - `congestion_risk_label`: `"Normal"` or `"Congestion Risk"`
    - `congestion_risk_flag`: `0` (normal) or `1` (at risk)
    - `congestion_risk_score`: raw ensemble probability (0–1)
    - `threshold`: the validation-selected decision boundary
    - `model_metrics`: test-set performance metrics from the training run
    """
    # Guard: model not loaded yet
    if not predictor.is_available():
        err = predictor.load_error() or "Model artifacts not found."
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML model is unavailable. {err}",
        )

    # Build the feature DataFrame
    try:
        feature_df = feat.build_feature_row(req)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Feature building failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Feature preparation failed: {exc}",
        )

    # Run the ensemble
    try:
        result = predictor.predict_congestion(feature_df)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        logger.exception("Unexpected prediction error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal error.",
        )

    return CongestionPredictionResponse(**result)


@router.get(
    "/model-info",
    summary="Return model availability and metadata",
)
async def model_info() -> dict:
    """
    Returns the model's availability status and, when loaded, its metadata:
    feature list, test-set metrics, ensemble configuration, and threshold.
    """
    available = predictor.is_available()
    error     = predictor.load_error()

    base = {
        "available": available,
        "model":     predictor.MODEL_NAME,
    }

    if not available:
        base["error"] = error
        return base

    # Pull what we can from the metadata artifact
    from app.ml.predictor import _metadata  # noqa: PLC0415 — internal access for info endpoint
    if _metadata:
        base["features"]        = _metadata.get("features")
        base["threshold"]       = _metadata.get("threshold")
        base["ensemble"]        = _metadata.get("ensemble")
        base["target"]          = _metadata.get("target")
        base["target_rule"]     = _metadata.get("target_rule")
        base["test_split"]      = _metadata.get("test_split")
        base["leakage_protection"] = _metadata.get("leakage_protection")
        metrics = _metadata.get("metrics")
        if metrics:
            base["metrics"] = {k: round(v, 4) for k, v in metrics.items()}

    return base
