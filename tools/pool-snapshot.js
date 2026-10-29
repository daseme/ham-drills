/* Writes the committed snapshot of an exam's official pool, pools/<exam>.json, from the NCVEC .docx:
     node tools/pool-snapshot.js technician <pool.docx> "<download url>" <NCVEC page url>
   The snapshot holds the parsed pool and its source: the file's name and SHA-256, the link it was downloaded from,
   the NCVEC page that lists it, and every pool file that page listed at the time, so pool-fetch.js can tell a new
   errata release from the files already known. Run it again when the NCVEC publishes a new file, then fix data.js
   until pool-check passes. */
"use strict";
const fs=require("fs"),path=require("path");
const {parsePool,sha256,snapshotPath,makeSnapshot,snapshotText}=require("./pool-parse");

const LETTER={technician:"T",general:"G"};
const [exam,file,url,page]=process.argv.slice(2);
if(!LETTER[exam]||!file||!url||!page){console.error('usage: node tools/pool-snapshot.js <technician|general> <pool.docx> "<download url>" <page url>');process.exit(2)}
const poolFiles=html=>[...html.matchAll(/href="([^"]+\.docx)"/gi)].map(m=>m[1]);

(async()=>{
  const pool=parsePool(file,LETTER[exam]);
  if(pool.problems.length){console.error(pool.problems.join("\n"));process.exit(1)}
  const r=await fetch(page);
  if(!r.ok){console.error(`${r.status} for ${page}`);process.exit(1)}
  const listed=poolFiles(await r.text());
  if(!listed.includes(url)){console.error(`${page} does not list ${url}; the page lists:\n  ${listed.join("\n  ")}`);process.exit(1)}
  const source={file:path.basename(file),sha256:sha256(file),url,page,pageFiles:listed,saved:new Date().toISOString().slice(0,10)};
  fs.mkdirSync(path.dirname(snapshotPath(exam)),{recursive:true});
  fs.writeFileSync(snapshotPath(exam),snapshotText(makeSnapshot(pool,source)));
  console.log(`pools/${exam}.json: ${pool.questions.size} questions (${pool.withdrawn.length} withdrawn) from ${source.file}; the page lists ${listed.length} pool files`);
})();
