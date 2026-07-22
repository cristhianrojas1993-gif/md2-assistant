const KEY = 'md2v100', $ = id => document.getElementById(id), C = MD2.classes;
const COLORS = {
  rogue: '#8b5cf6',
  ranger: '#22c55e',
  shaman: '#f59e0b',
  paladin: '#3b82f6',
  mage: '#06b6d4',
  berserker: '#ef4444'
};
const CLASS_ICONS = {
  rogue: '🗡️',
  ranger: '🏹',
  shaman: '🔥',
  paladin: '🛡️',
  mage: '✨',
  berserker: '🪓'
};
function classIcon(cls) {
  return `<span class="classIcon" style="background:${ COLORS[cls] }22;color:${ COLORS[cls] }">${ CLASS_ICONS[cls] || '' }</span>`;
}
function showFloatNumber(delta, kind) {
  const slot = document.getElementById('floatNumSlot');
  const card = document.getElementById('heroHeaderCard');
  if (!slot || !card)
    return;
  const el = document.createElement('div');
  el.className = `float-number ${ kind === 'heal' ? 'float-heal' : 'float-dmg' }`;
  el.textContent = (delta > 0 ? '+' : '') + delta;
  slot.appendChild(el);
  card.classList.remove('flash-red', 'flash-green');
  void card.offsetWidth;
  card.classList.add(kind === 'heal' ? 'flash-green' : 'flash-red');
  setTimeout(() => el.remove(), 1200);
}
function showPhaseCurtain(text) {
  const curtain = document.getElementById('phaseCurtain');
  const label = document.getElementById('phaseCurtainText');
  if (!curtain || !label)
    return;
  label.textContent = text;
  curtain.classList.remove('show');
  void curtain.offsetWidth;
  curtain.classList.add('show');
}
function showLevelUpBurst() {
  const card = document.getElementById('heroHeaderCard');
  if (!card)
    return;
  card.classList.remove('levelup-burst');
  void card.offsetWidth;
  card.classList.add('levelup-burst');
  for (let i = 0; i < 10; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const angle = (Math.PI * 2 * i) / 10, dist = 50 + Math.random() * 24;
    spark.style.setProperty('--sx', Math.cos(angle) * dist + 'px');
    spark.style.setProperty('--sy', Math.sin(angle) * dist + 'px');
    spark.style.left = '50%';
    spark.style.top = '40%';
    card.appendChild(spark);
    requestAnimationFrame(() => spark.classList.add('go'));
    setTimeout(() => spark.remove(), 1100);
  }
  setTimeout(() => card.classList.remove('levelup-burst'), 1300);
}
function makeHero(cls = 'rogue') {
  const c = C[cls];
  return {
    id: Date.now() + Math.random(),
    name: c.label,
    cls,
    level: 1,
    xp: 0,
    hp: c.hp,
    hpMax: c.hp,
    mana: c.mana,
    manaMax: c.mana,
    zone: 'light',
    actions: s.mode === 'solo' ? 4 : 3,
    lastActiveRound: 0,
    turnDone: false,
    exitedMap: false,
    choices: { 1: null },
    lockedChoices: {},
    move: {
      on: false,
      pm: 0
    },
    inventory: [],
    equipped: [],
    rogue: {
      hand: 3,
      spent: 0
    },
    shaman: {
      fire: 0,
      water: 0,
      air: 0,
      nature: 0,
      unlocked: {},
      spirits: [],
      elementBoostDone: false
    },
    paladin: {
      consecrations: 0,
      blessed: ''
    },
    mage: {
      amulet: 0,
      slots: MD2.talismanDefaults.map(q => ({ ...q }))
    },
    berserker: {
      fury: 0,
      stance: 'Furia Sangrienta'
    },
    statuses: [],
    unconscious: false,
    manaAtKO: null,
    reviveNextRound: false,
    flow: {
      type: null,
      step: 0,
      attack: {},
      defense: {}
    }
  };
}
function fresh() {
  return {
    mode: 'coop',
    round: 1,
    phase: 0,
    dark: {
      side: 'front',
      i: 0
    },
    heroes: [],
    active: 0,
    history: [],
    phaseHistory: [],
    xpHistory: [],
    confirmed: false,
    voice: 'yes',
    rate: 1,
    music: 'yes',
    musicVolume: 0.15,
    sfx: 'yes',
    voicePitch: 1,
    voiceName: '',
    audioUnlocked: false,
    lastAnnouncement: '',
    resurrection: {
      blue: 0,
      grey: 0
    },
    levelQueue: [],
    levelCursor: 0,
    levelPhaseResolved: false,
    darknessPending: false,
    turnPrompt: false,
    enemyPhaseAsked: false,
    gameOver: false,
    activeMissionId: '',
    missionResult: '',
    missionState: {}
  };
}
let s = JSON.parse(localStorage.getItem(KEY) || 'null') || fresh();
s.heroes.forEach(x => x.statuses = x.statuses || []);
if (!s.mode)
  s.mode = 'coop';
s.heroes.forEach(x => {
  if (x.cls === 'shaman') {
    x.shaman = x.shaman || {
      fire: 0,
      water: 0,
      air: 0,
      nature: 0,
      unlocked: {}
    };
    x.shaman.unlocked = x.shaman.unlocked || {};
    x.shaman.spirits = x.shaman.spirits || [];
  }
});
s.heroes.forEach(x => {
  if (typeof x.unconscious !== 'boolean')
    x.unconscious = false;
  if (typeof x.reviveNextRound !== 'boolean')
    x.reviveNextRound = false;
  if (x.manaAtKO === undefined)
    x.manaAtKO = null;
  if (typeof x.turnDone !== 'boolean')
    x.turnDone = false;
  if (typeof x.exitedMap !== 'boolean')
    x.exitedMap = false;
});
if (!s.resurrection)
  s.resurrection = {
    blue: Math.ceil(Math.max(1, s.heroes.length) / 2),
    grey: 0
  };
if (!Array.isArray(s.levelQueue))
  s.levelQueue = [];
if (s.levelCursor === undefined)
  s.levelCursor = 0;
if (s.levelPhaseResolved === undefined)
  s.levelPhaseResolved = false;
if (s.darknessPending === undefined)
  s.darknessPending = false;
if (s.turnPrompt === undefined)
  s.turnPrompt = false;
if (s.enemyPhaseAsked === undefined)
  s.enemyPhaseAsked = false;
if (s.gameOver === undefined)
  s.gameOver = false;
if (s.activeMissionId === undefined)
  s.activeMissionId = '';
if (s.missionResult === undefined)
  s.missionResult = '';
if (!s.missionState)
  s.missionState = {};
if (s.music === undefined)
  s.music = 'yes';
if (s.musicVolume === undefined)
  s.musicVolume = 0.15;
if (s.sfx === undefined)
  s.sfx = 'yes';
if (s.voicePitch === undefined)
  s.voicePitch = 1;
if (s.voiceName === undefined)
  s.voiceName = '';
if (s.audioUnlocked === undefined)
  s.audioUnlocked = false;
if (s.lastAnnouncement === undefined)
  s.lastAnnouncement = '';
