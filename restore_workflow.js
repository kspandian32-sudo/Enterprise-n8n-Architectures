const fs = require('fs');

async function restore() {
  const payloadFile = 'C:/Users/ks_pa/.gemini/antigravity/brain/cd8eea7d-5dc7-4082-8071-753dc5e567a2/scratch/payload.json';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NWJiZmFjMy01MTk1LTQ4NDMtOTQzNS03OGRmZDBkOGYzNGYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4ODQxMjYwfQ.XizMVE5nblsFfiAawlYZqxzSNQyaBKuE5mRvIdiSFH4';
  const workflowId = 'wK18IwIA4ERn8xh9';
  const baseUrl = 'http://localhost:5678/api/v1/workflows/' + workflowId;

  const payload = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));

  // Clean settings
  const cleanSettings = {};
  if (payload.settings) {
      if (payload.settings.executionOrder) cleanSettings.executionOrder = payload.settings.executionOrder;
      if (payload.settings.errorWorkflow) cleanSettings.errorWorkflow = payload.settings.errorWorkflow;
      if (payload.settings.saveDataSuccessExecution) cleanSettings.saveDataSuccessExecution = payload.settings.saveDataSuccessExecution;
      if (payload.settings.saveDataErrorExecution) cleanSettings.saveDataErrorExecution = payload.settings.saveDataErrorExecution;
      if (payload.settings.saveManualExecutions) cleanSettings.saveManualExecutions = payload.settings.saveManualExecutions;
  }

  const body = {
    name: payload.name || '🤖 AI Influencer Factory v3 — Enterprise Edition (Plan B)',
    nodes: payload.nodes,
    connections: payload.connections,
    settings: cleanSettings
  };

  console.log('Pushing workflow ' + workflowId + ' to ' + baseUrl);
  
  try {
    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': apiKey
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (response.ok) {
      console.log('SUCCESS! Workflow restored.');
    } else {
      console.error('FAILED to restore workflow.');
      console.error(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('ERROR: ' + error.message);
  }
}

restore();
