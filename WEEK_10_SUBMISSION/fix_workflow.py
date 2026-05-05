"""
Fix all issues in the 🏥 AI Client Onboarding workflow (kHUqP4bRNKBNkM04).

Issues identified:
1. "Fetch Completed Clients" node: documentId missing __rl wrapper → causes "Cannot get sheet 'undefined'" error
2. "Gemini: Write Completion Report" node: missing httpQueryAuth credentials
3. "Send Completion Email" node: SMTP credential ID typo ("udtIzlJq8iqmL3aZ" vs "udtIzlJq8iqmL3Az")
4. "Parse Completion Email" node: disconnected from flow (at position 700,1500 — far from flow)
5. "Update CRM → Archived" node: documentId missing __rl wrapper
6. Offboarding flow connection issues: Parse Completion Email not properly wired
7. Every Monday trigger: missing cron/interval config (just empty {})
"""

import json
import urllib.request
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
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

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
            fixes.append(f"✅ Fixed '{name}': documentId → __rl format")
        
    # FIX 2: "Gemini: Write Completion Report" — add credentials + fix auth params
    if "Gemini" in name and "Completion" in name:
        node["parameters"]["authentication"] = "genericCredentialType"
        node["parameters"]["genericAuthType"] = "httpQueryAuth"
        # Remove wrong keys if present
        if "nodecredentialtype" in node["parameters"]:
            del node["parameters"]["nodecredentialtype"]
        if "contentType" in node["parameters"]:
            del node["parameters"]["contentType"]
        node["credentials"] = {
            "httpQueryAuth": {
                "id": "1jdjTjj9aaTK6i6Y",
                "name": "Query Auth Gemini kspandian32"
            }
        }
        fixes.append(f"✅ Fixed '{name}': added httpQueryAuth credentials + fixed auth params")

    # FIX 3: "Send Completion Email" — fix SMTP credential ID typo
    if "Send Completion Email" in name:
        if node.get("credentials", {}).get("smtp", {}).get("id") == "udtIzlJq8iqmL3aZ":
            node["credentials"]["smtp"]["id"] = "udtIzlJq8iqmL3Az"
            fixes.append(f"✅ Fixed '{name}': SMTP credential ID typo (aZ → Az)")

    # FIX 4: "Parse Completion Email" — fix position to be in the offboarding flow
    if "Parse Completion Email" in name:
        old_pos = node.get("position", [])
        node["position"] = [-880, 1072]
        fixes.append(f"✅ Fixed '{name}': repositioned from {old_pos} to [-880, 1072]")

    # FIX 5: "Update CRM → Archived" — documentId needs __rl wrapper
    if "Archived" in name:
        if not isinstance(node["parameters"].get("documentId"), dict):
            node["parameters"]["documentId"] = {
                "__rl": True,
                "value": "16dAe64XCQ_iecfAlrrdG5n6TtJyr2cDrMmIN4Uv9xBU",
                "mode": "id"
            }
            fixes.append(f"✅ Fixed '{name}': documentId → __rl format")

    # FIX 6: "Every Monday" trigger — add weekly interval config
    if "Every Monday" in name:
        interval = node["parameters"].get("rule", {}).get("interval", [{}])
        if interval == [{}]:
            node["parameters"]["rule"] = {
                "interval": [
                    {
                        "field": "cronExpression",
                        "expression": "0 9 * * 1"
                    }
                ]
            }
            fixes.append(f"✅ Fixed '{name}': added Monday 9 AM cron expression")

# FIX 7: Fix Offboarding connections — rewire the proper flow:
# Daily 12PM → Fetch Completed → Gemini Completion → Parse Completion → Safe Mode → Send Completion → Update CRM
# The current connection has Gemini → Safe Mode AND Gemini → Parse simultaneously, which is wrong
# Correct flow: Fetch → Gemini → Parse → Safe Mode → Send → Update

# Find the actual node names (may have emoji issues)
gemini_comp_name = None
parse_comp_name = None
safe_mode_comp_name = None
send_comp_name = None
update_arch_name = None
fetch_comp_name = None

for node in nodes:
    n = node["name"]
    if "Gemini" in n and "Completion" in n: gemini_comp_name = n
    if "Parse Completion" in n: parse_comp_name = n
    if "Safe Mode" in n and "Completion" in n: safe_mode_comp_name = n
    if "Send Completion" in n: send_comp_name = n
    if "Archived" in n: update_arch_name = n
    if "Fetch Completed" in n: fetch_comp_name = n

if all([gemini_comp_name, parse_comp_name, safe_mode_comp_name, send_comp_name, update_arch_name]):
    # Fix: Gemini → Parse Completion (only, not to Safe Mode directly)
    connections[gemini_comp_name] = {
        "main": [[
            {"node": parse_comp_name, "type": "main", "index": 0}
        ]]
    }
    fixes.append(f"✅ Fixed connection: '{gemini_comp_name}' → '{parse_comp_name}' (removed duplicate to Safe Mode)")

    # Fix: Parse Completion → Safe Mode
    connections[parse_comp_name] = {
        "main": [[
            {"node": safe_mode_comp_name, "type": "main", "index": 0}
        ]]
    }
    fixes.append(f"✅ Fixed connection: '{parse_comp_name}' → '{safe_mode_comp_name}'")

    # Safe Mode false branch → Send Completion (already correct)
    # Send Completion → Update CRM (already correct)

print(f"\nApplying {len(fixes)} fixes...")
for f in fixes:
    print(f"  {f}")

# Build the update payload
update = {
    "name": wf["name"],
    "nodes": nodes,
    "connections": connections,
    "settings": wf.get("settings", {})
}

result = api_put(f"/workflows/{WORKFLOW_ID}", update)
print(f"\n🎉 Workflow updated successfully!")
print(f"  Nodes: {len(result.get('nodes', []))}")
print(f"  Version: {result.get('versionId', 'N/A')}")
