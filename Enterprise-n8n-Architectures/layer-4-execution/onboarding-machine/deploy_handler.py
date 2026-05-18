import json, requests, os, sys

# Fix encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

json_path = r"C:\AI-SEO\mission-control\WEEK_10_SUBMISSION\Updated_AI_Onboarding_Resilient.json"
wf_id = "kHUqP4bRNKBNkM04"

if not os.path.exists(json_path):
    print(f"ERROR: File not found at {json_path}")
    exit(1)

with open(json_path, 'r', encoding='utf-8') as f:
    wf = json.load(f)

print(f"Loaded: {len(wf.get('nodes',[]))} nodes from {os.path.basename(json_path)}")

# Filter settings
settings = wf.get("settings", {})
allowed_settings = {}
for key in ["executionOrder", "timezone", "errorWorkflow", "executionTimeout",
            "saveDataErrorExecution", "saveDataSuccessExecution", "saveExecutionProgress", 
            "saveManualExecutions"]:
    if key in settings:
        allowed_settings[key] = settings[key]

payload = {
    "name": wf["name"],
    "nodes": wf["nodes"],
    "connections": wf["connections"],
    "settings": allowed_settings,
    "pinData": {}
}

api_key = os.environ.get("N8N_API_KEY", "")
headers = {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": api_key
}

url = f"http://localhost:5678/api/v1/workflows/{wf_id}"

try:
    print(f"Updating workflow {wf_id}...")
    resp = requests.put(url, headers=headers, json=payload, timeout=30)
    if resp.status_code in (200, 201, 204):
        print(f"SUCCESS: Workflow {wf_id} updated successfully!")
        if resp.text:
            data = resp.json()
            print(f"  Name: {data.get('name','?')}")
            print(f"  Nodes: {len(data.get('nodes', []))}")
    else:
        print(f"ERROR {resp.status_code}: {resp.text[:500]}")
except Exception as e:
    print(f"ERROR: {e}")
