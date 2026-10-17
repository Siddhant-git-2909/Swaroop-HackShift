import { spawn } from 'child_process';
import path from 'path';

console.log('[SWAROOP] Starting FastAPI backend on http://127.0.0.1:8000 ...');

const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
const proc = spawn(pythonBin, ['-m', 'uvicorn', 'server.app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve('.')
});

proc.on('close', (code) => {
  console.log(`[SWAROOP] FastAPI backend exited with code ${code}`);
});
