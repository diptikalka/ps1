import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import unittest
from app import app

class BackendApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_weather_api(self):
        response = self.app.get('/api/weather?location=Z02')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('weather', data)
        print("[PASS] /api/weather")

    def test_satellite_api(self):
        response = self.app.get('/api/satellite?location=Z02')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('satellite', data)
        print("[PASS] /api/satellite")

    def test_terrain_api(self):
        response = self.app.get('/api/terrain?location=Z02')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('terrain', data)
        print("[PASS] /api/terrain")

    def test_historical_api(self):
        response = self.app.get('/api/historical?location=Z02')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('historical', data)
        print("[PASS] /api/historical")

    def test_predict_api(self):
        payload = {
            "location": "Z02",
            "current_rainfall_mm": 65.0,
            "previous_rainfall_24h_mm": 180.0,
            "satellite_cloud_density_pct": 92.0,
            "radar_reflectivity_dbz": 52.0,
            "elevation_m": 275.0,
            "drainage_capacity_index": 0.30,
            "historical_vulnerability_score": 0.90
        }
        response = self.app.post('/api/predict', json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('prediction', data)
        pred = data['prediction']
        self.assertIn(pred['risk_level'], ['Low', 'Moderate', 'High', 'Extreme'])
        self.assertGreater(len(pred['factors']), 0)
        print("[PASS] /api/predict POST")

    def test_risk_zones_api(self):
        response = self.app.get('/api/risk-zones')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(len(data['zones']), 8)
        print("[PASS] /api/risk-zones")

if __name__ == '__main__':
    unittest.main()
