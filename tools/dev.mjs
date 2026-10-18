import { spawn } from 'child_process';
import path from 'path';

console.log('====================================================');
console.log('   SWAROOP — “Resume nahi, hunar hai.” (Team PRAHAAR)');
console.log('   Starting Full Stack MVP (FastAPI + React/Vite)...');
console.log('====================================================');

import fs from 'fs';

const venvWin = path.resolve('.venv', 'Scripts', 'python.exe');
const venvUnix = path.resolve('.venv', 'bin', 'python');
let pythonBin = process.platform === 'win32' ? 'python' : 'python3';
if (fs.existsSync(venvWin)) {
  pythonBin = venvWin;
} else if (fs.existsSync(venvUnix)) {
  pythonBin = venvUnix;
}
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Start Server
const server = spawn(pythonBin, ['-m', 'uvicorn', 'server.app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
  stdio: 'inherit',
  shell: false,
  cwd: path.resolve('.')
});

// 2. Start Client
const client = spawn(npmBin, ['--prefix', 'client', 'run', 'dev', '--', '--host'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve('.')
});

function cleanup() {
  console.log('\n[SWAROOP] Shutting down services...');
  server.kill();
  client.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
