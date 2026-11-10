'use strict';
const KEY='hsc-tracker-v1',SUBJ=['Physics','Chemistry','Biology','Higher Mathematics','ICT','Bangla','English'],PAPERS=['1st Paper','2nd Paper'],
TASKS=['YouTube lecture watched','Lecture sheet completed','Notes completed','Practice completed'],
NAV=[['dashboard','Dashboard','⌂'],['subjects','My Subjects','▦'],['chapters','Chapters','☰'],['progress','Detailed Progress','◫'],['deadlines','Deadlines','⏱'],['search','Search','⌕'],['user','User','☺'],['developer','Developer','✦'],['admin','Admin Panel','⌘'],['settings','Settings','⚙']],
DAY=864e5,$=s=>document.querySelector(s),dlg=$('#dlg');
const POOL={brand:['✨','🪄','🌈','🦋','🌟','🔮'],dashboard:['🏠','🚀','🌈','🎯','🧭'],progress:['📊','◫'],developer:['✦'],admin:['⚙️'],subjects:['📚','🗂️','🧩','🎒','🔖'],chapters:['📖','🗒️','📝','🧠','🔖'],deadlines:['⏳','⏰','📅','🔥','🎯'],search:['🔎','🧐','🔭','🗺️','🕵️'],user:['😎','🦊','🐼','🦉','🐯'],settings:['⚙️','🛠️','🎛️','🧰','🔧'],focus:['🍅','🎧','🧘','🔥','🌿'],
Physics:['⚛️','🔭','🧲','💡','🚀','🌌'],Chemistry:['🧪','⚗️','🔬','🧫','💥','🌡️'],Biology:['🧬','🌿','🦠','🐸','🌱','🦴'],'Higher Mathematics':['➗','📐','📊','♾️','🧮','🔢'],ICT:['💻','🖥️','⌨️','🌐','🤖','📡'],Bangla:['📖','🪷','🖋️','🌾','🎭','📜'],English:['🔤','📚','✍️','🗣️','🎓','📝']};
const IC=Object.fromEntries(Object.entries(POOL).map(([k,v])=>[k,v[Math.random()*v.length|0]]));
const ttl=c=>(c.num?`Ch ${c.num}. `:'')+c.name,SI=c=>`<span class="em">${IC[c.subject]}</span> `;
let S={profile:null,theme:null,focusMin:0,chapters:[]},UI={v:'dashboard',q:'',sub:'',paper:'',st:'',sort:'recent',open:{}},noSave=false,loadErr='',tt,qt;
let pandaName='Professor Panda';try{pandaName=localStorage.getItem('porikolpona-panda-name')||pandaName}catch{}
let pandaMood='welcome';
let pkClient=null,pkUser=null,pkProfile=null,pkSyncTimer=null,pkSyncBusy=false,pkSyncAgain=false;
const pkConfig=window.PORIKOLPONA_CONFIG||{};
function pkEmail(login){return String(login||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'')+'@login.porikolpona.app'}
function pkErr(e){return e?.message||'Something went wrong. Please try again.'}

/* helpers */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const str=(v,n=5000)=>typeof v==='string'?v.slice(0,n):'';
const now=()=>new Date().toISOString();
const iso=v=>{const d=new Date(v);return typeof v==='string'&&!isNaN(d)?d.toISOString():null};
const cmp=(x,y)=>x<y?-1:x>y?1:0;
const ymd=d=>{d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmt=d=>new Date(d).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const sod=d=>{d=new Date(d);d.setHours(0,0,0,0);return d.getTime()};
const url=v=>{v=v.trim();if(!v)return'';if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(v))v='https://'+v;try{const u=new URL(v);return/^https?:$/.test(u.protocol)?u.href:null}catch{return null}};
const mkLec=n=>({id:uid(),n,t:[false,false,false,false],yt:'',sheet:'',note:'',updated:now()});
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),3800)}

/* progress */
const tot=c=>c.lectures.length*4,dn=c=>c.lectures.reduce((a,l)=>a+l.t.filter(Boolean).length,0),full=c=>c.lectures.filter(l=>l.t.every(Boolean)).length;
const pct=(a,b)=>!b?0:a>=b?100:Math.min(99,Math.round(a/b*100));
const chapterState=c=>c.status||((c.lectures.length>0&&dn(c)===tot(c))?'completed':dn(c)===0?'untouched':'ongoing');
const isDone=c=>chapterState(c)==='completed';
const agg=L=>L.reduce((r,c)=>(r.t+=tot(c),r.d+=dn(c),r.l+=c.lectures.length,r.f+=full(c),r),{t:0,d:0,l:0,f:0});
function cd(c){
  if(!c.due)return{k:'none',txt:''};
  if(isDone(c))return{k:'done',txt:'Completed',big:'✓',sub:'Done'};
  const n=Date.now(),due=new Date(c.due).getTime();
  if(n>due){const d=Math.max(1,Math.ceil((n-due)/DAY));return{k:'overdue',txt:`Overdue by ${d} day${d>1?'s':''}`,big:d,sub:d>1?'days overdue':'day overdue'}}
  const d=Math.round((sod(due)-sod(n))/DAY);
  if(d<=0){const m=Math.floor((due-n)/6e4);return{k:'today',txt:`Due today, ${Math.floor(m/60)}h ${m%60}m left`,big:'Today',sub:`${Math.floor(m/60)}h ${m%60}m left`}}
  return{k:d<=3?'soon':'up',txt:`${d} day${d>1?'s':''} remaining`,big:d,sub:d>1?'days left':'day left'}}
