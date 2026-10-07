(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const K={s:'tf.settings',t:'tf.timer',d:'tf.stats'},MODES=['focus','short','long'],STATUS=['idle','running','paused','completed'];
const DEF={focus:25,short:5,long:15,interval:4,autoBreak:true,autoFocus:false,sound:true};
const LIM={focus:[1,120],short:[1,60],long:[1,120],interval:[1,12]};
const STAGES=[[0,'Semilla'],[5,'Brote'],[25,'Plantita'],[60,'Planta con hojas'],[120,'Tomatera en flor'],[240,'Tomatera con tomates']];
const SAY={idle:['Hola, soy Tommy. Cuando quieras, empezamos.'],focus:['A concentrarse, yo cuido la planta.','Un paso a la vez, vas bien.','Respira hondo y sigue.'],paused:['Pausa tomada. Aquí te espero.'],short:['Estira las piernas y toma agua.'],long:['Descanso largo, te lo ganaste.'],doneFocus:['¡Sesión completa! Tu tomatera creció.'],doneBreak:['Descanso terminado. ¿Volvemos al focus?']};
const CFG={idle:{e:'open',m:'smile'},focus:{e:'open',m:'flat',b:1},paused:{e:'closed',m:'smile'},short:{e:'closed',m:'smile',z:1},long:{e:'happy',m:'big'},completed:{e:'open',m:'open',a:1}};
const EYES={open:[[4,9],[5,9],[4,10],[5,10],[10,9],[11,9],[10,10],[11,10]],closed:[[4,10],[5,10],[10,10],[11,10]],happy:[[4,10],[5,9],[6,10],[9,10],[10,9],[11,10]]};
const MOUTH={smile:[[6,12],[7,13],[8,13],[9,12]],flat:[[6,13],[7,13],[8,13],[9,13]],big:[[6,12],[7,12],[8,12],[9,12],[7,13],[8,13]],open:[[7,12],[8,12],[7,13],[8,13]]};
const ICON={play:'<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2h2v12H4zM6 4h2v8H6zM8 5h2v6H8zM10 7h2v2h-2z" fill="currentColor"/></svg>',pause:'<svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h4v12H3zM9 2h4v12H9z" fill="currentColor"/></svg>'};
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const obj=o=>o&&typeof o==='object'?o:{};
const clamp=(v,d,[a,b])=>{const n=Number(v);return v==null||v===''||!Number.isFinite(n)?d:Math.min(b,Math.max(a,Math.round(n)))};
const cleanS=o=>{o=obj(o);const s={};for(const k in LIM)s[k]=clamp(o[k],DEF[k],LIM[k]);for(const k of['autoBreak','autoFocus','sound'])s[k]=typeof o[k]==='boolean'?o[k]:DEF[k];return s};
let S=cleanS(store.get(K.s)),T,D;
const dur=m=>S[m]*60000;
const cleanT=o=>{o=obj(o);const mode=MODES.includes(o.mode)?o.mode:'focus';let status=STATUS.includes(o.status)?o.status:'idle';
let total=o.total>0&&isFinite(o.total)?o.total:dur(mode),rem=Number(o.remaining);rem=isFinite(rem)&&rem>=0&&rem<=total?rem:total;
const target=Number(o.target)||0;if(status==='running'&&!target)status='idle';
if(status==='idle'||status==='completed'){total=rem=dur(mode)}
return{mode,status,total,remaining:rem,target,cycle:Math.max(0,Math.floor(Number(o.cycle))||0)}};
const cleanD=o=>{o=obj(o);const n=v=>Math.max(0,Number(v)||0);return{date:typeof o.date==='string'?o.date:'',sessions:Math.floor(n(o.sessions)),focusMs:n(o.focusMs),totalMs:n(o.totalMs),streak:Math.floor(n(o.streak)),last:typeof o.last==='string'?o.last:''}};
T=cleanT(store.get(K.t));D=cleanD(store.get(K.d));
const dk=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dk(new Date()),yest=()=>{const d=new Date();d.setDate(d.getDate()-1);return dk(d)};
const rollover=()=>{if(D.date!==today()){D.date=today();D.sessions=0;D.focusMs=0;store.set(K.d,D)}};
const streakNow=()=>D.last===today()||D.last===yest()?D.streak:0;
const fmt=ms=>{const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const dur2=ms=>{const m=Math.floor(ms/60000);return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'};
let iv=0,uiKey='',trayKey='',plantKey=-1,ac=null;
const persist=()=>store.set(K.t,T),persistD=()=>store.set(K.d,D);
const stopLoop=()=>{clearInterval(iv);iv=0};
const startLoop=()=>{stopLoop();iv=setInterval(tick,250)};
const live=()=>T.mode==='focus'&&(T.status==='running'||T.status==='paused')?Math.max(0,T.total-T.remaining):0;
function addFocus(ms){rollover();ms=Math.max(0,ms);D.focusMs+=ms;D.totalMs+=ms;persistD()}
function bank(){if(T.status==='running')T.remaining=Math.max(0,T.target-Date.now());addFocus(live())}
function unlock(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch{}}
function chime(){if(!S.sound||!ac)return;try{[523,659,784].forEach((f,i)=>{const t=ac.currentTime+i*.15,o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+.14)})}catch{}}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=$('#confetti'),cols=['#cb4837','#edc155','#5aa75a','#ffb4a8'];for(let i=0;i<26;i++){const s=document.createElement('span');s.style.cssText=`left:${Math.random()*100}%;background:${cols[i%4]};animation-delay:${Math.random()*.4}s`;c.append(s);setTimeout(()=>s.remove(),2200)}}
function run(){T.status='running';T.target=Date.now()+T.remaining;persist();startLoop();render()}
function pause(){T.remaining=Math.max(0,T.target-Date.now());T.status='paused';stopLoop();persist();render()}
function toggle(){if(T.status==='running')pause();else{unlock();run()}}
function reset(){bank();stopLoop();T.status='idle';T.total=T.remaining=dur(T.mode);persist();render()}
function setMode(m){bank();stopLoop();T.mode=m;T.status='idle';T.total=T.remaining=dur(m);persist();render()}
function sync(){S=cleanS(store.get(K.s));T=cleanT(store.get(K.t));D=cleanD(store.get(K.d));T.status==='running'?startLoop():stopLoop();render()}
function tick(){if(T.status!=='running')return stopLoop();rollover();T.remaining=Math.max(0,T.target-Date.now());T.remaining===0?finish():render()}
function finish(){
const st=store.get(K.t);if(st&&(st.status!=='running'||st.target!==T.target))return sync();
stopLoop();rollover();
const wasFocus=T.mode==='focus';
if(wasFocus){addFocus(T.total);D.sessions++;const t=today();if(D.last!==t){D.streak=D.last===yest()?D.streak+1:1;D.last=t}persistD();T.cycle++}
else if(T.mode==='long')T.cycle=0;
const next=wasFocus?(T.cycle>=S.interval?'long':'short'):'focus';
T.mode=next;T.total=T.remaining=dur(next);T.status='completed';
chime();if(wasFocus)confetti();
(next==='focus'?S.autoFocus:S.autoBreak)?run():(persist(),render())}
function tommy(state){
let r='';const p=(x,y,c)=>r+=`<rect x="${x+2}" y="${y}" width="1" height="1" fill="${c}"/>`,all=(a,c)=>a.forEach(([x,y])=>p(x,y,c));
const ink='#3a2d2a',red='#cb4837',inn=(x,y)=>{const a=(x-7.5)/7.6,b=(y-10)/6.4;return a*a+b*b<=1};
for(let y=3;y<18;y++)for(let x=0;x<16;x++)if(inn(x,y))p(x,y,inn(x-1,y)&&inn(x+1,y)&&inn(x,y-1)&&inn(x,y+1)?red:ink);
all([[3,6],[4,6],[3,7]],'#ffdad4');
all([[7,1],[8,1],[7,2],[8,2],[7,3],[8,3]],'#2e6b2e');
all([[4,3],[5,3],[6,3],[5,2],[9,3],[10,3],[11,3],[10,2]],'#5aa75a');
all([[2,11],[3,11],[12,11],[13,11]],'#ffb4a8');
const c=CFG[state];
if(c.b)all([[3,7],[4,8],[5,8],[12,7],[11,8],[10,8]],ink);
all(EYES[c.e],ink);all(MOUTH[c.m],ink);
if(c.z)all([[14,1],[15,1],[14,2],[14,3],[15,3]],'#745800');
if(c.a){all([[-1,9],[-2,8],[-2,7],[16,9],[17,8],[17,7]],ink);all([[-2,2],[17,2],[13,0]],'#edc155')}
return`<svg viewBox="0 0 20 18" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`}
function plant(min){
let r='';const p=(x,y,c,w=1,h=1)=>r+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const G='#2e6b2e',L='#5aa75a';
p(5,21,'#b5653f',14);p(6,22,'#c97a4f',12,4);p(7,26,'#3a2d2a',10);p(7,20,'#5a3d2e',10);
if(min<5)p(11,19,'#745800',2);
else{
const h=Math.round(2+Math.min(1,min/240)*13),top=20-h;
p(11,top,G,2,h);
for(let j=0;j<4;j++){const dy=3+j*3;if(h<dy+2)continue;const y=19-dy;p(8,y,L,3);p(8,y-1,L);p(13,y-1,L,3);p(15,y-2,L)}
if(h>=6){p(10,top-1,L,4);p(11,top-2,L,2)}
const fl=(x,y)=>p(x,y,'#edc155',2,2),fr=(x,y)=>{p(x,y,'#cb4837',3,3);p(x,y,'#ffdad4');p(x+1,y-1,G)};
if(min>=240){fr(13,12);fr(6,14);fr(14,7);fl(11,top-4)}
else if(min>=120){fl(7,top+1);fl(15,top+4);fl(11,top-4)}}
return`<svg viewBox="0 0 24 27" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`}
const sprite=()=>T.status==='completed'?'completed':T.status==='paused'?'paused':T.status==='running'?T.mode:'idle';
function render(){
const st=T.status,m=T.mode,rem=T.remaining,pct=Math.min(1,Math.max(0,1-rem/T.total)),clock=fmt(rem);
$('#time').textContent=clock;
document.title=(st==='running'?clock+' · ':'')+'Tomato Focus';
document.body.dataset.mode=m;
const names={focus:'Focus '+S.focus+' min',short:'Descanso '+S.short+' min',long:'Largo '+S.long+' min'};
$$('.tab').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.mode===m);b.textContent=names[b.dataset.mode]});
$$('.seg i').forEach((el,i)=>el.style.width=Math.min(1,Math.max(0,pct*10-i))*100+'%');
$('#bar').setAttribute('aria-valuenow',Math.floor(pct*100));
$('#pct').textContent=Math.floor(pct*100)+'%';$('#elap').textContent=fmt(T.total-rem)+' / '+fmt(T.total);
$('#pill').textContent=st==='running'?{focus:'Enfocado',short:'Descanso corto',long:'Descanso largo'}[m]:st==='paused'?'En pausa':st==='completed'?'Sesión completada':'Listo para empezar';
const uk=st+'|'+m;
if(uk!==uiKey){uiKey=uk;
const lab=st==='running'?'Pausar':st==='paused'?'Reanudar':{focus:'Iniciar focus',short:'Iniciar descanso',long:'Iniciar descanso largo'}[m];
$('#go').innerHTML=(st==='running'?ICON.pause:ICON.play)+'<span>'+lab+'</span>';
const sp=sprite(),dk2=st==='completed'?(m==='focus'?'doneBreak':'doneFocus'):sp,lines=SAY[dk2];
const f=$('#tommy');f.innerHTML=tommy(sp);f.dataset.s=sp;f.setAttribute('aria-label','Tommy: '+sp);
$('#say').textContent=lines[Math.floor(Math.random()*lines.length)]}
const tk=[T.cycle,S.interval,st,m].join('|');
if(tk!==trayKey){trayKey=tk;
$('#trayTxt').textContent='Hasta el descanso largo: '+Math.min(T.cycle,S.interval)+' de '+S.interval;
$('#slots').innerHTML=Array.from({length:S.interval},(_,i)=>`<span class="slot" data-s="${i<T.cycle?'done':i===T.cycle&&m==='focus'&&(st==='running'||st==='paused')?'active':''}"></span>`).join('')}
rollover();const lv=live();
$('#n').textContent=D.sessions;$('#f').textContent=dur2(D.focusMs+lv);
const sk=streakNow();$('#s').textContent=sk+(sk===1?' día':' días');
const min=(D.totalMs+lv)/60000;let si=0;STAGES.forEach(([t],i)=>{if(min>=t)si=i});
if(Math.floor(min)!==plantKey){plantKey=Math.floor(min);$('#plant').innerHTML=plant(min);$('#plant').setAttribute('aria-label','Tomatera: '+STAGES[si][1])}
$('#stage').textContent=STAGES[si][1];$('#total').textContent='Has estudiado '+dur2(min*60000)+' en total';
const nx=STAGES[si+1];
$('#grow').style.width=(nx?(min-STAGES[si][0])/(nx[0]-STAGES[si][0])*100:100)+'%';
$('#next').textContent=nx?'Faltan '+Math.ceil(nx[0]-min)+' min para: '+nx[1]:'Etapa final alcanzada';
const sb=$('#snd');sb.textContent='Sonido: '+(S.sound?'sí':'no');sb.setAttribute('aria-pressed',S.sound)}
/* eventos */
$('#go').onclick=toggle;$('#rst').onclick=reset;
$$('.tab').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$('#snd').onclick=()=>{S.sound=!S.sound;store.set(K.s,S);if(S.sound)unlock();render()};
const dlg=$('#dlg'),FIELDS=Object.keys(LIM),TOG=['autoBreak','autoFocus','sound'];
const setSw=(b,v)=>{b.setAttribute('aria-checked',v);b.textContent=v?'Sí':'No'};
$('#cfg').onclick=()=>{FIELDS.forEach(k=>$('#f-'+k).value=S[k]);TOG.forEach(k=>setSw($('#sw-'+k),S[k]));$('#err').textContent='';dlg.showModal()};
$$('.sw').forEach(b=>b.onclick=()=>setSw(b,b.getAttribute('aria-checked')!=='true'));
$('#cancel').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
$('#save').onclick=()=>{
const n={};
for(const k of FIELDS){const el=$('#f-'+k),v=Number(el.value),[a,b]=LIM[k];
if(el.value===''||!Number.isInteger(v)||v<a||v>b){$('#err').textContent=el.dataset.name+' debe ser un número entero entre '+a+' y '+b+'.';el.focus();return}n[k]=v}
TOG.forEach(k=>n[k]=$('#sw-'+k).getAttribute('aria-checked')==='true');
if(n.sound&&!S.sound)unlock();
S=n;store.set(K.s,S);
if(T.status==='idle'||T.status==='completed'){T.total=T.remaining=dur(T.mode);persist()}
dlg.close();render()};
addEventListener('keydown',e=>{
if(dlg.open||e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName))return;
if(e.code==='Space'){e.preventDefault();toggle()}else if(e.code==='KeyR'){e.preventDefault();reset()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
addEventListener('storage',e=>{if([K.s,K.t,K.d].includes(e.key))sync()});
addEventListener('pagehide',stopLoop);
/* inicio */
$('#logo').innerHTML=tommy('idle');
$('#bar').innerHTML='<div class="seg"><i></i></div>'.repeat(10);
rollover();
if(T.status==='running')T.remaining=Math.max(0,T.target-Date.now());
render();
if(T.status==='running')T.remaining===0?finish():startLoop();
})();
