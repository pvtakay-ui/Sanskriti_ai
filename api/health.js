/**
 * SANSKRITI AI - Health Check Endpoint
 * Vercel Serverless Function & Node.js HTTP compatible
 * GET /api/health
 */

module.exports = (req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const memoryUsageMB = typeof process.memoryUsage === 'function'
    ? Math.round(process.memoryUsage().rss / 1024 / 1024)
    : 0;

  const responsePayload = {
    status: 'online',
    owner: 'Ashmit Kumar',
    project: 'Sanskriti AI',
    phase: 1,
    deployment: process.env.VERCEL ? 'Vercel Serverless' : 'Local Node.js',
    memoryUsageMB,
    nodeVersion: process.version,
    platform: process.platform,
    serverTime: new Date().toISOString()
  };

  // Support both Vercel res.status().json() and native Node res.statusCode / res.end()
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(responsePayload);
  } else {
    res.statusCode = 200;
    return res.end(JSON.stringify(responsePayload, null, 2));
  }
};

