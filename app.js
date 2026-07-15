const KEY='md2_alpha05';
const $=id=>document.getElementById(id);

function makeHero(name='Héroe',cls='rogue'){
  return {
    id:Date.now()+Math.random(),
    name,cls,level:1,xp:0,
    hp:cls==='rogue'?6:5,
    hpMax:cls==='rogue'?6:5,
    mana:0,manaMax:0,
    zone:'light',actions:3,
    choices:{1:null},
    rogue:{hand:3,spent:0,extra:0},
    move:{active:false,pm:0}
  };
}

function defaultState(){
  return {round:1,heroes:[makeHero('Pícaro','rogue')],active:0,history:[],voice:'yes',rate:1};
}

let state=JSON.parse(localStorage.getItem(KEY)||'null')||defaultState();
const hero=()=>state.heroes[state.active];

function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function speak(text){
  if(state.voice!=='yes'||!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='es-ES';
  u.rate=Number(state.rate)||1;
  speechSynthesis.speak(u);
}
function log(text){
  state.history.unshift({round:state.round,hero:hero().name,text});
  save();
  renderHistory();
}
function dungeonLevel(){return Math.max(...state.heroes.map(h=>h.level||1),1);}
function classInfo(h){return MD2_DATA.classes[h.cls];}
function selectedSkills(h){return Object.values(h.choices||{}).filter(Boolean);}
function activeSkills(h){
  const selected=selectedSkills(h)
    .map(name=>classInfo(h).skills.find(s=>s.name===name))
    .filter(Boolean);
  const branches={};
  selected.forEach(skill=>{
    if(!branches[skill.branch]||skill.grade>branches[skill.branch].grade){
      branches[skill.branch]=skill;
    }
  });
  return Object.values(branches);
}

function render(){
  const h=hero();
  $('heroSelect').innerHTML=state.heroes.map((x,i)=>`<option value="${i}" ${i===state.active?'selected':''}>${x.name} · Nivel ${x.level}</option>`).join('');
  $('nombre').value=h.name;
  $('clase').value=h.cls;
  $('ronda').textContent=state.round;
  $('nivel').textContent=h.level;
  $('xp').textContent=h.xp;
  $('acciones').textContent=h.actions;
  $('vida').textContent=h.hp;
  $('vidaMax').textContent=h.hpMax;
  $('mana').textContent=h.mana;
  $('manaMax').textContent=h.manaMax;
  $('zona').textContent=h.zone==='dark'?'Oscuridad':'Luz';
  $('dungeonLevel').textContent=dungeonLevel();
  $('vozOn').value=state.voice;
  $('velocidad').value=state.rate;

  renderClassPanel();
  renderRoster();
  renderPassives();
  renderChoices();
  renderTree();
  renderHistory();
  renderMove();

  $('rangerShot').classList.toggle('hidden', !(h.cls==='ranger' && $('attackType').value==='A distancia'));
}

function renderClassPanel(){
  const h=hero();
  if(h.cls==='rogue'){
    $('panelClase').innerHTML=`
      <h2>Pícaro · Fichas</h2>
      <div class="grid topgap">
        <div class="stat"><span class="muted">Fichas en mano</span><b>${h.rogue.hand}</b></div>
        <div class="stat"><span class="muted">Gastadas</span><b>${h.rogue.spent}</b></div>
        <div class="stat"><span class="muted">Acciones extra</span><b>${h.rogue.extra}</b></div>
      </div>
      <div class="actions topgap">
        <button id="drawToken">Robar ficha</button>
        <button id="spendToken">Gastar ficha</button>
        <button id="extraToken">Ficha: roba + acción</button>
        <button id="resetRogue">Nuevo turno</button>
      </div>`;
    $('drawToken').onclick=()=>{h.rogue.hand++;h.actions++;h.rogue.extra++;log('Robó una ficha y ganó una acción adicional.');render();};
    $('spendToken').onclick=()=>{if(h.rogue.hand<=0)return alert('No quedan fichas.');h.rogue.hand--;h.rogue.spent++;h.actions=Math.max(0,h.actions-1);log('Gastó una ficha.');render();};
    $('extraToken').onclick=()=>{if(h.rogue.hand<=0)return alert('No quedan fichas.');h.rogue.hand--;h.rogue.spent++;h.rogue.hand++;h.rogue.extra++;log('Resolvió roba una ficha + acción.');render();};
    $('resetRogue').onclick=()=>{h.rogue={hand:3,spent:0,extra:0};h.actions=3;log('Preparó 3 fichas.');render();};
  }else{
    $('panelClase').innerHTML=`<h2>Explorador</h2><div class="notice">El mazo de flechas se resuelve físicamente. En la app solo selecciona: rápido, certero o fallido.</div>`;
  }
}

function renderRoster(){
  $('heroRoster').innerHTML=state.heroes.map((h,i)=>`
    <div class="heroCard ${i===state.active?'active':''}">
      <b>${h.name}</b> · ${classInfo(h).label} · Nivel ${h.level}<br>
      <small>XP ${h.xp} · Vida ${h.hp}/${h.hpMax} · Maná ${h.mana}/${h.manaMax}</small>
    </div>`).join('');
}

function renderPassives(){
  $('passives').innerHTML=classInfo(hero()).passives.map(p=>`
    <div class="passive"><b>${p.name}</b><br><small>${p.text}</small></div>`).join('');
}

function renderChoices(){
  const h=hero();
  const skills=classInfo(h).skills;
  let html='';

  for(let slot=1;slot<=h.level;slot++){
    const eligible=skills.filter(s=>s.level<=slot);
    html+=`
      <label class="topgap">Elección del nivel ${slot}
        <select data-choice="${slot}">
          <option value="">Sin elegir</option>
          ${eligible.map(s=>`<option value="${s.name}" ${h.choices?.[slot]===s.name?'selected':''}>${s.name} (nivel ${s.level})</option>`).join('')}
        </select>
      </label>`;
  }

  const active=activeSkills(h);
  html+=`<div class="notice"><b>Habilidades activas:</b><br>${active.length?active.map(x=>`<span class="badge">${x.name}</span>`).join(' '):'Ninguna seleccionada.'}</div>`;
  $('choiceSlots').innerHTML=html;

  document.querySelectorAll('[data-choice]').forEach(select=>{
    select.onchange=()=>{
      const slot=Number(select.dataset.choice);
      const newName=select.value||null;

      if(newName){
        const newSkill=skills.find(x=>x.name===newName);
        const higher=activeSkills(h).find(x=>x.branch===newSkill.branch&&x.grade>newSkill.grade);
        if(higher){
          alert(`Ya tienes activa una versión superior: ${higher.name}.`);
          select.value=h.choices?.[slot]||'';
          return;
        }
      }

      h.choices=h.choices||{};
      h.choices[slot]=newName;
      save();
      renderChoices();
      renderTree();
    };
  });
}

function renderTree(){
  const h=hero();
  const skills=classInfo(h).skills;
  const activeNames=new Set(activeSkills(h).map(x=>x.name));
  let html='';

  for(let level=1;level<=5;level++){
    const locked=level>h.level;
    const list=skills.filter(x=>x.level===level);
    html+=`
      <button class="levelHeader" data-level="${level}" ${locked?'disabled':''}>Nivel ${level} ${locked?'🔒':''}</button>
      <div class="levelBody" id="treeLevel${level}">
        ${list.map(s=>`
          <div class="skill ${locked?'locked':''}">
            <span><b>${s.name}</b><br><small>${activeNames.has(s.name)?'Activa':'Referencia'}</small></span>
          </div>`).join('')}
      </div>`;
  }

  $('skillsTree').innerHTML=html;
  document.querySelectorAll('[data-level]').forEach(button=>{
    if(!button.disabled){
      button.onclick=()=>$('treeLevel'+button.dataset.level).classList.toggle('hidden');
    }
  });
}

function levelUp(){
  const h=hero();
  if(h.level>=5) return alert('Ya estás en nivel 5.');

  const cost=MD2_DATA.levelCosts[h.level];
  if(h.xp<cost) return alert(`Necesitas ${cost} XP. Te faltan ${cost-h.xp}.`);

  h.xp-=cost;
  h.level++;
  const gain=MD2_DATA.levelGains[h.level];
  h.hpMax+=gain.hp;
  h.hp+=gain.hp;
  h.manaMax+=gain.mana;
  h.mana+=gain.mana;
  h.choices=h.choices||{};
  h.choices[h.level]=null;

  const msg=`Subiste a nivel ${h.level}. Se descontaron ${cost} XP. Vida máxima +${gain.hp}. Maná máximo +${gain.mana}. ${gain.treasure} Elige una habilidad del nivel ${h.level} o inferior.`;
  $('levelInfo').textContent=msg;
  log(msg);
  render();
  speak(msg);
}

function prepareTurn(){
  const h=hero();
  const messages=[`Turno de ${h.name}, nivel ${h.level}.`];

  if(h.cls==='rogue'){
    h.rogue={hand:3,spent:0,extra:0};
    h.actions=3;
    messages.push('Roba tres fichas. Debes gastar una ficha por cada acción.');
  }else{
    h.actions=3;
    messages.push('Tienes tres acciones.');
  }

  if(h.zone==='dark') messages.push('Estás en oscuridad.');
  messages.push(`Vida ${h.hp} de ${h.hpMax}. Maná ${h.mana} de ${h.manaMax}.`);

  $('resumen').textContent=messages.join(' ');
  log('Turno preparado.');
  render();
  speak(messages.join(' '));
}

function spendAction(label){
  const h=hero();
  if(h.actions<=0) return alert('No quedan acciones.');

  if(h.cls==='rogue'){
    if(h.rogue.hand<=0) return alert('No tienes fichas.');
    if(!confirm(`Debes gastar una ficha para ${label}. ¿Confirmar?`)) return;
    h.rogue.hand--;
    h.rogue.spent++;
  }

  h.actions--;
  log(label+' realizado.');
  render();
  speak(`${label}. Te quedan ${h.actions} acciones.`);
}

function startMovement(){
  const h=hero();
  if(h.actions<=0) return alert('No quedan acciones.');

  if(h.cls==='rogue'){
    if(h.rogue.hand<=0) return alert('No tienes fichas.');
    if(!confirm('Debes gastar una ficha para iniciar Movimiento. ¿Confirmar?')) return;
    h.rogue.hand--;
    h.rogue.spent++;
  }

  h.actions--;
  h.move={active:true,pm:2};
  log('Inició una Acción de Movimiento con 2 PM.');
  render();
  document.querySelector('[data-tab="mas"]').click();
  speak('Acción de Movimiento. Dispones de 2 puntos de movimiento.');
}

function renderMove(){
  const h=hero();
  $('movePoints').textContent=h.move?.pm||0;
  $('moveHelp').textContent=h.move?.active
    ? 'Gasta PM en moverte, abrir una puerta o interactuar con un objeto.'
    : 'Inicia una acción de movimiento desde la pestaña Partida.';
  document.querySelectorAll('[data-move]').forEach(b=>b.disabled=!(h.move?.active&&h.move.pm>0));
}

function useMove(kind){
  const h=hero();
  if(!h.move?.active||h.move.pm<=0) return;
  h.move.pm--;

  const text=kind==='move'
    ? 'Se movió a una zona adyacente.'
    : kind==='door'
      ? 'Abrió una puerta.'
      : 'Interactuó con un objeto.';

  log(text);
  if(h.move.pm===0) h.move.active=false;
  render();
  speak(`${text} Quedan ${h.move.pm} puntos de movimiento.`);
}

function resetAttack(){
  ['step1','step2','step3','step4'].forEach((id,i)=>$(id).classList.toggle('active',i===0));
  $('effectsChecklist').textContent='Primero confirma la reserva.';
  $('damageResult').textContent='Resultado pendiente.';
}

function confirmPool(){
  const h=hero();
  const items=[`Reserva del héroe: ${$('heroDice').value||'no indicada'}.`];
  const minions=Number($('minions').value)||0;
  const black=Number($('enemyBlack').value)||0;

  if(minions===0&&black>0) items.push('No quedan secuaces: revisa si esos dados negros provenían únicamente de ellos.');
  else if(black>0) items.push(`Incluye ${black} dado(s) negro(s) del enemigo.`);

  if(h.zone==='dark') items.push('Estás en oscuridad: revisa efectos de Sombras.');

  if(h.cls==='ranger'&&$('attackType').value==='A distancia'){
    const map={
      fast:'Tiro rápido: aplica la fila central.',
      perfect:'Tiro certero: aplica la fila superior.',
      failed:'Tiro fallido: aplica la fila inferior.'
    };
    items.push(map[$('shotResult').value]);
  }

  const active=activeSkills(h);
  if(active.length) items.push('Habilidades activas disponibles: '+active.map(x=>x.name).join(', ')+'.');

  $('effectsChecklist').innerHTML='<ol>'+items.map(x=>`<li>${x}</li>`).join('')+'</ol>';
  $('step1').classList.remove('active');
  $('step2').classList.add('active');
  speak('Reserva confirmada. Lanza los dados físicos.');
}

function renderHistory(){
  $('historial').innerHTML=state.history.length
    ? state.history.map(x=>`<div><b>Ronda ${x.round} · ${x.hero}</b><br>${x.text}</div>`).join('')
    : '<p class="muted">Sin registros.</p>';
}

function answerRule(q){
  q=q.toLowerCase();

  if(q.includes('volea')&&q.includes('acción')){
    return 'Volea de Flechas se usa durante una Acción de Ataque. Si la carta no indica “Acción”, no consume una acción adicional; se paga su coste y modifica ese ataque.';
  }
  if(q.includes('movimiento')||q.includes('pm')||q.includes('puerta')){
    return 'Una Acción de Movimiento entrega PM. Cada PM puede usarse para moverse a una zona adyacente, abrir una puerta o interactuar con un objeto en la zona actual.';
  }
  if(q.includes('ataque')&&q.includes('orden')){
    return 'Orden: 1) formar la reserva de dados; 2) lanzar los dados; 3) aplicar habilidades y efectos, incluidos los dados negros; 4) sumar espadas y restar escudos para determinar heridas.';
  }
  if(q.includes('mazmorra')){
    return `El nivel de mazmorra es el nivel más alto del grupo. Actualmente es ${dungeonLevel()}.`;
  }
  if(q.includes('pícaro')||q.includes('picaro')||q.includes('ficha')){
    return 'El Pícaro roba 3 fichas al comenzar su turno y debe voltear una por cada acción. La bonificación no tiene que coincidir con la acción.';
  }
  if(q.includes('explorador')||q.includes('flecha')){
    return 'El Explorador resuelve físicamente el mazo. En la app selecciona Tiro rápido, Tiro certero o Tiro fallido.';
  }
  return 'No tengo una respuesta local segura para esa pregunta en esta versión.';
}

document.querySelectorAll('.bottomnav button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.bottomnav button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
    $(b.dataset.tab).classList.add('active');
    scrollTo(0,0);
  };
});

