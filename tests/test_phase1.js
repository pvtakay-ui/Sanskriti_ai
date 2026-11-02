/**
 * SANSKRITI AI - Phase 1 & Vercel Deployment Automated Test Suite
 * Tests file assets, conversation engine logic, Vercel serverless functions,
 * Node.js HTTP server, security headers, and path traversal protection.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
  }
}

// Mock Response object supporting both Vercel Serverless and Node HTTP formats
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = '';
    this.ended = false;
  }

  setHeader(key, value) {
    this.headers[key.toLowerCase()] = value;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.body = JSON.stringify(data);
    this.ended = true;
    return this;
  }

  end(data) {
    if (data) this.body = data;
    this.ended = true;
    return this;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log(" RUNNING SANSKRITI AI - TEST SUITE (PHASE 1 & VERCEL)");
  console.log("==================================================");

  // 1. File Integrity & Assets Check
  console.log("\n1. Verifying Files & Character Assets:");
  const requiredFiles = [
    'assets/images/sanskriti_avatar.jpg',
    'assets/images/sanskriti_er_diagram.png',
    'assets/icons/lotus.svg',
    'index.html',
    'css/style.css',
    'js/app.js',
    'js/conversation.js',
    'js/speech_synthesis.js',
    'js/voice.js',
    'manifest.json',
    'sw.js',
    'server.js',
    'api.php',
    'api/health.js',
    'api/chat.js',
    'vercel.json',
    'package.json',
    '.env.example'
  ];

  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    assert(exists && size > 0, `${file} exists (${size} bytes)`);
  });

  // 2. Vercel Configuration & Package Manifest Validation
  console.log("\n2. Validating Vercel Configuration & package.json:");
  const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  assert(vercelConfig.cleanUrls === true, "vercel.json has cleanUrls enabled");

  const micHeaderRule = vercelConfig.headers.find(h => h.headers.some(hdr => hdr.key === 'Permissions-Policy'));
  assert(micHeaderRule && micHeaderRule.headers.some(h => h.value.includes('microphone=(self)')),
    "vercel.json includes 'Permissions-Policy: microphone=(self)' for HTTPS voice access");

  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert(packageJson.scripts && packageJson.scripts.start && packageJson.scripts.test,
    "package.json includes required 'start' and 'test' scripts");

  // 3. Vercel Serverless Function Unit Tests
  console.log("\n3. Testing Vercel Serverless Functions Directly:");
  const healthFunction = require('../api/health.js');
  const chatFunction = require('../api/chat.js');

  // Test api/health.js
  const mockHealthReq = { method: 'GET' };
  const mockHealthRes = new MockResponse();
  healthFunction(mockHealthReq, mockHealthRes);
  const parsedHealth = JSON.parse(mockHealthRes.body);
  assert(mockHealthRes.statusCode === 200 && parsedHealth.status === 'online' && parsedHealth.owner === 'Ashmit Kumar',
    `api/health.js returns online status for owner: ${parsedHealth.owner}`);

  // Test api/chat.js (Method guard)
  const mockChatGetReq = { method: 'GET' };
  const mockChatGetRes = new MockResponse();
  await chatFunction(mockChatGetReq, mockChatGetRes);
  assert(mockChatGetRes.statusCode === 405, "api/chat.js rejects GET requests with 405 Method Not Allowed");

  // Test api/chat.js (POST conversation)
  const mockChatPostReq = {
    method: 'POST',
    body: { message: 'Sat Sri Akal Sanskriti ji', language: 'pa-IN' }
  };
  const mockChatPostRes = new MockResponse();
  await chatFunction(mockChatPostReq, mockChatPostRes);
  const parsedChat = JSON.parse(mockChatPostRes.body);
  assert(mockChatPostRes.statusCode === 200 && parsedChat.reply && parsedChat.lang === 'pa-IN',
    "api/chat.js processes Punjabi POST request correctly");

  // 4. Conversational Engine Logic Unit Tests
  console.log("\n4. Testing Conversational Engine Rules & Multilingual Intelligence:");
  // Mock window/localStorage if running in Node
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };

  const ConversationEngine = require('../js/conversation.js');
  const conv = new ConversationEngine();

  // Test Hindi
  const hiRes = conv.generateLocalResponse("namaste sanskriti", "Namaste Sanskriti");
  assert(hiRes.text.includes("Ashmit") && hiRes.lang === "hi-IN", "Hindi greeting returns warm response addressing Ashmit");

  // Test Punjabi
  const paRes = conv.generateLocalResponse("sat sri akal kiddan ho", "Sat Sri Akal kiddan ho");
  assert(paRes.lang === "pa-IN" && paRes.text.includes("Ashmit"), "Punjabi greeting returns Punjabi response");

  // Test Himachali / Pahari
  const himRes = conv.generateLocalResponse("kasa ahein pahari", "Kasa ahein");
  assert(himRes.text.toLowerCase().includes("himachal") || himRes.text.toLowerCase().includes("pahadi"),
    "Himachali dialect greeting acknowledged");

  // Test English
  const enRes = conv.generateLocalResponse("speak in english please", "Speak in english please");
  assert(enRes.lang === "en-IN" && enRes.text.includes("English"), "Language switch to English functions correctly");

  // Test Capability Honesty (Phase 1 disclosure)
  const capRes = conv.generateLocalResponse("tum kya kar sakti ho", "tum kya kar sakti ho");
  assert(capRes.text.includes("Phase 1"), "Capabilities response honestly specifies Phase 1 without claiming fake features");

  // 5. Node.js Local Server Endpoints & Path Traversal Security
  console.log("\n5. Testing Local Node.js Server & Parity:");
  const server = require('../server.js');
  const TEST_PORT = 3198;

  await new Promise(resolve => {
    server.listen(TEST_PORT, async () => {
      // Test /api/health over HTTP
      const healthData = await new Promise(res => {
        http.get(`http://localhost:${TEST_PORT}/api/health`, response => {
          let body = '';
          response.on('data', c => body += c);
          response.on('end', () => res(JSON.parse(body)));
        });
      });
      assert(healthData.status === 'online' && healthData.owner === 'Ashmit Kumar' && healthData.phase === 1,
        `server.js delegates to api/health.js (Status: ${healthData.status}, RAM: ${healthData.memoryUsageMB}MB)`);

      // Test /api/chat POST over HTTP
      const chatPostData = await new Promise(res => {
        const req = http.request(`http://localhost:${TEST_PORT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, response => {
          let body = '';
          response.on('data', c => body += c);
          response.on('end', () => res(JSON.parse(body)));
        });
        req.write(JSON.stringify({ message: 'Namaste Sanskriti', language: 'hi-IN' }));
        req.end();
      });
      assert(chatPostData.reply && chatPostData.lang === 'hi-IN',
        'server.js delegates to api/chat.js properly over HTTP');

      // Test Static File Serving
      const htmlStatus = await new Promise(res => {
        http.get(`http://localhost:${TEST_PORT}/index.html`, response => {
          res(response.statusCode);
        });
      });
      assert(htmlStatus === 200, 'GET /index.html serves static HTML with 200 OK');

      // Test Path Traversal Attack Prevention
      const hackStatus = await new Promise(res => {
        http.get(`http://localhost:${TEST_PORT}/../../../../windows/win.ini`, response => {
          res(response.statusCode);
        });
      });
      assert(hackStatus === 403 || hackStatus === 404, `Path traversal prevented with HTTP ${hackStatus}`);

      server.close(() => resolve());
    });
  });

  console.log("\n==================================================");
  console.log(` TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
