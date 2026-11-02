/* The front door: what a stranger, a search engine or a link preview sees. The splash's footer states two facts and
   the splash links to the demo; every page has a description, a canonical address for its own path and Open Graph tags that
   agree with it, all naming one share image; the sitemap lists the pages that exist and nothing else. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),vm=require("vm");

const ROOT=path.join(__dirname,"..");
const SITE="https://daseme.github.io/ham-drills/";
/* Path on the site -> file in the repo. */
const PAGES={"":"index.html","about.html":"about.html","resources.html":"resources.html","technician/":"technician/index.html","general/":"general/index.html"};
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const meta=(html,attr,name)=>{const m=html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)">`));return m&&m[1]};
const link=(html,rel)=>{const m=html.match(new RegExp(`<link rel="${rel}" href="([^"]*)">`));return m&&m[1]};
const config=exam=>{const ctx={window:{}};vm.createContext(ctx);vm.runInContext(read(exam+"/exam.js"),ctx);return ctx.window.EXAM_CONFIG};

test("the splash's footer states the two facts, and the splash links to the demo",()=>{
  const h=read("index.html"),foot=h.indexOf('<div class="foot">');assert.ok(foot>0);
  for(const f of ["No account.","Works offline."])assert.ok(h.indexOf(`<b>${f}</b>`)>foot,f);
  for(const f of ["Free.","Spaced review."])assert.ok(!h.includes(`<b>${f}</b>`),f);
  assert.match(h,/href="technician\/\?demo"/);
});

test("every page has one description, a canonical for its own path, and Open Graph tags that agree",()=>{
  for(const p in PAGES){const f=PAGES[p],h=read(f);
    const d=meta(h,"name","description");
    assert.ok(d&&d.length>=50&&d.length<=200,`${f}: description of ${d&&d.length} characters`);
    assert.equal((h.match(/<meta name="description"/g)||[]).length,1,f);
    assert.equal(link(h,"canonical"),SITE+p,`${f}: canonical`);
    assert.equal(meta(h,"property","og:url"),SITE+p,`${f}: og:url`);
    assert.equal(meta(h,"property","og:description"),d,`${f}: og:description`);
    assert.equal(meta(h,"property","og:title"),h.match(/<title>([^<]*)<\/title>/)[1],`${f}: og:title`);
    assert.equal(meta(h,"property","og:type"),"website",f);
    assert.equal(meta(h,"name","twitter:card"),"summary_large_image",f);
    assert.ok(meta(h,"property","og:image:alt"),`${f}: og:image:alt`)}
});

test("every page names the one share image, a 1200 by 630 PNG in the repo",()=>{
  const imgs=new Set(Object.values(PAGES).map(f=>meta(read(f),"property","og:image")));
  assert.equal(imgs.size,1,[...imgs].join(" "));
  const [img]=imgs;assert.ok(img.startsWith(SITE),img);
  const file=path.join(ROOT,img.slice(SITE.length));assert.ok(fs.existsSync(file),img);
  const b=fs.readFileSync(file);
  assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a","PNG signature");
  assert.equal(b.readUInt32BE(16),1200,"width");assert.equal(b.readUInt32BE(20),630,"height");
  for(const f of Object.values(PAGES)){const h=read(f);
    assert.equal(meta(h,"property","og:image:width"),"1200",f);assert.equal(meta(h,"property","og:image:height"),"630",f)}
});

test("each exam page's description names its pool years and exam",()=>{
  for(const e of ["technician","general"]){const c=config(e),d=meta(read(e+"/index.html"),"name","description");
    assert.ok(d.includes(`${c.poolYears} ${c.shortName}`),`${e}: ${d}`)}
});

test("the sitemap lists every page and nothing else, each a file that exists",()=>{
  const locs=[...read("sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g)].map(m=>m[1]);
  assert.deepEqual(locs.sort(),Object.keys(PAGES).map(p=>SITE+p).sort());
  for(const l of locs)assert.ok(fs.existsSync(path.join(ROOT,PAGES[l.slice(SITE.length)])),l);
});

test("the about page points problems at the repository's issues",()=>{
  assert.match(read("about.html"),/href="https:\/\/github\.com\/daseme\/ham-drills\/issues"/);
});