$('heroSelect').onchange=e=>{state.active=Number(e.target.value);save();render();};
$('nombre').onchange=e=>{hero().name=e.target.value||'Héroe';save();render();};
$('clase').onchange=e=>{
  const h=hero();
  h.cls=e.target.value;
  h.choices={1:null};
  if(h.cls==='rogue'){
    h.rogue={hand:3,spent:0,extra:0};
    h.hpMax=Math.max(h.hpMax,6);
  }else{
    h.hpMax=Math.max(h.hpMax,5);
  }
  save();
  render();
};

$('addHero').onclick=()=>{
  state.heroes.push(makeHero('Nuevo héroe','rogue'));
  state.active=state.heroes.length-1;
  save();
  render();
};

$('deleteHero').onclick=()=>{
  if(state.heroes.length===1) return alert('Debe quedar al menos un héroe.');
  if(confirm('¿Eliminar héroe?')){
    state.heroes.splice(state.active,1);
    state.active=0;
    save();
    render();
  }
};

$('sigRonda').onclick=()=>{
  state.round++;
  state.heroes.forEach(h=>h.actions=3);
  log('Comenzó una nueva ronda.');
  render();
  speak(`Ronda ${state.round}. Nivel de mazmorra ${dungeonLevel()}.`);
};

$('cambiarZona').onclick=()=>{
  const h=hero();
  h.zone=h.zone==='dark'?'light':'dark';
  log('Cambió de zona.');
  render();
  speak(`Ahora estás en ${h.zone==='dark'?'oscuridad':'luz'}.`);
};

