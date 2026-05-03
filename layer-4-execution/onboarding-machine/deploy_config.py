import json, os

wf_path = r"C:\Users\ks_pa\.gemini\antigravity\brain\43ec68f5-8a55-41f5-8805-04971a7e2053\.system_generated\steps\153\output.txt"
with open(wf_path, 'r', encoding='utf-8') as f:
    raw = json.load(f)

# The actual workflow data is in the 'data' key of the MCP response
wf = raw['data']

SHEET_ID = "16dAe64XCQ_iecfAlrrdG5n6TtJyr2cDrMmIN4Uv9xBU"
GIDS = {
    "Services": 0,
    "Summary": 1994705565,
    "Client_Projects_Tab": 755310524,
    "Communications": 847410064
}

SMTP_CRED_ID = "udtIzlJq8iqmL3Az"
SHEETS_CRED_ID = "hiWj9Xv9QRzG92Us"
GEMINI_CRED_ID = "1jdjTjj9aaTK6i6Y"

# Mapping node names to GID keys
SHEET_NODE_MAP = {
    "📥 Read Service from Database": "Services",
    "📊 Log Client Summary": "Summary",
    "📝 Log Deliverables Tracker": "Client_Projects_Tab",
    "📥 Fetch 'Welcome Email Sent' Clients": "Summary",
    "📝 Update CRM → Reminder Sent": "Summary",
    "📥 Fetch All Active Clients": "Summary",
    "📝 Log to Communications": "Communications"
}

EMAIL_NODES = [
    "📧 Send Onboarding Email to Client",
    "📧 Send Copy to Agency",
    "📧 Send Kickoff Reminder",
    "📧 Send Weekly Check-In"
]

AI_NODES = [
    "🤖 Gemini: Build Project Plan from SOPs",
    "🤖 Gemini: Write Follow-Up Email",
    "🤖 Gemini: Write Check-In Email"
]

