import requests
import json

session = requests.Session()
response = session.post("http://localhost:5678/rest/login", json={
    "emailOrLdapLoginId": "kspandia@gmail.com",
    "password": "Rrgtmr@9"
})

if response.status_code == 200:
    print("Logged in successfully")
    
    with open('payload.json', 'r', encoding='utf-8') as f:
        payload = json.load(f)
        
    update_resp = session.put("http://localhost:5678/rest/workflows/wK18IwIA4ERn8xh9", json=payload)
    if update_resp.status_code == 200:
        print("Successfully updated workflow via API")
    else:
        print("Failed to update:", update_resp.text)
else:
    print("Failed to login:", response.text)