document.querySelectorAll('[data-xp]').forEach(b=>{
  b.onclick=()=>{
    hero().xp=Math.max(0,hero().xp+Number(b.dataset.xp));
    log(`Experiencia ${hero().xp}.`);
    render();
  };
});

$('levelUp').onclick=levelUp;

$('menosVida').onclick=()=>{hero().hp=Math.max(0,hero().hp-1);save();render();};
$('masVida').onclick=()=>{hero().hp=Math.min(hero().hpMax,hero().hp+1);save();render();};
$('menosVidaMax').onclick=()=>{hero().hpMax=Math.max(1,hero().hpMax-1);hero().hp=Math.min(hero().hp,hero().hpMax);save();render();};
$('masVidaMax').onclick=()=>{hero().hpMax++;save();render();};
$('menosMana').onclick=()=>{hero().mana=Math.max(0,hero().mana-1);save();render();};
$('masMana').onclick=()=>{hero().mana=Math.min(hero().manaMax,hero().mana+1);save();render();};
$('menosManaMax').onclick=()=>{hero().manaMax=Math.max(0,hero().manaMax-1);hero().mana=Math.min(hero().mana,hero().manaMax);save();render();};
$('masManaMax').onclick=()=>{hero().manaMax++;save();render();};

$('preparar').onclick=prepareTurn;
$('startMove').onclick=startMovement;
$('startAttack').onclick=()=>{
  spendAction('Ataque');
  document.querySelector('[data-tab="ataque"]').click();
  resetAttack();
};