for node in wf['nodes']:
    name = node['name']
    
    # 0. Enable retries for AI nodes to handle rate limits (429)
    if name in AI_NODES:
        node['retryOnFail'] = True
        node['maxTries'] = 5
        node['waitBetweenTries'] = 35000 # 35 seconds to clear free tier resets

    # 1. Update SMTP Nodes
    if name in EMAIL_NODES:
        # Convert Gmail node to EmailSend (SMTP) node
        old_params = node.get('parameters', {})
        node['type'] = "n8n-nodes-base.emailSend"
        node['typeVersion'] = 2.1
        
        # Map parameters dynamically based on node name
        target_to = old_params.get("sendTo", "")
        if name == "📧 Send Onboarding Email to Client":
            target_to = "={{ $json.clientEmail }}"
        elif name == "📧 Send Copy to Agency":
            target_to = "kspandian32@gmail.com"
        elif name in ["📧 Send Kickoff Reminder", "📧 Send Weekly Check-In"]:
            target_to = "={{ $json.clientEmail }}"
            
        new_params = {
            "fromEmail": "kspandian32@gmail.com",
            "toEmail": target_to,
            "subject": old_params.get("subject", ""),
            "html": old_params.get("message", ""),
            "options": old_params.get("options", {})
        }
        
        # Clean up options for SMTP node compatibility
        if "appendAttribution" in new_params["options"]:
            del new_params["options"]["appendAttribution"]
            
        node['parameters'] = new_params
        node['credentials'] = {
            "smtp": {
                "id": SMTP_CRED_ID,
                "name": "SMTP account - kspandian32"
            }
        }

    # 2. Update Google Sheets Nodes
    elif name in SHEET_NODE_MAP:
        gid_key = SHEET_NODE_MAP[name]
        gid = GIDS[gid_key]
        
        # Update Document ID and Sheet GID
        node['parameters']['documentId'] = {
            "__rl": True,
            "value": SHEET_ID,
            "mode": "id"
        }
        node['parameters']['sheetName'] = {
            "__rl": True,
            "value": gid,
            "mode": "id"
        }
        
        # 2a. Clean up empty Filters (Fixes: The column "" could not be found)
        if 'filtersUI' in node['parameters']:
            ff = node['parameters']['filtersUI']
            if isinstance(ff, dict) and 'values' in ff:
                # Remove empty filter objects
                ff['values'] = [v for v in ff['values'] if v]
                # If values is now empty, set filtersUI to empty dict
                if not ff['values']:
                    node['parameters']['filtersUI'] = {}
        
        # 2b. Add Status filter for the 'Fetch Welcome Email Sent' node
        if name == "📥 Fetch 'Welcome Email Sent' Clients":
            node['parameters']['filtersUI'] = {
                "values": [
                    {
                        "lookupColumn": "Status",
                        "lookupValue": "Welcome Email Sent"
                    }
                ]
            }
            
        # 2b-2. Add Status filter for the 'Fetch All Active Clients' node
        if name == "📥 Fetch All Active Clients":
            node['parameters']['filtersUI'] = {
                "values": [
                    {
                        "lookupColumn": "Status",
                        "lookupValue": "Active"
                    }
                ]
            }
        
        # 2c. Add filter for the 'Read Service' node
        if name == "📥 Read Service from Database":
            node['parameters']['filtersUI'] = {
                "values": [
                    {
                        "lookupColumn": "Service Name",
                        "lookupValue": "={{ $node[\"🔧 Parse Client Details\"].json[\"serviceRequired\"] }}"
                    }
                ]
            }
        
        # Force ID mode for GIDs
        if 'parameters' in node:
            if 'sheetName' in node['parameters'] and isinstance(node['parameters']['sheetName'], dict):
                 node['parameters']['sheetName']['mode'] = 'id'
            
            # CLEAR Status filters (this fixes #5418)
            if name == "📥 Fetch All Active Clients":
                node['parameters']['filtersUI'] = {}
            
            # SET matching columns for Update operations (fixes #5422 & #5431)
            if name == "📝 Update CRM → Reminder Sent":
                node['parameters']['columns'] = {
                    "mappingMode": "defineBelow",
                    "matchingColumns": ["row_number"],
                    "value": {
                        "Status": "Reminder Sent",
                        "row_number": "={{ $('🔀 Parse Follow-Up Email').item.json.row_number }}"
                    }
                }
            
            # FIX absolute references for Log to Communications (fixes Flow C data loss)
            if name == "📝 Log to Communications":
                if 'columns' not in node['parameters']:
                    node['parameters']['columns'] = {}
                node['parameters']['columns']['mappingMode'] = "defineBelow"
                node['parameters']['columns']['value'] = {
                    "Date": "={{ new Date().toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) }}",
                    "Client": "={{ $('🔀 Parse Check-In Email').item.json.clientName + ' (' + $('🔀 Parse Check-In Email').item.json.clientCompany + ')' }}",
                    "Type": "Weekly Check-In",
                    "Week #": "={{ $('🔢 Calculate Week Number').item.json.weekNumber }}",
                    "Subject": "={{ $('🔀 Parse Check-In Email').item.json.checkinSubject }}",
                    "Sent To": "={{ $('🔀 Parse Check-In Email').item.json.clientEmail }}",
                    "Status": "Sent"
                }
                # Inject missing schema for Google Sheets append operation
                node['parameters']['columns']['schema'] = [
                    {"id": k, "displayName": k, "required": False, "defaultMatch": False, "display": True, "type": "string", "canBeUsedToMatch": True}
                    for k in ["Date", "Client", "Type", "Week #", "Subject", "Sent To", "Status"]
                ]

    # 3. Update AI/Gemini Nodes
    elif name in AI_NODES:
        node['credentials'] = {
            "httpQueryAuth": {
                "id": GEMINI_CRED_ID,
                "name": "Query Auth Gemini kspandian32"
            }
        }
        # Upgrade ALL models to gemini-2.5-flash (gemini-2.0-flash is DEPRECATED, limit=0)
        if 'parameters' in node and 'url' in node['parameters']:
            # Normalize to v1beta endpoint
            node['parameters']['url'] = node['parameters']['url'].replace('/v1/', '/v1beta/')
            # Replace any deprecated model with gemini-2.5-flash
            for old_model in ['gemini-2.0-flash', 'gemini-1.5-flash']:
                node['parameters']['url'] = node['parameters']['url'].replace(old_model, 'gemini-2.5-flash')
            
        # Increase maxOutputTokens to prevent truncation
        if 'parameters' in node and 'jsonBody' in node['parameters']:
             node['parameters']['jsonBody'] = node['parameters']['jsonBody'].replace("maxOutputTokens: 500", "maxOutputTokens: 2048")

        # Fix expressions in prompt (match Guide headers) and increase tokens to 8192 to prevent truncation
        if name == "🤖 Gemini: Write Follow-Up Email":
            node['parameters']['jsonBody'] = "={{ JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'You are a professional project manager named ' + $json.yourName + ' from ' + $json.agencyName + '. Write a warm, gentle follow-up email to schedule a kickoff call. Client name: ' + $json.clientName + '. Company: ' + $json.clientCompany + '. Project: ' + $json.serviceRequired + '. Current date: ' + new Date().toDateString() + '. Suggest 3 specific time slots (including dates) for a 30-min kickoff call starting from tomorrow. Keep it under 100 words, professional but friendly. Return ONLY valid JSON: {\"subject\": \"email subject\", \"body\": \"email body\"}. No markdown, no backticks. Sign off as ' + $json.yourName + '.' }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }) }}"
        elif name == "🤖 Gemini: Write Check-In Email":
             node['parameters']['jsonBody'] = "={{ JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'You are a professional project manager named ' + $json.yourName + ' from ' + $json.agencyName + '. Write a weekly check-in email. Client: ' + $json.clientName + '. Company: ' + $json.clientCompany + '. Project: ' + $json.serviceRequired + '. Scope: ' + JSON.parse($json.service).description + '. Week number: ' + $json.weekNumber + '. Project duration: ' + JSON.parse($json.service).defaultTimeline + '. Write a professional, warm weekly check-in email that: greets the client by name, mentions it is week ' + $json.weekNumber + ', provides a brief progress update placeholder, lists upcoming milestones for next week, asks if they have any questions or blockers, keeps it under 120 words. Return ONLY valid JSON: {\"subject\": \"email subject mentioning week number\", \"body\": \"email body\"}. No markdown, no backticks. Sign off as ' + $json.yourName + '.' }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }) }}"

    # 4. Add "Desired Start Date" to Form and Update Parse node
    elif name == "📋 New Client Form":
        # Check if the field is already there
        ff_container = node['parameters'].get('formFields', {})
        fields = ff_container.get('values', [])
        if not any(f.get('fieldLabel') == 'Desired Start Date' for f in fields):
            # Find insertion point (after Agreed Budget)
            idx = next((i for i, f in enumerate(fields) if 'Budget' in f.get('fieldLabel', '')), len(fields) - 1)
            fields.insert(idx + 1, {
                "fieldLabel": "Desired Start Date",
                "fieldType": "string",
                "placeholder": "e.g. 15 May 2026",
                "requiredField": True
            })
            node['parameters']['formFields'] = {"values": fields}

    elif name == "🔧 Parse Client Details":
        # Update JS code to use the new field
        node['parameters']['jsCode'] = "const f = $input.first().json;\nreturn [{ json: {\n  clientName: (f['Client Full Name'] || '').trim(),\n  clientCompany: (f['Client Company Name'] || '').trim(),\n  clientEmail: (f['Client Email'] || '').trim(),\n  serviceRequired: (f['Service Required'] || '').trim(),\n  clientRequirements: (f['Client Specific Requirements'] || '').trim(),\n  budget: (f['Agreed Budget (INR)'] || '').trim(),\n  startDate: (f['Desired Start Date'] || new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })).trim(),\n  agencyName: (f['Your Agency Name'] || '').trim(),\n  yourName: (f['Your Name'] || '').trim(),\n  yourEmail: (f['Your Email'] || '').trim(),\n  timestamp: new Date().toISOString()\n}}];"

    elif name == "📊 Log Client Summary":
        # Update column mapping to match EXACT Guide headers (Step 1, Tab 2)
        if 'columns' not in node['parameters']:
            node['parameters']['columns'] = {}
        node['parameters']['columns']['mappingMode'] = "defineBelow"
        node['parameters']['columns']['value'] = {
            "clientName": "={{ $json.clientName }}",
            "clientCompany": "={{ $json.clientCompany }}",
            "clientEmail": "={{ $json.clientEmail }}",
            "serviceRequired": "={{ $json.serviceRequired }}",
            "clientRequirements": "={{ $json.clientRequirements }}",
            "budget": "={{ $json.budget }}",
            "agencyName": "={{ $json.agencyName }}",
            "yourName": "={{ $json.yourName }}",
            "yourEmail": "={{ $json.yourEmail }}",
            "startDate": "={{ $json.startDate }}",
            "timestamp": "={{ $json.timestamp }}",
            "service": "={{ JSON.stringify($json.service) }}",
            "plan": "={{ JSON.stringify($json.plan) }}"
        }

    elif name == "🔍 Filter: 2+ Days Since Welcome":
        # Use 'timestamp' column as defined in the Guide
        node['parameters']['jsCode'] = "// Filter: only clients where 2+ days have passed since onboarding\nconst items = $input.all();\nconst now = Date.now();\nconst TWO_DAYS = 2 * 24 * 60 * 60 * 1000;\n\nconst due = items.filter(item => {\n  const onboardedAt = item.json['timestamp'];\n  if (!onboardedAt) return false;\n  return (now - new Date(onboardedAt).getTime()) >= TWO_DAYS;\n});\n\nif (due.length === 0) return [];\nreturn due;"

