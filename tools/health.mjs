import http from 'http';

const req = http.get('http://127.0.0.1:8000/api/v1/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('[SWAROOP HEALTH CHECK] Status Code:', res.statusCode);
    console.log(data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error('[SWAROOP HEALTH CHECK] Server not reachable:', err.message);
  process.exit(1);
});