const pill=k=>k.txt?`<span class="pill ${k.k}">${k.txt}</span>`:'';
const cdb=k=>k.big===undefined?'':`<div class="cdb ${k.k}"><b>${k.big}</b><span>${k.sub}</span></div>`;
const lecs=c=>c.lectures.map(l=>lecCard(c,l)).join('')||'<p class="muted">No lectures yet. Use "+ Add lecture".</p>';
const spot=up=>up.length?`<div class="spots">${up.slice(0,3).map(c=>{const k=cd(c);return`<button class="card spot ${k.k}" data-a="go" data-id="${esc(c.id)}"><div class="sn"><b>${k.big}</b><span>${k.sub}</span></div><div class="ti"><b>${SI(c)}${esc(ttl(c))}</b><small>${esc(meta(c))}, due ${fmt(c.due)}</small></div></button>`}).join('')}</div>`:`<div class="card spot none"><div class="em big">${IC.deadlines}</div><div><b>No countdown yet</b><p class="muted">Add a deadline to a chapter and your days-left counter appears here.</p></div></div>`;
function hdr(){const c=S.chapters.filter(x=>x.due&&!isDone(x)).sort((a,b)=>cmp(a.due,b.due))[0],e=$('#chip');if(!c){e.hidden=true;return}const k=cd(c);e.hidden=false;e.className='chip '+k.k;e.textContent=`${IC.deadlines} ${k.big} ${k.sub}`;e.title=ttl(c)}
const bar=p=>`<div class="bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;
const meta=c=>`${c.subject}, ${c.paper}`;
const opts=(a,cur)=>a.map(x=>{const[v,l]=Array.isArray(x)?x:[x,x];return`<option value="${esc(v)}"${v===cur?' selected':''}>${esc(l)}</option>`}).join('');

/* data */
function cleanCh(c){
  if(!c||typeof c!=='object'||!SUBJ.includes(c.subject)||!str(c.name).trim()||!Array.isArray(c.lectures))throw new Error('Invalid chapter data.');
  const t=now();
  return{id:str(c.id,60)||uid(),status:['ongoing','untouched','completed','revision'].includes(c.status)?c.status:null,subject:c.subject,paper:c.subject==='ICT'?'Single Paper':PAPERS.includes(c.paper)?c.paper:PAPERS[0],name:str(c.name,200).trim(),desc:str(c.desc),notes:str(c.notes),num:Math.max(0,parseInt(c.num)||0),link:/^https?:\/\//i.test(c.link||'')?str(c.link,2000):'',due:iso(c.due),created:iso(c.created)||t,updated:iso(c.updated)||t,
    lectures:c.lectures.map((l,i)=>({id:str(l&&l.id,60)||uid(),n:+(l&&l.n)||i+1,t:[0,1,2,3].map(j=>!!(l&&l.t&&l.t[j])),yt:str(l&&l.yt,2000),sheet:str(l&&l.sheet,2000),note:str(l&&l.note),updated:iso(l&&l.updated)||t}))}}
function cleanData(d){
  if(!d||typeof d!=='object'||!Array.isArray(d.chapters))throw new Error('This is not a valid study tracker backup.');
  const p=d.profile,ok=p&&typeof p==='object'&&str(p.name).trim()&&str(p.college).trim();
  return{profile:ok?{name:str(p.name,40).trim(),year:p.year==='HSC 2028'?'HSC 2028':'HSC 2027',college:str(p.college,80).trim(),photo:/^data:image\//.test(p.photo||'')&&p.photo.length<4e5?p.photo:'',joined:iso(p.joined)||now()}:null,focusMin:Math.max(0,+d.focusMin||0),theme:d.theme==='dark'||d.theme==='light'?d.theme:null,chapters:d.chapters.map(cleanCh)}}
function load(){
  let raw=null;
  try{raw=localStorage.getItem(KEY)}catch{loadErr='Browser storage is unavailable, so changes will not be saved.';noSave=true;return}
  if(!raw)return;
  try{S=cleanData(JSON.parse(raw))}catch{
    try{localStorage.setItem(KEY+'-unreadable',raw)}catch{}
    loadErr='Your saved data could not be read. A raw copy was kept in this browser. Restore a backup below, or continue to start fresh.';noSave=true}}
function save(){if(noSave)return;try{localStorage.setItem(KEY,JSON.stringify(S))}catch{toast('Could not save a local backup.')}if(pkUser){clearTimeout(pkSyncTimer);pkSyncTimer=setTimeout(()=>pkSync(),700)}}
async function pkLoad(user){
  pkUser=user;
  const {data:profile,error:pe}=await pkClient.from('profiles').select('*').eq('id',user.id).single();if(pe)throw pe;
  if(!profile.active){await pkClient.auth.signOut();pkUser=null;throw new Error('This account is inactive. Contact the PoriKolpona administrator.')}
  pkProfile=profile;window.pkRole=profile.role;
  const [{data:chapters,error:ce},{data:lectures,error:le},{data:settings,error:se}]=await Promise.all([
    pkClient.from('chapters').select('*').eq('user_id',user.id),pkClient.from('lectures').select('*').eq('user_id',user.id),pkClient.from('user_settings').select('*').eq('user_id',user.id).maybeSingle()
  ]);if(ce)throw ce;if(le)throw le;if(se)throw se;
  const ls=lectures||[];const mapped=(chapters||[]).map(c=>({id:c.id,status:c.status||null,subject:c.subject,paper:c.paper,name:c.name,desc:c.description||'',notes:c.notes||'',num:c.chapter_number||0,link:c.master_link||'',due:c.deadline,created:c.created_at,updated:c.updated_at,lectures:ls.filter(l=>l.chapter_id===c.id).map(l=>({id:l.id,n:l.lecture_number,t:[l.youtube_watched,l.sheet_completed,l.notes_completed,l.practice_completed],yt:l.youtube_url||'',sheet:l.sheet_url||'',note:l.note||'',updated:l.updated_at}))}));
  const localRaw=localStorage.getItem(KEY);let local=null;try{local=localRaw?cleanData(JSON.parse(localRaw)):null}catch{}
  if(!mapped.length&&local?.chapters?.length&&confirm('We found study data saved in this browser. Import it into your new cloud account?')){S={...local,profile:{name:profile.name||local.profile?.name||'Student',year:profile.academic_year||'HSC 2027',college:profile.college||local.profile?.college||'',joined:profile.created_at||now(),photo:''}};await pkSync(true)}
  else S={profile:{name:profile.name||'Student',year:profile.academic_year||'HSC 2027',college:profile.college||'',joined:profile.created_at||now(),photo:''},theme:settings?.theme||null,focusMin:settings?.focus_min||0,chapters:mapped};
  pandaName=settings?.panda_nickname||'Professor Panda';applyTheme();$('#welcome').hidden=true;$('#app').hidden=false;render();fx();
}
async function pkSync(force=false){if(!pkUser||pkSyncBusy){pkSyncAgain=true;return}pkSyncBusy=true;pkSyncAgain=false;try{
  const uid=pkUser.id;const p=S.profile||{};
  let {error}=await pkClient.from('profiles').update({name:p.name||'Student',academic_year:p.year||'HSC 2027',college:p.college||''}).eq('id',uid);if(error)throw error;
  const ch=S.chapters.map(c=>({id:c.id,user_id:uid,status:c.status||null,subject:c.subject,paper:c.paper,chapter_number:c.num||null,name:c.name,description:c.desc||'',notes:c.notes||'',master_link:c.link||'',deadline:c.due,created_at:c.created||now(),updated_at:c.updated||now()}));
  if(ch.length){({error}=await pkClient.from('chapters').upsert(ch));if(error)throw error;const ids=ch.map(c=>c.id);({error}=await pkClient.from('chapters').delete().eq('user_id',uid).not('id','in',`(${ids.join(',')})`));if(error)throw error}
  else {({error}=await pkClient.from('chapters').delete().eq('user_id',uid));if(error)throw error}
  const lec=S.chapters.flatMap(c=>c.lectures.map(l=>({id:l.id,user_id:uid,chapter_id:c.id,lecture_number:l.n,youtube_watched:!!l.t[0],sheet_completed:!!l.t[1],notes_completed:!!l.t[2],practice_completed:!!l.t[3],youtube_url:l.yt||'',sheet_url:l.sheet||'',note:l.note||'',updated_at:l.updated||now()})));
  if(lec.length){({error}=await pkClient.from('lectures').upsert(lec));if(error)throw error;const ids=lec.map(l=>l.id);({error}=await pkClient.from('lectures').delete().eq('user_id',uid).not('id','in',`(${ids.join(',')})`));if(error)throw error}
  else {({error}=await pkClient.from('lectures').delete().eq('user_id',uid));if(error)throw error}
  ({error}=await pkClient.from('user_settings').upsert({user_id:uid,theme:S.theme||null,panda_nickname:pandaName,focus_min:S.focusMin||0,updated_at:now()}));if(error)throw error;
}catch(e){console.error('PoriKolpona sync:',e);toast('Cloud sync failed: '+pkErr(e))}finally{pkSyncBusy=false;if(pkSyncAgain){pkSyncAgain=false;pkSync()}}}
async function pkBoot(){
  if(!window.supabase||!pkConfig.url||!pkConfig.anonKey){$('#werr').textContent='Supabase is not configured. Add your Project URL and anon key to config.js.';render();return}
  pkClient=window.supabase.createClient(pkConfig.url,pkConfig.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:($('#remember')?.checked?localStorage:sessionStorage)}});
  $('#togglePassword')?.addEventListener('click',()=>{const x=$('#loginPassword');x.type=x.type==='password'?'text':'password';$('#togglePassword').textContent=x.type==='password'?'SHOW':'HIDE'});
  const {data:{session}}=await pkClient.auth.getSession();if(session){try{await pkLoad(session.user)}catch(e){$('#werr').textContent=pkErr(e);$('#welcome').hidden=false;$('#app').hidden=true}}else render();
}
async function pkSignIn(form){const id=$('#loginId').value.trim(),password=$('#loginPassword').value;if(!id||!password){$('#werr').textContent='Enter your Login ID and password.';return}const btn=$('#loginButton');btn.disabled=true;btn.textContent='Signing in…';$('#werr').textContent='';try{const {data,error}=await pkClient.auth.signInWithPassword({email:pkEmail(id),password});if(error)throw error;await pkLoad(data.user)}catch(e){$('#werr').textContent=pkErr(e);if(pkClient)await pkClient.auth.signOut()}finally{btn.disabled=false;btn.textContent='Sign in to PoriKolpona'}}
async function pkSignOut(){await pkClient?.auth.signOut();pkUser=null;pkProfile=null;window.pkRole=null;S={profile:null,theme:S.theme,focusMin:0,chapters:[]};$('#app').hidden=true;$('#welcome').hidden=false;$('#loginPassword').value='';render()}

const curTheme=()=>S.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
const applyTheme=()=>{document.documentElement.dataset.theme=curTheme()};
const find=(cid,lid)=>{const c=S.chapters.find(x=>x.id===cid);return[c,c&&c.lectures.find(x=>x.id===lid)]};
function touch(c,l){const wasDone=isDone(c);const t=now();if(l)l.updated=t;c.updated=t;save();if(isDone(c))setTimeout(()=>pandaSpeak('celebrate'),180);const e=document.getElementById('ch-'+c.id);if(!e)return render();const k=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.k;e.outerHTML=chCard(c);hdr();if(k){const f=document.querySelector(`[data-k="${CSS.escape(k)}"]`);if(f)f.focus()}}

/* confirm dialog */
function ask(msg,ok='Confirm',word){
  return new Promise(r=>{
    const d=document.createElement('dialog');
    d.innerHTML=`<div class="mf"><p>${esc(msg)}</p>${word?`<input aria-label="Type ${word} to confirm" placeholder="Type ${word}" autocomplete="off">`:''}<div class="mact"><button class="btn" value="0">Cancel</button><button class="btn danger" value="1"${word?' disabled':''}>${esc(ok)}</button></div></div>`;
    document.body.append(d);
    const i=d.querySelector('input');if(i)i.oninput=()=>d.querySelector('.danger').disabled=i.value.trim()!==word;
    d.onclick=e=>{const b=e.target.closest('button');if(b){r(b.value==='1');d.close()}};
    d.onclose=()=>{r(false);d.remove()};
    d.showModal()})}

/* templates */
const row=c=>`<button class="row" data-a="go" data-id="${esc(c.id)}"><span class="ti"><b>${SI(c)}${esc(ttl(c))}</b><small>${esc(meta(c))}, ${pct(dn(c),tot(c))}%</small></span>${pill(cd(c))}</button>`;
function lecCard(c,l){
  const n=l.t.filter(Boolean).length,fl=n===4,o=UI.open[l.id],da=`data-c="${esc(c.id)}" data-l="${esc(l.id)}"`;
  return`<div class="lec col${fl?' full':''}${o?' open':''}" data-id="${esc(l.id)}">