let audioCtx = null;
function heroSpoken(x = h()) {
  return `${ x.name }, ${ C[x.cls].label === 'Mago' ? 'el Mago' : C[x.cls].label === 'Pícaro' ? 'el Pícaro' : C[x.cls].label === 'Explorador' ? 'el Explorador' : C[x.cls].label === 'Chamán' ? 'el Chamán' : C[x.cls].label === 'Paladín' ? 'el Paladín' : 'el Berserker' }`;
}
async function ensureAudio() {
  s.audioUnlocked = true;
  save();
  renderAudioStatus();
  return true;
}
function stopAmbient() {
  const el = document.getElementById('ambientSong');
  if (!el)
    return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch (err) {
  }
}
function playTone() {
}
async function ambient(mode) {
}
function attackSongEl() {
  let el = document.getElementById('attackSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'attackSong';
    el.src = 'el-grito-de-los-vientos.mp3';
    el.preload = 'auto';
    document.body.appendChild(el);
  }
  return el;
}
let attackSongFadeInterval = null;
function playAttackSong() {
  if (attackSongFadeInterval) {
    clearInterval(attackSongFadeInterval);
    attackSongFadeInterval = null;
  }
  pauseAmbient();
  const el = attackSongEl();
  try {
    el.volume = 1;
    el.currentTime = 0;
    el.play().catch(() => {
    });
  } catch (err) {
  }
}
function stopAttackSong() {
  const el = document.getElementById('attackSong');
  if (!el) {
    resumeAmbient();
    return;
  }
  if (attackSongFadeInterval) {
    clearInterval(attackSongFadeInterval);
    attackSongFadeInterval = null;
  }
  const fadeSteps = 18, fadeStepMs = 100, startVolume = el.volume || 1;
  let step = 0;
  attackSongFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(attackSongFadeInterval);
      attackSongFadeInterval = null;
      try {
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      } catch (err) {
      }
      resumeAmbient();
    }
  }, fadeStepMs);
}
const AMBIENT_LOOP_START = 25;
function ambientEl() {
  let el = document.getElementById('ambientSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'ambientSong';
    el.src = 'ambiente.mp3';
    el.preload = 'auto';
    el.addEventListener('ended', () => {
      try {
        el.currentTime = AMBIENT_LOOP_START;
        el.play().catch(() => {
        });
      } catch (err) {
      }
    });
    document.body.appendChild(el);
  }
  return el;
}
function startAmbient() {
  const el = ambientEl();
  try {
    el.volume = 1;
    el.currentTime = AMBIENT_LOOP_START;
    el.play().catch(() => {
    });
  } catch (err) {
  }
}
function pauseAmbient() {
  const el = document.getElementById('ambientSong');
  if (!el)
    return;
  try {
    el.pause();
  } catch (err) {
  }
}
function resumeAmbient() {
  const el = document.getElementById('ambientSong');
  if (!el)
    return;
  try {
    el.volume = 1;
    el.play().catch(() => {
    });
  } catch (err) {
  }
}
function duckAndSay(t) {
  say(t);
}
function updateAmbient() {
}
const h = () => s.heroes[s.active], cl = () => C[h().cls], save = () => localStorage.setItem(KEY, JSON.stringify(s));
function classVoiceProfile(x = h()) {
  const p = {
    rogue: {
      rate: 1.04,
      pitch: 0.92
    },
    ranger: {
      rate: 1.08,
      pitch: 1
    },
    shaman: {
      rate: 0.9,
      pitch: 0.95
    },
    paladin: {
      rate: 0.92,
      pitch: 0.9
    },
    mage: {
      rate: 0.9,
      pitch: 1.04
    },
    berserker: {
      rate: 1.08,
      pitch: 0.82
    }
  };
  return x ? p[x.cls] || {
    rate: 1,
    pitch: 1
  } : {
    rate: 1,
    pitch: 1
  };
}
const speechQueue = [];
let speechBusy = false;
let speechWatchdog = null;
function clearSpeechWatchdog() {
  if (speechWatchdog) {
    clearTimeout(speechWatchdog);
    speechWatchdog = null;
  }
}
function processSpeech() {
  if (speechBusy || !speechQueue.length || s.voice !== 'yes' || !('speechSynthesis' in window))
    return;
  speechBusy = true;
  const item = speechQueue.shift(), u = new SpeechSynthesisUtterance(item.text);
  u.lang = 'es-ES';
  const prof = classVoiceProfile(item.hero);
  u.rate = (+s.rate || 1) * prof.rate;
  u.pitch = (+s.voicePitch || 1) * prof.pitch;
  const voices = speechSynthesis.getVoices(), chosen = voices.find(v => v.name === s.voiceName) || voices.find(v => v.lang?.toLowerCase().startsWith('es'));
  if (chosen)
    u.voice = chosen;
  const done = () => {
    clearSpeechWatchdog();
    speechBusy = false;
    setTimeout(processSpeech, 100);
  };
  u.onend = done;
  u.onerror = done;
  clearSpeechWatchdog();
  speechWatchdog = setTimeout(done, 15000);
  try {
    speechSynthesis.speak(u);
  } catch (err) {
    done();
  }
}
function resetSpeech() {
  clearSpeechWatchdog();
  speechBusy = false;
  speechQueue.length = 0;
  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel();
    } catch (err) {
    }
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && 'speechSynthesis' in window && !speechSynthesis.speaking && speechBusy) {
    speechBusy = false;
    processSpeech();
  }
});
function say(t, profileHero = h()) {
  s.lastAnnouncement = t || s.lastAnnouncement;
  save();
  if (s.voice !== 'yes' || !('speechSynthesis' in window))
    return;
  speechQueue.push({
    text: t,
    hero: profileHero
  });
  processSpeech();
}
function log(t) {
  s.history.unshift({
    r: s.round,
    p: MD2.phases[s.phase],
    n: h()?.name || 'Grupo',
    t
  });
  save();
  renderHistory();
}
function dungeon() {
  return Math.max(1, ...s.heroes.map(x => x.level));
}
function skills(x = h()) {
  return C[x.cls].skills.map(a => ({
    name: a[0],
    level: a[1],
    branch: a[2],
    grade: a[3]
  }));
}
function activeSkills(x = h()) {
  const chosen = Object.values(x.choices || {}).filter(Boolean).map(n => skills(x).find(q => q.name === n)).filter(Boolean), m = {};
  chosen.forEach(q => {
    if (!m[q.branch] || q.grade > m[q.branch].grade)
      m[q.branch] = q;
  });
  return Object.values(m);
}
function pending(x) {
  for (let i = 1; i <= x.level; i++)
    if (!x.lockedChoices?.[i])
      return i;
  return 0;
}
function darkArr() {
  return MD2.darkness[s.dark.side];
}
function darkNow() {
  return darkArr()[s.dark.i];
}
function phaseHelp() {
  return [
    `Cada héroe dispone de ${ s.mode === 'solo' ? 4 : 3 } acciones.`,
    'Activa las cuadrillas y después los monstruos errantes.',
    'La app revisa automáticamente quién debe subir de nivel.',
    'Avanza el medidor y resuelve su efecto.'
  ][s.phase];
}
function hasPendingChoice() {
  if (s.phase === 2 && !s.levelPhaseResolved)
    return true;
  if (s.confirmed && s.heroes.some(x => !x.unconscious && pending(x)))
    return true;
  return false;
}
function tab(id) {
  if (id !== 'hero' && hasPendingChoice()) {
    alert('Debes terminar de elegir la habilidad pendiente antes de continuar.');
    id = 'hero';
  }
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  renderHeroTabs();
  scrollTo(0, 0);
}
function loadVoiceOptions() {
  if (!$('voiceSelect'))
    return;
  const voices = speechSynthesis.getVoices().filter(v => v.lang?.toLowerCase().startsWith('es'));
  $('voiceSelect').innerHTML = '<option value="">Automática</option>' + voices.map(v => `<option value="${ v.name }" ${ s.voiceName === v.name ? 'selected' : '' }>${ v.name } (${ v.lang })</option>`).join('');
}
function renderAudioStatus() {
  if (!$('audioStatus'))
    return;
  const ok = 'speechSynthesis' in window;
  $('audioStatus').textContent = !ok ? 'La voz no está disponible en este navegador.' : s.voice === 'no' ? 'Estado de la voz: desactivada.' : 'Estado de la voz: disponible.';
  $('audioStatus').className = `notice ${ !ok ? 'warn' : s.voice === 'no' ? 'off' : 'ok' }`;
}
function renderSettings() {
  if (!$('voiceSetting'))
    return;
  $('voiceSetting').value = s.voice;
  $('voiceRateSetting').value = s.rate;
  $('voicePitchSetting').value = s.voicePitch;
  loadVoiceOptions();
  renderAudioStatus();
}
function renderGameOver() {
  const el = $('gameOverScreen');
  if (!el)
    return;
  if (!s.gameOver) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = `<h1>Derrota</h1><p>El grupo ha sido derrotado: no quedan Fichas de Resurrección disponibles y un héroe ha vuelto a quedar inconsciente.</p><div class="actions"><button id="restartSameHeroes" class="primary">Reiniciar con los mismos héroes</button><button id="restartNewGame">Iniciar partida nueva</button></div>`;
  $('restartSameHeroes').onclick = () => {
    if (!confirm('¿Reiniciar la partida manteniendo los mismos héroes y clases? Se restablecerán vida, XP, nivel e inventario.'))
      return;
    const classes = s.heroes.map(x => x.cls);
    const keepVoice = {
      voice: s.voice,
      rate: s.rate,
      music: s.music,
      musicVolume: s.musicVolume,
      sfx: s.sfx,
      voicePitch: s.voicePitch,
      voiceName: s.voiceName,
      audioUnlocked: s.audioUnlocked
    };
    s = fresh();
    Object.assign(s, keepVoice);
    classes.forEach(c => s.heroes.push(makeHero(c)));
    s.mode = classes.length <= 1 ? 'solo' : 'coop';
    save();
    render();
    tab('setup');
    say('Partida reiniciada con los mismos héroes. Prepara el grupo para comenzar de nuevo.');
  };
  $('restartNewGame').onclick = () => {
    if (!confirm('¿Iniciar una partida completamente nueva? Se perderá todo el progreso actual.'))
      return;
    const keepVoice = {
      voice: s.voice,
      rate: s.rate,
      music: s.music,
      musicVolume: s.musicVolume,
      sfx: s.sfx,
      voicePitch: s.voicePitch,
      voiceName: s.voiceName,
      audioUnlocked: s.audioUnlocked
    };
    s = fresh();
    Object.assign(s, keepVoice);
    save();
    render();
    tab('setup');
    say('Lista para preparar una partida nueva.');
  };
}
function render() {
  renderHeroTabs();
  renderSetup();
  renderGame();
  renderHero();
  renderHistory();
  renderResurrection();
  renderSettings();
  renderMissions();
  renderGameOver();
  updateAmbient();
  $('phaseChip').textContent = s.confirmed ? MD2.phases[s.phase] : 'Preparación';
}
function renderHeroTabs() {
  const b = $('heroTabs');
  if (!s.confirmed) {
    b.innerHTML = '';
    return;
  }
  b.innerHTML = `<button data-main="game">Partida</button>` + s.heroes.map((x, i) => `<button data-hi="${ i }" class="${ i === s.active && $('hero').classList.contains('active') ? 'activeHero' : '' } ${ (x.turnDone && !x.unconscious) || x.exitedMap ? 'heroTurnDone' : '' }" style="--hero:${ COLORS[x.cls] }">${ x.name }${ x.exitedMap ? ' 🚪' : x.turnDone && !x.unconscious ? ' ✓' : '' }</button>`).join('') + `<button data-main="rules">Reglas</button>`;
  b.querySelectorAll('[data-hi]').forEach(q => q.onclick = () => {
    s.active = +q.dataset.hi;
    save();
    render();
    tab('hero');
    duckAndSay(`Héroe activo: ${ heroSpoken(h()) }.`);
  });
  b.querySelectorAll('[data-main]').forEach(q => q.onclick = () => tab(q.dataset.main));
}
function renderSetup() {
  const picker = $('classPicker');
  picker.innerHTML = Object.keys(C).map(k => `<button class="classChoice" data-class="${ k }" style="border-color:${ COLORS[k] }">${ C[k].label }</button>`).join('');
  picker.querySelectorAll('[data-class]').forEach(b => b.onclick = () => {
    picker.querySelectorAll('.classChoice').forEach(x => x.classList.remove('selected'));
    b.classList.add('selected');
    picker.dataset.selected = b.dataset.class;
  });
  $('setupHeroes').innerHTML = s.heroes.map((x, i) => `<div class="heroSetupRow" style="border-left:5px solid ${ COLORS[x.cls] }"><div class="grid"><label>Clase<input value="${ C[x.cls].label }" disabled></label><label>Nombre<input data-name="${ i }" value="${ x.name }"></label></div><button data-remove="${ i }" class="danger top">Quitar</button></div>`).join('') || '<p class="muted">Aún no hay héroes.</p>';
  document.querySelectorAll('[data-name]').forEach(inp => inp.onchange = () => {
    s.heroes[+inp.dataset.name].name = inp.value || C[s.heroes[+inp.dataset.name].cls].label;
    save();
  });
  document.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
    s.heroes.splice(+b.dataset.remove, 1);
    s.active = 0;
    save();
    renderSetup();
  });
  $('setupStatus').textContent = s.confirmed ? 'Grupo confirmado.' : 'Todavía no has confirmado el grupo.';
  $('playerMode').value = s.mode;
  $('soloRuleNotice').classList.toggle('hidden', s.mode !== 'solo');
}
function renderEnemyDefense() {
  const panel = $('enemyDefensePanel');
  if (!panel)
    return;
  if (s.phase !== 1 || !s.heroes.length) {
    panel.innerHTML = '';
    return;
  }
  const available = s.heroes.filter(x => !x.unconscious && !x.exitedMap);
  panel.innerHTML = `<h2>Defensa del grupo</h2><p class="notice">¿Hay enemigos atacando a los héroes en esta fase?</p><div class="actions"><button id="enemyAttackYes" class="primary">Sí, un héroe es atacado</button><button id="enemyAttackNo">No hay más ataques, continuar</button></div><div id="enemyDefenseForm"></div>`;
  $('enemyAttackYes').onclick = () => {
    s.enemyPhaseAsked = true;
    playAttackSong();
    renderDefenseForm(available);
  };
  $('enemyAttackNo').onclick = () => {
    s.enemyPhaseAsked = true;
    $('enemyDefenseForm').innerHTML = '';
    save();
    say('De acuerdo, sin más ataques. Avanzamos a la fase de subida de nivel.');
    nextPhase();
  };
}
function renderDefenseForm(available) {
  const form = $('enemyDefenseForm');
  if (!form)
    return;
  const m = getActiveMission();
  const invokerActive = m && m.id === 'the_step' && !s.missionState.reachedRift && !s.missionResult;
  const invokerOption = invokerActive ? `<option value="invoker">El Invocador (NPC)</option>` : '';
  form.innerHTML = `<div class="grid top"><label>Héroe atacado<select id="defendedHero">${ available.map((x, i) => `<option value="${ s.heroes.indexOf(x) }">${ x.name }</option>`).join('') }${ invokerOption }</select></label><label>Daño recibido<select id="damageAmount">${ Array.from({ length: 10 }, (_, i) => i + 1).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label></div><div id="provokeSlot"></div><button id="confirmDamage" class="primary top">Confirmar daño</button>`;
  function renderProvokeSlot() {
    if ($('defendedHero').value === 'invoker') {
      $('provokeSlot').innerHTML = '';
      return;
    }
    const idx = +$('defendedHero').value, target = s.heroes[idx];
    const slot = $('provokeSlot');
    if (target.cls === 'berserker' && target.berserker.stance === 'Provocador')
      slot.innerHTML = `<button id="provokeWound" class="top" ${ target.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: infligir 1 Herida al atacante (${ target.berserker.fury }/7)</button>`;
    else
      slot.innerHTML = '';
    if ($('provokeWound'))
      $('provokeWound').onclick = () => {
        if (target.berserker.fury < 1)
          return;
        if (!confirm('¿Gastar 1 Furia para infligir 1 Herida al atacante?'))
          return;
        target.berserker.fury--;
        log(`${ target.name } gasta 1 Furia (Provocador) para infligir 1 Herida al atacante.`);
        save();
        renderProvokeSlot();
        say('Infliges 1 Herida al atacante.');
      };
  }
  renderProvokeSlot();
  $('defendedHero').onchange = renderProvokeSlot;
  $('confirmDamage').onclick = () => {
    const dmg = +$('damageAmount').value;
    stopAttackSong();
    if ($('defendedHero').value === 'invoker') {
      s.missionState.invokerHp = Math.max(0, (s.missionState.invokerHp ?? 8) - dmg);
      log(`El Invocador recibe ${ dmg } de daño (Vida restante: ${ s.missionState.invokerHp }/8).`);
      save();
      render();
      if (s.missionState.invokerHp === 0) {
        s.missionResult = 'defeat';
        save();
        renderMissions();
        duckAndSay('El Invocador ha muerto. La misión termina en derrota.');
      } else {
        say(`El Invocador recibe ${ dmg } de daño. Le quedan ${ s.missionState.invokerHp } de vida. ¿Hay más enemigos atacando a los héroes?`);
      }
      return;
    }
    const targetIdx = +$('defendedHero').value, target = s.heroes[targetIdx];
    const paladin = s.heroes.find(q => q.cls === 'paladin' && !q.unconscious && q !== target);
    let finalTarget = target;
    if (paladin) {
      const hasVinculo = activeSkills(paladin).some(q => q.branch === 'vinculo');
      if (hasVinculo) {
        const zoneConsecrated = confirm(`${ paladin.name } tiene Vínculo Vital activo. ¿La zona donde ocurre este ataque está consagrada?`);
        if (zoneConsecrated) {
          if (confirm(`¿Quieres que ${ paladin.name } reciba el daño en lugar de ${ target.name }?`))
            finalTarget = paladin;
        }
      }
    }
    finalTarget.hp = Math.max(0, finalTarget.hp - dmg);
    log(`${ finalTarget.name } recibe ${ dmg } de daño en la fase de Enemigos${ finalTarget !== target ? ` (redirigido desde ${ target.name } por Vínculo Vital)` : '' }.`);
    if (finalTarget.hp === 0 && !finalTarget.unconscious)
      knockOut(finalTarget);
    if (finalTarget.cls === 'berserker' && dmg > 0) {
      let gain = Math.min(dmg, 7 - finalTarget.berserker.fury);
      if (gain > 0) {
        finalTarget.berserker.fury += gain;
        log(`${ finalTarget.name } gana ${ gain } punto${ gain > 1 ? 's' : '' } de Furia por recibir daño. Furia: ${ finalTarget.berserker.fury }/7.`);
      }
    }
    save();
    render();
    say(`${ finalTarget.name } recibe ${ dmg } de daño. ¿Hay más enemigos atacando a los héroes?`);
  };
}
function renderGame() {
  if (!$('round'))
    return;
  $('round').textContent = s.round;
  $('phase').textContent = MD2.phases[s.phase];
  $('dungeon').textContent = dungeon();
  $('darkPos').textContent = s.heroes.length ? `${ s.dark.side === 'front' ? 'Anverso' : 'Reverso' } ${ darkNow()[0] }` : '\u2014';
  $('phaseHelp').textContent = s.phase === 3 && s.darknessPending ? 'Resuelve el efecto anunciado y luego pulsa Siguiente fase para confirmarlo.' : phaseHelp();
  $('darkTrack').innerHTML = `<div class="badge top">${ s.dark.side === 'front' ? 'Anverso' : 'Reverso' }</div>` + darkArr().map((x, i) => `<div class="cell ${ i === s.dark.i ? 'active' : '' }">${ x[0] }</div>`).join('');
  $('darkEvent').textContent = `${ s.dark.side === 'front' ? 'Anverso' : 'Reverso' } · Casilla ${ darkNow()[0] }: ${ darkNow()[1] }`;
  $('resolveDarkness').classList.toggle('hidden', !(s.phase === 3 && s.darknessPending));
  $('nextPhase').classList.toggle('hidden', s.phase === 3 && s.darknessPending);
  renderEnemyDefense();
}
function renderHero() {
  if (!s.heroes.length) {
    $('heroPage').innerHTML = '<div class="card">Primero prepara el grupo.</div>';
    return;
  }
  const x = h();
  document.documentElement.style.setProperty('--hero', COLORS[x.cls]);
  if (x.lastActiveRound !== s.round && !x.unconscious) {
    x.lastActiveRound = s.round;
    startHeroTurn(x);
  }
  if (s.turnPrompt && s.phase !== 0) {
    s.turnPrompt = false;
    save();
  }
  if (s.turnPrompt) {
    const options = s.heroes.filter(q => !q.unconscious && !q.turnDone && q !== x);
    if (options.length === 0) {
      s.turnPrompt = false;
      save();
      renderHeroTabs();
      renderHero();
      return;
    }
    if (options.length === 1) {
      s.turnPrompt = false;
      s.active = s.heroes.indexOf(options[0]);
      save();
      renderHeroTabs();
      renderHero();
      return;
    }
    $('heroPage').innerHTML = `<div class="card"><h2>¿Quién juega a continuación?</h2><p class="notice">El turno de ${ x.name } ha terminado. El grupo decide libremente qué héroe actúa ahora.</p><div class="actions">${ options.map(q => `<button data-next-hero="${ s.heroes.indexOf(q) }" class="primary">${ q.name }</button>`).join('') }</div></div>`;
    document.querySelectorAll('[data-next-hero]').forEach(b => b.onclick = () => {
      s.active = +b.dataset.nextHero;
      s.turnPrompt = false;
      save();
      render();
      duckAndSay(`Héroe activo: ${ heroSpoken(h()) }.`);
    });
    return;
  }
  if (x.cls === 'shaman' && !x.shaman.elementBoostDone && !x.unconscious && !pending(x)) {
    $('heroPage').innerHTML = `<div class="card"><h2>Aumenta un Elemento</h2><p class="notice">Al inicio de tu turno debes aumentar cualquier Elemento en 1. Elige uno para continuar.</p><div class="resource">${ shamanElementControls(x, true) }</div></div>`;
    document.querySelectorAll('[data-boost-el]').forEach(b => b.onclick = () => {
      x.shaman[b.dataset.boostEl] = Math.min(4, x.shaman[b.dataset.boostEl] + 1);
      x.shaman.elementBoostDone = true;
      log(`${ x.name } aumenta ${ MD2.shamanElements[b.dataset.boostEl] } en 1 (obligatorio de inicio de turno).`);
      save();
      renderHero();
      say(`Aumentas ${ MD2.shamanElements[b.dataset.boostEl] }.`);
    });
    return;
  }
  const activeSec = document.querySelector('.sectionTabs [data-sec].active')?.dataset.sec;
  $('heroPage').innerHTML = `<div class="activeHeroBanner">Héroe activo: ${ heroSpoken(x) }</div>${ x.unconscious ? '<div class="unconsciousBanner">INCONSCIENTE \xB7 Tumba la miniatura. No realiza acciones ni puede ser objetivo.</div>' : '' }<div class="card heroHeader zone-${ x.zone === 'dark' ? 'dark' : 'light' }" id="heroHeaderCard"><div id="floatNumSlot"></div><div class="row between"><div><h2>${ classIcon(x.cls) }${ x.name }</h2><small>${ C[x.cls].label }</small></div><span class="badge">Nivel ${ x.level }</span></div><div class="stats top"><div><small>Vida</small><b>${ x.hp }/${ x.hpMax }</b></div><div><small>Maná</small><b>${ x.mana }/${ x.manaMax }</b></div><div><small>XP</small><b>${ x.xp }</b></div><div><small>Acciones</small><b>${ x.actions }</b></div><div><small>Zona</small><b>${ x.zone === 'dark' ? 'Oscuridad' : 'Luz' }</b></div><div><small>Habilidad pendiente</small><b>${ pending(x) ? 'Sí' : 'No' }</b></div></div></div><div class="sectionTabs"><button data-sec="summary" class="${ !x.flow.type && (!activeSec || activeSec === 'summary') ? 'active' : '' }">Resumen</button><button data-sec="skills" class="${ activeSec === 'skills' ? 'active' : '' }">Habilidades${ pending(x) ? '<span class="alertDot"></span>' : '' }</button><button data-sec="actions" class="${ x.flow.type || activeSec === 'actions' ? 'active' : '' }">Turno</button>${ x.cls === 'shaman' ? `<button data-sec="spirits" class="${ activeSec === 'spirits' ? 'active' : '' }">Espíritus</button>` : '' }<button data-sec="inventory" class="${ activeSec === 'inventory' ? 'active' : '' }">Inventario</button></div><div id="sec-summary" class="heroSection ${ !x.flow.type && (!activeSec || activeSec === 'summary') ? 'active' : '' }">${ summaryHtml(x) }</div><div id="sec-skills" class="heroSection ${ activeSec === 'skills' ? 'active' : '' }">${ skillsHtml(x) }</div><div id="sec-actions" class="heroSection ${ x.flow.type || activeSec === 'actions' ? 'active' : '' }">${ actionsHtml(x) }</div>${ x.cls === 'shaman' ? `<div id="sec-spirits" class="heroSection ${ activeSec === 'spirits' ? 'active' : '' }"><div class="card"><h2>Espíritus invocados</h2>${ shamanSpiritHtml(x) }</div></div>` : '' }<div id="sec-inventory" class="heroSection ${ activeSec === 'inventory' ? 'active' : '' }">${ inventoryHtml(x) }</div>`;
  if (x.unconscious)
    $('heroHeaderCard')?.classList.add('ko-fx');
  document.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-sec]').forEach(q => q.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.heroSection').forEach(q => q.classList.remove('active'));
    $('sec-' + b.dataset.sec).classList.add('active');
  });
  bindHero();
}
function summaryHtml(x) {
  return `<div class="card"><h2>Estadísticas</h2><div class="row"><button id="hpDown">− Vida</button><button id="hpUp">+ Vida</button><button id="manaDown">− Maná</button><button id="manaUp">+ Maná</button><button id="toggleZone">Luz/Oscuridad</button></div><div class="row"><button id="xpDown">− XP</button><button id="xpUp">+ XP</button></div><h3>Habilidad propia</h3><div class="passive">${ C[x.cls].ability }</div><h3>Sombras</h3><div class="passive">${ C[x.cls].shadow }</div></div><div class="card"><h2>Mecánica exclusiva</h2>${ classHtml(x) }</div><div class="card"><h2>Estados activos</h2><div class="statusChips">${ (x.statuses || []).map((st, i) => `<span class="statusChip">${ st }<button data-remove-status="${ i }">×</button></span>`).join('') || '<span class="muted">Sin estados activos.</span>' }</div><div class="row"><select id="statusPicker"><option>Quemado</option><option>Congelado</option><option>Envenenado</option><option>Aturdido</option><option>Maldito</option><option>Bendecido</option></select><button id="addStatus">Añadir estado</button></div></div>`;
}
function shamanCostText(cost) {
  return Object.entries(cost || {}).map(([k, v]) => `${ v } ${ MD2.shamanElements[k] }`).join(' + ');
}
function shamanCanPay(x, cost) {
  return Object.entries(cost || {}).every(([k, v]) => (x.shaman[k] || 0) >= v);
}
function shamanPay(x, cost) {
  Object.entries(cost || {}).forEach(([k, v]) => x.shaman[k] = Math.max(0, (x.shaman[k] || 0) - v));
}
function shamanKnownAbilities(x) {
  let list = [
    {
      key: 'basicAttack',
      ...MD2.shamanAbilities.basicAttack
    },
    {
      key: 'basicHeal',
      ...MD2.shamanAbilities.basicHeal
    }
  ];
  activeSkills(x).forEach(q => {
    let a = MD2.shamanAbilities[q.name];
    if (a)
      list.push({
        key: q.name,
        name: q.name,
        ...a
      });
  });
  return list;
}
function shamanSpiritHtml(x) {
  const families = [
    { key: 'fire', label: 'Espíritu de Fuego' },
    { key: 'ice', label: 'Espíritu de Escarcha' }
  ];
  return families.map(fam => {
    const p = x.shaman.spirits.find(q => q.type.startsWith(fam.key));
    if (!p)
      return `<div class="spiritCard"><div class="row between"><b>${ fam.label }</b><span class="badge">No invocado</span></div><p class="muted">Invoca este Espíritu usando el hechizo correspondiente en Hechizos disponibles.</p></div>`;
    if (p.defeated)
      return `<div class="spiritCard"><div class="row between"><b>${ p.name }</b><span class="badge">Derrotado</span></div><p class="muted">Este Espíritu fue derrotado. Invócalo de nuevo para reactivarlo.</p></div>`;
    return `<div class="spiritCard"><div class="row between"><b>${ p.name }</b><span class="badge">Vida ${ p.hp }/${ p.hpMax }</span></div><p>🛡 Defensa ${ p.defense } · ⚔ ${ p.attack }</p><p>${ p.effect }</p><p class="muted">${ p.usedFreeAction ? 'Su próxima acción este turno costará 1 acción del Chamán.' : 'Su próxima acción este turno es gratuita.' }</p><div class="row"><button data-spirit-dmg="${ x.shaman.spirits.indexOf(p) }">− Vida</button><button data-spirit-heal="${ x.shaman.spirits.indexOf(p) }">+ Vida</button><button data-spirit-turn="${ x.shaman.spirits.indexOf(p) }">Actuar (${ p.usedFreeAction ? '1 acción' : 'gratis' })</button></div></div>`;
  }).join('');
}
function shamanHtml(x) {
  const inFlow = x.flow.type === 'attack' || x.flow.type === 'defense';
  const blessings = [
    'fire',
    'water',
    'air',
    'nature'
  ].map(k => {
    let b = MD2.shamanBlessings[k], on = x.shaman.unlocked[k];
    return `<div class="blessingCard ${ on ? 'active' : '' }"><b>${ on ? '\u2726 ACTIVA \xB7 ' : '' }${ b.name }</b><p>${ b.effect }</p></div>`;
  }).join('');
  const elementsBlock = inFlow ? `<p class="notice">Estás en tu Turno (${ x.flow.type === 'attack' ? 'Ataque' : 'Defensa' }). Los controles de Elementos y Hechizos están disponibles ahí, en la pestaña Turno.</p>` : `<div class="resource"><p class="notice">Al inicio de tu turno, aumenta cualquier Elemento en 1.</p>${ shamanElementControls(x) }</div><h3>Hechizos disponibles</h3>${ shamanAbilityControls(x) }`;
  return `${ elementsBlock }<h3>Bendiciones permanentes</h3><div class="blessingGrid">${ blessings }</div><p class="notice">Revisa la pestaña Espíritus para ver y gestionar tus invocaciones.</p>`;
}
function classHtml(x) {
  if (x.cls === 'rogue')
    return `<div class="resource">Fichas en mano: <b>${ x.rogue.hand }</b> · Gastadas: ${ x.rogue.spent }<div class="row"><button id="rDraw">Robar ficha</button><button id="rSpend">Gastar ficha</button></div></div>`;
  if (x.cls === 'ranger')
    return `<div class="resource">El mazo de Flechas se resuelve físicamente: Rápido, Certero o Fallido.</div>`;
  if (x.cls === 'shaman')
    return shamanHtml(x);
  if (x.cls === 'paladin')
    return `<div class="resource">Consagraciones registradas: <b>${ x.paladin.consecrations }</b><div class="row"><button id="conAdd">Consagrar (−1 maná)</button><button id="conRem">Retirar</button></div><small>Comprueba LdV y que la zona no tenga otra Consagración.</small></div><label class="top">Habilidad bendecida<select id="blessed"><option value="">Ninguna</option>${ activeSkills(x).map(q => `<option ${ x.paladin.blessed === q.name ? 'selected' : '' }>${ q.name }</option>`).join('') }</select></label>`;
  if (x.cls === 'mage')
    return `<div class="talismanGrid">${ x.mage.slots.map((q, i) => `<div class="talismanSlot ${ i === x.mage.amulet ? 'active' : '' }"><b>Cara ${ i + 1 }${ i === x.mage.amulet ? ' · ACTIVA' : '' }</b><input data-slot="${ i }" value="${ q.name }"><small>Coste: ${ q.manaCost } maná · Tipo: ${ q.type }</small>${ i === x.mage.amulet ? `<button data-use-talisman="${ i }" ${ x.mana < q.manaCost ? 'disabled' : '' }>Usar capacidad</button>` : '' }</div>`).join('') }</div><button id="rotateTalisman" class="top" ${ x.mana < 1 ? 'disabled' : '' }>Girar forzado a la siguiente cara (1 maná)</button>`;
  const stances = {
    'Furia Sangrienta': 'Ataque: gasta 1 Furia para relanzar cualquier dado.',
    'Temerario': 'Movimiento: gasta 1 Furia para obtener +1 PM.',
    'Provocador': 'Defensa: gasta 1 Furia para infligir 1 Herida al atacante.'
  };
  return `<div class="resource">Furia: <b>${ x.berserker.fury }/7</b><div class="row"><button id="fDown">−</button><button id="fUp">+</button></div></div><label class="top">Postura (cambiar cuesta 1 Furia)<select id="stance"><option>Furia Sangrienta</option><option>Temerario</option><option>Provocador</option></select></label><div class="stanceGrid">${ Object.entries(stances).map(([name, desc]) => `<div class="passive ${ x.berserker.stance === name ? 'active' : '' }"><b>${ name }${ x.berserker.stance === name ? ' · ACTIVA' : '' }</b><br>${ desc }</div>`).join('') }</div>`;
}
function skillsHtml(x) {
  let html = '<div class="card"><h2>Elecciones</h2>';
  for (let n = 1; n <= x.level; n++) {
    let v = x.choices[n], locked = x.lockedChoices[n];
    if (locked)
      html += `<div class="skill skillLocked"><b>Nivel ${ n }</b><br>${ v }<div class="inventoryActions"><button data-undo="${ n }">Deshacer elección</button></div></div>`;
    else
      html += `<div class="choiceBox"><label>Nivel ${ n }<select data-choice="${ n }"><option value="">Seleccionar</option>${ skills(x).filter(q => q.level <= n).map(q => `<option value="${ q.name }" ${ v === q.name ? 'selected' : '' }>${ q.name }</option>`).join('') }</select></label><button data-confirm="${ n }" class="primary">Confirmar</button></div>`;
  }
  html += '</div><div class="card"><h2>Habilidades activas</h2>' + activeSkills(x).map(q => `<div class="skill">${ q.name }</div>`).join('') + '</div>';
  return html;
}
function missionTurnButton(x) {
  const m = getActiveMission();
  if (m && m.id === 'cursed_sword' && s.missionState.bearerId === x.id && !s.missionResult)
    return `<button id="destroyCrystalBtn" ${ x.actions < 1 ? 'disabled' : '' }>Destruir Cristal del Pecado</button>`;
  return '';
}
function actionsHtml(x) {
  return `<div class="card"><h2>Turno de ${ x.name }</h2><p class="notice">Acciones restantes: <b>${ x.actions }</b></p><div class="actions"><button id="moveAction">Movimiento</button><button id="attackAction">Ataque</button><button data-action="Recuperación">Recuperación</button><button data-action="Intercambiar y equipar">Intercambiar y equipar</button>${ missionTurnButton(x) }<button id="finishTurn" class="primary">Finalizar turno</button></div></div>${ flowHtml(x) }`;
}
function flowHtml(x) {
  if (!x.flow.type)
    return '<div class="card"><p class="notice">Selecciona una acción para iniciar su resolución guiada.</p></div>';
  if (x.flow.type === 'move')
    return moveFlow(x);
  if (x.flow.type === 'attack')
    return attackFlow(x);
  if (x.flow.type === 'Recuperación')
    return recoveryFlow(x);
  if (x.flow.type === 'Intercambiar y equipar')
    return swapEquipFlow(x);
  return `<div class="card"><p class="notice">${ x.flow.type } registrada.</p><button id="finishFlow">Finalizar acción</button></div>`;
}
function swapEquipFlow(x) {
  const m = getActiveMission();
  if (!m || m.id !== 'cursed_sword' || s.missionResult)
    return `<div class="card"><p class="notice">Intercambiar y equipar registrada.</p><button id="finishFlow" class="top">Finalizar acción</button></div>`;
  const bearer = s.heroes.find(h2 => h2.id === s.missionState.bearerId);
  let swordOption = '';
  if (bearer && bearer.id === x.id) {
    swordOption = `<label class="top">Pasar la Espada Maldita a<select id="swordPassTo"><option value="">Elige un héroe</option>${ s.heroes.filter(h2 => h2.id !== x.id && !h2.unconscious).map(h2 => `<option value="${ h2.id }">${ h2.name }</option>`).join('') }</select></label><button id="passSwordBtn" class="primary top">Confirmar intercambio de la espada</button>`;
  } else if (bearer && bearer.id !== x.id) {
    swordOption = `<button id="requestSwordBtn" class="primary top">Tomar la Espada Maldita de ${ bearer.name }</button>`;
  } else if (!bearer) {
    swordOption = `<label class="top">Recibir la Espada Maldita (nadie la porta)<select id="swordTakeFrom"><option value="${ x.id }">${ x.name } la toma</option></select></label><button id="passSwordBtn" class="primary top">Confirmar</button>`;
  }
  return `<div class="card"><p class="notice">Intercambiar y equipar registrada.</p>${ swordOption }<button id="finishFlow" class="top">Finalizar acción</button></div>`;
}
function recoveryFlow(x) {
  if (x.cls === 'shaman') {
    const r = x.flow.recovery = {
      hp: 0,
      mana: 0,
      fire: 0,
      water: 0,
      air: 0,
      nature: 0,
      ...(x.flow.recovery || {})
    };
    const remaining = 2 - r.hp - r.mana - r.fire - r.water - r.air - r.nature;
    const rows = [
      ['hp', 'Vida', '❤️'],
      ['mana', 'Maná', '🔷'],
      ['fire', 'Fuego', '🔥'],
      ['water', 'Agua', '💧'],
      ['air', 'Aire', '🌪️'],
      ['nature', 'Naturaleza', '🌿']
    ];
    return `<div class="card actionFlow active"><h2>Recuperación del Chamán</h2><p class="notice">Reparte 2 puntos como prefieras entre Vida, Maná o tus Elementos.</p><div class="grid top">${ rows.map(([key, label, icon]) => `<div class="elementRow"><span class="badge">${ icon } ${ label }: +${ r[key] || 0 }</span><button data-rec="${ key }" data-d="-1" ${ (r[key] || 0) <= 0 ? 'disabled' : '' }>−</button><button data-rec="${ key }" data-d="1" ${ remaining <= 0 || (['fire', 'water', 'air', 'nature'].includes(key) && x.shaman[key] + (r[key] || 0) >= 4) ? 'disabled' : '' }>+</button></div>` ).join('') }</div><p class="muted top">Puntos restantes por repartir: ${ remaining }</p><button id="confirmRecovery" class="primary top" ${ remaining !== 0 ? 'disabled' : '' }>Confirmar Recuperación</button></div>`;
  }
  const r = x.flow.recovery || { hp: 0, mana: 0 };
  const remaining = 2 - r.hp - r.mana;
  return `<div class="card actionFlow active"><h2>Recuperación</h2><p class="notice">Reparte 2 puntos entre Vida y Maná como prefieras.</p><div class="grid top"><div class="elementRow"><span class="badge">Vida: +${ r.hp }</span><button data-rec="hp" data-d="-1" ${ r.hp <= 0 ? 'disabled' : '' }>−</button><button data-rec="hp" data-d="1" ${ remaining <= 0 ? 'disabled' : '' }>+</button></div><div class="elementRow"><span class="badge">Maná: +${ r.mana }</span><button data-rec="mana" data-d="-1" ${ r.mana <= 0 ? 'disabled' : '' }>−</button><button data-rec="mana" data-d="1" ${ remaining <= 0 ? 'disabled' : '' }>+</button></div></div><p class="muted top">Puntos restantes por repartir: ${ remaining }</p><button id="confirmRecovery" class="primary top" ${ remaining !== 0 ? 'disabled' : '' }>Confirmar Recuperación</button></div>`;
}
function missionEscapeButton(x) {
  const m = getActiveMission();
  if (!m || s.missionResult)
    return '';
  if (m.id === 'road_to_hell' && s.missionState.gateLeft && s.missionState.gateRight)
    return `<button id="missionEscapeBtn" class="primary top" ${ x.move.pm < 1 ? 'disabled' : '' }>Escape de la mazmorra (1 PM)</button>`;
  if (m.id === 'the_step' && s.missionState.reachedRift)
    return `<button id="missionEscapeBtn" class="primary top" ${ x.move.pm < 1 ? 'disabled' : '' }>Salir por la Grieta (1 PM)</button>`;
  return '';
}
function missionInteractOptions(x) {
  const m = getActiveMission();
  if (m && m.id === 'demonic_artifact' && !s.missionResult)
    return `<button data-move="interact">Interactuar (genérico)</button><button id="collectFragmentBtn" ${ x.move.pm < 1 ? 'disabled' : '' }>Recoger fragmento de artefacto</button>`;
  return `<button data-move="interact">Interactuar</button>`;
}
function moveFlow(x) {
  const suggestion = berserkerStanceSuggestion(x, 'move');
  return `<div class="card actionFlow active"><h2>Movimiento</h2><div class="flowSteps"><span class="flowStep active">Gastar PM</span><span class="flowStep">Finalizar</span></div><p class="notice">PM disponibles: <b>${ x.move.pm }</b></p>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }<div class="actions"><button data-move="move">Mover 1 zona</button><button data-move="door">Abrir puerta</button>${ missionInteractOptions(x) }${ x.cls === 'berserker' && x.berserker.stance === 'Temerario' ? `<button id="furyExtraPm" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: +1 PM (${ x.berserker.fury }/7)</button>` : '' }<button id="finishMove" class="primary">Finalizar movimiento</button></div>${ missionEscapeButton(x) }</div>`;
}
function arrowFlow(x) {
  return `<div class="card actionFlow active"><h2>Mazo de Flechas</h2><p class="notice">Saca cartas del mazo de Flechas e indica el resultado obtenido.</p><div class="actions"><button data-arrow="rapido">Disparo rápido (menos de 7)</button><button data-arrow="certero">Disparo certero (7 justas)</button><button data-arrow="lento">Disparo lento o fallido (más de 7)</button></div></div>`;
}
function attackFlow(x) {
  const a = x.flow.attack || {};
  if (x.cls === 'ranger' && !x.flow.arrowResult)
    return arrowFlow(x);
  const suggestion = berserkerStanceSuggestion(x, 'attack');
  return `<div class="card actionFlow active"><h2>Ataque</h2><button id="repeatAttackSteps" class="top">🔊 Repetir pasos</button><ol class="notice top"><li>Arma tu reserva de dados según tu tipo de ataque.</li><li>Lanza físicamente los dados.</li><li>Revisa habilidades y efectos disponibles.</li><li>Marca el resultado del ataque y confirma.</li></ol><div class="resultBox">${ attackReminders(x) }</div>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }${ x.cls === 'berserker' && x.berserker.stance === 'Furia Sangrienta' ? `<button id="furyReroll" class="top" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: relanzar un dado (${ x.berserker.fury }/7)</button>` : '' }<label class="top">Resultado del ataque (puedes marcar varias)<select id="attackResult" multiple size="5"><option value="m1">1 secuaz eliminado</option><option value="m2">2 secuaces eliminados</option><option value="m3">3 secuaces eliminados</option><option value="leader">Líder eliminado</option><option value="roamer">Errante eliminado</option></select></label><button id="attackCalc" class="primary top">Ataque resuelto</button></div>`;
}
function berserkerStanceSuggestion(x, action) {
  if (x.cls !== 'berserker' || x.berserker.fury < 1)
    return null;
  const map = {
    attack: 'Furia Sangrienta',
    move: 'Temerario',
    defense: 'Provocador'
  };
  const wanted = map[action];
  if (!wanted || x.berserker.stance === wanted)
    return null;
  return { stance: wanted, label: `¿Cambiar a la postura ${ wanted } para potenciar esta acción? (cuesta 1 Furia)` };
}
function shamanElementControls(x, boostMode = false) {
  return [
    'fire',
    'water',
    'air',
    'nature'
  ].map(k => boostMode ? `<div class="elementRow"><span class="badge">${ MD2.shamanElements[k] } ${ x.shaman[k] }/4</span><button data-boost-el="${ k }" class="primary">Elegir este</button></div>` : `<div class="elementRow ${ x.shaman[k] === 4 && !x.shaman.unlocked[k] ? 'elementMax' : '' }"><span class="badge">${ MD2.shamanElements[k] } ${ x.shaman[k] }/4</span><button data-el="${ k }" data-d="-1">−</button><button data-el="${ k }" data-d="1">+</button><button data-max="${ k }">Máx.</button><button data-use="${ k }" ${ x.shaman.unlocked[k] || x.shaman[k] < 4 ? 'disabled' : '' }>${ x.shaman.unlocked[k] ? 'Activa' : x.shaman[k] === 4 ? 'Consumir' : 'Requiere 4' }</button></div>`).join('');
}
function shamanAbilityControls(x, kindFilter) {
  return shamanKnownAbilities(x).filter(a => !kindFilter || a.kind === kindFilter).map(a => {
    let can = shamanCanPay(x, a.cost);
    return `<div class="shamanAbility ${ can ? 'available' : 'unavailable' }"><div class="row between"><b>${ a.name || a.key }</b><span>${ can ? 'Disponible' : 'Faltan elementos' }</span></div><small>Coste: ${ shamanCostText(a.cost) }</small><p>${ a.effect }</p><button data-shaman-cast="${ a.key }" ${ can ? '' : 'disabled' }>${ a.kind === 'summon' ? 'Invocar y consumir' : 'Usar y consumir' }</button></div>`;
  }).join('');
}
function attackReminders(x) {
  let arr = [];
  if (x.zone === 'dark')
    arr.push('Añade el dado de Oscuridad y aplica Sombras.');
  if (x.cls === 'shaman') {
    if (x.shaman.unlocked.fire)
      arr.push('Bendición de Fuego activa: añade 1 dado amarillo.');
    if (x.shaman.unlocked.water)
      arr.push('Bendición de Agua activa: después del ataque puedes mover al defensor 1 Zona.');
    if (x.shaman.spirits.length)
      arr.push(`Invocaciones activas: ${ x.shaman.spirits.map(p => p.name).join(', ') }.`);
  } else
    activeSkills(x).forEach(q => arr.push(`Habilidad activa: ${ q.name }.`));
  arr.push(`Habilidad propia: ${ C[x.cls].ability }`);
  if (greyRerollReminder())
    arr.push(greyRerollReminder());
  let html = '<ol>' + arr.map(q => `<li>${ q }</li>`).join('') + '</ol>';
  if (x.cls === 'shaman') {
    const attackAbilities = shamanAbilityControls(x, 'attack');
    html += `<div class="resource top">${ shamanElementControls(x) }</div>${ attackAbilities ? `<h3>Hechizos de ataque disponibles</h3>${ attackAbilities }` : '' }`;
  }
  return html;
}
function inventoryHtml(x) {
  return `<div class="card"><h2>Registrar objeto</h2><div class="grid"><label>Nombre<input id="itemName"></label><label>Destino<select id="itemDest"><option value="equip">Equipar ahora</option><option value="inventory">Guardar</option></select></label></div><button id="addItem" class="top">Registrar</button></div><div class="card"><h2>Equipo e inventario</h2><div id="inventoryList">${ inventoryRows(x) }</div></div>`;
}
function inventoryRows(x) {
  let r = [];
  x.equipped.forEach((q, i) => r.push(`<div class="inventoryItem"><b>Equipado:</b> ${ q }<div class="inventoryActions"><button data-store="${ i }">Guardar</button><button data-delete-e="${ i }">Eliminar</button></div></div>`));
  x.inventory.forEach((q, i) => r.push(`<div class="inventoryItem"><b>Inventario:</b> ${ q }<div class="inventoryActions"><button data-equip="${ i }">Equipar</button><button data-delete-i="${ i }">Consumir/Eliminar</button></div></div>`));
  return r.join('') || '<p class="muted">Sin objetos.</p>';
}
function bindHero() {
  const x = h();
  if ($('addStatus'))
    $('addStatus').onclick = () => {
      const st = $('statusPicker').value;
      if (!x.statuses.includes(st)) {
        x.statuses.push(st);
        log(`${ x.name } recibe el estado ${ st }.`);
        save();
        renderHero();
        say(`${ heroSpoken(x) } recibe el estado ${ st }.`, x);
      }
    };
  document.querySelectorAll('[data-remove-status]').forEach(b => b.onclick = () => {
    const st = x.statuses.splice(+b.dataset.removeStatus, 1)[0];
    log(`${ x.name } elimina el estado ${ st }.`);
    save();
    renderHero();
  });
  $('hpDown').onclick = () => {
    x.hp = Math.max(0, x.hp - 1);
    if (x.hp === 0 && !x.unconscious)
      knockOut(x);
    if (x.cls === 'berserker' && x.berserker.fury < 7) {
      x.berserker.fury++;
      log(`${ x.name } gana 1 punto de Furia por recibir 1 herida. Furia: ${ x.berserker.fury }/7.`);
    }
    save();
    renderHero();
    showFloatNumber(-1, 'dmg');
  };
  $('hpUp').onclick = () => {
    if (x.unconscious)
      return alert('Un héroe inconsciente solo revive mediante una ficha de Resurrección.');
    x.hp = Math.min(x.hpMax, x.hp + 1);
    save();
    renderHero();
    showFloatNumber(1, 'heal');
  };
  $('manaDown').onclick = () => {
    x.mana = Math.max(0, x.mana - 1);
    save();
    renderHero();
  };
  $('manaUp').onclick = () => {
    const askElement = () => {
      const el = prompt('¿Qué elemento aumentas? Escribe: fuego, agua, aire o naturaleza', 'fuego');
      const map = { fuego: 'fire', agua: 'water', aire: 'air', naturaleza: 'nature' };
      const key = map[(el || '').toLowerCase().trim()];
      if (!key)
        return alert('Elemento no reconocido. Inténtalo de nuevo desde el botón + Maná.');
      x.shaman[key] = Math.min(4, x.shaman[key] + 1);
      log(`${ x.name } convierte 1 maná en +1 ${ MD2.shamanElements[key] } (${ x.shaman[key] }/4).`);
      save();
      renderHero();
      say(`Elemento ${ MD2.shamanElements[key] } aumenta en 1.`);
    };
    if (x.cls === 'shaman') {
      if (x.mana >= x.manaMax)
        return askElement();
      if (confirm('¿Quieres usar este punto para aumentar 1 Elemento en vez de recuperar maná?'))
        return askElement();
    }
    x.mana = Math.min(x.manaMax, x.mana + 1);
    save();
    renderHero();
  };
  $('xpDown').onclick = () => {
    x.xp = Math.max(0, x.xp - 1);
    log(`${ x.name } pierde 1 XP (ajuste manual).`);
    save();
    renderHero();
  };
  $('xpUp').onclick = () => {
    x.xp++;
    log(`${ x.name } gana 1 XP (ajuste manual).`);
    save();
    renderHero();
  };
  $('toggleZone').onclick = () => {
    x.zone = x.zone === 'dark' ? 'light' : 'dark';
    save();
    renderHero();
    if (x.zone === 'dark')
      say('Estás en oscuridad. No olvides el dado de Oscuridad y la habilidad de Sombras.');
  };
  document.querySelectorAll('[data-choice]').forEach(q => q.onchange = () => {
    x.choices[+q.dataset.choice] = q.value || null;
    save();
  });
  document.querySelectorAll('[data-confirm]').forEach(b => b.onclick = () => {
    let n = +b.dataset.confirm, v = x.choices[n];
    if (!v)
      return alert('Selecciona una habilidad.');
    if (!confirm(`¿Confirmas ${ v }? La elección será permanente y solo podrá cambiarse con Deshacer.`))
      return;
    if (x.cls === 'mage' && (n === 1 || n === 5)) {
      const options = x.mage.slots.map((slot, i) => `Cara ${ i + 1 }: ${ slot.name }`).join('\n');
      let choice = prompt(`${ v } reemplaza una cara del Talismán. Escribe el número de la cara a reemplazar (1-4):\n${ options }`, '1');
      let idx = parseInt(choice, 10) - 1;
      while (isNaN(idx) || idx < 0 || idx > 3) {
        choice = prompt(`Número no válido. Escribe 1, 2, 3 o 4:\n${ options }`, '1');
        if (choice === null) {
          idx = 0;
          break;
        }
        idx = parseInt(choice, 10) - 1;
      }
      let manaChoice = prompt(`¿Cuánto maná cuesta usar ${ v }?`, '1');
      let manaCost = parseInt(manaChoice, 10);
      while (isNaN(manaCost) || manaCost < 0) {
        manaChoice = prompt('Escribe un número válido de maná (0 o más):', '1');
        if (manaChoice === null) {
          manaCost = 1;
          break;
        }
        manaCost = parseInt(manaChoice, 10);
      }
      let typeChoice = prompt(`¿${ v } es de tipo Ataque, Defensa, Combate, Curación o Movimiento? Escribe una: ataque / defensa / combate / curacion / movimiento`, 'ataque');
      const validTypes = [
        'ataque',
        'defensa',
        'combate',
        'curacion',
        'movimiento'
      ];
      let type = (typeChoice || '').toLowerCase().trim();
      while (!validTypes.includes(type)) {
        typeChoice = prompt('Escribe exactamente una de estas opciones: ataque / defensa / combate / curacion / movimiento', 'ataque');
        if (typeChoice === null) {
          type = 'ataque';
          break;
        }
        type = (typeChoice || '').toLowerCase().trim();
      }
      const oldFace = x.mage.slots[idx];
      x.mage.slots[idx] = {
        name: v,
        manaCost,
        type
      };
      log(`${ x.name } reemplaza la Cara ${ idx + 1 } del Talismán (${ oldFace.name }) por ${ v } (coste ${ manaCost } maná, tipo ${ type }).`);
    }
    x.lockedChoices[n] = true;
    log(`Habilidad bloqueada: ${ v }.`);
    save();
    renderHero();
    if (s.phase === 2)
      continueLevelQueueAfterSkill();
    else
      advancePending();
    say(`Habilidad ${ v } confirmada.`, x);
  });
  document.querySelectorAll('[data-undo]').forEach(b => b.onclick = () => {
    let n = +b.dataset.undo;
    if (confirm('\xBFDeshacer esta elección?')) {
      x.lockedChoices[n] = false;
      x.choices[n] = null;
      save();
      renderHero();
    }
  });
  bindClass(x);
  $('moveAction').onclick = () => startAction('move');
  $('attackAction').onclick = () => startAction('attack');
  document.querySelectorAll('[data-action]').forEach(b => b.onclick = () => startAction(b.dataset.action));
  $('finishTurn').onclick = () => {
    x.actions = 0;
    finishFlow(true);
  };
  bindFlow(x);
  bindInventory(x);
}
function bindClass(x) {
  if (x.cls === 'rogue') {
    $('rDraw').onclick = () => {
      x.rogue.hand++;
      x.actions++;
      save();
      renderHero();
    };
    $('rSpend').onclick = () => {
      if (!x.rogue.hand)
        return;
      x.rogue.hand--;
      x.rogue.spent++;
      save();
      renderHero();
    };
  }
  if (x.cls === 'shaman') {
    document.querySelectorAll('[data-el]').forEach(b => b.onclick = () => {
      let k = b.dataset.el;
      x.shaman[k] = Math.max(0, Math.min(4, x.shaman[k] + +b.dataset.d));
      save();
      renderHero();
    });
    document.querySelectorAll('[data-max]').forEach(b => b.onclick = () => {
      x.shaman[b.dataset.max] = 4;
      save();
      renderHero();
      say(`${ MD2.shamanElements[b.dataset.max] } ha alcanzado el máximo. Puedes consumirlo para activar su Bendición permanente.`, x);
    });
    document.querySelectorAll('[data-use]').forEach(b => b.onclick = () => {
      let k = b.dataset.use;
      if (x.shaman[k] < 4)
        return alert('El elemento debe estar al máximo.');
      if (x.shaman.unlocked[k])
        return;
      x.shaman[k] = 0;
      x.shaman.unlocked[k] = true;
      let bl = MD2.shamanBlessings[k];
      save();
      renderHero();
      say(`${ bl.name } activada permanentemente. ${ bl.effect }`, x);
    });
    document.querySelectorAll('[data-shaman-cast]').forEach(b => b.onclick = () => {
      let key = b.dataset.shamanCast, a = MD2.shamanAbilities[key];
      if (!a || !shamanCanPay(x, a.cost))
        return alert('No tienes elementos suficientes.');
      if (!confirm(`¿Usar ${ a.name || key } y gastar ${ shamanCostText(a.cost) }?`))
        return;
      shamanPay(x, a.cost);
      if (a.kind === 'summon') {
        let d = MD2.shamanSpirits[a.spirit], family = a.spirit.replace(/[0-9]+$/, '');
        x.shaman.spirits = x.shaman.spirits.filter(p => !p.type.startsWith(family));
        x.shaman.spirits.push({
          type: a.spirit,
          name: d.name,
          hp: d.hp,
          hpMax: d.hp + (x.shaman.unlocked.nature ? 1 : 0),
          defense: d.defense,
          attack: d.attack,
          effect: d.effect,
          usedFreeAction: false,
          defeated: false
        });
        x.shaman.spirits[x.shaman.spirits.length - 1].hp = x.shaman.spirits[x.shaman.spirits.length - 1].hpMax;
        say(`${ d.name } invocado en tu Zona. ${ a.effect }`, x);
      } else
        say(`${ a.name || key } utilizada. ${ a.effect }`, x);
      save();
      renderHero();
    });
    document.querySelectorAll('[data-spirit-dmg]').forEach(b => b.onclick = () => {
      let p = x.shaman.spirits[+b.dataset.spiritDmg];
      p.hp = Math.max(0, p.hp - 1);
      if (p.hp === 0 && !p.defeated) {
        p.defeated = true;
        log(`${ p.name } ha sido derrotado. Invócalo de nuevo para reactivarlo.`);
        say(`${ p.name } ha sido derrotado. Invócalo de nuevo para reactivarlo.`, x);
      }
      save();
      renderHero();
    });
    document.querySelectorAll('[data-spirit-heal]').forEach(b => b.onclick = () => {
      let p = x.shaman.spirits[+b.dataset.spiritHeal];
      if (p.defeated)
        return;
      p.hp = Math.min(p.hpMax, p.hp + 1);
      save();
      renderHero();
    });
    document.querySelectorAll('[data-spirit-turn]').forEach(b => b.onclick = () => {
      let p = x.shaman.spirits[+b.dataset.spiritTurn];
      if (p.defeated)
        return;
      if (!p.usedFreeAction) {
        p.usedFreeAction = true;
        log(`${ p.name } actúa gratis (primera acción del turno).`);
        say(`${ p.name } actúa. Ataca con ${ p.attack }. ${ p.effect } Esta acción fue gratuita.`, x);
        save();
        renderHero();
        return;
      }
      if (x.actions < 1)
        return alert('No te quedan acciones para hacer actuar de nuevo al Espíritu.');
      if (!confirm(`¿Gastar 1 acción de ${ x.name } para que ${ p.name } actúe de nuevo este turno?`))
        return;
      x.actions--;
      log(`${ x.name } gasta 1 acción para que ${ p.name } actúe de nuevo.`);
      say(`${ p.name } actúa de nuevo. Ataca con ${ p.attack }. ${ p.effect } Esto costó 1 acción.`, x);
      save();
      renderHero();
    });
  }
  if (x.cls === 'paladin') {
    $('conAdd').onclick = () => {
      if (x.mana < 1)
        return alert('Necesitas 1 maná');
      x.mana--;
      x.paladin.consecrations++;
      save();
      renderHero();
      say('Gastas 1 maná para consagrar. Comprueba la línea de visión y que la zona no tenga otra Consagración.');
    };
    $('conRem').onclick = () => {
      x.paladin.consecrations = Math.max(0, x.paladin.consecrations - 1);
      save();
      renderHero();
    };
    $('blessed').onchange = e => {
      x.paladin.blessed = e.target.value;
      save();
      if (e.target.value)
        say(`Has bendecido ${ e.target.value } hasta el final de la ronda.`);
    };
  }
  if (x.cls === 'mage') {
    document.querySelectorAll('[data-slot]').forEach(inp => inp.onchange = () => {
      x.mage.slots[+inp.dataset.slot].name = inp.value || 'Vacío';
      save();
    });
    document.querySelectorAll('[data-use-talisman]').forEach(b => b.onclick = () => {
      const i = +b.dataset.useTalisman, face = x.mage.slots[i];
      if (x.mana < face.manaCost)
        return alert('No tienes maná suficiente para usar esta capacidad.');
      if (!confirm(`¿Usar ${ face.name }? Cuesta ${ face.manaCost } maná y el Talismán girará a la siguiente cara.`))
        return;
      x.mana -= face.manaCost;
      log(`${ x.name } usa ${ face.name } (Cara ${ i + 1 }), gasta ${ face.manaCost } maná.`);
      x.mage.amulet = (x.mage.amulet + 1) % 4;
      const nextFace = x.mage.slots[x.mage.amulet];
      save();
      renderHero();
      say(`${ face.name }. ${ face.type === 'ataque' ? 'Recuerda que necesitas un arma con alcance mágico equipada para usar hechizos de ataque. ' : '' }El Talismán gira. Cara activa ahora: ${ nextFace.name }.`);
    });
    $('rotateTalisman').onclick = () => {
      if (x.mana < 1)
        return alert('No tienes maná suficiente para girar el Talismán.');
      if (!confirm('¿Gastar 1 maná para girar el Talismán a la siguiente cara?'))
        return;
      x.mana--;
      x.mage.amulet = (x.mage.amulet + 1) % 4;
      let a = x.mage.slots[x.mage.amulet];
      log(`${ x.name } gasta 1 maná para girar el Talismán.`);
      save();
      renderHero();
      say(`Talismán girado. Activa: ${ a.name }.`);
    };
  }
  if (x.cls === 'berserker') {
    $('fDown').onclick = () => {
      x.berserker.fury = Math.max(0, x.berserker.fury - 1);
      save();
      renderHero();
    };
    $('fUp').onclick = () => {
      x.berserker.fury = Math.min(7, x.berserker.fury + 1);
      save();
      renderHero();
    };
    $('stance').value = x.berserker.stance;
    $('stance').onchange = e => {
      const newStance = e.target.value;
      if (newStance === x.berserker.stance) {
        return;
      }
      if (x.berserker.fury < 1) {
        alert('No tienes Furia suficiente para cambiar de postura.');
        e.target.value = x.berserker.stance;
        return;
      }
      if (!confirm(`¿Gastar 1 Furia para cambiar a la postura ${ newStance }?`)) {
        e.target.value = x.berserker.stance;
        return;
      }
      x.berserker.fury--;
      x.berserker.stance = newStance;
      log(`${ x.name } gasta 1 Furia para cambiar a la postura ${ newStance }.`);
      save();
      renderHero();
      say(`Cambia a la postura ${ newStance }.`);
    };
  }
}
function bindFlow(x) {
  document.querySelectorAll('[data-arrow]').forEach(b => b.onclick = () => {
    const r = b.dataset.arrow;
    const label = r === 'certero' ? 'Disparo certero' : r === 'rapido' ? 'Disparo rápido' : 'Disparo lento o fallido';
    x.flow.arrowResult = r;
    log(`${ x.name } saca cartas del mazo de Flechas: ${ label }.`);
    save();
    renderHero();
    duckAndSay(`${ label }. Ahora forma tu reserva de dados.`);
  });
  document.querySelectorAll('[data-move]').forEach(b => b.onclick = () => useMove(b.dataset.move));
  bindMissionButtons(x);
  if ($('passSwordBtn'))
    $('passSwordBtn').onclick = () => {
      const selectEl = $('swordPassTo') || $('swordTakeFrom');
      const targetId = selectEl.value;
      if (!targetId)
        return alert('Elige a qué héroe le pasas la espada.');
      const target = s.heroes.find(h2 => h2.id == targetId);
      if (target.id !== x.id && !confirm(`Confirma que ${ x.name } y ${ target.name } se encuentran en la misma casilla.`))
        return;
      s.missionState.bearerId = target.id;
      s.missionState.roundsHeld = 0;
      log(`${ x.name } pasa la Espada Maldita a ${ target.name }. El contador de rondas se reinicia.`);
      save();
      renderHero();
      renderMissions();
      say(`La Espada Maldita pasa a ${ target.name }. El contador de rondas se reinicia a cero.`);
    };
  if ($('requestSwordBtn'))
    $('requestSwordBtn').onclick = () => {
      const bearer = s.heroes.find(h2 => h2.id === s.missionState.bearerId);
      if (!bearer)
        return;
      if (!confirm(`Confirma que ${ x.name } y ${ bearer.name } se encuentran en la misma casilla.`))
        return;
      s.missionState.bearerId = x.id;
      s.missionState.roundsHeld = 0;
      log(`${ x.name } toma la Espada Maldita de ${ bearer.name }. El contador de rondas se reinicia.`);
      save();
      renderHero();
      renderMissions();
      say(`La Espada Maldita pasa a ${ x.name }. El contador de rondas se reinicia a cero.`);
    };
  if ($('furyExtraPm'))
    $('furyExtraPm').onclick = () => {
      if (x.berserker.fury < 1)
        return;
      if (!confirm('¿Gastar 1 Furia para obtener +1 PM?'))
        return;
      x.berserker.fury--;
      x.move.pm++;
      log(`${ x.name } gasta 1 Furia (Temerario) para obtener +1 PM.`);
      save();
      renderHero();
      say('Ganas 1 punto de movimiento adicional.');
    };
  if ($('finishMove'))
    $('finishMove').onclick = finishFlow;
  if ($('finishFlow'))
    $('finishFlow').onclick = finishFlow;
  document.querySelectorAll('[data-rec]').forEach(b => b.onclick = () => {
    const isShaman = x.cls === 'shaman';
    x.flow.recovery = isShaman ? {
      hp: 0,
      mana: 0,
      fire: 0,
      water: 0,
      air: 0,
      nature: 0,
      ...(x.flow.recovery || {})
    } : {
      hp: 0,
      mana: 0,
      ...(x.flow.recovery || {})
    };
    const field = b.dataset.rec, d = +b.dataset.d, r = x.flow.recovery;
    const keys = isShaman ? [
      'hp',
      'mana',
      'fire',
      'water',
      'air',
      'nature'
    ] : [
      'hp',
      'mana'
    ];
    const remaining = 2 - keys.reduce((sum, k) => sum + (r[k] || 0), 0);
    if (d > 0 && remaining <= 0)
      return;
    if (d < 0 && (r[field] || 0) <= 0)
      return;
    if (d > 0 && ['fire', 'water', 'air', 'nature'].includes(field) && x.shaman[field] + (r[field] || 0) >= 4)
      return;
    r[field] = (r[field] || 0) + d;
    save();
    renderHero();
  });
  if ($('confirmRecovery'))
    $('confirmRecovery').onclick = () => {
      const r = x.flow.recovery || { hp: 0, mana: 0 };
      const elementKeys = { fire: 'Fuego', water: 'Agua', air: 'Aire', nature: 'Naturaleza' };
      const total = (r.hp || 0) + (r.mana || 0) + Object.keys(elementKeys).reduce((s2, k) => s2 + (r[k] || 0), 0);
      if (total !== 2)
        return;
      const parts = [];
      if (r.hp) {
        x.hp = Math.min(x.hpMax, x.hp + r.hp);
        parts.push(`+${ r.hp } Vida`);
      }
      if (r.mana) {
        x.mana = Math.min(x.manaMax, x.mana + r.mana);
        parts.push(`+${ r.mana } Maná`);
      }
      Object.entries(elementKeys).forEach(([key, label]) => {
        if (r[key]) {
          x.shaman[key] = Math.min(4, x.shaman[key] + r[key]);
          parts.push(`+${ r[key] } ${ label }`);
        }
      });
      log(`${ x.name } se recupera: ${ parts.join(', ') || 'sin cambios' }.`);
      say(`Recuperación: ${ parts.join(', ') }.`);
      finishFlow(true);
    };
  if ($('repeatAttackSteps'))
    $('repeatAttackSteps').onclick = () => duckAndSay('Pasos del ataque: primero arma tu reserva de dados y elige el objetivo. Segundo, lanza físicamente los dados. Tercero, revisa habilidades y efectos disponibles. Cuarto, marca el resultado del ataque y confirma.');
  if ($('berserkerStanceSuggest'))
    $('berserkerStanceSuggest').onclick = () => {
      const suggestion = berserkerStanceSuggestion(x, x.flow.type);
      if (!suggestion || x.berserker.fury < 1)
        return;
      if (!confirm(`¿Gastar 1 Furia para cambiar a la postura ${ suggestion.stance }?`))
        return;
      x.berserker.fury--;
      x.berserker.stance = suggestion.stance;
      log(`${ x.name } gasta 1 Furia para cambiar a la postura ${ suggestion.stance }.`);
      save();
      renderHero();
      say(`Cambia a la postura ${ suggestion.stance }.`);
    };
  if ($('furyReroll'))
    $('furyReroll').onclick = () => {
      if (x.berserker.fury < 1)
        return;
      if (!confirm('¿Gastar 1 Furia para relanzar un dado?'))
        return;
      x.berserker.fury--;
      log(`${ x.name } gasta 1 Furia (Furia Sangrienta) para relanzar un dado.`);
      save();
      renderHero();
      say('Relanza el dado que elijas.');
    };
  if ($('attackCalc'))
    $('attackCalc').onclick = () => {
      let a = x.flow.attack = x.flow.attack || {};
      const selected = Array.from($('attackResult').selectedOptions).map(o => o.value);
      a.killedMinions = selected.includes('m3') ? 3 : selected.includes('m2') ? 2 : selected.includes('m1') ? 1 : 0;
      a.leaderDamage = selected.includes('leader') ? 1 : 0;
      a.killedRoamer = selected.includes('roamer') ? 1 : 0;
      let xpMsgs = [];
      if (a.killedMinions > 0) {
        x.xp += a.killedMinions;
        log(`${ x.name } gana ${ a.killedMinions } XP por eliminar ${ a.killedMinions } secuaz${ a.killedMinions > 1 ? 'ces' : '' }.`);
        xpMsgs.push(`Ganas ${ a.killedMinions } de experiencia por secuaces.`);
      }
      if (a.leaderDamage > 0) {
        s.heroes.forEach(q => q.xp += 2);
        log('Líder eliminado. Todo el grupo gana 2 XP.');
        xpMsgs.push('El grupo gana 2 de experiencia por el líder eliminado.');
      }
      if (a.killedRoamer > 0) {
        s.heroes.forEach(q => q.xp += 4);
        log('Monstruo errante eliminado. Todo el grupo gana 4 XP.');
        xpMsgs.push('El grupo gana 4 de experiencia por el errante eliminado.');
      }
      log('Ataque resuelto.');
      duckAndSay(`Ataque resuelto. ${ xpMsgs.length ? xpMsgs.join(' ') : 'Sin eliminaciones registradas.' }`);
      finishFlow(true);
    };
}
function bindInventory(x) {
  $('addItem').onclick = () => {
    let n = $('itemName').value.trim();
    if (!n)
      return;
    ($('itemDest').value === 'equip' ? x.equipped : x.inventory).push(n);
    save();
    renderHero();
  };
  document.querySelectorAll('[data-store]').forEach(b => b.onclick = () => {
    let q = x.equipped.splice(+b.dataset.store, 1)[0];
    x.inventory.push(q);
    save();
    renderHero();
  });
  document.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => {
    let q = x.inventory.splice(+b.dataset.equip, 1)[0];
    x.equipped.push(q);
    save();
    renderHero();
  });
  document.querySelectorAll('[data-delete-e]').forEach(b => b.onclick = () => {
    if (confirm('\xBFEliminar objeto?')) {
      x.equipped.splice(+b.dataset.deleteE, 1);
      save();
      renderHero();
    }
  });
  document.querySelectorAll('[data-delete-i]').forEach(b => b.onclick = () => {
    if (confirm('\xBFConsumir o eliminar objeto?')) {
      x.inventory.splice(+b.dataset.deleteI, 1);
      save();
      renderHero();
    }
  });
}
function startHeroTurn(x) {
  if (x.cls === 'shaman') {
    x.shaman.elementBoostDone = false;
    x.shaman.spirits.forEach(p => p.usedFreeAction = false);
  }
}
function advancePending() {
  let i = s.heroes.findIndex(q => pending(q));
  if (i >= 0) {
    s.active = i;
    save();
    render();
    tab('hero');
    setTimeout(() => document.querySelector('[data-sec="skills"]').click(), 30);
    say(`${ s.heroes[i].name } escoge habilidad.`);
  } else {
    save();
    render();
    tab('hero');
    say('Comienza la partida.');
  }
}
function startAction(type) {
  const x = h();
  if (x.unconscious)
    return alert('Este héroe está inconsciente y no puede realizar acciones.');
  if (x.exitedMap)
    return alert(`${ x.name } ya salió de la mazmorra y no participa más en esta partida.`);
  if (x.turnDone)
    return alert(`${ x.name } ya jugó su turno en esta ronda. Elige otro héroe.`);
  if (pending(x))
    return alert('Debes confirmar la habilidad pendiente.');
  if (s.phase !== 0)
    return alert('Solo durante la Fase de Héroes.');
  if ([
      'move',
      'attack',
      'Recuperación',
      'Intercambiar y equipar'
    ].includes(type)) {
    if (x.actions <= 0)
      return alert('No quedan acciones.');
    if (x.cls === 'rogue') {
      if (!x.rogue.hand)
        return alert('No quedan fichas.');
      if (!confirm(`¿Gastar una ficha para ${ type }?`))
        return;
      x.rogue.hand--;
      x.rogue.spent++;
    }
    x.actions--;
  }
  x.flow = {
    type,
    step: 1,
    attack: {},
    defense: {},
    recovery: { hp: 0, mana: 0 }
  };
  if (type === 'move')
    x.move = {
      on: true,
      pm: (x.cls === 'ranger' ? 3 : 2) + (x.cls === 'shaman' && x.shaman.unlocked.air ? 1 : 0)
    };
  if (type === 'attack' && x.cls === 'ranger')
    x.flow.arrowResult = null;
  if (type === 'attack')
    playAttackSong();
  save();
  renderHero();
  setTimeout(() => document.querySelector('.actionFlow')?.scrollIntoView({ behavior: 'smooth' }), 30);
  const baseAnnouncement = `Héroe activo ${ heroSpoken(x) }. ${ type === 'move' ? 'Movimiento' : type === 'attack' ? 'Ataque' : type === 'defense' ? 'Defensa' : type }. ${ x.actions } acciones restantes.${ x.cls === 'shaman' && type === 'attack' ? ' Revisa tus Bendiciones y las habilidades del Chamán disponibles según tus elementos.' : '' }${ x.cls === 'ranger' && type === 'attack' ? ' Explorador, saca cartas del mazo de Flechas e indícame el resultado.' : '' }`;
  if (type === 'attack' && x.cls !== 'ranger') {
    duckAndSay(baseAnnouncement);
    if (s.voice === 'yes' && confirm('¿Quieres que el asistente de voz lea los pasos del ataque?'))
      duckAndSay('Pasos del ataque: primero arma tu reserva de dados y elige el objetivo. Segundo, lanza físicamente los dados. Tercero, revisa habilidades y efectos disponibles. Cuarto, marca el resultado del ataque y confirma.');
    return;
  }
  duckAndSay(baseAnnouncement);
}
function useMove(k) {
  const x = h();
  if (!x.move.on || !x.move.pm)
    return;
  x.move.pm--;
  log(k === 'move' ? 'Se movió una zona.' : k === 'door' ? 'Abrió una puerta.' : 'Interactuó.');
  if (!x.move.pm)
    x.move.on = false;
  save();
  renderHero();
  say(`Quedan ${ x.move.pm } puntos de movimiento.`);
}
function checkMissionExitVictory() {
  const available = s.heroes.filter(q => !q.unconscious);
  if (available.length > 0 && available.every(q => q.exitedMap)) {
    s.missionResult = 'victory';
    save();
    tab('missions');
    renderMissions();
    duckAndSay('Todos los héroes han salido de la mazmorra. La misión termina en victoria.');
    return true;
  }
  return false;
}
function bindMissionButtons(x) {
  const escapeBtn = document.getElementById('missionEscapeBtn');
  if (escapeBtn)
    escapeBtn.onclick = () => {
      const m = getActiveMission();
      const zoneLabel = m.id === 'road_to_hell' ? 'la zona del Altar' : 'la zona de la Grieta';
      if (x.move.pm < 1)
        return alert('No tienes puntos de movimiento disponibles para esta acción.');
      if (!confirm(`Confirma que ${ x.name } se encuentra en ${ zoneLabel } y quieres gastar 1 punto de movimiento para salir de la mazmorra. ${ x.name } dejará de participar en la partida.`))
        return;
      x.move.pm--;
      x.exitedMap = true;
      x.turnDone = true;
      x.actions = 0;
      x.flow = {
        type: null,
        step: 0,
        attack: {},
        defense: {}
      };
      x.move = {
        on: false,
        pm: 0
      };
      log(`${ x.name } sale de la mazmorra por ${ zoneLabel } y queda fuera del mapa.`);
      save();
      if (checkMissionExitVictory())
        return;
      renderHero();
      say(`${ x.name } sale de la mazmorra.`);
    };
  const fragBtn = document.getElementById('collectFragmentBtn');
  if (fragBtn)
    fragBtn.onclick = () => {
      if (x.move.pm < 1)
        return alert('No tienes puntos de movimiento disponibles para esta acción.');
      const st = s.missionState;
      const total = Object.values(st.fragments || {}).reduce((a, b) => a + b, 0);
      if (total >= 3)
        return alert('Ya se recolectaron los 3 fragmentos del Artefacto.');
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de un Fragmento del Artefacto.`))
        return;
      x.move.pm--;
      if (!x.move.pm)
        x.move.on = false;
      st.fragments = st.fragments || {};
      st.fragments[x.id] = (st.fragments[x.id] || 0) + 1;
      x.xp += 5;
      log(`${ x.name } recoge un Fragmento del Artefacto. Gana 5 XP.`);
      save();
      renderHero();
      renderMissions();
      say(`${ x.name } recoge un fragmento. Gana 5 de experiencia.`);
    };
  const crystalBtn = document.getElementById('destroyCrystalBtn');
  if (crystalBtn)
    crystalBtn.onclick = () => {
      if (x.actions < 1)
        return alert('No quedan acciones disponibles.');
      const st = s.missionState;
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de un Cristal del Pecado. Se gastará 1 acción para destruirlo.`))
        return;
      x.actions--;
      st.crystalsDestroyed = (st.crystalsDestroyed || 0) + 1;
      log(`${ x.name } destruye un Cristal del Pecado (${ st.crystalsDestroyed }/5).`);
      const bonus = swordBonusLabel(st.crystalsDestroyed);
      if (st.crystalsDestroyed >= 5) {
        s.missionResult = 'victory';
        save();
        renderMissions();
        duckAndSay('Los 5 Cristales del Pecado han sido destruidos. La misión termina en victoria.');
        return;
      }
      save();
      renderHero();
      renderMissions();
      say(`Cristal destruido. ${ st.crystalsDestroyed } de 5.${ bonus ? ` La espada gana ${ bonus }.` : '' }`);
    };
}
function finishFlow(skipGenericVoice = false) {
  const x = h();
  const wasAttack = x.flow.type === 'attack';
  x.flow = {
    type: null,
    step: 0,
    attack: {},
    defense: {}
  };
  x.move = {
    on: false,
    pm: 0
  };
  if (wasAttack)
    stopAttackSong();
  if (x.actions <= 0) {
    x.turnDone = true;
    const pendingHeroes = s.heroes.filter(q => !q.unconscious && !q.turnDone);
    if (s.mode === 'solo' || pendingHeroes.length === 0) {
      save();
      renderHero();
      nextPhase();
      return;
    }
    s.turnPrompt = true;
    save();
    renderHero();
    say('Sin acciones restantes. Turno finalizado automáticamente. ¿Quién juega a continuación?');
    return;
  }
  save();
  renderHero();
  if (!skipGenericVoice)
    say(`Acción finalizada. Te quedan ${ x.actions } acciones.`);
}
function resurrectionCount() {
  return s.heroes.length <= 2 ? 1 : s.heroes.length <= 4 ? 2 : 3;
}
function syncResurrectionTokens() {
  const total = resurrectionCount();
  const used = s.resurrection.grey;
  const scheduled = s.heroes.filter(x => x.reviveNextRound).length;
  s.resurrection.blue = Math.max(0, total - used - scheduled);
}
function knockOut(x) {
  x.unconscious = true;
  x.manaAtKO = x.mana;
  x.actions = 0;
  x.turnDone = true;
  x.flow = {
    type: null,
    step: 0,
    attack: {},
    defense: {}
  };
  log(`${ x.name } quedó inconsciente.`);
  syncResurrectionTokens();
  if (s.resurrection.blue <= 0) {
    triggerGameOver(x);
    return;
  }
  x.reviveNextRound = true;
  syncResurrectionTokens();
  log(`${ x.name } usará una Ficha de Resurrección: revivirá al comienzo de la siguiente ronda con 3 de vida.`);
  duckAndSay(`${ heroSpoken(x) } ha quedado inconsciente. Tumba su miniatura. No puede actuar ni ser objetivo. Usará una Ficha de Resurrección y revivirá con 3 de vida al comienzo de la siguiente ronda.`);
}
function triggerGameOver(x) {
  s.gameOver = true;
  log(`${ x.name } queda inconsciente sin Fichas de Resurrección disponibles. La partida termina en derrota.`);
  save();
  render();
  duckAndSay(`${ heroSpoken(x) } queda inconsciente y no quedan Fichas de Resurrección disponibles. La partida termina aquí. El grupo ha sido derrotado.`);
}
function renderResurrection() {
  if (!$('resurrectionPanel'))
    return;
  syncResurrectionTokens();
  const total = resurrectionCount(), pending = s.heroes.filter(x => x.unconscious && x.reviveNextRound);
  $('resurrectionPanel').innerHTML = `<p>Fichas totales según el grupo: <b>${ total }</b></p><div>${ Array.from({ length: s.resurrection.blue }, () => '<span class="resToken resBlue">Azul disponible</span>').join('') }${ Array.from({ length: s.resurrection.grey }, () => '<span class="resToken resGrey">Gris \xB7 relanzar 1 dado negro</span>').join('') }</div>${ pending.map(x => `<div class="resource"><b>${ heroSpoken(x) }</b> está inconsciente y revivirá automáticamente al comienzo de la próxima ronda con 3 de vida.</div>`).join('') || '<p class="muted">No hay héroes inconscientes pendientes.</p>' }`;
}
function reviveScheduled() {
  s.heroes.forEach(x => {
    if (x.reviveNextRound) {
      x.reviveNextRound = false;
      x.unconscious = false;
      x.hp = Math.min(3, x.hpMax);
      if (x.manaAtKO !== null)
        x.mana = Math.min(x.manaMax, x.manaAtKO);
      x.manaAtKO = null;
      s.resurrection.grey++;
      log(`${ x.name } resucitó con 3 de vida.`);
      duckAndSay(`${ heroSpoken(x) } resucita con 3 de vida y conserva su maná. Levanta su miniatura.`);
    }
  });
  syncResurrectionTokens();
}
function greyRerollReminder() {
  return s.resurrection.grey > 0 ? `Hay ${ s.resurrection.grey } ficha${ s.resurrection.grey > 1 ? 's' : '' } de Resurrección en lado gris. Puedes relanzar un dado negro.` : '';
}
function renderHistory() {
  $('history').innerHTML = s.history.length ? s.history.map(x => `<div><b>Ronda ${ x.r } · ${ x.p } · ${ x.n }</b><br>${ x.t }</div>`).join('') : '<p class="muted">Sin registros.</p>';
}
function finishDarkness() {
  if (!(s.phase === 3 && s.darknessPending))
    return;
  s.darknessPending = false;
  s.phaseHistory.push({
    p: s.phase,
    r: s.round,
    d: { ...s.dark }
  });
  s.phase = 0;
  s.round++;
  reviveScheduled();
  s.heroes.forEach(x => {
    x.actions = x.unconscious ? 0 : s.mode === 'solo' ? 4 : 3;
    x.turnDone = false;
    x.flow = {
      type: null,
      step: 0,
      attack: {},
      defense: {}
    };
    if (x.cls === 'paladin' && x.paladin.blessed) {
      let old = x.paladin.blessed;
      x.paladin.blessed = '';
      say(`${ heroSpoken(x) }: retira la habilidad bendecida ${ old }; vuelve a su lado normal.`, x);
    }
  });
  applyCursedSwordDamage();
  log('Comienza la Fase de Héroes.');
  save();
  render();
  showPhaseCurtain(`Ronda ${ s.round } · Fase de Héroes`);
  say(`Comienza la ronda ${ s.round }. Fase de Héroes.`);
}
function applyCursedSwordDamage() {
  const m = getActiveMission();
  if (!m || m.id !== 'cursed_sword' || s.missionResult)
    return;
  const st = s.missionState;
  const bearer = s.heroes.find(x => x.id === st.bearerId);
  if (!bearer)
    return;
  st.roundsHeld = (st.roundsHeld || 0) + 1;
  if (s.mode === 'solo') {
    bearer.hp = Math.max(0, bearer.hp - 1);
    log(`${ bearer.name } sufre 1 herida por la Espada Maldita (modo solitario).`);
    if (bearer.hp === 0 && !bearer.unconscious)
      knockOut(bearer);
    save();
    return;
  }
  if (st.roundsHeld >= 4) {
    s.missionResult = 'defeat';
    log(`${ bearer.name } ha sostenido la Espada Maldita 4 rondas consecutivas y pierde su alma. Derrota.`);
    save();
    duckAndSay(`${ bearer.name } sucumbe a la Espada Maldita. La misión termina en derrota.`);
    return;
  }
  const dmg = st.roundsHeld;
  bearer.hp = Math.max(0, bearer.hp - dmg);
  log(`${ bearer.name } sufre ${ dmg } herida${ dmg > 1 ? 's' : '' } por la Espada Maldita (ronda ${ st.roundsHeld } consecutiva).`);
  if (bearer.hp === 0 && !bearer.unconscious)
    knockOut(bearer);
  save();
  say(`${ bearer.name } sufre ${ dmg } herida${ dmg > 1 ? 's' : '' } por la Espada Maldita.`);
}
function nextPhase() {
  if (!s.confirmed)
    return alert('Primero prepara el grupo.');
  if (s.phase === 2 && !s.levelPhaseResolved)
    return alert('Debes terminar la revisión de todos los héroes en la fase de subida de nivel.');
  if (s.phase === 3 && s.darknessPending)
    return;
  s.phaseHistory.push({
    p: s.phase,
    r: s.round,
    d: { ...s.dark }
  });
  if (s.phase === 0) {
    s.phase = 1;
    s.enemyPhaseAsked = false;
    log('Comienza la Fase de Enemigos.');
    save();
    render();
    showPhaseCurtain('Fase de Enemigos');
    say('Comienza la fase de enemigos. Activa las cuadrillas y después los monstruos errantes. ¿Hay enemigos atacando a los héroes?');
    return;
  }
  if (s.phase === 1) {
    s.phase = 2;
    showPhaseCurtain('Fase de Subida de Nivel');
    beginLevelPhase();
    save();
    render();
    return;
  }
  if (s.phase === 2) {
    s.phase = 3;
    showPhaseCurtain('Fase de Oscuridad');
    advanceDark(true);
    save();
    render();
    return;
  }
}
function beginLevelPhase() {
  s.levelQueue = s.heroes.map((x, i) => ({
    i,
    status: 'pending'
  }));
  s.levelCursor = 0;
  s.levelPhaseResolved = false;
  s.anyLeveledUp = false;
  processNextLevelHero();
}
function processNextLevelHero() {
  if (s.levelCursor >= s.levelQueue.length) {
    s.levelPhaseResolved = true;
    save();
    render();
    duckAndSay(s.anyLeveledUp ? 'Revisión completa. Avanzamos a Oscuridad.' : 'Ningún héroe sube de nivel por falta de experiencia. Avanzamos a Oscuridad.');
    setTimeout(nextPhase, 2600);
    return;
  }
  const entry = s.levelQueue[s.levelCursor], x = s.heroes[entry.i];
  s.active = entry.i;
  const cost = x.level < 5 ? MD2.levelCosts[x.level] : null;
  if (!cost || x.xp < cost) {
    entry.status = 'no-level';
    log(`${ x.name } fue revisado y no sube de nivel.`);
    s.levelCursor++;
    save();
    render();
    setTimeout(processNextLevelHero, 200);
    return;
  }
  s.anyLeveledUp = true;
  x.xp -= cost;
  x.level++;
  const g = MD2.levelGains[x.level];
  x.hpMax += g.hp;
  x.manaMax += g.mana;
  if (!x.unconscious) {
    x.hp = Math.min(x.hpMax, x.hp + g.hp);
    x.mana = Math.min(x.manaMax, x.mana + g.mana);
  }
  x.choices[x.level] = null;
  x.lockedChoices[x.level] = false;
  entry.status = 'waiting-skill';
  log(`${ x.name } sube a nivel ${ x.level }.`);
  save();
  render();
  tab('hero');
  setTimeout(() => document.querySelector('[data-sec="skills"]')?.click(), 30);
  setTimeout(showLevelUpBurst, 60);
  duckAndSay(`${ heroSpoken(x) } sube a nivel ${ x.level }. Elige una habilidad.`);
}
function continueLevelQueueAfterSkill() {
  if (s.phase !== 2)
    return;
  const entry = s.levelQueue[s.levelCursor];
  if (!entry)
    return;
  entry.status = 'done';
  s.levelCursor++;
  save();
  render();
  setTimeout(processNextLevelHero, 800);
}
function darknessSfx(effect) {
  if (s.sfx !== 'yes' || !s.audioUnlocked)
    return;
  let f = effect.includes('errante') ? 82 : effect.includes('cuadrilla') ? 110 : effect.includes('Épico') ? 523 : effect.includes('Raro') ? 392 : 220;
  playTone(f, 0.8, 0.045, effect.includes('errante') ? 'sawtooth' : 'triangle');
}
function advanceDark(voice = true) {
  let transition = '';
  if (s.dark.side === 'front') {
    if (s.dark.i < 8)
      s.dark.i++;
    else {
      s.dark.side = 'back';
      s.dark.i = 0;
      transition = 'El medidor ha llegado al final del anverso. Da vuelta el medidor y colócalo en el reverso, casilla 1. ';
    }
  } else {
    if (s.dark.i < 3)
      s.dark.i++;
    else {
      s.dark.i = 0;
      transition = 'El medidor vuelve a la casilla 1 del mismo reverso. ';
    }
  }
  const effect = darkNow()[1], sideLabel = s.dark.side === 'front' ? 'Anverso' : 'Reverso';
  let t = transition ? `Fase de Oscuridad. ${ transition }El medidor avanza a ${ sideLabel }, casilla ${ darkNow()[0] }. ${ effect }` : `Fase de Oscuridad. El medidor avanza al ${ darkNow()[0] }. ${ effect }`;
  s.darknessPending = true;
  log(t);
  darknessSfx(effect);
  if (voice)
    duckAndSay(t);
  save();
  renderGame();
  setTimeout(() => document.querySelector('#darkTrack .cell.active')?.classList.add('pulse'), 30);
}
function normalizeQuery(q) {
  return q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function stem(word) {
  return word.length > 3 ? word.replace(/(es|s)$/, '') : word;
}
function answerRule(q) {
  const norm = normalizeQuery(q);
  if (!norm)
    return 'Escribe o dicta tu duda sobre una regla del juego.';
  const queryWords = norm.split(' ').map(stem);
  let best = null, bestScore = 0, ties = [];
  MD2.rulesTopics.forEach(topic => {
    let score = 0;
    topic.keywords.forEach(kw => {
      const kwWords = normalizeQuery(kw).split(' ').map(stem);
      const allPresent = kwWords.every(w => queryWords.includes(w));
      if (allPresent)
        score += kwWords.length;
    });
    if (score > bestScore) {
      bestScore = score;
      best = topic;
      ties = [topic];
    } else if (score === bestScore && score > 0 && topic !== best) {
      ties.push(topic);
    }
  });
  if (!best || bestScore === 0) {
    const sample = MD2.rulesTopics.slice(0, 6).map(t => t.keywords[0]).join(', ');
    return `No encontré una coincidencia clara. Intenta con palabras como: ${ sample }, u otro término del reglamento.`;
  }
  if (ties.length > 1) {
    const names = ties.map(t => t.keywords[0]).join(' / ');
    return `${ best.text }\n\n(Tu pregunta también podría referirse a: ${ names }. Sé más específico si quieres otra respuesta.)`;
  }
  return best.text;
}
$('addSelectedClass').onclick = () => {
  let k = $('classPicker').dataset.selected;
  if (!k)
    return alert('Selecciona una clase.');
  if (s.mode === 'solo' && s.heroes.length >= 1)
    return alert('En modo solitario solo puedes elegir 1 héroe.');
  if (s.heroes.some(x => x.cls === k))
    return alert('Esa clase ya está en el grupo.');
  s.heroes.push(makeHero(k));
  save();
  renderSetup();
};
$('confirmGroup').onclick = () => {
  if (!s.heroes.length)
    return alert('Añade al menos un héroe.');
  if (s.mode === 'solo' && s.heroes.length !== 1)
    return alert('El modo solitario requiere exactamente 1 héroe.');
  if (s.mode === 'coop' && (s.heroes.length < 2 || s.heroes.length > 6))
    return alert('El modo cooperativo requiere entre 2 y 6 héroes.');
  s.confirmed = true;
  s.heroes.forEach(x => x.actions = s.mode === 'solo' ? 4 : 3);
  s.active = 0;
  s.resurrection = {
    blue: s.heroes.length <= 2 ? 1 : s.heroes.length <= 4 ? 2 : 3,
    grey: 0
  };
  save();
  render();
  advancePending();
  startAmbient();
};
$('playerMode').onchange = e => {
  if (s.confirmed) {
    e.target.value = s.mode;
    return alert('Para cambiar el modo debes iniciar una nueva partida.');
  }
  s.mode = e.target.value;
  if (s.mode === 'solo' && s.heroes.length > 1)
    s.heroes = s.heroes.slice(0, 1);
  s.heroes.forEach(x => x.actions = s.mode === 'solo' ? 4 : 3);
  save();
  renderSetup();
};
$('resolveDarkness').onclick = finishDarkness;
$('nextPhase').onclick = nextPhase;
$('undoPhase').onclick = () => {
  let q = s.phaseHistory.pop();
  if (!q)
    return;
  s.phase = q.p;
  s.round = q.r;
  s.dark = q.d;
  save();
  render();
};
$('advanceDark').onclick = () => advanceDark();
$('rewindDark').onclick = () => {
  if (s.dark.side === 'back' && s.dark.i === 0) {
    s.dark.side = 'front';
    s.dark.i = 8;
  } else
    s.dark.i = Math.max(0, s.dark.i - 1);
  save();
  renderGame();
};
document.querySelectorAll('nav button').forEach(b => b.onclick = () => tab(b.dataset.tab));
$('ask').onclick = () => {
  window.lastAnswer = answerRule($('question').value);
  $('answer').textContent = window.lastAnswer;
};
$('read').onclick = () => say(window.lastAnswer || $('answer').textContent);
$('dictate').onclick = () => {
  let R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R)
    return alert('Dictado no disponible.');
  let r = new R();
  r.lang = 'es-ES';
  r.onresult = e => {
    $('question').value = e.results[0][0].transcript;
    $('ask').click();
  };
  r.start();
};
document.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => {
  $('question').value = b.dataset.topic;
  $('ask').click();
});
$('clearHistory').onclick = () => {
  s.history = [];
  save();
  renderHistory();
};
if ('speechSynthesis' in window)
  speechSynthesis.onvoiceschanged = loadVoiceOptions;
