const KEY='md2a0831',$=id=>document.getElementById(id),C=MD2.classes;
const COLORS={rogue:'#8b5cf6',ranger:'#22c55e',shaman:'#f59e0b',paladin:'#3b82f6',mage:'#06b6d4',berserker:'#ef4444'};
function makeHero(cls='rogue'){const c=C[cls];return{id:Date.now()+Math.random(),name:c.label,cls,level:1,xp:0,hp:c.hp,hpMax:c.hp,mana:c.mana,manaMax:c.mana,zone:'light',actions:(s?.mode==='solo'?4:3),choices:{1:null},lockedChoices:{},move:{on:false,pm:0},inventory:[],equipped:[],rogue:{hand:3,spent:0},shaman:{fire:0,water:0,air:0,nature:0,unlocked:{}},paladin:{consecrations:0,blessed:''},mage:{amulet:0,slots:['+1 Espada','+1 Alcance','+1 PM','Cura 3']},berserker:{fury:0,stance:'Furia Sangrienta'},unconscious:false,manaAtKO:null,reviveNextRound:false,flow:{type:null,step:0,attack:{},defense:{}}}}
function fresh(){return{mode:'coop',round:1,phase:0,dark:{side:'front',i:0},heroes:[],active:0,history:[],phaseHistory:[],xpHistory:[],confirmed:false,voice:'yes',rate:1,music:'yes',musicVolume:0.15,sfx:'yes',voicePitch:1,voiceName:'',audioUnlocked:false,lastAnnouncement:'',speechQueue:[],resurrection:{blue:0,grey:0},levelQueue:[],levelCursor:0,levelPhaseResolved:false,darknessPending:false}}
let s=JSON.parse(localStorage.getItem(KEY)||'null')||fresh();
s.heroes.forEach(x=>{if(typeof x.unconscious!=='boolean')x.unconscious=false;if(typeof x.reviveNextRound!=='boolean')x.reviveNextRound=false;if(x.manaAtKO===undefined)x.manaAtKO=null});
if(!s.resurrection)s.resurrection={blue:Math.ceil(Math.max(1,s.heroes.length)/2),grey:0};
if(!Array.isArray(s.levelQueue))s.levelQueue=[];if(s.levelCursor===undefined)s.levelCursor=0;if(s.levelPhaseResolved===undefined)s.levelPhaseResolved=false;if(s.darknessPending===undefined)s.darknessPending=false;
if(!s.mode)s.mode='coop';if(!Array.isArray(s.speechQueue))s.speechQueue=[];if(s.music===undefined)s.music='yes';if(s.musicVolume===undefined)s.musicVolume=.15;if(s.sfx===undefined)s.sfx='yes';if(s.voicePitch===undefined)s.voicePitch=1;if(s.voiceName===undefined)s.voiceName='';if(s.audioUnlocked===undefined)s.audioUnlocked=false;if(s.lastAnnouncement===undefined)s.lastAnnouncement='';

let audioCtx=null,currentAmbient='',activeMusic=null,musicWasPlaying=false,speechBusy=false;
const musicEls=()=>({heroes:$('musicHeroes'),attack:$('musicCombat'),defense:$('musicCombat'),dark:$('musicDark'),level:$('musicHeroes'),setup:$('musicHeroes')});
function musicLabel(mode){return({heroes:'Ambiental de héroes',attack:'Combate',defense:'Combate',dark:'Oscuridad',level:'Ambiental de héroes',setup:'Ambiental de héroes'})[mode]||'Ninguna'}
async function ensureAudio(){
  try{
    if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')await audioCtx.resume();
    const probe=$('musicHeroes');
    probe.volume=0.001;
    await probe.play();
    probe.pause();probe.currentTime=0;
    s.audioUnlocked=true;save();renderAudioStatus();return true
  }catch(e){s.audioUnlocked=false;save();renderAudioStatus();return false}
}
function stopAmbient(){
  Object.values(musicEls()).forEach(a=>{if(a){a.pause();a.currentTime=0}});
  activeMusic=null;currentAmbient='';renderAudioStatus()
}
function playTone(freq,dur=.3,vol=.03,type='sine'){
  if(s.sfx!=='yes'||!s.audioUnlocked||!audioCtx)return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.value=Math.min(vol,.08);
  o.connect(g);g.connect(audioCtx.destination);o.start();
  g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);
  o.stop(audioCtx.currentTime+dur)
}
async function ambient(mode){
  if(s.music!=='yes'||!s.audioUnlocked){stopAmbient();return}
  const target=musicEls()[mode]||musicEls().heroes;
  if(activeMusic===target&&!target.paused){target.volume=+s.musicVolume||.15;renderAudioStatus();return}
  Object.values(musicEls()).forEach(a=>{if(a&&a!==target){a.pause();a.currentTime=0}});
  currentAmbient=mode;activeMusic=target;target.volume=+s.musicVolume||.15;
  try{await target.play()}catch(e){s.audioUnlocked=false;save()}
  renderAudioStatus()
}
function pauseMusicForSpeech(){
  musicWasPlaying=!!activeMusic&&!activeMusic.paused;
  if(activeMusic&&musicWasPlaying)activeMusic.volume=Math.max(.015,(+s.musicVolume||.15)*.18)
}
function restoreMusicAfterSpeech(){
  if(activeMusic&&musicWasPlaying)activeMusic.volume=+s.musicVolume||.15;
  else updateAmbient()
}
function duckAndSay(t,profileHero=h(),after=null){enqueueSpeech(t,profileHero,after)}
function updateAmbient(){
  if(!s.confirmed)return ambient('setup');
  if(h()?.flow?.type==='attack'||h()?.flow?.type==='defense')return ambient('attack');
  if(s.phase===3)return ambient('dark');
  if(s.phase===2)return ambient('level');
  ambient('heroes')
}
const h=()=>s.heroes[s.active],cl=()=>C[h().cls],save=()=>localStorage.setItem(KEY,JSON.stringify(s));