document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>spendAction(b.dataset.act));

$('olvido').onclick=()=>{
  const h=hero();
  let text=h.cls==='rogue'?`Te quedan ${h.rogue.hand} fichas.`:'Revisa el resultado del mazo de flechas.';
  if(h.zone==='dark') text+=' Estás en oscuridad.';
  $('resumen').textContent=text;
  speak(text);
};

$('fin').onclick=()=>{
  hero().actions=0;
  log('Turno finalizado.');
  render();
  speak('Turno finalizado.');
};

document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>useMove(b.dataset.move));
$('finishMove').onclick=()=>{
  hero().move.active=false;
  hero().move.pm=0;
  log('Finalizó Movimiento.');
  render();
};

$('confirmPool').onclick=confirmPool;
$('rolledDice').onclick=()=>{
  $('step2').classList.remove('active');
  $('step3').classList.add('active');
  speak('Ahora aplica habilidades y efectos, incluidos los dados negros.');
};
$('effectsDone').onclick=()=>{
  $('step3').classList.remove('active');
  $('step4').classList.add('active');
  speak('Suma espadas y resta escudos.');
};
$('calculateDamage').onclick=()=>{
  const damage=Math.max(0,(Number($('swords').value)||0)-(Number($('shields').value)||0));
  $('damageResult').innerHTML=`<b>${damage} herida(s) al enemigo.</b>`;
  log(`Ataque resuelto: ${damage} heridas.`);
  speak(`${damage} heridas al enemigo.`);
};

