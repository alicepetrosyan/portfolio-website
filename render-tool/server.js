// Standalone live-render server for chaiko_mockup.glb.
// Serves a Three.js viewer on its own port and writes screenshots into public/images.
//
// Usage: node render-tool/server.js [port]

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 5050;

const THREE_BUILD = path.join(ROOT, 'node_modules', 'three', 'build', 'three.module.js');
const THREE_ADDONS = path.join(ROOT, 'node_modules', 'three', 'examples', 'jsm');
const MODEL = path.join(ROOT, 'public', 'assets', 'models', 'chaiko_mockup.glb');
const VIEWER = path.join(__dirname, 'viewer.html');
const CAPTURE = path.join(__dirname, 'capture.html');
const IMAGES_DIR = path.join(ROOT, 'public', 'images');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.json': 'application/json',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(body);
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not found: ' + filePath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  });
}

// Keep addon paths inside the jsm folder (no path traversal).
function safeAddon(rel) {
  const full = path.join(THREE_ADDONS, rel);
  if (!full.startsWith(THREE_ADDONS)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'POST' && pathname === '/screenshot') {
    let chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const { dataUrl } = JSON.parse(Buffer.concat(chunks).toString());
        const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl || '');
        if (!m) return send(res, 400, JSON.stringify({ ok: false, error: 'bad dataUrl' }), { 'Content-Type': MIME['.json'] });
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
        const outName = 'chaiko-mockup-render.png';
        const outPath = path.join(IMAGES_DIR, outName);
        fs.writeFileSync(outPath, Buffer.from(m[1], 'base64'));
        console.log('[screenshot] saved', outPath);
        send(res, 200, JSON.stringify({ ok: true, path: 'public/images/' + outName }), { 'Content-Type': MIME['.json'] });
      } catch (e) {
        send(res, 500, JSON.stringify({ ok: false, error: e.message }), { 'Content-Type': MIME['.json'] });
      }
    });
    return;
  }

  if (pathname === '/' || pathname === '/index.html') return sendFile(res, VIEWER);
  if (pathname === '/capture') return sendFile(res, CAPTURE);
  if (pathname === '/vendor/three.module.js') return sendFile(res, THREE_BUILD);
  if (pathname === '/vendor/three.core.js') return sendFile(res, path.join(ROOT, 'node_modules', 'three', 'build', 'three.core.js'));
  if (pathname.startsWith('/vendor/addons/')) {
    const addon = safeAddon(pathname.replace('/vendor/addons/', ''));
    if (!addon) return send(res, 403, 'forbidden');
    return sendFile(res, addon);
  }
  if (pathname === '/model/chaiko_mockup.glb') return sendFile(res, MODEL);
  if (pathname === '/jars.js') return sendFile(res, path.join(__dirname, 'jars.js'));
  if (pathname === '/favicon.ico') return send(res, 204, '');

  send(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`\n  chaiko render server running:`);
  console.log(`  →  http://localhost:${PORT}\n`);
  console.log(`  Open that URL to view/orbit the model, then click "Save to public/images".`);
});
