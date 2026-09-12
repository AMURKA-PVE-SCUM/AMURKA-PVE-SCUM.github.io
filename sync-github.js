/**
 * AMURKA GitHub Sync — SSM API → GitHub Pages
 *
 * Runs on the PC where SSM is installed.
 * Fetches data from SSM Web Panel API, writes JSON to the website repo, pushes to GitHub.
 * GitHub Pages auto-updates on push.
 *
 * Usage:
 *   node sync-github.js              (continuous, every 60s)
 *   node sync-github.js --once       (single sync, then exit)
 *   node sync-github.js --interval 30 (override interval)
 *
 * Config: data/config.json
 * Required: git installed, repo cloned, GitHub token in config
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// ─── Paths ───
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

// ─── Config ───
function loadConfig() {
  const cfgPath = path.join(DATA_DIR, 'config.json');
  if (!fs.existsSync(cfgPath)) {
    console.error('[sync] config.json not found at', cfgPath);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

// ─── HTTP fetch from SSM API ───
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

// ─── Write JSON file ───
function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const content = JSON.stringify(data, null, 2);
  // Only write if changed
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// ─── Git: add, commit, push ───
function gitPush(message) {
  try {
    execSync('git add data/ssm-*.json', { cwd: ROOT, stdio: 'pipe' });
    // Check if there are changes to commit
    const status = execSync('git status --porcelain data/ssm-*.json', { cwd: ROOT, encoding: 'utf8' });
    if (!status.trim()) {
      return false; // No changes
    }
    execSync(`git commit -m "${message}"`, { cwd: ROOT, stdio: 'pipe' });
    execSync('git push origin main', { cwd: ROOT, stdio: 'pipe', timeout: 30000 });
    console.log(`[sync] Pushed to GitHub: ${message}`);
    return true;
  } catch (e) {
    console.error(`[sync] Git push failed: ${e.message}`);
    return false;
  }
}

// ─── Sync once ───
async function syncOnce(cfg) {
  const ts = new Date().toISOString();
  let changed = 0;

  // 1. Server status (auth required)
  try {
    const s = await apiFetch(cfg, '/api/status');
    if (writeJson('ssm-status.json', {
      online: s.running === true,
      players: s.players || 0,
      maxPlayers: s.maxPlayers || 100,
      uptime: s.uptime || 0,
      memoryUsage: s.memoryUsage || 0,
      updated: ts,
    })) changed++;
  } catch (e) { console.warn(`[sync] status: ${e.message}`); }

  // 2. Online players (auth required)
  try {
    const data = await apiFetch(cfg, '/api/players/online');
    if (writeJson('ssm-players.json', {
      players: (data.players || []).map(p => ({
        steamId: p.steamId,
        name: p.name,
        duration: p.duration || 0,
        fame: p.fame,
        balance: p.balance,
        gold: p.gold,
      })),
      updated: ts,
    })) changed++;
  } catch (e) { console.warn(`[sync] players: ${e.message}`); }

  // 3. Rating leaderboard (auth required)
  try {
    const data = await apiFetch(cfg, '/api/rating/leaderboard');
    if (writeJson('ssm-rating.json', {
      leaderboard: data.leaderboard || [],
      totalOnlineSeconds: data.totalOnlineSeconds || 0,
      updated: ts,
    })) changed++;
  } catch (e) { console.warn(`[sync] rating: ${e.message}`); }

  // 4. Vehicles (no auth)
  try {
    const data = await apiFetch(cfg, '/api/vehicles');
    if (writeJson('ssm-vehicles.json', {
      vehicles: data.vehicles || [],
      updated: ts,
    })) changed++;
  } catch (e) { console.warn(`[sync] vehicles: ${e.message}`); }

  // 5. Flags (no auth)
  try {
    const data = await apiFetch(cfg, '/api/flags');
    if (writeJson('ssm-flags.json', {
      flags: data.flags || [],
      updated: ts,
    })) changed++;
  } catch (e) { console.warn(`[sync] flags: ${e.message}`); }

  // 6. Bot status (auth required)
  try {
    const data = await apiFetch(cfg, '/api/lolkabot/status');
    if (writeJson('ssm-bot.json', {
      running: data.running || false,
      updated: ts,
    })) changed++;
  } catch (e) { console.warn(`[sync] bot: ${e.message}`); }

  // Push if any file changed
  if (changed > 0) {
    gitPush(`sync: ${changed} files updated ${ts.slice(0, 19)}`);
    console.log(`[sync] ${changed} files changed, pushed to GitHub`);
  } else {
    console.log(`[sync] no changes`);
  }
}

// ─── Main ───
async function main() {
  const args = process.argv.slice(2);
  const onceMode = args.includes('--once');
  const intervalIdx = args.indexOf('--interval');
  const cfg = loadConfig();

  if (!cfg.ssm || !cfg.ssm.enabled) {
    console.error('[sync] Set "ssm.enabled": true in data/config.json');
    process.exit(1);
  }

  const intervalSec = intervalIdx >= 0
    ? parseInt(args[intervalIdx + 1]) || 60
    : (cfg.ssm.syncIntervalSec || 60);

  console.log('==========================================');
  console.log('  AMURKA GitHub Sync');
  console.log('  SSM API → GitHub Pages');
  console.log('==========================================');
  console.log(`SSM API: ${cfg.ssm.apiUrl}`);
  console.log(`Interval: ${intervalSec}s | Mode: ${onceMode ? 'once' : 'continuous'}`);
  console.log('');

  // Verify git remote
  try {
    const remote = execSync('git remote get-url origin', { cwd: ROOT, encoding: 'utf8' }).trim();
    console.log(`Git remote: ${remote}`);
  } catch {
    console.error('[sync] ERROR: git remote "origin" not found. Run: git remote add origin <url>');
    process.exit(1);
  }

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
