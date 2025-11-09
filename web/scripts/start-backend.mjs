import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const webDir = process.cwd();
const rootDir = path.resolve(webDir, '..');

const venvPy = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
const python = existsSync(venvPy) ? venvPy : (process.env.PYTHON || 'python');

const args = ['-m', 'uvicorn', 'app_fastapi:app', '--host', '127.0.0.1', '--port', '8000', '--reload'];

console.log(`[dev:all] Starting FastAPI via ${python} ${args.join(' ')} (cwd=${rootDir})`);
const child = spawn(python, args, {
  cwd: rootDir,
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
  stdio: 'inherit'
});

child.on('exit', (code, signal) => {
  console.log(`[dev:all] FastAPI exited code=${code} signal=${signal ?? ''}`);
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('[dev:all] Failed to start FastAPI:', err);
  process.exit(1);
});