$('attackType').onchange=()=>{
  $('rangerShot').classList.toggle('hidden', !(hero().cls==='ranger'&&$('attackType').value==='A distancia'));
};

$('preguntar').onclick=()=>{
  const answer=answerRule($('pregunta').value);
  $('respuesta').textContent=answer;
  window.lastAnswer=answer;
};
$('leer').onclick=()=>speak(window.lastAnswer||$('respuesta').textContent);
$('dictar').onclick=()=>{
  const R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!R) return alert('Este navegador no permite dictado.');
  const r=new R();
  r.lang='es-ES';
  r.onresult=e=>{
    $('pregunta').value=e.results[0][0].transcript;
    $('preguntar').click();
  };
  r.start();
};

$('vozOn').onchange=e=>{state.voice=e.target.value;save();};
$('velocidad').onchange=e=>{state.rate=e.target.value;save();};
$('probarVoz').onclick=()=>speak(`Asistente preparado. Nivel de mazmorra ${dungeonLevel()}.`);

$('borrarHist').onclick=()=>{state.history=[];save();renderHistory();};

$('exportar').onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='md2_partida.json';
  a.click();
};

$('importar').onchange=e=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      state=JSON.parse(reader.result);
      save();
      render();
    }catch{
      alert('Archivo no válido');
    }
  };
  reader.readAsText(file);
};

$('nueva').onclick=()=>{
  if(confirm('¿Nueva partida?')){
    state=defaultState();
    save();
    render();
  }
};

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

render();
resetAttack();