<div class="lh"><input type="checkbox" class="mc" data-k="m${esc(l.id)}" ${da} title="Mark all 4 tasks" aria-label="Mark all four tasks of lecture ${l.n} complete"${fl?' checked':''}><button class="tgl" data-a="tg" aria-expanded="${!!o}"><span class="chev" aria-hidden="true">›</span><b>Lecture ${String(l.n).padStart(2,'0')}</b><span class="mini">${n}/4</span>${fl?'<span class="ck" title="Lecture complete" aria-label="Lecture complete">✓</span>':''}</button><div class="mbar">${bar(n*25)}</div></div>
<div class="bd"><div class="in">
${TASKS.map((t,i)=>`<label class="tk"><input type="checkbox" class="t" data-k="${esc(l.id)}-${i}" ${da} data-i="${i}"${l.t[i]?' checked':''}><span>${t}</span></label>`).join('')}
${[['yt','YouTube lecture URL','Open YouTube lecture'],['sheet','Lecture sheet URL (Google Drive etc.)','Open lecture sheet']].map(([f,lb,tx])=>`<div class="ur"><label>${lb}<input class="u" type="url" inputmode="url" placeholder="Paste a link to add it" value="${esc(l[f])}" ${da} data-f="${f}"></label><a href="${esc(l[f]||'#')}" target="_blank" rel="noopener noreferrer"${l[f]?'':' hidden'}>${tx}</a></div>`).join('')}
<label>Personal note<textarea class="ln" rows="2" ${da} placeholder="Difficult concepts, reminders, revision points">${esc(l.note)}</textarea></label>
<div class="mact l"><button class="btn sm" data-a="ok" data-id="${esc(c.id)}" data-l="${esc(l.id)}">Mark all complete</button><button class="btn sm" data-a="rs" data-id="${esc(c.id)}" data-l="${esc(l.id)}">Reset</button><button class="btn sm danger" data-a="dl" data-id="${esc(c.id)}" data-l="${esc(l.id)}">Delete lecture</button></div>
</div></div></div>`}
function chCard(c){
  const T=tot(c),d=dn(c),p=pct(d,T),o=UI.open[c.id];
  return`<article class="card col${o?' open':''}" data-id="${esc(c.id)}" id="ch-${esc(c.id)}">
<div class="chh"><button class="tgl" data-a="tg" aria-expanded="${!!o}"><span class="chev" aria-hidden="true">›</span><span class="ti"><b>${SI(c)}${esc(ttl(c))}</b><small>${esc(meta(c))}</small></span></button><div class="pr"><span class="pc">${p}%</span>${bar(p)}</div>${cdb(cd(c))}${c.link?`<a class="btn sm" href="${esc(c.link)}" target="_blank" rel="noopener noreferrer">🔗 Master link</a>`:''}<button class="btn sm" data-a="ed" data-id="${esc(c.id)}">Edit</button><button class="btn sm danger" data-a="dc" data-id="${esc(c.id)}">Delete</button></div>
<div class="bd"><div class="in">
<p class="muted">${full(c)} of ${c.lectures.length} lectures complete (${pct(full(c),c.lectures.length)}%). ${d} of ${T} tasks done.</p>
${c.due?`<p class="muted">Deadline: ${fmt(c.due)}${isDone(c)?' (fulfilled)':''}</p>`:''}
${c.desc?`<p>${esc(c.desc)}</p>`:''}${c.notes?`<p class="note">${esc(c.notes)}</p>`:''}
<div class="mact l"><button class="btn sm" data-a="al" data-id="${esc(c.id)}">+ Add lecture</button><button class="btn sm" data-a="xd" data-id="${esc(c.id)}">Extend deadline 7 days</button></div>
<div class="lecs">${o?lecs(c):''}</div>
</div></div></article>`}

/* Professor Panda, the study companion */
const pandaLines={
  welcome:()=>`Hello, ${S.profile?.name||'scholar'}! Ready to make a little progress today?`,
  tip:()=>{const open=S.chapters.filter(c=>!isDone(c));if(!open.length)return 'Your list is clear. Add a chapter whenever you are ready for a new challenge.';const c=open.sort((a,b)=>cmp(b.updated,a.updated))[0];return `Try a small step: work on ${c.name}. Finish just one lecture task to build momentum.`},
  progress:()=>{const a=agg(S.chapters);return `You have completed ${a.d} of ${a.t} study tasks across ${S.chapters.length} chapters. Every small step counts!`},
  celebrate:()=>`That is progress worth celebrating! Keep your pace steady, you are building a good habit.`,
  focus:()=>`Let's focus on one task at a time. Start a 25-minute focus session when you are ready.`,
  encourage:()=>`A difficult chapter is still just a collection of smaller ideas. Take the next manageable step.`
};
function pandaDock(){return `<aside class="panda-dock" id="pandaDock"><div class="panda-bubble" id="pandaBubble"><b>${esc(pandaName)}</b><span id="pandaLine">${pandaLines.welcome()}</span><div class="panda-quick"><button class="btn sm" data-a="panda" data-v="tip">Study tip</button><button class="btn sm" data-a="panda" data-v="progress">My progress</button></div></div><button class="panda-trigger" data-a="panda" data-v="toggle" aria-label="Talk to ${esc(pandaName)}"><img src="assets/professor-panda-loop.gif" alt="${esc(pandaName)} animated mascot"><span class="panda-pulse"></span></button></aside>`}
function pandaSpeak(kind){const line=pandaLines[kind]||pandaLines.encourage;const b=$('#pandaLine');if(b)b.textContent=line();const dock=$('#pandaDock');if(dock)dock.classList.add('panda-open');}

