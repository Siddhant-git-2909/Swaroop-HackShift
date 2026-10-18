import { spawn } from 'child_process';
import path from 'path';

import fs from 'fs';

console.log('[SWAROOP] Starting FastAPI backend on http://127.0.0.1:8000 ...');

const venvWin = path.resolve('.venv', 'Scripts', 'python.exe');
const venvUnix = path.resolve('.venv', 'bin', 'python');
let pythonBin = process.platform === 'win32' ? 'python' : 'python3';
if (fs.existsSync(venvWin)) {
  pythonBin = venvWin;
} else if (fs.existsSync(venvUnix)) {
  pythonBin = venvUnix;
}

const proc = spawn(pythonBin, ['-m', 'uvicorn', 'server.app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'], {
  stdio: 'inherit',
  shell: false,
  cwd: path.resolve('.')
});

proc.on('close', (code) => {
  console.log(`[SWAROOP] FastAPI backend exited with code ${code}`);
});
