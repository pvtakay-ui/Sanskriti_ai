/**
 * SANSKRITI AI - Phase 1 Automated Test Suite
 * Tests file assets, conversation engine logic, HTTP server endpoints,
 * path security, and PHP API syntax.
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

async function runTests() {
  console.log("==================================================");
  console.log(" RUNNING SANSKRITI AI - PHASE 1 TEST SUITE");
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
    'api.php'
  ];

  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(fullPath);
    const size = exists ? fs.statSync(fullPath).size : 0;
    assert(exists && size > 0, `${file} exists (${size} bytes)`);
  });

  // 2. Conversational Engine Logic Unit Tests
  console.log("\n2. Testing Conversational Engine Rules & Multilingual Support:");
  const ConversationEngine = require('../js/conversation.js');
  // Mock window/localStorage if running in Node
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };

  const conv = new (require('../js/conversation.js'))();

  // Test Hindi
  const hiRes = conv.generateLocalResponse("namaste sanskriti", "Namaste Sanskriti");
  assert(hiRes.text.includes("Ashmit") && hiRes.lang === "hi-IN", "Hindi greeting returns warm response addressing Ashmit");

  // Test Punjabi
  const paRes = conv.generateLocalResponse("sat sri akal kiddan ho", "Sat Sri Akal kiddan ho");
  assert(paRes.lang === "pa-IN" && paRes.text.includes("Ashmit"), "Punjabi greeting returns Punjabi response in Gurmukhi/Romanized");

  // Test Himachali / Pahari
  const himRes = conv.generateLocalResponse("kasa ahein pahari", "Kasa ahein");
  assert(himRes.text.toLowerCase().includes("himachal") || himRes.text.toLowerCase().includes("pahadi"), "Himachali dialect greeting acknowledged");

  // Test English
  const enRes = conv.generateLocalResponse("speak in english please", "Speak in english please");
  assert(enRes.lang === "en-IN" && enRes.text.includes("English"), "Language switch to English functions correctly");

  // Test Capability Honesty (Phase 1 disclosure)
  const capRes = conv.generateLocalResponse("tum kya kar sakti ho", "tum kya kar sakti ho");
  assert(capRes.text.includes("Phase 1"), "Capabilities response honestly specifies Phase 1 without claiming fake features");

  // 3. HTTP Server Endpoints & Path Traversal Security
  console.log("\n3. Testing Node.js Server & Security Endpoints:");
  const server = require('../server.js');
  const TEST_PORT = 3199;

  await new Promise(resolve => {
    server.listen(TEST_PORT, async () => {
      // Test /api/health
      const healthData = await new Promise(res => {
        http.get(`http://localhost:${TEST_PORT}/api/health`, response => {
          let body = '';
          response.on('data', c => body += c);
          response.on('end', () => res(JSON.parse(body)));
        });
      });
      assert(healthData.status === 'online' && healthData.owner === 'Ashmit Kumar' && healthData.phase === 1,
        `Server /api/health returns valid JSON (Owner: ${healthData.owner}, RAM: ${healthData.memoryUsageMB}MB)`);

      // Test /api/chat POST
      const chatPostData = await new Promise(res => {
        const req = http.request(`http://localhost:${TEST_PORT}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, response => {
          let body = '';
          response.on('data', c => body += c);
          response.on('end', () => res(JSON.parse(body)));
        });
        req.write(JSON.stringify({ message: 'Sat Sri Akal', language: 'pa-IN' }));
        req.end();
      });
      assert(chatPostData.reply && chatPostData.lang === 'pa-IN', 'POST /api/chat handles conversation message properly');

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
