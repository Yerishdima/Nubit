#!/usr/bin/env node
'use strict';
// Nubit native messaging host.
// Chrome talks to this process over stdin/stdout using 4-byte length-prefixed JSON messages.
// It lets the extension run programs the user configured in Settings (yt-dlp, ffmpeg, ...).
// Only the extension ID listed in com.nubit.host.json (allowed_origins) may connect.

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const VERSION = '0.1.0';
const LOG = path.join(__dirname, 'host.log');
const MAX_MESSAGE = 900 * 1024; // Chrome rejects host→browser messages over 1 MB

function log(msg) {
  try {
    fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`);
    const st = fs.statSync(LOG);
    if (st.size > 512 * 1024) fs.truncateSync(LOG, 0);
  } catch {
    /* ignore */
  }
}

// ---- framing ---------------------------------------------------------------

let buf = Buffer.alloc(0);
process.stdin.on('data', (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  drain();
});
process.stdin.on('end', () => process.exit(0));
process.stdin.on('error', () => process.exit(0));

function drain() {
  while (buf.length >= 4) {
    const len = buf.readUInt32LE(0);
    if (buf.length < 4 + len) return;
    const raw = buf.subarray(4, 4 + len).toString('utf8');
    buf = buf.subarray(4 + len);
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      send({ ok: false, error: 'invalid JSON: ' + err.message });
      continue;
    }
    handle(msg).then(send, (err) => send({ ok: false, error: String((err && err.message) || err) }));
  }
}

function send(obj) {
  let json = Buffer.from(JSON.stringify(obj), 'utf8');
  if (json.length > MAX_MESSAGE) {
    // Truncate the biggest string fields until it fits.
    const shrink = (o) => {
      for (const k of Object.keys(o)) {
        if (typeof o[k] === 'string' && o[k].length > 1000) o[k] = o[k].slice(0, Math.floor(o[k].length / 2)) + '\n…[truncated by native host]';
        else if (o[k] && typeof o[k] === 'object') shrink(o[k]);
      }
    };
    let guard = 0;
    while (json.length > MAX_MESSAGE && guard++ < 20) {
      shrink(obj);
      json = Buffer.from(JSON.stringify(obj), 'utf8');
    }
  }
  const header = Buffer.alloc(4);
  header.writeUInt32LE(json.length, 0);
  process.stdout.write(Buffer.concat([header, json]));
}

// ---- commands --------------------------------------------------------------

async function handle(msg) {
  const cmd = msg && msg.cmd;
  log(`cmd=${cmd}`);
  switch (cmd) {
    case 'ping':
      return { ok: true, version: VERSION, node: process.version, platform: process.platform, hostDir: __dirname };
    case 'which':
      return { ok: true, path: which(String(msg.name || '')) };
    case 'exists':
      return { ok: true, exists: !!msg.path && fs.existsSync(msg.path) };
    case 'exec':
      return exec(msg);
    case 'ytdlp_subs':
      return ytdlpSubs(msg);
    default:
      return { ok: false, error: `unknown command: ${cmd}` };
  }
}

function which(name) {
  if (!name) return null;
  if (path.isAbsolute(name) && fs.existsSync(name)) return name;
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  if (process.platform === 'win32') {
    const extra = [
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files'),
      'C:\\ffmpeg\\bin',
      'C:\\Tools',
    ];
    dirs.push(...extra);
  } else {
    dirs.push('/usr/local/bin', '/opt/homebrew/bin', path.join(os.homedir(), '.local', 'bin'));
  }
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, name.endsWith(ext) ? name : name + ext);
      try {
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch {
        /* next */
      }
    }
  }
  return null;
}

function run(exe, args, { timeoutMs = 120000, maxOutput = 200000, cwd } = {}) {
  return new Promise((resolve) => {
    let child;
    let spawnArgs = args.map(String);
    let spawnExe = exe;
    const opts = { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] };
    if (process.platform === 'win32' && /\.(bat|cmd)$/i.test(exe)) {
      // .bat/.cmd need cmd.exe; quote every argument.
      spawnExe = process.env.ComSpec || 'cmd.exe';
      spawnArgs = ['/d', '/s', '/c', `"${[exe, ...spawnArgs].map((a) => `"${String(a).replace(/"/g, '""')}"`).join(' ')}"`];
      opts.windowsVerbatimArguments = true;
    }
    try {
      child = spawn(spawnExe, spawnArgs, opts);
    } catch (err) {
      return resolve({ ok: false, error: `cannot start ${exe}: ${err.message}` });
    }
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        /* ignore */
      }
    }, timeoutMs);
    child.stdout.on('data', (d) => {
      if (stdout.length < maxOutput) stdout += d.toString('utf8');
    });
    child.stderr.on('data', (d) => {
      if (stderr.length < maxOutput) stderr += d.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: `cannot start ${exe}: ${err.message}` });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: true, code, stdout: stdout.slice(0, maxOutput), stderr: stderr.slice(0, maxOutput), timedOut });
    });
  });
}

