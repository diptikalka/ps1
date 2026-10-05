import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.dirname(__file__)

ZONES = [
    {
        "zone_id": "Z01",
        "name": "Nagpur Central (Sitabuldi)",
        "elevation_m": 310,
        "slope_degree": 2.5,
        "drainage_capacity_index": 0.60,
        "flood_prone_classification": "Urban Concrete Basin",
        "soil_absorption_index": 0.35,
        "hist_flood_freq": 4,
        "max_hist_rain_mm": 210.0,
        "past_disasters": 2,
        "hist_vulnerability": 0.50
    },
    {
        "zone_id": "Z02",
        "name": "Kamptee Flood Plain (Kanhan River)",
        "elevation_m": 275,
        "slope_degree": 0.8,
        "drainage_capacity_index": 0.30,
        "flood_prone_classification": "Lowland River Floodplain",
        "soil_absorption_index": 0.25,
        "hist_flood_freq": 11,
        "max_hist_rain_mm": 320.0,
        "past_disasters": 7,
        "hist_vulnerability": 0.90
    },
    {
        "zone_id": "Z03",
        "name": "Nagpur South (Besa / Manewada)",
        "elevation_m": 298,
        "slope_degree": 1.8,
        "drainage_capacity_index": 0.40,
        "flood_prone_classification": "Suburban Lowland",
        "soil_absorption_index": 0.40,
        "hist_flood_freq": 6,
        "max_hist_rain_mm": 240.0,
        "past_disasters": 3,
        "hist_vulnerability": 0.65
    },
    {
        "zone_id": "Z04",
        "name": "Hingna Industrial Belt",
        "elevation_m": 290,
        "slope_degree": 1.2,
        "drainage_capacity_index": 0.45,
        "flood_prone_classification": "Industrial Water Retention Basin",
        "soil_absorption_index": 0.30,
        "hist_flood_freq": 5,
        "max_hist_rain_mm": 225.0,
        "past_disasters": 3,
        "hist_vulnerability": 0.58
    },
    {
        "zone_id": "Z05",
        "name": "Ambazari Lake Catchment Zone",
        "elevation_m": 315,
        "slope_degree": 3.2,
        "drainage_capacity_index": 0.35,
        "flood_prone_classification": "Reservoir Overflow Catchment",
        "soil_absorption_index": 0.30,
        "hist_flood_freq": 9,
        "max_hist_rain_mm": 295.0,
        "past_disasters": 6,
        "hist_vulnerability": 0.82
    },
    {
        "zone_id": "Z06",
        "name": "Ramtek Hill Basin",
        "elevation_m": 345,
        "slope_degree": 8.5,
        "drainage_capacity_index": 0.70,
        "flood_prone_classification": "Upland Watershed Basin",
        "soil_absorption_index": 0.65,
        "hist_flood_freq": 2,
        "max_hist_rain_mm": 180.0,
        "past_disasters": 1,
        "hist_vulnerability": 0.30
    },
    {
        "zone_id": "Z07",
        "name": "Nagpur North (Pili River Floodplain)",
        "elevation_m": 288,
        "slope_degree": 1.0,
        "drainage_capacity_index": 0.35,
        "flood_prone_classification": "Lowland River Floodplain",
        "soil_absorption_index": 0.28,
        "hist_flood_freq": 10,
        "max_hist_rain_mm": 310.0,
        "past_disasters": 6,
        "hist_vulnerability": 0.88
    },
    {
        "zone_id": "Z08",
        "name": "Wadi Western Ridge",
        "elevation_m": 330,
        "slope_degree": 6.0,
        "drainage_capacity_index": 0.75,
        "flood_prone_classification": "High Ridge Slope",
        "soil_absorption_index": 0.70,
        "hist_flood_freq": 1,
        "max_hist_rain_mm": 165.0,
        "past_disasters": 0,
        "hist_vulnerability": 0.20
    }
]

