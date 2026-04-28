import requests
import json

n8n_url = "http://localhost:5678/api/v1/workflows/wK18IwIA4ERn8xh9"
headers = {"X-N8N-API-KEY": ""} # Let's see if we can just get it, or if there's no auth required locally.
# Actually, the user gave credentials: kspandia@gmail.com / Rrgtmr@9
# We can use basic auth or login to get token

import requests

session = requests.Session()
response = session.post("http://localhost:5678/rest/login", json={
    "email": "kspandia@gmail.com",
    "password": "Rrgtmr@9"
})
if response.status_code == 200:
    print("Logged in successfully")
    data = response.json()
    auth_cookie = response.cookies
    workflow_resp = session.get("http://localhost:5678/rest/workflows/wK18IwIA4ERn8xh9")
    if workflow_resp.status_code == 200:
        workflow = workflow_resp.json()
        print("Fetched workflow")
        
        # modify Data Normalizer
        for node in workflow['data']['nodes']:
            if node['name'] == '🔧 Data Normalizer':
                node['parameters']['jsCode'] = node['parameters']['jsCode'].replace(
                    'const charAi = JSON.parse($node["🤖 AI: Character Sheet"].json.message.content);',
                    'const charAi = JSON.parse($node["🤖 AI: Character Sheet"].json.message.content.replace(/```json/gi, \'\').replace(/```/g, \'\').trim());'
                )
            elif node['name'] == '🔧 Expand Calendar':
                node['parameters']['jsCode'] = node['parameters']['jsCode'].replace(
                    'const calAi = JSON.parse($node["🤖 AI: 30-Day Calendar"].json.message.content);',
                    'const content = $node["🤖 AI: 30-Day Calendar"].json.message.content.replace(/```json/gi, \'\').replace(/```/g, \'\').trim();\nconst calAi = JSON.parse(content + (content.endsWith("]") ? "" : "]"));'
                )
            elif node['name'] == '🤖 AI: 30-Day Calendar':
                node['parameters']['options']['maxTokens'] = 16384
                node['parameters']['prompt']['messages'][0]['content'] = 'You are an Instagram content strategist. Create detailed content calendars with ready-to-use Ideogram AI image prompts. Return ONLY a raw JSON array. DO NOT use markdown blocks like ```json, just return the raw array starting with [.'
            elif node['name'] == '🤖 AI: Character Sheet':
                node['parameters']['prompt']['messages'][0]['content'] = 'You are an expert AI influencer strategist. Create detailed virtual influencer character sheets. Return ONLY raw valid JSON. DO NOT use markdown blocks like ```json, just return the raw object starting with {.'
        
        update_resp = session.put("http://localhost:5678/rest/workflows/wK18IwIA4ERn8xh9", json=workflow['data'])
        if update_resp.status_code == 200:
            print("Successfully updated workflow via API")
        else:
            print("Failed to update:", update_resp.text)
    else:
        print("Failed to fetch workflow:", workflow_resp.text)
else:
    print("Failed to login:", response.text)
