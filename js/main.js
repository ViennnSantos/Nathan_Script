const TK="nathan-theme";
function applyTheme(t){document.documentElement.dataset.theme=t;try{localStorage.setItem(TK,t)}catch(e){}const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==="dark"?"#101216":"#fbf8f2"}
{let t="light";try{if(localStorage.getItem(TK)==="dark")t="dark"}catch(e){}applyTheme(t)}
// ---------- Data ----------
const CATS=["FIRST NSF","SECOND NSF","SETTLEMENT OFFERS","STOP PAYMENT","BLOCKED ACCOUNTS","CLOSED ACCOUNTS","CLIENT RESPONSE","CALL/SMS"];
const TYPES={email:"Email",sms:"SMS",nego:"Nego with Client",voicemail:"Voicemail / Call script"};
// Which sections each category shows (nego only where appropriate)
const SECS={};CATS.slice(0,6).forEach(c=>SECS[c]=["email","sms","nego"]);SECS["CLIENT RESPONSE"]=["email","sms"];SECS["CALL/SMS"]=["voicemail","sms"];
const ICON={star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',plus:'<path d="M12 5v14M5 12h14"/>',home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',doc:'<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',moon:'<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',chev:'<path d="M6 9l6 6 6-6"/>'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>"s_"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

// ---------- Storage abstraction (swap this object for a backend later) ----------
const KEY="nathan-toolkit-v1";
const Store={
  mem:null,ok:true,
  load(){try{const r=localStorage.getItem(KEY);if(!r)return null;const d=JSON.parse(r);if(!d||!Array.isArray(d.scripts))throw 0;
      return d.scripts.filter(s=>s&&s.id&&s.title&&CATS.includes(s.category)&&TYPES[s.type])}catch(e){this.ok=false;return null}},
  save(list){this.mem=list;try{localStorage.setItem(KEY,JSON.stringify({v:1,scripts:list}));return true}catch(e){this.ok=false;return false}}
};
const PH="[PLACEHOLDER – replace with approved wording]";
const now=()=>new Date().toISOString();
const ph=(title,category,type,subject)=>({id:uid(),title,category,type,subject:subject||"",body:PH,favorite:false,placeholder:true,created:now(),updated:now()});
function seed(){return[
 ph("PAYMENT CONFIRMATION REQUEST","CLIENT RESPONSE","email","[Client Name] - [Subject TBD] - Infinity Finance"),
 ph("REMINDER YOUR PAYMENT IS DUE TODAY","CLIENT RESPONSE","email","[Client Name] - [Subject TBD] - Infinity Finance"),
 ph("VOICEMAIL TO CLIENT","CALL/SMS","voicemail"),ph("VOICEMAIL TO REFERENCE","CALL/SMS","voicemail"),ph("VOICEMAIL TO WORK","CALL/SMS","voicemail")]}
let scripts=Store.load();let corrupt=false;
if(!scripts){scripts=seed();Store.save(scripts)}
let view={page:"home",cat:null},q="",cq="",ft="all",collapsed={};

// ---------- Helpers ----------
function toast(m,err){const t=document.createElement("div");t.className="t"+(err?" e":"");t.textContent=m;document.getElementById("toast").append(t);setTimeout(()=>t.remove(),2600)}
function persist(okMsg){if(Store.save(scripts)){if(okMsg)toast(okMsg)}else toast("Could not save to browser storage. Changes last only until you close this page. Use Settings → Export.",true)}
async function copy(text,what){
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text)}
    else{const a=document.createElement("textarea");a.value=text;a.style.cssText="position:fixed;opacity:0";document.body.append(a);a.select();const ok=document.execCommand("copy");a.remove();if(!ok)throw 0}
    toast(what+" copied")}catch(e){toast("Copy failed – your browser blocked clipboard access. Select the text and copy it manually.",true)}}
const byId=id=>scripts.find(s=>s.id===id);
const hay=s=>[s.title,s.subject,s.body,s.category,TYPES[s.type]].join(" ").toLowerCase();
const match=(s,t)=>!t||t.toLowerCase().split(/\s+/).every(w=>hay(s).includes(w));

