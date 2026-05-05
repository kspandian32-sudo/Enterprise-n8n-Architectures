import requests
import json
import sys

# Set default encoding to UTF-8 for output
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

API_KEY = "n8n_api_b58350fb7d8e4b75aedc8fc4d5e36d69ee58a68bb4c24c76b7ca3e5b9d8QxMjYwfQ.XizMVE5nblsFfiAawlYZqxzSNQyaBKuE5mRvIdiSFH4"
WORKFLOW_ID = "kHUqP4bRNKBNkM04"
BASE_URL = "http://localhost:5678/api/v1"

def update_workflow():
    json_path = r"C:\AI-SEO\mission-control\WEEK_10_SUBMISSION\Updated_AI_Onboarding_SMTP.json"
    
    with open(json_path, 'r', encoding='utf-8') as f:
        wf_data = json.load(f)
    
    # Prepare the payload
    payload = {
        "name": wf_data.get("name", "🏥 AI Client Onboarding"),
        "nodes": wf_data["nodes"],
        "connections": wf_data["connections"],
        "settings": wf_data.get("settings", {}),
        "staticData": wf_data.get("staticData", None),
        "meta": wf_data.get("meta", None),
        "tags": wf_data.get("tags", [])
    }
    
    headers = {
        "X-N8N-API-KEY": API_KEY,
        "Content-Type": "application/json"
    }
    
    print(f"Updating workflow {WORKFLOW_ID}...")
    
    response = requests.put(
        f"{BASE_URL}/workflows/{WORKFLOW_ID}",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        print("SUCCESS: Workflow updated successfully.")
        print(f"Response: {response.text[:200]}...")
    else:
        print(f"ERROR: Failed to update workflow. Status code: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    update_workflow()
