const http = require('http');
const fs = require('fs');
const path = require('path');

const RPC_HOST = process.env.FRACTAL_RPC_HOST || 'localhost';
const RPC_PORT = parseInt(process.env.FRACTAL_RPC_PORT || '10332');
const RPC_USER = process.env.FRACTAL_RPC_USER || 'fractal';
const RPC_PASS = process.env.FRACTAL_RPC_PASS || 'fractalnode';
const PORT = parseInt(process.env.DASHBOARD_PORT || '3000');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'));

function rpc(method, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '1.0', id: 'ui', method, params });
    const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
    const req = http.request({
      hostname: RPC_HOST, port: RPC_PORT, path: '/', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth,
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Bad JSON from node')); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/api/status') {
    Promise.all([
      rpc('getblockchaininfo'),
      rpc('getnetworkinfo'),
      rpc('getmininginfo')
    ]).then(([chain, net, mining]) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        blocks: chain.blocks,
        headers: chain.headers,
        progress: chain.verificationprogress,
        chain: chain.chain,
        peers: net.connections,
        version: net.subversion,
        difficulty: mining.difficulty,
        networkhashps: mining.networkhashps
      }));
    }).catch(e => {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // Serve dashboard for all other routes
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(HTML);
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Fractal Bitcoin Dashboard running on port ${PORT}`);
  console.log(`Connecting to node at ${RPC_HOST}:${RPC_PORT}`);
});
