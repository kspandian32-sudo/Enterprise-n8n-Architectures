import json
import urllib.request
import urllib.error
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

API_URL = "http://localhost:5678/api/v1"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NWJiZmFjMy01MTk1LTQ4NDMtOTQzNS03OGRmZDBkOGYzNGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4ODQxMjYwfQ.XizMVE5nblsFfiAawlYZqxzSNQyaBKuE5mRvIdiSFH4"
WORKFLOW_ID = "kHUqP4bRNKBNkM04"

def api_get(path):
    req = urllib.request.Request(f"{API_URL}{path}", headers={"X-N8N-API-KEY": API_KEY})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def api_put(path, data):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(f"{API_URL}{path}", data=body, method="PUT",
                                 headers={"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='replace')
        print(f"HTTP Error {e.code}: {e.reason}")
        print(f"Response body: {error_body[:2000]}")
        raise

# 1. Fetch the live workflow
print("Fetching live workflow...")
wf = api_get(f"/workflows/{WORKFLOW_ID}")
nodes = wf["nodes"]
connections = wf["connections"]

fixes = []

for node in nodes:
    name = node["name"]
    
    # FIX 1: "Fetch Completed Clients" — documentId needs __rl wrapper
    if "Fetch Completed Clients" in name:
        if not isinstance(node["parameters"].get("documentId"), dict):
            node["parameters"]["documentId"] = {
                "__rl": True,
                "value": "16dAe64XCQ_iecfAlrrdG5n6TtJyr2cDrMmIN4Uv9xBU",
                "mode": "id"
            }
            fixes.append(f"[OK] Fixed '{name}': documentId -> __rl format")
        
    # FIX 2: "Gemini: Write Completion Report" — add credentials + fix auth params
    if "Gemini" in name and "Completion" in name:
        node["parameters"]["authentication"] = "genericCredentialType"
        node["parameters"]["genericAuthType"] = "httpQueryAuth"
        # Remove wrong keys if present
        for bad_key in ["nodecredentialtype", "contentType"]:
            if bad_key in node["parameters"]:
                del node["parameters"][bad_key]
        node["credentials"] = {
            "httpQueryAuth": {
                "id": "1jdjTjj9aaTK6i6Y",
                "name": "Query Auth Gemini kspandian32"
            }
        }
        fixes.append(f"[OK] Fixed '{name}': added httpQueryAuth credentials")

    # FIX 3: "Send Completion Email" — fix SMTP credential ID typo
    if "Send Completion Email" in name:
        cred_id = node.get("credentials", {}).get("smtp", {}).get("id", "")
        if cred_id == "udtIzlJq8iqmL3aZ":
            node["credentials"]["smtp"]["id"] = "udtIzlJq8iqmL3Az"
            fixes.append(f"[OK] Fixed '{name}': SMTP credential ID typo")

    # FIX 4: "Parse Completion Email" — fix position to be in the offboarding flow
    if "Parse Completion Email" in name:
        old_pos = node.get("position", [])
        node["position"] = [-880, 1072]
        fixes.append(f"[OK] Fixed '{name}': repositioned from {old_pos} to [-880, 1072]")

    # FIX 5: "Update CRM → Archived" — documentId needs __rl wrapper
    if "Archived" in name:
        if not isinstance(node["parameters"].get("documentId"), dict):
            node["parameters"]["documentId"] = {
                "__rl": True,
                "value": "16dAe64XCQ_iecfAlrrdG5n6TtJyr2cDrMmIN4Uv9xBU",
                "mode": "id"
            }
            fixes.append(f"[OK] Fixed '{name}': documentId -> __rl format")

    # FIX 6: "Every Monday" trigger — add weekly interval config (use weeks unit)
    if "Every Monday" in name:
        interval = node["parameters"].get("rule", {}).get("interval", [{}])
        if interval == [{}]:
            node["parameters"]["rule"] = {
                "interval": [
                    {
                        "field": "weeks",
                        "triggerAtHour": 9,
                        "triggerAtDay": 1
                    }
                ]
            }
            fixes.append(f"[OK] Fixed '{name}': added Monday 9 AM weekly schedule")

# FIX 7: Fix Offboarding connections
gemini_comp_name = None
parse_comp_name = None
safe_mode_comp_name = None

for node in nodes:
    n = node["name"]
    if "Gemini" in n and "Completion" in n: gemini_comp_name = n
    if "Parse Completion" in n: parse_comp_name = n
    if "Safe Mode" in n and "Completion" in n: safe_mode_comp_name = n

if all([gemini_comp_name, parse_comp_name, safe_mode_comp_name]):
    connections[gemini_comp_name] = {
        "main": [[
            {"node": parse_comp_name, "type": "main", "index": 0}
        ]]
    }
    fixes.append(f"[OK] Fixed connection: Gemini Completion -> Parse Completion")

    connections[parse_comp_name] = {
        "main": [[
            {"node": safe_mode_comp_name, "type": "main", "index": 0}
        ]]
    }
    fixes.append(f"[OK] Fixed connection: Parse Completion -> Safe Mode")

print(f"\nApplying {len(fixes)} fixes...")
for f in fixes:
    print(f"  {f}")

# Build the update payload — strip non-standard settings
allowed_settings = {}
for key in ["executionOrder", "callerPolicy", "errorWorkflow", "timezone", 
            "saveDataSuccessExecution", "saveDataErrorExecution", 
            "saveExecutionProgress", "saveManualExecutions", "executionTimeout"]:
    if key in wf.get("settings", {}):
        allowed_settings[key] = wf["settings"][key]

update = {
    "name": wf["name"],
    "nodes": nodes,
    "connections": connections,
    "settings": allowed_settings
}

print("\nPushing to n8n...")
result = api_put(f"/workflows/{WORKFLOW_ID}", update)
print(f"\nWorkflow updated successfully!")
print(f"  Nodes: {len(result.get('nodes', []))}")
print(f"  Version: {result.get('versionId', 'N/A')}")
