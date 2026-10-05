import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Hyper-local zone metadata with GeoJSON boundaries for Leaflet GIS Map
ZONE_METADATA = {
    "Z01": {
        "zone_id": "Z01",
        "name": "Nagpur Central (Sitabuldi)",
        "lat": 21.1458,
        "lon": 79.0882,
        "bounds": [
            [21.160, 79.070], [21.160, 79.105], [21.130, 79.105], [21.130, 79.070]
        ]
    },
    "Z02": {
        "zone_id": "Z02",
        "name": "Kamptee Flood Plain (Kanhan River)",
        "lat": 21.2230,
        "lon": 79.1850,
        "bounds": [
            [21.245, 79.160], [21.245, 79.210], [21.200, 79.210], [21.200, 79.160]
        ]
    },
    "Z03": {
        "zone_id": "Z03",
        "name": "Nagpur South (Besa / Manewada)",
        "lat": 21.0950,
        "lon": 79.0920,
        "bounds": [
            [21.115, 79.070], [21.115, 79.115], [21.075, 79.115], [21.075, 79.070]
        ]
    },
    "Z04": {
        "zone_id": "Z04",
        "name": "Hingna Industrial Belt",
        "lat": 21.1020,
        "lon": 78.9850,
        "bounds": [
            [21.120, 78.960], [21.120, 79.010], [21.080, 79.010], [21.080, 78.960]
        ]
    },
    "Z05": {
        "zone_id": "Z05",
        "name": "Ambazari Lake Catchment Zone",
        "lat": 21.1290,
        "lon": 79.0430,
        "bounds": [
            [21.145, 79.020], [21.145, 79.065], [21.110, 79.065], [21.110, 79.020]
        ]
    },
    "Z06": {
        "zone_id": "Z06",
        "name": "Ramtek Hill Basin",
        "lat": 21.3980,
        "lon": 79.3280,
        "bounds": [
            [21.420, 79.300], [21.420, 79.355], [21.375, 79.355], [21.375, 79.300]
        ]
    },
    "Z07": {
        "zone_id": "Z07",
        "name": "Nagpur North (Pili River Floodplain)",
        "lat": 21.1850,
        "lon": 79.0800,
        "bounds": [
            [21.205, 79.060], [21.205, 79.105], [21.165, 79.105], [21.165, 79.060]
        ]
    },
    "Z08": {
        "zone_id": "Z08",
        "name": "Wadi Western Ridge",
        "lat": 21.1550,
        "lon": 78.9980,
        "bounds": [
            [21.175, 78.975], [21.175, 79.020], [21.135, 79.020], [21.135, 78.975]
        ]
    }
}