function classVoiceProfile(x=h()){const p={rogue:{rate:1.04,pitch:.92},ranger:{rate:1.08,pitch:1},shaman:{rate:.9,pitch:.95},paladin:{rate:.92,pitch:.9},mage:{rate:.9,pitch:1.04},berserker:{rate:1.08,pitch:.82}};return x?p[x.cls]||{rate:1,pitch:1}:{rate:1,pitch:1}}
function enqueueSpeech(t,profileHero=h(),after=null){
  s.lastAnnouncement=t||s.lastAnnouncement;save();
  if(s.voice!=='yes'||!('speechSynthesis'in window)){if(after)setTimeout(after,60);return}
  s.speechQueue.push({t,heroId:profileHero?.id||null,after});processSpeechQueue()
}
function processSpeechQueue(){
  if(speechBusy||!s.speechQueue.length)return;
  speechBusy=true;const item=s.speechQueue.shift();
  const hero=s.heroes.find(x=>x.id===item.heroId)||h();
  const u=new SpeechSynthesisUtterance(item.t);u.lang='es-ES';
  const prof=classVoiceProfile(hero);u.rate=(+s.rate||1)*prof.rate;u.pitch=(+s.voicePitch||1)*prof.pitch;
  const voices=speechSynthesis.getVoices();
  const chosen=voices.find(v=>v.name===s.voiceName)||voices.find(v=>v.lang?.toLowerCase().startsWith('es'));
  if(chosen)u.voice=chosen;
  pauseMusicForSpeech();
  const done=()=>{speechBusy=false;restoreMusicAfterSpeech();save();if(item.after)setTimeout(item.after,180);setTimeout(processSpeechQueue,120)};
  u.onend=done;u.onerror=done;speechSynthesis.speak(u)
}
function say(t,profileHero=h(),after=null){enqueueSpeech(t,profileHero,after)}
function log(t){s.history.unshift({r:s.round,p:MD2.phases[s.phase],n:h()?.name||'Grupo',t});save();renderHistory()}
function dungeon(){return Math.max(1,...s.heroes.map(x=>x.level))}
function skills(x=h()){return C[x.cls].skills.map(a=>({name:a[0],level:a[1],branch:a[2],grade:a[3]}))}
function activeSkills(x=h()){const chosen=Object.values(x.choices||{}).filter(Boolean).map(n=>skills(x).find(q=>q.name===n)).filter(Boolean),m={};chosen.forEach(q=>{if(!m[q.branch]||q.grade>m[q.branch].grade)m[q.branch]=q});return Object.values(m)}
function pending(x){for(let i=1;i<=x.level;i++)if(!x.lockedChoices?.[i])return i;return 0}
function darkArr(){return MD2.darkness[s.dark.side]}function darkNow(){return darkArr()[s.dark.i]}
function phaseHelp(){return[`Cada héroe dispone de ${s.mode==='solo'?4:3} acciones.`,'Activa las cuadrillas y después los monstruos errantes.','La app revisa automáticamente quién debe subir de nivel.','Avanza el medidor y resuelve su efecto.'][s.phase]}
function tab(id){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));renderHeroTabs();scrollTo(0,0)}
function loadVoiceOptions(){if(!$('voiceSelect'))return;const voices=speechSynthesis.getVoices().filter(v=>v.lang?.toLowerCase().startsWith('es'));$('voiceSelect').innerHTML='<option value="">Automática</option>'+voices.map(v=>`<option value="${v.name}" ${s.voiceName===v.name?'selected':''}>${v.name} (${v.lang})</option>`).join('')}
function renderAudioStatus(){
 if(!$('audioStatus'))return;let text,cls;
 if(s.music==='no'&&s.voice==='no'&&s.sfx==='no'){text='Estado del audio: desactivado.';cls='off'}
 else if(s.audioUnlocked){text='Estado del audio: activo.';cls='ok'}
 else{text='Estado del audio: bloqueado hasta pulsar Activar sonido.';cls='warn'}
 $('audioStatus').textContent=text;$('audioStatus').className=`notice ${cls}`;
 const tracks=Object.values(musicEls()).filter((v,i,a)=>v&&a.indexOf(v)===i);
 $('diagUnlocked').textContent=s.audioUnlocked?'Sí':'No';
 $('diagLoaded').textContent=tracks.every(a=>a.readyState>=2)?'Sí':'Cargando';
 $('diagPlaying').textContent=activeMusic&&!activeMusic.paused?'Activa':'Detenida';
 $('diagTrack').textContent=currentAmbient?musicLabel(currentAmbient):'Ninguna'
}
function renderSettings(){if(!$('musicSetting'))return;$('musicSetting').value=s.music;$('musicVolumeSetting').value=s.musicVolume;$('sfxSetting').value=s.sfx;$('voiceSetting').value=s.voice;$('voiceRateSetting').value=s.rate;$('voicePitchSetting').value=s.voicePitch;loadVoiceOptions();renderAudioStatus()}
function render(){renderHeroTabs();renderSetup();renderGame();renderHero();renderHistory();renderResurrection();renderSettings();updateAmbient();$('phaseChip').textContent=s.confirmed?MD2.phases[s.phase]:'Preparación'}
function renderHeroTabs(){const b=$('heroTabs');if(!s.confirmed){b.innerHTML='';return}b.innerHTML=`<button data-main="game">Partida</button>`+s.heroes.map((x,i)=>`<button data-hi="${i}" class="${i===s.active&&$('hero').classList.contains('active')?'activeHero':''}" style="--hero:${COLORS[x.cls]}">${x.name}</button>`).join('')+`<button data-main="rules">Reglas</button>`;b.querySelectorAll('[data-hi]').forEach(q=>q.onclick=()=>{s.active=+q.dataset.hi;save();render();tab('hero');duckAndSay(`Héroe activo: ${heroSpoken(h())}.`)});b.querySelectorAll('[data-main]').forEach(q=>q.onclick=()=>tab(q.dataset.main))}
function renderSetup(){const picker=$('classPicker');picker.innerHTML=Object.keys(C).map(k=>`<button class="classChoice" data-class="${k}" style="border-color:${COLORS[k]}">${C[k].label}</button>`).join('');picker.querySelectorAll('[data-class]').forEach(b=>b.onclick=()=>{picker.querySelectorAll('.classChoice').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');picker.dataset.selected=b.dataset.class});$('setupHeroes').innerHTML=s.heroes.map((x,i)=>`<div class="heroSetupRow" style="border-left:5px solid ${COLORS[x.cls]}"><div class="grid"><label>Clase<input value="${C[x.cls].label}" disabled></label><label>Nombre<input data-name="${i}" value="${x.name}"></label></div><button data-remove="${i}" class="danger top">Quitar</button></div>`).join('')||'<p class="muted">Aún no hay héroes.</p>';document.querySelectorAll('[data-name]').forEach(inp=>inp.onchange=()=>{s.heroes[+inp.dataset.name].name=inp.value||C[s.heroes[+inp.dataset.name].cls].label;save()});document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{s.heroes.splice(+b.dataset.remove,1);s.active=0;save();renderSetup()});$('setupStatus').textContent=s.confirmed?'Grupo confirmado.':'Todavía no has confirmado el grupo.';$('playerMode').value=s.mode;$('soloRuleNotice').style.display=s.mode==='solo'?'block':'none'}
function renderGame(){if(!$('round'))return;$('round').textContent=s.round;$('phase').textContent=MD2.phases[s.phase];$('dungeon').textContent=dungeon();$('darkPos').textContent=s.heroes.length?darkNow()[0]:'—';$('phaseHelp').textContent=s.phase===3&&s.darknessPending?'Resuelve el efecto anunciado y luego pulsa Siguiente fase para confirmarlo.':phaseHelp();$('darkTrack').innerHTML=darkArr().map((x,i)=>`<div class="cell ${i===s.dark.i?'active':''}">${x[0]}</div>`).join('');$('darkEvent').textContent=`${s.dark.side==='front'?'Anverso':'Reverso'} · ${darkNow()[0]}: ${darkNow()[1]}`;
$('resolveDarkness').classList.toggle('hidden',!(s.phase===3&&s.darknessPending));
$('nextPhase').classList.toggle('hidden',s.phase===3&&s.darknessPending);
}
function renderHero(){if(!s.heroes.length){$('heroPage').innerHTML='<div class="card">Primero prepara el grupo.</div>';return}const x=h();document.documentElement.style.setProperty('--hero',COLORS[x.cls]);$('heroPage').innerHTML=`<div class="activeHeroBanner">Héroe activo: ${heroSpoken(x)}</div>${x.unconscious?'<div class="unconsciousBanner">INCONSCIENTE · Tumba la miniatura. No realiza acciones ni puede ser objetivo.</div>':''}<div class="card heroHeader"><div class="row between"><div><h2>${x.name}</h2><small>${C[x.cls].label}</small></div><span class="badge">Nivel ${x.level}</span></div><div class="stats top"><div><small>Vida</small><b>${x.hp}/${x.hpMax}</b></div><div><small>Maná</small><b>${x.mana}/${x.manaMax}</b></div><div><small>XP</small><b>${x.xp}</b></div><div><small>Acciones</small><b>${x.actions}</b></div><div><small>Zona</small><b>${x.zone==='dark'?'Oscuridad':'Luz'}</b></div><div><small>Habilidad pendiente</small><b>${pending(x)?'Sí':'No'}</b></div></div></div><div class="sectionTabs"><button data-sec="summary" class="${!x.flow.type?'active':''}">Resumen</button><button data-sec="skills">Habilidades</button><button data-sec="actions" class="${x.flow.type?'active':''}">Turno</button><button data-sec="inventory">Inventario</button></div><div id="sec-summary" class="heroSection ${!x.flow.type?'active':''}">${summaryHtml(x)}</div><div id="sec-skills" class="heroSection">${skillsHtml(x)}</div><div id="sec-actions" class="heroSection ${x.flow.type?'active':''}">${actionsHtml(x)}</div><div id="sec-inventory" class="heroSection">${inventoryHtml(x)}</div>`;document.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-sec]').forEach(q=>q.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.heroSection').forEach(q=>q.classList.remove('active'));$('sec-'+b.dataset.sec).classList.add('active')});bindHero()}
function summaryHtml(x){return`<div class="card"><h2>Estadísticas</h2><div class="row"><button id="hpDown">− Vida</button><button id="hpUp">+ Vida</button><button id="manaDown">− Maná</button><button id="manaUp">+ Maná</button><button id="toggleZone">Luz/Oscuridad</button></div><h3>Habilidad propia</h3><div class="passive">${C[x.cls].ability}</div><h3>Sombras</h3><div class="passive">${C[x.cls].shadow}</div></div><div class="card"><h2>Mecánica exclusiva</h2>${classHtml(x)}</div>`}
function classHtml(x){if(x.cls==='rogue')return`<div class="resource">Fichas en mano: <b>${x.rogue.hand}</b> · Gastadas: ${x.rogue.spent}<div class="row"><button id="rDraw">Robar ficha</button><button id="rSpend">Gastar ficha</button></div></div>`;if(x.cls==='ranger')return`<div class="resource">El mazo de Flechas se resuelve físicamente: Rápido, Certero o Fallido.</div>`;if(x.cls==='shaman')return`<div class="resource">${['fire','water','air','nature'].map(k=>`<div class="row"><span class="badge">${{fire:'🔥 Fuego',water:'💧 Agua',air:'💨 Aire',nature:'🌿 Naturaleza'}[k]} ${x.shaman[k]}/4</span><button data-el="${k}" data-d="-1">−</button><button data-el="${k}" data-d="1">+</button><button data-max="${k}">Máx.</button><button data-use="${k}" ${x.shaman.unlocked[k]?'disabled':''}>${x.shaman.unlocked[k]?'Activa':'Consumir'}</button></div>`).join('')}</div>`;if(x.cls==='paladin')return`<div class="resource">Consagraciones registradas: <b>${x.paladin.consecrations}</b><div class="row"><button id="conAdd">Consagrar (−1 maná)</button><button id="conRem">Retirar</button></div><small>Comprueba LdV y que la zona no tenga otra Consagración.</small></div><label class="top">Habilidad bendecida<select id="blessed"><option value="">Ninguna</option>${activeSkills(x).map(q=>`<option ${x.paladin.blessed===q.name?'selected':''}>${q.name}</option>`).join('')}</select></label>`;if(x.cls==='mage')return`<div class="talismanGrid">${x.mage.slots.map((q,i)=>`<div class="talismanSlot ${i===x.mage.amulet?'active':''}"><b>Cara ${i+1}</b><input data-slot="${i}" value="${q}"><small>${i===x.mage.amulet?'Activa':'Inactiva'}</small></div>`).join('')}</div><button id="rotateTalisman" class="top">Girar Talismán</button>`;return`<div class="resource">Furia: <b>${x.berserker.fury}/7</b><div class="row"><button id="fDown">−</button><button id="fUp">+</button></div></div><label class="top">Postura<select id="stance"><option>Furia Sangrienta</option><option>Temerario</option><option>Provocador</option></select></label>`}
function skillsHtml(x){let html='<div class="card"><h2>Elecciones</h2>';for(let n=1;n<=x.level;n++){let v=x.choices[n],locked=x.lockedChoices[n];if(locked)html+=`<div class="skill skillLocked"><b>Nivel ${n}</b><br>${v}<div class="inventoryActions"><button data-undo="${n}">Deshacer elección</button></div></div>`;else html+=`<div class="choiceBox"><label>Nivel ${n}<select data-choice="${n}"><option value="">Seleccionar</option>${skills(x).filter(q=>q.level<=n).map(q=>`<option value="${q.name}" ${v===q.name?'selected':''}>${q.name}</option>`).join('')}</select></label><button data-confirm="${n}" class="primary">Confirmar</button></div>`}html+='</div><div class="card"><h2>Habilidades activas</h2>'+activeSkills(x).map(q=>`<div class="skill">${q.name}</div>`).join('')+'</div>';return html}
function actionsHtml(x){return`<div class="card"><h2>Turno de ${x.name}</h2><p class="notice">Acciones restantes: <b>${x.actions}</b></p><div class="actions"><button id="moveAction">Movimiento</button><button id="attackAction">Ataque</button><button id="defenseAction">Defensa</button><button data-action="Recuperación">Recuperación</button><button data-action="Intercambiar y equipar">Intercambiar y equipar</button><button data-action="Usar objeto">Usar objeto</button><button id="finishTurn" class="primary">Finalizar turno</button></div></div>${flowHtml(x)}`}
function flowHtml(x){if(!x.flow.type)return'<div class="card"><p class="notice">Selecciona una acción para iniciar su resolución guiada.</p></div>';if(x.flow.type==='move')return moveFlow(x);if(x.flow.type==='attack')return attackFlow(x);if(x.flow.type==='defense')return defenseFlow(x);return`<div class="card"><p class="notice">${x.flow.type} registrada.</p><button id="finishFlow">Finalizar acción</button></div>`}
function moveFlow(x){return`<div class="card actionFlow active"><h2>Movimiento</h2><div class="flowSteps"><span class="flowStep active">Gastar PM</span><span class="flowStep">Finalizar</span></div><p class="notice">PM disponibles: <b>${x.move.pm}</b></p><div class="actions"><button data-move="move">Mover 1 zona</button><button data-move="door">Abrir puerta</button><button data-move="interact">Interactuar</button><button id="finishMove" class="primary">Finalizar movimiento</button></div></div>`}
function attackFlow(x){const a=x.flow.attack||{},step=x.flow.step||1;return`<div class="card actionFlow active"><h2>Ataque guiado</h2><div class="flowSteps">${[1,2,3,4,5].map((n,i)=>`<span class="flowStep ${n===step?'active':''}">${['Reserva','Lanzar','Habilidades','Calcular','Resumen'][i]}</span>`).join('')}</div>${step===1?`<div class="grid"><label>Tipo<select id="attackType"><option>Cuerpo a cuerpo</option><option>A distancia</option><option>Mágico</option></select></label><label>Dados del héroe<input id="heroDice" value="${a.heroDice||''}"></label><label>Dados negros<input id="blackDice" type="number" value="${a.blackDice||0}"></label><label>Secuaces restantes<input id="minions" type="number" value="${a.minions??1}"></label></div><button id="attackNext1" class="primary top">Confirmar reserva</button>`:''}${step===2?`<p class="notice">Lanza físicamente todos los dados de la reserva.</p><button id="attackNext2" class="primary">Dados lanzados</button>`:''}${step===3?`<div class="resultBox">${attackReminders(x)}</div><button id="attackNext3" class="primary top">Habilidades y efectos resueltos</button>`:''}${step===4?`<div class="grid"><label>Espadas obtenidas<input id="attackSwords" type="number" value="${a.swords||0}"></label><label>Escudos enemigos<input id="attackShields" type="number" value="${a.shields||0}"></label><label>Secuaces eliminados<input id="killedMinions" type="number" value="${a.killedMinions||0}"></label><label>Daño al líder<input id="leaderDamage" type="number" value="${a.leaderDamage||0}"></label></div><button id="attackCalc" class="primary top">Calcular resultado</button>`:''}${step===5?`<div class="resultBox"><b>Ataque resuelto</b><br>Heridas totales: ${a.damage||0}<br>Secuaces eliminados: ${a.killedMinions||0}<br>Daño al líder: ${a.leaderDamage||0}</div><button id="finishAttack" class="primary top">Finalizar ataque</button>`:''}</div>`}
function attackReminders(x){let arr=[];if(x.zone==='dark')arr.push('Añade el dado de Oscuridad y aplica Sombras.');activeSkills(x).forEach(q=>arr.push(`Habilidad activa: ${q.name}.`));arr.push(`Habilidad propia: ${C[x.cls].ability}`);if(greyRerollReminder())arr.push(greyRerollReminder());return'<ol>'+arr.map(q=>`<li>${q}</li>`).join('')+'</ol>'}
function defenseFlow(x){const d=x.flow.defense||{},step=x.flow.step||1;return`<div class="card actionFlow active"><h2>Defensa guiada</h2><div class="flowSteps">${[1,2,3,4,5].map((n,i)=>`<span class="flowStep ${n===step?'active':''}">${['Reserva','Lanzar','Habilidades','Calcular','Resumen'][i]}</span>`).join('')}</div>${step===1?`<div class="grid"><label>Dados azules<input id="blueDice" value="${d.blueDice||''}"></label><label>Espadas enemigas<input id="enemySwords" type="number" value="${d.enemySwords||0}"></label></div><button id="defNext1" class="primary top">Confirmar reserva</button>`:''}${step===2?`<p class="notice">Lanza físicamente los dados azules.</p><button id="defNext2" class="primary">Dados lanzados</button>`:''}${step===3?`<div class="resultBox">${defenseReminders(x)}</div><button id="defNext3" class="primary top">Efectos resueltos</button>`:''}${step===4?`<label>Escudos obtenidos<input id="defShields" type="number" value="${d.shields||0}"></label><button id="defCalc" class="primary top">Calcular heridas</button>`:''}${step===5?`<div class="resultBox"><b>Defensa resuelta</b><br>Heridas recibidas: ${d.wounds||0}</div><button id="finishDefense" class="primary top">Finalizar defensa</button>`:''}</div>`}
function defenseReminders(x){let arr=[];activeSkills(x).forEach(q=>arr.push(`Habilidad activa: ${q.name}.`));arr.push(`Habilidad propia: ${C[x.cls].ability}`);if(x.cls==='paladin')arr.push('Ignora 1 Garra en cada ataque.');if(x.cls==='berserker')arr.push(`Postura: ${x.berserker.stance}. Furia: ${x.berserker.fury}.`);return'<ol>'+arr.map(q=>`<li>${q}</li>`).join('')+'</ol>'}
function inventoryHtml(x){return`<div class="card"><h2>Registrar objeto</h2><div class="grid"><label>Nombre<input id="itemName"></label><label>Destino<select id="itemDest"><option value="equip">Equipar ahora</option><option value="inventory">Guardar</option></select></label></div><button id="addItem" class="top">Registrar</button></div><div class="card"><h2>Equipo e inventario</h2><div id="inventoryList">${inventoryRows(x)}</div></div>`}
function inventoryRows(x){let r=[];x.equipped.forEach((q,i)=>r.push(`<div class="inventoryItem"><b>Equipado:</b> ${q}<div class="inventoryActions"><button data-store="${i}">Guardar</button><button data-delete-e="${i}">Eliminar</button></div></div>`));x.inventory.forEach((q,i)=>r.push(`<div class="inventoryItem"><b>Inventario:</b> ${q}<div class="inventoryActions"><button data-equip="${i}">Equipar</button><button data-delete-i="${i}">Consumir/Eliminar</button></div></div>`));return r.join('')||'<p class="muted">Sin objetos.</p>'}
function bindHero(){const x=h();$('hpDown').onclick=()=>{x.hp=Math.max(0,x.hp-1);if(x.hp===0&&!x.unconscious)knockOut(x);save();renderHero()};$('hpUp').onclick=()=>{if(x.unconscious)return alert('Un héroe inconsciente solo revive mediante una ficha de Resurrección.');x.hp=Math.min(x.hpMax,x.hp+1);save();renderHero()};$('manaDown').onclick=()=>{x.mana=Math.max(0,x.mana-1);save();renderHero()};$('manaUp').onclick=()=>{x.mana=Math.min(x.manaMax,x.mana+1);save();renderHero()};$('toggleZone').onclick=()=>{x.zone=x.zone==='dark'?'light':'dark';save();renderHero();if(x.zone==='dark')say('Estás en oscuridad. No olvides el dado de Oscuridad y la habilidad de Sombras.')};document.querySelectorAll('[data-choice]').forEach(q=>q.onchange=()=>{x.choices[+q.dataset.choice]=q.value||null;save()});document.querySelectorAll('[data-confirm]').forEach(b=>b.onclick=()=>{let n=+b.dataset.confirm,v=x.choices[n];if(!v)return alert('Selecciona una habilidad.');if(!confirm(`¿Confirmas ${v}? La elección será permanente y solo podrá cambiarse con Deshacer.`))return;x.lockedChoices[n]=true;log(`Habilidad bloqueada: ${v}.`);save();renderHero();if(s.phase===2)continueLevelQueueAfterSkill(v);else{enqueueSpeech(`${v} confirmada. Esta elección queda bloqueada.`,x,advancePending)}});document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>{let n=+b.dataset.undo;if(confirm('¿Deshacer esta elección?')){x.lockedChoices[n]=false;x.choices[n]=null;save();renderHero()}});bindClass(x);$('moveAction').onclick=()=>startAction('move');$('attackAction').onclick=()=>startAction('attack');$('defenseAction').onclick=()=>startAction('defense');document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>startAction(b.dataset.action));$('finishTurn').onclick=()=>{x.actions=0;x.flow={type:null,step:0,attack:{},defense:{}};save();renderHero();say('Turno finalizado.')};bindFlow(x);bindInventory(x)}
function bindClass(x){if(x.cls==='rogue'){$('rDraw').onclick=()=>{x.rogue.hand++;x.actions++;save();renderHero()};$('rSpend').onclick=()=>{if(!x.rogue.hand)return;x.rogue.hand--;x.rogue.spent++;save();renderHero()}}if(x.cls==='shaman'){document.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>{let k=b.dataset.el;x.shaman[k]=Math.max(0,Math.min(4,x.shaman[k]+ +b.dataset.d));save();renderHero()});document.querySelectorAll('[data-max]').forEach(b=>b.onclick=()=>{x.shaman[b.dataset.max]=4;save();renderHero()});document.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{let k=b.dataset.use;if(x.shaman[k]<4)return alert('No está al máximo');x.shaman[k]=0;x.shaman.unlocked[k]=true;save();renderHero();say(`Bendición de ${k} activa permanentemente.`)})}if(x.cls==='paladin'){$('conAdd').onclick=()=>{if(x.mana<1)return alert('Necesitas 1 maná');x.mana--;x.paladin.consecrations++;save();renderHero();say('Gastas 1 maná para consagrar. Comprueba la línea de visión y que la zona no tenga otra Consagración.')};$('conRem').onclick=()=>{x.paladin.consecrations=Math.max(0,x.paladin.consecrations-1);save();renderHero()};$('blessed').onchange=e=>{x.paladin.blessed=e.target.value;save();if(e.target.value)say(`Has bendecido ${e.target.value} hasta el final de la ronda.`)}}if(x.cls==='mage'){document.querySelectorAll('[data-slot]').forEach(inp=>inp.onchange=()=>{x.mage.slots[+inp.dataset.slot]=inp.value||'Vacío';save()});$('rotateTalisman').onclick=()=>{x.mage.amulet=(x.mage.amulet+1)%4;let a=x.mage.slots[x.mage.amulet];save();renderHero();say(`Talismán girado. Activa: ${a}.`)}}if(x.cls==='berserker'){$('fDown').onclick=()=>{x.berserker.fury=Math.max(0,x.berserker.fury-1);save();renderHero()};$('fUp').onclick=()=>{x.berserker.fury=Math.min(7,x.berserker.fury+1);save();renderHero()};$('stance').value=x.berserker.stance;$('stance').onchange=e=>{x.berserker.stance=e.target.value;save()}}}
function bindFlow(x){document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>useMove(b.dataset.move));if($('finishMove'))$('finishMove').onclick=finishFlow;if($('finishFlow'))$('finishFlow').onclick=finishFlow;if($('attackNext1'))$('attackNext1').onclick=()=>{x.flow.attack={heroDice:$('heroDice').value,blackDice:+$('blackDice').value||0,minions:+$('minions').value||0};x.flow.step=2;save();renderHero();duckAndSay('Reserva de dados confirmada. Lanza los dados.')};if($('attackNext2'))$('attackNext2').onclick=()=>{x.flow.step=3;save();renderHero();duckAndSay('Dados lanzados. Aplica habilidades, efectos y dados adicionales.')};if($('attackNext3'))$('attackNext3').onclick=()=>{x.flow.step=4;save();renderHero();duckAndSay('Habilidades y efectos resueltos. Introduce las espadas y escudos finales.')};if($('attackCalc'))$('attackCalc').onclick=()=>{let a=x.flow.attack;a.swords=+$('attackSwords').value||0;a.shields=+$('attackShields').value||0;a.damage=Math.max(0,a.swords-a.shields);a.killedMinions=+$('killedMinions').value||0;a.leaderDamage=+$('leaderDamage').value||0;x.flow.step=5;log(`Ataque resuelto: ${a.damage} heridas.`);save();renderHero();duckAndSay(`Ataque resuelto. Infliges ${a.damage} heridas. Secuaces eliminados: ${a.killedMinions}. Daño al líder: ${a.leaderDamage}.`)};if($('finishAttack'))$('finishAttack').onclick=finishFlow;if($('defNext1'))$('defNext1').onclick=()=>{x.flow.defense={blueDice:$('blueDice').value,enemySwords:+$('enemySwords').value||0};x.flow.step=2;save();renderHero()};if($('defNext2'))$('defNext2').onclick=()=>{x.flow.step=3;save();renderHero()};if($('defNext3'))$('defNext3').onclick=()=>{x.flow.step=4;save();renderHero()};if($('defCalc'))$('defCalc').onclick=()=>{let d=x.flow.defense;d.shields=+$('defShields').value||0;d.wounds=Math.max(0,d.enemySwords-d.shields);x.hp=Math.max(0,x.hp-d.wounds);if(x.hp===0&&!x.unconscious)knockOut(x);if(x.cls==='berserker'&&d.wounds>0){let gain=Math.min(d.wounds,7-x.berserker.fury);if(gain>0&&confirm(`¿Convertir ${gain} heridas en Furia?`))x.berserker.fury+=gain}x.flow.step=5;log(`Defensa resuelta: ${d.wounds} heridas.`);save();renderHero();say(`Recibes ${d.wounds} heridas.`)};if($('finishDefense'))$('finishDefense').onclick=finishFlow}
function bindInventory(x){$('addItem').onclick=()=>{let n=$('itemName').value.trim();if(!n)return;($('itemDest').value==='equip'?x.equipped:x.inventory).push(n);save();renderHero()};document.querySelectorAll('[data-store]').forEach(b=>b.onclick=()=>{let q=x.equipped.splice(+b.dataset.store,1)[0];x.inventory.push(q);save();renderHero()});document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{let q=x.inventory.splice(+b.dataset.equip,1)[0];x.equipped.push(q);save();renderHero()});document.querySelectorAll('[data-delete-e]').forEach(b=>b.onclick=()=>{if(confirm('¿Eliminar objeto?')){x.equipped.splice(+b.dataset.deleteE,1);save();renderHero()}});document.querySelectorAll('[data-delete-i]').forEach(b=>b.onclick=()=>{if(confirm('¿Consumir o eliminar objeto?')){x.inventory.splice(+b.dataset.deleteI,1);save();renderHero()}})}
function advancePending(){let i=s.heroes.findIndex(q=>pending(q));if(i>=0){s.active=i;save();render();tab('hero');setTimeout(()=>document.querySelector('[data-sec="skills"]').click(),30);say(`Ahora debes elegir la habilidad de ${s.heroes[i].name}.`)}else{say('Todos los héroes tienen sus habilidades pendientes confirmadas.');tab('game')}}
function startAction(type){const x=h();if(x.unconscious)return alert('Este héroe está inconsciente y no puede realizar acciones.');if(pending(x))return alert('Debes confirmar la habilidad pendiente.');if(s.phase!==0)return alert('Solo durante la Fase de Héroes.');if(['move','attack','Recuperación','Intercambiar y equipar','Usar objeto'].includes(type)){if(x.actions<=0)return alert('No quedan acciones.');if(x.cls==='rogue'){if(!x.rogue.hand)return alert('No quedan fichas.');if(!confirm(`¿Gastar una ficha para ${type}?`))return;x.rogue.hand--;x.rogue.spent++}x.actions--}x.flow={type,step:1,attack:{},defense:{}};if(type==='move')x.move={on:true,pm:(x.cls==='ranger'?3:2)+(x.cls==='shaman'&&x.shaman.unlocked.air?1:0)};save();renderHero();setTimeout(()=>document.querySelector('.actionFlow')?.scrollIntoView({behavior:'smooth'}),30);duckAndSay(`Héroe activo ${heroSpoken(x)}. ${type==='move'?'Movimiento':type==='attack'?'Ataque':type==='defense'?'Defensa':type}. ${x.actions} acciones restantes.`)}
function useMove(k){const x=h();if(!x.move.on||!x.move.pm)return;x.move.pm--;log(k==='move'?'Se movió una zona.':k==='door'?'Abrió una puerta.':'Interactuó.');if(!x.move.pm)x.move.on=false;save();renderHero();say(`Quedan ${x.move.pm} puntos de movimiento.`)}
function finishFlow(){const x=h();x.flow={type:null,step:0,attack:{},defense:{}};x.move={on:false,pm:0};save();renderHero();say(`Acción finalizada. Te quedan ${x.actions} acciones.`)}

