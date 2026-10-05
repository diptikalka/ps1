# 🚨 AI-Driven Hyper-Local Early Warning System
> **Enterprise Disaster Intelligence Prototype / MVP**  
> *Multi-Source Extreme Weather Risk Prediction & Leaflet GIS Mapping*

---

## 📌 Problem Statement
Extreme weather events, such as cloudbursts, sudden urban flash floods, and localized heavy rainstorms, cause immense loss of life, infrastructure damage, and economic disruption. Conventional weather forecasts cover large administrative districts (e.g. 50km × 50km grid), leaving municipal disaster responders without **hyper-local (1km - 5km scale)** situational awareness. 

Existing challenges include:
- Lack of granular neighborhood-level risk warnings.
- Delayed notification windows for low-lying catchments and river floodplains.
- Raw weather telemetry lacks actionable automated emergency response recommendations.

---

## 💡 Proposed Solution
Our **AI-Driven Hyper-Local Early Warning System** ingests multi-source real-time and historical data (Weather Telemetry, Satellite Cloud Density & Radar Reflectivity, Terrain Topography & Elevation, and Historical Flood Patterns) to predict localized flood and extreme weather risks using a **Random Forest ML Engine**.

### Key Features:
1. **Hyper-Local GIS Map Integration**: Leaflet GIS map with 3 switchable basemaps (Dark Mode, OpenStreetMap, ESRI Satellite Aerial) and 3 toggleable layers (**Risk Zones**, **Satellite Radar Heatmap**, **Terrain & Elevation**).
2. **Multi-Source AI Prediction Engine**: Scikit-Learn Random Forest Classifier providing real-time risk classification (`Low`, `Moderate`, `High`, `Extreme`), confidence probability (e.g. `88% Confidence`), and expected warning windows (e.g., *Immediate (Next 30 Mins – 2 Hours)*).
3. **Explainable AI (XAI)**: Multi-source factor breakdown explaining *"Why is this area at risk?"* across Weather Telemetry, Satellite Radar, Terrain Elevation, and Historical Flood Patterns.
4. **Actionable Emergency Guidance**: Automated recommended actions tailored for municipal ward officers and citizens.
5. **Interactive Demo Simulation**: Built-in scenario switcher (*Standard Multi-Source Data*, *Cloudburst Emergency*, *Fair Weather*) to demonstrate live AI responsiveness during system presentations.

---

## 🧪 Mandatory Multi-Source Data Files (`data/`)

1. **`weather_data.csv`**: Current rainfall, 24h accumulated rainfall, humidity, temperature, wind speed.
2. **`satellite_data.csv`**: Satellite cloud density (%), Doppler radar reflectivity (dBZ), satellite rain intensity index.
3. **`terrain_data.csv`**: Elevation above sea level (m), slope (°), urban drainage capacity index, soil absorption threshold.
4. **`historical_data.csv`**: Historical flood frequency per decade, max historical rainfall (mm), vulnerability rating.

---

## ⚙️ Mandatory Flask Backend APIs (`backend/app.py`)

- `GET /api/weather` – Fetches weather telemetry dataset & latest record.
- `GET /api/satellite` – Fetches Doppler radar reflectivity & satellite cloud cover.
- `GET /api/terrain` – Fetches topography & elevation metrics.
- `GET /api/historical` – Fetches historical flood frequencies & vulnerability ratings.
- `POST /api/predict` & `GET /api/predict` – Executes AI risk prediction combining all four sources.
- `GET /api/risk-zones` – Serves GIS map layer boundaries, metrics, predictions, and scenario simulations.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Modern Dark Theme), JavaScript (ES6+)
- **GIS Map**: Leaflet.js + OpenStreetMap + ESRI Satellite Aerial Imagery
- **Charts & Data Viz**: Chart.js
- **Backend**: Python Flask, Flask-CORS
- **AI/ML**: Python Scikit-Learn (`RandomForestClassifier`), Joblib, NumPy, Pandas

---

## 📁 Project Structure

```
/disaster-management
├── frontend/
│   ├── index.html        # Main Emergency Command Dashboard UI
│   ├── style.css         # Glassmorphism & Risk Color System
│   └── script.js         # Leaflet GIS Map & Layer Controller
├── backend/
│   ├── app.py            # Flask REST API Server
│   ├── model.py          # Random Forest ML Model & Explainable AI Engine
│   ├── data_processor.py # Data Pipeline & Multi-Source Merging Engine
│   └── test_api.py       # Automated API Test Suite
├── data/
│   ├── generate_datasets.py # Generator for Mandatory CSV Datasets
│   ├── weather_data.csv     # Weather Telemetry Dataset
│   ├── satellite_data.csv   # Satellite & Radar Dataset
│   ├── terrain_data.csv     # Topography & Elevation Dataset
│   └── historical_data.csv  # Historical Flood Patterns Dataset
├── model/
│   ├── risk_model.pkl    # Trained Scikit-Learn Random Forest Model
│   └── scaler.pkl        # StandardScaler Transformer
├── run.bat               # Windows One-Click Launcher
├── python.bat            # Windows Python Execution Alias Fix Wrapper
├── requirements.txt      # Python Dependencies List
└── README.md             # Project Documentation
```

---

## 🚀 How to Run the Project Locally

### 1. Windows Quick Start (Avoid "Python Not Found")
Double click `run.bat` or run in terminal:

```cmd
run.bat
```
*(Or use `python.bat backend/app.py` or `py backend/app.py`)*

### 2. Access the Web Dashboard
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧠 Risk Level & Warning Window Reference

| Risk Level | Color Code | Warning Window | Recommended Response Action |
| :--- | :--- | :--- | :--- |
| **Low** | 🟢 Green | No Immediate Threat (Next 24+ Hours) | Continue standard automated sensor telemetry monitoring. |
| **Moderate** | 🟡 Yellow | Next 6–12 Hours | Alert Municipal Quick Response Force; clear storm drain bottlenecking. |
| **High** | 🟧 Orange | Next 2–6 Hours | Issue automated SMS & siren alert; deploy mobile drainage pumps. |
| **Extreme** | 🔴 Red | Immediate (Next 30 Mins – 2 Hours) | Prepare low-lying shelters; initiate immediate evacuation warning. |
