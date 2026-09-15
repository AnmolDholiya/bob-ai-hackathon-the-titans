# Backend

FastAPI backend for the Container Congestion Predictor & Port Operations Optimiser.

## Requirements

- Python 3.11+

## Setup

```bash
cd src/backend

# Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at <http://localhost:8000>.

## Health Check

```
GET http://localhost:8000/api/health
```

Expected response:
```json
{"status": "ok", "service": "port-congestion-backend"}
```

## Project Layout

```
app/
├── api/          ← Route handlers
├── core/         ← Configuration and settings
├── db/           ← Database connection and base setup
├── models/       ← SQLAlchemy ORM models (future phases)
├── schemas/      ← Pydantic request/response schemas (future phases)
├── services/     ← Business logic (future phases)
└── main.py       ← FastAPI application entry point
```
