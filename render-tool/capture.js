// Drives headless Edge over the DevTools Protocol to screenshot the WebGL render
// once the model has actually loaded and rendered (waits for window.__renderReady).
//
// Usage: node render-tool/capture.js [renderPort] [outputPath]

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const RENDER_PORT = Number(process.argv[2]) || 5055;
const OUT = process.argv[3] || path.resolve(__dirname, '..', 'public', 'images', 'chaiko-mockup-render.png');
const DEBUG_PORT = 9222;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = `http://localhost:${RENDER_PORT}/capture`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${DEBUG_PORT}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Minimal CDP client over the built-in WebSocket.
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', (e) => reject(new Error('ws error')));
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

async function main() {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cdp-'));
  const edge = spawn(EDGE, [
    '--headless=new',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--hide-scrollbars',
    '--window-size=1280,960',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDir}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    // Wait for the debugging endpoint to come up.
    let version = null;
    for (let i = 0; i < 40; i++) {
      try { version = await getJSON('/json/version'); break; } catch { await sleep(250); }
    }
    if (!version) throw new Error('DevTools endpoint never came up');

    // Find a page-level target (the about:blank tab) and connect to it so Page.* works.
    let pageTarget = null;
    for (let i = 0; i < 20; i++) {
      const targets = await getJSON('/json');
      pageTarget = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) break;
      await sleep(250);
    }
    if (!pageTarget) throw new Error('No page target found');

    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable').catch(() => {});
    await cdp.send('Network.enable').catch(() => {});
    // Surface page-side errors to our stdout for debugging.
    cdp.ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        console.error('[page-exception]', d.exception ? d.exception.description : d.text);
      } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        console.error('[page-console]', m.params.args.map((a) => a.value || a.description).join(' '));
      } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
        console.error('[page-log]', m.params.entry.text, m.params.entry.url || '');
      } else if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) {
        console.error('[page-404]', m.params.response.status, m.params.response.url);
      } else if (m.method === 'Network.loadingFailed') {
        console.error('[page-netfail]', m.params.errorText, m.params.requestId);
      }
    });
    await cdp.send('Page.navigate', { url: URL });

    // Poll the page for the readiness flag the capture page sets after rendering.
    let ready = false;
    for (let i = 0; i < 80; i++) { // up to ~40s
      await sleep(500);
      try {
        const r = await cdp.send('Runtime.evaluate', {
          expression: 'window.__renderReady === true ? "ready" : (document.title.startsWith("ERROR") ? document.title : "wait")',
          returnByValue: true,
        });
        const v = r.result && r.result.value;
        if (v === 'ready') { ready = true; break; }
        if (typeof v === 'string' && v.startsWith('ERROR')) throw new Error('Page reported ' + v);
      } catch (e) {
        if (String(e.message).startsWith('Page reported')) throw e;
      }
    }
    if (!ready) {
      try {
        const d = await cdp.send('Runtime.evaluate', { expression: 'String(window.__diag)', returnByValue: true });
        throw new Error('Render never signalled ready (diag=' + (d.result && d.result.value) + ')');
      } catch (e) { throw e; }
    }

    // One extra beat so the final frame is fully presented.
    await sleep(300);

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('SAVED', OUT, Math.round(fs.statSync(OUT).size / 1024) + 'KB');

    cdp.close();
  } finally {
    edge.kill();
    await sleep(300);
    try { fs.rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((e) => { console.error('CAPTURE FAILED:', e.message); process.exit(1); });
