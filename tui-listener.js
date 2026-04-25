// ================================================================
// tui-listener.js — OpenClaw Bridge v2.4
// Pipeline: Next.js Dashboard (:3000) → Bridge (:11435) → OpenClaw (:18789)
//           Relay: OpenClaw reply → Convex ingest → Dashboard
// Send method: CLI spawn (node agent --session-id UUID --message --json)
// ================================================================

const http      = require('http');
const https     = require('https');
const WebSocket = require('ws');
const fs        = require('fs');
const path      = require('path');
const { spawn } = require('child_process');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');
    if (key && value) process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
  });
  console.log('✓ [CONFIG] .env.local loaded');
}

// ── Constants ────────────────────────────────────────────────────
const CONVEX_INGEST_URL = process.env.CONVEX_INGEST_URL || 'https://uncommon-gopher-162.convex.site/ingest-log';

// UUID from: node dist/entry.js sessions   Key: agent:main:main
const SESSION_UUID    = process.env.OPENCLAW_SESSION_UUID || '14a51614-b755-481d-8613-3875eb763d84';
const SESSION_KEY     = process.env.OPENCLAW_SESSION_ID
                     || process.env.MOLTBOT_SESSION_ID
                     || 'agent:main:main';
const BRIDGE_PORT     = parseInt(process.env.BRIDGE_PORT || '11435', 10);
const GW_AUTH_TOKEN   = process.env.OPENCLAW_OPERATOR_TOKEN
                     || process.env.OPENCLAW_GATEWAY_TOKEN
                     || '12dda63cb94473f5131cde2fd12bf72b6e7f38d195ead025';

// FIX: use 127.0.0.1 (IPv4) instead of localhost (resolves to ::1/IPv6 on Windows 11)
const GW_URL          = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';

const OPENCLAW_BIN    = process.env.OPENCLAW_BIN || 'C:\\AI-SEO\\openclaw-src\\dist\\entry.js';
const RECONNECT_DELAY = 5000;
const AGENT_TIMEOUT   = 55000;

// ── State ────────────────────────────────────────────────────────
let openclawWs   = null;
let isConnected  = false;
const processedEventIds = new Set();
const MAX_DEDUP_SIZE    = 500;

// ── Convex Relay ─────────────────────────────────────────────────
function relayToConvex(body, author = 'Pi-TUI', status = 'success', requestId = null) {
  const cleanBody = body.replace(/<\/?think>/gi, '').trim();
  if (!cleanBody) return;
  console.log(`✓ [RELAY] Convex ← ${cleanBody.substring(0, 60)}...`);

  const url     = new URL(CONVEX_INGEST_URL);
  const payload = { body: cleanBody, author, status };
  if (requestId) payload.requestId = requestId;

  const req = https.request({
    hostname: url.hostname,
    path:     url.pathname,
    method:   'POST',
    headers:  { 'Content-Type': 'application/json' }
  }, res => {
    res.resume();
    res.on('end', () => {
      if (res.statusCode === 200) console.log('✓ [RELAY] Convex accepted');
      else console.warn(`✗ [RELAY] Convex returned HTTP ${res.statusCode}`);
    });
  });
  req.on('error', e => console.error('✗ [RELAY] Error:', e.message));
  req.write(JSON.stringify(payload));
  req.end();
}

// ── Extract Reply From JSON ───────────────────────────────────────
function extractReply(raw) {
  try {
    const json     = JSON.parse(raw);
    const payloads = json?.result?.payloads;
    if (payloads && payloads.length > 0) {
      const combined = payloads
        .map(p => p.text)
        .filter(Boolean)
        .join('\n')
        .trim();
      if (combined) return combined;
    }
    return json?.reply
        || json?.content
        || json?.text
        || json?.message?.content?.[0]?.text
        || raw;
  } catch {
    return raw;
  }
}

// ── Send Message to Pi via CLI spawn ─────────────────────────────
function sendToPiViaCLI(userMsg, reqId) {
  console.log(`✓ [CLI] Spawning agent for: ${userMsg.substring(0, 60)}`);

  const proc = spawn('node', [
    OPENCLAW_BIN,
    'agent',
    '--session-id', SESSION_UUID,
    '--message',    userMsg,
    '--json'
  ], { shell: false });

  let fullReply = '';
  let timedOut  = false;

  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill();
    console.warn('✗ [CLI] Agent timed out after 55s');
    relayToConvex('Pi did not respond in time. Please try again.', 'Pi-TUI', 'error', reqId);
  }, AGENT_TIMEOUT);

  proc.stdout.on('data', d => { fullReply += d.toString(); });

  proc.on('close', code => {
    clearTimeout(timer);
    if (timedOut) return;
    const raw = fullReply.trim();
    if (!raw) {
      console.warn(`✗ [CLI] No reply from agent (exit code ${code})`);
      relayToConvex('Pi returned an empty response.', 'Pi-TUI', 'error', reqId);
      return;
    }
    const reply = extractReply(raw);
    console.log(`✓ [CLI] Pi replied: ${reply.substring(0, 80)}`);
    relayToConvex(reply, 'Pi-TUI', 'success', reqId);
  });

  proc.stderr.on('data', d => {
    const e = d.toString().trim();
    if (e && !e.includes('tick')    && !e.includes('health') &&
        !e.includes('OpenClaw')     && !e.includes('🦞') &&
        !e.includes('Siri')         && !e.includes('competent') &&
        !e.includes('UNIX')) {
      console.error('✗ [CLI ERR]', e);
    }
  });
}

