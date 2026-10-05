import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from data_processor import DataProcessor, ZONE_METADATA
from model import RiskPredictor

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app) # Enable CORS for frontend requests

data_processor = DataProcessor()
risk_predictor = RiskPredictor()

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# --------------------------------------------------------------------------
# MANDATORY FLASK APIS
# --------------------------------------------------------------------------

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """Endpoint 1: Weather Telemetry Data"""
    zone_query = request.args.get('location') or request.args.get('zone_id')
    if zone_query:
        zone_meta = data_processor.get_zone_by_id_or_name(zone_query)
        weather_record = data_processor.get_weather(zone_meta['zone_id'])
        return jsonify({
            "status": "success",
            "zone": zone_meta,
            "weather": weather_record
        })
    else:
        all_weather = data_processor.get_weather()
        return jsonify({
            "status": "success",
            "data": all_weather
        })

@app.route('/api/satellite', methods=['GET'])
def get_satellite():
    """Endpoint 2: Satellite / Radar Cloud Density Indicators"""
    zone_query = request.args.get('location') or request.args.get('zone_id')
    if zone_query:
        zone_meta = data_processor.get_zone_by_id_or_name(zone_query)
        satellite_record = data_processor.get_satellite(zone_meta['zone_id'])
        return jsonify({
            "status": "success",
            "zone": zone_meta,
            "satellite": satellite_record
        })
    else:
        all_satellite = data_processor.get_satellite()
        return jsonify({
            "status": "success",
            "data": all_satellite
        })

@app.route('/api/terrain', methods=['GET'])
def get_terrain():
    """Endpoint 3: Topography & Elevation Data"""
    zone_query = request.args.get('location') or request.args.get('zone_id')
    if zone_query:
        zone_meta = data_processor.get_zone_by_id_or_name(zone_query)
        terrain_record = data_processor.get_terrain(zone_meta['zone_id'])
        return jsonify({
            "status": "success",
            "zone": zone_meta,
            "terrain": terrain_record
        })
    else:
        all_terrain = data_processor.get_terrain()
        return jsonify({
            "status": "success",
            "data": all_terrain
        })

@app.route('/api/historical', methods=['GET'])
def get_historical():
    """Endpoint 4: Historical Rainfall & Flood Pattern Data"""
    zone_query = request.args.get('location') or request.args.get('zone_id')
    if zone_query:
        zone_meta = data_processor.get_zone_by_id_or_name(zone_query)
        hist_record = data_processor.get_historical(zone_meta['zone_id'])
        return jsonify({
            "status": "success",
            "zone": zone_meta,
            "historical": hist_record
        })
    else:
        all_hist = data_processor.get_historical()
        return jsonify({
            "status": "success",
            "data": all_hist
        })

@app.route('/api/predict', methods=['GET', 'POST'])
def predict_risk():
    """Endpoint 5: Multi-Source AI Risk Prediction Engine"""
    if request.method == 'POST':
        payload = request.get_json(silent=True) or {}
    else:
        payload = request.args.to_dict()

    location_query = payload.get('location') or payload.get('zone_id') or 'Z02'
    zone_meta = data_processor.get_zone_by_id_or_name(location_query)
    
    # Fetch default multi-source merged features for zone
    base_features = data_processor.get_merged_multi_source_features(zone_meta['zone_id'])
    
    # Override with any custom user inputs from payload if provided
    for key in base_features:
        if key in payload and payload[key] is not None:
            try:
                base_features[key] = float(payload[key])
            except ValueError:
                pass

    # Scenario modifiers for demo simulation
    scenario = payload.get('scenario')
    if scenario == 'cloudburst':
        base_features['current_rainfall_mm'] = max(82.0, base_features['current_rainfall_mm'] * 2.2)
        base_features['previous_rainfall_24h_mm'] = max(240.0, base_features['previous_rainfall_24h_mm'] * 2.0)
        base_features['humidity_pct'] = 98.0
        base_features['radar_reflectivity_dbz'] = 58.0
        base_features['satellite_cloud_density_pct'] = 96.0
        base_features['satellite_rain_intensity_index'] = 0.95
    elif scenario == 'clear':
        base_features['current_rainfall_mm'] = 1.5
        base_features['previous_rainfall_24h_mm'] = 8.0
        base_features['humidity_pct'] = 52.0
        base_features['radar_reflectivity_dbz'] = 18.0
        base_features['satellite_cloud_density_pct'] = 25.0
        base_features['satellite_rain_intensity_index'] = 0.10

    prediction = risk_predictor.predict(base_features)
    evolution = risk_predictor.predict_evolution(base_features)

    return jsonify({
        "status": "success",
        "zone_id": zone_meta['zone_id'],
        "location": zone_meta['name'],
        "lat": zone_meta['lat'],
        "lon": zone_meta['lon'],
        "multi_source_features": base_features,
        "prediction": prediction,
        "risk_evolution": evolution
    })