def create_terrain_dataset():
    records = []
    for z in ZONES:
        records.append({
            "zone_id": z["zone_id"],
            "location_name": z["name"],
            "elevation_m": z["elevation_m"],
            "slope_degree": z["slope_degree"],
            "drainage_capacity_index": z["drainage_capacity_index"],
            "flood_prone_classification": z["flood_prone_classification"],
            "soil_absorption_index": z["soil_absorption_index"]
        })
    df = pd.DataFrame(records)
    path = os.path.join(DATA_DIR, "terrain_data.csv")
    df.to_csv(path, index=False)
    print(f"Created {path} with {len(df)} rows.")

def create_historical_dataset():
    records = []
    for z in ZONES:
        records.append({
            "zone_id": z["zone_id"],
            "zone_name": z["name"],
            "historical_flood_frequency_per_decade": z["hist_flood_freq"],
            "max_historical_rainfall_mm": z["max_hist_rain_mm"],
            "past_disaster_events_count": z["past_disasters"],
            "historical_vulnerability_score": z["hist_vulnerability"]
        })
    df = pd.DataFrame(records)
    path = os.path.join(DATA_DIR, "historical_data.csv")
    df.to_csv(path, index=False)
    print(f"Created {path} with {len(df)} rows.")

def create_weather_and_satellite_datasets():
    np.random.seed(42)
    timestamps = [f"2026-09-26 {h:02d}:00:00" for h in range(24)]
    
    weather_records = []
    satellite_records = []

    for z in ZONES:
        zid = z["zone_id"]
        base_risk = z["hist_vulnerability"]
        
        running_accumulated = 0.0

        for t in timestamps:
            # Simulate hourly rain pattern with a storm peak around hour 14-16
            hour = int(t.split(" ")[1].split(":")[0])
            peak_factor = np.exp(-0.5 * ((hour - 15) / 3.0)**2)
            
            rain = max(0.0, float(round((base_risk * 65.0 * peak_factor) + np.random.normal(2.0, 3.0), 1)))
            running_accumulated += rain
            acc_24h = round(running_accumulated + (base_risk * 40.0), 1)
            
            temp = float(round(30.0 - (rain * 0.08) - np.random.normal(0, 0.5), 1))
            humidity = float(round(min(99.0, 55.0 + (rain * 0.5) + (base_risk * 20.0) + np.random.normal(0, 2.0)), 1))
            wind = float(round(8.0 + (rain * 0.25) + np.random.normal(0, 1.5), 1))

            weather_records.append({
                "zone_id": zid,
                "timestamp": t,
                "current_rainfall_mm": rain,
                "previous_rainfall_24h_mm": acc_24h,
                "humidity_pct": humidity,
                "temperature_c": temp,
                "wind_speed_kmh": wind
            })

            # Satellite indicators synchronized with cloud storm
            cloud_density = float(round(min(100.0, 30.0 + (rain * 0.8) + (base_risk * 30.0)), 1))
            radar_dbz = float(round(min(65.0, 15.0 + (rain * 0.45) + (base_risk * 15.0)), 1))
            sat_rain_index = float(round(min(1.0, (rain / 90.0) * 0.7 + (cloud_density / 100.0) * 0.3), 2))
            cloud_top_temp = float(round(-20.0 - (sat_rain_index * 45.0), 1))

            satellite_records.append({
                "zone_id": zid,
                "timestamp": t,
                "satellite_cloud_density_pct": cloud_density,
                "radar_reflectivity_dbz": radar_dbz,
                "satellite_rain_intensity_index": sat_rain_index,
                "cloud_top_temperature_c": cloud_top_temp
            })

    df_w = pd.DataFrame(weather_records)
    path_w = os.path.join(DATA_DIR, "weather_data.csv")
    df_w.to_csv(path_w, index=False)
    print(f"Created {path_w} with {len(df_w)} rows.")

    df_s = pd.DataFrame(satellite_records)
    path_s = os.path.join(DATA_DIR, "satellite_data.csv")
    df_s.to_csv(path_s, index=False)
    print(f"Created {path_s} with {len(df_s)} rows.")

if __name__ == "__main__":
    create_terrain_dataset()
    create_historical_dataset()
    create_weather_and_satellite_datasets()
