const fs = require('fs');

const dataStr = fs.readFileSync('C:\\Users\\ks_pa\\.gemini\\antigravity\\brain\\bb92a3ac-7a69-4d04-a1dd-41ab073cefa7\\.system_generated\\steps\\124\\output.txt', 'utf8');
const wfData = JSON.parse(dataStr);
const wf = wfData.data || wfData;

// Get the nodes array and connections object
let nodes = wf.nodes;
let conns = wf.connections;

// 1. Fix the double connection from 🔧 Parse Brief1
if (conns['🔧 Parse Brief1'] && conns['🔧 Parse Brief1'].main && conns['🔧 Parse Brief1'].main[0]) {
    conns['🔧 Parse Brief1'].main[0] = conns['🔧 Parse Brief1'].main[0].filter(c => c.node !== '🤖 AI: Character Sheet');
}

// 2. Add the new nodes for the Ideogram branch, Approval Gate, and Telegram
const newNodes = [
    {
        "id": "split-in-batches-1",
        "name": "🖼️ SplitInBatches",
        "type": "n8n-nodes-base.splitInBatches",
        "typeVersion": 3,
        "position": [496, 192],
        "parameters": {
            "batchSize": 1,
            "options": {}
        }
    },
    {
        "id": "http-ideogram",
        "name": "🖼️ HTTP: Ideogram API",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.1,
        "position": [720, 192],
        "parameters": {
            "method": "POST",
            "url": "https://api.ideogram.ai/generate",
            "sendHeaders": true,
            "headerParameters": {
                "parameters": [
                    {
                        "name": "Api-Key",
                        "value": "idxx-demo-key-12345"
                    },
                    {
                        "name": "Content-Type",
                        "value": "application/json"
                    }
                ]
            },
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={\n  \"image_request\": {\n    \"prompt\": \"{{ $json['Ideogram Prompt'] }}\",\n    \"aspect_ratio\": \"ASPECT_4_5\",\n    \"model\": \"V_2\",\n    \"magic_prompt_option\": \"AUTO\"\n  }\n}",
            "options": {}
        }
    },
    {
        "id": "wait-node-1",
        "name": "⏳ Wait 2s",
        "type": "n8n-nodes-base.wait",
        "typeVersion": 1,
        "position": [944, 192],
        "parameters": {
            "amount": 2,
            "unit": "seconds"
        }
    },
    {
        "id": "update-image-urls",
        "name": "📊 Update Image URLs",
        "type": "n8n-nodes-base.googleSheets",
        "typeVersion": 4.5,
        "position": [1168, 192],
        "parameters": {
            "operation": "update",
            "documentId": {
                "__rl": true,
                "value": "1nWPhDgqvHYYCnhHgnunsyHXP4rHwW7eJ_rMQWjiMn0o",
                "mode": "list"
            },
            "sheetName": {
                "__rl": true,
                "value": 778604230,
                "mode": "list"
            },
            "columnToMatchOn": "Day",
            "valueToMatchOn": "={{ $('🖼️ SplitInBatches').item.json.Day }}",
            "columns": {
                "mappingMode": "defineBelow",
                "value": {
                    "Image Status": "Generated",
                    "Image URL": "={{ $json.data[0].url }}"
                }
            },
            "options": {}
        }
    },
    {
        "id": "preview-email",
        "name": "📧 Preview Email",
        "type": "n8n-nodes-base.gmail",
        "typeVersion": 2.1,
        "position": [272, 384],
        "parameters": {
            "sendTo": "={{ $json.email }}",
            "subject": "={{ 'ACTION REQUIRED: Review AI Influencer ' + $json.name }}",
            "message": "={{ $json.megaEmail + '\\n\\nAPPROVAL REQUIRED:\\n\\nTo Approve and finalise this content generation, click here:\\n' + $execution.resumeUrl + '?action=approve\\n\\nTo Reject and start over, click here:\\n' + $execution.resumeUrl + '?action=reject' }}",
            "options": {
                "appendAttribution": false
            }
        }
    },
    {
        "id": "await-approval",
        "name": "⏳ Webhook: Await Approval",
        "type": "n8n-nodes-base.wait",
        "typeVersion": 1,
        "position": [496, 384],
        "parameters": {
            "resume": "webhook",
            "webhookSuffix": "approval"
        },
        "webhookId": "approval-webhook-id"
    },
    {
        "id": "if-approved",
        "name": "🔀 IF: Approved?",
        "type": "n8n-nodes-base.if",
        "typeVersion": 1,
        "position": [720, 384],
        "parameters": {
            "conditions": {
                "string": [
                    {
                        "value1": "={{ $json.query.action }}",
                        "value2": "approve"
                    }
                ]
            }
        }
    },
    {
        "id": "telegram-summary",
        "name": "📱 Telegram: Summary",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.1,
        "position": [1168, 512],
        "parameters": {
            "method": "POST",
            "url": "https://api.telegram.org/bot7036643806:AAGy3xI9d7z7f11oD2k90D37xHl2pW531_o/sendMessage",
            "sendBody": true,
            "specifyBody": "json",
            "jsonBody": "={\n  \"chat_id\": \"6168937072\",\n  \"text\": \"✅ *AI INFLUENCER GENERATED*\\n\\n👤 Name: {{ $('🔧 Parse Brief1').item.json.name }}\\n📱 Handle: {{ $('🔧 Parse Brief1').item.json.handle }}\\n🎯 Niche: {{ $('🔧 Parse Brief1').item.json.niche }}\\n\\n✅ Character Sheet Generated\\n✅ 30-Day Calendar Generated\\n✅ 30 Ideogram Prompts Generated\\n✅ Carousels & Pitches Ready\\n✅ Human Approval Granted\",\n  \"parse_mode\": \"Markdown\"\n}",
            "options": {}
        }
    }
];

nodes = nodes.filter(n => n.name !== '📧 Send Complete Package1');
const sendPackageNode = {
    "id": "send-complete-package-1",
    "name": "📧 Send Complete Package1",
    "type": "n8n-nodes-base.gmail",
    "typeVersion": 2.1,
    "position": [944, 384],
    "parameters": {
        "sendTo": "={{ $('🔧 Parse Brief1').item.json.email }}",
        "subject": "={{ '✅ APPROVED: AI Influencer Ready: ' + $('🔧 Parse Brief1').item.json.name + ' — Character + 30-Day Calendar + Prompts + Pitches' }}",
        "message": "={{ $('📝 Compile Mega Email1').item.json.megaEmail }}",
        "options": {
            "appendAttribution": false
        }
    }
};
nodes.push(sendPackageNode);

for (const n of newNodes) {
    if (!nodes.find(existing => existing.name === n.name)) {
        nodes.push(n);
    }
}

// 3. Rebuild Connections
// Add Ideogram branch connections
if (!conns['📝 Log Calendar (1 Row Per Day)']) conns['📝 Log Calendar (1 Row Per Day)'] = { main: [[]] };
conns['📝 Log Calendar (1 Row Per Day)'].main[0] = [{ node: '🖼️ SplitInBatches', type: 'main', index: 0 }];

if (!conns['🖼️ SplitInBatches']) conns['🖼️ SplitInBatches'] = { main: [[], []] };
conns['🖼️ SplitInBatches'].main[0] = [{ node: '🖼️ HTTP: Ideogram API', type: 'main', index: 0 }];

if (!conns['🖼️ HTTP: Ideogram API']) conns['🖼️ HTTP: Ideogram API'] = { main: [[]] };
conns['🖼️ HTTP: Ideogram API'].main[0] = [{ node: '⏳ Wait 2s', type: 'main', index: 0 }];

if (!conns['⏳ Wait 2s']) conns['⏳ Wait 2s'] = { main: [[]] };
conns['⏳ Wait 2s'].main[0] = [{ node: '📊 Update Image URLs', type: 'main', index: 0 }];

if (!conns['📊 Update Image URLs']) conns['📊 Update Image URLs'] = { main: [[]] };
conns['📊 Update Image URLs'].main[0] = [{ node: '🖼️ SplitInBatches', type: 'main', index: 0 }];

// Add Approval Gate and Telegram connections
if (!conns['📝 Compile Mega Email1']) conns['📝 Compile Mega Email1'] = { main: [[]] };
conns['📝 Compile Mega Email1'].main[0] = [{ node: '📧 Preview Email', type: 'main', index: 0 }];

if (!conns['📧 Preview Email']) conns['📧 Preview Email'] = { main: [[]] };
conns['📧 Preview Email'].main[0] = [{ node: '⏳ Webhook: Await Approval', type: 'main', index: 0 }];

if (!conns['⏳ Webhook: Await Approval']) conns['⏳ Webhook: Await Approval'] = { main: [[]] };
conns['⏳ Webhook: Await Approval'].main[0] = [{ node: '🔀 IF: Approved?', type: 'main', index: 0 }];

if (!conns['🔀 IF: Approved?']) conns['🔀 IF: Approved?'] = { main: [[], []] };
conns['🔀 IF: Approved?'].main[0] = [
    { node: '📧 Send Complete Package1', type: 'main', index: 0 },
    { node: '📱 Telegram: Summary', type: 'main', index: 0 }
];

wf.nodes = nodes;
wf.connections = conns;
wf.name = "🤖 AI Influencer Factory v3 — Autonomous Content Engine";

fs.writeFileSync('C:\\AI-SEO\\mission-control\\modified_wf.json', JSON.stringify(wf, null, 2));
console.log('Modified workflow written to modified_wf.json');