# 5. Inject Wait Nodes for Rate Limit Protection
wait_followup = {
    "parameters": {"amount": 10, "unit": "seconds"},
    "id": "wait-followup-id",
    "name": "Wait (10s) - Follow-Up",
    "type": "n8n-nodes-base.wait",
    "typeVersion": 1,
    "position": [-832, 832]
}
wait_checkin = {
    "parameters": {"amount": 10, "unit": "seconds"},
    "id": "wait-checkin-id",
    "name": "Wait (10s) - Check-In",
    "type": "n8n-nodes-base.wait",
    "typeVersion": 1,
    "position": [-832, 1056]
}

# Add nodes if not exist
if not any(n['name'] == wait_followup['name'] for n in wf['nodes']):
    wf['nodes'].append(wait_followup)
if not any(n['name'] == wait_checkin['name'] for n in wf['nodes']):
    wf['nodes'].append(wait_checkin)

# Update connections for Flow B
# Filter -> Wait -> Gemini
if "🔍 Filter: 2+ Days Since Welcome" in wf['connections']:
    conns = wf['connections']["🔍 Filter: 2+ Days Since Welcome"]["main"][0]
    # Find connection to Gemini and replace with Wait
    for i, c in enumerate(conns):
        if c['node'] == "🤖 Gemini: Write Follow-Up Email":
            conns[i] = {"node": "Wait (10s) - Follow-Up", "type": "main", "index": 0}

