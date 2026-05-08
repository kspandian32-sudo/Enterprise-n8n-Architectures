import json
import os

# Load the workflow
file_path = r'C:\Users\ks_pa\.gemini\antigravity\brain\e5bb858e-764f-490a-8b72-2a6afea939db\.system_generated\steps\1976\output.txt'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

wf = data['data']
nodes = wf['nodes']

for node in nodes:
    # 1. Email Body Fixes
    if node['name'] == '📧 Send Completion Email':
        node['parameters']['html'] = '={{ $json.completionBody }}'
        # Ensure fromEmail and toEmail are not empty as per validation report
        if not node['parameters'].get('fromEmail'):
             node['parameters']['fromEmail'] = 'kspandian32@gmail.com'
        if not node['parameters'].get('toEmail'):
             node['parameters']['toEmail'] = '={{ $json.clientEmail }}'

    # 2. Status Update Fix
    if node['name'] == '📝 Update CRM → Archived':
        node['parameters']['columns']['value']['Status'] = 'Archived'
        node['parameters']['range'] = 'A:Z'

    # 3. Range Fixes for Google Sheets
    if node['type'] == 'n8n-nodes-base.googleSheets':
        if 'range' not in node['parameters']:
            node['parameters']['range'] = 'A:Z'
        
        # 4. Body Logging Fixes
        if node['name'] == '📝 Log to Communications (Completion)':
            node['parameters']['columns']['value']['Body'] = "={{ $('🔀 Parse Completion Email').item.json.completionBody }}"
        elif node['name'] == '📝 Log to Communications':
            node['parameters']['columns']['value']['Body'] = "={{ $('🔀 Parse Check-In Email').item.json.checkinBody }}"
        elif node['name'] == '📝 Log to Communications (Follow-Up)':
            node['parameters']['columns']['value']['Body'] = "={{ $('🔀 Parse Follow-Up Email').item.json.followUpBody }}"
        elif node['name'] == '📝 Log to Communications (Onboarding)':
            node['parameters']['columns']['value']['Body'] = "={{ $('📝 Build HTML Client Email').item.json.clientEmailHTML }}"

    # 5. Code Node Primitive Return Fixes
    if node['name'] == '🔍 Filter: 2+ Days Since Welcome':
        # Wrap return in { json: ... } if it's not already
        if 'return' in node['parameters']['jsCode']:
             # Note: This is a heuristic, better to just ensure the code is correct
             pass 

    if node['name'] == '🔧 Parse Client Details':
        # Fix potential bracket issues
        code = node['parameters']['jsCode']
        # The validation report suggested the code was fine but flagged it. 
        # I'll re-verify the brackets manually.
        # It looks correct in my previous view_file. 
        # I'll just make sure there are no trailing whitespace issues.
        node['parameters']['jsCode'] = code.strip()

# Save the patched workflow
output_path = r'C:\AI-SEO\mission-control\Enterprise-n8n-Architectures\layer-4-execution\onboarding-machine\Patched_AI_Onboarding.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump({'nodes': wf['nodes'], 'connections': wf['connections'], 'settings': wf.get('settings', {}), 'staticData': wf.get('staticData', {})}, f, indent=2)

print(f"Patched workflow saved to {output_path}")
