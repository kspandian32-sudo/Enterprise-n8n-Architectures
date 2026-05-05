import json, requests, glob, os, sys

# Fix encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Find the JSON file
json_files = glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "*Client Onboarding*.json"))
if not json_files:
    print("ERROR: No onboarding JSON found")
    exit(1)

json_path = json_files[0]
print(f"Found workflow file ({len(json_files)} match)")

with open(json_path, 'r', encoding='utf-8') as f:
    wf = json.load(f)

print(f"Loaded: {len(wf.get('nodes',[]))} nodes, name={wf.get('name','?')}")

settings = wf.get("settings", {})
# Only include allowed settings fields
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
    "settings": allowed_settings
}

api_key = os.environ.get("N8N_API_KEY", "")
headers = {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": api_key
}

try:
    resp = requests.post("http://localhost:5678/api/v1/workflows", 
                        headers=headers, 
                        json=payload,
                        timeout=30)
    if resp.status_code in (200, 201):
        data = resp.json()
        wf_id = data.get('id','?')
        wf_name = data.get('name','?')
        node_count = len(data.get('nodes', []))
        print(f"SUCCESS: Workflow deployed!")
        print(f"  ID: {wf_id}")
        print(f"  Name: {wf_name}")
        print(f"  Nodes: {node_count}")
        print(f"  Active: {data.get('active')}")
        # Save the ID for reference
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deployed_workflow_id.txt'), 'w') as f:
            f.write(wf_id)
    else:
        print(f"ERROR {resp.status_code}: {resp.text[:500]}")
except Exception as e:
    print(f"ERROR: {e}")