// ── OpenClaw WebSocket Bridge (receive-only) ──────────────────────
function startOpenClawBridge() {
  console.log(`✓ [BRIDGE] Connecting to OpenClaw → ${GW_URL}`);
  openclawWs = new WebSocket(GW_URL, { headers: { Origin: 'http://127.0.0.1:18789' } });

  openclawWs.on('open', () => {
    console.log('✓ [BRIDGE] Socket open — sending handshake...');
    openclawWs.send(JSON.stringify({
      type:   'req',
      id:     `handshake-${Date.now()}`,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'gateway-client', mode: 'backend', platform: 'nodejs', version: '2.4.0' },
        auth:   { token: GW_AUTH_TOKEN, deviceId: '8c445f8cf0ef4a4f0ddaf09c1d4f72cb1bfbc8f807484335d22da24fb9a0018c' }
      }
    }));
  });

  openclawWs.on('message', data => {
    try {
      const frame = JSON.parse(data.toString());

      // Handshake response
      if (frame.id && frame.id.startsWith('handshake-')) {
        if (frame.error) {
          console.error('✗ [BRIDGE] Handshake REJECTED:', JSON.stringify(frame.error));
        } else {
          isConnected = true;
          console.log('✓ [BRIDGE] Handshake ACCEPTED — listening for Pi replies');
        }
        return;
      }

      // Silently skip noisy frames
      if (frame.event === 'tick'     ||
          frame.event === 'health'   ||
          frame.event === 'presence' ||
          frame.event === 'agent') return;

      console.log(`[FRAME] event=${frame.event} state=${frame.payload?.state} full=${JSON.stringify(frame)}`);

      // Capture Pi chat replies via WebSocket (backup/bonus channel)
      if (frame.event === 'chat' && frame.payload?.state === 'final') {
        const content = frame.payload?.message?.content?.[0]?.text;
        const runId   = frame.payload?.runId || frame.id;

        if (runId && processedEventIds.has(runId)) {
          console.log(`[DEDUP] Skipped duplicate runId ${runId}`);
          return;
        }
        if (runId) {
          processedEventIds.add(runId);
          if (processedEventIds.size > MAX_DEDUP_SIZE) {
            processedEventIds.delete(processedEventIds.values().next().value);
          }
        }
        if (content) {
          console.log(`✓ [CAPTURE] Pi WS: ${content.substring(0, 80)}`);
          relayToConvex(content, 'Pi-TUI', 'success', runId);
        }
      }
    } catch (err) {
      console.error('[FRAME] Parse error:', err.message);
    }
  });

  openclawWs.on('close', code => {
    isConnected = false;
    console.warn(`✗ [BRIDGE] Disconnected (code ${code}). Retrying in ${RECONNECT_DELAY / 1000}s...`);
    setTimeout(startOpenClawBridge, RECONNECT_DELAY);
  });

  openclawWs.on('error', err => console.error('✗ [BRIDGE] WebSocket error:', err.message));
}

// ── HTTP Server ───────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const endpoint = req.url.split('?')[0];
      const data     = JSON.parse(body || '{}');

      // POST /ai
      if (endpoint === '/ai' && req.method === 'POST') {
        const userMsg = data.messages?.find(m => m.role === 'user')?.content || data.message;
        const reqId   = `ai-${Date.now()}`;
        sendToPiViaCLI(userMsg, reqId);
        res.writeHead(202);
        res.end(JSON.stringify({ status: 'pending', requestId: reqId }));
        return;
      }

      // GET /status
      if (endpoint === '/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
          bridge:      'online',
          openclaw:    isConnected ? 'connected' : 'disconnected',
          sessionKey:  SESSION_KEY,
          sessionUuid: SESSION_UUID,
          dedup:       processedEventIds.size
        }));
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (e) {
      console.error('[HTTP] Error:', e.message);
      res.writeHead(400);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────
server.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`
🌉 ══════════════════════════════════════════════════
   OpenClaw Bridge v2.4  —  Active
   Dashboard endpoint : http://localhost:${BRIDGE_PORT}/ai
   Health check       : http://localhost:${BRIDGE_PORT}/status
   Send method        : CLI spawn — shell:false
   Session key        : ${SESSION_KEY}
   Session UUID       : ${SESSION_UUID}
   OpenClaw binary    : ${OPENCLAW_BIN}
🌉 ══════════════════════════════════════════════════
`);
  startOpenClawBridge();
});