// ---------- Rendering ----------
function renderSide(){
  const fc=scripts.filter(s=>s.favorite).length,cur=view.page==="cat"?view.cat:null;
  document.getElementById("side").innerHTML=`<div class="brand">NATHAN Script Toolkit<small>Personal Collections Workspace</small></div><nav aria-label="Main">
  <button data-go="home" class="${view.page==="home"?"on":""}">${ic("home")}Dashboard</button><hr>`+
  CATS.map(c=>`<button data-cat="${c}" class="${cur===c?"on":""}">${ic("doc")}${c}<span class="n">${scripts.filter(s=>s.category===c).length}</span></button>`).join("")+
  `<hr><button data-go="fav" class="${view.page==="fav"?"on":""}">${ic("star")}Favorites<span class="n">${fc}</span></button>
  <button data-go="settings" class="${view.page==="settings"?"on":""}">${ic("gear")}Settings</button>
  <button data-a="theme">${ic("moon")}${document.documentElement.dataset.theme==="dark"?"Light mode":"Dark mode"}</button></nav>`;
}
function card(s,showCat){
  const em=s.type==="email";
  const mv=showCat?"":`<span class="mv"><button class="btn sm" data-a="mv" data-d="-1" data-id="${s.id}" aria-label="Move earlier">&#9664;</button><button class="btn sm" data-a="mv" data-d="1" data-id="${s.id}" aria-label="Move later">&#9654;</button></span>`;
  const snip=esc(s.body.replace(/\s+/g," ").slice(0,120));
  const q=em?`<button class="btn sm" data-a="cs" data-id="${s.id}">${ic("copy")}Subject</button><button class="btn sm p" data-a="cb" data-id="${s.id}">${ic("copy")}Email</button>`
   :`<button class="btn sm p" data-a="cb" data-id="${s.id}">${ic("copy")}${s.type==="sms"?"Copy SMS":s.type==="nego"?"Copy Response":"Copy Script"}</button>`;
  return `<article class="card tile" data-a="view" data-id="${s.id}" ${showCat?"":`draggable="true" data-g="${esc(s.category+"|"+s.type)}"`}><div class="row" style="align-items:flex-start"><button class="lnk" data-a="view" data-id="${s.id}">${esc(s.title)}</button>
   <button class="star ${s.favorite?"on":""}" data-a="fav" data-id="${s.id}" aria-pressed="${s.favorite}" aria-label="Toggle favorite">${ic("star")}</button></div>
   <div class="row" style="margin-top:6px">${s.placeholder?'<span class="tag ph">Placeholder</span>':""}${showCat?`<span class="tag">${esc(s.category)}</span><span class="tag">${TYPES[s.type]}</span>`:""}</div>
   <div class="snip">${snip}</div><div class="row" style="margin-top:8px">${q}${mv}</div></article>`}
function results(list){
  if(!list.length)return `<div class="empty">No scripts match "${esc(q||cq)}". Try fewer words, or clear the search.</div>`;
  return list.map(s=>`<button class="card res" data-a="open" data-id="${s.id}"><div class="row"><strong>${esc(s.title)}</strong><span class="tag">${esc(s.category)}</span><span class="tag">${TYPES[s.type]}</span>${s.placeholder?'<span class="tag ph">Placeholder</span>':""}</div></button>`).join("")}
function renderHome(){
  const hits=q?scripts.filter(s=>match(s,q)):[];
  return `<h1>NATHAN Script Toolkit</h1><div class="mu">Find, copy and manage Infinity Finance email, SMS and negotiation scripts in one place.</div>
  <div class="bar"><div class="s"><input id="gs" type="search" placeholder="Search all scripts: title, content, category, type…" value="${esc(q)}" aria-label="Global search"></div><button class="btn p" data-a="add">${ic("plus")}Add Script</button></div>
  ${q?`<div id="gres">${results(hits)}</div>`:`<div id="gres"></div>
  ${!scripts.length?'<div class="empty"><strong>Your library is empty.</strong><br>Add your first script, or import a backup in Settings.</div>':""}
  <div class="sec"><h2>Favorites</h2>${favList()}</div>
  <div class="sec"><h2>Categories</h2><div class="grid" style="margin-top:8px">${CATS.map(c=>`<div class="card" tabindex="0" role="button" data-cat="${c}"><strong>${c}</strong><div class="mu" style="font-size:13px">${scripts.filter(s=>s.category===c).length} scripts</div></div>`).join("")}</div></div>`}`}
