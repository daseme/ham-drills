/* Reads an NCVEC question pool .docx: every live question with its answer, the questions withdrawn by errata, and
   each section's name and exam count. Shared by pool-check.js and pool-import.js.
   A question is its id line "G1A05 (A) [97.301(d)]", the stem, options A. to D., then a "~~" line; a withdrawn one is
   a line like "G1A04  Question Deleted (section not renumbered)". */
"use strict";
const {docxParagraphs}=require("./docx-text");

function parsePool(file,letter){
  const lines=docxParagraphs(file),L=letter;
  const questions=new Map(),withdrawn=[],sections={},groups={},problems=[];
  /* @ stands for the exam's id letter (T, G). */
  const re=(src,f)=>new RegExp(src.replace(/@/g,L),f);
  const idLine=re(String.raw`^(@\d[A-Z]\d\d)\s*\(([A-D])\)`),gone=re(String.raw`^(@\d[A-Z]\d\d)\s+Question Deleted`,"i");
  const sectionLine=re(String.raw`^SUBELEMENT (@\d)\s*[–-]\s*(.+?)\s*\[(\d+) Exam Questions`,"i"),groupLine=re(String.raw`^(@\d[A-Z])\s+(?:[–-]\s*)?(\D.*)$`);
  for(let i=0;i<lines.length;i++){
    const l=lines[i];let m;
    if((m=l.match(sectionLine))){sections[m[1]]={name:m[2],exam:+m[3]};continue}
    if((m=l.match(gone))){withdrawn.push(m[1]);continue}
    if((m=l.match(idLine))){
      const block=[];for(i++;i<lines.length&&lines[i]!=="~~";i++)block.push(lines[i]);
      const at=block.findIndex(x=>/^A\.\s/.test(x)),opts=block.slice(at,at+4);
      if(at<1||opts.length!==4||!opts.every((o,k)=>o.startsWith("ABCD"[k]+"."))){problems.push(`${m[1]}: couldn't parse in the pool file`);continue}
      const stem=block.slice(0,at).join(" "),fig=(stem.match(/figure\s+([A-Z]\d?-\d+)/i)||[])[1];
      questions.set(m[1],{stem,opts:opts.map(o=>o.slice(2).trim()),ans:"ABCD".indexOf(m[2]),fig:fig&&fig.toUpperCase()});
      continue;
    }
    if((m=l.match(groupLine)))groups[m[1]]=m[2].trim();
  }
  return {questions,withdrawn,sections,groups,problems};
}
module.exports={parsePool};
