import requests
import json

session = requests.Session()
# Login to get cookie and CSRF token
login_resp = session.post("http://localhost:5678/rest/login", json={
    "emailOrLdapLoginId": "kspandia@gmail.com",
    "password": "Rrgtmr@9"
})

if login_resp.status_code == 200:
    print("Logged in successfully")
    
    # Read payload
    with open('payload.json', 'r', encoding='utf-8') as f:
        payload = json.load(f)
        
    # In n8n, internal REST API requires the `browserId` cookie or similar for CSRF.
    # We can also get a new API key and use the public API!
    api_key_resp = session.post("http://localhost:5678/rest/api-keys", json={
        "label": "Temp API Key"
    })
    
    if api_key_resp.status_code == 200:
        api_key = api_key_resp.json()['data']['apiKey']
        print("Got API Key")
        
        headers = {"X-N8N-API-KEY": api_key}
        
        # update workflow via Public API
        update_resp = requests.put(
            "http://localhost:5678/api/v1/workflows/wK18IwIA4ERn8xh9",
            headers=headers,
            json=payload
        )
        
        if update_resp.status_code == 200:
            print("Successfully updated workflow via API")
        else:
            print("Failed to update via API:", update_resp.text)
            
        # Delete temp key
        key_id = api_key_resp.json()['data']['id']
        session.delete(f"http://localhost:5678/rest/api-keys/{key_id}")
    else:
        print("Failed to create API key:", api_key_resp.text)
else:
    print("Failed to login:", login_resp.text)
