<<<<<<< HEAD
# 🚀 PortMind — Container Congestion Predictor & Port Operations Optimiser

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | The Titans |
| **Track** | Logistics & Ports — L1 |
| **Team Lead** | Romit Kakadiya — 24cs033@charusat.edu.in |
| **Members** | Anmol Dholiya, Krish Bhingradiya, Avi Patel |

---

## 🎯 Problem Statement

Port operators must coordinate vessel arrivals, congestion risk, berths, cranes, and operational schedules while vessel conditions and arrival times continuously change. Delays can cascade into port congestion and make manual berth, crane, and arrival planning difficult.

PortMind addresses this problem by predicting vessel congestion risk before arrival and connecting that prediction to actionable port-operation decisions.

---

## 💡 Solution

PortMind is an AI-powered maritime decision-support platform that combines real vessel tracking/schedule data with an XGBoost + LightGBM ensemble to predict congestion risk.

The prediction is then used alongside vessel, port, berth, and crane information to support route recommendations, berth optimisation, crane allocation, and a 72-hour operational planning view.

---

## ✨ Key Features

- **Vessel Data Import:** Upload vessel CSV data, validate records, and import valid vessels into the backend database.

- **Fleet Management:** View, search, filter, and inspect vessels using real backend/database data.

- **AI Congestion Prediction:** Predict vessel congestion risk using the trained XGBoost + LightGBM ensemble and display the model probability, risk label, risk flag, and threshold.

- **Port Operations Optimisation:** Use vessel risk and operational information to support route recommendations, berth assignment, and crane allocation.

- **72-Hour Operations Planning:** Organise vessel operations into 0–24, 24–48, and 48–72 hour planning windows based on vessel schedules and operational requirements.

- **Operational Dashboard:** Provide a unified maritime command-centre interface for fleet and port-operation monitoring.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, JavaScript / JSX |
| **Frontend** | React, Vite, Tailwind CSS |
| **Backend** | FastAPI, Pydantic, SQLAlchemy |
| **Machine Learning** | XGBoost, LightGBM, scikit-learn |
| **Database** | SQLite |
| **ML/Data** | Pandas, NumPy, Joblib |
| **IBM Technologies** | IBM Bob AI / Bob AI Hackathon development environment |
| **Other** | Axios, REST API |

> Do not list watsonx.ai, IBM Cloud, or other IBM services unless they are actually used in the implementation.

---

## 🤖 Machine Learning

### Congestion Risk Model

PortMind uses a 50/50 ensemble of:

- XGBoost
- LightGBM

The model predicts:

`congestion_risk = 1`

when the vessel arrives more than 30 minutes later than its scheduled ETA.

### Model Inputs

The model uses 22 features including:

- Vessel position
- Speed over ground
- Course/heading information
- ETA/ETD gaps
- Lead time
- Snapshot time features
- ETA calendar features
- Departure port
- Arrival port
- Route information
- Historical congestion/delay rates

### Verified Test Results

| Metric | Result |
|---|---:|
| **ROC-AUC** | **93.14%** |
| **Accuracy** | **89.15%** |
| **Congestion Recall** | **87.88%** |
| **Validation Threshold** | **0.35** |
| **Tracking Rows** | **823,672** |
| **Unique Voyages** | **2,516** |

---

## 📁 Repository Structure

```text
├── src/
│   ├── frontend/
│   │   ├── public/
│   │   │   ├── assets/
│   │   │   └── sample-vessels.csv
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── layouts/
│   │       ├── services/
│   │       └── data/
│   │
│   └── backend/
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── db/
│       │   ├── ml/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   └── utils/
│       ├── l1_congestion_production/
│       │   ├── xgboost_pipeline.joblib
│       │   ├── lightgbm_pipeline.joblib
│       │   └── metadata.joblib
│       ├── tracking_db.csv
│       └── requirements.txt
│
├── docs/
│   └── PROJECT_STATE.md
│
├── demo/
│   ├── screenshots/
│   └── demo-video-link.txt
│
├── presentation/
│   └── slides.pdf
│
└── submission.yaml
=======
# 🚀 [Your Project Title Here]

> ⚠️ **Replace everything in `[ ]` brackets with your actual content before submission.**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | [Your Team Name] |
| **Track** | [AI / DevOps / Sustainability / Open] |
| **Team Lead** | [Name] — [email@ibm.com] |
| **Members** | [Name 1], [Name 2], [Name 3] |

---

## 🎯 Problem Statement

> In 2–3 sentences: What problem does your project solve? Who experiences this problem?

[Describe the real-world problem your project addresses. Be specific about who the user is and what pain point they face.]

---

## 💡 Solution

> In 2–3 sentences: What did you build? How does it solve the problem above?

[Describe your solution clearly. Explain the core mechanism — what makes it work.]

---

## ✨ Key Features

- **Feature 1:** [Brief description — e.g., "Real-time anomaly detection using watsonx.ai"]
- **Feature 2:** [Brief description]
- **Feature 3:** [Brief description]
- **Feature 4:** [Optional]
- **Feature 5:** [Optional]

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | [e.g., Python, TypeScript] |
| **Frameworks** | [e.g., FastAPI, React] |
| **IBM Technologies** | [e.g., watsonx.ai, IBM Bob, IBM Cloud] |
| **Databases** | [e.g., PostgreSQL, Redis] |
| **Other** | [e.g., Docker, GitHub Actions] |

---

## 📁 Repository Structure

```
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── demo-video-link.txt  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/[your-repo].git
cd [your-repo]

# 2. Install dependencies
[your install command here]

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run the project
[your run command here]
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- [Limitation 1: e.g., "Authentication is mocked — not production-ready"]
- [Limitation 2: e.g., "Only tested on Chrome"]
- [Limitation 3: e.g., "Feature X is scaffolded but not fully implemented"]

---

## 🏅 What We're Most Proud Of

[Tell the judges what part of your submission is strongest and worth paying close attention to.]

---
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