/* views */
function dashboard(){
  const P=S.profile,ch=S.chapters,A=agg(ch),p=pct(A.d,A.t);
  const up=ch.filter(c=>c.due&&!isDone(c)).sort((a,b)=>cmp(a.due,b.due)),ov=up.filter(c=>cd(c).k==='overdue').length;
  const cont=ch.filter(c=>!isDone(c)).sort((a,b)=>cmp(b.updated,a.updated)).slice(0,4);
  const head=`${spot(up)}<div class="card"><div class="em big">${IC.dashboard}</div><h1>Welcome back, ${esc(P.name)}</h1><p class="muted">${esc(P.year)}, ${esc(P.college)}</p><div class="pr big"><span class="pc">${p}%</span>${bar(p)}</div><p class="muted">${A.d} of ${A.t} tasks completed</p><div class="mact l" style="margin-top:12px"><button class="btn primary" data-a="add">+ Add Chapter</button><button class="btn" data-a="nav" data-v="search">Search chapters</button><button class="btn" data-a="nav" data-v="progress">See Detailed Progress</button><button class="btn" data-a="un">Open unfinished lectures</button></div></div>`;
  const pandaIntro=`<section class="card panda-intro"><img src="assets/professor-panda-loop.gif" alt="${esc(pandaName)}"><div class="panda-intro-copy"><span class="panda-kicker">YOUR STUDY COMPANION</span><h3>Hi, ${esc(P.name)}! I'm ${esc(pandaName)}.</h3><p class="muted">I'll help you explore your workspace, keep track of small wins and stay encouraged while you study.</p><div class="mact l"><button class="btn primary" data-a="panda" data-v="tip">Give me a study tip</button><button class="btn" data-a="panda" data-v="focus">Focus encouragement</button></div></div></section>`;
  if(!ch.length)return`<div class="stack">${pandaIntro}${head}<div class="card empty"><p>No chapters yet. Add your first chapter and its lectures will be created for you.</p></div></div>`;
  const st=[['Subject papers',new Set(ch.map(meta)).size],['Chapters',ch.length],['Lectures',A.l],['Lectures completed',A.f],['Tasks done',A.d],['Tasks remaining',A.t-A.d],['Upcoming deadlines',up.length-ov],['Overdue',ov]];
  return`<div class="stack">${pandaIntro}${head}<div class="stats">${st.map(([l,v])=>`<div class="stat card"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
<div class="grid2"><section class="card"><h3>Upcoming deadlines</h3>${up.slice(0,5).map(row).join('')||'<p class="muted">No active deadlines.</p>'}</section>
<section class="card"><h3>Continue studying</h3>${cont.map(row).join('')||'<p class="muted">Everything is complete.</p>'}</section></div>
<section class="card"><h3>Subject overview</h3>${SUBJ.map(s=>{const L=ch.filter(c=>c.subject===s);if(!L.length)return'';const a=agg(L),q=pct(a.d,a.t);return`<button class="row" data-a="fs" data-s="${s}"><span class="ti"><b><span class="em">${IC[s]}</span> ${s}</b><small>${L.length} chapter${L.length>1?'s':''}</small></span><div class="pr"><span class="pc">${q}%</span>${bar(q)}</div></button>`}).join('')}</section></div>`}
function subjects(){
  return`<div class="stack">${SUBJ.map(s=>{
    const L=S.chapters.filter(c=>c.subject===s),a=agg(L),p=pct(a.d,a.t),o=UI.open['s'+s];
    return`<section class="card col${o?' open':''}" data-id="s${s}"><div class="chh"><button class="tgl" data-a="tg" aria-expanded="${!!o}"><span class="chev" aria-hidden="true">›</span><span class="ti"><b><span class="em">${IC[s]}</span> ${s}</b><small>${L.length} chapter${L.length===1?'':'s'}</small></span></button><div class="pr"><span class="pc">${p}%</span>${bar(p)}</div><button class="btn sm" data-a="add" data-s="${s}">+ Chapter</button></div>
<div class="bd"><div class="in">${(s==='ICT'?['Single Paper']:PAPERS).map(pp=>{const l=L.filter(c=>c.paper===pp).sort((x,y)=>(x.num||999)-(y.num||999)),b=agg(l);return`<h4>${pp} <small>${pct(b.d,b.t)}%, ${l.length} chapter${l.length===1?'':'s'}</small></h4>${l.map(row).join('')||'<p class="muted">No chapters yet.</p>'}`}).join('')}</div></div></section>`}).join('')}</div>`}
function deadlines(){
  const w=S.chapters.filter(c=>c.due),a=w.filter(c=>!isDone(c)).sort((x,y)=>cmp(x.due,y.due)),d=w.filter(isDone),n=S.chapters.filter(c=>!c.due&&!isDone(c)).length;
  const r=c=>{const k=cd(c);return`<div class="card drow ${k.k}"><button class="tgl" data-a="go" data-id="${esc(c.id)}"><span class="ti"><b>${SI(c)}${esc(ttl(c))}</b><small>${esc(meta(c))}. ${isDone(c)?'Fulfilled, deadline was ':'Due '}${fmt(c.due)}</small></span></button>${cdb(k)}<div class="pr"><span class="pc">${pct(dn(c),tot(c))}%</span>${bar(pct(dn(c),tot(c)))}</div><button class="btn sm" data-a="ed" data-id="${esc(c.id)}">Change</button><button class="btn sm" data-a="cdl" data-id="${esc(c.id)}">Remove</button></div>`};
  return`<div class="stack">${a.length?a.map(r).join(''):'<div class="card empty"><p>No active deadlines. Set one when you add or edit a chapter.</p></div>'}${d.length?'<h3 class="sec">Completed</h3>'+d.map(r).join(''):''}${n?`<p class="muted">${n} incomplete chapter${n>1?'s have':' has'} no deadline.</p>`:''}</div>`}
function listView(search){
  return`<div class="tools"><input id="q" type="search" placeholder="Search chapters, notes and links" aria-label="Search chapters" value="${esc(UI.q)}">
<select id="fs" aria-label="Subject"><option value="">All subjects</option>${opts(SUBJ,UI.sub)}</select>
<select id="fp" aria-label="Paper"><option value="">All papers</option>${opts([...PAPERS,'Single Paper'],UI.paper)}</select>
<select id="ft" aria-label="Status">${opts([['','All chapters'],['todo','Incomplete'],['done','Completed'],['dl','With deadline'],['over','Overdue']],UI.st)}</select>
<select id="fo" aria-label="Sort by">${opts([['recent','Recent activity'],['alpha','Alphabetical'],['deadline','Nearest deadline']],UI.sort)}</select>
${search?'':'<div class="grp"><button class="btn sm" data-a="ea">Expand all</button><button class="btn sm" data-a="ca">Collapse all</button></div>'}</div><div id="res"></div>`}
function filt(){
  const q=UI.q.trim().toLowerCase(),k=c=>c.due&&!isDone(c)?c.due:'~';
  return S.chapters.filter(c=>{
    if(UI.sub&&c.subject!==UI.sub||UI.paper&&c.paper!==UI.paper)return false;
    const d=isDone(c);
    if(UI.st==='done'&&!d||UI.st==='todo'&&d||UI.st==='dl'&&!c.due||UI.st==='over'&&cd(c).k!=='overdue')return false;
    return!q||[c.name,c.desc,c.notes,...c.lectures.flatMap(l=>[l.note,l.yt,l.sheet])].join('\n').toLowerCase().includes(q)})
  .sort((a,b)=>UI.sort==='alpha'?a.name.localeCompare(b.name):UI.sort==='deadline'?cmp(k(a),k(b))||a.name.localeCompare(b.name):cmp(b.updated,a.updated))}
function res(){
  const L=filt();
  $('#res').innerHTML=L.length?L.map(chCard).join(''):`<div class="card empty"><p>${S.chapters.length?'No chapters match your search or filters.':'No chapters yet.'}</p>${S.chapters.length?'':'<button class="btn primary" data-a="add">Add your first chapter</button>'}</div>`}
function detailedProgress(){
  const groups=[['ongoing','Ongoing / Unfinished'],['untouched','Untouched'],['revision','Need Revision'],['completed','Completed']];
  const total=S.chapters.length,done=S.chapters.filter(c=>chapterState(c)==='completed').length,percent=pct(done,total);
  const block=(key,label)=>{const items=S.chapters.filter(c=>chapterState(c)===key).sort((a,b)=>a.subject.localeCompare(b.subject)||(a.num||999)-(b.num||999));return `<section class="card progress-group"><button class="progress-group-head" data-a="pg-toggle" data-v="${key}" aria-expanded="${UI.open['pg-'+key]!==false}"><span><b>${label}</b><small>${items.length} chapter${items.length===1?'':'s'}</small></span><span class="pill">${items.length}</span><span class="chev">${UI.open['pg-'+key]===false?'›':'⌄'}</span></button><div class="progress-group-body" ${UI.open['pg-'+key]===false?'hidden':''}>${items.length?items.map(c=>`<div class="progress-chapter"><button class="link" data-a="go" data-id="${esc(c.id)}">${SI(c)}${esc(ttl(c))}</button><span class="muted">${esc(meta(c))} · ${pct(dn(c),tot(c))}% task progress</span><select aria-label="Change status for ${esc(c.name)}" data-status-id="${esc(c.id)}"><option value="ongoing"${key==='ongoing'?' selected':''}>Ongoing</option><option value="untouched"${key==='untouched'?' selected':''}>Untouched</option><option value="revision"${key==='revision'?' selected':''}>Need Revision</option><option value="completed"${key==='completed'?' selected':''}>Completed</option></select></div>`).join(''):'<p class="muted">No chapters in this section.</p>'}</div></section>`};
  return `<div class="stack"><section class="card progress-summary"><div><span class="panda-kicker">YOUR STUDY OVERVIEW</span><h1>Detailed Progress</h1><p class="muted">Chapter status completion, independent from individual lecture task counts.</p></div><div class="pr big"><b class="pc">${percent}%</b>${bar(percent)}</div><p><b>${done}</b> of ${total} chapters completed</p><div class="mact l print-controls"><button class="btn primary" data-a="print-list" data-v="unfinished">Print unfinished chapters</button><button class="btn" data-a="print-list" data-v="untouched">Print untouched chapters</button><button class="btn" data-a="print-list" data-v="all">Print detailed progress</button></div></section>${groups.map(([k,l])=>block(k,l)).join('')}</div>`;
}
function developer(){return `<div class="developer-page"><section class="developer-hero"><div class="developer-orbit"></div><div class="developer-avatar"><img src="assets/developer.jpg" alt="Developer portrait" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span style="display:none">PA</span></div><div class="developer-copy"><span class="panda-kicker">BUILT WITH CURIOSITY</span><h1>Behind PoriKolpona</h1><p>A student-built space for making study progress visible, manageable and motivating.</p><div class="developer-tags"><span>Student Developer</span><span>Biology Enthusiast</span><span>HSC 2027</span></div></div></section><section class="card"><h2>Why PoriKolpona?</h2><p class="muted">To turn a large syllabus into small, trackable steps. Professor Panda is here to make the journey a little more encouraging.</p></section><section class="card developer-note"><h3>A note from the developer</h3><p>Keep learning, keep experimenting, and keep moving forward one chapter at a time.</p></section></div>`}
function adminPanel(){
  if(window.pkRole!=='admin')return '<section class="card empty">Administrator access required.</section>';
  return `<div class="stack"><section class="card"><h1>Student management</h1><p class="muted">Create student accounts. Students cannot register publicly.</p><form id="adminCreate" class="admin-create"><label>Login ID<input name="login_id" minlength="3" maxlength="48" pattern="[A-Za-z0-9._-]+" required></label><label>Temporary password<input name="password" type="password" minlength="12" required></label><label>Student name<input name="name" required></label><label>Academic year<select name="academic_year"><option>HSC 2027</option><option>HSC 2028</option></select></label><label>College<input name="college"></label><button class="btn primary">Create student</button></form></section><section class="card"><div class="row-head"><h3>Registered accounts</h3><button class="btn sm" data-a="admin-refresh">Refresh</button></div><div id="adminUsers"><p class="muted">Loading accounts…</p></div></section></div>`;
}
async function loadAdminUsers(){const box=$('#adminUsers');if(!box||window.pkRole!=='admin')return;box.innerHTML='<p class="muted">Loading…</p>';try{const {data,error}=await pkClient.functions.invoke('admin-list-users',{body:{}});if(error)throw error;const users=data.users||[];box.innerHTML=users.map(u=>`<div class="admin-user"><b>${esc(u.name||u.login_id)}</b><span>${esc(u.login_id)} · ${esc(u.role)} · ${u.active?'Active':'Inactive'}</span><small>${esc(u.academic_year||'')}</small>${u.role!=='admin'?`<div class="mact l"><button class="btn sm" data-a="admin-toggle" data-id="${esc(u.id)}" data-active="${u.active}">${u.active?'Deactivate':'Activate'}</button><button class="btn sm" data-a="admin-reset" data-id="${esc(u.id)}">Reset password</button><button class="btn sm danger" data-a="admin-delete" data-id="${esc(u.id)}">Delete</button></div>`:''}</div>`).join('')||'<p class="muted">No accounts found.</p>'}catch(e){box.innerHTML=`<p class="err">${esc(pkErr(e))}</p>`}}
async function adminAction(action,payload){try{const {data,error}=await pkClient.functions.invoke('admin-manage-user',{body:{action,...payload}});if(error)throw error;toast(data.message||'Account updated.');loadAdminUsers()}catch(e){toast(pkErr(e))}}
async function createStudent(form){const values=Object.fromEntries(new FormData(form));try{const {data,error}=await pkClient.functions.invoke('admin-create-user',{body:values});if(error)throw error;toast(`Account ${values.login_id} created.`);form.reset();loadAdminUsers()}catch(e){toast(pkErr(e))}}
function settings(){
  const p=S.profile,A=agg(S.chapters);let sz=0;try{sz=(localStorage.getItem(KEY)||'').length}catch{}
  return`<div class="stack"><form class="card mf" id="pf" novalidate><h3>Profile</h3><label>Your name<input name="name" maxlength="40" value="${esc(p.name)}" required></label><label>Academic year<select name="year">${opts(['HSC 2027','HSC 2028'],p.year)}</select></label><label>Your college<input name="college" maxlength="80" value="${esc(p.college)}" required></label><div class="mact"><button class="btn primary">Save profile</button></div></form>
<section class="card mf"><div class="panda-settings-head"><h3>Appearance</h3><button class="panda-gem" type="button" data-a="pname" aria-label="Hidden Professor Panda settings" title="A little hidden gem">✦</button></div><div id="pandaNameEditor" class="panda-name-editor" hidden><label>Give your panda a nickname<input id="pandaNameInput" maxlength="28" value="${esc(pandaName)}" placeholder="Professor Panda"></label><div class="mact l"><button class="btn primary sm" type="button" data-a="pname-save">Save nickname</button></div><small class="muted">A little secret for your study companion.</small></div><div class="mact l"><button class="btn${curTheme()==='light'?' primary':''}" data-a="th" data-t="light">Light</button><button class="btn${curTheme()==='dark'?' primary':''}" data-a="th" data-t="dark">Dark</button></div></section>
<section class="card mf"><h3>Your data</h3><p class="muted">Local safety copy: ${(sz/1024).toFixed(1)} KB, ${S.chapters.length} chapters, ${A.l} lectures. Your signed-in account also syncs with Supabase.</p><div class="mact l"><button class="btn" data-a="ex">Export backup</button><button class="btn" data-a="im">Restore backup</button><button class="btn danger" data-a="rst">Reset all data</button></div></section></div>`}
function user(){
  const P=S.profile,A=agg(S.chapters),up=S.chapters.filter(c=>c.due&&!isDone(c)).sort((a,b)=>cmp(a.due,b.due)),nx=up[0],days=Math.max(1,Math.ceil((Date.now()-new Date(P.joined||now()))/DAY));
  const B=[[150,'Champion','🏆'],[75,'Scholar','🎓'],[30,'Achiever','🏅'],[10,'Explorer','🧭'],[0,'Starter','🌱']].find(b=>A.f>=b[0]);
  const st=[['Overall progress',pct(A.d,A.t)+'%'],['Chapters',S.chapters.length],['Lectures completed',`${A.f}/${A.l}`],['Tasks done',`${A.d}/${A.t}`],['Active deadlines',up.length],['Next deadline',nx?`${cd(nx).big} ${cd(nx).sub}`:'None'],['Focus time',`${S.focusMin||0} min`],['Days with PoriKolpona',days]];
  return`<div class="stack"><div class="card uhero"><div class="av">${P.photo?`<img src="${P.photo}" alt="Your photo">`:IC.user}</div><div><h1>${esc(P.name)}</h1><p class="muted">${esc(P.year)}, ${esc(P.college)}</p><p class="badge">${B[2]} ${B[1]} badge</p><div class="mact l" style="margin-top:8px"><button class="btn sm" data-a="up">Upload photo</button>${P.photo?'<button class="btn sm" data-a="rp">Remove photo</button>':''}</div></div></div><div class="stats">${st.map(([l,v])=>`<div class="stat card"><b>${v}</b><span>${l}</span></div>`).join('')}</div></div>`}
const VIEWS={dashboard,subjects,chapters:()=>listView(0),progress:detailedProgress,deadlines,search:()=>listView(1),user,developer,settings,admin:adminPanel};

function render(){
  const k=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.k;
  const p=S.profile;$('#welcome').hidden=!!p;$('#app').hidden=!p;if(!p)return;
  $('#nav').innerHTML=`<div class="brand"><img src="assets/professor-panda-logo.png" alt=""><b>PoriKolpona</b></div>`+NAV.filter(([v])=>v!=='admin'||window.pkRole==='admin').map(([v,l])=>`<button data-a="nav" data-v="${v}"${UI.v===v?' aria-current="page"':''}><span aria-hidden="true">${IC[v]||'✦'}</span><em>${l}</em></button>`).join('');
  $('#title').innerHTML=`<span class="em">${IC[UI.v]||'✦'}</span> ${NAV.find(n=>n[0]===UI.v)[1]}`;
  $('#theme').textContent=curTheme()==='dark'?'☀':'☾';
  $('#view').innerHTML=VIEWS[UI.v]();if(UI.v==='admin')loadAdminUsers();
  document.getElementById('pandaDock')?.remove();document.body.insertAdjacentHTML('beforeend',pandaDock());
  hdr();if(UI.v==='chapters'||UI.v==='search')res();
  if(k){const e=document.querySelector(`[data-k="${CSS.escape(k)}"]`);if(e)e.focus()}}
function go(v){UI.v=v;render();scrollTo(0,0);if(v==='search')$('#q').focus()}
const reset=o=>Object.assign(UI,{q:'',sub:'',paper:'',st:''},o);

/* chapter form */
function chModal(id,subj){
  const c=id?S.chapters.find(x=>x.id===id):null,s=c?c.subject:subj||SUBJ[0];
  dlg.innerHTML=`<form id="cform" class="mf" novalidate data-id="${c?esc(c.id):''}"><h3>${c?'Edit Chapter':'Add Chapter'}</h3>
<label>Subject<select name="subject">${opts(SUBJ,s)}</select></label>
<label id="plab"${s==='ICT'?' hidden':''}>Paper<select name="paper">${opts(PAPERS,c?c.paper:'')}</select></label>
<label>Chapter number (optional)<input name="num" type="number" min="1" max="99" step="1" value="${c&&c.num?c.num:''}" placeholder="e.g. 7"></label>
<label>Chapter name<input name="name" maxlength="200" required value="${c?esc(c.name):''}" placeholder="e.g. জ্যামিতিক আলোকবিজ্ঞান"></label>
<label>Number of lectures<input name="n" type="number" min="1" max="200" step="1" required value="${c?c.lectures.length:''}"></label>
<fieldset><legend>Chapter deadline</legend>
<label class="rad"><input type="radio" name="dm" value="none"${c&&c.due?'':' checked'}>No deadline</label>
<label class="rad"><input type="radio" name="dm" value="days">Finish within <input name="days" type="number" min="1" max="3650" aria-label="Number of days"> days</label>
<label class="rad"><input type="radio" name="dm" value="date"${c&&c.due?' checked':''}>Finish by <input name="date" type="date" aria-label="Deadline date" value="${c&&c.due?ymd(c.due):''}"></label></fieldset>
<label>Master link (optional)<input name="link" type="url" inputmode="url" placeholder="Playlist or folder where this chapter's lectures are" value="${c?esc(c.link):''}"></label>
<label>Description (optional)<textarea name="desc" rows="2">${c?esc(c.desc):''}</textarea></label>
<label>Personal notes (optional)<textarea name="notes" rows="2">${c?esc(c.notes):''}</textarea></label>
<p class="err" id="cerr" role="alert"></p>
<div class="mact"><button type="button" class="btn" data-a="x">Cancel</button><button class="btn primary">Save</button></div></form>`;
  dlg.showModal();dlg.querySelector('[name=name]').focus()}
async function saveCh(f){
  const v=Object.fromEntries(new FormData(f)),err=m=>{$('#cerr').textContent=m},name=v.name.trim(),n=+v.n,subject=v.subject,paper=subject==='ICT'?'Single Paper':v.paper;
  if(!SUBJ.includes(subject))return err('Choose a subject.');
  if(!name)return err('Enter a chapter name.');
  if(!/^\d+$/.test(v.n)||n<1||n>200)return err('Number of lectures must be a whole number from 1 to 200.');
  const num=v.num?parseInt(v.num):0;if(v.num&&(!/^\d+$/.test(v.num)||num<1||num>99))return err('Chapter number must be 1 to 99.');
  const link=url(v.link||'');if(link===null)return err('The master link is not a valid web address.');
  let due=null;
  if(v.dm==='days'){const d=+v.days;if(!/^\d+$/.test(v.days||'')||d<1||d>3650)return err('Enter the number of days (1 to 3650).');const t=new Date();t.setDate(t.getDate()+d);t.setHours(23,59,59,0);due=t.toISOString()}
  else if(v.dm==='date'){const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(v.date||'');if(!m)return err('Pick a valid deadline date.');due=new Date(+m[1],m[2]-1,+m[3],23,59,59).toISOString()}
  const t=now();let c=S.chapters.find(x=>x.id===f.dataset.id);
  if(c){
    if(n<c.lectures.length){if(!await ask(`Reducing to ${n} lectures will permanently delete the last ${c.lectures.length-n} lecture(s), including their progress, links and notes. Continue?`,'Delete lectures'))return;c.lectures.splice(n)}
    let m=Math.max(0,...c.lectures.map(l=>l.n));while(c.lectures.length<n)c.lectures.push(mkLec(++m));
    Object.assign(c,{subject,paper,name,num,link,desc:v.desc.trim(),notes:v.notes.trim(),due,updated:t})}
  else S.chapters.push({id:uid(),subject,paper,name,num,link,desc:v.desc.trim(),notes:v.notes.trim(),due,created:t,updated:t,lectures:Array.from({length:n},(_,i)=>mkLec(i+1))});
  UI.open[(c||S.chapters[S.chapters.length-1]).id]=true;
  save();dlg.close();render();toast(c?'Chapter saved':`Chapter added with ${n} lectures`)}

/* backup */
function exportData(){
  const b=new Blob([JSON.stringify({app:'hsc-study-tracker',version:1,exported:now(),data:S},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`hsc-backup-${ymd(new Date())}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1e3);toast('Backup downloaded')}
