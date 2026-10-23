/* General: everything that makes these the General drills. The shared app code reads it as EXAM_CONFIG. */
window.EXAM_CONFIG=(()=>{
/* Pool figures, drawn as inline SVG in the same line style as Technician's; G7-1 is added with section G7. */
const FIGS={},FIG_KEY={};
return {
  id:"general",ns:"hamgeneral:",demoNs:null,cachePrefix:"hamdrills-general-v",
  exportApp:"hamdrill-general",exportName:"ham-general",
  shortName:"General",over:"Amateur Radio Service",title:"General Class Operator License",studyTitle:"General study guide",
  poolYears:"2023-2027",aboutFacts:"FCC license class General, exam Element 3, radio service code HG.",
  examQ:35,pass:26,sections:10,idLetter:"G",mathGroups:[],
  figures:{FIGS,FIG_KEY},
  demo:null
};
})();