function resurrectionCount(){return s.heroes.length<=2?1:s.heroes.length<=4?2:3}
function syncResurrectionTokens(){const total=resurrectionCount();const used=s.resurrection.grey;const scheduled=s.heroes.filter(x=>x.reviveNextRound).length;s.resurrection.blue=Math.max(0,total-used-scheduled)}
function knockOut(x){x.unconscious=true;x.manaAtKO=x.mana;x.actions=0;x.flow={type:null,step:0,attack:{},defense:{}};log(`${x.name} quedó inconsciente.`);duckAndSay(`${heroSpoken(x)} ha quedado inconsciente. Tumba su miniatura. No puede actuar ni ser objetivo.`)}
function renderResurrection(){if(!$('resurrectionPanel'))return;syncResurrectionTokens();const total=resurrectionCount(),uncon=s.heroes.filter(x=>x.unconscious&&!x.reviveNextRound);$('resurrectionPanel').innerHTML=`<p>Fichas totales según el grupo: <b>${total}</b></p><div>${Array.from({length:s.resurrection.blue},()=>'<span class="resToken resBlue">Azul disponible</span>').join('')}${Array.from({length:s.resurrection.grey},()=>'<span class="resToken resGrey">Gris · relanzar 1 dado negro</span>').join('')}</div>${uncon.map(x=>`<div class="resource"><b>${heroSpoken(x)}</b> está inconsciente.<button data-res="${x.id}" ${s.resurrection.blue<=0?'disabled':''}>Usar ficha para próxima ronda</button></div>`).join('')||'<p class="muted">No hay héroes inconscientes pendientes.</p>'}`;document.querySelectorAll('[data-res]').forEach(b=>b.onclick=()=>scheduleResurrection(b.dataset.res))}
function scheduleResurrection(id){syncResurrectionTokens();if(s.resurrection.blue<=0)return alert('No quedan fichas azules disponibles.');const x=s.heroes.find(q=>String(q.id)===String(id));if(!x)return;x.reviveNextRound=true;syncResurrectionTokens();log(`${x.name} será resucitado al comienzo de la siguiente ronda.`);duckAndSay(`Ficha de Resurrección asignada a ${heroSpoken(x)}. Revivirá al comienzo de la siguiente ronda con 3 de vida.`);save();render()}
function reviveScheduled(){s.heroes.forEach(x=>{if(x.reviveNextRound){x.reviveNextRound=false;x.unconscious=false;x.hp=Math.min(3,x.hpMax);if(x.manaAtKO!==null)x.mana=Math.min(x.manaMax,x.manaAtKO);x.manaAtKO=null;s.resurrection.grey++;log(`${x.name} resucitó con 3 de vida.`);duckAndSay(`${heroSpoken(x)} resucita con 3 de vida y conserva su maná. Levanta su miniatura.`)}});syncResurrectionTokens()}
function greyRerollReminder(){return s.resurrection.grey>0?`Hay ${s.resurrection.grey} ficha${s.resurrection.grey>1?'s':''} de Resurrección en lado gris. Puedes relanzar un dado negro.`:''}

