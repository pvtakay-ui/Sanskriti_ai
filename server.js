/**
 * SANSKRITI AI - Native Lightweight HTTP Server (Node.js)
 * Zero external dependencies. Ultra-low RAM footprint (<35MB).
 * Fully compatible with Windows 10 & 4 GB RAM hardware.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

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

const server = http.createServer((req, res) => {
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

  const pathname = url.pathname;

  // 1. Health API Endpoint
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'online',
      owner: 'Ashmit Kumar',
      project: 'Sanskriti AI',
      phase: 1,
      memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform,
      serverTime: new Date().toISOString()
    }, null, 2));
    return;
  }

  // 2. Chat Conversation API Endpoint
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // Max 1MB protection
        req.connection.destroy();
      }
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userMsg = (payload.message || '').trim();
        const lang = payload.language || 'hi-IN';

        const reply = processServerConversation(userMsg, lang);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(reply));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
      }
    });
    return;
  }

  // 3. Static File Serving with strict Path Traversal Protection
  let relativePath = pathname === '/' ? '/index.html' : pathname;
  // Handle subfolder path prefix if proxied or accessed via /Sanskriti_ai/
  if (relativePath.toLowerCase().startsWith('/sanskriti_ai')) {
    relativePath = relativePath.slice('/sanskriti_ai'.length) || '/index.html';
  }

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

/**
 * Server-side baseline conversation handling
 */
function processServerConversation(message, lang) {
  const lower = message.toLowerCase();

  // Himachali / Pahari Expressions
  if (lower.includes('kasa ahein') || lower.includes('himachal') || lower.includes('pahari') || lower.includes('kainda')) {
    return {
      reply: 'Namaste Ashmit ji! Himachal diyan thandiyan te sundar pahadiyan wangu main vi bilkul shant te tayaar hoon. Kahiye, ki sewa karaan?',
      lang: 'hi-IN',
      mood: 'cheerful'
    };
  }

  // Punjabi Greetings
  if (lower.includes('sat sri akal') || lower.includes('kiddan') || lower.includes('ki haal') || lower.includes('haal chaal')) {
    return {
      reply: 'Sat Sri Akal Ashmit ji! Main tuhade naal hamesha tayaar aan. Tuhada din kaisa ja reha hai?',
      lang: 'pa-IN',
      mood: 'warm'
    };
  }

  // Identity / Assistant
  if (lower.includes('who are you') || lower.includes('kaun ho') || lower.includes('tussi kaun')) {
    return {
      reply: 'Main Sanskriti AI hoon — Ashmit Kumar ji ki personal voice-first AI companion aur autonomous assistant! Main aapki aawaaz samajhkar madad karne ke liye tayaar hoon.',
      lang: 'hi-IN',
      mood: 'proud'
    };
  }

  // Language command
  if (lower.includes('hindi')) {
    return {
      reply: 'Namaste Ashmit! Main bilkul Hindi mein baat karungi. Kahiye, main aapki kya madad karoon?',
      lang: 'hi-IN',
      mood: 'respectful'
    };
  }

  if (lower.includes('punjabi')) {
    return {
      reply: 'Sat Sri Akal Ashmit ji! Hun main tuhade naal Punjabi vich hi gal kiti karengi.',
      lang: 'pa-IN',
      mood: 'warm'
    };
  }

  if (lower.includes('english')) {
    return {
      reply: 'Hello Ashmit! I have switched to English. How can I assist you right now?',
      lang: 'en-IN',
      mood: 'friendly'
    };
  }

  // Default context response
  if (lang === 'pa-IN') {
    return {
      reply: `Ashmit ji, main tuhadi gal changi tarah suni: "${message}". Phase 1 voice-first system active hai!`,
      lang: 'pa-IN',
      mood: 'friendly'
    };
  }

  return {
    reply: `Namaste Ashmit! Maine aapki baat dhyan se sun li: "${message}". Phase 1 voice-first system poori tarah active hai!`,
    lang: 'hi-IN',
    mood: 'friendly'
  };
}

// Only start listening when executed directly
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` SANSKRITI AI - Voice-First Server Started`);
    console.log(` Owner: Ashmit Kumar`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` RAM Footprint: <35MB (Windows 10 4GB RAM Optimized)`);
    console.log(`==================================================`);
  });
}

module.exports = server;
