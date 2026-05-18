const fs = require('fs');

const path = 'c:/AI-SEO/mission-control/Enterprise-n8n-Architectures/Signal-Pipeline/Scanner.json';
let raw = fs.readFileSync(path, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) {
  raw = raw.slice(1);
}
const data = JSON.parse(raw);

// 1. Create the new "Get Dynamic Threshold" node
const readConfigNode = {
  "parameters": {
    "authentication": "serviceAccount",
    "operation": "read",
    "documentId": { "mode": "id", "value": "171oeM44bH3FyBHOvzS-icqR11QnSXkpxgsxMokCbrKE" },
    "sheetName": { "mode": "name", "value": "Config" }
  },
  "id": "ead9bdca-1111-2222-3333-8c4d29e46a78",
  "name": "Get Dynamic Threshold",
  "type": "n8n-nodes-base.googleSheets",
  "typeVersion": 4.5,
  "position": [ 200, 0 ], // Offset between 0 and 240
  "credentials": { "googleApi": { "id": "REPLACE_WITH_YOUR_CREDENTIAL_ID", "name": "Google Service Account" } }
};

// 2. Add it to nodes
data.data.nodes.push(readConfigNode);

// 3. Shift position of all nodes currently at x>=240 to make room
data.data.nodes.forEach(n => {
  if (n.name !== 'Every 6 Hours' && n.name !== 'Get Dynamic Threshold') {
    n.position[0] += 200;
  }
});

// 4. Update Connections
data.data.connections["Every 6 Hours"]["main"][0] = [
  { "node": "Get Dynamic Threshold", "type": "main", "index": 0 }
];

data.data.connections["Get Dynamic Threshold"] = {
  "main": [
    [
      { "node": "Select Search Query", "type": "main", "index": 0 }
    ]
  ]
};

// 5. Modify JS code in "Build Hot Alert Summary" to use dynamic threshold
const hotAlertNode = data.data.nodes.find(n => n.name === 'Build Hot Alert Summary');

let jsCode = hotAlertNode.parameters.jsCode;

const injection = `
// Read dynamic threshold from Config sheet
let threshold = 7.5; // fallback
try {
  const configItems = $('Get Dynamic Threshold').all();
  for (const c of configItems) {
    if (c.json['Configuration Key'] === 'Confidence Threshold') {
      let val = parseFloat(c.json['Configuration Value']) || 7.5;
      if (val < 1) val = val * 10; // Normalize 0.75 to 7.5
      threshold = val;
    }
  }
} catch(e) {
  // Use fallback if missing
}

const hotLeads = items.filter(item => (Number(item.json.automation_score) || 0) >= threshold);
`;

jsCode = jsCode.replace(
  "const hotLeads = items.filter(item => (Number(item.json.automation_score) || 0) >= 8);",
  injection
);

hotAlertNode.parameters.jsCode = jsCode;

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Scanner.json updated successfully!');
