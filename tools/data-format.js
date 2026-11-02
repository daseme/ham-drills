/* Writes an exam's data.js (window.DECKS) or explain.js (window.EXPLAIN) in a fixed layout, one question or one
   explanation per line, so a content fix diffs as the lines it touched.
     node tools/data-format.js technician/data.js technician/explain.js [general/... ]
     node tools/data-format.js --check <files>     exits 1 if any file is not already in the layout (CI runs this)
   The values are unchanged: the file is loaded as the app loads it and written back with JSON.stringify. Any comment
   before the window.DECKS= or window.EXPLAIN= is kept. A file holds one of the two: the explanations load after the
   first screen, so they live apart from the questions. Arrays, and objects with many entries or nested values, go one
   entry per line. */
"use strict";
const fs=require("fs"),vm=require("vm");

function format(src){
  const w={};vm.runInNewContext(src,{window:w});
  const kinds=Object.keys(w);
  if(kinds.length!==1||!["DECKS","EXPLAIN"].includes(kinds[0]))throw new Error("a file sets window.DECKS (data.js) or window.EXPLAIN (explain.js), nothing else; this one sets "+(kinds.join(", ")||"neither"));
  const kind=kinds[0],at=src.indexOf("window."+kind+"=");
  if(at<0)throw new Error("no window."+kind+"= in file");
  const head=src.slice(0,at).trimEnd();
  if(kind==="DECKS"&&!Array.isArray(w.DECKS))throw new Error("window.DECKS is not an array");
  const expand=v=>Array.isArray(v)||(v&&typeof v==="object"&&(Object.keys(v).length>8||Object.values(v).some(x=>x&&typeof x==="object")));
  const field=v=>{
    if(!expand(v))return JSON.stringify(v);
    if(Array.isArray(v))return "[\n"+v.map(x=>JSON.stringify(x)).join(",\n")+"\n]";
    return "{\n"+Object.entries(v).map(([k,x])=>JSON.stringify(k)+":"+JSON.stringify(x)).join(",\n")+"\n}";
  };
  const deck=d=>"{\n"+Object.entries(d).map(([k,v])=>JSON.stringify(k)+":"+field(v)).join(",\n")+"\n}";
  const body=kind==="DECKS"?"window.DECKS=[\n"+w.DECKS.map(deck).join(",\n")+"\n];\n"
    :"window.EXPLAIN={\n"+Object.entries(w.EXPLAIN).map(([k,v])=>JSON.stringify(k)+":"+JSON.stringify(v)).join(",\n")+"\n};\n";
  return (head?head+"\n":"")+body;
}

if(require.main===module){
  const args=process.argv.slice(2),check=args[0]==="--check",files=check?args.slice(1):args;
  if(!files.length){console.error("usage: node tools/data-format.js [--check] <data.js|explain.js ...>");process.exit(2)}
  let bad=0;
  for(const f of files){
    /* Git on Windows may check the file out with CRLF; the layout is judged on LF, which is what the index holds. */
    const src=fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n"),out=format(src);
    if(check){if(out!==src){console.log(`${f}: not formatted; run node tools/data-format.js ${f}`);bad++}else console.log(`${f}: formatted`)}
    else if(out!==src){fs.writeFileSync(f,out);console.log(`${f}: formatted`)}
    else console.log(`${f}: already formatted`);
  }
  process.exit(bad?1:0);
}
module.exports={format};