function favList(){const f=scripts.filter(s=>s.favorite);return f.length?'<div class="tiles">'+f.map(s=>card(s,true)).join("")+'</div>':'<div class="empty" style="margin-top:8px">No favorites yet. Tap the star on any script to pin it here.</div>'}
function renderCat(){
  const c=view.cat,list=scripts.filter(s=>s.category===c&&match(s,cq));
  const chips=`<div class="chips" role="group" aria-label="Filter by type"><button class="chip ${ft==="all"?"on":""}" data-a="ft" data-t="all">All (${list.length})</button>`+SECS[c].map(t=>`<button class="chip ${ft===t?"on":""}" data-a="ft" data-t="${t}">${t==="nego"?"Nego":TYPES[t].split(" ")[0]} (${list.filter(s=>s.type===t).length})</button>`).join("")+"</div>";
  const secs=SECS[c].filter(t=>ft==="all"||ft===t).map(t=>{const items=list.filter(s=>s.type===t).sort((a,b)=>ord(a)-ord(b)),k=c+t,open=!collapsed[k];
    return `<section class="sec"><button class="sh" data-a="tog" data-k="${k}" aria-expanded="${open}"><h2>${t==="nego"?"Nego with Client":TYPES[t]+(t==="voicemail"?"":" Templates")}</h2><span class="c">${items.length}</span><span class="sp"></span>${ic("chev")}</button>
    ${open?(items.length?'<div class="tiles">'+items.map(s=>card(s)).join("")+'</div>':`<div class="empty">${cq?"No matches in this section.":"Nothing here yet."} <button class="btn sm" data-a="add" data-type="${t}">${ic("plus")}Add ${TYPES[t]}</button></div>`):""}</section>`}).join("");
  return `<h1>${c}</h1><div class="mu">Email, SMS and negotiation responses for this category on one page. Drag a card to reorder it.</div>
  <div class="bar"><div class="s"><input id="cs" type="search" placeholder="Search ${c} templates…" value="${esc(cq)}" aria-label="Category search"></div>${cq?'<button class="btn" data-a="clr">Clear search</button>':""}<button class="btn p" data-a="add">${ic("plus")}Add Script</button></div>${chips}${secs}`}
function renderSettings(){return `<h1>Settings</h1><div class="mu">Manage your script library.</div>
 <div class="card"><h2>Storage</h2><p class="mu">Scripts are saved in this browser's local storage only. It is <strong>not</strong> a shared database, not cloud-synced, and not a backup – clearing browser data or switching browser/device loses it. Export regularly.</p>
 ${Store.ok?"":'<p class="err">Browser storage is unavailable or held unreadable data; changes may not persist.</p>'}
 <div class="row"><button class="btn" data-a="export">Export backup (JSON)</button><button class="btn" data-a="import">Import backup</button><input type="file" id="imp" accept="application/json" hidden></div></div>
 <div class="card"><h2>Library</h2><p class="mu">${scripts.length} scripts, ${scripts.filter(s=>s.favorite).length} favorites, ${scripts.filter(s=>s.placeholder).length} placeholders.</p>
 <div class="row"><button class="btn" data-a="add">${ic("plus")}Add Script</button><button class="btn d" data-a="reset">Reset library…</button></div></div>
 <div class="card"><h2>Appearance</h2><p class="mu">Choose a light or dim dark look. Saved in this browser.</p><div class="row"><button class="btn" data-a="settheme" data-t="light">Light</button><button class="btn" data-a="settheme" data-t="dark">Dark</button></div></div>`}
