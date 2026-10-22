/* Paragraph text of a .docx, with no dependencies: a .docx is a zip, and the text is in word/document.xml. */
"use strict";
const fs=require("fs"),zlib=require("zlib");

function readZipEntry(buf,name){
  /* The end-of-central-directory record gives the directory's offset; each entry there points at its local header. */
  let e=buf.length-22;while(e>=0&&buf.readUInt32LE(e)!==0x06054b50)e--;
  if(e<0)throw new Error("not a zip file");
  let p=buf.readUInt32LE(e+16);const count=buf.readUInt16LE(e+10);
  for(let i=0;i<count;i++){
    const method=buf.readUInt16LE(p+10),size=buf.readUInt32LE(p+20),nlen=buf.readUInt16LE(p+28),xlen=buf.readUInt16LE(p+30),clen=buf.readUInt16LE(p+32),off=buf.readUInt32LE(p+42);
    if(buf.toString("utf8",p+46,p+46+nlen)===name){
      const data=off+30+buf.readUInt16LE(off+26)+buf.readUInt16LE(off+28),raw=buf.subarray(data,data+size);
      return method===0?raw:zlib.inflateRawSync(raw);
    }
    p+=46+nlen+xlen+clen;
  }
  throw new Error(name+" not found");
}

const ENT={amp:"&",lt:"<",gt:">",quot:'"',apos:"'"};
function docxParagraphs(file){
  const xml=readZipEntry(fs.readFileSync(file),"word/document.xml").toString("utf8");
  /* Superscript digits come back as ², ³, so P = I² x E reads as printed. */
  const sup=t=>t.replace(/[0-9]/g,c=>"⁰¹²³⁴⁵⁶⁷⁸⁹"[c]);
  const run=r=>{const t=r.replace(/<w:tab\/>/g,"\t").replace(/<w:br\/>/g,"\n").replace(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<[^>]+>/g,(m,t)=>t??"");
    return /<w:vertAlign w:val="superscript"\/>/.test(r)?sup(t):t};
  return xml.split(/<\/w:p>/).map(p=>p.split(/<\/w:r>/).map(run).join("")
    .replace(/&(#x?[0-9a-f]+|\w+);/gi,(m,c)=>c[0]==="#"?String.fromCodePoint(c[1]==="x"?parseInt(c.slice(2),16):+c.slice(1)):ENT[c]??m).trim()).filter(Boolean);
}
module.exports={docxParagraphs};
if(require.main===module)console.log(docxParagraphs(process.argv[2]).join("\n"));
