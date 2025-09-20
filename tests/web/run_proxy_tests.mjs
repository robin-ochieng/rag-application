import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..', '..');
const webDir = resolve(rootDir, 'web');
const backendUrl = process.env.API_URL || 'http://127.0.0.1:8000';
const proxyUrl = process.env.PROXY_URL || 'http://127.0.0.1:3000';

function startProcess(command, args, options = {}, useShell = false) {
  const child = spawn(command, args, {
    stdio: 'pipe',
    shell: useShell,
    ...options,
  });
  child.stdout?.on('data', d => process.stdout.write(d.toString()));
  child.stderr?.on('data', d => process.stderr.write(d.toString()));
  return child;
}

async function waitForUrl(url, timeoutMs = 20000, intervalMs = 300) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return true;
    } catch (_) {}
    await delay(intervalMs);
  }
  return false;
}

async function ensureBackend() {
  try {
    const ok = await waitForUrl(`${backendUrl}/healthz`, 4000, 300);
    if (ok) return null; // already running
  } catch {}
  const venvPython = resolve(rootDir, '.venv', 'Scripts', 'python.exe');
  const pythonExe = fs.existsSync(venvPython) ? venvPython : 'python';
  const env = { ...process.env, TEST_MODE: '1' };
  const args = ['-m', 'uvicorn', 'app_fastapi:app', '--host', '127.0.0.1', '--port', '8000'];
  const child = startProcess(pythonExe, args, { cwd: rootDir, env }, false);
  const ok = await waitForUrl(`${backendUrl}/healthz`, 15000, 300);
  if (!ok) throw new Error('Backend failed to become healthy');
  return child;
}

async function ensureWeb() {
  try {
    const ok = await waitForUrl(`${proxyUrl}/api/chat`, 4000, 300);
    if (ok) return null; // already running
  } catch {}
  const nextBin = resolve(webDir, 'node_modules', 'next', 'dist', 'bin', 'next');
  const nodeExe = process.execPath || 'node';
  const child = startProcess(nodeExe, [nextBin, 'dev', '-p', '3000'], { cwd: webDir, env: process.env }, false);
  const ok = await waitForUrl(`${proxyUrl}/api/chat`, 30000, 500);
  if (!ok) throw new Error('Web dev server failed to become ready');
  return child;
}

async function killProcessTree(child) {
  if (!child) return;
  if (process.platform === 'win32') {
    const pid = child.pid;
    await new Promise(resolveDone => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { shell: true });
      killer.on('close', () => resolveDone());
      killer.on('error', () => resolveDone());
    });
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    try { child.kill('SIGTERM'); } catch {}
  }
}

async function main() {
  let backendProc = null;
  let webProc = null;
  try {
    backendProc = await ensureBackend();
    webProc = await ensureWeb();

    const testProc = startProcess('node', [join(rootDir, 'tests', 'web', 'proxy.test.mjs')], { cwd: webDir });
    const code = await new Promise(resolveDone => {
      testProc.on('close', resolveDone);
      testProc.on('error', () => resolveDone(1));
    });
    if (code !== 0) process.exitCode = code;
  } catch (err) {
    console.error(err?.stack || String(err));
    process.exitCode = 1;
  } finally {
    await killProcessTree(webProc);
    await killProcessTree(backendProc);
  }
}

await main();
