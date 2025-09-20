import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..', '..');
const webDir = resolve(rootDir, 'web');
const backendUrl = process.env.API_URL || 'http://127.0.0.1:8000';
const appUrl = process.env.APP_URL || 'http://127.0.0.1:3000/chat';

function start(command, args, options = {}, useShell = false) {
  return spawn(command, args, { stdio: 'pipe', shell: useShell, ...options });
}

async function waitFor(url, timeoutMs = 20000, intervalMs = 300) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) return true;
    } catch {}
    await delay(intervalMs);
  }
  return false;
}

async function ensureBackend() {
  if (await waitFor(`${backendUrl}/healthz`, 4000)) return null;
  const venvPython = resolve(rootDir, '.venv', 'Scripts', 'python.exe');
  const pythonExe = fs.existsSync(venvPython) ? venvPython : 'python';
  const env = { ...process.env, TEST_MODE: '1' };
  const p = start(pythonExe, ['-m', 'uvicorn', 'app_fastapi:app', '--host', '127.0.0.1', '--port', '8000'], { cwd: rootDir, env });
  if (!(await waitFor(`${backendUrl}/healthz`, 15000))) throw new Error('backend not ready');
  return p;
}

async function ensureWeb() {
  if (await waitFor(appUrl.replace('/chat', '/api/chat'), 4000)) return null;
  const nodeExe = process.execPath || 'node';
  const nextBin = resolve(webDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  const p = start(nodeExe, [nextBin, 'dev', '-p', '3000'], { cwd: webDir, env: process.env });
  if (!(await waitFor(appUrl.replace('/chat', '/api/chat'), 30000))) throw new Error('web not ready');
  return p;
}

async function killTree(child) {
  if (!child) return;
  if (process.platform === 'win32') {
    await new Promise(res => start('taskkill', ['/PID', String(child.pid), '/T', '/F'], { shell: true }).on('close', res));
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    try { child.kill('SIGTERM'); } catch {}
  }
}

async function ensurePlaywright() {
  const isWin = process.platform === 'win32';
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  console.log('Installing Playwright browsers...');
  await new Promise((resolveDone, rejectDone) => {
    const p = start(npmCmd, ['exec', 'playwright', 'install'], { cwd: webDir }, isWin);
    p.on('close', code => code === 0 ? resolveDone() : rejectDone(new Error('playwright install failed')));
    p.on('error', rejectDone);
  });
}

async function main() {
  let b = null, w = null;
  try {
    await ensurePlaywright();
    console.log('Ensuring backend...');
    b = await ensureBackend();
    console.log('Ensuring web...');
    w = await ensureWeb();
    const testPath = join(rootDir, 'tests', 'e2e', 'chat.e2e.mjs');
    const nodeExe = process.execPath || 'node';
    console.log('Running e2e test...');
    const code = await new Promise(resolveDone => start(nodeExe, [testPath], { cwd: webDir }).on('close', resolveDone));
    if (code !== 0) process.exitCode = code; else console.log('e2e tests passed');
  } catch (e) {
    console.error(e?.stack || String(e));
    process.exitCode = 1;
  } finally {
    await killTree(w);
    await killTree(b);
  }
}

await main();
