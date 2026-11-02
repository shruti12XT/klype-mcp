#!/usr/bin/env node
// Klype AI MCP bridge: exposes the hosted Klype MCP server over stdio for
// clients that only launch local servers. Messages are relayed as-is to
// https://api.klype.ai/api/v1/mcp (Streamable HTTP). No dependencies.
'use strict';

const readline = require('node:readline');

const ENDPOINT = process.env.KLYPE_MCP_URL || 'https://api.klype.ai/api/v1/mcp';
const API_KEY = process.env.KLYPE_API_KEY || '';
const VERSION = require('../package.json').version;

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  process.stdout.write(VERSION + '\n');
  process.exit(0);
}
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  process.stdout.write(
    [
      'klype-mcp ' + VERSION,
      '',
      'Runs the Klype AI MCP server over stdio by relaying to ' + ENDPOINT + '.',
      '',
      'Environment:',
      '  KLYPE_API_KEY   Klype API key (klp_live_...). Create one at app.klype.ai/dashboard/connections',
      '  KLYPE_MCP_URL   Override the server URL (optional)',
      '',
    ].join('\n'),
  );
  process.exit(0);
}
if (!API_KEY) {
  process.stderr.write('klype-mcp: set KLYPE_API_KEY (create a key at app.klype.ai/dashboard/connections)\n');
  process.exit(1);
}

let sessionId = null;
let queue = Promise.resolve();

function write(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function errorFor(msg, text) {
  if (msg && msg.id !== undefined && msg.id !== null) {
    write({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: text } });
  } else {
    process.stderr.write('klype-mcp: ' + text + '\n');
  }
}

function parseSse(body) {
  const out = [];
  for (const block of body.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trimStart())
      .join('\n');
    if (data) {
      try {
        out.push(JSON.parse(data));
      } catch (_) {
        /* ignore keep-alive or partial events */
      }
    }
  }
  return out;
}

async function relay(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch (_) {
    process.stderr.write('klype-mcp: ignored a line that is not JSON\n');
    return;
  }
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: 'Bearer ' + API_KEY,
    'User-Agent': 'klype-mcp/' + VERSION,
  };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;

  let res;
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(msg) });
  } catch (e) {
    errorFor(msg, 'could not reach ' + ENDPOINT + ': ' + e.message);
    return;
  }
  const sid = res.headers.get('mcp-session-id');
  if (sid) sessionId = sid;
  if (res.status === 202 || res.status === 204) return;

  const text = await res.text();
  if (!res.ok) {
    errorFor(msg, 'HTTP ' + res.status + (text ? ': ' + text.slice(0, 300) : ''));
    return;
  }
  const type = res.headers.get('content-type') || '';
  const messages = type.includes('text/event-stream') ? parseSse(text) : text ? [JSON.parse(text)] : [];
  for (const m of messages) {
    if (Array.isArray(m)) m.forEach(write);
    else write(m);
  }
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  if (!line.trim()) return;
  queue = queue.then(() => relay(line)).catch((e) => process.stderr.write('klype-mcp: ' + e.message + '\n'));
});
rl.on('close', () => {
  queue.then(() => process.exit(0));
});
