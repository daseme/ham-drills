/* Draws icons/og.png, the 1200 by 630 share image every page's Open Graph tags name, in headless Chrome.
     node tools/og-image.mjs [outFile]
   The page is written to a temp folder and opened over file://, with the bundled fonts by absolute URL; the
   screenshot is the image. Fails if any font did not load, since fonts.ready resolves either way and the image
   would otherwise ship silently in a system face. Dev use only, run by hand when the wording changes; the PNG is
   committed and is not precached. Needs Google Chrome (CHROME env to point elsewhere). */
import {spawn} from "node:child_process";
import {mkdtempSync, writeFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] || join(ROOT, "icons", "og.png");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const W = 1200, H = 630;
const font = f => pathToFileURL(join(ROOT, "fonts", f)).href;

/* The app's dark scheme (app.css): background, ink, muted and amber. Every declared face is used, so each must load. */
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
@font-face{font-family:"Atkinson Hyperlegible";font-weight:400;src:url("${font("atkinson-hyperlegible-latin-400-normal.woff2")}") format("woff2")}
@font-face{font-family:"Atkinson Hyperlegible";font-weight:700;src:url("${font("atkinson-hyperlegible-latin-700-normal.woff2")}") format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:500;src:url("${font("barlow-condensed-latin-500-normal.woff2")}") format("woff2")}
@font-face{font-family:"Barlow Condensed";font-weight:600;src:url("${font("barlow-condensed-latin-600-normal.woff2")}") format("woff2")}
html,body{margin:0}
body{width:${W}px;height:${H}px;overflow:hidden;box-sizing:border-box;padding:70px 88px 64px;background:#11171D;color:#E3E8ED;
  font-family:"Atkinson Hyperlegible",sans-serif;display:flex;flex-direction:column;justify-content:space-between}
.over{font-family:"Barlow Condensed",sans-serif;font-weight:500;font-size:34px;letter-spacing:.06em;text-transform:uppercase;color:#E9A33E;margin:0}
h1{font-family:"Barlow Condensed",sans-serif;font-weight:600;font-size:132px;line-height:1;margin:6px 0 0;letter-spacing:.01em}
.why{font-size:38px;font-weight:700;margin:0;display:flex;gap:40px;white-space:nowrap}
.addr{font-size:30px;font-weight:400;color:#9AA7B3;margin:0}
</style></head><body>
<div><p class="over">Amateur Radio Service</p><h1>License exam drills</h1></div>
<p class="why"><span>Free.</span><span>No account.</span><span>Works offline.</span><span>Spaced review.</span></p>
<p class="addr">daseme.github.io/ham-drills &middot; Technician and General</p>
</body></html>`;

const dir = mkdtempSync(join(tmpdir(), "og-")), page = join(dir, "og.html"), prof = join(dir, "profile");
writeFileSync(page, html);
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank"], {stdio: "ignore"});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let code = 1;
try {
  let tabs = [];
  for (let k = 0; k < 50 && !tabs.length; k++) { try { tabs = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).filter(t => t.type === "page") } catch {} if (!tabs.length) await sleep(200) }
  if (!tabs.length) throw new Error("Chrome did not start at " + CHROME);
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let seq = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id] } };
  const cmd = (method, params = {}) => new Promise(r => { const i = ++seq; pending[i] = r; ws.send(JSON.stringify({id: i, method, params})) });
  const evaluate = async expr => { const r = await cmd("Runtime.evaluate", {expression: expr, awaitPromise: true, returnByValue: true}); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "evaluate failed"); return r.result.result.value };
  await cmd("Page.enable"); await cmd("Runtime.enable");
  await cmd("Emulation.setDeviceMetricsOverride", {width: W, height: H, deviceScaleFactor: 1, mobile: false});
  await cmd("Page.navigate", {url: pathToFileURL(page).href}); await sleep(500);
  const faces = await evaluate(`Promise.all([...document.fonts].map(f=>f.load().catch(()=>{}))).then(()=>document.fonts.ready).then(()=>[...document.fonts].map(f=>f.family+" "+f.weight+": "+f.status))`);
  const bad = faces.filter(s => !/: loaded$/.test(s));
  if (bad.length) throw new Error("fonts not loaded: " + bad.join(", "));
  await evaluate(`new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  const shot = await cmd("Page.captureScreenshot", {format: "png", clip: {x: 0, y: 0, width: W, height: H, scale: 1}});
  writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log(`wrote ${out} (${faces.length} fonts loaded)`);
  ws.close(); code = 0;
} catch (e) {
  console.error(e.message);
} finally {
  chrome.kill();
  await sleep(300);
  try { rmSync(dir, {recursive: true, force: true}) } catch {}
  process.exit(code);
}
