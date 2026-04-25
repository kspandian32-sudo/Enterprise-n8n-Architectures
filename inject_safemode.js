/**
 * inject_safemode.js
 * Programmatically injects SAFE_MODE IF gates into n8n workflow JSON files.
 * 
 * Usage: node inject_safemode.js <workflow.json> <dangerousNodeName> [outputFile]
 * 
 * What it does:
 * 1. Finds all connections that TARGET the dangerous node
 * 2. Creates a new "Is SAFE_MODE?" IF node
 * 3. Creates a new "SIMULATED (Safe Mode)" NoOp node  
 * 4. Rewires: upstream → IF node → (false) → dangerous node
 *                                → (true)  → SIMULATED NoOp
 */

const fs = require('fs');
const crypto = require('crypto');

function injectSafeMode(filePath, dangerousNodeName, outputPath) {
  let raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  let data = JSON.parse(raw);
  
  // Handle API-wrapped JSON (has data.nodes) vs raw workflow (has nodes directly)
  let wf = data.nodes ? data : data.data ? data.data : data;
  if (!wf.nodes) {
    console.error('ERROR: Cannot find nodes array in workflow JSON');
    process.exit(1);
  }

  // Find the dangerous node
  const dangerousNode = wf.nodes.find(n => n.name === dangerousNodeName);
  if (!dangerousNode) {
    console.error(`ERROR: Node "${dangerousNodeName}" not found in workflow.`);
    console.log('Available nodes:', wf.nodes.map(n => n.name).join(', '));
    process.exit(1);
  }

  // Calculate position for the IF node (200px to the left of dangerous node)
  const dangerousPos = dangerousNode.position;
  const ifNodePos = [dangerousPos[0] - 200, dangerousPos[1]];
  const noOpPos = [dangerousPos[0], dangerousPos[1] + 150];

  // Generate unique IDs
  const ifNodeId = crypto.randomUUID();
  const noOpId = crypto.randomUUID();

  const safeModeSuffix = dangerousNodeName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  const ifNodeName = `Is SAFE_MODE? (${dangerousNodeName})`;
  const noOpName = `SIMULATED (${dangerousNodeName})`;

  // Create the IF node
  const ifNode = {
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "" },
        conditions: [
          {
            id: crypto.randomUUID(),
            leftValue: "={{ $env.SAFE_MODE }}",
            rightValue: "true",
            operator: {
              type: "string",
              operation: "equals"
            }
          }
        ],
        combinator: "and"
      },
      options: {}
    },
    id: ifNodeId,
    name: ifNodeName,
    type: "n8n-nodes-base.if",
    typeVersion: 2.2,
    position: ifNodePos,
    notes: "SAFE_MODE gate: When SAFE_MODE=true, skips the dangerous action and routes to a SIMULATED NoOp instead."
  };

  // Create the NoOp (do nothing) node
  const noOpNode = {
    parameters: {},
    id: noOpId,
    name: noOpName,
    type: "n8n-nodes-base.noOp",
    typeVersion: 1,
    position: noOpPos,
    notes: `SAFE_MODE: Simulated execution of "${dangerousNodeName}". No real action taken.`
  };

  // Add new nodes
  wf.nodes.push(ifNode);
  wf.nodes.push(noOpNode);

  // Shift dangerous node 200px to the right to make room
  dangerousNode.position = [dangerousPos[0] + 200, dangerousPos[1]];

  // Rewire connections: find all connections that point TO the dangerous node
  for (const [sourceName, conn] of Object.entries(wf.connections)) {
    if (!conn.main) continue;
    for (const outputArray of conn.main) {
      if (!outputArray) continue;
      for (let i = 0; i < outputArray.length; i++) {
        if (outputArray[i].node === dangerousNodeName) {
          // Redirect this connection to the IF node instead
          outputArray[i] = {
            node: ifNodeName,
            type: "main",
            index: 0
          };
        }
      }
    }
  }

  // Add new connections from IF node
  wf.connections[ifNodeName] = {
    main: [
      // Output 0 (true = SAFE_MODE is ON) → NoOp
      [{ node: noOpName, type: "main", index: 0 }],
      // Output 1 (false = SAFE_MODE is OFF) → Dangerous node (normal execution)
      [{ node: dangerousNodeName, type: "main", index: 0 }]
    ]
  };

  // Write the result
  const out = outputPath || filePath;
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Injected SAFE_MODE gate before "${dangerousNodeName}"`);
  console.log(`   IF node: "${ifNodeName}"`);
  console.log(`   NoOp:    "${noOpName}"`);
  console.log(`   Written: ${out}`);
}

// CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node inject_safemode.js <workflow.json> <dangerousNodeName> [outputFile]');
  process.exit(1);
}

injectSafeMode(args[0], args[1], args[2]);
