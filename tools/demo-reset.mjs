import http from 'http';

const req = http.request({
  host: '127.0.0.1',
  port: 8000,
  path: '/api/v1/demo/reset',
  method: 'POST'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('[SWAROOP DEMO RESET]', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('[SWAROOP DEMO RESET] Server offline, in-memory state will be default on start.');
  process.exit(0);
});
req.end();
