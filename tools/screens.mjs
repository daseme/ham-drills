/* Screenshots of the app's screens in headless Chrome, for checking that a change leaves screens untouched.
     node tools/screens.mjs <baseUrl> <outDir> [--progress file.json] [--query ?demo] [--screens ",t1,about"]
   baseUrl is the folder holding the app's index.html (http://127.0.0.1:8812/technician/, or a file:/// URL).
   Each screen (a hash; empty is home) is saved as <outDir>/<screen>.png, 412 px wide, full height, light scheme,
   reduced motion, with Math.random seeded so shuffles repeat. --progress loads an export file as Technician
   progress (hamdrill: keys) with an exam 16 days out. Needs Google Chrome; dev use only, not part of the app. */
import {spawn} from "node:child_process";
import {mkdirSync, writeFileSync, readFileSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

const args = process.argv.slice(2), opt = {};
for (let i = 2; i < args.length; i += 2) opt[args[i].replace(/^--/, "")] = args[i + 1];
const [base, out] = args;
if (!base || !out) { console.error("usage: node tools/screens.mjs <baseUrl> <outDir> [--progress f] [--query q] [--screens list]"); process.exit(2) }
const query = opt.query || "", screens = (opt.screens ?? ",t1,t5/study,about,symbols,due,exam,hard").split(",");
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
mkdirSync(out, {recursive: true});

const FROZEN = Date.UTC(2026, 9, 20, 12);
const port = 9300 + Math.floor(Math.random() * 500), prof = mkdtempSync(join(tmpdir(), "screens-"));
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--no-first-run", "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank"], {stdio: "ignore"});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs = [];
for (let k = 0; k < 50 && !tabs.length; k++) { try { tabs = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).filter(t => t.type === "page") } catch {} if (!tabs.length) await sleep(200) }
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let seq = 0; const pending = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id] } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++seq; pending[i] = r; ws.send(JSON.stringify({id: i, method, params})) });
const evaluate = async expr => { const r = await cmd("Runtime.evaluate", {expression: expr, awaitPromise: true, returnByValue: true}); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || "evaluate failed"); return r.result.result.value };
const open = async url => { await cmd("Page.navigate", {url}); await sleep(900) };

try {
  await cmd("Page.enable"); await cmd("Runtime.enable");
  await cmd("Emulation.setDeviceMetricsOverride", {width: 412, height: 915, deviceScaleFactor: 1, mobile: true});
  await cmd("Emulation.setEmulatedMedia", {features: [{name: "prefers-color-scheme", value: "light"}, {name: "prefers-reduced-motion", value: "reduce"}]});
  /* Shuffles repeat (seeded Math.random) and the clock stands still at noon UTC on 2026-10-20, so the demo's relative
     dates ("Exam in 16 days, Thu, Nov 5") and badge days come out the same on any day, in any time zone. */
  await cmd("Page.addScriptToEvaluateOnNewDocument", {source: `(()=>{let x=12345;Math.random=()=>{x=x+0x6D2B79F5|0;let z=Math.imul(x^x>>>15,1|x);z=z+Math.imul(z^z>>>7,61|z)^z;return((z^z>>>14)>>>0)/4294967296};
    const R=Date,T=${FROZEN};function D(...a){if(!new.target)return new R(T).toString();return a.length?new R(...a):new R(T)}
    D.prototype=R.prototype;D.now=()=>T;D.UTC=R.UTC;D.parse=R.parse;window.Date=D})();`});
  await open(base + "index.html" + query);
  await evaluate(`localStorage.clear()`);
  if (opt.progress) {
    const d = JSON.parse(readFileSync(opt.progress, "utf8")), kv = {};
    for (const k in d.decks) kv["hamdrill:srs:" + k] = JSON.stringify(d.decks[k]);
    if (d.badges) kv["hamdrill:badges"] = JSON.stringify(d.badges);
    kv["hamdrill:examDay"] = String(Math.floor(FROZEN / 864e5) + 16);
    kv["hamdrill:prefs"] = JSON.stringify({showDate: true});
    await evaluate(`(()=>{const kv=${JSON.stringify(kv)};for(const k in kv)localStorage.setItem(k,kv[k])})()`);
  }
  for (const h of screens) {
    await open("about:blank");
    await open(base + "index.html" + query + (h ? "#" + h : ""));
    /* Fonts in, two frames drawn, and the version number masked: it changes with every release and is not a screen. */
    await evaluate(`document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`);
    await evaluate(`document.querySelectorAll(".links span, .about p").forEach(e=>{if(/Version \\d+/.test(e.innerHTML))e.innerHTML=e.innerHTML.replace(/Version \\d+/,"Version 0")})`);
    const {result} = await cmd("Page.getLayoutMetrics");
    const shot = await cmd("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, clip: {x: 0, y: 0, width: 412, height: Math.ceil(result.cssContentSize.height), scale: 1}});
    writeFileSync(join(out, (h || "home").replace(/\//g, "_") + ".png"), Buffer.from(shot.result.data, "base64"));
  }
} finally {
  ws.close(); chrome.kill(); await sleep(300);
  try { rmSync(prof, {recursive: true, force: true}) } catch {}
}
