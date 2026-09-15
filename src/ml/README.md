# ML Layer — Placeholder

This directory is reserved for the machine learning layer, to be implemented in a later phase.

## Planned Structure

```
ml/
├── models/          ← Trained model artifacts (.pkl, .joblib, etc.)
├── preprocessing/   ← Feature engineering and data transformation
├── inference/       ← Prediction service wrappers
└── README.md
```

## Planned Functionality

- Container congestion prediction (XGBoost / LightGBM)
- Feature preprocessing pipelines
- Model inference wrappers consumed by the FastAPI backend

**Status: Not yet implemented.**