function render(){
  renderSide();const m=document.getElementById("main");
  const top=`<div class="top"><button class="btn" data-a="menu" aria-label="Open menu">${ic("menu")}</button><strong>NATHAN Script Toolkit</strong></div>`;
  m.innerHTML=top+(view.page==="home"?renderHome():view.page==="cat"?renderCat():view.page==="fav"?`<h1>Favorites</h1><div class="mu">Scripts you starred.</div><div class="sec">${favList()}</div>`:renderSettings());
}
function go(p,cat){view={page:p,cat:cat||null};cq="";ft="all";if(p!=="home")q="";document.getElementById("side").classList.remove("open");render();scrollTo(0,0)}
function openScript(id){const s=byId(id);if(!s)return;go("cat",s.category);collapsed[s.category+s.type]=false;render();openModal(id)}
function openModal(id){
  const s=byId(id);if(!s)return;const em=s.type==="email";
  const lab=s.type==="email"?"Copy Email":s.type==="sms"?"Copy SMS":s.type==="nego"?"Copy Response":"Copy Script";
  const m=document.createElement("div");m.className="mask";m.tabIndex=-1;
  m.innerHTML=`<div class="dlg view" role="dialog" aria-modal="true" aria-label="${esc(s.title)}">
  <div class="row" style="align-items:flex-start"><div style="flex:1"><span class="tag">${esc(s.category)}</span> <span class="tag">${TYPES[s.type]}</span> ${s.placeholder?'<span class="tag ph">Placeholder</span>':""}<h2 style="margin-top:6px;font-size:18px">${esc(s.title)}</h2></div>
  <button class="star ${s.favorite?"on":""}" id="v_f" aria-pressed="${s.favorite}" aria-label="Toggle favorite">${ic("star")}</button><button class="btn sm" id="v_x" aria-label="Close">&#10005;</button></div>
  <div class="tabs" role="tablist"><button class="tab on" role="tab" aria-selected="true">Infinity Finance</button></div>
  ${em?`<div class="lbl">Subject</div><div class="box big">${esc(s.subject)}</div><div class="lbl">Body</div>`:""}<div class="box big">${esc(s.body)}</div>
  <div class="row foot"><button class="btn d" id="v_d">${ic("trash")}Delete</button><span style="flex:1"></span><button class="btn" id="v_c">Duplicate</button><button class="btn" id="v_e">${ic("edit")}Edit</button>
  ${em?`<button class="btn" data-a="cs" data-id="${s.id}">Copy Subject</button><button class="btn" data-a="cf" data-id="${s.id}">Copy Full</button>`:""}<button class="btn p" data-a="cb" data-id="${s.id}">${ic("copy")}${lab}</button></div></div>`;
  document.body.append(m);m.focus();const $=i=>m.querySelector("#"+i),close=()=>m.remove();
  $("v_x").onclick=close;m.onmousedown=e=>{if(e.target===m)close()};m.onkeydown=e=>{if(e.key==="Escape")close()};
  $("v_f").onclick=()=>{s.favorite=!s.favorite;persist();$("v_f").classList.toggle("on",s.favorite);$("v_f").setAttribute("aria-pressed",s.favorite);render()};
  $("v_c").onclick=()=>{scripts.push({...s,order:undefined,id:uid(),title:s.title+" (Copy)",favorite:false,placeholder:false,created:now(),updated:now()});close();persist("Duplicated - edit the copy to customize it");render()};
  $("v_e").onclick=()=>{close();form(s.id)};
  $("v_d").onclick=()=>{if(confirm(`Delete "${s.title}"? This cannot be undone.`)){scripts=scripts.filter(x=>x.id!==s.id);close();persist("Script deleted");render()}};
}

