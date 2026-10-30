/* Loads the app's own script (app/app.js, after an exam's exam.js and data.js) into a sandbox with a stub DOM and
   in-memory localStorage, so the tests run the code the app runs, with no build step. load() returns a fresh app
   each time; app.run("expression") evaluates inside it, where the script's top-level consts and functions live.
   load({data}) replaces the exam's data.js with the given source, for tests on sample decks. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");

const ROOT=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const script=read("app/app.js");
const version=read("version.js");

/* Any element the script asks for: properties can be set and read back, methods are no-ops, except that appended
   children are kept so a drill's answer buttons can be found and clicked. Elements are looked up by id and live for
   the whole app, where a browser would make a new one on every rebuild, so setting the innerHTML of an element
   found by id (a container) drops every element's children, as the rebuild of a card would; a created button
   setting its own label does not. */
function elements(){
  const made=[];
  function element(container){
    const kids=[];let html;
    const o={style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},appendChild(c){kids.push(c);return c},get children(){return kids},get firstChild(){return kids[0]||element()},
      get innerHTML(){return html},set innerHTML(v){html=v;if(container)for(const k of made)k.length=0}};
    made.push(kids);
    return new Proxy(o,{get:(t,k)=>k in t?t[k]:k==="querySelectorAll"?()=>[]:typeof k==="string"&&/^[a-z]/.test(k)&&!/^(innerHTML|textContent|hidden|checked|value|className|onclick|onchange)$/.test(k)?()=>element():undefined});
  }
  return element;
}

function load({exam="technician",search="",data,storage={}}={}){
  const store=new Map(Object.entries(storage)),els={},element=elements();
  const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),clear:()=>store.clear()};
  Object.defineProperty(localStorage,"keys",{value:()=>[...store.keys()]});
  const ctx={console,Date,Math,JSON,URLSearchParams,setTimeout:()=>0,Blob:class{},File:class{},localStorage,
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
    location:{search,hash:"",pathname:"/",protocol:"file:"},
    history:{state:null,replaceState(){},pushState(){},go(){}},navigator:{},scrollTo(){},addEventListener(){},
    document:{getElementById:id=>els[id]||(els[id]=element(true)),createElement:()=>element(),addEventListener(){},body:element(),hidden:false}};
  ctx.window=ctx;
  vm.createContext(ctx);
  vm.runInContext(version.replace("const APP_VERSION","var APP_VERSION"),ctx);
  vm.runInContext(read(`${exam}/exam.js`),ctx);
  vm.runInContext(data??read(`${exam}/data.js`),ctx);
  vm.runInContext(`${script}\n;globalThis.run=e=>eval(e);`,ctx);
  /* Results are copied out through JSON: objects made in the sandbox have its prototypes, which deepStrictEqual rejects. */
  const copy=v=>v===undefined?v:JSON.parse(JSON.stringify(v));
  return {run:e=>copy(ctx.run(e)),runAsync:async e=>copy(await ctx.run(e)),keys:()=>[...store.keys()],els};
}
module.exports={load,script:()=>script};
