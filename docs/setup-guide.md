# Setup Guide

> **This file is read by the automated evaluation pipeline. Be precise and complete.**

## Prerequisites

Before you begin, ensure you have the following installed:

- [ ] Python 3.11+
- [ ] Node.js 18+
- [ ] npm 9+

## Repository Structure

```
src/
├── frontend/     ← React + Vite UI
├── backend/      ← FastAPI server
└── ml/           ← ML layer (placeholder — future phase)
```

## Environment Variables

### Backend

```bash
cd src/backend
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `APP_ENV` | Application environment (`development` / `production`) | No |
| `APP_PORT` | Port the backend listens on (default `8000`) | No |
| `DATABASE_URL` | SQLite connection URL | No |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | No |

### Frontend

```bash
cd src/frontend
cp .env.example .env
```

| Variable | Description | Required |
|---|---|---|
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:8000`) | No |

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/bob-ai-hackathon-the-titans.git
cd bob-ai-hackathon-the-titans

# 2. Install backend dependencies
cd src/backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt

# 3. Install frontend dependencies (separate terminal)
cd src/frontend
npm install
```

## Running the Application

```bash
# Start the backend (from src/backend, with venv activated)
uvicorn app.main:app --reload --port 8000

# Start the frontend (from src/frontend, in a separate terminal)
npm run dev
```

- Backend API: <http://localhost:8000>
- Frontend:    <http://localhost:5173>

## Health Check

Verify the backend is running:

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{"status": "ok", "service": "port-congestion-backend"}
```

## Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` again with the venv activated |
| `CORS error` in browser | Ensure the backend is running on port 8000 and `CORS_ORIGINS` covers `http://localhost:5173` |
| Vite port conflict | Change the port in `src/frontend/vite.config.js` |
| SQLite locked | Ensure only one backend instance is running |
