#!/usr/bin/env python3
import requests
try:
    r = requests.get("http://localhost:8000/api/v1/health", timeout=3)
    print(f"Backend Status: {r.status_code}")
    print(f"Response: {r.json()}")
except requests.ConnectionError as e:
    print(f"Connection Error: {e}")
except requests.Timeout:
    print("Timeout: Backend not responding")
except Exception as e:
    print(f"Error: {e}")