$('enableAudio').onclick = () => {
  s.voice = 'yes';
  s.audioUnlocked = true;
  resetSpeech();
  save();
  renderAudioStatus();
  say('Asistente de voz activada correctamente.');
};
$('testVoiceSettings').onclick = () => say(`Prueba de voz para ${ s.heroes.length ? heroSpoken(h()) : 'el asistente' }.`);
$('repeatLastAnnouncement').onclick = () => {
  if (!s.lastAnnouncement)
    return alert('No hay anuncio anterior.');
  say(s.lastAnnouncement);
};
$('voiceSetting').onchange = e => {
  s.voice = e.target.value;
  save();
  renderAudioStatus();
};
$('voiceRateSetting').onchange = e => {
  s.rate = e.target.value;
  save();
};
$('voicePitchSetting').onchange = e => {
  s.voicePitch = e.target.value;
  save();
};
$('voiceSelect').onchange = e => {
  s.voiceName = e.target.value;
  save();
};
$('exportSettings').onclick = () => {
  let b = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'md2_version_1_0.json';
  a.click();
};
$('importSettings').onchange = e => {
  let f = e.target.files[0], r = new FileReader();
  r.onload = () => {
    try {
      s = JSON.parse(r.result);
      save();
      render();
    } catch {
      alert('Archivo no válido');
    }
  };
  if (f)
    r.readAsText(f);
};
$('newGameSettings').onclick = () => {
  if (confirm('\xBFNueva partida?')) {
    s = fresh();
    save();
    stopAmbient();
    render();
    tab('setup');
  }
};
function getActiveMission() {
  return MD2.missions.find(m => m.id === s.activeMissionId) || null;
}
function swordBonusLabel(crystals) {
  if (crystals >= 4)
    return '+2 dados amarillos, +2 dados naranjas';
  if (crystals === 3)
    return '+2 dados amarillos, +1 dado naranja';
  if (crystals === 2)
    return '+2 dados amarillos';
  if (crystals === 1)
    return '+1 dado amarillo';
  return '';
}
function initMissions() {
  const select = $('missionSelect');
  MD2.missions.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    select.appendChild(opt);
  });
  select.value = s.activeMissionId || '';
  select.onchange = () => {
    if (select.value === '') {
      s.activeMissionId = '';
      s.missionResult = '';
      s.missionState = {};
    } else {
      s.activeMissionId = select.value;
      s.missionResult = '';
      s.missionState = {};
      if (s.activeMissionId === 'road_to_hell')
        s.missionState = {
          gateLeft: false,
          gateRight: false
        };
      if (s.activeMissionId === 'the_step')
        s.missionState = {
          reachedRift: false
        };
      if (s.activeMissionId === 'demonic_artifact')
        s.missionState = {
          fragments: {}
        };
      if (s.activeMissionId === 'cursed_sword')
        s.missionState = {
          bearerId: null,
          roundsHeld: 0,
          lastRoundChecked: 0
        };
      log(`Misión activada: ${ getActiveMission()?.name || 'ninguna' }.`);
      say(`Misión activada: ${ getActiveMission()?.name }.`);
    }
    save();
    renderMissions();
    renderHero();
  };
  renderMissions();
}
function deactivateMission() {
  if (s.missionResult) {
    const choice = confirm('Misión finalizada.\n\nAceptar = seguir jugando con los mismos héroes (continúa la partida general).\nCancelar = empezar una partida nueva desde cero.');
    s.activeMissionId = '';
    s.missionResult = '';
    s.missionState = {};
    if (choice) {
      s.heroes.forEach(x => {
        x.exitedMap = false;
        x.turnDone = false;
      });
      save();
      $('missionSelect').value = '';
      renderMissions();
      render();
      say('Continúa la partida con los mismos héroes.');
    } else {
      s = fresh();
      save();
      stopAmbient();
      render();
      tab('setup');
      say('Nueva partida iniciada.');
    }
    return;
  }
  if (!confirm('¿Desactivar la misión activa? Se perderá el progreso de sus mecánicas especiales.'))
    return;
  s.activeMissionId = '';
  s.missionResult = '';
  s.missionState = {};
  save();
  $('missionSelect').value = '';
  renderMissions();
  renderHero();
}
function renderMissions() {
  const detail = $('missionDetail'), resultPanel = $('missionResultPanel'), activePanel = $('missionActivePanel');
  if (!detail)
    return;
  const m = getActiveMission();
  if (!m) {
    detail.innerHTML = '';
    resultPanel.innerHTML = '';
    activePanel.innerHTML = '';
    return;
  }
  detail.innerHTML = `<div class="card"><h2>${ m.name }</h2><p class="notice">Losetas necesarias: <b>${ m.tiles }</b></p><h3>Objetivos (en orden)</h3><ol>${ m.objectives.map(o => `<li>${ o }</li>`).join('') }</ol><h3>Reglas especiales</h3><p>${ m.rules }</p></div>`;
  if (s.missionResult) {
    resultPanel.innerHTML = `<div class="card ${ s.missionResult === 'victory' ? 'levelup-burst' : '' }" style="border-color:${ s.missionResult === 'victory' ? 'var(--accent-bright)' : 'var(--ember)' };text-align:center"><h2>${ s.missionResult === 'victory' ? '🏆 Victoria' : '💀 Derrota' }</h2><p>${ s.missionResult === 'victory' ? `Los héroes completaron "${ m.name }".` : `La misión "${ m.name }" terminó en derrota.` }</p><button id="deactivateMission" class="primary top">Desactivar misión</button></div>`;
    $('deactivateMission').onclick = deactivateMission;
    activePanel.innerHTML = '';
    return;
  }
  activePanel.innerHTML = `<div class="row between top"><span class="badge">Misión activa</span><button id="deactivateMissionBtn">Desactivar</button></div>` + renderMissionMechanics(m);
  const deactivateBtn = $('deactivateMissionBtn');
  if (deactivateBtn)
    deactivateBtn.onclick = deactivateMission;
  bindMissionMechanics(m);
}
function renderMissionMechanics(m) {
  if (m.id === 'road_to_hell') {
    const st = s.missionState;
    return `<div class="card"><h3>Portones</h3><div class="row"><button id="gateLeftBtn" ${ st.gateLeft ? 'disabled' : '' } class="${ st.gateLeft ? '' : 'primary' }">${ st.gateLeft ? '✓ Portón Izquierdo abierto' : 'Abrir Portón Izquierdo (+3 XP)' }</button><button id="gateRightBtn" ${ st.gateRight ? 'disabled' : '' } class="${ st.gateRight ? '' : 'primary' }">${ st.gateRight ? '✓ Portón Derecho abierto' : 'Abrir Portón Derecho (+3 XP)' }</button></div>${ st.gateLeft && st.gateRight ? '<p class="notice top">Ambos portones abiertos. Ya pueden escapar por el Altar gastando 1 PM (opción disponible en Movimiento).</p>' : '' }</div>`;
  }
  if (m.id === 'the_step') {
    const st = s.missionState;
    return `<div class="card"><h3>El Invocador</h3><p class="muted">Vida 8 · Defensa 2 (azul). Se mueve solo y se defiende; no realiza otras acciones.</p>${ st.reachedRift ? '<p class="notice">✓ El Invocador llegó a la Grieta. Los héroes ya pueden salir gastando 1 PM (opción en Movimiento).</p>' : '<button id="rift Btn" class="primary top">El Invocador llegó a la Grieta</button>' }</div>`.replace('rift Btn', 'reachRiftBtn');
  }
  if (m.id === 'demonic_artifact') {
    const st = s.missionState;
    const withFrag = Object.keys(st.fragments || {}).filter(id => st.fragments[id]);
    const total = withFrag.reduce((sum, id) => sum + st.fragments[id], 0);
    return `<div class="card"><h3>Fragmentos del Artefacto</h3><p class="muted">Reunidos: ${ total } / 3</p>${ withFrag.length ? `<ul>${ withFrag.map(id => { const h = s.heroes.find(x => x.id == id); return h ? `<li>${ h.name }: ${ st.fragments[id] } fragmento${ st.fragments[id] > 1 ? 's' : '' }</li>` : ''; }).join('') }</ul>` : '<p class="muted">Nadie tiene fragmentos todavía.</p>' }${ total === 3 ? `<button id="forgeArtifactBtn" class="primary top">Forjar Artefacto</button>` : '' }</div>`;
  }
  if (m.id === 'cursed_sword') {
    const st = s.missionState;
    st.crystalsDestroyed = st.crystalsDestroyed || 0;
    const bearer = s.heroes.find(x => x.id === st.bearerId);
    const bonusLabel = swordBonusLabel(st.crystalsDestroyed);
    return `<div class="card"><h3>Espada Maldita</h3>${ bearer ? `<p class="notice">${ bearer.name } porta la espada. Rondas consecutivas: ${ st.roundsHeld } / 4.</p>` : `<label>Asignar espada inicial<select id="swordAssign"><option value="">Elige un héroe</option>${ s.heroes.map(h => `<option value="${ h.id }">${ h.name }</option>`).join('') }</select></label>` }<p class="muted top">Cristales del Pecado destruidos: ${ st.crystalsDestroyed } / 5${ bonusLabel ? ` · Bonus de la espada: ${ bonusLabel }` : '' }</p></div>`;
  }
  return '';
}
function bindMissionMechanics(m) {
  if (m.id === 'road_to_hell') {
    if ($('gateLeftBtn'))
      $('gateLeftBtn').onclick = () => {
        s.missionState.gateLeft = true;
        const x = h();
        x.xp += 3;
        log(`${ x.name } abre el Portón Izquierdo. Gana 3 XP.`);
        save();
        renderMissions();
        renderHero();
        say(`Portón Izquierdo abierto. +3 XP.${ s.missionState.gateRight ? ' Ya pueden escapar por el Altar.' : '' }`);
      };
    if ($('gateRightBtn'))
      $('gateRightBtn').onclick = () => {
        s.missionState.gateRight = true;
        const x = h();
        x.xp += 3;
        log(`${ x.name } abre el Portón Derecho. Gana 3 XP.`);
        save();
        renderMissions();
        renderHero();
        say(`Portón Derecho abierto. +3 XP.${ s.missionState.gateLeft ? ' Ya pueden escapar por el Altar.' : '' }`);
      };
  }
  if (m.id === 'the_step' && $('reachRiftBtn'))
    $('reachRiftBtn').onclick = () => {
      s.missionState.reachedRift = true;
      log('El Invocador llegó a la Grieta.');
      save();
      renderMissions();
      renderHero();
      say('El Invocador llegó a la Grieta. Ya pueden salir.');
    };
  if (m.id === 'demonic_artifact' && $('forgeArtifactBtn'))
    $('forgeArtifactBtn').onclick = () => {
      const st = s.missionState;
      const bearers = Object.keys(st.fragments || {}).filter(id => st.fragments[id]).map(id => s.heroes.find(x => x.id == id)).filter(Boolean);
      const names = bearers.map(x => x.name).join(', ');
      if (!confirm(`Confirma que TODOS los héroes con fragmentos (${ names }) están en la zona de la Forja Demoníaca. ¿Forjar el Artefacto?`))
        return;
      s.missionResult = 'victory';
      log('El Artefacto Demoníaco ha sido forjado. Victoria.');
      save();
      renderMissions();
      duckAndSay('Artefacto forjado. La misión termina en victoria.');
    };
  if (m.id === 'cursed_sword' && $('swordAssign'))
    $('swordAssign').onchange = e => {
      if (!e.target.value)
        return;
      const heroId = +e.target.value || e.target.value;
      const hero = s.heroes.find(x => x.id == e.target.value);
      s.missionState.bearerId = hero.id;
      s.missionState.roundsHeld = 0;
      s.missionState.lastRoundChecked = s.round;
      log(`${ hero.name } recibe la Espada Maldita, reemplazando su arma inicial.`);
      save();
      renderMissions();
      renderHero();
      duckAndSay(`${ heroSpoken(hero) } porta la Espada Maldita. Reemplaza su arma inicial. Si la mantiene 4 rondas seguidas, morirá y la partida se pierde automáticamente.`);
    };
}
initMissions();
render();