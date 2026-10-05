# 📋 Product Requirement Document (PRD) & Data Research Reference

## 📌 Project Information
- **Title**: AI-Driven Hyper-Local Early Warning System
- **Domain**: Disaster Management & Climate Resilience Platform
- **Target Scale**: Hyper-Local Ward / Neighborhood Level (1km – 5km Grid)
- **Target Audience**: Municipal Disaster Management Cells, NDMA / SDRF Quick Response Forces, Ward Disaster Officers, Citizens

---

## 🎯 1. Executive Summary & Product Objectives

Traditional weather monitoring systems operate at macroscopic administrative levels (e.g. 50km × 50km district grids). This coarse resolution fails to warn urban and rural populations about **hyper-local cloudbursts, localized flash flooding, and severe waterlogging** occurring in specific low-lying catchments or river floodplains.

### Primary Product Objectives:
1. **Multi-Source Intelligence Fusion**: Ingest and combine 4 independent data pillars (Weather Telemetry, Satellite Radar Indicators, Terrain Topography, and Historical Flood Patterns) into a unified risk prediction model.
2. **High-Precision AI Risk Scoring**: Utilize a Scikit-Learn **Random Forest Classifier** to compute risk level (`Low`, `Moderate`, `High`, `Extreme`), risk probability (e.g., `88%`), and expected warning windows (e.g., `Immediate (Next 30 Mins – 2 Hours)`).
3. **Explainable AI (XAI)**: Provide human-understandable drivers explaining *why* an area is at risk (e.g., heavy rain intensity, high accumulated rainfall, satellite radar reflectivity, low elevation, past flood frequency).
4. **Interactive Multi-Layer Leaflet GIS Map**: Display color-coded risk zones, satellite cloud/radar heatmaps, and terrain elevation indicators with clean, non-watermarked GIS basemaps.

---

## 🔬 2. Data Sources Research & Synthesis Methodology

Our system moves beyond simple weather tracking by fusing **4 Data Pillars**. The table below details where each data type comes from in a real-world deployment vs. how it is structured in our MVP demo datasets:

| Data Pillar | Field Name in Dataset | Real-World API / Source | Purpose & Contribution to AI Model |
| :--- | :--- | :--- | :--- |
| **1. Weather Telemetry** (`weather_data.csv`) | `current_rainfall_mm`<br>`previous_rainfall_24h_mm`<br>`humidity_pct`<br>`temperature_c`<br>`wind_speed_kmh` | **IMD AWS** (Automatic Weather Stations), **OpenWeatherMap API**, **NOAA GFS** | Tracks current rain rate and 24-hour accumulated rainfall to detect soil saturation limits. |
| **2. Satellite & Radar** (`satellite_data.csv`) | `satellite_cloud_density_pct`<br>`radar_reflectivity_dbz`<br>`satellite_rain_intensity_index`<br>`cloud_top_temperature_c` | **ISRO MOSDAC** (INSAT-3D/3DR Hydro-Estimator), **IMD Doppler Weather Radar (DWR)** | Ingests cloud mass density and radar reflectivity (dBZ > 45 indicates heavy storm cells / cloudburst). |
| **3. Terrain Topography** (`terrain_data.csv`) | `elevation_m`<br>`slope_degree`<br>`drainage_capacity_index`<br>`soil_absorption_index`<br>`flood_prone_classification` | **ISRO Bhuvan DEM** (Cartosat-1 30m DEM), **NASA SRTM DEM** | Identifies low-lying river catchments, flat slope waterlogging zones, and concrete urban drainage bottlenecks. |
| **4. Historical Patterns** (`historical_data.csv`) | `historical_flood_frequency_per_decade`<br>`max_historical_rainfall_mm`<br>`past_disaster_events_count`<br>`historical_vulnerability_score` | **NDMA** Past Disaster Reports, **Central Water Commission (CWC)** River Gauges | Weights zones based on past disaster frequencies and historical inundation trends. |

---

## ⚙️ 3. Backend Flask API Architecture & Endpoint Specification

