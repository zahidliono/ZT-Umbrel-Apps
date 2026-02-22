const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const RPC_HOST = process.env.FRACTAL_RPC_HOST || 'fractal-node';
const RPC_PORT = parseInt(process.env.FRACTAL_RPC_PORT || '10332');
const RPC_USER = process.env.FRACTAL_RPC_USER || 'fractal';
const RPC_PASS = process.env.FRACTAL_RPC_PASS || 'fractal_umbrel_node';
const LISTEN_PORT = parseInt(process.env.DASHBOARD_PORT || '8380');
const STATIC_DIR = path.join(__dirname, 'public');

function rpcCall(method, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '1.0', id: 'dashboard', method, params });
    const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
    const req = http.request({
      hostname: RPC_HOST, port: RPC_PORT, path: '/', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + auth, 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error('Bad JSON')); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png' };

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { pathname } = url.parse(req.url);

  if (pathname === '/api/rpc' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const result = await rpcCall(JSON.parse(body).method, JSON.parse(body).params || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch(e) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { code: -1, message: e.message } }));
      }
    });
    return;
  }

  const file = path.join(STATIC_DIR, pathname === '/' ? 'index.html' : pathname);
  fs.readFile(file, (err, data) => {
    if (err) {
      fs.readFile(path.join(STATIC_DIR, 'index.html'), (e, d) => {
        if (e) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(d);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(LISTEN_PORT, '0.0.0.0', () => console.log(`Fractal Dashboard on :${LISTEN_PORT} → RPC ${RPC_HOST}:${RPC_PORT}`));