async function exec(msg) {
  const exe = String(msg.path || '');
  if (!exe) return { ok: false, error: 'path is required' };
  if (!fs.existsSync(exe)) return { ok: false, error: `program not found: ${exe}` };
  const args = Array.isArray(msg.args) ? msg.args : [];
  return run(exe, args, { timeoutMs: Number(msg.timeoutMs) || 120000, maxOutput: Number(msg.maxOutput) || 200000, cwd: msg.cwd });
}

// ---- yt-dlp subtitles ------------------------------------------------------

function json3ToText(json, groupSec = 30) {
  const events = (json && json.events) || [];
  const lines = [];
  let bucketStart = -1;
  let bufParts = [];
  const fmt = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  };
  const flush = () => {
    if (bufParts.length) lines.push(`[${fmt(bucketStart)}] ${bufParts.join(' ').replace(/\s+/g, ' ').trim()}`);
    bufParts = [];
  };
  for (const ev of events) {
    if (!Array.isArray(ev.segs)) continue;
    const text = ev.segs
      .map((s) => s.utf8 || '')
      .join('')
      .replace(/\n/g, ' ')
      .trim();
    if (!text) continue;
    const t = Math.floor((ev.tStartMs || 0) / 1000);
    if (bucketStart < 0 || t - bucketStart >= groupSec) {
      flush();
      bucketStart = t;
    }
    bufParts.push(text);
  }
  flush();
  return lines.join('\n');
}

async function ytdlpSubs(msg) {
  const exe = String(msg.path || '');
  if (!exe || !fs.existsSync(exe)) return { ok: false, error: `yt-dlp not found: ${exe}` };
  const url = String(msg.url || '');
  if (!/^https:\/\/(www\.)?youtu(be\.com|\.be)\//.test(url)) return { ok: false, error: 'url must be a YouTube URL' };
  const langs = Array.isArray(msg.langs) && msg.langs.length ? msg.langs.map(String) : ['en'];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nubit-subs-'));
  const timeoutMs = Number(msg.timeoutMs) || 180000;
  try {
    const subLangs = langs.map((l) => `${l}.*`).join(',') + ',-live_chat';
    const common = ['--skip-download', '--no-playlist', '--no-warnings', '--sub-format', 'json3', '--sub-langs', subLangs, '-o', path.join(tmp, '%(id)s.%(ext)s'), url];
    const pick = (auto) => {
      const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.json3'));
      if (!files.length) return null;
      const byLang = files.map((f) => ({ f, lang: f.split('.').slice(-2, -1)[0] || '' }));
      let chosen = null;
      for (const l of langs) {
        chosen = byLang.find((x) => x.lang.toLowerCase().startsWith(l.toLowerCase()));
        if (chosen) break;
      }
      chosen = chosen || byLang[0];
      const text = json3ToText(JSON.parse(fs.readFileSync(path.join(tmp, chosen.f), 'utf8')));
      return { ok: true, lang: chosen.lang, auto, text, available: byLang.map((x) => x.lang + (auto ? ' (auto)' : '')) };
    };
    let r = await run(exe, ['--write-subs', ...common], { timeoutMs, maxOutput: 20000 });
    if (r.ok === false) return r;
    let out = pick(false);
    if (!out) {
      r = await run(exe, ['--write-auto-subs', ...common], { timeoutMs, maxOutput: 20000 });
      if (r.ok === false) return r;
      out = pick(true);
    }
    if (!out) return { ok: false, error: `no subtitles found (yt-dlp said: ${(r.stderr || r.stdout || '').trim().slice(0, 300)})` };
    return out;
  } finally {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}