The backend service ([`backend/app.py`](file:///c:/Users/LENOVO/OneDrive/Desktop/disaster%20management/backend/app.py)) exposes 5 core REST API endpoints:

### Endpoint 1: `/api/weather`
- **Method**: `GET`
- **Query Params**: `location` or `zone_id` (e.g. `Z02`)
- **Description**: Returns hourly weather telemetry (rainfall, 24h accumulation, humidity, temperature, wind).
- **Consumption**: Consumed by current weather summary cards and historical rain trend chart.

### Endpoint 2: `/api/satellite`
- **Method**: `GET`
- **Query Params**: `location` or `zone_id`
- **Description**: Returns Doppler radar reflectivity (dBZ), satellite cloud mass density %, and cloud top temperature.
- **Consumption**: Consumed by Leaflet Satellite Heatmap layer and satellite radar indicator card.

### Endpoint 3: `/api/terrain`
- **Method**: `GET`
- **Query Params**: `location` or `zone_id`
- **Description**: Returns elevation ASL (m), slope (°), drainage capacity index, and flood plain classification.
- **Consumption**: Consumed by Leaflet Terrain Topography layer and elevation metric widgets.

### Endpoint 4: `/api/historical`
- **Method**: `GET`
- **Query Params**: `location` or `zone_id`
- **Description**: Returns historical flood frequencies per decade, historical max rain, and vulnerability score.
- **Consumption**: Consumed by historical vulnerability score widgets and emergency risk prioritization.

### Endpoint 5: `/api/predict`
- **Method**: `GET` / `POST`
- **Payload**:
  ```json
  {
    "location": "Z02",
    "current_rainfall_mm": 65.0,
    "previous_rainfall_24h_mm": 180.0,
    "satellite_cloud_density_pct": 92.0,
    "radar_reflectivity_dbz": 52.0,
    "elevation_m": 275.0,
    "drainage_capacity_index": 0.30,
    "historical_vulnerability_score": 0.90
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "zone_id": "Z02",
    "location": "Kamptee Flood Plain (Kanhan River)",
    "prediction": {
      "risk_level": "Extreme",
      "probability": 0.96,
      "warning_window": "Immediate (Next 30 Mins – 2 Hours)",
      "factors": [
        "Heavy rainfall intensity (65.0 mm/h)",
        "High 24h accumulated rainfall (180.0 mm)",
        "High satellite radar intensity (52 dBZ storm reflectivity)",
        "Low elevation river catchment area (275m ASL)",
        "Historical flood-prone zone (11 severe floods per decade)"
      ],
      "recommended_actions": [
        "Issue automated SMS & siren broadcast to Ward Disaster Response Officers",
        "Deploy high-capacity mobile storm-water drainage pumps",
        "Open emergency evacuation centers in low-elevation sectors"
      ],
      "multi_source_scores": {
        "weather_score": 85.0,
        "satellite_score": 88.0,
        "terrain_risk_score": 90.0,
        "historical_vulnerability_score": 90.0
      }
    }
  }
  ```

---

## 🧠 4. Machine Learning & Explainable AI Engine ([`backend/model.py`](file:///c:/Users/LENOVO/OneDrive/Desktop/disaster%20management/backend/model.py))

### Model Pipeline:
- **Algorithm**: Random Forest Classifier (`n_estimators=120`, `max_depth=12`).
- **Feature Vector**: 14 normalized numerical features passed through `StandardScaler`.
- **Label System**:
  - `Low` (Risk Score < 0.32)
  - `Moderate` (Risk Score 0.32 – 0.55)
  - `High` (Risk Score 0.55 – 0.78)
  - `Extreme` (Risk Score > 0.78)

### Explainable AI (XAI) Rule Engine:
The AI engine evaluates feature thresholds to produce multi-source human-understandable explanations:
- **Weather Drivers**: Triggered when rainfall > 25 mm/h or 24h accumulation > 80 mm.
- **Satellite Drivers**: Triggered when radar reflectivity > 45 dBZ or cloud density > 80%.
- **Terrain Drivers**: Triggered when elevation ≤ 285m or drainage index ≤ 0.40.
- **Historical Drivers**: Triggered when historical vulnerability ≥ 0.70 or flood frequency ≥ 8 events/decade.

---

## 🌍 5. Leaflet GIS Map & UI Specification ([`frontend/script.js`](file:///c:/Users/LENOVO/OneDrive/Desktop/disaster%20management/frontend/script.js))

- **GIS Basemaps**:
  1. 🗺️ **OpenStreetMap**: Standard clean vector street basemap (No API key watermarks).
  2. 🛰️ **ESRI World Imagery Aerial**: High-resolution satellite aerial imagery.
  3. ⛰️ **OpenTopoMap**: Topography contour map.
- **GIS Overlay Layers**:
  1. 🔴 **Risk Zones**: Polygons for hyper-local zones (Kamptee, Ambazari, Sitabuldi, etc.) colored by risk level.
  2. 🌀 **Satellite Radar Heatmap**: Dynamic radial heat intensity circles reflecting Doppler radar dBZ levels.
  3. ⛰️ **Terrain Topography**: Elevation markers and flood-prone basin contours.
- **Layer Controls**: Built-in Leaflet `L.control.layers` control box on map top-right + top control toggle buttons.

---

## 📚 6. Academic Research & Government References

1. **India Meteorological Department (IMD)**:
   - *Technical Report on Doppler Weather Radar (DWR) Operational Utilization for Urban Heavy Rainfall Warnings*.
   - Link / Ref: IMD Met Monograph No. ESSO/IMD/DWR/01/2018.
2. **ISRO MOSDAC & Bhuvan Geo-Portal**:
   - *INSAT-3D Hydro-Estimator Precipitation Product Specification & Cartosat Digital Elevation Model (DEM)*.
   - Ref: ISRO Satellite Application Centre (SAC) Meteorological Data Manual.
3. **National Disaster Management Authority (NDMA)**:
   - *National Disaster Management Guidelines: Management of Urban Flooding and Flash Floods*.
   - Ref: NDMA Government of India Guidelines (2010/2020).
4. **Central Water Commission (CWC)**:
   - *Flood Forecast Modeling & Basin Hydrology Standards*.
   - Ref: CWC Hydrological Data Directorate.
5. **IEEE Transactions on Geoscience and Remote Sensing**:
   - *Machine Learning Frameworks for Real-Time Multi-Sensor Flood Inundation Mapping and Warning Systems*.
   - Ref: IEEE TGRS Vol. 60, 2022.
