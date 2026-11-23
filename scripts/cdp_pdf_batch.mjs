/**
 * cdp_pdf_batch.mjs — 用本机 Chrome（DevTools Protocol）把本地 HTML 批量打印为 PDF
 *
 * 为什么不用 chrome --headless --print-to-pdf：本机实测该参数不出文件；
 * 改用远程调试端口 + Page.printToPDF，可稳定输出，且能保留背景色（printBackground）。
 *
 * 用法：
 *   node cdp_pdf_batch.mjs --dir <HTML目录> --outdir <PDF输出目录> [--only a,b] [--match 正则] [--port 9999]
 *   例：node cdp_pdf_batch.mjs --dir ../out/print --outdir ../out/pdf --match "^print_"
 *
 * 注意：
 *   1) 一台机器上同时只跑一个实例，跑完脚本会自动 taskkill 整棵进程树；
 *      若中途异常退出，残余调试实例会抢占资源，可先清理：
 *       Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*remote-debugging-port*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
 *   2) 打印参数固定为 A4、无边距、保留背景、按 CSS 页尺寸（preferCSSPageSize），
 *      与打印版 HTML 里的 @page{ size:A4 portrait; margin:0 } 配套，不要额外加缩放。
 */
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const argv = process.argv.slice(2);
const argOf = (n, d) => { const i = argv.indexOf('--' + n); return i > -1 && argv[i + 1] ? argv[i + 1] : d; };

function findChrome() {
  const explicit = argOf('chrome', '');
  if (explicit && fs.existsSync(explicit)) return explicit;
  const cands = [
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft\\Edge\\Application\\msedge.exe')
  ].filter(Boolean);
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw new Error('未找到 Chrome/Edge，请用 --chrome 指定可执行文件路径');
}

const CHROME = findChrome();
const DIR = path.resolve(argOf('dir', '.'));
const OUTDIR = path.resolve(argOf('outdir', './pdf'));
const MATCH = new RegExp(argOf('match', '\\.html$'));
const ONLY = argOf('only', '');
const PORT = Number(argOf('port', '9999'));
const UDD = argOf('udd', path.join(os.tmpdir(), 'marvis_chrome_batch_' + PORT));
const WAIT = Number(argOf('wait', '1800'));

fs.mkdirSync(OUTDIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html') && MATCH.test(f)).sort();
if (ONLY) {
  const want = ONLY.split(',').map((s) => s.trim()).filter(Boolean);
  files = files.filter((f) => want.includes(path.basename(f, '.html')));
}
if (!files.length) { console.error('no html matched in ' + DIR); process.exit(2); }
console.log('Chrome: ' + CHROME);
console.log('待打印(' + files.length + '): ' + files.join(', '));

const proc = spawn(CHROME, [
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + UDD,
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--allow-file-access-from-files',
  '--window-size=1400,1000', '--window-position=-3000,-3000',
  'about:blank'
], { stdio: 'ignore' });

async function waitPort() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return await r.json(); } catch {}
    await sleep(300);
  }
  throw new Error('devtools port not ready（可能有残留 Chrome 调试实例占用了端口）');
}

function rpc(ws, id, method, params) {
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params: params || {} }));
    setTimeout(() => { try { ws.removeEventListener('message', onMsg); } catch {} ; reject(new Error('timeout ' + method)); }, 60000);
  });
}

function pageCount(pdfPath) {
  const txt = fs.readFileSync(pdfPath).toString('latin1');
  const counts = [...txt.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  return counts.length ? Math.max(...counts) : '?';
}

const results = [];
try {
  await waitPort();
  let globalId = 0;
  for (const f of files) {
    const full = path.join(DIR, f);
    const url = 'file:///' + full.replace(/\\/g, '/');
    const out = path.join(OUTDIR, path.basename(f, '.html') + '.pdf');
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      let ws;
      try {
        const t = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
        const target = await t.json();
        ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
        const call = (method, params) => rpc(ws, ++globalId, method, params);
        await call('Page.enable');
        await call('Page.navigate', { url });
        await sleep(WAIT);
        const res = await call('Page.printToPDF', {
          printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false,
          marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0
        });
        fs.writeFileSync(out, Buffer.from(res.data, 'base64'));
        results.push({ file: f, pages: pageCount(out), kb: Math.round(fs.statSync(out).size / 1024), attempt });
        ok = true;
      } catch (e) {
        if (attempt === 3) results.push({ file: f, error: e.message });
        await sleep(1500);
      } finally { try { ws && ws.close(); } catch {} }
    }
  }
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    for (const t of list) { try { await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch {} }
  } catch {}
} catch (e) {
  console.error('FATAL ' + e.message);
} finally {
  try { execSync('taskkill /PID ' + proc.pid + ' /T /F', { stdio: 'ignore' }); } catch {}
  try { proc.kill('SIGKILL'); } catch {}
  for (const r of results) console.log(r.error ? `FAIL ${r.file} :: ${r.error}` : `OK   ${r.file}  pages=${r.pages}  ${r.kb}KB`);
  setTimeout(() => process.exit(0), 200);
}