if "Wait (10s) - Follow-Up" not in wf['connections']:
    wf['connections']["Wait (10s) - Follow-Up"] = {
        "main": [[{"node": "🤖 Gemini: Write Follow-Up Email", "type": "main", "index": 0}]]
    }

# Update connections for Flow C
# Calculate Week Number -> Wait -> Gemini
if "🔢 Calculate Week Number" in wf['connections']:
    conns = wf['connections']["🔢 Calculate Week Number"]["main"][0]
    for i, c in enumerate(conns):
        if c['node'] == "🤖 Gemini: Write Check-In Email":
            conns[i] = {"node": "Wait (10s) - Check-In", "type": "main", "index": 0}

if "Wait (10s) - Check-In" not in wf['connections']:
    wf['connections']["Wait (10s) - Check-In"] = {
        "main": [[{"node": "🤖 Gemini: Write Check-In Email", "type": "main", "index": 0}]]
    }

# 6. Global Mapping Audit & Fix
# This replaces old snake_case or Spaced Keys with the Guide's camelCase keys
mapping_replacements = {
    "$json['Client Name']": "$json.clientName",
    "$json['Company']": "$json.clientCompany",
    "$json['Client Email']": "$json.clientEmail",
    "$json['Project Type']": "$json.serviceRequired",
    "$json['Onboarded At']": "$json.timestamp",
    "$json['Scope']": "$json.serviceRequired", # In some nodes Scope = Service
    "$json['Duration']": "JSON.parse($json.service).defaultTimeline",
}

