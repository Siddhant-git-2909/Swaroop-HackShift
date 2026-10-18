import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('====================================================');
console.log('   SWAROOP — Developer Environment Setup');
console.log('====================================================\n');

const rootDir = path.resolve('.');

// 1. Setup .env from .env.example
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('[1/4] Creating .env from .env.example ...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('      Created .env successfully.');
} else if (fs.existsSync(envPath)) {
  console.log('[1/4] .env already exists. Preserving existing configuration.');
} else {
  console.warn('[1/4] Warning: .env.example not found. Skipping .env creation.');
}

// 2. Ensure upload directories exist
console.log('\n[2/4] Ensuring local upload directories exist ...');
const uploadDir = path.join(rootDir, 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`      Created directory: ${uploadDir}`);
} else {
  console.log(`      Upload directory exists: ${uploadDir}`);
}

// 3. Install client npm packages
console.log('\n[3/4] Installing client dependencies (npm --prefix client install) ...');
try {
  execSync('npm --prefix client install', { stdio: 'inherit', cwd: rootDir });
  console.log('      Client dependencies installed successfully.');
} catch (err) {
  console.error('      Failed to install client dependencies:', err.message);
}

// 4. Check / Recommend Python setup
console.log('\n[4/4] Verifying Python backend setup ...');
const venvWin = path.join(rootDir, '.venv', 'Scripts', 'python.exe');
const venvUnix = path.join(rootDir, '.venv', 'bin', 'python');

if (fs.existsSync(venvWin) || fs.existsSync(venvUnix)) {
  console.log('      Python virtual environment (.venv) detected.');
  console.log('      To install/sync backend dependencies:');
  if (process.platform === 'win32') {
    console.log('        .\\.venv\\Scripts\\pip install -r requirements.txt');
  } else {
    console.log('        ./.venv/bin/pip install -r requirements.txt');
  }
} else {
  console.log('      Virtual environment not detected.');
  console.log('      Recommended setup commands:');
  console.log('        python -m venv .venv');
  if (process.platform === 'win32') {
    console.log('        .\\.venv\\Scripts\\Activate.ps1');
  } else {
    console.log('        source .venv/bin/activate');
  }
  console.log('        pip install -r requirements.txt');
}

console.log('\n====================================================');
console.log('   Setup complete! Start dev servers with:');
console.log('     npm run dev');
console.log('====================================================\n');