$('#file').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{
    const j=JSON.parse(await f.text()),n=cleanData(j&&j.data||j);
    if(!await ask(`Restore this backup with ${n.chapters.length} chapter(s)? It replaces all current data in this browser.`,'Replace my data'))return;
    S={...n,profile:n.profile||S.profile};noSave=false;save();applyTheme();render();toast('Backup restored')}
  catch(err){toast('Import failed: '+err.message)}};

/* events */
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,id=b.dataset.id,c=id&&S.chapters.find(x=>x.id===id),l=c&&c.lectures.find(x=>x.id===b.dataset.l);
  switch(a){
    case'nav':go(b.dataset.v);break;
    case'pg-toggle':{const k='pg-'+b.dataset.v;UI.open[k]=UI.open[k]===false?true:false;render();break}
    case'print-list':printProgress(b.dataset.v);break
    case'admin-refresh':loadAdminUsers();break
    case'admin-toggle':await adminAction('set_active',{user_id:id,active:b.dataset.active!=='true'});break
    case'admin-reset':{const pw=prompt('Enter a new temporary password (at least 12 characters):');if(pw)await adminAction('reset_password',{user_id:id,password:pw});break}
    case'admin-delete':if(await ask('Permanently delete this student account and all their data?','Delete account','DELETE'))await adminAction('delete_user',{user_id:id});break
    case'signout':await pkSignOut();break;
    case'panda':if(b.dataset.v==='toggle'){const d=$('#pandaDock');d.classList.toggle('panda-open');pandaSpeak('welcome')}else pandaSpeak(b.dataset.v);break;
    case'pname':{const e=$('#pandaNameEditor');e.hidden=!e.hidden;if(!e.hidden)$('#pandaNameInput').focus();break}
    case'pname-save':{const v=$('#pandaNameInput').value.trim();if(!v)return toast('Enter a name first.');pandaName=v.slice(0,28);localStorage.setItem('porikolpona-panda-name',pandaName);save();render();toast(`${pandaName} is ready to help!`);break}
    case'tg':{const el=b.closest('.col'),o=el.classList.toggle('open');UI.open[el.dataset.id]=o;b.setAttribute('aria-expanded',o);const z=el.querySelector(':scope>.bd>.in>.lecs');if(o&&z&&!z.firstChild)z.innerHTML=lecs(S.chapters.find(x=>x.id===el.dataset.id));break}
    case'add':chModal(null,b.dataset.s);break;
    case'ed':chModal(id);break;
    case'x':dlg.close();break;
    case'tt':S.theme=curTheme()==='dark'?'light':'dark';applyTheme();save();render();break;
    case'th':S.theme=b.dataset.t;applyTheme();save();render();break;
    case'go':reset();UI.open[id]=true;go('chapters');setTimeout(()=>{const el=document.getElementById('ch-'+id);if(el)el.scrollIntoView({block:'start'})},60);break;
    case'fs':reset({sub:b.dataset.s});go('chapters');break;
    case'un':reset({st:'todo'});go('chapters');break;
    case'ea':S.chapters.forEach(x=>UI.open[x.id]=true);res();break;
    case'ca':UI.open={};res();break;
    case'dc':if(await ask(`Delete "${c.name}" and all ${c.lectures.length} of its lectures? This cannot be undone.`,'Delete chapter')){S.chapters=S.chapters.filter(x=>x!==c);save();render();toast('Chapter deleted')}break;
    case'cdl':c.due=null;c.updated=now();save();render();toast('Deadline removed');break;
    case'ok':l.t=[true,true,true,true];touch(c,l);break;
    case'rs':if(await ask(`Reset all four tasks for Lecture ${l.n}?`,'Reset tasks')){l.t=[false,false,false,false];touch(c,l)}break;
    case'dl':if(await ask(`Delete Lecture ${l.n}, including its progress, links and note?`,'Delete lecture')){c.lectures=c.lectures.filter(x=>x!==l);touch(c)}break;
    case'al':c.lectures.push(mkLec(Math.max(0,...c.lectures.map(x=>x.n))+1));UI.open[c.id]=true;touch(c);toast('Lecture added');break;
    case'xd':{const d=c.due&&new Date(c.due)>new Date()?new Date(c.due):new Date();d.setDate(d.getDate()+7);d.setHours(23,59,59,0);c.due=d.toISOString();touch(c);toast('Deadline extended by 7 days');break}
    case'up':$('#photo').click();break;
    case'rp':S.profile.photo='';save();render();break;
    case'fo':if(!F){F={m:'setup',w:25,b:5};fx()}break;
    case'fgo':{const w=+$('#fw').value,bk=+$('#fb').value;if(!(w>=1&&w<=180&&bk>=1&&bk<=60))return toast('Use 1 to 180 focus minutes and 1 to 60 break minutes.');F={m:'work',w,b:bk,end:Date.now()+w*6e4};fsave();fx();break}
    case'fc':F=null;fx();break;
    case'fp':if(F.end){F.left=F.end-Date.now();F.end=0}else F.end=Date.now()+F.left;fsave();fx();break;
    case'fe':if(await ask('End this focus session? The current round will not be counted.','End session')){F=null;fsave();fx()}break;
    case'ex':exportData();break;
    case'im':$('#file').click();break;
    case'rst':if(await ask('This permanently deletes your profile, chapters, progress, links and notes from this browser. Export a backup first if you might need them.','Delete everything','RESET')){S={profile:null,theme:S.theme,chapters:[]};UI.open={};reset();UI.v='dashboard';noSave=false;try{localStorage.removeItem(KEY)}catch{}render();toast('All data reset')}break}});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='q'){UI.q=t.value;clearTimeout(qt);qt=setTimeout(res,150)}
  else if(t.name==='days'||t.name==='date')t.form.dm.value=t.name});