def deep_replace_keys(obj):
    if isinstance(obj, str):
        for old, new in mapping_replacements.items():
            if old in obj:
                obj = obj.replace(old, new)
        return obj
    elif isinstance(obj, list):
        return [deep_replace_keys(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: deep_replace_keys(v) for k, v in obj.items()}
    return obj

for node in wf['nodes']:
    # Specially fix the Calculate Week Number JS code
    if "Calculate Week Number" in node['name']:
        node['parameters']['jsCode'] = node['parameters']['jsCode'].replace("item.json['Onboarded At']", "item.json['timestamp']")
    
    # FIX PARSE NODES TO PROCESS ALL ITEMS (Not just .first())
    if "Parse Follow-Up Email" in node['name']:
        node['parameters']['jsCode'] = """const aiResps = $input.all();
const clients = $('🔍 Filter: 2+ Days Since Welcome').all();
return aiResps.map((aiResp, i) => {
  const client = clients[i]?.json || {};
  let email = {};
  try {
    const raw = aiResp.json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    email = JSON.parse(raw.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim());
  } catch (e) {
    email = {
      subject: `Quick follow-up — Scheduling our kickoff call for ${client['serviceRequired']}`,
      body: `Hi ${client['clientName']},\\n\\nHope you're doing well! Just following up on my welcome email from a couple of days ago. We're excited to get started on the ${client['serviceRequired']} project for ${client['clientCompany']}.\\n\\nWould any of these times work for a 30-minute kickoff call?\\n- Tomorrow at 11 AM IST\\n- Tomorrow at 3 PM IST\\n- Day after at 10 AM IST\\n\\nLooking forward to kicking things off!\\n\\nBest regards`
    };
  }
  const formattedBody = (email.body || '').replace(/\\n/g, '<br>') + `<br><div style="display:none!important">Ref ID: ${client.row_number}</div>`;
  return { json: { ...client, followUpSubject: email.subject, followUpBody: formattedBody } };
});"""
    if "Parse Check-In Email" in node['name']:
        node['parameters']['jsCode'] = """const aiResps = $input.all();
const clients = $('🔢 Calculate Week Number').all();
return aiResps.map((aiResp, i) => {
  const client = clients[i]?.json || {};
  let email = {};
  try {
    const raw = aiResp.json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    email = JSON.parse(raw.replace(/```json\\n?/g, '').replace(/```\\n?/g, '').trim());
  } catch (e) {
    email = {
      subject: `Week ${client.weekNumber} Check-In — ${client['serviceRequired']} for ${client['clientCompany']}`,
      body: `Hi ${client['clientName']},\\n\\nHappy Monday! Here's your Week ${client.weekNumber} update on the ${client['serviceRequired']} project.\\n\\nThis week's focus:\\n- Continuing development on core features\\n- Review session scheduled midweek\\n\\nDo you have any questions or concerns? Happy to hop on a quick call anytime.\\n\\nBest regards`
    };
  }
  const formattedBody = (email.body || '').replace(/\\n/g, '<br>') + `<br><div style="display:none!important">Ref ID: ${client.row_number}</div>`;
  return { json: { ...client, checkinSubject: email.subject, checkinBody: formattedBody } };
});"""

    # Apply global replacements to all parameters
    if 'parameters' in node:
        node['parameters'] = deep_replace_keys(node['parameters'])

# 7. Inject Resiliency Standard Nodes (v7.6 compliance)

safe_mode_onboarding = {
    "parameters": {
        "conditions": {
            "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 2},
            "conditions": [{
                "id": "safe-mode-cond",
                "leftValue": "={{$env.SAFE_MODE}}",
                "operator": {"type": "string", "operation": "equals"},
                "rightValue": "true"
            }],
            "combinator": "and"
        }
    },
    "id": "safe-mode-onboarding-id",
    "name": "🛡️ IF: Safe Mode? (Onboarding)",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2.2,
    "position": [448, -128]
}

safe_mode_followup = {
    "parameters": {
        "conditions": {
            "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 2},
            "conditions": [{
                "id": "safe-mode-cond",
                "leftValue": "={{$env.SAFE_MODE}}",
                "operator": {"type": "string", "operation": "equals"},
                "rightValue": "true"
            }],
            "combinator": "and"
        }
    },
    "id": "safe-mode-followup-id",
    "name": "🛡️ IF: Safe Mode? (Follow-Up)",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2.2,
    "position": [-384, 832]
}

safe_mode_checkin = {
    "parameters": {
        "conditions": {
            "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 2},
            "conditions": [{
                "id": "safe-mode-cond",
                "leftValue": "={{$env.SAFE_MODE}}",
                "operator": {"type": "string", "operation": "equals"},
                "rightValue": "true"
            }],
            "combinator": "and"
        }
    },
    "id": "safe-mode-checkin-id",
    "name": "🛡️ IF: Safe Mode? (Check-In)",
    "type": "n8n-nodes-base.if",
    "typeVersion": 2.2,
    "position": [-384, 1056]
}

error_trigger = {
    "parameters": {},
    "id": "error-trigger-id",
    "name": "Error Trigger",
    "type": "n8n-nodes-base.errorTrigger",
    "typeVersion": 1,
    "position": [-1200, 1500]
}

log_drain_execute = {
    "parameters": {
        "workflowId": "FEK7PNwR6I3XZygD",
        "mode": "parameter",
        "parameters": {
            "workflow_name": "AI Client Onboarding Machine",
            "level": "error",
            "message": "={{ $json.error.message }}",
            "tool_name": "={{ $json.node.name }}",
            "metadata": "={{ JSON.stringify({ execution_id: $execution.id, error_stack: $json.error.stack }) }}"
        }
    },
    "id": "log-drain-id",
    "name": "Log to Unified Drain",
    "type": "n8n-nodes-base.executeWorkflow",
    "typeVersion": 1.1,
    "position": [-1000, 1500]
}

# Add resiliency nodes if not exist
resiliency_nodes = [safe_mode_onboarding, safe_mode_followup, safe_mode_checkin, error_trigger, log_drain_execute]
for r_node in resiliency_nodes:
    if not any(n['name'] == r_node['name'] for n in wf['nodes']):
        wf['nodes'].append(r_node)

# 8. Rewire Resiliency Connections
conn = wf.get('connections', {})

# Flow A Rewire: Client Summary -> Safe Mode -> Email
if "📊 Log Client Summary" in conn:
    # Onboarding copy
    conn["📊 Log Client Summary"]["main"][0] = [{"node": "🛡️ IF: Safe Mode? (Onboarding)", "type": "main", "index": 0}]

conn["🛡️ IF: Safe Mode? (Onboarding)"] = {
    "main": [
        [], # True (Safe Mode) -> Do nothing
        [{"node": "📧 Send Onboarding Email to Client", "type": "main", "index": 0}] # False -> Send
    ]
}

# Flow B Rewire: Parse Follow-Up -> Safe Mode -> Email
if "🔀 Parse Follow-Up Email" in conn:
    conn["🔀 Parse Follow-Up Email"]["main"][0] = [
        {"node": "🛡️ IF: Safe Mode? (Follow-Up)", "type": "main", "index": 0},
        {"node": "📝 Update CRM → Reminder Sent", "type": "main", "index": 0}
    ]

conn["🛡️ IF: Safe Mode? (Follow-Up)"] = {
    "main": [
        [], # True -> Do nothing
        [{"node": "📧 Send Kickoff Reminder", "type": "main", "index": 0}] # False -> Send
    ]
}

# Flow C Rewire: Parse Check-In -> Safe Mode -> Email
if "🔀 Parse Check-In Email" in conn:
    conn["🔀 Parse Check-In Email"]["main"][0] = [
        {"node": "🛡️ IF: Safe Mode? (Check-In)", "type": "main", "index": 0},
        {"node": "📝 Log to Communications", "type": "main", "index": 0}
    ]

conn["🛡️ IF: Safe Mode? (Check-In)"] = {
    "main": [
        [], # True -> Do nothing
        [{"node": "📧 Send Weekly Check-In", "type": "main", "index": 0}] # False -> Send
    ]
}

# Log-Drain Wire
conn["Error Trigger"] = {
    "main": [[{"node": "Log to Unified Drain", "type": "main", "index": 0}]]
}

wf['connections'] = conn

# Save updated workflow
output_path = r"C:\AI-SEO\mission-control\WEEK_10_SUBMISSION\Updated_AI_Onboarding_Resilient.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(wf, f, indent=2)

print(f"SUCCESS: Resilient workflow saved to {output_path}")