// ---------- Add/Edit dialog ----------
function form(id,preType){
  const s=id?byId(id):null,v=s||{title:"",category:view.cat||CATS[0],type:preType||"email",subject:"",body:""};
  const m=document.createElement("div");m.className="mask";
  m.innerHTML=`<div class="dlg" role="dialog" aria-modal="true" aria-label="${s?"Edit":"Add"} script"><h2>${s?"Edit":"Add"} Script</h2>
  <label>Title *</label><input id="f_t" value="${esc(v.title)}"><div class="err" id="e_t"></div>
  <label>Category *</label><select id="f_c">${CATS.map(c=>`<option ${c===v.category?"selected":""}>${c}</option>`).join("")}</select>
  <label>Communication type *</label><select id="f_y">${Object.entries(TYPES).map(([k,n])=>`<option value="${k}" ${k===v.type?"selected":""}>${n}</option>`).join("")}</select>
  <div id="f_sw"><label>Email subject *</label><input id="f_s" value="${esc(v.subject)}" placeholder="[Client Name] - [Relevant Subject] - Infinity Finance"><div class="err" id="e_s"></div></div>
  <label>Message / body *</label><textarea id="f_b">${esc(v.body)}</textarea><div class="err" id="e_b"></div>
  <div class="row" style="margin-top:14px;justify-content:flex-end">${s?`<button class="btn d" id="f_d" style="margin-right:auto">${ic("trash")}Delete</button>`:""}<button class="btn" id="f_x">Cancel</button><button class="btn p" id="f_ok">Save script</button></div></div>`;
  document.body.append(m);const $=i=>m.querySelector("#"+i);
  const sw=()=>$("f_sw").style.display=$("f_y").value==="email"?"":"none";sw();$("f_y").onchange=sw;$("f_t").focus();
  const dirty=()=>$("f_t").value!==v.title||$("f_b").value!==v.body||$("f_s").value!==(v.subject||"")||$("f_c").value!==v.category||$("f_y").value!==v.type;
  const close=()=>{if(dirty()&&!confirm("Discard unsaved changes?"))return;m.remove()};
  $("f_x").onclick=close;m.onmousedown=e=>{if(e.target===m)close()};m.onkeydown=e=>{if(e.key==="Escape")close()};
  if(s)$("f_d").onclick=()=>{if(confirm(`Delete "${s.title}"? This cannot be undone.`)){scripts=scripts.filter(x=>x.id!==s.id);m.remove();persist("Script deleted");render()}};
  $("f_ok").onclick=()=>{
    const t=$("f_t").value.trim(),b=$("f_b").value.trim(),ty=$("f_y").value,sub=$("f_s").value.trim();
    $("e_t").textContent=t?"":"Title is required.";$("e_b").textContent=b?"":"Message is required.";$("e_s").textContent=ty==="email"&&!sub?"Subject is required for emails.":"";
    if(!t||!b||(ty==="email"&&!sub)){toast("Please fix the highlighted fields.",true);return}
    const cat=$("f_c").value;
    if(s){Object.assign(s,{title:t,category:cat,type:ty,subject:ty==="email"?sub:"",body:b,updated:now(),placeholder:false})}
    else scripts.push({id:uid(),title:t,category:cat,type:ty,subject:ty==="email"?sub:"",body:b,favorite:false,placeholder:false,created:now(),updated:now()});
    m.remove();persist(s?"Changes saved":"Script added");render()};
}

// ---------- Events ----------
document.addEventListener("click",async e=>{
  const c=e.target.closest("[data-cat]");if(c){go("cat",c.dataset.cat);return}
  const g=e.target.closest("[data-go]");if(g){go(g.dataset.go);return}
  const a=e.target.closest("[data-a]");if(!a)return;const s=byId(a.dataset.id),k=a.dataset.a;
  if(k==="cs")copy(s.subject,"Subject");else if(k==="cb")copy(s.body,s.type==="email"?"Email body":"Message");
  else if(k==="cf")copy("Subject: "+s.subject+"\n\n"+s.body,"Full email");
  else if(k==="fav"){s.favorite=!s.favorite;persist();const y=scrollY;render();scrollTo(0,y)}
  else if(k==="view")openModal(s.id);else if(k==="edit")form(s.id);else if(k==="add")form(null,a.dataset.type);else if(k==="open")openScript(s.id);
  else if(k==="tog"){collapsed[a.dataset.k]=!collapsed[a.dataset.k];render()}
  else if(k==="theme"){applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");render()}else if(k==="settheme"){applyTheme(a.dataset.t);render()}else if(k==="mv")moveBy(s.id,+a.dataset.d);else if(k==="clr"){cq="";render()}else if(k==="ft"){ft=a.dataset.t;render()}else if(k==="menu")document.getElementById("side").classList.toggle("open");
  else if(k==="export"){const u=URL.createObjectURL(new Blob([JSON.stringify({v:1,scripts},null,2)],{type:"application/json"}));const l=document.createElement("a");l.href=u;l.download="nathan-scripts-backup.json";l.click();URL.revokeObjectURL(u);toast("Backup download started")}
  else if(k==="import")document.getElementById("imp").click();
  else if(k==="reset"){if(confirm("Delete ALL scripts and restore the starter placeholders? Export a backup first. This cannot be undone.")){scripts=seed();persist("Library reset");render()}}
});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches(".grid .card[data-cat]")){e.preventDefault();go("cat",e.target.dataset.cat)}});
document.addEventListener("input",e=>{
  if(e.target.id==="gs"){q=e.target.value;document.getElementById("gres").innerHTML=q?results(scripts.filter(s=>match(s,q))):"";if(!q)render()}
  if(e.target.id==="cs"){cq=e.target.value;const p=e.target.selectionStart;render();const i=document.getElementById("cs");i.focus();i.setSelectionRange(p,p)}});
