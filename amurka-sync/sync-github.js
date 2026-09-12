/**
 * AMURKA GitHub Sync — SSM API → GitHub Pages (via GitHub API)
 *
 * No git required. Uses GitHub REST API to update files directly.
 * Runs on the PC where SSM is installed.
 *
 * Usage:
 *   node sync-github.js              (continuous, every 60s)
 *   node sync-github.js --once       (single sync, then exit)
 *   node sync-github.js --interval 30
 *
 * Config: data/config.json
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

const GITHUB_REPO = 'AMURKA-PVE-SCUM/AMURKA-PVE-SCUM.github.io';

function loadConfig() {
  const cfgPath = path.join(DATA_DIR, 'config.json');
  if (!fs.existsSync(cfgPath)) {
    console.error('[sync] config.json not found at', cfgPath);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function apiFetch(cfg, endpoint) {
  return new Promise((resolve, reject) => {
    const baseUrl = cfg.ssm.apiUrl.replace(/\/+$/, '');
    const url = `${baseUrl}${endpoint}`;
    const isHttps = url.startsWith('https');
    const mod = isHttps ? https : http;

    const headers = { 'Accept': 'application/json' };
    if (cfg.ssm.token) {
      headers['Authorization'] = `Bearer ${cfg.ssm.token}`;
    }

    const req = mod.get(url, { headers, timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 401) {
          reject(new Error('Unauthorized — set ssm.token in config.json'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`Invalid JSON: ${e.message}`)); }
      });
    });
    req.on('error', (e) => reject(new Error(`SSM connection failed: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// GitHub API: get file SHA (needed for update)
function githubGetFile(token, filepath) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filepath}`;
    const req = https.get(url, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AMURKA-Sync',
        'Accept': 'application/vnd.github.v3+json',
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) { resolve(null); return; }
        if (res.statusCode >= 400) { reject(new Error(`GitHub GET ${res.statusCode}`)); return; }
        try { resolve(JSON.parse(body)); } catch { resolve(null); }
      });
    });
    req.on('error', reject);
  });
}

// GitHub API: create or update file
function githubPushFile(token, filepath, content, message) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filepath}`;
    const data = JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
    });

    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AMURKA-Sync',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`GitHub PUT ${res.statusCode}: ${body.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Push file: get SHA if exists, then create/update
async function pushToGitHub(token, filepath, content, message) {
  const existing = await githubGetFile(token, filepath);
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
  };
  if (existing && existing.sha) {
    body.sha = existing.sha;
  }

  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filepath}`;
    const data = JSON.stringify(body);
    const req = https.request(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'AMURKA-Sync',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let rbody = '';
      res.on('data', (chunk) => rbody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`GitHub ${res.statusCode}: ${rbody.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function syncOnce(cfg) {
  const ts = new Date().toISOString();
  const token = cfg.github.token;
  const files = [];

  // 1. Server status
  try {
    const s = await apiFetch(cfg, '/api/status');
    files.push({ name: 'data/ssm-status.json', content: JSON.stringify({
      online: s.running === true,
      players: s.players || 0,
      maxPlayers: s.maxPlayers || 100,
      uptime: s.uptime || 0,
      memoryUsage: s.memoryUsage || 0,
      updated: ts,
    }, null, 2) });
  } catch (e) { console.warn(`[sync] status: ${e.message}`); }

  // 2. Online players
  try {
    const data = await apiFetch(cfg, '/api/players/online');
    files.push({ name: 'data/ssm-players.json', content: JSON.stringify({
      players: (data.players || []).map(p => ({
        steamId: p.steamId, name: p.name, duration: p.duration || 0,
        fame: p.fame, balance: p.balance, gold: p.gold,
      })),
      updated: ts,
    }, null, 2) });
  } catch (e) { console.warn(`[sync] players: ${e.message}`); }

  // 3. Rating
  try {
    const data = await apiFetch(cfg, '/api/rating/leaderboard');
    files.push({ name: 'data/ssm-rating.json', content: JSON.stringify({
      leaderboard: data.leaderboard || [],
      totalOnlineSeconds: data.totalOnlineSeconds || 0,
      updated: ts,
    }, null, 2) });
  } catch (e) { console.warn(`[sync] rating: ${e.message}`); }

  // 4. Vehicles
  try {
    const data = await apiFetch(cfg, '/api/vehicles');
    files.push({ name: 'data/ssm-vehicles.json', content: JSON.stringify({
      vehicles: data.vehicles || [],
      updated: ts,
    }, null, 2) });
  } catch (e) { console.warn(`[sync] vehicles: ${e.message}`); }

  // 5. Flags
  try {
    const data = await apiFetch(cfg, '/api/flags');
    files.push({ name: 'data/ssm-flags.json', content: JSON.stringify({
      flags: data.flags || [],
      updated: ts,
    }, null, 2) });
  } catch (e) { console.warn(`[sync] flags: ${e.message}`); }

  // 6. Bot status
  try {
    const data = await apiFetch(cfg, '/api/lolkabot/status');
    files.push({ name: 'data/ssm-bot.json', content: JSON.stringify({
      running: data.running || false,
      updated: ts,
    }, null, 2) });
  } catch (e) { console.warn(`[sync] bot: ${e.message}`); }

  if (files.length === 0) {
    console.log('[sync] no data from SSM');
    return;
  }

  // Push all files to GitHub
  let pushed = 0;
  for (const f of files) {
    try {
      await pushToGitHub(token, f.name, f.content, `sync: ${f.name} ${ts.slice(0, 19)}`);
      pushed++;
    } catch (e) {
      console.error(`[sync] push ${f.name}: ${e.message}`);
    }
  }

  console.log(`[sync] ${pushed}/${files.length} files pushed to GitHub`);
}

async function main() {
  const args = process.argv.slice(2);
  const onceMode = args.includes('--once');
  const intervalIdx = args.indexOf('--interval');
  const cfg = loadConfig();

  if (!cfg.ssm || !cfg.ssm.enabled) {
    console.error('[sync] Set "ssm.enabled": true in data/config.json');
    process.exit(1);
  }
  if (!cfg.github || !cfg.github.token) {
    console.error('[sync] Set "github.token" in data/config.json');
    console.error('[sync] Create token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  const intervalSec = intervalIdx >= 0
    ? parseInt(args[intervalIdx + 1]) || 60
    : (cfg.ssm.syncIntervalSec || 60);

  console.log('==========================================');
  console.log('  AMURKA GitHub Sync');
  console.log('  SSM API → GitHub Pages');
  console.log('==========================================');
  console.log(`SSM API:  ${cfg.ssm.apiUrl}`);
  console.log(`GitHub:   ${GITHUB_REPO}`);
  console.log(`Interval: ${intervalSec}s | Mode: ${onceMode ? 'once' : 'continuous'}`);
  console.log('');

  if (onceMode) {
    await syncOnce(cfg);
    process.exit(0);
  }

  await syncOnce(cfg);
  setInterval(() => syncOnce(cfg), intervalSec * 1000);
}

main().catch(e => {
  console.error('[sync] Fatal:', e.message);
  process.exit(1);
});
