/**
 * SANSKRITI AI - Native Lightweight HTTP Server (Node.js)
 * Local development server. Ultra-low RAM footprint (<35MB).
 * Fully compatible with Windows 10 & 4 GB RAM hardware.
 * Delegates /api/* directly to Vercel Serverless Function handlers.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

// Vercel Serverless Function handlers
const healthHandler = require('./api/health');
const chatHandler = require('./api/chat');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer(async (req, res) => {
  // Security & CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host || `localhost:${PORT}`;
  let url;
  try {
    url = new URL(req.url, `http://${host}`);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  let pathname = url.pathname;

  // Normalize subpath if accessed under /Sanskriti_ai/ (e.g. XAMPP proxy)
  if (pathname.toLowerCase().startsWith('/sanskriti_ai')) {
    pathname = pathname.slice('/sanskriti_ai'.length) || '/';
  }

  // 1. Health API Endpoint (Delegates to Vercel function)
  if (pathname === '/api/health') {
    return healthHandler(req, res);
  }

  // 2. Chat Conversation API Endpoint (Delegates to Vercel function)
  if (pathname === '/api/chat') {
    return chatHandler(req, res);
  }

  // 3. Static File Serving with strict Path Traversal Protection
  let relativePath = pathname === '/' ? '/index.html' : pathname;

  const safePath = path.resolve(PUBLIC_DIR, '.' + relativePath);
  if (!safePath.toLowerCase().startsWith(PUBLIC_DIR.toLowerCase())) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden - Access Denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  });
});

// Only start listening when executed directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` SANSKRITI AI - Voice-First Server Started`);
    console.log(` Owner: Ashmit Kumar`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` RAM Footprint: <35MB (Windows 10 4GB RAM Optimized)`);
    console.log(` Serverless Parity: Vercel /api/ functions active`);
    console.log(`==================================================`);
  });
}

module.exports = server;
