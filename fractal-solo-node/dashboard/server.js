const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const RPC_HOST = process.env.FRACTAL_RPC_HOST || 'fractal-node';
const RPC_PORT = process.env.FRACTAL_RPC_PORT || '10332';
const RPC_USER = process.env.FRACTAL_RPC_USER || 'fractal';
const RPC_PASS = process.env.FRACTAL_RPC_PASS || 'fractal_umbrel_node';
const LISTEN_PORT = process.env.DASHBOARD_PORT || '8380';

const STATIC_DIR = path.join(__dirname, 'public');

function rpcRequest(body) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
    const postData = JSON.stringify(body);
    const opts = {
      hostname: RPC_HOST,
      port: parseInt(RPC_PORT),
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Basic ' + auth,
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Invalid JSON from node')); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // RPC proxy endpoint
  if (parsed.pathname === '/api/rpc' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const result = await rpcRequest(payload);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result));
      } catch(e) {
        res.writeHead(502, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {code: -1, message: e.message}}));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(STATIC_DIR, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback to index.html for SPA routing
      fs.readFile(path.join(STATIC_DIR, 'index.html'), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(d2);
      });
      return;
    }
    const ext = path.extname(filePath);
    const types = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml'};
    res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream'});
    res.end(data);
  });
});

server.listen(parseInt(LISTEN_PORT), '0.0.0.0', () => {
  console.log(`Fractal Bitcoin Dashboard listening on port ${LISTEN_PORT}`);
  console.log(`Proxying RPC to ${RPC_HOST}:${RPC_PORT}`);
});