document.addEventListener('change',e=>{
  const t=e.target,M={fs:'sub',fp:'paper',ft:'st',fo:'sort'};
  if(t.dataset.statusId){const c=S.chapters.find(x=>x.id===t.dataset.statusId);if(c){c.status=t.value;if(t.value==='completed')c.lectures.forEach(l=>l.t=[true,true,true,true]);c.updated=now();save();render();pandaSpeak(t.value==='completed'?'celebrate':'encourage')}return}
  if(M[t.id]){UI[M[t.id]]=t.value;res()}
  else if(t.name==='subject'&&t.form&&t.form.id==='cform')$('#plab').hidden=t.value==='ICT';
  else if(t.classList.contains('mc')){const[c,l]=find(t.dataset.c,t.dataset.l);if(l){l.t=[0,1,2,3].map(()=>t.checked);touch(c,l)}}
  else if(t.classList.contains('t')){const[c,l]=find(t.dataset.c,t.dataset.l);if(l){l.t[+t.dataset.i]=t.checked;touch(c,l)}}
  else if(t.classList.contains('u')){
    const[c,l]=find(t.dataset.c,t.dataset.l);if(!l)return;
    const f=t.dataset.f,v=url(t.value);
    if(v===null){toast('That is not a valid web link. Check it and try again.');t.value=l[f];return}
    l[f]=v;t.value=v;const a=t.closest('.ur').querySelector('a');a.href=v||'#';a.hidden=!v;c.updated=l.updated=now();save();toast(v?'Link saved':'Link removed')}
  else if(t.classList.contains('ln')){const[c,l]=find(t.dataset.c,t.dataset.l);if(l){l.note=t.value;c.updated=l.updated=now();save()}}});
