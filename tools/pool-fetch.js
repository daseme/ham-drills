/* Fetches the official pools from the NCVEC and compares each with its committed snapshot, pools/<exam>.json:
     node tools/pool-fetch.js [technician|general] [--file <pool.docx>]
   Exit 1 when a download differs from the snapshot, or when the NCVEC page lists a pool file the snapshot has not
   seen, which is how an errata release shows up. Exit 2 when the NCVEC can't be reached, which is not a change:
   the site sits behind Cloudflare, which refuses GitHub's runners, so this is run by hand (both exams when none
   is named). --file compares a local copy of one exam's file instead of downloading and skips the page. */
"use strict";
const fs=require("fs"),os=require("os"),path=require("path");
const {parsePool,loadPool,sha256,snapshotPath,diffPools}=require("./pool-parse");

const LETTER={technician:"T",general:"G"};
const args=process.argv.slice(2),at=args.indexOf("--file"),local=at<0?null:args.splice(at,2)[1];
const exams=args.length?args:Object.keys(LETTER);
if(!exams.every(e=>LETTER[e])||(at>=0&&(!local||exams.length!==1))){console.error("usage: node tools/pool-fetch.js [technician|general] [--file <pool.docx>]");process.exit(2)}
/* The NCVEC's links carry spaces as spaces; one already encoded is left alone. */
const enc=u=>/%[0-9A-F]{2}/i.test(u)?u:encodeURI(u);
const get=async u=>{const r=await fetch(enc(u),{headers:{"user-agent":"ham-drills pool watch (https://github.com/daseme/ham-drills)"}});if(!r.ok)throw new Error(`${r.status} for ${u}`);return r};

async function check(exam){
  const snap=loadPool(snapshotPath(exam),LETTER[exam]),src=snap.source;
  const problems=[];
  let file=local,tmp=null;
  if(!local){
    try{
      const listed=[...(await (await get(src.page)).text()).matchAll(/href="([^"]+\.docx)"/gi)].map(m=>m[1]);
      for(const f of listed)if(!src.pageFiles.includes(f))problems.push(`the NCVEC page lists a pool file this snapshot has not seen: ${f}`);
      if(!listed.includes(src.url))problems.push(`the NCVEC page no longer lists ${src.url}`);
      tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pool-"));file=path.join(tmp,src.file);
      fs.writeFileSync(file,Buffer.from(await (await get(src.url)).arrayBuffer()));
    }catch(e){console.error(`could not reach the NCVEC: ${e.message}`);return 2}
  }
  const hash=sha256(file);
  if(hash!==src.sha256){
    const pool=parsePool(file,LETTER[exam]),d=pool.problems.concat(diffPools(snap,pool));
    problems.push(`${path.basename(file)}: SHA-256 ${hash}; the snapshot was made from ${src.file}, ${src.sha256}`);
    problems.push(d.length?`the text differs:\n    ${d.join("\n    ")}`:"the text parses the same; only the file's bytes differ");
  }
  if(tmp)fs.rmSync(tmp,{recursive:true,force:true});
  if(problems.length){console.log(`${exam}: the official pool has changed\n  ${problems.join("\n  ")}\n  Run tools/pool-snapshot.js, then pool-check.js, and fix data.js.`);return 1}
  console.log(`${exam}: ${src.file} unchanged, ${snap.questions.size} questions${local?"":"; the NCVEC page lists nothing new"}`);
  return 0;
}
(async()=>{let worst=0;for(const e of exams)worst=Math.max(worst,await check(e));process.exit(worst)})();
