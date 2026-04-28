import json
import sys

def clean_n8n_json(filepath, output_path):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    workflow_data = data['data']
    
    # Remove metadata we don't want in the repo
    keys_to_remove = ['id', 'active', 'versionId', 'activeVersionId', 'versionCounter', 'triggerCount', 'shared', 'authors', 'versionId']
    # But wait, n8n import usually wants nodes and connections. 
    # Let's just keep nodes, connections, settings, staticData, pinData, meta
    
    clean_data = {
        "nodes": workflow_data.get("nodes", []),
        "connections": workflow_data.get("connections", {}),
        "settings": workflow_data.get("settings", {}),
        "staticData": workflow_data.get("staticData", {}),
        "pinData": workflow_data.get("pinData", {}),
        "meta": workflow_data.get("meta", {})
    }
    
    with open(output_path, 'w') as f:
        json.dump(clean_data, f, indent=2)

if __name__ == "__main__":
    clean_n8n_json(sys.argv[1], sys.argv[2])
