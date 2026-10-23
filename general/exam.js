/* General: everything that makes these the General drills. The shared app code reads it as EXAM_CONFIG. */
window.EXAM_CONFIG=(()=>{
/* ---------- pool figures ----------
   Figure G7-1 redrawn from the NCVEC original with the same layout and part numbers, in the Technician figures'
   line style and in currentColor so it follows the theme. Drawn in the original's coordinates, then scaled down;
   the helpers below return path data for each kind of part. */
const zigV=(x,y1,y2)=>{const h=(y2-y1)/6;let p=`M${x} ${y1}`;for(let i=0;i<6;i++)p+=`L${x+(i%2?-8:8)} ${y1+h*(i+.5)}`;return p+`L${x} ${y2}`};
const zigH=(x1,x2,y)=>{const w=(x2-x1)/6;let p=`M${x1} ${y}`;for(let i=0;i<6;i++)p+=`L${x1+w*(i+.5)} ${y+(i%2?8:-8)}`;return p+`L${x2} ${y}`};
/* A capacitor across a vertical wire: flat plate at y, curved plate below; wires end at y and y+9. */
const capV=(x,y)=>`M${x-12} ${y}H${x+12}M${x-12} ${y+13}Q${x} ${y+3} ${x+12} ${y+13}`;
/* The same across a horizontal wire: flat plate at x, curved plate to the right; wires end at x and x+9. */
const capH=(x,y)=>`M${x} ${y-12}V${y+12}M${x+13} ${y-12}Q${x+3} ${y} ${x+13} ${y+12}`;
/* A coil of n turns going down from (x,y), bulging to one side (side 1 right, 0 left). */
const coilV=(x,y,n,side)=>`M${x} ${y}`+`a7.5 7.5 0 0 ${side} 0 15`.repeat(n);
const GND=`<g id="fg-gnd7"><path d="M-12 0H12M-8 0l-6 11M0 0l-6 11M8 0l-6 11"/></g>`;
const gnd=(x,y)=>`<use href="#fg-gnd7" x="${x}" y="${y}"/>`;
const num=(x,y,n)=>`<text x="${x}" y="${y}" class="fnum" style="font-size:34px">${n}</text>`;
const wires=[
 /* supply rail and its series resistor, +DC down the right side */
 "M443 252H755",zigH(755,800,252),"M800 252H895","M895 241V340",
 /* bias divider to the NPN base */
 "M895 293H757V400",zigV(757,400,445),"M757 445V470",
 /* 6: output transformer, primary in the collector, solid core, secondary to OUT */
 coilV(895,340,4,0),"M895 400V448","M912 340V400M918 340V400",coilV(935,340,4,1),"M935 340H996","M935 400H955V430",
 /* tank capacitor across the primary */
 "M895 330H826V362",capV(826,362),"M826 371V430",
 /* 2: NPN transistor */
 "M727 470H862","M866 456V484","M866 463L895 448","M866 477L895 492","M895 492V532",
 /* 9: emitter resistor and bypass capacitor */
 "M895 532V550",zigV(895,550,600),"M895 600V672","M895 532H840V562",capV(840,562),"M840 571V672",
 /* base resistor to ground */
 "M727 470V500",zigV(727,500,548),"M727 548V672",
 /* coupling capacitor from the FET drain to the base */
 "M588 470H648",capH(648,470),"M657 470H727",
 /* 1: N-channel JFET, drain resistor up to the rail, source to the coil tap */
 "M588 252V305",zigV(588,305,352),"M588 352V470","M562 466H588M562 498H588M588 498V698H365V645H347","M558 462V502",
 /* 8: rail bypass capacitor */
 "M530 252V270",capV(530,270),"M530 279V345",
 /* 5: Zener */
 "M668 252V284","M654 284H682M654 284l-6 9M682 284l6-9","M668 300V360",
 /* 11: potentiometer and its fixed resistor; the wiper drives the varactor */
 "M443 252V278",zigV(443,278,328),"M443 328V362",zigV(443,362,410),"M443 410V428","M280 308H428",
 /* 4: varactor, 10: capacitor to the gate line, 3: diode, gate resistor */
 "M280 308V360","M266 360Q280 352 294 360M268 368H292","M280 384V482",
 "M280 482H377",capH(377,482),"M386 482H544","M420 482V505",zigV(420,505,555),"M420 555V602",
 "M478 482V521","M466 538H490","M478 538V618",
 /* tuning capacitor to ground, 7: tapped inductor */
 "M280 482V532",capV(280,532),"M280 541V595","M335 482V592",coilV(335,592,4,1),"M335 652V692"
];
const solids=[
 "M895 492l-13-3 6-10z", /* NPN emitter arrow, pointing out */
 "M558 482l-16-7v14z", /* JFET gate arrow, pointing in (N-channel) */
 "M656 300h24l-12-16z", /* Zener */
 "M268 384h24l-12-16z", /* varactor diode */
 "M466 521h24l-12 17z", /* diode 3, cathode to ground */
 "M428 308l-12-6v12z" /* potentiometer wiper */
];
const FIGS={
"G7-1":`<svg viewBox="0 0 520 330" role="img" aria-label="Figure G7-1: an oscillator and amplifier schematic; numbered parts 1 to 11"><defs>${GND}</defs>
<g transform="scale(.62) translate(-225 -192)">
 <g class="fln" style="stroke-width:3.2">${wires.map(d=>`<path d="${d}"/>`).join("")}
  <circle cx="550" cy="482" r="26"/><circle cx="880" cy="470" r="24"/>
  <circle cx="895" cy="236" r="5"/><circle cx="1001" cy="340" r="5"/>
  ${gnd(955,430)}${gnd(826,430)}${gnd(895,672)}${gnd(840,672)}${gnd(727,672)}${gnd(530,345)}${gnd(668,360)}${gnd(443,428)}${gnd(420,602)}${gnd(478,618)}${gnd(280,595)}${gnd(335,692)}</g>
 <g fill="currentColor">${solids.map(d=>`<path d="${d}"/>`).join("")}</g>
 ${num(550,440,1)}${num(930,482,2)}${num(506,566,3)}${num(244,382,4)}${num(628,284,5)}${num(952,326,6)}${num(308,644,7)}${num(560,282,8)}${num(934,588,9)}${num(381,456,10)}${num(408,296,11)}
 <text x="895" y="218" class="fnum" style="font-size:28px">+DC</text><text x="1006" y="327" class="fnum" style="font-size:28px;text-anchor:start">OUT</text>
</g></svg>`
};
const FIG_KEY={"G7-1":"1 field effect transistor, 2 NPN junction transistor, 5 Zener diode, 6 solid core transformer, 7 tapped inductor"};
return {
  id:"general",ns:"hamgeneral:",demoNs:null,cachePrefix:"hamdrills-general-v",
  exportApp:"hamdrill-general",exportName:"ham-general",
  shortName:"General",over:"Amateur Radio Service",title:"General Class Operator License",studyTitle:"General study guide",
  poolYears:"2023-2027",aboutFacts:"FCC license class General, exam Element 3, radio service code HG.",
  examQ:35,pass:26,sections:10,idLetter:"G",mathGroups:["G5B","G5C"],
  figures:{FIGS,FIG_KEY},
  demo:null
};
})();