document.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target;
  if(f.id==='cform')await saveCh(f);
  else if(f.id==='adminCreate'){await createStudent(f)}
  else if(f.id==='pf'){const v=Object.fromEntries(new FormData(f));if(!v.name.trim()||!v.college.trim())return toast('Name and college are required.');S.profile={...S.profile,name:v.name.trim(),year:v.year,college:v.college.trim()};save();render();toast('Profile saved')}
  else if(f.id==='wform'){await pkSignIn(f)}});
const live=()=>{if(S.profile)hdr();if(S.profile&&!F&&(UI.v==='dashboard'||UI.v==='deadlines')&&!dlg.open&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))render()};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)live()});
addEventListener('focus',live);setInterval(live,6e4);
matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>{applyTheme();live()});

const FK='porikolpona-focus';let F=null,ft;
try{F=JSON.parse(localStorage.getItem(FK))}catch{}
if(!F||!['work','break'].includes(F.m)||!(F.w>0)||!(F.b>0))F=null;
const fsave=()=>{try{F?localStorage.setItem(FK,JSON.stringify(F)):localStorage.removeItem(FK)}catch{}};
function fx(){
  const o=$('#focus');clearInterval(ft);document.title='PoriKolpona';$('#app').inert=!!F;
  if(!F){o.hidden=true;return}
  o.hidden=false;
  if(F.m==='setup'){o.innerHTML=`<div class="card fcard"><div class="em big">${IC.focus}</div><h2>Focus timer</h2><p class="muted">While a session runs, everything else is locked so you can concentrate.</p><label>Focus minutes<input id="fw" type="number" min="1" max="180" value="${F.w}"></label><label>Break minutes<input id="fb" type="number" min="1" max="60" value="${F.b}"></label><div class="mact"><button class="btn" data-a="fc">Cancel</button><button class="btn primary" data-a="fgo">Start focus</button></div></div>`;return}
  o.innerHTML=`<div class="card fcard"><div class="em big">${F.m==='work'?IC.focus:'☕'}</div><h2>${F.m==='work'?'Focus time':'Break time'}</h2><div id="fclock" class="clock"></div>${bar(0)}<div class="mact"><button class="btn" data-a="fp">${F.end?'Pause':'Resume'}</button><button class="btn danger" data-a="fe">End session</button></div></div>`;
  const step=()=>{
    if(F.end&&Date.now()>=F.end){
      if(F.m==='work'){S.focusMin=(S.focusMin||0)+F.w;save();F.m='break';F.end=Date.now()+F.b*6e4;toast('Focus round done. Take a break!')}
      else{F.m='work';F.end=Date.now()+F.w*6e4;toast('Break over. Back to focus!')}
      if(navigator.vibrate)navigator.vibrate(300);fsave();return fx()}
    const left=F.end?F.end-Date.now():F.left,all=(F.m==='work'?F.w:F.b)*6e4,s=Math.ceil(left/1e3),t=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
    $('#fclock').textContent=t;document.title=t+' | PoriKolpona';$('#focus .bar i').style.width=(100-left/all*100)+'%'};
  step();if(F.end)ft=setInterval(step,1000)}
