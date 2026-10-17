import { spawn } from 'child_process';
import path from 'path';

console.log('====================================================');
console.log('   SWAROOP — “Resume nahi, hunar hai.” (Team PRAHAAR)');
console.log('   Starting Full Stack MVP (FastAPI + React/Vite)...');
console.log('====================================================');

const pythonBin = process.platform === 'win32' ? 'python' : 'python3';
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// 1. Start Server
const server = spawn(pythonBin, ['-m', 'uvicorn', 'server.app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
  stdio: 'inherit',
  shell: true,
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
