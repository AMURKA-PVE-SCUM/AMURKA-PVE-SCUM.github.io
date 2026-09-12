/**
 * AMURKA Sync — bridges SSM Web Panel API to static JSON files
 * Run on the same machine as SSM, or point to a remote SSM API URL.
 *
 * Usage:
 *   node sync-ssm.js
 *   node sync-ssm.js --once          (single sync, then exit)
 *   node sync-ssm.js --interval 10   (override interval in seconds)
 *
 * Config: data/config.json
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

function loadConfig() {
  const cfgPath = path.join(DATA_DIR, 'config.json');
  if (!fs.existsSync(cfgPath)) {
    console.error('[sync] config.json not found at', cfgPath);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function saveConfig(cfg) {
  fs.writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(cfg, null, 2), 'utf8');
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
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON from ${endpoint}: ${e.message}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error(`Connection failed: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

let lastSync = null;
let syncCount = 0;

async function syncOnce(cfg) {
  const results = { ok: 0, fail: 0, errors: [] };
  const ts = new Date().toISOString();

  // 1. Server status (auth required)
  try {
    const status = await apiFetch(cfg, '/api/status');
    writeJson('ssm-status.json', {
      online: status.running === true,
      running: status.running,
      players: status.players || 0,
      maxPlayers: status.maxPlayers || 100,
      uptime: status.uptime || 0,
      memoryUsage: status.memoryUsage || 0,
      pid: status.pid,
      updated: ts,
    });
    results.ok++;
  } catch (e) {
    results.fail++;
    results.errors.push(`status: ${e.message}`);
  }

  // 2. Online players (auth required)
  try {
    const data = await apiFetch(cfg, '/api/players/online');
    const players = (data.players || []).map(p => ({
      steamId: p.steamId,
      name: p.name,
      connectedAt: p.connectedAt,
      duration: p.duration || 0,
      location: p.location,
      fame: p.fame,
      balance: p.balance,
      gold: p.gold,
    }));
    writeJson('ssm-players.json', { players, updated: ts });
    results.ok++;
  } catch (e) {
    results.fail++;
    results.errors.push(`players: ${e.message}`);
  }

  // 3. Vehicles (no auth)
  try {
    const data = await apiFetch(cfg, '/api/vehicles');
    writeJson('ssm-vehicles.json', { vehicles: data.vehicles || [], updated: ts });
    results.ok++;
  } catch (e) {
    results.fail++;
    results.errors.push(`vehicles: ${e.message}`);
  }

  // 4. Flags (no auth)
  try {
    const data = await apiFetch(cfg, '/api/flags');
    writeJson('ssm-flags.json', { flags: data.flags || [], updated: ts });
    results.ok++;
  } catch (e) {
    results.fail++;
    results.errors.push(`flags: ${e.message}`);
  }

  // 5. Rating leaderboard (auth required)
  try {
    const data = await apiFetch(cfg, '/api/rating/leaderboard');
    writeJson('ssm-rating.json', {
      leaderboard: data.leaderboard || [],
      totalOnlineSeconds: data.totalOnlineSeconds || 0,
      updated: ts,
    });
    results.ok++;
  } catch (e) {
    results.fail++;
    results.errors.push(`rating: ${e.message}`);
  }

  // 6. LOLKA bot status (auth required)
  try {
    const data = await apiFetch(cfg, '/api/lolkabot/status');
    writeJson('ssm-bot.json', { running: data.running || false, updated: ts });
    results.ok++;
  } catch (e) {
    results.fail++;
    results.errors.push(`bot: ${e.message}`);
  }

  lastSync = ts;
  syncCount++;

  const statusMsg = results.fail === 0
    ? `[sync] #${syncCount} OK — ${results.ok} endpoints`
    : `[sync] #${syncCount} — ${results.ok} ok, ${results.fail} fail: ${results.errors.join('; ')}`;
  console.log(statusMsg);

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const onceMode = args.includes('--once');
  const intervalIdx = args.indexOf('--interval');
  const cfg = loadConfig();

  if (!cfg.ssm.enabled) {
    console.log('[sync] SSM sync is disabled in config.json (ssm.enabled: false)');
    console.log('[sync] Set "enabled": true and configure apiUrl + token to start.');
    process.exit(0);
  }

  const intervalSec = intervalIdx >= 0 ? parseInt(args[intervalIdx + 1]) || 10 : (cfg.ssm.syncIntervalSec || 10);

  console.log(`[sync] Connecting to SSM API at ${cfg.ssm.apiUrl}`);
  console.log(`[sync] Interval: ${intervalSec}s | Mode: ${onceMode ? 'once' : 'continuous'}`);

  if (onceMode) {
    await syncOnce(cfg);
    process.exit(0);
  }

  // Initial sync
  await syncOnce(cfg);

  // Periodic sync
  setInterval(() => syncOnce(cfg), intervalSec * 1000);
}

main().catch(e => {
  console.error('[sync] Fatal:', e.message);
  process.exit(1);
});