function renderHistory(){$('history').innerHTML=s.history.length?s.history.map(x=>`<div><b>Ronda ${x.r} · ${x.p} · ${x.n}</b><br>${x.t}</div>`).join(''):'<p class="muted">Sin registros.</p>'}

function startNewRoundAfterDarkness(){
  if(!(s.phase===3&&s.darknessPending))return;
  s.darknessPending=false;s.phaseHistory.push({p:s.phase,r:s.round,d:{...s.dark}});
  s.phase=0;s.round++;reviveScheduled();
  s.heroes.forEach(x=>{
    x.actions=x.unconscious?0:(s.mode==='solo'?4:3);
    x.flow={type:null,step:0,attack:{},defense:{}};
    if(x.cls==='paladin'&&x.paladin.blessed){
      const old=x.paladin.blessed;x.paladin.blessed='';
      enqueueSpeech(`${heroSpoken(x)}: retira la habilidad bendecida ${old}; vuelve a su lado normal.`,x)
    }
  });
  log('Comienza la Fase de Héroes.');save();render();
  enqueueSpeech(`Comienza la ronda ${s.round}. Fase de Héroes. ${s.mode==='solo'?'Tu héroe dispone de 4 acciones.':''}`)
}
function nextPhase(){
  if(!s.confirmed)return alert('Primero prepara el grupo.');
  if(s.phase===2&&!s.levelPhaseResolved)return alert('La revisión automática de subida de nivel todavía no ha terminado.');
  if(s.phase===3&&s.darknessPending)return;
  s.phaseHistory.push({p:s.phase,r:s.round,d:{...s.dark}});
  if(s.phase===0){s.phase=1;log('Comienza la Fase de Enemigos.');save();render();enqueueSpeech('Comienza la fase de enemigos. Activa las cuadrillas y después los monstruos errantes.');return}
  if(s.phase===1){s.phase=2;beginLevelPhase();save();render();return}
  if(s.phase===2){s.phase=3;advanceDark(true);save();render();return}
}
function beginLevelPhase(){
  s.levelQueue=s.heroes.map((x,i)=>({i,status:'pending'}));
  s.levelCursor=0;s.levelPhaseResolved=false;save();render();
  enqueueSpeech('Comienza la fase de subida de nivel. La aplicación revisará a todos los héroes uno por uno.',h(),processNextLevelHero)
}
function processNextLevelHero(){
  if(s.levelCursor>=s.levelQueue.length){
    s.levelPhaseResolved=true;save();render();
    enqueueSpeech('Todos los héroes han sido revisados. La fase de subida de nivel ha terminado.');
    return
  }
  const entry=s.levelQueue[s.levelCursor],x=s.heroes[entry.i];
  s.active=entry.i;const cost=x.level<5?MD2.levelCosts[x.level]:null;
  if(!cost||x.xp<cost){
    entry.status='no-level';log(`${x.name} fue revisado y no sube de nivel.`);
    save();render();
    enqueueSpeech(`${heroSpoken(x)} no tiene experiencia suficiente para subir de nivel.`,x,()=>{s.levelCursor++;save();processNextLevelHero()});
    return
  }
  x.xp-=cost;x.level++;const g=MD2.levelGains[x.level];
  x.hpMax+=g.hp;x.manaMax+=g.mana;
  if(!x.unconscious){x.hp=Math.min(x.hpMax,x.hp+g.hp);x.mana=Math.min(x.manaMax,x.mana+g.mana)}
  x.choices[x.level]=null;x.lockedChoices[x.level]=false;entry.status='waiting-skill';
  log(`${x.name} sube a nivel ${x.level}.`);save();render();tab('hero');
  setTimeout(()=>document.querySelector('[data-sec="skills"]')?.click(),50);
  const recovery=x.unconscious?'Permanece inconsciente y no recupera vida ni maná por esta subida.':`Recupera ${g.hp} vida y ${g.mana} maná.`;
  enqueueSpeech(`${heroSpoken(x)} sube obligatoriamente a nivel ${x.level}. Su vida máxima aumenta en ${g.hp} y su maná máximo aumenta en ${g.mana}. ${recovery} ${g.treasure} Elige ahora una nueva habilidad.`,x)
}
function continueLevelQueueAfterSkill(skillName=''){
  if(s.phase!==2)return;
  const entry=s.levelQueue[s.levelCursor],x=h();if(!entry)return;
  entry.status='done';save();render();
  enqueueSpeech(`${heroSpoken(x)} ha escogido ${skillName||x.choices[x.level]}. La habilidad queda bloqueada.`,x,()=>{s.levelCursor++;save();processNextLevelHero()})
}
function darknessSfx(effect){if(s.sfx!=='yes'||!s.audioUnlocked)return;let f=effect.includes('errante')?82:effect.includes('cuadrilla')?110:effect.includes('Épico')?523:effect.includes('Raro')?392:220;playTone(f,.8,.045,effect.includes('errante')?'sawtooth':'triangle')}
function advanceDark(voice=true){let transition='';if(s.dark.side==='front'){if(s.dark.i<8)s.dark.i++;else{s.dark.side='back';s.dark.i=0;transition='El medidor ha llegado al final del anverso. Da vuelta el medidor y colócalo en R1. '}}else{if(s.dark.i<3)s.dark.i++;else{s.dark.i=0;transition='El medidor vuelve a R1 en el mismo reverso. '}}const effect=darkNow()[1];let t=`Fase de Oscuridad. ${transition}El medidor avanza a ${darkNow()[0]}. ${effect}`;s.darknessPending=true;log(t);darknessSfx(effect);if(voice)duckAndSay(t);save();renderGame()}
function award(kind){if(!s.heroes.length)return;const before=s.heroes.map(x=>x.xp),x=h();if(kind==='m'){if(!confirm(`El héroe activo es ${x.name}. ¿Confirmas que eliminó al secuaz y recibe 1 XP?`))return;x.xp++;say(`${x.name} gana 1 punto de experiencia.`);log(`${x.name} gana 1 XP por eliminar un secuaz.`)}if(kind==='l'){s.heroes.forEach(q=>q.xp+=2);say('Líder eliminado. Todos los héroes ganan 2 puntos de experiencia.');log('Todo el grupo gana 2 XP por eliminar un líder.')}if(kind==='r'){s.heroes.forEach(q=>q.xp+=4);say('Monstruo errante eliminado. Todos los héroes ganan 4 puntos de experiencia.');log('Todo el grupo gana 4 XP por eliminar un errante.')}s.xpHistory.push(before);save();render()}
function answerRule(q){q=q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(q.includes('linea')&&q.includes('vision')||q.includes('ldv'))return MD2.rules['linea de vision'];if(q.includes('puerta'))return MD2.rules.puertas;if(q.includes('defensa'))return MD2.rules.defensa;if(q.includes('movimiento'))return MD2.rules.movimiento;if(q.includes('inventario')||q.includes('equipar'))return MD2.rules.inventario;if(q.includes('oscuridad'))return MD2.rules.oscuridad;if(q.includes('experiencia'))return MD2.rules.experiencia;if(q.includes('ataque'))return MD2.rules.ataque;return'No encontré una coincidencia exacta. Incluye el nombre de la carta o usa un tema rápido.'}
$('addSelectedClass').onclick=()=>{let k=$('classPicker').dataset.selected;if(!k)return alert('Selecciona una clase.');if(s.mode==='solo'&&s.heroes.length>=1)return alert('En modo solitario solo puedes elegir 1 héroe.');if(s.heroes.some(x=>x.cls===k))return alert('Esa clase ya está en el grupo.');s.heroes.push(makeHero(k));save();renderSetup()};
$('confirmGroup').onclick=()=>{if(!s.heroes.length)return alert('Añade al menos un héroe.');if(s.mode==='solo'&&s.heroes.length!==1)return alert('El modo solitario requiere exactamente 1 héroe.');if(s.mode==='coop'&&s.heroes.length<2)return alert('El modo cooperativo requiere al menos 2 héroes.');s.confirmed=true;s.heroes.forEach(x=>x.actions=s.mode==='solo'?4:3);s.active=0;s.resurrection={blue:s.heroes.length<=2?1:s.heroes.length<=4?2:3,grey:0};save();render();enqueueSpeech(s.mode==='solo'?'Modo Solitario activado. Tu héroe dispone de 4 acciones por turno. La vida de monstruos errantes y la cantidad de secuaces se resuelven como una partida de 2 héroes. Ahora debes elegir la habilidad inicial.':'Grupo confirmado. Ahora debes elegir la habilidad inicial de cada héroe.',h(),advancePending)};
$('playerMode').onchange=e=>{if(s.confirmed){alert('El modo no puede cambiarse después de confirmar el grupo. Usa Reiniciar partida para cambiarlo.');e.target.value=s.mode;return;}s.mode=e.target.value;if(s.mode==='solo'&&s.heroes.length>1)s.heroes=s.heroes.slice(0,1);s.heroes.forEach(x=>x.actions=s.mode==='solo'?4:3);save();renderSetup()};
$('nextPhase').onclick=nextPhase;$('resolveDarkness').onclick=startNewRoundAfterDarkness;$('undoPhase').onclick=()=>{let q=s.phaseHistory.pop();if(!q)return;s.phase=q.p;s.round=q.r;s.dark=q.d;save();render()};$('advanceDark').onclick=()=>{if(s.phase!==3)return alert('El medidor solo debe avanzar durante la fase de Oscuridad.');advanceDark();};$('rewindDark').onclick=()=>{if(s.dark.side==='back'&&s.dark.i===0){s.dark.side='front';s.dark.i=8}else s.dark.i=Math.max(0,s.dark.i-1);save();renderGame()};
$('minionXp').onclick=()=>award('m');$('leaderXp').onclick=()=>award('l');$('roamerXp').onclick=()=>award('r');$('undoXp').onclick=()=>{let a=s.xpHistory.pop();if(a)s.heroes.forEach((x,i)=>x.xp=a[i]);save();render()};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('ask').onclick=()=>{window.lastAnswer=answerRule($('question').value);$('answer').textContent=window.lastAnswer};$('read').onclick=()=>say(window.lastAnswer||$('answer').textContent);$('dictate').onclick=()=>{let R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return alert('Dictado no disponible.');let r=new R();r.lang='es-ES';r.onresult=e=>{$('question').value=e.results[0][0].transcript;$('ask').click()};r.start()};document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{$('question').value=b.dataset.topic;$('ask').click()});
$('clearHistory').onclick=()=>{s.history=[];save();renderHistory()};
if('speechSynthesis'in window)speechSynthesis.onvoiceschanged=loadVoiceOptions;
$('enableAudio').onclick=async()=>{const ok=await ensureAudio();if(ok){s.music='yes';save();await ambient('heroes');playTone(261.6,.22,.04,'triangle');renderAudioStatus();enqueueSpeech('Audio activado correctamente.')}else alert('No fue posible desbloquear el audio. Asegúrate de no tener el teléfono en modo silencio y vuelve a pulsar el botón.')};
$('testMusic').onclick=async()=>{const ok=await ensureAudio();if(!ok)return alert('El navegador no permitió desbloquear la música. Pulsa nuevamente Activar sonido.');s.music='yes';$('musicSetting').value='yes';save();await ambient('heroes');renderAudioStatus()};
$('testVoiceSettings').onclick=()=>say(`Prueba de voz para ${s.heroes.length?heroSpoken(h()):'el asistente'}.`);
$('repeatLastAnnouncement').onclick=()=>{if(!s.lastAnnouncement)return alert('No hay anuncio anterior.');say(s.lastAnnouncement)};
$('musicSetting').onchange=e=>{s.music=e.target.value;save();updateAmbient();renderAudioStatus()};
$('musicVolumeSetting').oninput=e=>{s.musicVolume=e.target.value;if(activeMusic)activeMusic.volume=+s.musicVolume;save();renderAudioStatus()};
$('sfxSetting').onchange=e=>{s.sfx=e.target.value;save();renderAudioStatus()};
$('voiceSetting').onchange=e=>{s.voice=e.target.value;save();renderAudioStatus()};
$('voiceRateSetting').onchange=e=>{s.rate=e.target.value;save()};$('voicePitchSetting').onchange=e=>{s.voicePitch=e.target.value;save()};$('voiceSelect').onchange=e=>{s.voiceName=e.target.value;save()};
$('exportSettings').onclick=()=>{let b=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='md2_alpha0831.json';a.click()};
$('importSettings').onchange=e=>{let f=e.target.files[0],r=new FileReader();r.onload=()=>{try{s=JSON.parse(r.result);save();render()}catch{alert('Archivo no válido')}};if(f)r.readAsText(f)};
$('newGameSettings').onclick=()=>{if(confirm('¿Nueva partida?')){s=fresh();save();stopAmbient();render();tab('setup')}};
render();