$('#photo').onchange=e=>{
  const f=e.target.files[0];e.target.value='';if(!f||!/^image\//.test(f.type))return toast('Choose an image file.');
  const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const s=256,cv=document.createElement('canvas'),m=Math.min(i.width,i.height);cv.width=cv.height=s;cv.getContext('2d').drawImage(i,(i.width-m)/2,(i.height-m)/2,m,m,0,0,s,s);S.profile.photo=cv.toDataURL('image/jpeg',.82);save();render();toast('Photo updated')};i.onerror=()=>toast('That image could not be read.');i.src=r.result};r.readAsDataURL(f)};
function printProgress(mode){
  const list=S.chapters.filter(c=>mode==='all'||(mode==='untouched'?chapterState(c)==='untouched':chapterState(c)!=='completed'));
  const title=mode==='untouched'?'Untouched chapters':mode==='unfinished'?'Unfinished chapters':'Detailed progress';
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font:14px system-ui;padding:28px;color:#18221f}h1{font-size:22px}li{padding:8px 0;border-bottom:1px solid #ddd}.muted{color:#666}</style></head><body><h1>PoriKolpona · ${title}</h1><p>${esc(S.profile?.name||'Student')} · ${new Date().toLocaleDateString()}</p><ol>${list.map(c=>`<li><b>${esc(ttl(c))}</b><br><span class="muted">${esc(meta(c))} · ${chapterState(c)} · ${pct(dn(c),tot(c))}% task progress</span></li>`).join('')}</ol></body></html>`;
  const w=window.open('','_blank');if(!w)return toast('Allow pop-ups to print this report.');w.document.write(html);w.document.close();w.focus();w.print();
}
function initCursorBirds(){if(matchMedia('(prefers-reduced-motion: reduce)').matches||innerWidth<820)return;const layer=document.createElement('div');layer.className='cursor-birds';layer.innerHTML='<span>✦</span><span>⌁</span><span>✧</span>';document.body.append(layer);const birds=[...layer.children];let raf=0,x=innerWidth/2,y=innerHeight/2;addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;if(!raf)raf=requestAnimationFrame(()=>{birds.forEach((b,i)=>{b.style.transform=`translate(${x+(i-1)*18}px,${y+18+i*13}px) rotate(${(i-1)*12}deg)`});raf=0})},{passive:true});}
applyTheme();$('#werr').textContent='';render();fx();pkBoot().catch(e=>{$('#werr').textContent=pkErr(e);render()});initCursorBirds();
