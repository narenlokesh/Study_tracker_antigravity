const { spawn } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🚀 FOCUS TRACK — Monthly Study & Streak Tracker');
console.log('====================================================');
console.log('Starting full-stack development environment...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Spawn Express backend
console.log('📡 Starting Express + SQLite backend on http://localhost:5000...');
const server = spawn(npmCmd, ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
});

// Spawn Vite frontend
console.log('💻 Starting React + Vite frontend on http://localhost:3000...\n');
const client = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n🛑 Stopping Study Tracker servers...');
  server.kill();
  client.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
