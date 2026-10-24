/* Technician: everything that makes these the Technician drills. The shared app code reads it as EXAM_CONFIG. */
window.EXAM_CONFIG=(()=>{
/* ---------- pool figures ----------
   Figures T-1, T-2 and T-3 redrawn from the NCVEC originals with the same layout and part numbers, in the symbol
   drill's line style and in currentColor so they follow the theme. */
const FIG_DEFS=`<defs>
 <g id="fg-gnd"><path d="M-9 0H9M-7 0l-4 8M0 0l-4 8M7 0l-4 8"/></g>
 <g id="fg-plug"><circle r="16"/><path d="M-5-9v6M5-9v6M-6 1h12M-4 6h8"/></g>
</defs>`;
const FIG_NUM=(x,y,n)=>`<text x="${x}" y="${y}" class="fnum">${n}</text>`;
const FIGS={
"T-1":`<svg viewBox="0 0 360 215" role="img" aria-label="Figure T-1: a transistor switching a lamp; numbered parts 1 to 5">${FIG_DEFS}<g class="fln">
 <path d="M24 112l12 8-12 8M24 137l12 8-12 8"/><circle cx="51" cy="120" r="5"/><circle cx="51" cy="145" r="5"/>
 <path d="M51 150v30"/><use href="#fg-gnd" x="51" y="180"/>
 <path d="M56 120h38"/><polyline points="94,120 99,110 107,130 115,110 123,130 131,110 136,120"/><path d="M136 120h32"/>
 <circle cx="200" cy="120" r="32"/><path d="M168 120h20M188 102v36M188 112l30-18M188 128l30 18"/><path d="M218 146l-10-1 4-9z" fill="currentColor"/>
 <path d="M218 94V56h40M218 146v38"/><use href="#fg-gnd" x="218" y="184"/>
 <path d="M258 56v-6a12 12 0 0 1 24 0v6M262 56v-4a8 8 0 0 1 16 0v4M282 56h24v34"/>
 <path d="M288 90h36M296 98h20M288 106h36M296 114h20M306 114v52"/><use href="#fg-gnd" x="306" y="166"/>
</g>${FIG_NUM(115,98,1)}${FIG_NUM(186,76,2)}${FIG_NUM(270,32,3)}${FIG_NUM(342,108,4)}${FIG_NUM(51,210,5)}</svg>`,
"T-2":`<svg class="wide" viewBox="0 0 560 205" role="img" aria-label="Figure T-2: a power supply from wall plug to regulated output; numbered parts 1 to 10">${FIG_DEFS}<g class="fln">
 <use href="#fg-plug" x="40" y="118"/><path d="M40 102V45h30M40 134v46h135v-25"/>
 <rect x="70" y="40" width="26" height="10" rx="2"/><path d="M70 45h26"/><path d="M96 45h14"/><circle cx="114" cy="45" r="3.5"/><path d="M117 43l24-11"/><circle cx="145" cy="45" r="3.5"/><path d="M148.5 45H175v30"/>
 <path d="M175 75a9 9 0 0 1 0 18a9 9 0 0 1 0 18a9 9 0 0 1 0 18a9 9 0 0 1 0 18M205 72v84M215 72v84M245 75a9 9 0 0 0 0 18a9 9 0 0 0 0 18a9 9 0 0 0 0 18a9 9 0 0 0 0 18"/>
 <path d="M245 75V45h40M245 147v38"/><use href="#fg-gnd" x="245" y="185"/>
 <path d="M285 32v26l24-13z" fill="currentColor"/><path d="M309 32v26M309 45h231"/><circle cx="540" cy="45" r="4.5" fill="var(--panel)"/>
 <circle cx="350" cy="45" r="3.5" fill="currentColor"/><path d="M350 45v62M338 107h24M338 120q12-9 24 0M350 120v60"/><use href="#fg-gnd" x="350" y="180"/>
 <circle cx="410" cy="45" r="3.5" fill="currentColor"/><path d="M410 45v22"/><polyline points="410,67 400,72 420,80 400,88 420,96 410,101"/><path d="M410 101v16"/>
 <path d="M398 117h24l-12 22z" fill="currentColor"/><path d="M398 139h24M410 139v41"/><use href="#fg-gnd" x="410" y="180"/><path d="M420 128l10-8M425 136l10-8M428 118l2 2-3 0zM433 126l2 2-3 0z"/>
 <polyline points="430,45 436,36 444,54 452,36 460,54 468,36 474,45"/><path d="M452 68v-12"/><path d="M452 56l-4 7h8z" fill="currentColor"/><path d="M452 68h28v-23"/>
 <circle cx="480" cy="45" r="3.5" fill="currentColor"/><circle cx="495" cy="45" r="3.5" fill="currentColor"/>
 <path d="M495 45v22"/><path d="M483 67h24M483 67v4M507 67v-4"/><path d="M483 89h24l-12-22z" fill="currentColor"/><path d="M495 89v46"/><use href="#fg-gnd" x="495" y="135"/>
</g>${FIG_NUM(72,122,1)}${FIG_NUM(83,30,2)}${FIG_NUM(130,30,3)}${FIG_NUM(210,62,4)}${FIG_NUM(297,22,5)}${FIG_NUM(322,118,6)}${FIG_NUM(386,88,7)}${FIG_NUM(386,134,8)}${FIG_NUM(452,26,9)}${FIG_NUM(522,84,10)}</svg>`,
"T-3":`<svg viewBox="0 0 320 300" role="img" aria-label="Figure T-3: an antenna tuner; numbered parts 1 to 4">${FIG_DEFS}<g class="fln">
 <path d="M42 115q5-10 10 0t10 0h20"/><path d="M82 115h10M92 97v36M102 97v36M102 115h55"/><path d="M84 132l24-30"/><path d="M108 102l-7 1 3 6z" fill="currentColor"/>
 <circle cx="157" cy="115" r="4" fill="currentColor"/>
 <path d="M157 115h55M212 97v36M222 97v36M222 115h53V50"/><path d="M204 132l24-30"/><path d="M228 102l-7 1 3 6z" fill="currentColor"/>
 <path d="M257 32h36l-18 22z"/><path d="M275 54v-4"/>
 <path d="M157 119v26a9 9 0 0 0 0 18a9 9 0 0 0 0 18a9 9 0 0 0 0 18a9 9 0 0 0 0 18v30"/><circle cx="157" cy="247" r="4" fill="currentColor"/>
 <path d="M190 185h-20M190 185v62h-33"/><path d="M170 185l7-4-1 8z" fill="currentColor"/>
 <path d="M157 251v26"/><use href="#fg-gnd" x="157" y="277"/>
</g>${FIG_NUM(22,120,1)}${FIG_NUM(100,80,2)}${FIG_NUM(122,200,3)}${FIG_NUM(275,22,4)}</svg>`};
const FIG_KEY={"T-1":"1 resistor, 2 transistor, 3 lamp, 4 battery","T-2":"3 switch, 4 transformer, 6 capacitor, 8 light-emitting diode, 9 variable resistor","T-3":"3 variable inductor, 4 antenna"};
/* Demo mode's sample learner: per deck [first day, last day new cards came in (days ago), accuracy, share
   started]; three T8 cards missed yesterday; a fixed seed per deck. */
const DEMO_PLAN={t1:[21,12,.9],t2:[17,11,.72],t5:[15,9,.72],t8:[11,6,.75],symbols:[9,4,.6],math:[11,6,.7,.5],t3:[11,4,.62],t6:[9,3,.62],t7:[9,3,.62],t4:[5,2,.65,.5]};
const DEMO_LAPSE=["T8A02","T8B05","T8C03"];
const DEMO_SEED={t1:5,t2:6,t3:14,t4:1,t5:7,t6:4,t7:2,t8:1,math:1,symbols:7};
return {
  id:"technician",ns:"hamdrill:",demoNs:"hamdemo:",cachePrefix:"hamdrills-technician-v",
  exportApp:"hamdrill",exportName:"ham-drill",
  shortName:"Technician",over:"Amateur Radio Service",title:"Technician Class Operator License",studyTitle:"Technician study guide",
  poolYears:"2026-2030",aboutFacts:"FCC license class Technician, exam Element 2, radio service code HA.",
  examQ:35,pass:26,sections:10,idLetter:"T",mathGroups:["T5B","T5C","T5D"],
  figures:{FIGS,FIG_KEY},
  /* Words for the symbol drill and the Symbols study page; an exam without a symbols section leaves this out. */
  symbolText:{drill:"Twenty-one symbols drawn to match the three pool figures, plus the look-alikes the pool uses as wrong answers.",
    figsHead:"The three pool figures",figsNote:"Questions in T6 and T7 point at numbered parts of these drawings."},
  demo:{plan:DEMO_PLAN,lapse:DEMO_LAPSE,seed:DEMO_SEED}
};
})();