document.addEventListener("change",e=>{if(e.target.id!=="imp")return;const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.scripts))throw 0;
    const ok=d.scripts.filter(s=>s&&s.title&&CATS.includes(s.category)&&TYPES[s.type]&&typeof s.body==="string").map(s=>({subject:"",favorite:false,placeholder:false,created:now(),updated:now(),...s,id:uid()}));
    if(!ok.length)throw 0;if(!confirm(`Import ${ok.length} scripts and add them to your library?`))return;scripts=scripts.concat(ok);persist(`Imported ${ok.length} scripts`);render()}
    catch(_){toast("Import failed: file is not a valid NATHAN backup.",true)}};r.readAsText(f);e.target.value=""});
// ---------- Manual ordering (drag & drop, arrow buttons, Alt+Arrow keys) ----------
const ord=s=>s.order??1e9+scripts.indexOf(s);
const grp=s=>scripts.filter(x=>x.category===s.category&&x.type===s.type).sort((a,b)=>ord(a)-ord(b));
function applyOrder(l){l.forEach((x,i)=>x.order=i);persist("Order saved");render()}
function moveTo(id,tid,pos){const s=byId(id),t=byId(tid);if(!s||!t||s===t||s.category!==t.category||s.type!==t.type)return;const l=grp(s).filter(x=>x!==s);l.splice(l.indexOf(t)+(pos==="a"?1:0),0,s);applyOrder(l)}
function moveBy(id,d){const s=byId(id);if(!s)return;const l=grp(s),i=l.indexOf(s),j=i+d;if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];applyOrder(l);setTimeout(()=>document.querySelector(`.lnk[data-id="${id}"]`)?.focus(),0)}
let dragId=null;const clr=()=>document.querySelectorAll(".over-b,.over-a,.dragging").forEach(n=>n.classList.remove("over-b","over-a","dragging"));
document.addEventListener("dragstart",e=>{const t=e.target.closest&&e.target.closest(".tile[draggable=true]");if(!t)return;dragId=t.dataset.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",dragId);t.classList.add("dragging")});
document.addEventListener("dragover",e=>{if(!dragId)return;const s=byId(dragId),t=e.target.closest&&e.target.closest(".tile[draggable=true]");if(!s||!t||t.dataset.id===dragId||t.dataset.g!==s.category+"|"+s.type)return;e.preventDefault();e.dataTransfer.dropEffect="move";const r=t.getBoundingClientRect();document.querySelectorAll(".over-b,.over-a").forEach(n=>n.classList.remove("over-b","over-a"));t.classList.add(e.clientX>r.left+r.width/2?"over-a":"over-b")});
document.addEventListener("drop",e=>{if(!dragId)return;const t=e.target.closest&&e.target.closest(".tile[draggable=true]");if(!t)return;e.preventDefault();const id=dragId,after=t.classList.contains("over-a");dragId=null;clr();moveTo(id,t.dataset.id,after?"a":"b")});
document.addEventListener("dragend",()=>{dragId=null;clr()});
document.addEventListener("keydown",e=>{if(!e.altKey||!/^Arrow(Left|Right)$/.test(e.key))return;const b=e.target.closest&&e.target.closest(".lnk");if(!b)return;e.preventDefault();moveBy(b.dataset.id,e.key==="ArrowLeft"?-1:1)});

render();
document.addEventListener("keydown",e=>{if(e.key!=="/"||e.target.closest("input,textarea,select"))return;const i=document.getElementById("cs")||document.getElementById("gs");if(i){e.preventDefault();i.focus()}});
