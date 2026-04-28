import requests
import json

api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NWJiZmFjMy01MTk1LTQ4NDMtOTQzNS03OGRmZDBkOGYzNGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4ODQxMjYwfQ.XizMVE5nblsFfiAawlYZqxzSNQyaBKuE5mRvIdiSFH4"
headers = {"X-N8N-API-KEY": api_key}

with open('payload.json', 'r', encoding='utf-8') as f:
    payload = json.load(f)

# The n8n public API restricts what can be in the settings object.
if 'settings' in payload:
    # remove unknown properties
    payload['settings'] = {
        "executionOrder": "v1"
    }

# update workflow via Public API
update_resp = requests.put(
    "http://localhost:5678/api/v1/workflows/wK18IwIA4ERn8xh9",
    headers=headers,
    json=payload
)

if update_resp.status_code == 200:
    print("Successfully updated workflow wK18IwIA4ERn8xh9 via API")
else:
    print("Failed to update via API:", update_resp.text)
