#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

try:
    data = json.dumps({
        "username": "admin@floodresilience.lk",
        "password": "admin123"
    }).encode('utf-8')
    
    req = urllib.request.Request(
        'http://127.0.0.1:8001/api/v1/auth/login',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"✓ Status: {response.status} OK")
        response_data = json.loads(response.read().decode())
        print(f"✓ Login successful!")
        print(f"  - Access token: {response_data.get('access_token', 'N/A')[:30]}...")
        if 'user' in response_data:
            print(f"  - User: {response_data['user'].get('email', 'N/A')}")
except urllib.error.HTTPError as e:
    print(f"✗ HTTP Error {e.code}: {e.reason}")
    try:
        error_data = json.loads(e.read().decode())
        print(f"  Error details: {error_data}")
    except:
        print(f"  Response: {e.read().decode()[:300]}")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")