class DataProcessor:
    def __init__(self):
        self.df_weather = None
        self.df_satellite = None
        self.df_terrain = None
        self.df_historical = None
        self.load_all_datasets()

    def load_all_datasets(self):
        """Loads all four mandatory CSV datasets."""
        w_path = os.path.join(DATA_DIR, "weather_data.csv")
        s_path = os.path.join(DATA_DIR, "satellite_data.csv")
        t_path = os.path.join(DATA_DIR, "terrain_data.csv")
        h_path = os.path.join(DATA_DIR, "historical_data.csv")

        self.df_weather = pd.read_csv(w_path) if os.path.exists(w_path) else pd.DataFrame()
        self.df_satellite = pd.read_csv(s_path) if os.path.exists(s_path) else pd.DataFrame()
        self.df_terrain = pd.read_csv(t_path) if os.path.exists(t_path) else pd.DataFrame()
        self.df_historical = pd.read_csv(h_path) if os.path.exists(h_path) else pd.DataFrame()

    def get_all_zones(self):
        """Returns list of all available zone metadata."""
        return list(ZONE_METADATA.values())

    def get_zone_by_id_or_name(self, query):
        """Finds zone metadata by zone_id or matching location name."""
        if not query:
            return ZONE_METADATA["Z02"] # Default demo zone: Kamptee
        
        query_str = str(query).lower()
        for zid, meta in ZONE_METADATA.items():
            if zid.lower() == query_str or query_str in meta["name"].lower():
                return meta
        return ZONE_METADATA["Z02"]

    def get_weather(self, zone_id=None):
        """Returns weather dataset or latest record for a zone."""
        if self.df_weather.empty:
            self.load_all_datasets()
            
        if zone_id:
            sub = self.df_weather[self.df_weather["zone_id"] == zone_id]
            if not sub.empty:
                return sub.iloc[-1].to_dict()
            return {}
        
        latest_df = self.df_weather.groupby("zone_id").last().reset_index()
        return latest_df.to_dict(orient="records")

    def get_satellite(self, zone_id=None):
        """Returns satellite indicators dataset or latest record for a zone."""
        if self.df_satellite.empty:
            self.load_all_datasets()

        if zone_id:
            sub = self.df_satellite[self.df_satellite["zone_id"] == zone_id]
            if not sub.empty:
                return sub.iloc[-1].to_dict()
            return {}

        latest_df = self.df_satellite.groupby("zone_id").last().reset_index()
        return latest_df.to_dict(orient="records")

    def get_terrain(self, zone_id=None):
        """Returns terrain/topography dataset or record for a zone."""
        if self.df_terrain.empty:
            self.load_all_datasets()

        if zone_id:
            sub = self.df_terrain[self.df_terrain["zone_id"] == zone_id]
            if not sub.empty:
                return sub.iloc[0].to_dict()
            return {}

        return self.df_terrain.to_dict(orient="records")

    def get_historical(self, zone_id=None):
        """Returns historical flood & rainfall dataset or record for a zone."""
        if self.df_historical.empty:
            self.load_all_datasets()

        if zone_id:
            sub = self.df_historical[self.df_historical["zone_id"] == zone_id]
            if not sub.empty:
                return sub.iloc[0].to_dict()
            return {}

        return self.df_historical.to_dict(orient="records")

    def get_merged_multi_source_features(self, zone_id):
        """
        Combines Weather + Satellite + Terrain + Historical data for AI prediction engine.
        """
        w = self.get_weather(zone_id)
        s = self.get_satellite(zone_id)
        t = self.get_terrain(zone_id)
        h = self.get_historical(zone_id)

        meta = self.get_zone_by_id_or_name(zone_id)

        merged = {
            "zone_id": zone_id,
            "location": meta["name"],
            # Weather factors
            "current_rainfall_mm": float(w.get("current_rainfall_mm", w.get("rainfall_mm", 35.0))),
            "previous_rainfall_24h_mm": float(w.get("previous_rainfall_24h_mm", w.get("accumulated_24h_mm", 95.0))),
            "humidity_pct": float(w.get("humidity_pct", 85.0)),
            "temperature_c": float(w.get("temperature_c", 27.0)),
            "wind_speed_kmh": float(w.get("wind_speed_kmh", 16.0)),
            # Satellite factors
            "satellite_cloud_density_pct": float(s.get("satellite_cloud_density_pct", 75.0)),
            "radar_reflectivity_dbz": float(s.get("radar_reflectivity_dbz", 42.0)),
            "satellite_rain_intensity_index": float(s.get("satellite_rain_intensity_index", 0.65)),
            # Terrain factors
            "elevation_m": float(t.get("elevation_m", meta.get("elevation_m", 295.0))),
            "slope_degree": float(t.get("slope_degree", 1.5)),
            "drainage_capacity_index": float(t.get("drainage_capacity_index", 0.45)),
            "soil_absorption_index": float(t.get("soil_absorption_index", 0.35)),
            "flood_prone_classification": str(t.get("flood_prone_classification", "Lowland Basin")),
            # Historical factors
            "historical_flood_frequency_per_decade": float(h.get("historical_flood_frequency_per_decade", 6)),
            "max_historical_rainfall_mm": float(h.get("max_historical_rainfall_mm", 260.0)),
            "historical_vulnerability_score": float(h.get("historical_vulnerability_score", 0.60))
        }

        return merged

    def get_historical_trend(self, zone_id):
        """Returns hourly historical & forecast trend for Chart.js visualization."""
        if self.df_weather.empty:
            self.load_all_datasets()
            
        zone_w = self.df_weather[self.df_weather["zone_id"] == zone_id]
        if zone_w.empty:
            zone_w = self.df_weather[self.df_weather["zone_id"] == "Z02"]
            
        records = zone_w.to_dict(orient="records")
        timestamps = [r["timestamp"].split(" ")[-1][:5] for r in records[-8:]]
        rainfall = [r["current_rainfall_mm"] for r in records[-8:]]
        accumulated = [r["previous_rainfall_24h_mm"] for r in records[-8:]]
        humidity = [r["humidity_pct"] for r in records[-8:]]
        temperature = [r["temperature_c"] for r in records[-8:]]
        
        last_rain = rainfall[-1]
        forecast_rain = [round(max(0.0, last_rain * scale + np.random.normal(0, 2.0)), 1) for scale in [1.1, 0.8, 0.4, 0.1]]
        
        return {
            "timestamps": timestamps + ["+1h (FC)", "+2h (FC)", "+3h (FC)", "+4h (FC)"],
            "historical_rainfall": rainfall,
            "forecast_rainfall": [None]*(len(rainfall)-1) + [rainfall[-1]] + forecast_rain,
            "accumulated": accumulated + [accumulated[-1] + sum(forecast_rain[:i+1]) for i in range(4)],
            "humidity": humidity + [min(100.0, humidity[-1] + i) for i in range(1, 5)],
            "temperature": temperature + [max(20.0, temperature[-1] - 0.4*i) for i in range(1, 5)]
        }