# --------------------------------------------------------------------------
# GIS & UI DASHBOARD ENDPOINTS
# --------------------------------------------------------------------------

@app.route('/api/risk-zones', methods=['GET'])
def get_risk_zones():
    """Returns all GIS map risk zones with multi-source metrics and AI predictions."""
    scenario = request.args.get('scenario', 'default')
    zones_list = []
    
    for zone_id, meta in ZONE_METADATA.items():
        base_features = data_processor.get_merged_multi_source_features(zone_id)

        if scenario == 'cloudburst':
            if zone_id in ['Z02', 'Z05', 'Z07']:
                base_features['current_rainfall_mm'] = 86.0
                base_features['previous_rainfall_24h_mm'] = 265.0
                base_features['humidity_pct'] = 98.0
                base_features['radar_reflectivity_dbz'] = 58.0
                base_features['satellite_cloud_density_pct'] = 96.0
                base_features['satellite_rain_intensity_index'] = 0.95
            elif zone_id in ['Z01', 'Z03', 'Z04']:
                base_features['current_rainfall_mm'] = 54.0
                base_features['previous_rainfall_24h_mm'] = 165.0
                base_features['radar_reflectivity_dbz'] = 46.0
        elif scenario == 'clear':
            base_features['current_rainfall_mm'] = 1.5
            base_features['previous_rainfall_24h_mm'] = 8.0
            base_features['humidity_pct'] = 50.0
            base_features['radar_reflectivity_dbz'] = 18.0
            base_features['satellite_cloud_density_pct'] = 25.0
            base_features['satellite_rain_intensity_index'] = 0.10

        prediction = risk_predictor.predict(base_features)
        evolution = risk_predictor.predict_evolution(base_features)
        
        zones_list.append({
            "zone_id": meta['zone_id'],
            "location": meta['name'],
            "lat": meta['lat'],
            "lon": meta['lon'],
            "bounds": meta['bounds'],
            "multi_source_features": base_features,
            "weather": {
                "rainfall_mm": base_features['current_rainfall_mm'],
                "accumulated_24h_mm": base_features['previous_rainfall_24h_mm'],
                "temperature_c": base_features['temperature_c'],
                "humidity_pct": base_features['humidity_pct'],
                "wind_speed_kmh": base_features['wind_speed_kmh']
            },
            "satellite": {
                "cloud_density_pct": base_features['satellite_cloud_density_pct'],
                "radar_reflectivity_dbz": base_features['radar_reflectivity_dbz'],
                "satellite_rain_intensity": base_features['satellite_rain_intensity_index']
            },
            "terrain": {
                "elevation_m": base_features['elevation_m'],
                "slope_degree": base_features['slope_degree'],
                "drainage_index": base_features['drainage_capacity_index'],
                "soil_absorption": base_features['soil_absorption_index'],
                "flood_prone_type": base_features['flood_prone_classification']
            },
            "historical": {
                "flood_frequency": base_features['historical_flood_frequency_per_decade'],
                "vulnerability_score": base_features['historical_vulnerability_score']
            },
            "risk_level": prediction['risk_level'],
            "probability": prediction['probability'],
            "warning_window": prediction['warning_window'],
            "factors": prediction['factors'],
            "recommended_actions": prediction['recommended_actions'],
            "multi_source_scores": prediction['multi_source_scores'],
            "risk_evolution": evolution
        })

    return jsonify({
        "status": "success",
        "demo_mode": True,
        "region": "Nagpur Region, Maharashtra (Disaster Intelligence Platform Area)",
        "label": "Prototype / Demo Data (Not real-time)",
        "zones": zones_list
    })

@app.route('/api/trends', methods=['GET'])
def get_trends():
    zone_query = request.args.get('location') or request.args.get('zone_id') or 'Z02'
    zone_meta = data_processor.get_zone_by_id_or_name(zone_query)
    trend_data = data_processor.get_historical_trend(zone_meta['zone_id'])
    
    return jsonify({
        "status": "success",
        "zone": zone_meta,
        "trends": trend_data
    })

if __name__ == '__main__':
    import socket
    port = 5000
    for test_port in range(5000, 5010):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', test_port)) != 0:
                port = test_port
                break

    print(f"[Backend] Starting Flask Multi-Source Early Warning System on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
