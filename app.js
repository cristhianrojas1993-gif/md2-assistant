const APP_VERSION = '20260731t';
const KEY = 'md2v100', $ = id => document.getElementById(id), C = MD2.classes;
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDliM5PY-vnvdE86stScPJqxXkUZ0FSgms',
  authDomain: 'asistente-portadores-de-la-luz.firebaseapp.com',
  databaseURL: 'https://asistente-portadores-de-la-luz-default-rtdb.firebaseio.com',
  projectId: 'asistente-portadores-de-la-luz',
  storageBucket: 'asistente-portadores-de-la-luz.firebasestorage.app',
  messagingSenderId: '198947044570',
  appId: '1:198947044570:web:53d01596a3e96a7b7639e3'
};
let mpDb = null;
let mpRoomRef = null;
let mpListenerAttached = false;
let mpApplyingRemote = false;
let mpLastInitError = '';
function mpInit() {
  if (mpDb)
    return mpDb;
  try {
    if (typeof firebase === 'undefined') {
      mpLastInitError = 'El SDK de Firebase no cargó (revisa tu conexión a internet o si algo bloquea gstatic.com).';
      return null;
    }
    if (!firebase.apps || !firebase.apps.length)
      firebase.initializeApp(FIREBASE_CONFIG);
    mpDb = firebase.database();
    return mpDb;
  } catch (err) {
    mpLastInitError = err && err.message || String(err);
    console.error('No se pudo inicializar Firebase:', err);
    return null;
  }
}
function mpClientId() {
  let id = localStorage.getItem('md2ClientId');
  if (!id) {
    id = 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem('md2ClientId', id);
  }
  return id;
}
function mpGenerateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
let mpPushTimer = null;
function mpPushState() {
  if (!s.roomCode || mpApplyingRemote)
    return;
  const db = mpInit();
  if (!db)
    return;
  if (mpPushTimer)
    clearTimeout(mpPushTimer);
  mpPushTimer = setTimeout(() => {
    const payload = JSON.parse(JSON.stringify(s));
    payload.__v = (payload.__v || 0) + 1;
    payload.__lastWriter = mpClientId();
    s.__v = payload.__v;
    try {
      db.ref('rooms/' + s.roomCode + '/state').set(payload);
    } catch (err) {
      console.error('Error al sincronizar con la sala:', err);
    }
  }, 200);
}
let mpLastCueSeq = 0;
let mpApplyingCue = false;
function mpBroadcastCue(type, payload) {
  if (!s.roomCode || mpApplyingCue)
    return;
  s.mpCue = {
    type,
    payload: payload || null,
    seq: ((s.mpCue && s.mpCue.seq) || 0) + 1
  };
  save();
}
function mpBroadcastMusicCue(type, track) {
  mpBroadcastCue('music-' + type, { track: track || null });
}
function sayShared(text) {
  duckAndSay(text);
  mpBroadcastCue('voice', { text });
}
function mpApplyIncomingCue(cue) {
  if (!cue || cue.seq <= mpLastCueSeq)
    return;
  mpLastCueSeq = cue.seq;
  mpApplyingCue = true;
  try {
    if (cue.type === 'voice' && cue.payload && cue.payload.text)
      duckAndSay(cue.payload.text);
    else if (cue.type === 'music-ambient' && cue.payload && cue.payload.track)
      playSpecificGameTrack(cue.payload.track);
    else if (cue.type === 'music-boss-michael')
      startMichaelSong();
    else if (cue.type === 'music-boss-parca')
      startParcaSong();
  } catch (err) {
    console.error('Error al aplicar aviso remoto:', err);
  }
  mpApplyingCue = false;
}
function mpSubscribe(code) {
  const db = mpInit();
  if (!db)
    return;
  if (mpRoomRef)
    mpRoomRef.off();
  mpRoomRef = db.ref('rooms/' + code + '/state');
  mpListenerAttached = true;
  mpRoomRef.on('value', snap => {
    const remote = snap.val();
    if (!remote)
      return;
    if (remote.__lastWriter === mpClientId())
      return;
    mpApplyingRemote = true;
    const myHeroIndex = s.myHeroIndex;
    const myActive = s.active;
    const prevPhase = s.phase;
    s = mpDeepFixArrays(remote);
    try {
      normalizeState();
    } catch (err) {
      console.error('Error al normalizar estado remoto:', err);
    }
    s.myHeroIndex = myHeroIndex;
    if (myActive !== undefined && myActive !== null && s.heroes && s.heroes[myActive])
      s.active = myActive;
    if (s.phase !== prevPhase && MD2.phases && MD2.phases[s.phase])
      showPhaseCurtain(MD2.phases[s.phase]);
    mpApplyIncomingCue(s.mpCue);
    if (myHeroIndex !== null && myHeroIndex !== undefined && s.heroes[myHeroIndex] && pending(s.heroes[myHeroIndex])) {
      s.active = myHeroIndex;
      tab('hero');
      setTimeout(() => document.querySelector('[data-sec="skills"]')?.click(), 30);
    }
    localStorage.setItem(KEY, JSON.stringify(s));
    mpApplyingRemote = false;
    render();
  });
}
let mpPresenceRef = null;
let mpPresenceListRef = null;
function mpSetupPresence(code) {
  const db = mpInit();
  if (!db)
    return;
  const clientId = mpClientId();
  mpPresenceRef = db.ref('rooms/' + code + '/presence/' + clientId);
  mpPresenceRef.set({
    name: 'Sin héroe elegido',
    connected: true,
    lastSeen: Date.now(),
    heroIndex: -1
  });
  mpPresenceRef.onDisconnect().update({
    connected: false,
    lastSeen: Date.now()
  });
  if (mpPresenceListRef)
    mpPresenceListRef.off();
  mpPresenceListRef = db.ref('rooms/' + code + '/presence');
  let prevPresence = {};
  mpPresenceListRef.on('value', snap => {
    const data = snap.val() || {};
    Object.keys(data).forEach(cid => {
      if (cid === clientId)
        return;
      const wasConnected = prevPresence[cid] && prevPresence[cid].connected;
      const isConnected = data[cid].connected;
      if (wasConnected === true && isConnected === false)
        say(`${ data[cid].name || 'Un jugador' } se ha desconectado de la sala.`);
      if (wasConnected === false && isConnected === true)
        say(`${ data[cid].name || 'Un jugador' } se ha reconectado a la sala.`);
    });
    prevPresence = data;
    mpPresenceData = data;
    renderMultiplayerPanel();
  });
}
function mpUpdatePresenceName(name, heroIndex) {
  if (mpPresenceRef)
    mpPresenceRef.update({
      name,
      connected: true,
      lastSeen: Date.now(),
      heroIndex: heroIndex === undefined ? -1 : heroIndex
    });
}
function mpHeroIndexTakenByOther(idx) {
  const clientId = mpClientId();
  return Object.entries(mpPresenceData || {}).some(([cid, p]) => cid !== clientId && p.connected && p.heroIndex === idx);
}
let mpPresenceData = {};
function mpCreateRoom() {
  const db = mpInit();
  if (!db) {
    alert('No se pudo conectar al servidor multijugador. ' + (mpLastInitError || 'Revisa tu conexión a internet.'));
    return null;
  }
  const code = mpGenerateRoomCode();
  s.roomCode = code;
  s.myHeroIndex = null;
  s.mpHostId = mpClientId();
  save();
  localStorage.setItem('md2_last_room', JSON.stringify({ code, heroIndex: null, timestamp: Date.now() }));
  mpSubscribe(code);
  mpSetupPresence(code);
  return code;
}
function mpJoinRoom(code, cb) {
  const db = mpInit();
  if (!db) {
    alert('No se pudo conectar al servidor multijugador. ' + (mpLastInitError || 'Revisa tu conexión a internet.'));
    return;
  }
  db.ref('rooms/' + code + '/state').once('value').then(snap => {
    const remote = snap.val();
    if (!remote) {
      alert('No se encontró ninguna sala con ese código.');
      if (cb)
        cb(false);
      return;
    }
    mpApplyingRemote = true;
    s = mpDeepFixArrays(remote);
    try {
      normalizeState();
    } catch (err) {
      console.error('Error al normalizar estado remoto:', err);
    }
    s.myHeroIndex = null;
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem('md2_last_room', JSON.stringify({ code, heroIndex: null, timestamp: Date.now() }));
    mpApplyingRemote = false;
    mpSubscribe(code);
    mpSetupPresence(code);
    if (cb)
      cb(true);
  }).catch(err => {
    console.error(err);
    alert(`Error al buscar la sala: ${ (err && err.message) || err || 'desconocido' }\n\n${ (err && err.stack) || '' }`);
    if (cb)
      cb(false);
  });
}
function mpLeaveRoom() {
  if (mpRoomRef) {
    mpRoomRef.off();
    mpRoomRef = null;
  }
  if (mpPresenceRef) {
    mpPresenceRef.remove();
    mpPresenceRef = null;
  }
  if (mpPresenceListRef) {
    mpPresenceListRef.off();
    mpPresenceListRef = null;
  }
  mpPresenceData = {};
  s.roomCode = null;
  s.myHeroIndex = null;
  save();
  localStorage.removeItem('md2_last_room');
}
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
    maxLevelAnnounced: false,
    angelFeathers: 0,
    iceTokens: 0,
    personalCorruption: 0,
    turnAnnounced: false,
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
      consecrations: { green: false, blue: false, red: false },
      blessed: ''
    },
    mage: {
      amulet: 0,
      slots: MD2.talismanDefaults.map(q => ({ ...q })),
      pendingReplacement: null,
      pendingReplacementSlot: null,
      totalRotations: 0,
      pendingInitialFace: true
    },
    berserker: {
      fury: 0,
      stance: 'Furia Sangrienta',
      stanceAbilities: { 'Furia Sangrienta': [], 'Provocador': [], 'Temerario': [] },
      pendingStanceAssign: null
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
    musicMuted: false,
    musicVolume: 0.7,
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
    enemyDefenseFormOpen: false,
    enemyKillCheckOpen: false,
    enemyKillFormOpen: false,
    gameOver: false,
    activeMissionId: '',
    missionResult: '',
    missionState: {}
  };
}
let s = JSON.parse(localStorage.getItem(KEY) || 'null') || fresh();
const MP_KNOWN_ARRAY_FIELDS = new Set(['heroes', 'statuses', 'inventory', 'equipped', 'spirits', 'history', 'phaseHistory', 'xpHistory', 'levelQueue', 'Furia Sangrienta', 'Provocador', 'Temerario']);
function mpDeepFixArrays(obj, seen, parentKey) {
  seen = seen || new Set();
  if (!obj || typeof obj !== 'object' || seen.has(obj))
    return obj;
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++)
      obj[i] = mpDeepFixArrays(obj[i], seen, parentKey);
    return obj;
  }
  const keys = Object.keys(obj);
  const looksLikeArray = keys.length > 0 && keys.every(k => /^\d+$/.test(k)) && MP_KNOWN_ARRAY_FIELDS.has(parentKey);
  if (looksLikeArray) {
    const arr = [];
    keys.forEach(k => {
      arr[+k] = mpDeepFixArrays(obj[k], seen, parentKey);
    });
    return arr;
  }
  keys.forEach(k => {
    obj[k] = mpDeepFixArrays(obj[k], seen, k);
  });
  return obj;
}
function normalizeState() {
if (s.missionState && s.missionState.corruptionChamber === undefined)
  s.missionState.corruptionChamber = (s.missionState.corruptionStone1 || 0) + (s.missionState.corruptionStone2 || 0) + (s.missionState.corruptionStone3 || 0) + (s.missionState.corruptionStone4 || 0);
s.heroes.forEach(x => x.statuses = x.statuses || []);
s.heroes.forEach(x => {
  if (x.maxLevelAnnounced === undefined)
    x.maxLevelAnnounced = false;
  if (x.angelFeathers === undefined)
    x.angelFeathers = 0;
  if (x.iceTokens === undefined)
    x.iceTokens = 0;
  if (x.personalCorruption === undefined)
    x.personalCorruption = 0;
  if (x.turnAnnounced === undefined)
    x.turnAnnounced = false;
  if (x.heroTabAnnouncedThisRound === undefined)
    x.heroTabAnnouncedThisRound = false;
});
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
    ['fire', 'water', 'air', 'nature'].forEach(k => {
      if (typeof x.shaman.unlocked[k] !== 'boolean')
        x.shaman.unlocked[k] = false;
    });
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
if (s.enemyDefenseFormOpen === undefined)
  s.enemyDefenseFormOpen = false;
if (s.enemyKillCheckOpen === undefined)
  s.enemyKillCheckOpen = false;
if (s.enemyKillFormOpen === undefined)
  s.enemyKillFormOpen = false;
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
if (s.musicMuted === undefined)
  s.musicMuted = false;
if (typeof s.musicVolume !== 'number')
  s.musicVolume = 0.7;
if (s.lastAnnouncement === undefined)
  s.lastAnnouncement = '';
s.heroes.forEach(x => {
  if (!Array.isArray(x.inventory))
    x.inventory = [];
  if (!Array.isArray(x.equipped))
    x.equipped = [];
  if (x.shaman && !Array.isArray(x.shaman.spirits))
    x.shaman.spirits = [];
  if (x.mage && !Array.isArray(x.mage.slots))
    x.mage.slots = MD2.talismanDefaults.map(q => ({ ...q }));
  if (x.mage && x.mage.pendingReplacement === undefined)
    x.mage.pendingReplacement = null;
  if (x.mage && x.mage.pendingReplacementSlot === undefined)
    x.mage.pendingReplacementSlot = null;
  if (x.mage && x.mage.pendingInitialFace === undefined)
    x.mage.pendingInitialFace = false;
  if (x.mage && x.mage.totalRotations === undefined)
    x.mage.totalRotations = x.mage.amulet || 0;
  if (x.paladin && typeof x.paladin.consecrations === 'number') {
    const n = x.paladin.consecrations;
    x.paladin.consecrations = { green: n > 0, blue: n > 1, red: n > 2 };
  }
  if (x.paladin && !x.paladin.consecrations)
    x.paladin.consecrations = { green: false, blue: false, red: false };
  if (x.paladin && x.paladin.consecrations) {
    ['green', 'blue', 'red'].forEach(k => {
      if (typeof x.paladin.consecrations[k] !== 'boolean')
        x.paladin.consecrations[k] = false;
    });
  }
  if (x.berserker && !x.berserker.stanceAbilities)
    x.berserker.stanceAbilities = { 'Furia Sangrienta': [], 'Provocador': [], 'Temerario': [] };
  if (x.berserker && x.berserker.stanceAbilities) {
    ['Furia Sangrienta', 'Provocador', 'Temerario'].forEach(k => {
      if (!Array.isArray(x.berserker.stanceAbilities[k]))
        x.berserker.stanceAbilities[k] = [];
    });
  }
  if (x.berserker && x.berserker.pendingStanceAssign === undefined)
    x.berserker.pendingStanceAssign = null;
  if (!x.choices || typeof x.choices !== 'object')
    x.choices = { 1: null };
  if (!x.lockedChoices || typeof x.lockedChoices !== 'object')
    x.lockedChoices = {};
});
if (!Array.isArray(s.history))
  s.history = [];
if (!Array.isArray(s.phaseHistory))
  s.phaseHistory = [];
if (!Array.isArray(s.xpHistory))
  s.xpHistory = [];
}
normalizeState();
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
  [attackSongFadeInterval, bossSongFadeInterval, michaelSongFadeInterval, parcaSongFadeInterval, ambientFadeInterval].forEach(interval => {
    if (interval)
      clearInterval(interval);
  });
  attackSongFadeInterval = null;
  bossSongFadeInterval = null;
  michaelSongFadeInterval = null;
  parcaSongFadeInterval = null;
  ambientFadeInterval = null;
  ['ambientSong', 'attackSong', 'bossSong', 'michaelSong', 'parcaSong', 'victorySong', 'defeatSong'].forEach(id => {
    const el = document.getElementById(id);
    if (!el)
      return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch (err) {
    }
  });
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
function musicVol() {
  return s.musicMuted ? 0 : (typeof s.musicVolume === 'number' ? s.musicVolume : 0.7);
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
    el.volume = s.musicMuted ? 0 : 1;
    el.currentTime = 0;
    el.play().catch(() => {
    });
  } catch (err) {
  }
}
function stopAttackSong() {
  const el = document.getElementById('attackSong');
  if (!el) {
    resumeAmbientAfterInterruption();
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
      resumeAmbientAfterInterruption();
    }
  }, fadeStepMs);
}
function bossSongEl() {
  let el = document.getElementById('bossSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'bossSong';
    el.src = 'la-bestia-terrorifica.mp3';
    el.preload = 'auto';
    document.body.appendChild(el);
  }
  return el;
}
let bossSongFadeInterval = null;
function playBossSong() {
  if (bossSongFadeInterval) {
    clearInterval(bossSongFadeInterval);
    bossSongFadeInterval = null;
  }
  pauseAmbient();
  const el = bossSongEl();
  try {
    el.volume = s.musicMuted ? 0 : 1;
    el.currentTime = 0;
    el.play().catch(() => {
    });
  } catch (err) {
  }
}
function stopBossSong() {
  const el = document.getElementById('bossSong');
  if (!el) {
    resumeAmbientAfterInterruption();
    return;
  }
  if (bossSongFadeInterval) {
    clearInterval(bossSongFadeInterval);
    bossSongFadeInterval = null;
  }
  const fadeSteps = 18, fadeStepMs = 100, startVolume = el.volume || 1;
  let step = 0;
  bossSongFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(bossSongFadeInterval);
      bossSongFadeInterval = null;
      try {
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      } catch (err) {
      }
      resumeAmbientAfterInterruption();
    }
  }, fadeStepMs);
}
const MICHAEL_SONG_FADE_LEAD = 3.2;
function primeAudioElement(el) {
  try {
    el.muted = true;
    el.volume = 0;
    const finish = () => {
      try {
        el.pause();
        el.currentTime = 0;
      } catch (err) {
      }
    };
    const p = el.play();
    if (p && p.then)
      p.then(finish).catch(finish);
    setTimeout(finish, 120);
  } catch (err) {
  }
}
function michaelSongEl() {
  let el = document.getElementById('michaelSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'michaelSong';
    el.src = 'corazon-de-hierro.mp3';
    el.preload = 'auto';
    el.addEventListener('timeupdate', () => {
      if (!el.__restarting && el.duration && !isNaN(el.duration) && el.currentTime >= el.duration - MICHAEL_SONG_FADE_LEAD)
        restartMichaelSongSmoothly(el);
    });
    document.body.appendChild(el);
  }
  return el;
}
function restartMichaelSongSmoothly(el) {
  el.__restarting = true;
  const targetVol = s.musicMuted ? 0 : 1;
  const fadeSteps = 8, fadeStepMs = 50;
  let step = 0;
  const startVol = el.volume || targetVol;
  const fadeOut = setInterval(() => {
    step++;
    try {
      el.volume = Math.max(0, startVol * (1 - step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(fadeOut);
      try {
        el.currentTime = 0;
      } catch (err) {
      }
      let step2 = 0;
      const fadeIn = setInterval(() => {
        step2++;
        try {
          el.volume = Math.min(targetVol, targetVol * (step2 / fadeSteps));
        } catch (err) {
        }
        if (step2 >= fadeSteps) {
          clearInterval(fadeIn);
          el.__restarting = false;
        }
      }, fadeStepMs);
    }
  }, fadeStepMs);
}
function startMichaelSong() {
  pauseAmbient();
  mpBroadcastMusicCue('boss-michael', null);
  const el = michaelSongEl();
  if (michaelSongFadeInterval) {
    clearInterval(michaelSongFadeInterval);
    michaelSongFadeInterval = null;
  }
  try {
    el.muted = false;
    el.volume = 0;
    el.currentTime = 0;
    el.play().catch(() => {
    });
  } catch (err) {
  }
  const targetVol = s.musicMuted ? 0 : 1;
  const fadeSteps = 14, fadeStepMs = 80;
  let step = 0;
  michaelSongFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.min(targetVol, targetVol * (step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(michaelSongFadeInterval);
      michaelSongFadeInterval = null;
    }
  }, fadeStepMs);
}
function parcaSongEl() {
  let el = document.getElementById('parcaSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'parcaSong';
    el.src = 'batalla-contra-la-parca.mp3';
    el.loop = true;
    el.preload = 'auto';
    document.body.appendChild(el);
  }
  return el;
}
function startParcaSong() {
  pauseAmbient();
  mpBroadcastMusicCue('boss-parca', null);
  const el = parcaSongEl();
  if (parcaSongFadeInterval) {
    clearInterval(parcaSongFadeInterval);
    parcaSongFadeInterval = null;
  }
  try {
    el.muted = false;
    el.volume = 0;
    el.currentTime = 0;
    el.play().catch(() => {
    });
  } catch (err) {
  }
  const targetVol = s.musicMuted ? 0 : 1;
  const fadeSteps = 14, fadeStepMs = 80;
  let step = 0;
  parcaSongFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.min(targetVol, targetVol * (step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(parcaSongFadeInterval);
      parcaSongFadeInterval = null;
    }
  }, fadeStepMs);
}
let parcaSongFadeInterval = null;
function stopParcaSong() {
  const el = document.getElementById('parcaSong');
  if (!el) {
    resumeAmbientAfterInterruption();
    return;
  }
  if (parcaSongFadeInterval) {
    clearInterval(parcaSongFadeInterval);
    parcaSongFadeInterval = null;
  }
  const fadeSteps = 18, fadeStepMs = 100, startVolume = el.volume || 1;
  let step = 0;
  parcaSongFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(parcaSongFadeInterval);
      parcaSongFadeInterval = null;
      try {
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      } catch (err) {
      }
      resumeAmbientAfterInterruption();
    }
  }, fadeStepMs);
}
let michaelSongFadeInterval = null;
function stopMichaelSong() {
  const el = document.getElementById('michaelSong');
  if (!el) {
    resumeAmbientAfterInterruption();
    return;
  }
  if (michaelSongFadeInterval) {
    clearInterval(michaelSongFadeInterval);
    michaelSongFadeInterval = null;
  }
  const fadeSteps = 18, fadeStepMs = 100, startVolume = el.volume || 1;
  let step = 0;
  michaelSongFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.max(0, startVolume * (1 - step / fadeSteps));
    } catch (err) {
    }
    if (step >= fadeSteps) {
      clearInterval(michaelSongFadeInterval);
      michaelSongFadeInterval = null;
      try {
        el.pause();
        el.currentTime = 0;
        el.volume = 1;
      } catch (err) {
      }
      resumeAmbientAfterInterruption();
    }
  }, fadeStepMs);
}
const AMBIENT_LOOP_START = 25;
const GAME_TRACKS = ['ambiental_1.mp3', 'ambiental_2.mp3', 'ambiental_3.mp3'];
const AMBIENT_3_FADE_AT = 116; // respaldo: actúa 3s antes del final real del archivo (1:59), por si el corte del audio fallara
let currentGameTrack = null;
function ambientEl() {
  let el = document.getElementById('ambientSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'ambientSong';
    el.preload = 'auto';
    el.addEventListener('ended', onAmbientTrackEnded);
    el.addEventListener('timeupdate', () => {
      if (!el.__ambientSwitching && currentGameTrack === 'ambiental_3.mp3' && el.currentTime >= AMBIENT_3_FADE_AT) {
        el.__ambientSwitching = true;
        playRandomGameTrack(true);
      }
    });
    document.body.appendChild(el);
  }
  return el;
}
function onAmbientTrackEnded() {
  if (!s.confirmed)
    return;
  playRandomGameTrack();
}
let ambientFadeInterval = null;
function fadeAmbientTo(targetVol, durationMs, onDone) {
  const el = document.getElementById('ambientSong');
  if (!el) {
    if (onDone)
      onDone();
    return;
  }
  if (ambientFadeInterval) {
    clearInterval(ambientFadeInterval);
    ambientFadeInterval = null;
  }
  const steps = 16, stepMs = durationMs / steps, startVol = el.volume || 0;
  let step = 0;
  ambientFadeInterval = setInterval(() => {
    step++;
    try {
      el.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * (step / steps)));
    } catch (err) {
    }
    if (step >= steps) {
      clearInterval(ambientFadeInterval);
      ambientFadeInterval = null;
      try {
        el.volume = targetVol;
      } catch (err) {
      }
      if (onDone)
        onDone();
    }
  }, stepMs);
}
function startMenuAmbient() {
  if (s.confirmed)
    return;
  const el = ambientEl();
  el.loop = true;
  try {
    if (!el.src || el.src.indexOf('ambiente.mp3') === -1)
      el.src = 'ambiente.mp3';
    el.volume = musicVol();
    const p = el.play();
    if (p && p.catch)
      p.catch(() => {
      });
  } catch (err) {
  }
}
function syncMusicToGameState() {
  stopAmbient();
  const missionId = getActiveMission()?.id;
  if (missionId === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult) {
    startMichaelSong();
    return;
  }
  if (missionId === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult) {
    startParcaSong();
    return;
  }
  if (s.confirmed)
    playRandomGameTrack();
  else
    startMenuAmbient();
}
function playRandomGameTrack(withFadeOutFirst = false) {
  const options = GAME_TRACKS.filter(t => t !== currentGameTrack);
  const next = options[Math.floor(Math.random() * options.length)] || GAME_TRACKS[0];
  playSpecificGameTrack(next, withFadeOutFirst);
  mpBroadcastMusicCue('ambient', next);
}
function playSpecificGameTrack(next, withFadeOutFirst = false) {
  const el = ambientEl();
  const doSwitch = () => {
    el.loop = false;
    el.__ambientSwitching = false;
    currentGameTrack = next;
    try {
      el.src = next;
      el.volume = 0;
      const p = el.play();
      if (p && p.catch)
        p.catch(() => {
        });
      fadeAmbientTo(musicVol(), 1200);
    } catch (err) {
    }
  };
  if (withFadeOutFirst && !el.paused)
    fadeAmbientTo(0, 900, doSwitch);
  else
    doSwitch();
}
function startAmbient() {
  playRandomGameTrack(true);
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
    el.volume = musicVol();
    const p = el.play();
    if (p && p.catch)
      p.catch(() => {
      });
  } catch (err) {
  }
}
function resumeAmbientAfterInterruption() {
  if (!s.confirmed) {
    startMenuAmbient();
    return;
  }
  playRandomGameTrack();
}
function reactivateAmbient() {
  if (s.musicMuted) {
    say('La música está silenciada. Actívala en Configuración para reactivarla.');
    return;
  }
  if (!s.confirmed) {
    startMenuAmbient();
    say('Música de menú reactivada.');
    return;
  }
  const activeMissionId = getActiveMission()?.id;
  if (activeMissionId === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult) {
    startMichaelSong();
    say('Música del Combate Final reactivada.');
    return;
  }
  if (activeMissionId === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult) {
    startParcaSong();
    say('Música del Combate Final reactivada.');
    return;
  }
  const el = document.getElementById('ambientSong');
  if (el && !el.paused && el.currentTime > 0) {
    say('La música ya se está reproduciendo.');
    return;
  }
  playRandomGameTrack();
  say('Música de fondo reactivada.');
}
function setMusicMuted(muted) {
  s.musicMuted = muted;
  save();
  if (ambientFadeInterval) {
    clearInterval(ambientFadeInterval);
    ambientFadeInterval = null;
  }
  const ambientElRef = document.getElementById('ambientSong');
  const attackElRef = document.getElementById('attackSong');
  if (ambientElRef)
    ambientElRef.volume = musicVol();
  if (attackElRef && !attackSongFadeInterval)
    attackElRef.volume = muted ? 0 : 1;
  renderMusicControls();
}
function setMusicVolume(vol) {
  s.musicVolume = Math.max(0, Math.min(1, vol));
  save();
  if (ambientFadeInterval) {
    clearInterval(ambientFadeInterval);
    ambientFadeInterval = null;
  }
  const ambientElRef = document.getElementById('ambientSong');
  if (ambientElRef)
    ambientElRef.volume = musicVol();
}
function renderMusicControls() {
  if (!$('muteMusicBtn'))
    return;
  $('muteMusicBtn').textContent = s.musicMuted ? 'Activar música' : 'Silenciar música';
  $('musicVolumeSlider').value = Math.round((s.musicVolume ?? 0.7) * 100);
}
function duckAndSay(t) {
  say(t);
}
function updateAmbient() {
}
const h = () => s.heroes[s.active], cl = () => C[h().cls], save = () => {
  if (window.__tutorialDemoActive)
    return;
  localStorage.setItem(KEY, JSON.stringify(s));
  mpPushState();
};
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
  if (document.visibilityState === 'visible' && !s.musicMuted) {
    const activeMissionId = getActiveMission()?.id;
    if (activeMissionId === 'free_michael' && s.missionState?.finalCombatActive && !s.missionResult) {
      const el = document.getElementById('michaelSong');
      if (!el || el.paused || el.currentTime === 0)
        startMichaelSong();
    } else if (activeMissionId === 'soul_keys' && s.missionState?.finalCombatActive && !s.missionResult) {
      const el = document.getElementById('parcaSong');
      if (!el || el.paused || el.currentTime === 0)
        startParcaSong();
    }
  }
});
function say(t, profileHero = h()) {
  s.lastAnnouncement = t || s.lastAnnouncement;
  save();
  if (s.voice !== 'yes' || !('speechSynthesis' in window))
    return;
  if (speechQueue.length >= 1)
    speechQueue.length = 0;
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
  renderMultiplayerPanel();
  if ($('appVersionDisplay'))
    $('appVersionDisplay').textContent = APP_VERSION;
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
    stopAmbient();
    currentGameTrack = null;
    startMenuAmbient();
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
    stopAmbient();
    currentGameTrack = null;
    startMenuAmbient();
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
    if (!h().heroTabAnnouncedThisRound) {
      h().heroTabAnnouncedThisRound = true;
      save();
      duckAndSay(`Héroe activo: ${ heroSpoken(h()) }.`);
    }
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
function renderEnemyKillCheck(panel, available) {
  if (!s.enemyKillFormOpen) {
    panel.innerHTML = `<h2>Defensa del grupo</h2><p class="notice">¿Algún enemigo resultó eliminado por un efecto especial (ficha de fuego, veneno, u otro)?</p><div class="actions"><button id="enemyKillYes" class="primary">Sí, un enemigo murió</button><button id="enemyKillNo">No, continuar</button></div>`;
    $('enemyKillYes').onclick = () => {
      s.enemyKillFormOpen = true;
      save();
      renderEnemyDefense();
    };
    $('enemyKillNo').onclick = () => {
      s.enemyKillCheckOpen = false;
      save();
      render();
      say('De acuerdo. ¿Hay más enemigos atacando a los héroes?');
    };
    return;
  }
  panel.innerHTML = `<h2>Enemigo eliminado</h2><div class="grid top"><label>Tipo de enemigo<select id="killedEnemyType"><option value="minion">Secuaz</option><option value="leader">Líder</option><option value="roamer">Monstruo errante</option></select></label><div id="killedHeroSlot"></div></div><button id="confirmKilledEnemy" class="primary top">Confirmar</button>`;
  const renderHeroSlot = () => {
    const type = $('killedEnemyType').value;
    $('killedHeroSlot').innerHTML = type === 'minion' ? `<label>Héroe que recibe la XP<select id="killedHeroSelect">${ available.map((x, i) => `<option value="${ s.heroes.indexOf(x) }">${ x.name }</option>`).join('') }</select></label>` : '';
  };
  renderHeroSlot();
  $('killedEnemyType').onchange = renderHeroSlot;
  $('confirmKilledEnemy').onclick = () => {
    const type = $('killedEnemyType').value;
    if (type === 'minion') {
      const heroIdx = +$('killedHeroSelect').value, hero = s.heroes[heroIdx];
      hero.xp += 1;
      log(`${ hero.name } gana 1 XP por eliminar un secuaz mediante un efecto especial.`);
      say(`${ hero.name } gana 1 de experiencia por el secuaz eliminado.`);
    } else if (type === 'leader') {
      s.heroes.forEach(q => q.xp += 2);
      log('Líder eliminado por un efecto especial. Todo el grupo gana 2 XP.');
      say('Líder eliminado. El grupo gana 2 de experiencia.');
    } else {
      s.heroes.forEach(q => q.xp += 4);
      log('Monstruo errante eliminado por un efecto especial. Todo el grupo gana 4 XP.');
      say('Monstruo errante eliminado. El grupo gana 4 de experiencia.');
    }
    s.enemyKillCheckOpen = false;
    s.enemyKillFormOpen = false;
    save();
    render();
  };
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
  if (s.enemyDefenseFormOpen) {
    panel.innerHTML = `<h2>Defensa del grupo</h2><p class="notice">Registrando ataque en curso.</p><div id="enemyDefenseForm"></div>`;
    renderDefenseForm(available);
    return;
  }
  if (s.enemyKillCheckOpen) {
    renderEnemyKillCheck(panel, available);
    return;
  }
  panel.innerHTML = `<h2>Defensa del grupo</h2><p class="notice">¿Hay enemigos atacando a los héroes en esta fase?</p><div class="actions"><button id="enemyAttackYes" class="primary">Sí, un héroe es atacado</button><button id="enemyAttackNo">No hay más ataques, continuar</button></div><div id="enemyDefenseForm"></div>`;
  $('enemyAttackYes').onclick = () => {
    s.enemyPhaseAsked = true;
    s.enemyDefenseFormOpen = true;
    save();
    playAttackSong();
    renderEnemyDefense();
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
  form.innerHTML = `<div class="grid top"><label>Héroe atacado<select id="defendedHero">${ available.map((x, i) => `<option value="${ s.heroes.indexOf(x) }">${ x.name }</option>`).join('') }${ invokerOption }</select></label><label>Daño recibido<select id="damageAmount">${ Array.from({ length: 11 }, (_, i) => i).map(n => `<option value="${ n }" ${ n === 0 ? 'selected' : '' }>${ n === 0 ? '0 (héroe se defendió)' : n }</option>`).join('') }</select></label></div><div id="provokeSlot"></div><button id="confirmDamage" class="primary top">Confirmar daño</button>`;
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
    s.enemyDefenseFormOpen = false;
    if ($('defendedHero').value === 'invoker') {
      s.missionState.invokerHp = Math.max(0, (s.missionState.invokerHp ?? 8) - dmg);
      log(`El Invocador recibe ${ dmg } de daño (Vida restante: ${ s.missionState.invokerHp }/8).`);
      save();
      render();
      if (s.missionState.invokerHp === 0) {
        triggerMissionResult('defeat');
        duckAndSay('El Invocador ha muerto. La misión termina en derrota.');
      } else {
        s.enemyKillCheckOpen = true;
        save();
        render();
        say(`El Invocador recibe ${ dmg } de daño. Le quedan ${ s.missionState.invokerHp } de vida. ¿Algún enemigo resultó eliminado por un efecto especial?`);
      }
      return;
    }
    const targetIdx = +$('defendedHero').value, target = s.heroes[targetIdx];
    const paladin = s.heroes.find(q => q.cls === 'paladin' && !q.unconscious && q !== target);
    let finalTarget = target;
    if (dmg > 0 && paladin) {
      const hasVinculo = activeSkills(paladin).some(q => q.branch === 'vinculo');
      if (hasVinculo) {
        const zoneConsecrated = confirm(`${ paladin.name } tiene Vínculo Vital activo. ¿La zona donde ocurre este ataque está consagrada?`);
        if (zoneConsecrated) {
          if (confirm(`¿Quieres que ${ paladin.name } reciba el daño en lugar de ${ target.name }?`))
            finalTarget = paladin;
        }
      }
    }
    if (dmg === 0) {
      log(`${ target.name } se defiende con éxito: no recibe daño en la fase de Enemigos.`);
      s.enemyKillCheckOpen = true;
      save();
      render();
      say(`${ target.name } se defiende sin recibir daño. ¿Algún enemigo resultó eliminado por un efecto especial?`);
      return;
    }
    finalTarget.hp = Math.max(0, finalTarget.hp - dmg);
    log(`${ finalTarget.name } recibe ${ dmg } de daño en la fase de Enemigos${ finalTarget !== target ? ` (redirigido desde ${ target.name } por Vínculo Vital)` : '' }. Vida restante: ${ finalTarget.hp }/${ finalTarget.hpMax }.`);
    if (finalTarget.hp === 0 && !finalTarget.unconscious)
      knockOut(finalTarget);
    if (finalTarget.cls === 'berserker' && dmg > 0) {
      let gain = Math.min(dmg, 7 - finalTarget.berserker.fury);
      if (gain > 0) {
        finalTarget.berserker.fury += gain;
        log(`${ finalTarget.name } gana ${ gain } punto${ gain > 1 ? 's' : '' } de Furia por recibir daño. Furia: ${ finalTarget.berserker.fury }/7.`);
      }
    }
    s.enemyKillCheckOpen = true;
    save();
    render();
    say(`${ finalTarget.name } recibe ${ dmg } de daño. Le quedan ${ finalTarget.hp } de ${ finalTarget.hpMax } de vida. ¿Algún enemigo resultó eliminado por un efecto especial?`);
  };
}
function canResolveSharedPhase() {
  if (!s.roomCode)
    return true;
  if (!s.lastActingClientId)
    return true;
  return mpClientId() === s.lastActingClientId;
}
function renderGame() {
  if (!$('round'))
    return;
  $('round').textContent = s.round;
  $('phase').textContent = MD2.phases[s.phase];
  $('dungeon').textContent = dungeon();
  const canResolve = canResolveSharedPhase();
  $('phaseHelp').textContent = !canResolve ? 'Estas fases las resuelve quien jugó el último turno de héroe.' : s.phase === 3 && s.darknessPending ? 'Resuelve el efecto anunciado y luego pulsa Siguiente fase para confirmarlo.' : phaseHelp();
  const michaelActive = getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult;
  const parcaActive = getActiveMission()?.id === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult;
  if (michaelActive || parcaActive) {
    const level = michaelActive ? (s.missionState.darkLevel || 1) : (s.missionState.parcaDarkLevel || 1);
    const theme = michaelActive ? 'light' : 'dark';
    $('darkPos').textContent = michaelActive ? `Medidor de Luz — Nivel ${ level }/5` : `Medidor de Oscuridad de la Parca — Nivel ${ level }/5`;
    $('darkTrack').innerHTML = `<div class="badge top">${ michaelActive ? '✦ Medidor de Luz' : '☠ Medidor de Oscuridad' }</div><div class="bossMeter ${ theme }">${ Array.from({ length: 5 }, (_, i) => `<div class="bossMeterCell ${ i < level ? 'lit' : '' } ${ i === level - 1 ? 'current' : '' }">${ i + 1 }</div>` ).join('') }</div>`;
    $('darkEvent').textContent = michaelActive ? 'Cada nivel intensifica el poder purificador de Miguel.' : 'Cada nivel intensifica el poder de la Parca sobre las almas.';
  } else {
    $('darkPos').textContent = s.heroes.length ? `${ s.dark.side === 'front' ? 'Anverso' : 'Reverso' } ${ darkNow()[0] }` : '\u2014';
    $('darkTrack').innerHTML = `<div class="badge top">${ s.dark.side === 'front' ? 'Anverso' : 'Reverso' }</div>` + darkArr().map((x, i) => `<div class="cell ${ i === s.dark.i ? 'active' : '' }">${ x[0] }</div>`).join('');
    $('darkEvent').textContent = `${ s.dark.side === 'front' ? 'Anverso' : 'Reverso' } · Casilla ${ darkNow()[0] }: ${ darkNow()[1] }`;
  }
  $('resolveDarkness').classList.toggle('hidden', !(s.phase === 3 && s.darknessPending));
  $('nextPhase').classList.toggle('hidden', s.phase === 3 && s.darknessPending);
  $('nextPhase').disabled = !canResolve;
  $('resolveDarkness').disabled = !canResolve;
  renderEnemyDefense();
}
function renderHero() {
  if (!s.heroes.length) {
    $('heroPage').innerHTML = '<div class="card">Primero prepara el grupo.</div>';
    return;
  }
  const x = h();
  if (s.turnPrompt && s.phase !== 0) {
    s.turnPrompt = false;
    save();
  }
  if (s.turnPrompt) {
    const options = s.heroes.filter(q => !q.unconscious && !q.turnDone);
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
    $('heroPage').innerHTML = `<div class="card"><h2>¿Quién juega a continuación?</h2><p class="notice">El grupo decide libremente qué héroe actúa ahora.</p><div class="actions">${ options.map(q => `<button data-next-hero="${ s.heroes.indexOf(q) }" class="primary">${ q.name } (${ C[q.cls].label })</button>`).join('') }</div></div>`;
    document.querySelectorAll('[data-next-hero]').forEach(b => b.onclick = () => {
      s.active = +b.dataset.nextHero;
      s.turnPrompt = false;
      save();
      render();
      if (!h().heroTabAnnouncedThisRound) {
        h().heroTabAnnouncedThisRound = true;
        save();
        duckAndSay(`Héroe activo: ${ heroSpoken(h()) }.`);
      }
    });
    return;
  }
  if (s.roomCode && s.myHeroIndex !== null && s.myHeroIndex !== undefined && s.active !== s.myHeroIndex) {
    $('heroPage').innerHTML = `<div class="card"><h2>${ x.name } <small class="muted">(héroe de otro jugador — solo lectura)</small></h2><div class="statBarRow"><small>Vida</small><div class="statBarTrack"><div class="statBarFill hpFill" style="width:${ Math.round(x.hp / x.hpMax * 100) }%"></div></div><span class="statBarNum">${ x.hp }/${ x.hpMax }</span></div><div class="statBarRow"><small>Maná</small><div class="statBarTrack"><div class="statBarFill manaFill" style="width:${ Math.round(x.mana / x.manaMax * 100) }%"></div></div><span class="statBarNum">${ x.mana }/${ x.manaMax }</span></div><p class="muted top">No puedes actuar sobre este héroe. Elige el tuyo en Configuración → Multijugador, o en la pestaña de héroes arriba.</p></div>`;
    return;
  }
  document.documentElement.style.setProperty('--hero', COLORS[x.cls]);
  if (x.lastActiveRound !== s.round && !x.unconscious) {
    x.lastActiveRound = s.round;
    startHeroTurn(x);
  }
  if (s.missionState && s.missionState.awaitingMichaelActivation) {
    renderMichaelActivation();
    return;
  }
  if (s.missionState && s.missionState.awaitingParcaActivation) {
    renderParcaActivation();
    return;
  }
  if (s.missionState && s.missionState.awaitingCorruptionSetup) {
    renderCorruptionSetup();
    return;
  }
  if (s.missionState && s.missionState.awaitingCorruptionRoll) {
    renderCorruptionRemoval();
    return;
  }
  if (x.cls === 'mage' && x.mage.pendingInitialFace && !pending(x)) {
    $('heroPage').innerHTML = `<div class="card"><h2>Elige tu cara inicial</h2><p class="notice">¿En qué cara del Talismán quieres empezar la partida?</p><div class="actions">${ x.mage.slots.map((sl, i) => `<button data-initial-face="${ i }" class="primary">Cara ${ i + 1 }: ${ sl.name } (${ sl.manaCost } maná)</button>`).join('') }</div></div>`;
    document.querySelectorAll('[data-initial-face]').forEach(b => b.onclick = () => {
      const idx = +b.dataset.initialFace;
      x.mage.amulet = idx;
      x.mage.totalRotations = idx;
      x.mage.pendingInitialFace = false;
      log(`${ x.name } empieza la partida con el Talismán en la Cara ${ idx + 1 }.`);
      save();
      renderHero();
      say(`Empiezas con ${ x.mage.slots[idx].name } activa.`);
    });
    return;
  }
  if (x.cls === 'shaman' && !x.shaman.elementBoostDone && !x.unconscious && !pending(x)) {
    $('heroPage').innerHTML = `<div class="card"><h2>Aumenta un Elemento</h2><p class="notice">Al inicio de tu turno debes aumentar cualquier Elemento en 1. Toca el medallón del elemento que quieras aumentar.</p>${ shamanElementsBoardHtml(x) }</div>`;
    bindShamanElementBoard(x);
    return;
  }
  let activeSec = document.querySelector('.sectionTabs [data-sec].active')?.dataset.sec;
  if (x.cls === 'mage' && x.mage.pendingReplacement)
    activeSec = 'talisman';
  if (x.cls === 'berserker' && x.berserker.pendingStanceAssign)
    activeSec = 'furia';
  $('heroPage').innerHTML = `<div class="activeHeroBanner">Héroe activo: ${ heroSpoken(x) }</div>${ s.roomCode && s.myHeroIndex === s.active ? `<button id="mpDeselectHeroBtn" class="top">Deseleccionar héroe</button>` : '' }${ x.unconscious ? '<div class="unconsciousBanner">INCONSCIENTE \xB7 Tumba la miniatura. No realiza acciones ni puede ser objetivo.</div>' : '' }<div class="card heroHeader" id="heroHeaderCard"><div id="floatNumSlot"></div><div class="row between"><div><h2>${ classIcon(x.cls) }${ x.name }</h2><small>${ C[x.cls].label }</small></div>${ levelBadge(x.level) }</div>${ heroBarsHtml(x) }<div class="stats top"><div><small>Acciones</small><b>${ x.actions }</b></div><div><small>Habilidad pendiente</small><b>${ pending(x) ? 'Sí' : 'No' }</b></div>${ getActiveMission()?.id === 'terrifying_beast' ? `<div><small>Plumas de Ángel</small><b>${ x.angelFeathers || 0 } 🪶</b></div>` : '' }${ getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive ? `<div><small>Corrupción propia</small><b>${ x.personalCorruption || 0 } 😈</b></div>` : '' }</div></div><div class="sectionTabs"><button data-sec="summary" class="${ !x.flow.type && (!activeSec || activeSec === 'summary') ? 'active' : '' }">Resumen</button><button data-sec="skills" class="${ activeSec === 'skills' ? 'active' : '' }">Habilidades${ pending(x) ? '<span class="alertDot"></span>' : '' }</button><button data-sec="actions" class="${ x.flow.type || activeSec === 'actions' ? 'active' : '' }">Turno</button>${ x.cls === 'shaman' ? `<button data-sec="spirits" class="${ activeSec === 'spirits' ? 'active' : '' }">Espíritus</button>` : '' }${ x.cls === 'shaman' ? `<button data-sec="elements" class="${ activeSec === 'elements' ? 'active' : '' }">Elementos</button>` : '' }${ x.cls === 'mage' ? `<button data-sec="talisman" class="${ activeSec === 'talisman' ? 'active' : '' }">Talismán</button>` : '' }${ x.cls === 'berserker' ? `<button data-sec="furia" class="${ activeSec === 'furia' ? 'active' : '' }">Furia</button>` : '' }${ x.cls === 'paladin' ? `<button data-sec="consagracion" class="${ activeSec === 'consagracion' ? 'active' : '' }">Consagración</button>` : '' }</div><div id="sec-summary" class="heroSection ${ !x.flow.type && (!activeSec || activeSec === 'summary') ? 'active' : '' }">${ summaryHtml(x) }</div><div id="sec-skills" class="heroSection ${ activeSec === 'skills' ? 'active' : '' }">${ skillsHtml(x) }</div><div id="sec-actions" class="heroSection ${ x.flow.type || activeSec === 'actions' ? 'active' : '' }">${ actionsHtml(x) }</div>${ x.cls === 'shaman' ? `<div id="sec-spirits" class="heroSection ${ activeSec === 'spirits' ? 'active' : '' }"><div class="card"><h2>Espíritus invocados</h2>${ shamanSpiritHtml(x) }</div></div>` : '' }${ x.cls === 'shaman' ? `<div id="sec-elements" class="heroSection ${ activeSec === 'elements' ? 'active' : '' }"><div class="card"><h2>Tablero de Elementos</h2>${ shamanElementsBoardHtml(x) }</div></div>` : '' }${ x.cls === 'mage' ? `<div id="sec-talisman" class="heroSection ${ activeSec === 'talisman' ? 'active' : '' }"><div class="card"><h2>Talismán Arcano</h2>${ talismanFullHtml(x) }</div></div>` : '' }${ x.cls === 'berserker' ? `<div id="sec-furia" class="heroSection ${ activeSec === 'furia' ? 'active' : '' }"><div class="card"><h2>Corazón de Furia</h2>${ berserkerFuryBoardHtml(x) }</div></div>` : '' }${ x.cls === 'paladin' ? `<div id="sec-consagracion" class="heroSection ${ activeSec === 'consagracion' ? 'active' : '' }"><div class="card"><h2>Escudo de Consagración</h2><p class="notice">Toca una esfera para Consagrar esa zona (cuesta 1 maná). Elige una habilidad para Bendecirla hasta el final de la ronda.</p>${ paladinConsagracionHtml(x) }</div></div>` : '' }`;
  if (x.unconscious)
    $('heroHeaderCard')?.classList.add('ko-fx');
  document.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => {
    document.querySelectorAll('[data-sec]').forEach(q => q.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.heroSection').forEach(q => q.classList.remove('active'));
    $('sec-' + b.dataset.sec).classList.add('active');
    if (x.cls === 'shaman' && document.getElementById('fireMedallionCircle'))
      requestAnimationFrame(() => requestAnimationFrame(() => bindShamanElementBoard(x, true)));
    if (x.cls === 'berserker' && document.getElementById('board'))
      requestAnimationFrame(() => requestAnimationFrame(() => window.layoutBerserkerTubes && window.layoutBerserkerTubes()));
  });
  bindHero();
}
function eyeBadgeSvg(level, sizeOverride) {
  const ringCol = level <= 2 ? '#4a3d20' : level <= 4 ? '#c9a24b' : '#f0d488';
  const count = 6 + level;
  let fangs = '';
  for (let i = 0; i < count; i++) {
    const a = Math.PI * 2 * i / count;
    const jag = i % 2 === 0 ? 1 : 0.6;
    const bx = 20 + 13 * Math.cos(a), by = 20 + 13 * Math.sin(a);
    const tx = 20 + (19 + 2.5 * jag) * Math.cos(a), ty = 20 + (19 + 2.5 * jag) * Math.sin(a);
    const perp = a + Math.PI / 2;
    const b1x = bx + 2.1 * Math.cos(perp), b1y = by + 2.1 * Math.sin(perp);
    const b2x = bx - 2.1 * Math.cos(perp), b2y = by - 2.1 * Math.sin(perp);
    fangs += `<polygon points="${ b1x },${ b1y } ${ tx },${ ty } ${ b2x },${ b2y }" fill="url(#obsidianGold${ level })" stroke="#000" stroke-width=".4" stroke-linejoin="round"/>`;
  }
  let cracks = '';
  if (level >= 3) {
    const cCount = level >= 5 ? 6 : 3, col = level <= 4 ? '#c9a24b' : '#ff6b35';
    for (let i = 0; i < cCount; i++) {
      const a = Math.PI * 2 * i / cCount + 0.4;
      const x1 = 20 + 11 * Math.cos(a), y1 = 20 + 11 * Math.sin(a);
      const midA = a + 0.15;
      const x2 = 20 + 7 * Math.cos(midA), y2 = 20 + 7 * Math.sin(midA);
      const x3 = 20 + 4 * Math.cos(a - 0.1), y3 = 20 + 4 * Math.sin(a - 0.1);
      cracks += `<path d="M${ x1 },${ y1 } L${ x2 },${ y2 } L${ x3 },${ y3 }" stroke="${ col }" stroke-width="${ level >= 5 ? 0.9 : 0.6 }" fill="none" opacity="${ level >= 5 ? 0.9 : 0.55 }"/>`;
    }
  }
  const irisR = 2 + level * 0.85;
  const eye = `<ellipse cx="20" cy="20" rx="9" ry="4.8" fill="url(#scleraCracked${ level })"/><ellipse cx="20" cy="20" rx="${ irisR }" ry="${ irisR }" fill="url(#irisEmber${ level })"/><rect x="19.3" y="${ 20 - irisR * 0.9 }" width="1.4" height="${ irisR * 1.8 }" rx="0.7" fill="#0d0a0f"/><path d="M11,20 Q20,15 29,20" stroke="#20180f" stroke-width="1.1" fill="none"/><path d="M11,20 Q20,25 29,20" stroke="#20180f" stroke-width="1.1" fill="none"/>`;
  const size = sizeOverride || (level >= 5 ? 54 : level >= 3 ? 46 : 38);
  const glowClass = level >= 5 ? 'badgeGlowStrong' : level >= 3 ? 'badgeGlowSoft' : '';
  return `<svg class="eyeBadge ${ glowClass }" width="${ size }" height="${ size }" viewBox="0 0 40 40"><defs><linearGradient id="obsidianGold${ level }" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0d488"/><stop offset="18%" stop-color="#2a221a"/><stop offset="100%" stop-color="#0d0a0f"/></linearGradient><radialGradient id="irisEmber${ level }" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#ffb057"/><stop offset="60%" stop-color="#c73e1d"/><stop offset="100%" stop-color="#4a1408"/></radialGradient><radialGradient id="scleraCracked${ level }" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="#e8dcc0"/><stop offset="70%" stop-color="#a89468"/><stop offset="100%" stop-color="#6b5a38"/></radialGradient></defs><g class="badgeSpikes">${ fangs }</g><g class="badgeRing"><circle cx="20" cy="20" r="14.8" fill="#0d0a0f" stroke="${ ringCol }" stroke-width="1"/><circle cx="20" cy="20" r="13.2" fill="none" stroke="${ ringCol }" stroke-width="2.6"/></g><circle cx="20" cy="20" r="11.6" fill="#15101a"/>${ cracks }${ eye }</svg>`;
}
function levelBadge(level) {
  return `<span class="levelBadge levelBadge-${ level }">${ eyeBadgeSvg(level, 26) } Nivel ${ level }</span>`;
}
function heroBarsHtml(x) {
  const hpPct = x.hpMax ? Math.max(0, Math.min(100, Math.round(x.hp / x.hpMax * 100))) : 0;
  const manaPct = x.manaMax ? Math.max(0, Math.min(100, Math.round(x.mana / x.manaMax * 100))) : 0;
  const xpCost = x.level < 5 ? MD2.levelCosts[x.level] : null;
  const xpPct = xpCost ? Math.max(0, Math.min(100, Math.round(x.xp / xpCost * 100))) : 100;
  const xpLabel = xpCost ? `${ x.xp } / ${ xpCost }` : `${ x.xp } (Nivel máximo)`;
  return `<div class="statBars"><div class="statBarRow"><small>Vida</small><div class="statBarTrack"><div class="statBarFill hpFill" style="width:${ hpPct }%"></div></div><span class="statBarNum">${ x.hp }/${ x.hpMax }</span></div><div class="statBarRow"><small>Maná</small><div class="statBarTrack"><div class="statBarFill manaFill" style="width:${ manaPct }%"></div></div><span class="statBarNum">${ x.mana }/${ x.manaMax }</span></div><div class="statBarRow"><small>XP</small><div class="statBarTrack"><div class="statBarFill xpFill" style="width:${ xpPct }%"></div></div><span class="statBarNum">${ xpLabel }</span></div></div>`;
}
function summaryHtml(x) {
  return `<div class="card"><h2>Estadísticas</h2><div class="row" id="statAdjustRow1"><button id="hpDown">− Vida</button><button id="hpUp">+ Vida</button><button id="manaDown">− Maná</button><button id="manaUp">+ Maná</button></div><div class="row" id="statAdjustRow2"><button id="xpDown">− XP</button><button id="xpUp">+ XP</button></div><h3>Habilidad propia</h3><div class="passive">${ C[x.cls].ability }</div><h3>Sombras</h3><div class="passive">${ C[x.cls].shadow }</div></div><div class="card"><h2>Mecánica exclusiva</h2>${ classHtml(x) }</div><div class="card"><h2>Estados activos</h2><div class="statusChips">${ (x.statuses || []).map((st, i) => `<span class="statusChip">${ st }<button data-remove-status="${ i }">×</button></span>`).join('') || '<span class="muted">Sin estados activos.</span>' }</div><div class="row"><select id="statusPicker"><option>Quemado</option><option>Congelado</option><option>Envenenado</option><option>Aturdido</option><option>Maldito</option><option>Bendecido</option></select><button id="addStatus">Añadir estado</button></div></div>`;
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
function shamanElementsBoardHtml(x) {
  return `
  <div class="elementsBoard" id="elementsBoardRoot">
    <div class="boardRule">La primera vez que cada Elemento alcance el Máx., puedes gastarlo entero para activar su Bendición permanente hasta el final de la misión.</div>
    <div class="elementsGrid">
      <div class="elementCol fire">
        <div class="petalStack" id="fireStack">
          <div class="tunnel"><div class="tunnelFill fireFill" id="fireTunnelFill" style="height:0%"></div></div>
          <div class="petal fireSlot" id="fire-circle-4" data-level="4"><span class="lvl">Máx</span></div>
          <div class="petal fireSlot" id="fire-circle-3" data-level="3"></div>
          <div class="petal fireSlot" id="fire-circle-2" data-level="2"></div>
          <div class="petal fireSlot" id="fire-circle-1" data-level="1"></div>
          <div class="petal symbolCell fireSlot fireBaseLit" id="fire-circle-0" data-level="0"><div class="lavaTrail ft1"></div><div class="lavaTrail ft2"></div><div class="lavaTrail ft3"></div></div>
          <div class="petal fireMedallion" id="fireMedallionCircle" style="top:-9999px"><div class="lavaBlob b1"></div><div class="lavaBlob b2"></div><div class="lavaBlob b3"></div><span class="lvl">🔥</span></div>
        </div>
      </div>
      <div class="elementCol water">
        <div class="petalStack" id="waterStack">
          <div class="tunnel"><div class="tunnelFill waterFill" id="waterTunnelFill" style="height:0%"></div></div>
          <div class="petal waterSlot" id="water-circle-4" data-level="4"><span class="lvl">Máx</span></div>
          <div class="petal waterSlot" id="water-circle-3" data-level="3"></div>
          <div class="petal waterSlot" id="water-circle-2" data-level="2"></div>
          <div class="petal waterSlot" id="water-circle-1" data-level="1"></div>
          <div class="petal symbolCell waterSlot waterBaseLit" id="water-circle-0" data-level="0"><div class="waterTrail wt1"></div><div class="waterTrail wt2"></div><div class="waterTrail wt3"></div></div>
          <div class="petal waterEnergy" id="waterMedallionCircle" style="top:-9999px"><div class="waterBlob wb1"></div><div class="waterBlob wb2"></div><div class="waterBlob wb3"></div><span class="lvl">💧</span></div>
        </div>
      </div>
      <div class="elementCol air">
        <div class="petalStack" id="airStack">
          <div class="tunnel"><div class="tunnelFill airFill" id="airTunnelFill" style="height:0%"></div></div>
          <div class="petal airSlot" id="air-circle-4" data-level="4"><span class="lvl">Máx</span></div>
          <div class="petal airSlot" id="air-circle-3" data-level="3"></div>
          <div class="petal airSlot" id="air-circle-2" data-level="2"></div>
          <div class="petal airSlot" id="air-circle-1" data-level="1"></div>
          <div class="petal symbolCell airSlot airBaseLit" id="air-circle-0" data-level="0"><div class="airTrail at1"></div><div class="airTrail at2"></div><div class="airTrail at3"></div></div>
          <div class="petal airEnergy" id="airMedallionCircle" style="top:-9999px"><div class="airBlob ab1"></div><div class="airBlob ab2"></div><div class="airBlob ab3"></div><svg class="airIcon" viewBox="0 0 40 40" width="22" height="22"><path d="M6,15 Q14,10 20,15 T34,15" fill="none" stroke="#eaf7ff" stroke-width="2.4" stroke-linecap="round"/><path d="M6,25 Q14,30 20,25 T34,25" fill="none" stroke="#eaf7ff" stroke-width="2.4" stroke-linecap="round" transform="scale(-1,1) translate(-40,0)"/></svg></div>
        </div>
      </div>
      <div class="elementCol nature">
        <div class="petalStack" id="natureStack">
          <div class="tunnel"><div class="tunnelFill natureFill" id="natureTunnelFill" style="height:0%"></div></div>
          <div class="petal natureSlot" id="nature-circle-4" data-level="4"><span class="lvl">Máx</span></div>
          <div class="petal natureSlot" id="nature-circle-3" data-level="3"></div>
          <div class="petal natureSlot" id="nature-circle-2" data-level="2"></div>
          <div class="petal natureSlot" id="nature-circle-1" data-level="1"></div>
          <div class="petal symbolCell natureSlot natureBaseLit" id="nature-circle-0" data-level="0"><div class="natureTrail nt1"></div><div class="natureTrail nt2"></div><div class="natureTrail nt3"></div></div>
          <div class="petal natureEnergy" id="natureMedallionCircle" style="top:-9999px"><div class="natureBlob nb1"></div><div class="natureBlob nb2"></div><div class="natureBlob nb3"></div><span class="lvl">🌿</span></div>
        </div>
      </div>
    </div>
  </div>

  <button id="consumeFireBtn" class="rotateBtn" style="display:none;margin-top:14px;background:linear-gradient(180deg,#ff9f5a,#e0562a 60%,#7a1a08);box-shadow:0 3px 0 #4a0e02,0 5px 10px rgba(224,86,42,.4),inset 0 1px 0 rgba(255,255,255,.35)">Consumir Fuego (activar Bendición)</button>
  <button id="consumeWaterBtn" class="rotateBtn" style="display:none;margin-top:8px;background:linear-gradient(180deg,#7fd0ff,#2f74d6 60%,#0a2a66);box-shadow:0 3px 0 #051433,0 5px 10px rgba(47,116,214,.4),inset 0 1px 0 rgba(255,255,255,.35)">Consumir Agua (activar Bendición)</button>
  <button id="consumeAirBtn" class="rotateBtn" style="display:none;margin-top:8px;background:linear-gradient(180deg,#eaf7ff,#8fc2d6 60%,#2d4d59);box-shadow:0 3px 0 #16262b,0 5px 10px rgba(143,194,214,.4),inset 0 1px 0 rgba(255,255,255,.35);color:#1a2226">Consumir Aire (activar Bendición)</button>
  <button id="consumeNatureBtn" class="rotateBtn" style="display:none;margin-top:8px;background:linear-gradient(180deg,#8fe89c,#2f8a3e 60%,#081f0c);box-shadow:0 3px 0 #040f06,0 5px 10px rgba(47,138,62,.4),inset 0 1px 0 rgba(255,255,255,.35)">Consumir Naturaleza (activar Bendición)</button>
  <div class="blessingsList">
    <div class="blessingRow" id="blessingFire"><div class="dot"></div><div class="txt"><b>Bendición de Fuego</b>Ataque: +1 dado amarillo.</div></div>
    <div class="blessingRow" id="blessingWater"><div class="dot"></div><div class="txt"><b>Bendición de Agua</b>Ataque: mueve al defensor 1 Zona.</div></div>
    <div class="blessingRow" id="blessingAir"><div class="dot"></div><div class="txt"><b>Bendición de Aire</b>Movimiento: +1 PM.</div></div>
    <div class="blessingRow" id="blessingNature"><div class="dot"></div><div class="txt"><b>Bendición de Naturaleza</b>Los Espíritus tienen +1 Vida.</div></div>
  </div>
</div>
  `;
}
function bindShamanElementBoard(x, positionOnly) {
  if (!window.__shamanResizeBound) {
    window.__shamanResizeBound = true;
    window.addEventListener('resize', () => {
      const cur = h();
      if (cur && cur.cls === 'shaman' && document.getElementById('fireMedallionCircle'))
        bindShamanElementBoard(cur, true);
    });
  }
  const configs = [
    { prefix: 'fire', trail: 'lavaTrail' },
    { prefix: 'water', trail: 'waterTrail' },
    { prefix: 'air', trail: 'airTrail' },
    { prefix: 'nature', trail: 'natureTrail' }
  ];
  configs.forEach(({ prefix, trail }) => {
    const LAVA_HTML = `<div class="${ trail } ${ prefix[0] }t1"></div><div class="${ trail } ${ prefix[0] }t2"></div><div class="${ trail } ${ prefix[0] }t3"></div>`;
    const capName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

    function updateFill(level) {
      for (let i = 1; i <= 4; i++) {
        const circle = document.getElementById(prefix + '-circle-' + i);
        if (!circle)
          continue;
        const isLit = i <= level;
        circle.classList.toggle(prefix + 'BaseLit', isLit);
        const hasTrail = circle.querySelector('.' + trail);
        if (isLit && !hasTrail) {
          const lvlSpan = circle.querySelector('.lvl');
          circle.insertAdjacentHTML('afterbegin', LAVA_HTML);
          if (lvlSpan)
            circle.appendChild(lvlSpan);
        } else if (!isLit && hasTrail) {
          circle.querySelectorAll('.' + trail).forEach(b => b.remove());
        }
      }
    }

    function position(level, animate) {
      const slot = document.getElementById(prefix + '-circle-' + level);
      const medallion = document.getElementById(prefix + 'MedallionCircle');
      const stack = document.getElementById(prefix + 'Stack');
      if (!slot || !medallion || !stack)
        return;
      const stackRect = stack.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const centerY = slotRect.top - stackRect.top + slotRect.height / 2;
      if (!animate)
        medallion.style.transition = 'none';
      medallion.style.top = (centerY - 22) + 'px';
      if (!animate)
        requestAnimationFrame(() => {
          medallion.style.transition = '';
        });
      medallion.dataset.level = level;
      const fillEl = document.getElementById(prefix + 'TunnelFill');
      if (fillEl)
        fillEl.style.height = (level / 4 * 100) + '%';
      updateFill(level);
      const blessingEl = document.getElementById('blessing' + capName);
      const alreadyUnlocked = x.shaman.unlocked[prefix];
      if (blessingEl)
        blessingEl.classList.toggle('unlocked' + capName, !!alreadyUnlocked);
      const btn = document.getElementById('consume' + capName + 'Btn');
      if (btn)
        btn.style.display = (level === 4 && !alreadyUnlocked) ? 'block' : 'none';
    }

    const boostMode = x.cls === 'shaman' && !x.shaman.elementBoostDone && !x.unconscious;

    function commitLevel(level) {
      x.shaman[prefix] = level;
      setTimeout(save, 60);
    }

    if (positionOnly) {
      position(x.shaman[prefix] || 0, false);
      return;
    }

    if (boostMode) {
      const medallion = document.getElementById(prefix + 'MedallionCircle');
      if (medallion)
        medallion.addEventListener('click', () => {
          const nextLevel = Math.min(4, (x.shaman[prefix] || 0) + 1);
          x.shaman[prefix] = nextLevel;
          x.shaman.elementBoostDone = true;
          log(`${ x.name } aumenta ${ MD2.shamanElements[prefix] } en 1 (obligatorio de inicio de turno).`);
          save();
          renderHero();
          say(`Aumentas ${ MD2.shamanElements[prefix] }.`);
        });
      position(x.shaman[prefix] || 0, false);
      return;
    }

    function setupDrag() {
      const medallion = document.getElementById(prefix + 'MedallionCircle');
      const stack = document.getElementById(prefix + 'Stack');
      if (!medallion || !stack)
        return;
      let dragging = false, offsetY = 0, cachedStackTop = 0, pendingY = null, rafScheduled = false, minTop = 0, maxTop = 0;

      function applyPendingMove() {
        rafScheduled = false;
        if (pendingY === null)
          return;
        medallion.style.top = pendingY + 'px';
        pendingY = null;
      }

      medallion.addEventListener('pointerdown', e => {
        dragging = true;
        const r = medallion.getBoundingClientRect();
        offsetY = e.clientY - r.top;
        cachedStackTop = stack.getBoundingClientRect().top;
        const topSlot = document.getElementById(prefix + '-circle-4');
        const bottomSlot = document.getElementById(prefix + '-circle-0');
        if (topSlot && bottomSlot) {
          const topRect = topSlot.getBoundingClientRect();
          const bottomRect = bottomSlot.getBoundingClientRect();
          minTop = topRect.top - cachedStackTop + topRect.height / 2 - 22;
          maxTop = bottomRect.top - cachedStackTop + bottomRect.height / 2 - 22;
        }
        medallion.style.transition = 'none';
        medallion.setPointerCapture(e.pointerId);
        document.getElementById('elementsBoardRoot')?.classList.add('dragActive');
      });
      medallion.addEventListener('pointermove', e => {
        if (!dragging)
          return;
        const raw = e.clientY - cachedStackTop - offsetY;
        pendingY = Math.max(minTop, Math.min(maxTop, raw));
        if (!rafScheduled) {
          rafScheduled = true;
          requestAnimationFrame(applyPendingMove);
        }
      });
      medallion.addEventListener('pointerup', e => {
        if (!dragging)
          return;
        dragging = false;
        medallion.style.transition = '';
        document.getElementById('elementsBoardRoot')?.classList.remove('dragActive');
        let best = 0, bestDist = Infinity;
        for (let i = 0; i <= 4; i++) {
          const c = document.getElementById(prefix + '-circle-' + i);
          if (!c)
            continue;
          const r = c.getBoundingClientRect();
          const cy = r.top + r.height / 2;
          const dist = Math.abs(e.clientY - cy);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        }
        position(best, true);
        commitLevel(best);
      });
    }

    position(x.shaman[prefix] || 0, false);
    setupDrag();
    const consumeBtn = document.getElementById('consume' + capName + 'Btn');
    if (consumeBtn)
      consumeBtn.onclick = () => {
        const b = MD2.shamanBlessings[prefix];
        if (!confirm(`¿Consumir todo el ${ MD2.shamanElements[prefix] } para activar "${ b.name }" de forma permanente hasta el final de la misión?`))
          return;
        x.shaman.unlocked[prefix] = true;
        x.shaman[prefix] = 0;
        log(`${ x.name } consume ${ MD2.shamanElements[prefix] } y activa ${ b.name }.`);
        save();
        const blessingEl = document.getElementById('blessing' + capName);
        if (blessingEl)
          blessingEl.classList.add('unlocked' + capName);
        consumeBtn.style.display = 'none';
        position(0, true);
        setTimeout(() => renderHero(), 500);
        say(`${ b.name } activada de forma permanente.`, x);
      };
  });
}

function shamanHtml(x) {
  const inFlow = x.flow.type === 'attack' || x.flow.type === 'defense';
  const elementsBlock = inFlow ? `<p class="notice">Estás en tu Turno (${ x.flow.type === 'attack' ? 'Ataque' : 'Defensa' }). Los controles de Elementos y Hechizos están disponibles ahí, en la pestaña Turno.</p>` : `<p class="notice">Revisa la pestaña Elementos para ver y usar tu Tablero de Elementos.</p><h3>Hechizos disponibles</h3>${ shamanAbilityControls(x) }`;
  return `${ elementsBlock }<p class="notice">Revisa la pestaña Espíritus para ver y gestionar tus invocaciones.</p>`;
}
function mageSkillBaseName(name) {
  return (name || '').replace(/\s+(I{1,3}|IV|V)$/i, '').trim().toLowerCase();
}
function spinTalismanThenRender(x) {
  setTimeout(save, 60);
  const rot = (x.mage.totalRotations || 0) * 90;
  const arrowEl = document.getElementById('svgArrowGroup');
  const clawsEl = document.getElementById('clawsGroup');
  if (arrowEl && clawsEl) {
    arrowEl.style.transform = `rotate(${ rot }deg)`;
    clawsEl.style.transform = `rotate(${ rot }deg)`;
    setTimeout(() => renderHero(), 1150);
  } else {
    renderHero();
  }
}
function bindTalismanDrag(x) {
  const touchArea = document.getElementById('talismanCoreTouch');
  const arrowEl = document.getElementById('svgArrowGroup');
  const clawsEl = document.getElementById('clawsGroup');
  if (!touchArea || !arrowEl || !clawsEl)
    return;
  let dragging = false, centerX = 0, centerY = 0, lastAngle = 0, startRotation = 0, accumulatedDelta = 0, pendingRotation = null, rafScheduled = false;

  function angleAt(e) {
    return Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
  }

  function applyPending() {
    rafScheduled = false;
    if (pendingRotation === null)
      return;
    arrowEl.style.transform = `rotate(${ pendingRotation }deg)`;
    clawsEl.style.transform = `rotate(${ pendingRotation }deg)`;
    pendingRotation = null;
  }

  touchArea.addEventListener('pointerdown', e => {
    dragging = true;
    const r = touchArea.getBoundingClientRect();
    centerX = r.left + r.width / 2;
    centerY = r.top + r.height / 2;
    lastAngle = angleAt(e);
    startRotation = (x.mage.totalRotations || 0) * 90;
    accumulatedDelta = 0;
    arrowEl.style.transition = 'none';
    clawsEl.style.transition = 'none';
    touchArea.setPointerCapture(e.pointerId);
  });
  touchArea.addEventListener('pointermove', e => {
    if (!dragging)
      return;
    const angle = angleAt(e);
    let step = angle - lastAngle;
    if (step > 180)
      step -= 360;
    if (step < -180)
      step += 360;
    accumulatedDelta += step;
    lastAngle = angle;
    pendingRotation = startRotation + accumulatedDelta;
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(applyPending);
    }
  });
  touchArea.addEventListener('pointerup', () => {
    if (!dragging)
      return;
    dragging = false;
    arrowEl.style.transition = '';
    clawsEl.style.transition = '';
    const netDelta = Math.round(accumulatedDelta / 90);
    const faceDelta = ((netDelta % 4) + 4) % 4;
    if (faceDelta === 0) {
      arrowEl.style.transform = `rotate(${ startRotation }deg)`;
      clawsEl.style.transform = `rotate(${ startRotation }deg)`;
      return;
    }
    if (x.mana < 1) {
      arrowEl.style.transform = `rotate(${ startRotation }deg)`;
      clawsEl.style.transform = `rotate(${ startRotation }deg)`;
      alert('No tienes maná suficiente para girar el Talismán.');
      say('Maná insuficiente.');
      return;
    }
    x.mana--;
    x.mage.totalRotations = (x.mage.totalRotations || 0) + netDelta;
    x.mage.amulet = ((x.mage.totalRotations % 4) + 4) % 4;
    const finalRot = startRotation + netDelta * 90;
    arrowEl.style.transform = `rotate(${ finalRot }deg)`;
    clawsEl.style.transform = `rotate(${ finalRot }deg)`;
    let a = x.mage.slots[x.mage.amulet];
    log(`${ x.name } gasta 1 maná para girar el Talismán.`);
    setTimeout(save, 60);
    setTimeout(() => renderHero(), 1150);
    say(`Talismán girado. Activa: ${ a.name }.`);
  });
}
function talismanFullHtml(x) {
  if (x.mage.pendingReplacement && x.mage.pendingReplacementSlot !== null && x.mage.pendingReplacementSlot !== undefined) {
    const v = x.mage.pendingReplacement;
    return `<p class="notice"><b>${ v }</b> va a reemplazar la Cara ${ x.mage.pendingReplacementSlot + 1 }.</p><label>¿Cuánto maná cuesta usar esta habilidad?<select id="talismanManaCost">${ Array.from({ length: 8 }, (_, i) => i).map(n => `<option value="${ n }" ${ n === 1 ? 'selected' : '' }>${ n }</option>`).join('') }</select></label><button id="confirmTalismanReplace" class="primary top">Confirmar reemplazo</button>`;
  }
  if (x.mage.pendingReplacement) {
    const v = x.mage.pendingReplacement;
    return `<p class="notice"><b>${ v }</b> reemplaza una cara del Talismán. Elige cuál:</p><div class="talismanGrid">${ x.mage.slots.map((q, i) => `<div class="talismanSlot"><b>Cara ${ i + 1 }</b><p class="muted">${ q.name } (${ q.manaCost } maná)</p><button data-replace-slot="${ i }" class="primary">Reemplazar esta</button></div>`).join('') }</div>`;
  }
  const rot = (x.mage.totalRotations || 0) * 90;
  const s0 = x.mage.slots[0], s1 = x.mage.slots[1], s2 = x.mage.slots[2], s3 = x.mage.slots[3];
  const a = x.mage.amulet;
  return `<div class="talismanWheel">
    <div class="goldRing"><div class="runeSymbol" style="transform:rotate(0deg) translateY(-114px) rotate(-0deg)">ᚠ</div><div class="runeSymbol" style="transform:rotate(15deg) translateY(-114px) rotate(-15deg)">ᚢ</div><div class="runeSymbol" style="transform:rotate(30deg) translateY(-114px) rotate(-30deg)">ᚦ</div><div class="runeSymbol" style="transform:rotate(45deg) translateY(-114px) rotate(-45deg)">ᚨ</div><div class="runeSymbol" style="transform:rotate(60deg) translateY(-114px) rotate(-60deg)">ᚱ</div><div class="runeSymbol" style="transform:rotate(75deg) translateY(-114px) rotate(-75deg)">ᚲ</div><div class="runeSymbol" style="transform:rotate(90deg) translateY(-114px) rotate(-90deg)">ᚷ</div><div class="runeSymbol" style="transform:rotate(105deg) translateY(-114px) rotate(-105deg)">ᚹ</div><div class="runeSymbol" style="transform:rotate(120deg) translateY(-114px) rotate(-120deg)">ᚺ</div><div class="runeSymbol" style="transform:rotate(135deg) translateY(-114px) rotate(-135deg)">ᚾ</div><div class="runeSymbol" style="transform:rotate(150deg) translateY(-114px) rotate(-150deg)">ᛁ</div><div class="runeSymbol" style="transform:rotate(165deg) translateY(-114px) rotate(-165deg)">ᛃ</div><div class="runeSymbol" style="transform:rotate(180deg) translateY(-114px) rotate(-180deg)">ᛇ</div><div class="runeSymbol" style="transform:rotate(195deg) translateY(-114px) rotate(-195deg)">ᛈ</div><div class="runeSymbol" style="transform:rotate(210deg) translateY(-114px) rotate(-210deg)">ᛉ</div><div class="runeSymbol" style="transform:rotate(225deg) translateY(-114px) rotate(-225deg)">ᛊ</div><div class="runeSymbol" style="transform:rotate(240deg) translateY(-114px) rotate(-240deg)">ᛏ</div><div class="runeSymbol" style="transform:rotate(255deg) translateY(-114px) rotate(-255deg)">ᛒ</div><div class="runeSymbol" style="transform:rotate(270deg) translateY(-114px) rotate(-270deg)">ᛖ</div><div class="runeSymbol" style="transform:rotate(285deg) translateY(-114px) rotate(-285deg)">ᛗ</div><div class="runeSymbol" style="transform:rotate(300deg) translateY(-114px) rotate(-300deg)">ᛚ</div><div class="runeSymbol" style="transform:rotate(315deg) translateY(-114px) rotate(-315deg)">ᛜ</div><div class="runeSymbol" style="transform:rotate(330deg) translateY(-114px) rotate(-330deg)">ᛞ</div><div class="runeSymbol" style="transform:rotate(345deg) translateY(-114px) rotate(-345deg)">ᛟ</div></div>
    <div class="goldRing2"><div class="runeSymbol2" style="transform:rotate(0deg) translateY(-85px) rotate(-0deg)">ᛞ</div><div class="runeSymbol2" style="transform:rotate(30deg) translateY(-85px) rotate(-30deg)">ᛏ</div><div class="runeSymbol2" style="transform:rotate(60deg) translateY(-85px) rotate(-60deg)">ᛒ</div><div class="runeSymbol2" style="transform:rotate(90deg) translateY(-85px) rotate(-90deg)">ᛖ</div><div class="runeSymbol2" style="transform:rotate(120deg) translateY(-85px) rotate(-120deg)">ᛗ</div><div class="runeSymbol2" style="transform:rotate(150deg) translateY(-85px) rotate(-150deg)">ᛚ</div><div class="runeSymbol2" style="transform:rotate(180deg) translateY(-85px) rotate(-180deg)">ᛜ</div><div class="runeSymbol2" style="transform:rotate(210deg) translateY(-85px) rotate(-210deg)">ᚠ</div><div class="runeSymbol2" style="transform:rotate(240deg) translateY(-85px) rotate(-240deg)">ᚢ</div><div class="runeSymbol2" style="transform:rotate(270deg) translateY(-85px) rotate(-270deg)">ᚦ</div><div class="runeSymbol2" style="transform:rotate(300deg) translateY(-85px) rotate(-300deg)">ᚨ</div><div class="runeSymbol2" style="transform:rotate(330deg) translateY(-85px) rotate(-330deg)">ᚱ</div></div>
    <div class="runeStone n ${ a === 0 ? 'active usable' : '' }" ${ a === 0 ? `data-use-talisman="0"` : '' }><span class="num">Cara 1${ a === 0 ? ' · ACTIVA' : '' }</span><span class="name">${ s0.name }</span><span class="cost">${ s0.manaCost } maná</span></div>
    <div class="runeStone e ${ a === 1 ? 'active usable' : '' }" ${ a === 1 ? `data-use-talisman="1"` : '' }><span class="num">Cara 2${ a === 1 ? ' · ACTIVA' : '' }</span><span class="name">${ s1.name }</span><span class="cost">${ s1.manaCost } maná</span></div>
    <div class="runeStone s ${ a === 2 ? 'active usable' : '' }" ${ a === 2 ? `data-use-talisman="2"` : '' }><span class="num">Cara 3${ a === 2 ? ' · ACTIVA' : '' }</span><span class="name">${ s2.name }</span><span class="cost">${ s2.manaCost } maná</span></div>
    <div class="runeStone w ${ a === 3 ? 'active usable' : '' }" ${ a === 3 ? `data-use-talisman="3"` : '' }><span class="num">Cara 4${ a === 3 ? ' · ACTIVA' : '' }</span><span class="name">${ s3.name }</span><span class="cost">${ s3.manaCost } maná</span></div>
    <div class="talismanCore" id="talismanCoreTouch">
      <svg class="coreArtifactSvg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="sharedGold" gradientUnits="userSpaceOnUse" cx="53" cy="43" r="130">
            <stop offset="0%" stop-color="#d9bd78"/><stop offset="20%" stop-color="#b6903e"/><stop offset="45%" stop-color="#856727"/><stop offset="70%" stop-color="#5a481a"/><stop offset="100%" stop-color="#241c06"/>
          </radialGradient>
          <linearGradient id="sheenStreak" gradientUnits="userSpaceOnUse" x1="20" y1="10" x2="95" y2="105">
            <stop offset="0%" stop-color="rgba(255,255,255,0)"/><stop offset="44%" stop-color="rgba(255,255,255,0)"/><stop offset="50%" stop-color="rgba(255,255,255,.32)"/><stop offset="56%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
          <radialGradient id="shadeOverlay" gradientUnits="userSpaceOnUse" cx="45" cy="35" r="105">
            <stop offset="0%" stop-color="rgba(0,0,0,0)"/><stop offset="45%" stop-color="rgba(0,0,0,0)"/><stop offset="72%" stop-color="rgba(0,0,0,.4)"/><stop offset="100%" stop-color="rgba(0,0,0,.7)"/>
          </radialGradient>
          <radialGradient id="pointerShine" gradientUnits="userSpaceOnUse" cx="58" cy="10" r="42">
            <stop offset="0%" stop-color="rgba(255,251,230,.95)"/><stop offset="35%" stop-color="rgba(255,241,190,.5)"/><stop offset="70%" stop-color="rgba(255,241,190,0)"/><stop offset="100%" stop-color="rgba(255,241,190,0)"/>
          </radialGradient>
          <filter id="innerShadowBevel" x="-30%" y="-30%" width="160%" height="160%">
            <feOffset dx="2.2" dy="2.6"/><feGaussianBlur stdDeviation="2.4" result="offset-blur"/><feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/><feFlood flood-color="#1a1204" flood-opacity="0.75" result="color"/><feComposite operator="in" in="color" in2="inverse" result="shadow"/><feComposite operator="over" in="shadow" in2="SourceGraphic"/>
          </filter>
          <filter id="innerHighlightBevel" x="-30%" y="-30%" width="160%" height="160%">
            <feOffset dx="-2.2" dy="-2.6"/><feGaussianBlur stdDeviation="2.2" result="offset-blur"/><feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/><feFlood flood-color="#fff6da" flood-opacity="0.55" result="color"/><feComposite operator="in" in="color" in2="inverse" result="shine"/><feComposite operator="over" in="shine" in2="SourceGraphic"/>
          </filter>
        </defs>
        <g id="svgArrowGroup" class="svgArrowGroup" style="transform:rotate(${ rot }deg)">
          <path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z" fill="url(#sharedGold)" stroke="#000" stroke-width="1" stroke-linejoin="round"/>
          <path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z" fill="url(#sharedGold)" filter="url(#innerShadowBevel)" opacity="0.8"/>
          <path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z" fill="url(#sharedGold)" filter="url(#innerHighlightBevel)" opacity="0.7"/>
          <g clip-path="url(#artifactClip)">
          <line x1="72.8" y1="19.4" x2="100.6" y2="11.3" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="100.6" y1="11.3" x2="97.1" y2="40.3" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/><line x1="97.1" y1="40.3" x2="118.0" y2="60.0" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="118.0" y1="60.0" x2="97.1" y2="79.7" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/><line x1="97.1" y1="79.7" x2="100.6" y2="108.7" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="100.6" y1="108.7" x2="72.8" y2="100.6" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/><line x1="72.8" y1="100.6" x2="60.0" y2="118.0" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="60.0" y1="118.0" x2="47.2" y2="100.6" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/><line x1="47.2" y1="100.6" x2="19.4" y2="108.7" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="19.4" y1="108.7" x2="22.9" y2="79.7" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/><line x1="22.9" y1="79.7" x2="2.0" y2="60.0" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="2.0" y1="60.0" x2="22.9" y2="40.3" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/><line x1="22.9" y1="40.3" x2="19.4" y2="11.3" stroke="rgba(255,251,230,.5)" stroke-width="1.1"/><line x1="19.4" y1="11.3" x2="47.2" y2="19.4" stroke="rgba(30,20,5,.55)" stroke-width="1.1"/>
          </g>
          <path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z" fill="url(#shadeOverlay)"/>
          <path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z" fill="url(#pointerShine)"/>
          <path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z" fill="url(#sheenStreak)"/>
        </g>
        <clipPath id="artifactClip"><path d="M47.2,19.4 L51.9,16.3 L43.8,13.4 L55.4,3.6 L49.6,1.6 L60.0,-16.0 L70.4,1.6 L64.6,3.6 L76.2,13.4 L68.1,16.3 L72.8,19.4 L100.6,11.3 L97.1,40.3 L118.0,60.0 L97.1,79.7 L100.6,108.7 L72.8,100.6 L60.0,118.0 L47.2,100.6 L19.4,108.7 L22.9,79.7 L2.0,60.0 L22.9,40.3 L19.4,11.3 Z"/></clipPath>
        <g id="clawsGroup" style="transform-origin:60px 60px;transform-box:view-box;transition:transform 1.1s cubic-bezier(.4,1.4,.4,1);will-change:transform;transform:rotate(${ rot }deg)">
          <path d="M52,32 L68,32 L60,39 Z" fill="url(#sharedGold)" stroke="#000" stroke-width="0.6"/>
          <path d="M52,88 L68,88 L60,81 Z" fill="url(#sharedGold)" stroke="#000" stroke-width="0.6"/>
          <path d="M32,52 L32,68 L39,60 Z" fill="url(#sharedGold)" stroke="#000" stroke-width="0.6"/>
          <path d="M88,52 L88,68 L81,60 Z" fill="url(#sharedGold)" stroke="#000" stroke-width="0.6"/>
        </g>
      </svg>
      <div class="coreMount">
        <div class="mountSocket"></div>
        <div class="coreGem"></div>
      </div>
    </div>
    <div class="goldRing3"><div class="runeSymbol3" style="transform:rotate(0deg) translateY(-50px) rotate(-0deg)">ᛊ</div><div class="runeSymbol3" style="transform:rotate(30deg) translateY(-50px) rotate(-30deg)">ᛋ</div><div class="runeSymbol3" style="transform:rotate(60deg) translateY(-50px) rotate(-60deg)">ᛇ</div><div class="runeSymbol3" style="transform:rotate(90deg) translateY(-50px) rotate(-90deg)">ᛈ</div><div class="runeSymbol3" style="transform:rotate(120deg) translateY(-50px) rotate(-120deg)">ᛉ</div><div class="runeSymbol3" style="transform:rotate(150deg) translateY(-50px) rotate(-150deg)">ᚺ</div><div class="runeSymbol3" style="transform:rotate(180deg) translateY(-50px) rotate(-180deg)">ᚾ</div><div class="runeSymbol3" style="transform:rotate(210deg) translateY(-50px) rotate(-210deg)">ᛁ</div><div class="runeSymbol3" style="transform:rotate(240deg) translateY(-50px) rotate(-240deg)">ᛃ</div><div class="runeSymbol3" style="transform:rotate(270deg) translateY(-50px) rotate(-270deg)">ᚹ</div><div class="runeSymbol3" style="transform:rotate(300deg) translateY(-50px) rotate(-300deg)">ᚲ</div><div class="runeSymbol3" style="transform:rotate(330deg) translateY(-50px) rotate(-330deg)">ᚷ</div></div>
  </div><p class="notice top">Toca y arrastra el artefacto central para forzar el giro (1 maná, sin importar cuánto gires — siempre encaja en la cara más cercana).</p>`;
}
function bindBerserkerFuryBoard(x) {
  const board = document.getElementById('board');
  if (!board)
    return;
  if (!window.__berserkerResizeBound) {
    window.__berserkerResizeBound = true;
    window.addEventListener('resize', () => {
      const cur = h();
      if (cur && cur.cls === 'berserker' && document.getElementById('board'))
        layoutBerserkerTubes();
    });
  }
  const tubeMap = { 'Furia Sangrienta': 'tubeFS', 'Provocador': 'tubePR', 'Temerario': 'tubeTM' };

  function renderFury() {
    const fury = x.berserker.fury, MAX = 7;
    const pct = fury / MAX;
    const hgt = 24 * pct, y = 24 - hgt;
    document.getElementById('liquidRect').setAttribute('y', y);
    document.getElementById('liquidRect').setAttribute('height', hgt);
    document.getElementById('liquidClipRect').setAttribute('y', y);
    document.getElementById('liquidClipRect').setAttribute('height', hgt);
    document.getElementById('liquidShine').setAttribute('y', y - 0.15);
    document.getElementById('liquidShine').style.opacity = hgt > 0 ? .8 : 0;
    document.getElementById('furyNumText').textContent = fury;
    const fb = (0.65 + pct * 0.65).toFixed(2);
    const fs = (0.55 + pct * 1.05).toFixed(2);
    const fg = (8 + pct * 20).toFixed(0) + 'px';
    const fga = (0.3 + pct * 0.55).toFixed(2);
    board.style.setProperty('--fb', fb);
    board.style.setProperty('--fs', fs);
    board.style.setProperty('--fg', fg);
    board.style.setProperty('--fga', fga);
  }

  function setActiveCard() {
    document.querySelectorAll('.stanceCard').forEach(c => c.classList.toggle('active', c.dataset.stance === x.berserker.stance));
    document.querySelectorAll('.tubeWrap#tubeTM, .tubeGroup').forEach(t => t.classList.toggle('active', t.id === tubeMap[x.berserker.stance]));
  }

  function playFlow(tubeId) {
    const tube = document.getElementById(tubeId);
    if (!tube)
      return;
    tube.classList.remove('burst');
    void tube.offsetWidth;
    tube.classList.add('burst');
    const bursts = tube.querySelectorAll('.tubeLavaBurst');
    const last = bursts[bursts.length - 1];
    if (last)
      last.addEventListener('animationend', () => tube.classList.remove('burst'), { once: true });
  }

  window.layoutBerserkerTubes = function () {

  const board = document.getElementById('board').getBoundingClientRect();
  const heart = document.getElementById('heartWrap').getBoundingClientRect();
  const flame = document.querySelector('.flameStageReal').getBoundingClientRect();
  const heartX = heart.left + heart.width/2 - board.left;
  const heartY = heart.top + heart.height*0.5 - board.top;
  const OVERSHOOT_CARD = 2;    // cuanto se mete la tuberia detras del cuadro (sin sobrepasarlo)
  const JOINT_OVERLAP = 18;    // cuanto se superponen los 2 tramos en el codo, para que no se note el corte
  const EXTRA_H = 0;           // el punto de union con el fuego NO se mueve (se queda igual que v35)
  const EXTRA_OUT = 28;        // el punto de union con el cuadro se alarga hacia afuera, lejos del fuego

  // --- tuberias en L (Furia Sangrienta / Provocador) ---
  // el codo va arriba del centro del fuego; el tramo horizontal sale desde ahi
  // y el tramo vertical sube hasta el cuadro
  ['cardFS', 'cardPR'].forEach(cardId => {
    const groupId = cardId === 'cardFS' ? 'tubeFS' : 'tubePR';
    const card = document.getElementById(cardId).querySelector('.stCardHeader').getBoundingClientRect();
    const cardCX = card.left + card.width/2 - board.left;
    const cardCY = card.top + card.height/2 - board.top;
    const dirSign = cardCX >= heartX ? 1 : -1; // hacia donde queda el cuadro respecto al corazon
    const bendX = cardCX + dirSign * EXTRA_OUT, bendY = flame.top - board.top + flame.height*0.40; // codo alargado hacia afuera, altura de v35

    const group = document.getElementById(groupId);
    const segH = group.querySelector('.tubeSegH');
    const segV = group.querySelector('.tubeSegV');
    const joint = group.querySelector('.tubeJoint');

    // tramo horizontal: sale desde el centro del fuego (igual que v35, sin extension
    // hacia el fuego) hasta el codo, que ahora esta un poco mas alla del cuadro
    // (alejado del fuego), extendido tambien hacia el codo para superponerse con el
    // tramo vertical
    const attachX = heartX - dirSign * EXTRA_H; // se queda igual que en v35 (EXTRA_H=0)
    const lenH = Math.abs(bendX - attachX) + JOINT_OVERLAP;
    const angleH = bendX >= attachX ? 0 : 180;
    segH.style.left = attachX + 'px';
    segH.style.top = bendY + 'px';
    segH.style.width = lenH + 'px';
    segH.style.transform = `rotate(${angleH}deg)`;

    // tramo vertical: desde el codo (superpuesto con el horizontal) hasta el cuadro.
    // Como el codo quedo un poco mas afuera que el cuadro, este tramo entra al cuadro
    // con un pequeno angulo lateral (unos pocos px), disimulado dentro del marco del cuadro.
    const originY = bendY + JOINT_OVERLAP;
    const lenV = (originY - cardCY) + OVERSHOOT_CARD;
    segV.style.left = bendX + 'px';
    segV.style.top = originY + 'px';
    segV.style.width = lenV + 'px';
    segV.style.transform = `rotate(-90deg)`;

    // placa metalica dorada: tamaño FIJO (32x32), centrada exactamente en el punto de
    // quiebre (bendX,bendY). La superposicion real entre segH y segV siempre satura en
    // 26x26 (el grosor de la tuberia) sin importar JOINT_OVERLAP, asi que una placa fija
    // de 32x32 centrada ahi la cubre por completo siempre, y ningun tramo se sale de ella
    // (igual que los tramos no se salen del marco de los cuadros de postura).
    joint.style.left = bendX + 'px';
    joint.style.top = (bendY + 13) + 'px'; // +13 = medio grosor de tuberia (segH usa bendY como borde superior, no centro)
  });

  // --- tuberia recta (Temerario), forzada a vertical pura para que no quede desviada ---
  const cardFull = document.getElementById('cardTM').getBoundingClientRect(); // tarjeta completa (no solo el encabezado)
  const card = document.getElementById('cardTM').querySelector('.stCardHeader').getBoundingClientRect();
  const cardCY = card.top + card.height/2 - board.top;
  const cardBottomSafe = cardFull.bottom - board.top - 3; // margen minimo, casi tocando el borde real de la tarjeta
  const OVERSHOOT_HEART = 45; // mas largo todavia, se esconde detras del fuego
  const tmX = heartX - 8; // desplazada levemente a la izquierda para verse mas centrada respecto a Temerario
  const originY = heartY - OVERSHOOT_HEART;
  const OVERSHOOT_CARD_TM = 30; // alcance hacia la tarjeta, bastante mayor; cardBottomSafe actua de tope real de seguridad
  const totalLen = Math.min(cardCY + OVERSHOOT_CARD_TM, cardBottomSafe) - originY - 5; // -5 corrige el borde del tablero en esta cadena de calculo
  const tubeTM = document.getElementById('tubeTM');
  tubeTM.style.left = tmX + 'px';
  tubeTM.style.top = (originY - 13) + 'px'; // -13 compensa el desfase que introduce rotate(90deg) sobre el punto de pivote
  tubeTM.style.width = totalLen + 'px';
  tubeTM.style.transform = `rotate(90deg)`;

  // placa metalica dorada, mas abajo (no en el punto medio, para que no quede pegada al fuego)
  const jointTM = document.getElementById('jointTM');
  jointTM.style.left = tmX + 'px';
  jointTM.style.top = (heartY + 110.5) + 'px'; // anclada al centro del corazon (fijo), no al origen de la tuberia (que se mueve al alargarla)

  };

  document.querySelectorAll('.stCardHeader').forEach(header => header.onclick = () => {
    const card = header.closest('.stanceCard');
    const newStance = card.dataset.stance;
    if (newStance === x.berserker.stance)
      return;
    if (x.berserker.fury < 1) {
      alert('No tienes Furia suficiente para cambiar de postura.');
      card.classList.add('shakeNoFury');
      setTimeout(() => card.classList.remove('shakeNoFury'), 400);
      say('Furia insuficiente.');
      return;
    }
    if (!confirm(`¿Gastar 1 Furia para cambiar a la postura ${ newStance }?`))
      return;
    x.berserker.fury--;
    x.berserker.stance = newStance;
    log(`${ x.name } gasta 1 Furia para cambiar a la postura ${ newStance }.`);
    setTimeout(save, 60);
    renderFury();
    setActiveCard();
    playFlow(tubeMap[newStance]);
    say(`Cambia a la postura ${ newStance }.`);
  });
  document.querySelectorAll('.stExpandBtn').forEach(btn => btn.onclick = e => {
    e.stopPropagation();
    const card = btn.closest('.stanceCard');
    const willExpand = !card.classList.contains('expanded');
    card.classList.toggle('expanded', willExpand);
    const onDone = () => {
      layoutBerserkerTubes();
      card.querySelector('.stAbilitiesPanel').removeEventListener('transitionend', onDone);
    };
    card.querySelector('.stAbilitiesPanel').addEventListener('transitionend', onDone);
  });

  layoutBerserkerTubes();
  renderFury();
  setActiveCard();
}

function paladinConsagracionHtml(x) {
  return `
  <div class="shield-container">
    <div class="sheen-layer"></div>
    <div class="border-silver-ring"></div>

    <div class="ring-rivets-container">
      <div class="ring-rivet r-1"></div>
      <div class="ring-rivet r-2"></div>
      <div class="ring-rivet r-3"></div>
      <div class="ring-rivet r-4"></div>
      <div class="ring-rivet r-5"></div>
      <div class="ring-rivet r-6"></div>
      <div class="ring-rivet r-7"></div>
      <div class="ring-rivet r-8"></div>
      <div class="ring-rivet r-9"></div>
      <div class="ring-rivet r-10"></div>
      <div class="ring-rivet r-11"></div>
      <div class="ring-rivet r-12"></div>
    </div>

    <div class="inner-gold-line"></div>

    <div class="metal-strap strap-1">
      <div class="strap-rivet"></div>
      <div class="strap-rivet"></div>
      <div class="strap-rivet"></div>
      <div class="strap-rivet"></div>
    </div>
    <div class="metal-strap strap-2">
      <div class="strap-rivet"></div>
      <div class="strap-rivet"></div>
      <div class="strap-rivet"></div>
      <div class="strap-rivet"></div>
    </div>

    <div class="energy-circle circle-green ${ x.paladin.consecrations.green ? 'active' : '' }" id="paladinCircleGreen" data-color="green">
      <div class="energy-core"></div>
      <span class="sphere-initial">V</span>
    </div>

    <div class="energy-circle circle-blue ${ x.paladin.consecrations.blue ? 'active' : '' }" id="paladinCircleBlue" data-color="blue">
      <div class="energy-core"></div>
      <span class="sphere-initial">A</span>
    </div>

    <div class="energy-circle circle-red ${ x.paladin.consecrations.red ? 'active' : '' }" id="paladinCircleRed" data-color="red">
      <div class="energy-core"></div>
      <span class="sphere-initial">R</span>
    </div>

    <div class="mana-display" id="paladinManaDisplay" title="Maná Actual">${ x.mana }</div>

    <div class="center-boss">
      <div class="center-boss-ornament">
        <div class="blessing-bar-container">
          <select class="blessing-select ${ x.paladin.blessed ? 'blessed' : '' }" id="paladinBlessingSelect">
            <option value="">-- BENDICIÓN --</option>
            ${ activeSkills(x).map(q => `<option value="${ q.name }" ${ x.paladin.blessed === q.name ? 'selected' : '' }>${ q.name }</option>`).join('') }
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="consecration-info-panel">
    <div class="info-card info-card-green ${ x.paladin.consecrations.green ? 'active' : '' }">
      <div class="info-badge">V</div>
      <div class="info-text"><b>combate:</b> relanzar un dado</div>
    </div>

    <div class="info-card info-card-blue ${ x.paladin.consecrations.blue ? 'active' : '' }">
      <div class="info-badge">A</div>
      <div class="info-text">los héroes que empiezan una acción de movimiento en esta zona ganan 1 PM</div>
    </div>

    <div class="info-card info-card-red ${ x.paladin.consecrations.red ? 'active' : '' }">
      <div class="info-badge">R</div>
      <div class="info-text">los héroes que empiezan su activación en esta zona pueden curar 1</div>
    </div>
  </div>
  `;
}
function berserkerFuryBoardHtml(x) {
  if (!x.berserker.stanceAbilities)
    x.berserker.stanceAbilities = { 'Furia Sangrienta': [], 'Provocador': [], 'Temerario': [] };
  if (x.berserker.pendingStanceAssign) {
    const v = x.berserker.pendingStanceAssign;
    return `<p class="notice"><b>${ v }</b> se aprendió. ¿En qué postura la dejas? Quedará disponible mientras estés en esa postura.</p><div class="stancePickerBtns"><button data-assign-stance="Furia Sangrienta" class="primary">Furia Sangrienta</button><button data-assign-stance="Provocador" class="primary">Provocador</button><button data-assign-stance="Temerario" class="primary">Temerario</button></div>`;
  }
  return `
<div class="board" id="board">
    <div class="berserkerAxeDouble axeDoubleLeft">
      <svg viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="woodGradDL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#2a1608"/>
            <stop offset="40%" stop-color="#5a3a1e"/>
            <stop offset="60%" stop-color="#4a2e16"/>
            <stop offset="100%" stop-color="#1c0e05"/>
          </linearGradient>
          <linearGradient id="steelGradDL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="16%" stop-color="#d8dee4"/>
            <stop offset="38%" stop-color="#9aa0a8"/>
            <stop offset="55%" stop-color="#5c6168"/>
            <stop offset="70%" stop-color="#c4cad0"/>
            <stop offset="85%" stop-color="#8e939a"/>
            <stop offset="100%" stop-color="#3a3d42"/>
          </linearGradient>
          <linearGradient id="steelGradDLFlip" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d4dae0"/>
            <stop offset="18%" stop-color="#9298a0"/>
            <stop offset="40%" stop-color="#4a4d52"/>
            <stop offset="62%" stop-color="#22242a"/>
            <stop offset="82%" stop-color="#5a5e64"/>
            <stop offset="100%" stop-color="#16171a"/>
          </linearGradient>
          <linearGradient id="wedgeGradDL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8a6a3a"/>
            <stop offset="100%" stop-color="#4a3418"/>
          </linearGradient>
          <linearGradient id="pommelGoldDL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fff3c4"/>
            <stop offset="25%" stop-color="#e0b84a"/>
            <stop offset="50%" stop-color="#8a6212"/>
            <stop offset="75%" stop-color="#e0b84a"/>
            <stop offset="100%" stop-color="#fff3c4"/>
          </linearGradient>
        </defs>
        <rect x="91" y="90" width="18" height="192" rx="5" fill="url(#woodGradDL)" stroke="#000" stroke-width="1.6"/>
        <rect x="90" y="212" width="20" height="4.5" rx="1" fill="#1c0e05" stroke="#000" stroke-width=".6"/>
        <rect x="90" y="231" width="20" height="4.5" rx="1" fill="#1c0e05" stroke="#000" stroke-width=".6"/>
        <rect x="90" y="250" width="20" height="4.5" rx="1" fill="#1c0e05" stroke="#000" stroke-width=".6"/>
        <ellipse cx="100" cy="278" rx="13" ry="4" fill="url(#pommelGoldDL)" stroke="#000" stroke-width="1.2"/><ellipse cx="100" cy="284" rx="11" ry="5" fill="#3a2210" stroke="#000" stroke-width="1.4"/><circle cx="100" cy="284" r="3" fill="url(#pommelGoldDL)" stroke="#000" stroke-width=".8"/>
        <path d="M94,86 L106,86 L100,70 Z" fill="url(#wedgeGradDL)" stroke="#000" stroke-width="1.4"/>
        <path d="M89,64 L111,64 C114,72 114,84 111,92 L89,92 C86,84 86,72 89,64 Z"
              fill="url(#steelGradDL)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M112,64 L117,60 L141,34 A95,95 0 0,1 141,122 L117,96 L112,92 Z"
              fill="url(#steelGradDL)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M117,60 L141,34" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M141,122 L117,96" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M141,34 A95,95 0 0,1 141,122" fill="none" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round"/>
        <path d="M88,64 L83,60 L59,34 A95,95 0 0,0 59,122 L83,96 L88,92 Z"
              fill="url(#steelGradDLFlip)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M83,60 L59,34" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M59,122 L83,96" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M59,34 A95,95 0 0,0 59,122" fill="none" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round"/>
        <circle cx="91" cy="70" r="1.6" fill="#000"/>
        <circle cx="109" cy="70" r="1.6" fill="#000"/>
        <circle cx="91" cy="86" r="1.6" fill="#000"/>
        <circle cx="109" cy="86" r="1.6" fill="#000"/>
      </svg>
    </div>
    <div class="berserkerAxeDouble axeDoubleRight">
      <svg viewBox="0 0 200 290" xmlns="http://www.w3.org/2000/svg">
        <rect x="91" y="90" width="18" height="192" rx="5" fill="url(#woodGradDL)" stroke="#000" stroke-width="1.6"/>
        <rect x="90" y="212" width="20" height="4.5" rx="1" fill="#1c0e05" stroke="#000" stroke-width=".6"/>
        <rect x="90" y="231" width="20" height="4.5" rx="1" fill="#1c0e05" stroke="#000" stroke-width=".6"/>
        <rect x="90" y="250" width="20" height="4.5" rx="1" fill="#1c0e05" stroke="#000" stroke-width=".6"/>
        <ellipse cx="100" cy="278" rx="13" ry="4" fill="url(#pommelGoldDL)" stroke="#000" stroke-width="1.2"/><ellipse cx="100" cy="284" rx="11" ry="5" fill="#3a2210" stroke="#000" stroke-width="1.4"/><circle cx="100" cy="284" r="3" fill="url(#pommelGoldDL)" stroke="#000" stroke-width=".8"/>
        <path d="M94,86 L106,86 L100,70 Z" fill="url(#wedgeGradDL)" stroke="#000" stroke-width="1.4"/>
        <path d="M89,64 L111,64 C114,72 114,84 111,92 L89,92 C86,84 86,72 89,64 Z"
              fill="url(#steelGradDL)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M112,64 L117,60 L141,34 A95,95 0 0,1 141,122 L117,96 L112,92 Z"
              fill="url(#steelGradDL)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M117,60 L141,34" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M141,122 L117,96" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M141,34 A95,95 0 0,1 141,122" fill="none" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round"/>
        <path d="M88,64 L83,60 L59,34 A95,95 0 0,0 59,122 L83,96 L88,92 Z"
              fill="url(#steelGradDLFlip)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M83,60 L59,34" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M59,122 L83,96" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round" fill="none"/>
        <path d="M59,34 A95,95 0 0,0 59,122" fill="none" stroke="#ffffff" stroke-width="2" opacity=".8" stroke-linecap="round"/>
        <circle cx="91" cy="70" r="1.6" fill="#000"/>
        <circle cx="109" cy="70" r="1.6" fill="#000"/>
        <circle cx="91" cy="86" r="1.6" fill="#000"/>
        <circle cx="109" cy="86" r="1.6" fill="#000"/>
      </svg>
    </div>
    <div class="ruleBox">Toca una postura para cambiarte a ella (cuesta 1 Furia fija). El Corazón se llena al recibir Heridas.</div>

    <div class="stanceCard dark cardFS" id="cardFS" data-stance="Furia Sangrienta">
      <div class="stCardHeader">
        <span class="stName">Furia Sangrienta</span>
        <button class="stExpandBtn" data-expand-for="Furia Sangrienta" aria-label="Expandir"></button>
      </div>
      <div class="stDesc">Ataque: gasta 1 Furia para relanzar cualquier dado.</div>
      <div class="stAbilitiesPanel" id="panelFS">${ (x.berserker.stanceAbilities['Furia Sangrienta'] || []).map(a => `<div class="stAbilityItem">${ a }</div>`).join('') || '<div class="stAbilityItem muted">Sin habilidades asignadas</div>' }</div>
    </div>
    <div class="stanceCard cream cardPR" id="cardPR" data-stance="Provocador">
      <div class="stCardHeader">
        <span class="stName">Provocador</span>
        <button class="stExpandBtn" data-expand-for="Provocador" aria-label="Expandir"></button>
      </div>
      <div class="stDesc">Defensa: gasta 1 Furia para infligir 1 Herida al atacante.</div>
      <div class="stAbilitiesPanel" id="panelPR">${ (x.berserker.stanceAbilities['Provocador'] || []).map(a => `<div class="stAbilityItem">${ a }</div>`).join('') || '<div class="stAbilityItem muted">Sin habilidades asignadas</div>' }</div>
    </div>
    <div class="stanceCard cream cardTM" id="cardTM" data-stance="Temerario">
      <div class="stCardHeader">
        <span class="stName">Temerario</span>
        <button class="stExpandBtn" data-expand-for="Temerario" aria-label="Expandir"></button>
      </div>
      <div class="stDesc">Movimiento: gasta 1 Furia para obtener +1 PM.</div>
      <div class="stAbilitiesPanel" id="panelTM">${ (x.berserker.stanceAbilities['Temerario'] || []).map(a => `<div class="stAbilityItem">${ a }</div>`).join('') || '<div class="stAbilityItem muted">Sin habilidades asignadas</div>' }</div>
    </div>

    <div class="tubeGroup" id="tubeFS">
      <div class="tubeWrap tubeSegH"><div class="tubeBody"></div><div class="tubeShine"></div><div class="tubeLavaBurst"></div></div>
      <div class="tubeWrap tubeSegV"><div class="tubeBody"></div><div class="tubeShine"></div><div class="tubeLavaBurst"></div></div>
      <div class="tubeJoint"></div>
    </div>
    <div class="tubeGroup" id="tubePR">
      <div class="tubeWrap tubeSegH"><div class="tubeBody"></div><div class="tubeShine"></div><div class="tubeLavaBurst"></div></div>
      <div class="tubeWrap tubeSegV"><div class="tubeBody"></div><div class="tubeShine"></div><div class="tubeLavaBurst"></div></div>
      <div class="tubeJoint"></div>
    </div>
    <div class="tubeWrap" id="tubeTM"><div class="tubeBody"></div><div class="tubeShine"></div><div class="tubeLavaBurst"></div></div>
    <div class="tubeJoint" id="jointTM"></div>

    <div class="flameGlowBehind">
      <svg viewBox="0 0 200 252.5" xmlns="http://www.w3.org/2000/svg">
        <path fill="#6f0900" d="M55.31,0.00 C50.69,1.05 62.60,13.11 64.27,19.49 C65.94,25.87 68.36,26.51 65.32,38.28 C62.28,50.04 50.28,76.21 46.01,90.08 C41.73,103.95 42.52,119.43 39.68,121.51 C36.85,123.59 32.54,106.94 28.97,102.55 C25.40,98.16 20.19,93.56 18.26,95.17 C16.33,96.78 20.43,103.10 17.38,112.20 C14.34,121.31 2.46,139.83 0.00,149.78 C-2.46,159.73 -1.26,163.21 2.63,171.91 C6.53,180.60 23.79,199.39 23.35,201.93 C22.91,204.48 1.11,185.31 0.00,187.18 C-1.11,189.05 8.90,204.98 16.68,213.17 C24.47,221.36 35.65,229.79 46.71,236.35 C57.77,242.90 72.52,249.93 83.06,252.50 C93.59,255.08 98.24,254.81 109.92,251.80 C121.60,248.79 142.52,239.48 153.12,234.42 C163.71,229.35 167.11,227.19 173.49,221.42 C179.87,215.66 186.98,207.87 191.40,199.82 C195.82,191.78 201.38,176.29 200.00,173.13 C198.62,169.97 185.37,185.13 183.14,180.86 C180.92,176.59 187.45,158.56 186.65,147.50 C185.86,136.44 183.32,125.75 178.40,114.49 C173.49,103.22 161.37,82.65 157.16,79.89 C152.94,77.14 154.32,94.73 153.12,97.98 C151.92,101.23 153.76,107.26 149.96,99.39 C146.15,91.51 135.35,61.57 130.29,50.75 C125.23,39.92 125.96,40.68 119.58,34.42 C113.20,28.15 102.72,18.91 92.01,13.17 C81.30,7.43 59.94,-1.05 55.31,0.00 Z"><animate attributeName="d" dur="1.9s" begin="0s" repeatCount="indefinite" calcMode="linear" values="M55.31,0.00 C50.69,1.05 62.60,13.11 64.27,19.49 C65.94,25.87 68.36,26.51 65.32,38.28 C62.28,50.04 50.28,76.21 46.01,90.08 C41.73,103.95 42.52,119.43 39.68,121.51 C36.85,123.59 32.54,106.94 28.97,102.55 C25.40,98.16 20.19,93.56 18.26,95.17 C16.33,96.78 20.43,103.10 17.38,112.20 C14.34,121.31 2.46,139.83 0.00,149.78 C-2.46,159.73 -1.26,163.21 2.63,171.91 C6.53,180.60 23.79,199.39 23.35,201.93 C22.91,204.48 1.11,185.31 0.00,187.18 C-1.11,189.05 8.90,204.98 16.68,213.17 C24.47,221.36 35.65,229.79 46.71,236.35 C57.77,242.90 72.52,249.93 83.06,252.50 C93.59,255.08 98.24,254.81 109.92,251.80 C121.60,248.79 142.52,239.48 153.12,234.42 C163.71,229.35 167.11,227.19 173.49,221.42 C179.87,215.66 186.98,207.87 191.40,199.82 C195.82,191.78 201.38,176.29 200.00,173.13 C198.62,169.97 185.37,185.13 183.14,180.86 C180.92,176.59 187.45,158.56 186.65,147.50 C185.86,136.44 183.32,125.75 178.40,114.49 C173.49,103.22 161.37,82.65 157.16,79.89 C152.94,77.14 154.32,94.73 153.12,97.98 C151.92,101.23 153.76,107.26 149.96,99.39 C146.15,91.51 135.35,61.57 130.29,50.75 C125.23,39.92 125.96,40.68 119.58,34.42 C113.20,28.15 102.72,18.91 92.01,13.17 C81.30,7.43 59.94,-1.05 55.31,0.00 Z;M57.43,-8.50 C51.87,-6.92 56.59,13.94 58.07,20.85 C59.56,27.76 67.98,22.04 66.36,32.94 C64.73,43.85 52.87,71.82 48.32,86.28 C43.78,100.73 41.65,116.73 39.08,119.66 C36.50,122.59 36.67,108.53 32.87,103.85 C29.07,99.18 18.97,91.08 16.28,91.60 C13.60,92.12 19.66,97.09 16.76,107.00 C13.85,116.90 0.85,140.39 -1.16,151.04 C-3.18,161.69 0.59,162.21 4.66,170.89 C8.73,179.58 23.95,200.22 23.27,203.14 C22.58,206.05 1.16,187.32 0.56,188.37 C-0.04,189.43 12.36,201.42 19.67,209.45 C26.98,217.48 34.23,229.73 44.42,236.56 C54.61,243.39 70.10,248.06 80.81,250.45 C91.53,252.83 97.12,253.79 108.72,250.88 C120.32,247.96 139.57,238.40 150.42,232.95 C161.27,227.50 167.15,223.88 173.82,218.17 C180.49,212.45 186.28,206.43 190.44,198.65 C194.61,190.87 200.13,175.02 198.82,171.49 C197.52,167.96 184.57,182.07 182.63,177.46 C180.69,172.86 187.80,155.13 187.20,143.88 C186.60,132.62 183.99,120.40 179.04,109.92 C174.10,99.44 162.17,83.86 157.54,81.02 C152.91,78.19 152.78,90.25 151.26,92.92 C149.73,95.59 151.67,105.04 148.39,97.05 C145.11,89.05 137.36,55.18 131.55,44.96 C125.75,34.74 120.26,41.33 113.57,35.73 C106.88,30.14 100.77,18.77 91.42,11.40 C82.06,4.03 62.99,-10.07 57.43,-8.50 Z;M50.06,-5.81 C44.46,-3.39 61.18,14.77 63.05,22.36 C64.92,29.95 64.65,28.97 61.30,39.73 C57.94,50.48 46.28,73.38 42.90,86.89 C39.52,100.40 42.70,118.58 41.03,120.79 C39.36,123.00 36.01,104.15 32.87,100.15 C29.73,96.16 24.49,95.66 22.19,96.82 C19.90,97.98 22.52,98.12 19.12,107.11 C15.72,116.10 4.53,140.43 1.81,150.76 C-0.91,161.09 -0.49,160.43 2.78,169.07 C6.05,177.71 22.31,199.74 21.44,202.60 C20.56,205.46 -1.39,184.85 -2.48,186.23 C-3.57,187.61 6.23,202.94 14.90,210.90 C23.58,218.85 38.03,226.97 49.57,233.94 C61.11,240.92 74.31,250.29 84.16,252.75 C94.00,255.20 96.88,251.99 108.65,248.69 C120.42,245.39 144.16,237.97 154.75,232.97 C165.34,227.96 165.62,224.26 172.21,218.67 C178.80,213.07 189.64,207.55 194.30,199.41 C198.95,191.28 201.59,173.29 200.14,169.85 C198.69,166.41 187.56,182.31 185.62,178.76 C183.67,175.20 190.05,158.93 188.46,148.52 C186.87,138.11 180.65,127.98 176.07,116.31 C171.49,104.65 164.49,82.17 161.00,78.53 C157.50,74.88 156.60,91.36 155.09,94.46 C153.58,97.55 156.37,104.43 151.91,97.10 C147.45,89.77 133.95,60.97 128.32,50.49 C122.70,40.01 123.44,41.34 118.16,34.22 C112.89,27.11 108.01,14.47 96.66,7.79 C85.31,1.12 55.66,-8.24 50.06,-5.81 Z;M56.33,-2.43 C51.72,-0.98 66.15,13.64 67.67,20.53 C69.19,27.42 68.60,27.48 65.44,38.89 C62.29,50.31 53.14,75.31 48.73,89.02 C44.32,102.73 42.10,118.76 38.99,121.16 C35.88,123.57 33.18,108.05 30.06,103.45 C26.94,98.86 21.76,92.46 20.27,93.62 C18.78,94.77 24.18,100.87 21.12,110.37 C18.06,119.86 4.85,140.92 1.89,150.56 C-1.06,160.21 0.28,160.24 3.41,168.26 C6.54,176.28 21.05,196.14 20.68,198.68 C20.32,201.22 1.68,181.38 1.21,183.52 C0.75,185.66 10.43,203.24 17.88,211.54 C25.33,219.83 35.46,226.99 45.92,233.28 C56.39,239.57 69.75,246.69 80.69,249.28 C91.64,251.87 99.31,251.34 111.59,248.84 C123.87,246.35 144.04,238.66 154.38,234.31 C164.71,229.95 167.58,229.07 173.62,222.71 C179.67,216.34 186.24,204.85 190.64,196.12 C195.03,187.39 201.60,172.63 199.97,170.33 C198.35,168.03 183.26,186.15 180.89,182.32 C178.52,178.49 186.57,159.48 185.78,147.33 C184.98,135.18 180.10,120.66 176.10,109.43 C172.10,98.19 165.31,81.68 161.78,79.90 C158.25,78.12 157.17,95.87 154.94,98.74 C152.71,101.62 152.72,104.88 148.38,97.14 C144.04,89.40 134.05,63.44 128.88,52.29 C123.71,41.14 122.94,36.99 117.35,30.25 C111.76,23.51 105.50,17.31 95.33,11.86 C85.16,6.41 60.94,-3.87 56.33,-2.43 Z;M55.31,0.00 C50.69,1.05 62.60,13.11 64.27,19.49 C65.94,25.87 68.36,26.51 65.32,38.28 C62.28,50.04 50.28,76.21 46.01,90.08 C41.73,103.95 42.52,119.43 39.68,121.51 C36.85,123.59 32.54,106.94 28.97,102.55 C25.40,98.16 20.19,93.56 18.26,95.17 C16.33,96.78 20.43,103.10 17.38,112.20 C14.34,121.31 2.46,139.83 0.00,149.78 C-2.46,159.73 -1.26,163.21 2.63,171.91 C6.53,180.60 23.79,199.39 23.35,201.93 C22.91,204.48 1.11,185.31 0.00,187.18 C-1.11,189.05 8.90,204.98 16.68,213.17 C24.47,221.36 35.65,229.79 46.71,236.35 C57.77,242.90 72.52,249.93 83.06,252.50 C93.59,255.08 98.24,254.81 109.92,251.80 C121.60,248.79 142.52,239.48 153.12,234.42 C163.71,229.35 167.11,227.19 173.49,221.42 C179.87,215.66 186.98,207.87 191.40,199.82 C195.82,191.78 201.38,176.29 200.00,173.13 C198.62,169.97 185.37,185.13 183.14,180.86 C180.92,176.59 187.45,158.56 186.65,147.50 C185.86,136.44 183.32,125.75 178.40,114.49 C173.49,103.22 161.37,82.65 157.16,79.89 C152.94,77.14 154.32,94.73 153.12,97.98 C151.92,101.23 153.76,107.26 149.96,99.39 C146.15,91.51 135.35,61.57 130.29,50.75 C125.23,39.92 125.96,40.68 119.58,34.42 C113.20,28.15 102.72,18.91 92.01,13.17 C81.30,7.43 59.94,-1.05 55.31,0.00 Z"/></path>
        <path fill="#d72a00" d="M82.53,30.03 C79.69,31.23 84.11,42.29 83.93,47.41 C83.76,52.53 86.13,50.25 81.47,60.76 C76.82,71.26 61.87,94.91 56.01,110.45 C50.16,125.99 49.20,146.91 46.36,153.99 C43.52,161.08 41.29,156.01 38.98,152.94 C36.67,149.87 35.15,139.68 32.48,135.56 C29.82,131.43 24.85,120.87 23.00,128.18 C21.16,135.50 20.63,167.90 21.42,179.46 C22.21,191.02 25.02,192.13 27.74,197.54 C30.47,202.96 39.04,210.13 37.75,211.94 C36.46,213.75 21.07,206.88 20.02,208.43 C18.96,209.98 27.07,217.33 31.43,221.25 C35.79,225.17 37.81,227.48 46.18,231.96 C54.55,236.44 73.28,245.07 81.65,248.11 C90.02,251.16 87.56,251.86 96.40,250.22 C105.24,248.58 124.32,243.34 134.68,238.28 C145.04,233.22 153.41,224.73 158.56,219.84 C163.71,214.95 163.36,213.84 165.58,208.96 C167.81,204.07 170.47,199.97 171.91,190.52 C173.34,181.07 174.71,162.57 174.19,152.24 C173.66,141.91 172.05,135.38 168.74,128.53 C165.44,121.69 156.63,112.03 154.35,111.15 C152.06,110.27 155.75,119.87 155.05,123.27 C154.35,126.66 151.74,130.03 150.13,131.52 C148.52,133.01 146.91,132.81 145.39,132.22 C143.87,131.64 143.02,135.85 141.00,128.01 C138.98,120.16 136.90,96.93 133.27,85.16 C129.65,73.40 124.61,64.91 119.23,57.42 C113.84,49.93 107.08,44.78 100.97,40.21 C94.85,35.65 85.37,28.83 82.53,30.03 Z"><animate attributeName="d" dur="2.2s" begin="0.3s" repeatCount="indefinite" calcMode="linear" values="M82.53,30.03 C79.69,31.23 84.11,42.29 83.93,47.41 C83.76,52.53 86.13,50.25 81.47,60.76 C76.82,71.26 61.87,94.91 56.01,110.45 C50.16,125.99 49.20,146.91 46.36,153.99 C43.52,161.08 41.29,156.01 38.98,152.94 C36.67,149.87 35.15,139.68 32.48,135.56 C29.82,131.43 24.85,120.87 23.00,128.18 C21.16,135.50 20.63,167.90 21.42,179.46 C22.21,191.02 25.02,192.13 27.74,197.54 C30.47,202.96 39.04,210.13 37.75,211.94 C36.46,213.75 21.07,206.88 20.02,208.43 C18.96,209.98 27.07,217.33 31.43,221.25 C35.79,225.17 37.81,227.48 46.18,231.96 C54.55,236.44 73.28,245.07 81.65,248.11 C90.02,251.16 87.56,251.86 96.40,250.22 C105.24,248.58 124.32,243.34 134.68,238.28 C145.04,233.22 153.41,224.73 158.56,219.84 C163.71,214.95 163.36,213.84 165.58,208.96 C167.81,204.07 170.47,199.97 171.91,190.52 C173.34,181.07 174.71,162.57 174.19,152.24 C173.66,141.91 172.05,135.38 168.74,128.53 C165.44,121.69 156.63,112.03 154.35,111.15 C152.06,110.27 155.75,119.87 155.05,123.27 C154.35,126.66 151.74,130.03 150.13,131.52 C148.52,133.01 146.91,132.81 145.39,132.22 C143.87,131.64 143.02,135.85 141.00,128.01 C138.98,120.16 136.90,96.93 133.27,85.16 C129.65,73.40 124.61,64.91 119.23,57.42 C113.84,49.93 107.08,44.78 100.97,40.21 C94.85,35.65 85.37,28.83 82.53,30.03 Z;M84.41,22.49 C80.06,23.81 78.77,43.04 78.44,48.61 C78.11,54.19 85.81,46.20 82.41,55.94 C79.02,65.69 64.15,90.99 58.07,107.09 C51.98,123.18 48.60,144.74 45.88,152.53 C43.15,160.33 44.20,157.14 41.71,153.86 C39.23,150.57 34.18,137.89 30.97,132.83 C27.76,127.77 24.22,115.54 22.44,123.52 C20.66,131.49 19.05,168.53 20.28,180.70 C21.50,192.86 26.87,191.12 29.77,196.53 C32.67,201.94 39.20,210.96 37.67,213.14 C36.13,215.33 21.12,208.89 20.58,209.62 C20.04,210.35 30.53,213.77 34.42,217.53 C38.30,221.29 36.39,227.41 43.89,232.17 C51.39,236.92 70.86,243.20 79.41,246.06 C87.96,248.91 86.44,250.84 95.20,249.30 C103.96,247.75 121.37,242.27 131.98,236.81 C142.60,231.36 153.45,221.42 158.89,216.59 C164.33,211.75 162.66,212.40 164.63,207.78 C166.61,203.16 169.22,198.70 170.73,188.87 C172.24,179.05 173.90,159.60 173.68,148.84 C173.45,138.09 172.49,131.39 169.38,124.33 C166.27,117.27 157.34,106.52 155.00,106.48 C152.66,106.45 156.40,120.63 155.34,124.13 C154.28,127.63 150.51,126.43 148.64,127.46 C146.78,128.50 145.27,130.87 144.13,130.34 C142.99,129.82 144.40,131.65 141.81,124.29 C139.22,116.94 132.42,97.58 128.58,86.19 C124.73,74.80 122.75,63.55 118.74,55.96 C114.73,48.37 110.25,46.23 104.53,40.65 C98.81,35.07 88.76,21.16 84.41,22.49 Z;M77.87,24.87 C75.43,27.20 82.86,43.75 82.86,49.95 C82.85,56.15 82.78,52.45 77.85,62.06 C72.92,71.67 58.34,92.40 53.27,107.63 C48.20,122.86 49.35,146.15 47.42,153.42 C45.50,160.70 43.70,154.03 41.71,151.26 C39.72,148.49 38.35,141.42 35.49,136.82 C32.63,132.21 26.61,116.35 24.56,123.62 C22.51,130.88 22.65,168.57 23.21,180.42 C23.76,192.27 25.78,189.34 27.89,194.71 C29.99,200.07 37.56,210.48 35.84,212.61 C34.11,214.73 18.57,206.42 17.54,207.48 C16.51,208.54 24.40,215.29 29.65,218.97 C34.90,222.65 40.19,224.65 49.04,229.55 C57.89,234.45 75.07,245.43 82.75,248.36 C90.43,251.28 86.20,249.03 95.13,247.11 C104.06,245.19 125.95,241.83 136.31,236.83 C146.67,231.82 151.93,221.80 157.29,217.08 C162.65,212.37 166.03,213.52 168.49,208.55 C170.94,203.57 170.68,196.97 172.04,187.23 C173.41,177.50 176.86,159.72 176.66,150.14 C176.46,140.55 174.96,135.91 170.84,129.72 C166.72,123.53 154.10,114.27 151.96,113.02 C149.82,111.77 158.04,119.60 158.00,122.22 C157.95,124.83 153.55,127.34 151.71,128.70 C149.87,130.06 148.95,130.53 146.96,130.39 C144.96,130.24 142.20,135.40 139.74,127.84 C137.27,120.28 134.95,97.49 132.17,85.01 C129.39,72.54 128.84,61.16 123.07,52.98 C117.29,44.80 105.03,40.62 97.50,35.94 C89.96,31.25 80.31,22.53 77.87,24.87 Z;M83.43,27.87 C81.04,30.26 87.26,42.76 86.95,48.33 C86.64,53.90 86.34,51.11 81.58,61.31 C76.83,71.50 64.39,94.11 58.43,109.51 C52.46,124.92 48.92,146.38 45.81,153.72 C42.69,161.06 41.71,156.80 39.75,153.58 C37.78,150.35 36.25,138.88 34.02,134.37 C31.78,129.86 28.14,118.89 26.35,126.54 C24.56,134.18 22.93,169.00 23.29,180.23 C23.65,191.45 26.56,189.15 28.52,193.90 C30.49,198.64 36.30,206.88 35.08,208.69 C33.87,210.50 21.64,202.95 21.23,204.77 C20.82,206.59 28.60,215.59 32.63,219.61 C36.66,223.63 37.62,224.68 45.40,228.89 C53.17,233.10 70.51,241.83 79.29,244.89 C88.07,247.95 88.63,248.38 98.07,247.26 C107.51,246.14 125.83,242.53 135.94,238.17 C146.04,233.81 153.88,226.62 158.70,221.13 C163.51,215.64 162.63,210.82 164.82,205.25 C167.02,199.68 170.69,196.30 171.88,187.71 C173.06,179.12 172.63,163.59 171.93,153.70 C171.24,143.80 171.05,136.29 167.73,128.34 C164.40,120.39 153.52,106.82 152.00,105.98 C150.48,105.13 158.67,118.91 158.60,123.27 C158.53,127.63 154.00,130.94 151.59,132.13 C149.18,133.32 146.04,130.94 144.12,130.42 C142.21,129.90 142.20,137.08 140.10,129.00 C138.00,120.91 134.55,94.02 131.53,81.91 C128.51,69.80 127.00,64.32 121.96,56.34 C116.93,48.36 107.75,38.78 101.32,34.03 C94.90,29.29 85.83,25.49 83.43,27.87 Z;M82.53,30.03 C79.69,31.23 84.11,42.29 83.93,47.41 C83.76,52.53 86.13,50.25 81.47,60.76 C76.82,71.26 61.87,94.91 56.01,110.45 C50.16,125.99 49.20,146.91 46.36,153.99 C43.52,161.08 41.29,156.01 38.98,152.94 C36.67,149.87 35.15,139.68 32.48,135.56 C29.82,131.43 24.85,120.87 23.00,128.18 C21.16,135.50 20.63,167.90 21.42,179.46 C22.21,191.02 25.02,192.13 27.74,197.54 C30.47,202.96 39.04,210.13 37.75,211.94 C36.46,213.75 21.07,206.88 20.02,208.43 C18.96,209.98 27.07,217.33 31.43,221.25 C35.79,225.17 37.81,227.48 46.18,231.96 C54.55,236.44 73.28,245.07 81.65,248.11 C90.02,251.16 87.56,251.86 96.40,250.22 C105.24,248.58 124.32,243.34 134.68,238.28 C145.04,233.22 153.41,224.73 158.56,219.84 C163.71,214.95 163.36,213.84 165.58,208.96 C167.81,204.07 170.47,199.97 171.91,190.52 C173.34,181.07 174.71,162.57 174.19,152.24 C173.66,141.91 172.05,135.38 168.74,128.53 C165.44,121.69 156.63,112.03 154.35,111.15 C152.06,110.27 155.75,119.87 155.05,123.27 C154.35,126.66 151.74,130.03 150.13,131.52 C148.52,133.01 146.91,132.81 145.39,132.22 C143.87,131.64 143.02,135.85 141.00,128.01 C138.98,120.16 136.90,96.93 133.27,85.16 C129.65,73.40 124.61,64.91 119.23,57.42 C113.84,49.93 107.08,44.78 100.97,40.21 C94.85,35.65 85.37,28.83 82.53,30.03 Z"/></path>
      </svg>
    </div>
    <div class="flameStageReal">
      <svg viewBox="0 0 200 252.5" xmlns="http://www.w3.org/2000/svg">
        <path fill="#6f0900" d="M55.31,0.00 C50.69,1.05 62.60,13.11 64.27,19.49 C65.94,25.87 68.36,26.51 65.32,38.28 C62.28,50.04 50.28,76.21 46.01,90.08 C41.73,103.95 42.52,119.43 39.68,121.51 C36.85,123.59 32.54,106.94 28.97,102.55 C25.40,98.16 20.19,93.56 18.26,95.17 C16.33,96.78 20.43,103.10 17.38,112.20 C14.34,121.31 2.46,139.83 0.00,149.78 C-2.46,159.73 -1.26,163.21 2.63,171.91 C6.53,180.60 23.79,199.39 23.35,201.93 C22.91,204.48 1.11,185.31 0.00,187.18 C-1.11,189.05 8.90,204.98 16.68,213.17 C24.47,221.36 35.65,229.79 46.71,236.35 C57.77,242.90 72.52,249.93 83.06,252.50 C93.59,255.08 98.24,254.81 109.92,251.80 C121.60,248.79 142.52,239.48 153.12,234.42 C163.71,229.35 167.11,227.19 173.49,221.42 C179.87,215.66 186.98,207.87 191.40,199.82 C195.82,191.78 201.38,176.29 200.00,173.13 C198.62,169.97 185.37,185.13 183.14,180.86 C180.92,176.59 187.45,158.56 186.65,147.50 C185.86,136.44 183.32,125.75 178.40,114.49 C173.49,103.22 161.37,82.65 157.16,79.89 C152.94,77.14 154.32,94.73 153.12,97.98 C151.92,101.23 153.76,107.26 149.96,99.39 C146.15,91.51 135.35,61.57 130.29,50.75 C125.23,39.92 125.96,40.68 119.58,34.42 C113.20,28.15 102.72,18.91 92.01,13.17 C81.30,7.43 59.94,-1.05 55.31,0.00 Z"><animate attributeName="d" dur="1.9s" begin="0s" repeatCount="indefinite" calcMode="linear" values="M55.31,0.00 C50.69,1.05 62.60,13.11 64.27,19.49 C65.94,25.87 68.36,26.51 65.32,38.28 C62.28,50.04 50.28,76.21 46.01,90.08 C41.73,103.95 42.52,119.43 39.68,121.51 C36.85,123.59 32.54,106.94 28.97,102.55 C25.40,98.16 20.19,93.56 18.26,95.17 C16.33,96.78 20.43,103.10 17.38,112.20 C14.34,121.31 2.46,139.83 0.00,149.78 C-2.46,159.73 -1.26,163.21 2.63,171.91 C6.53,180.60 23.79,199.39 23.35,201.93 C22.91,204.48 1.11,185.31 0.00,187.18 C-1.11,189.05 8.90,204.98 16.68,213.17 C24.47,221.36 35.65,229.79 46.71,236.35 C57.77,242.90 72.52,249.93 83.06,252.50 C93.59,255.08 98.24,254.81 109.92,251.80 C121.60,248.79 142.52,239.48 153.12,234.42 C163.71,229.35 167.11,227.19 173.49,221.42 C179.87,215.66 186.98,207.87 191.40,199.82 C195.82,191.78 201.38,176.29 200.00,173.13 C198.62,169.97 185.37,185.13 183.14,180.86 C180.92,176.59 187.45,158.56 186.65,147.50 C185.86,136.44 183.32,125.75 178.40,114.49 C173.49,103.22 161.37,82.65 157.16,79.89 C152.94,77.14 154.32,94.73 153.12,97.98 C151.92,101.23 153.76,107.26 149.96,99.39 C146.15,91.51 135.35,61.57 130.29,50.75 C125.23,39.92 125.96,40.68 119.58,34.42 C113.20,28.15 102.72,18.91 92.01,13.17 C81.30,7.43 59.94,-1.05 55.31,0.00 Z;M57.43,-8.50 C51.87,-6.92 56.59,13.94 58.07,20.85 C59.56,27.76 67.98,22.04 66.36,32.94 C64.73,43.85 52.87,71.82 48.32,86.28 C43.78,100.73 41.65,116.73 39.08,119.66 C36.50,122.59 36.67,108.53 32.87,103.85 C29.07,99.18 18.97,91.08 16.28,91.60 C13.60,92.12 19.66,97.09 16.76,107.00 C13.85,116.90 0.85,140.39 -1.16,151.04 C-3.18,161.69 0.59,162.21 4.66,170.89 C8.73,179.58 23.95,200.22 23.27,203.14 C22.58,206.05 1.16,187.32 0.56,188.37 C-0.04,189.43 12.36,201.42 19.67,209.45 C26.98,217.48 34.23,229.73 44.42,236.56 C54.61,243.39 70.10,248.06 80.81,250.45 C91.53,252.83 97.12,253.79 108.72,250.88 C120.32,247.96 139.57,238.40 150.42,232.95 C161.27,227.50 167.15,223.88 173.82,218.17 C180.49,212.45 186.28,206.43 190.44,198.65 C194.61,190.87 200.13,175.02 198.82,171.49 C197.52,167.96 184.57,182.07 182.63,177.46 C180.69,172.86 187.80,155.13 187.20,143.88 C186.60,132.62 183.99,120.40 179.04,109.92 C174.10,99.44 162.17,83.86 157.54,81.02 C152.91,78.19 152.78,90.25 151.26,92.92 C149.73,95.59 151.67,105.04 148.39,97.05 C145.11,89.05 137.36,55.18 131.55,44.96 C125.75,34.74 120.26,41.33 113.57,35.73 C106.88,30.14 100.77,18.77 91.42,11.40 C82.06,4.03 62.99,-10.07 57.43,-8.50 Z;M50.06,-5.81 C44.46,-3.39 61.18,14.77 63.05,22.36 C64.92,29.95 64.65,28.97 61.30,39.73 C57.94,50.48 46.28,73.38 42.90,86.89 C39.52,100.40 42.70,118.58 41.03,120.79 C39.36,123.00 36.01,104.15 32.87,100.15 C29.73,96.16 24.49,95.66 22.19,96.82 C19.90,97.98 22.52,98.12 19.12,107.11 C15.72,116.10 4.53,140.43 1.81,150.76 C-0.91,161.09 -0.49,160.43 2.78,169.07 C6.05,177.71 22.31,199.74 21.44,202.60 C20.56,205.46 -1.39,184.85 -2.48,186.23 C-3.57,187.61 6.23,202.94 14.90,210.90 C23.58,218.85 38.03,226.97 49.57,233.94 C61.11,240.92 74.31,250.29 84.16,252.75 C94.00,255.20 96.88,251.99 108.65,248.69 C120.42,245.39 144.16,237.97 154.75,232.97 C165.34,227.96 165.62,224.26 172.21,218.67 C178.80,213.07 189.64,207.55 194.30,199.41 C198.95,191.28 201.59,173.29 200.14,169.85 C198.69,166.41 187.56,182.31 185.62,178.76 C183.67,175.20 190.05,158.93 188.46,148.52 C186.87,138.11 180.65,127.98 176.07,116.31 C171.49,104.65 164.49,82.17 161.00,78.53 C157.50,74.88 156.60,91.36 155.09,94.46 C153.58,97.55 156.37,104.43 151.91,97.10 C147.45,89.77 133.95,60.97 128.32,50.49 C122.70,40.01 123.44,41.34 118.16,34.22 C112.89,27.11 108.01,14.47 96.66,7.79 C85.31,1.12 55.66,-8.24 50.06,-5.81 Z;M56.33,-2.43 C51.72,-0.98 66.15,13.64 67.67,20.53 C69.19,27.42 68.60,27.48 65.44,38.89 C62.29,50.31 53.14,75.31 48.73,89.02 C44.32,102.73 42.10,118.76 38.99,121.16 C35.88,123.57 33.18,108.05 30.06,103.45 C26.94,98.86 21.76,92.46 20.27,93.62 C18.78,94.77 24.18,100.87 21.12,110.37 C18.06,119.86 4.85,140.92 1.89,150.56 C-1.06,160.21 0.28,160.24 3.41,168.26 C6.54,176.28 21.05,196.14 20.68,198.68 C20.32,201.22 1.68,181.38 1.21,183.52 C0.75,185.66 10.43,203.24 17.88,211.54 C25.33,219.83 35.46,226.99 45.92,233.28 C56.39,239.57 69.75,246.69 80.69,249.28 C91.64,251.87 99.31,251.34 111.59,248.84 C123.87,246.35 144.04,238.66 154.38,234.31 C164.71,229.95 167.58,229.07 173.62,222.71 C179.67,216.34 186.24,204.85 190.64,196.12 C195.03,187.39 201.60,172.63 199.97,170.33 C198.35,168.03 183.26,186.15 180.89,182.32 C178.52,178.49 186.57,159.48 185.78,147.33 C184.98,135.18 180.10,120.66 176.10,109.43 C172.10,98.19 165.31,81.68 161.78,79.90 C158.25,78.12 157.17,95.87 154.94,98.74 C152.71,101.62 152.72,104.88 148.38,97.14 C144.04,89.40 134.05,63.44 128.88,52.29 C123.71,41.14 122.94,36.99 117.35,30.25 C111.76,23.51 105.50,17.31 95.33,11.86 C85.16,6.41 60.94,-3.87 56.33,-2.43 Z;M55.31,0.00 C50.69,1.05 62.60,13.11 64.27,19.49 C65.94,25.87 68.36,26.51 65.32,38.28 C62.28,50.04 50.28,76.21 46.01,90.08 C41.73,103.95 42.52,119.43 39.68,121.51 C36.85,123.59 32.54,106.94 28.97,102.55 C25.40,98.16 20.19,93.56 18.26,95.17 C16.33,96.78 20.43,103.10 17.38,112.20 C14.34,121.31 2.46,139.83 0.00,149.78 C-2.46,159.73 -1.26,163.21 2.63,171.91 C6.53,180.60 23.79,199.39 23.35,201.93 C22.91,204.48 1.11,185.31 0.00,187.18 C-1.11,189.05 8.90,204.98 16.68,213.17 C24.47,221.36 35.65,229.79 46.71,236.35 C57.77,242.90 72.52,249.93 83.06,252.50 C93.59,255.08 98.24,254.81 109.92,251.80 C121.60,248.79 142.52,239.48 153.12,234.42 C163.71,229.35 167.11,227.19 173.49,221.42 C179.87,215.66 186.98,207.87 191.40,199.82 C195.82,191.78 201.38,176.29 200.00,173.13 C198.62,169.97 185.37,185.13 183.14,180.86 C180.92,176.59 187.45,158.56 186.65,147.50 C185.86,136.44 183.32,125.75 178.40,114.49 C173.49,103.22 161.37,82.65 157.16,79.89 C152.94,77.14 154.32,94.73 153.12,97.98 C151.92,101.23 153.76,107.26 149.96,99.39 C146.15,91.51 135.35,61.57 130.29,50.75 C125.23,39.92 125.96,40.68 119.58,34.42 C113.20,28.15 102.72,18.91 92.01,13.17 C81.30,7.43 59.94,-1.05 55.31,0.00 Z"/></path>
        <path fill="#d72a00" d="M82.53,30.03 C79.69,31.23 84.11,42.29 83.93,47.41 C83.76,52.53 86.13,50.25 81.47,60.76 C76.82,71.26 61.87,94.91 56.01,110.45 C50.16,125.99 49.20,146.91 46.36,153.99 C43.52,161.08 41.29,156.01 38.98,152.94 C36.67,149.87 35.15,139.68 32.48,135.56 C29.82,131.43 24.85,120.87 23.00,128.18 C21.16,135.50 20.63,167.90 21.42,179.46 C22.21,191.02 25.02,192.13 27.74,197.54 C30.47,202.96 39.04,210.13 37.75,211.94 C36.46,213.75 21.07,206.88 20.02,208.43 C18.96,209.98 27.07,217.33 31.43,221.25 C35.79,225.17 37.81,227.48 46.18,231.96 C54.55,236.44 73.28,245.07 81.65,248.11 C90.02,251.16 87.56,251.86 96.40,250.22 C105.24,248.58 124.32,243.34 134.68,238.28 C145.04,233.22 153.41,224.73 158.56,219.84 C163.71,214.95 163.36,213.84 165.58,208.96 C167.81,204.07 170.47,199.97 171.91,190.52 C173.34,181.07 174.71,162.57 174.19,152.24 C173.66,141.91 172.05,135.38 168.74,128.53 C165.44,121.69 156.63,112.03 154.35,111.15 C152.06,110.27 155.75,119.87 155.05,123.27 C154.35,126.66 151.74,130.03 150.13,131.52 C148.52,133.01 146.91,132.81 145.39,132.22 C143.87,131.64 143.02,135.85 141.00,128.01 C138.98,120.16 136.90,96.93 133.27,85.16 C129.65,73.40 124.61,64.91 119.23,57.42 C113.84,49.93 107.08,44.78 100.97,40.21 C94.85,35.65 85.37,28.83 82.53,30.03 Z"><animate attributeName="d" dur="2.2s" begin="0.3s" repeatCount="indefinite" calcMode="linear" values="M82.53,30.03 C79.69,31.23 84.11,42.29 83.93,47.41 C83.76,52.53 86.13,50.25 81.47,60.76 C76.82,71.26 61.87,94.91 56.01,110.45 C50.16,125.99 49.20,146.91 46.36,153.99 C43.52,161.08 41.29,156.01 38.98,152.94 C36.67,149.87 35.15,139.68 32.48,135.56 C29.82,131.43 24.85,120.87 23.00,128.18 C21.16,135.50 20.63,167.90 21.42,179.46 C22.21,191.02 25.02,192.13 27.74,197.54 C30.47,202.96 39.04,210.13 37.75,211.94 C36.46,213.75 21.07,206.88 20.02,208.43 C18.96,209.98 27.07,217.33 31.43,221.25 C35.79,225.17 37.81,227.48 46.18,231.96 C54.55,236.44 73.28,245.07 81.65,248.11 C90.02,251.16 87.56,251.86 96.40,250.22 C105.24,248.58 124.32,243.34 134.68,238.28 C145.04,233.22 153.41,224.73 158.56,219.84 C163.71,214.95 163.36,213.84 165.58,208.96 C167.81,204.07 170.47,199.97 171.91,190.52 C173.34,181.07 174.71,162.57 174.19,152.24 C173.66,141.91 172.05,135.38 168.74,128.53 C165.44,121.69 156.63,112.03 154.35,111.15 C152.06,110.27 155.75,119.87 155.05,123.27 C154.35,126.66 151.74,130.03 150.13,131.52 C148.52,133.01 146.91,132.81 145.39,132.22 C143.87,131.64 143.02,135.85 141.00,128.01 C138.98,120.16 136.90,96.93 133.27,85.16 C129.65,73.40 124.61,64.91 119.23,57.42 C113.84,49.93 107.08,44.78 100.97,40.21 C94.85,35.65 85.37,28.83 82.53,30.03 Z;M84.41,22.49 C80.06,23.81 78.77,43.04 78.44,48.61 C78.11,54.19 85.81,46.20 82.41,55.94 C79.02,65.69 64.15,90.99 58.07,107.09 C51.98,123.18 48.60,144.74 45.88,152.53 C43.15,160.33 44.20,157.14 41.71,153.86 C39.23,150.57 34.18,137.89 30.97,132.83 C27.76,127.77 24.22,115.54 22.44,123.52 C20.66,131.49 19.05,168.53 20.28,180.70 C21.50,192.86 26.87,191.12 29.77,196.53 C32.67,201.94 39.20,210.96 37.67,213.14 C36.13,215.33 21.12,208.89 20.58,209.62 C20.04,210.35 30.53,213.77 34.42,217.53 C38.30,221.29 36.39,227.41 43.89,232.17 C51.39,236.92 70.86,243.20 79.41,246.06 C87.96,248.91 86.44,250.84 95.20,249.30 C103.96,247.75 121.37,242.27 131.98,236.81 C142.60,231.36 153.45,221.42 158.89,216.59 C164.33,211.75 162.66,212.40 164.63,207.78 C166.61,203.16 169.22,198.70 170.73,188.87 C172.24,179.05 173.90,159.60 173.68,148.84 C173.45,138.09 172.49,131.39 169.38,124.33 C166.27,117.27 157.34,106.52 155.00,106.48 C152.66,106.45 156.40,120.63 155.34,124.13 C154.28,127.63 150.51,126.43 148.64,127.46 C146.78,128.50 145.27,130.87 144.13,130.34 C142.99,129.82 144.40,131.65 141.81,124.29 C139.22,116.94 132.42,97.58 128.58,86.19 C124.73,74.80 122.75,63.55 118.74,55.96 C114.73,48.37 110.25,46.23 104.53,40.65 C98.81,35.07 88.76,21.16 84.41,22.49 Z;M77.87,24.87 C75.43,27.20 82.86,43.75 82.86,49.95 C82.85,56.15 82.78,52.45 77.85,62.06 C72.92,71.67 58.34,92.40 53.27,107.63 C48.20,122.86 49.35,146.15 47.42,153.42 C45.50,160.70 43.70,154.03 41.71,151.26 C39.72,148.49 38.35,141.42 35.49,136.82 C32.63,132.21 26.61,116.35 24.56,123.62 C22.51,130.88 22.65,168.57 23.21,180.42 C23.76,192.27 25.78,189.34 27.89,194.71 C29.99,200.07 37.56,210.48 35.84,212.61 C34.11,214.73 18.57,206.42 17.54,207.48 C16.51,208.54 24.40,215.29 29.65,218.97 C34.90,222.65 40.19,224.65 49.04,229.55 C57.89,234.45 75.07,245.43 82.75,248.36 C90.43,251.28 86.20,249.03 95.13,247.11 C104.06,245.19 125.95,241.83 136.31,236.83 C146.67,231.82 151.93,221.80 157.29,217.08 C162.65,212.37 166.03,213.52 168.49,208.55 C170.94,203.57 170.68,196.97 172.04,187.23 C173.41,177.50 176.86,159.72 176.66,150.14 C176.46,140.55 174.96,135.91 170.84,129.72 C166.72,123.53 154.10,114.27 151.96,113.02 C149.82,111.77 158.04,119.60 158.00,122.22 C157.95,124.83 153.55,127.34 151.71,128.70 C149.87,130.06 148.95,130.53 146.96,130.39 C144.96,130.24 142.20,135.40 139.74,127.84 C137.27,120.28 134.95,97.49 132.17,85.01 C129.39,72.54 128.84,61.16 123.07,52.98 C117.29,44.80 105.03,40.62 97.50,35.94 C89.96,31.25 80.31,22.53 77.87,24.87 Z;M83.43,27.87 C81.04,30.26 87.26,42.76 86.95,48.33 C86.64,53.90 86.34,51.11 81.58,61.31 C76.83,71.50 64.39,94.11 58.43,109.51 C52.46,124.92 48.92,146.38 45.81,153.72 C42.69,161.06 41.71,156.80 39.75,153.58 C37.78,150.35 36.25,138.88 34.02,134.37 C31.78,129.86 28.14,118.89 26.35,126.54 C24.56,134.18 22.93,169.00 23.29,180.23 C23.65,191.45 26.56,189.15 28.52,193.90 C30.49,198.64 36.30,206.88 35.08,208.69 C33.87,210.50 21.64,202.95 21.23,204.77 C20.82,206.59 28.60,215.59 32.63,219.61 C36.66,223.63 37.62,224.68 45.40,228.89 C53.17,233.10 70.51,241.83 79.29,244.89 C88.07,247.95 88.63,248.38 98.07,247.26 C107.51,246.14 125.83,242.53 135.94,238.17 C146.04,233.81 153.88,226.62 158.70,221.13 C163.51,215.64 162.63,210.82 164.82,205.25 C167.02,199.68 170.69,196.30 171.88,187.71 C173.06,179.12 172.63,163.59 171.93,153.70 C171.24,143.80 171.05,136.29 167.73,128.34 C164.40,120.39 153.52,106.82 152.00,105.98 C150.48,105.13 158.67,118.91 158.60,123.27 C158.53,127.63 154.00,130.94 151.59,132.13 C149.18,133.32 146.04,130.94 144.12,130.42 C142.21,129.90 142.20,137.08 140.10,129.00 C138.00,120.91 134.55,94.02 131.53,81.91 C128.51,69.80 127.00,64.32 121.96,56.34 C116.93,48.36 107.75,38.78 101.32,34.03 C94.90,29.29 85.83,25.49 83.43,27.87 Z;M82.53,30.03 C79.69,31.23 84.11,42.29 83.93,47.41 C83.76,52.53 86.13,50.25 81.47,60.76 C76.82,71.26 61.87,94.91 56.01,110.45 C50.16,125.99 49.20,146.91 46.36,153.99 C43.52,161.08 41.29,156.01 38.98,152.94 C36.67,149.87 35.15,139.68 32.48,135.56 C29.82,131.43 24.85,120.87 23.00,128.18 C21.16,135.50 20.63,167.90 21.42,179.46 C22.21,191.02 25.02,192.13 27.74,197.54 C30.47,202.96 39.04,210.13 37.75,211.94 C36.46,213.75 21.07,206.88 20.02,208.43 C18.96,209.98 27.07,217.33 31.43,221.25 C35.79,225.17 37.81,227.48 46.18,231.96 C54.55,236.44 73.28,245.07 81.65,248.11 C90.02,251.16 87.56,251.86 96.40,250.22 C105.24,248.58 124.32,243.34 134.68,238.28 C145.04,233.22 153.41,224.73 158.56,219.84 C163.71,214.95 163.36,213.84 165.58,208.96 C167.81,204.07 170.47,199.97 171.91,190.52 C173.34,181.07 174.71,162.57 174.19,152.24 C173.66,141.91 172.05,135.38 168.74,128.53 C165.44,121.69 156.63,112.03 154.35,111.15 C152.06,110.27 155.75,119.87 155.05,123.27 C154.35,126.66 151.74,130.03 150.13,131.52 C148.52,133.01 146.91,132.81 145.39,132.22 C143.87,131.64 143.02,135.85 141.00,128.01 C138.98,120.16 136.90,96.93 133.27,85.16 C129.65,73.40 124.61,64.91 119.23,57.42 C113.84,49.93 107.08,44.78 100.97,40.21 C94.85,35.65 85.37,28.83 82.53,30.03 Z"/></path>
        <path fill="#e19400" d="M93.42,57.59 C91.45,59.09 94.88,69.94 94.64,75.50 C94.41,81.07 93.71,85.25 92.01,90.96 C90.31,96.66 90.52,97.66 84.46,109.75 C78.40,121.83 61.28,151.68 55.66,163.48 C50.04,175.27 51.83,174.36 50.75,180.51 C49.66,186.65 48.84,193.85 49.17,200.35 C49.49,206.85 50.31,213.49 52.68,219.49 C55.05,225.49 58.79,231.67 63.39,236.35 C67.98,241.03 74.74,245.27 80.25,247.59 C85.75,249.90 91.51,250.25 96.40,250.22 C101.29,250.19 105.38,248.93 109.57,247.41 C113.75,245.89 119.08,242.03 121.51,241.09 C123.94,240.15 121.07,243.84 124.14,241.79 C127.22,239.74 136.11,232.78 139.95,228.80 C143.78,224.82 144.89,222.27 147.15,217.91 C149.40,213.55 151.89,209.57 153.47,202.63 C155.05,195.70 156.75,183.64 156.63,176.29 C156.51,168.95 154.78,163.80 152.77,158.56 C150.75,153.32 146.91,148.02 144.51,144.86 C142.11,141.70 139.42,139.36 138.37,139.60 C137.31,139.83 138.60,144.75 138.19,146.27 C137.78,147.79 136.96,148.46 135.91,148.73 C134.86,148.99 133.01,148.64 131.87,147.85 C130.73,147.06 130.03,146.94 129.06,143.99 C128.09,141.03 126.78,137.34 126.08,130.11 C125.37,122.89 126.10,108.55 124.85,100.61 C123.59,92.68 121.60,88.21 118.53,82.53 C115.45,76.85 110.59,70.71 106.41,66.55 C102.22,62.39 95.38,56.10 93.42,57.59 Z"><animate attributeName="d" dur="1.7s" begin="0.15s" repeatCount="indefinite" calcMode="linear" values="M93.42,57.59 C91.45,59.09 94.88,69.94 94.64,75.50 C94.41,81.07 93.71,85.25 92.01,90.96 C90.31,96.66 90.52,97.66 84.46,109.75 C78.40,121.83 61.28,151.68 55.66,163.48 C50.04,175.27 51.83,174.36 50.75,180.51 C49.66,186.65 48.84,193.85 49.17,200.35 C49.49,206.85 50.31,213.49 52.68,219.49 C55.05,225.49 58.79,231.67 63.39,236.35 C67.98,241.03 74.74,245.27 80.25,247.59 C85.75,249.90 91.51,250.25 96.40,250.22 C101.29,250.19 105.38,248.93 109.57,247.41 C113.75,245.89 119.08,242.03 121.51,241.09 C123.94,240.15 121.07,243.84 124.14,241.79 C127.22,239.74 136.11,232.78 139.95,228.80 C143.78,224.82 144.89,222.27 147.15,217.91 C149.40,213.55 151.89,209.57 153.47,202.63 C155.05,195.70 156.75,183.64 156.63,176.29 C156.51,168.95 154.78,163.80 152.77,158.56 C150.75,153.32 146.91,148.02 144.51,144.86 C142.11,141.70 139.42,139.36 138.37,139.60 C137.31,139.83 138.60,144.75 138.19,146.27 C137.78,147.79 136.96,148.46 135.91,148.73 C134.86,148.99 133.01,148.64 131.87,147.85 C130.73,147.06 130.03,146.94 129.06,143.99 C128.09,141.03 126.78,137.34 126.08,130.11 C125.37,122.89 126.10,108.55 124.85,100.61 C123.59,92.68 121.60,88.21 118.53,82.53 C115.45,76.85 110.59,70.71 106.41,66.55 C102.22,62.39 95.38,56.10 93.42,57.59 Z;M95.08,50.93 C92.40,52.83 90.24,70.57 89.86,76.55 C89.48,82.54 93.37,81.88 92.81,86.85 C92.25,91.82 92.79,93.84 86.52,106.37 C80.25,118.90 60.69,149.50 55.18,162.01 C49.68,174.52 54.70,175.43 53.48,181.43 C52.25,187.42 48.05,192.26 47.84,197.96 C47.63,203.65 49.81,209.01 52.21,215.61 C54.61,222.22 57.23,232.43 62.24,237.59 C67.25,242.75 76.60,244.27 82.28,246.58 C87.95,248.88 91.67,251.09 96.31,251.42 C100.96,251.76 105.43,250.94 110.13,248.60 C114.83,246.26 122.54,238.47 124.50,237.37 C126.45,236.27 119.65,243.77 121.86,242.00 C124.06,240.23 133.69,230.91 137.70,226.74 C141.72,222.57 143.77,221.25 145.95,216.99 C148.12,212.72 148.94,208.49 150.77,201.17 C152.61,193.84 156.79,180.34 156.96,173.04 C157.13,165.74 154.10,162.37 151.81,157.38 C149.53,152.40 145.60,146.71 143.27,143.13 C140.93,139.54 138.56,135.93 137.80,135.85 C137.05,135.76 138.98,141.05 138.74,142.61 C138.51,144.17 137.51,144.20 136.40,145.19 C135.30,146.18 133.56,149.38 132.11,148.57 C130.66,147.75 128.93,143.70 127.71,140.31 C126.49,136.91 125.11,135.56 124.80,128.21 C124.48,120.85 127.66,103.61 125.82,96.17 C123.98,88.73 117.07,88.74 113.76,83.57 C110.45,78.40 109.05,70.59 105.94,65.15 C102.83,59.71 97.76,49.03 95.08,50.93 Z;M89.30,53.04 C86.57,55.61 93.77,71.22 93.70,77.72 C93.64,84.23 90.92,87.21 88.92,92.07 C86.92,96.94 87.07,95.11 81.70,106.92 C76.34,118.72 61.43,150.92 56.73,162.91 C52.02,174.89 54.30,172.41 53.48,178.83 C52.65,185.26 51.72,195.31 51.80,201.46 C51.89,207.60 51.74,209.72 53.97,215.70 C56.20,221.67 60.77,232.47 65.17,237.31 C69.58,242.15 75.50,242.49 80.39,244.75 C85.27,247.01 90.03,250.60 94.49,250.88 C98.94,251.17 102.89,248.47 107.09,246.46 C111.30,244.45 116.41,239.99 119.73,238.82 C123.05,237.64 123.45,241.01 127.01,239.38 C130.56,237.76 137.90,233.14 141.05,229.04 C144.19,224.94 143.53,219.44 145.88,214.80 C148.22,210.16 153.52,208.06 155.10,201.18 C156.68,194.31 155.26,180.71 155.36,173.54 C155.45,166.37 157.45,163.51 155.67,158.15 C153.88,152.79 147.09,144.87 144.66,141.39 C142.23,137.91 141.87,136.29 141.10,137.28 C140.32,138.26 141.18,145.16 140.02,147.30 C138.85,149.45 135.05,150.20 134.10,150.14 C133.15,150.09 134.91,148.43 134.31,146.98 C133.71,145.53 131.60,144.55 130.49,141.43 C129.39,138.30 128.86,135.08 127.67,128.25 C126.47,121.41 125.05,108.06 123.34,100.42 C121.62,92.77 119.61,88.73 117.40,82.38 C115.19,76.02 114.76,67.20 110.08,62.31 C105.40,57.42 92.03,50.47 89.30,53.04 Z;M94.21,55.69 C92.25,57.49 97.63,70.35 97.27,76.31 C96.92,82.26 93.84,86.01 92.10,91.43 C90.37,96.84 93.05,96.84 86.88,108.81 C80.72,120.77 61.01,151.15 55.11,163.20 C49.22,175.26 52.28,175.13 51.51,181.15 C50.74,187.16 49.85,193.15 50.51,199.31 C51.17,205.47 53.00,211.82 55.46,218.12 C57.92,224.42 61.00,232.82 65.26,237.12 C69.52,241.42 76.28,242.30 81.02,243.94 C85.77,245.58 88.77,247.00 93.73,246.97 C98.69,246.94 105.95,245.00 110.78,243.75 C115.61,242.50 120.62,240.29 122.71,239.46 C124.81,238.62 120.88,241.04 123.36,238.72 C125.84,236.41 133.34,229.54 137.59,225.57 C141.83,221.61 145.96,218.79 148.81,214.95 C151.67,211.11 153.40,208.75 154.73,202.52 C156.05,196.30 157.22,185.53 156.77,177.58 C156.31,169.64 154.05,160.80 152.01,154.85 C149.96,148.90 147.17,144.17 144.48,141.90 C141.80,139.62 137.08,140.51 135.88,141.21 C134.68,141.91 137.60,145.50 137.30,146.10 C137.01,146.70 134.54,144.52 134.13,144.81 C133.71,145.10 135.43,147.90 134.81,147.86 C134.19,147.81 132.06,147.80 130.38,144.54 C128.71,141.28 125.89,135.41 124.79,128.28 C123.68,121.16 125.10,109.98 123.76,101.80 C122.42,93.62 119.21,85.28 116.76,79.23 C114.30,73.18 112.78,69.44 109.03,65.52 C105.27,61.59 96.17,53.89 94.21,55.69 Z;M93.42,57.59 C91.45,59.09 94.88,69.94 94.64,75.50 C94.41,81.07 93.71,85.25 92.01,90.96 C90.31,96.66 90.52,97.66 84.46,109.75 C78.40,121.83 61.28,151.68 55.66,163.48 C50.04,175.27 51.83,174.36 50.75,180.51 C49.66,186.65 48.84,193.85 49.17,200.35 C49.49,206.85 50.31,213.49 52.68,219.49 C55.05,225.49 58.79,231.67 63.39,236.35 C67.98,241.03 74.74,245.27 80.25,247.59 C85.75,249.90 91.51,250.25 96.40,250.22 C101.29,250.19 105.38,248.93 109.57,247.41 C113.75,245.89 119.08,242.03 121.51,241.09 C123.94,240.15 121.07,243.84 124.14,241.79 C127.22,239.74 136.11,232.78 139.95,228.80 C143.78,224.82 144.89,222.27 147.15,217.91 C149.40,213.55 151.89,209.57 153.47,202.63 C155.05,195.70 156.75,183.64 156.63,176.29 C156.51,168.95 154.78,163.80 152.77,158.56 C150.75,153.32 146.91,148.02 144.51,144.86 C142.11,141.70 139.42,139.36 138.37,139.60 C137.31,139.83 138.60,144.75 138.19,146.27 C137.78,147.79 136.96,148.46 135.91,148.73 C134.86,148.99 133.01,148.64 131.87,147.85 C130.73,147.06 130.03,146.94 129.06,143.99 C128.09,141.03 126.78,137.34 126.08,130.11 C125.37,122.89 126.10,108.55 124.85,100.61 C123.59,92.68 121.60,88.21 118.53,82.53 C115.45,76.85 110.59,70.71 106.41,66.55 C102.22,62.39 95.38,56.10 93.42,57.59 Z"/></path>
        <path fill="#ffda41" d="M103.07,112.03 C101.49,111.65 102.28,120.98 101.14,125.20 C100.00,129.41 98.42,132.72 96.22,137.31 C94.03,141.91 92.92,144.95 87.97,152.77 C83.03,160.58 70.94,177.00 66.55,184.20 C62.16,191.40 62.83,192.24 61.63,195.96 C60.43,199.68 59.58,202.02 59.35,206.50 C59.12,210.97 59.06,217.79 60.23,222.83 C61.40,227.86 63.59,232.87 66.37,236.70 C69.15,240.53 72.87,243.63 76.91,245.83 C80.95,248.02 85.57,249.49 90.61,249.87 C95.64,250.25 101.79,249.75 107.11,248.11 C112.44,246.47 118.73,242.93 122.56,240.04 C126.40,237.14 128.21,234.53 130.11,230.73 C132.02,226.92 133.39,221.95 133.98,217.21 C134.56,212.47 134.68,208.05 133.63,202.28 C132.57,196.52 129.15,184.46 127.66,182.62 C126.16,180.77 125.67,189.29 124.67,191.22 C123.68,193.15 122.91,194.03 121.69,194.21 C120.46,194.38 118.47,193.62 117.30,192.27 C116.13,190.93 115.16,194.44 114.66,186.13 C114.16,177.82 114.98,152.18 114.31,142.41 C113.64,132.63 112.50,132.54 110.62,127.48 C108.75,122.42 104.65,112.41 103.07,112.03 Z"><animate attributeName="d" dur="1.5s" begin="0.5s" repeatCount="indefinite" calcMode="linear" values="M103.07,112.03 C101.49,111.65 102.28,120.98 101.14,125.20 C100.00,129.41 98.42,132.72 96.22,137.31 C94.03,141.91 92.92,144.95 87.97,152.77 C83.03,160.58 70.94,177.00 66.55,184.20 C62.16,191.40 62.83,192.24 61.63,195.96 C60.43,199.68 59.58,202.02 59.35,206.50 C59.12,210.97 59.06,217.79 60.23,222.83 C61.40,227.86 63.59,232.87 66.37,236.70 C69.15,240.53 72.87,243.63 76.91,245.83 C80.95,248.02 85.57,249.49 90.61,249.87 C95.64,250.25 101.79,249.75 107.11,248.11 C112.44,246.47 118.73,242.93 122.56,240.04 C126.40,237.14 128.21,234.53 130.11,230.73 C132.02,226.92 133.39,221.95 133.98,217.21 C134.56,212.47 134.68,208.05 133.63,202.28 C132.57,196.52 129.15,184.46 127.66,182.62 C126.16,180.77 125.67,189.29 124.67,191.22 C123.68,193.15 122.91,194.03 121.69,194.21 C120.46,194.38 118.47,193.62 117.30,192.27 C116.13,190.93 115.16,194.44 114.66,186.13 C114.16,177.82 114.98,152.18 114.31,142.41 C113.64,132.63 112.50,132.54 110.62,127.48 C108.75,122.42 104.65,112.41 103.07,112.03 Z;M104.30,107.10 C102.03,107.55 98.85,121.44 97.60,125.97 C96.35,130.51 98.17,130.24 96.81,134.29 C95.46,138.35 94.61,142.22 89.48,150.29 C84.36,158.36 70.26,174.97 66.07,182.73 C61.88,190.50 65.71,193.32 64.36,196.88 C63.02,200.44 58.79,200.42 58.02,204.10 C57.25,207.78 58.56,213.31 59.76,218.95 C60.96,224.59 62.03,233.63 65.23,237.94 C68.42,242.25 74.72,242.63 78.94,244.82 C83.15,247.01 85.73,250.32 90.52,251.07 C95.31,251.82 101.83,251.76 107.67,249.30 C113.51,246.84 122.19,239.38 125.55,236.32 C128.91,233.26 126.79,234.47 127.83,230.94 C128.86,227.41 130.97,220.08 131.73,215.15 C132.50,210.22 133.56,207.03 132.43,201.36 C131.30,195.69 126.20,183.38 124.96,181.15 C123.72,178.92 125.71,185.98 125.00,187.96 C124.30,189.94 122.21,192.59 120.73,193.03 C119.25,193.47 117.22,192.35 116.12,190.63 C115.02,188.91 114.36,191.40 114.15,182.73 C113.94,174.07 115.37,148.53 114.88,138.63 C114.39,128.72 112.97,128.56 111.21,123.31 C109.44,118.05 106.57,106.66 104.30,107.10 Z;M100.03,108.66 C98.69,108.27 101.46,121.92 100.45,126.84 C99.43,131.75 96.36,134.16 93.95,138.13 C91.53,142.11 90.34,143.11 85.95,150.69 C81.56,158.27 71.21,176.36 67.62,183.63 C64.02,190.89 65.30,190.29 64.36,194.28 C63.42,198.28 62.46,203.48 61.99,207.60 C61.51,211.73 60.49,214.02 61.52,219.03 C62.55,224.04 65.57,233.67 68.16,237.66 C70.75,241.66 73.63,240.85 77.05,242.99 C80.47,245.14 84.09,249.84 88.69,250.53 C93.29,251.23 99.29,249.29 104.63,247.16 C109.98,245.03 116.06,240.90 120.78,237.76 C125.51,234.62 130.59,231.71 132.98,228.32 C135.36,224.94 135.18,222.31 135.08,217.45 C134.97,212.59 133.32,205.22 132.36,199.17 C131.39,193.13 130.78,182.95 129.29,181.17 C127.80,179.38 124.18,186.36 123.40,188.46 C122.61,190.57 125.58,193.71 124.59,193.80 C123.59,193.88 118.68,190.62 117.43,188.99 C116.19,187.36 117.34,191.61 117.14,184.03 C116.93,176.44 117.63,152.62 116.19,143.47 C114.75,134.33 111.18,134.95 108.49,129.15 C105.80,123.35 101.37,109.05 100.03,108.66 Z;M103.66,110.62 C102.76,111.11 104.31,121.29 103.09,125.79 C101.86,130.30 98.52,133.28 96.29,137.66 C94.07,142.04 94.80,144.37 89.75,152.08 C84.70,159.79 70.56,176.50 66.00,183.92 C61.44,191.34 63.28,193.01 62.40,196.60 C61.51,200.19 60.59,201.31 60.70,205.45 C60.80,209.60 61.76,216.12 63.01,221.46 C64.27,226.79 65.79,234.02 68.24,237.47 C70.69,240.93 74.41,240.66 77.69,242.18 C80.97,243.71 82.83,246.24 87.94,246.62 C93.04,246.99 102.35,245.82 108.33,244.45 C114.30,243.08 120.26,241.20 123.76,238.40 C127.27,235.60 128.02,231.73 129.33,227.66 C130.64,223.59 130.62,218.71 131.62,213.99 C132.61,209.26 135.74,204.57 135.29,199.33 C134.84,194.08 130.66,183.64 128.91,182.51 C127.17,181.37 126.14,191.17 124.81,192.51 C123.48,193.84 122.18,191.00 120.93,190.50 C119.67,189.99 118.69,189.95 117.27,189.47 C115.85,188.98 113.05,195.46 112.41,187.59 C111.76,179.71 114.04,153.02 113.39,142.23 C112.75,131.44 110.14,128.12 108.52,122.85 C106.90,117.58 104.57,110.13 103.66,110.62 Z;M103.07,112.03 C101.49,111.65 102.28,120.98 101.14,125.20 C100.00,129.41 98.42,132.72 96.22,137.31 C94.03,141.91 92.92,144.95 87.97,152.77 C83.03,160.58 70.94,177.00 66.55,184.20 C62.16,191.40 62.83,192.24 61.63,195.96 C60.43,199.68 59.58,202.02 59.35,206.50 C59.12,210.97 59.06,217.79 60.23,222.83 C61.40,227.86 63.59,232.87 66.37,236.70 C69.15,240.53 72.87,243.63 76.91,245.83 C80.95,248.02 85.57,249.49 90.61,249.87 C95.64,250.25 101.79,249.75 107.11,248.11 C112.44,246.47 118.73,242.93 122.56,240.04 C126.40,237.14 128.21,234.53 130.11,230.73 C132.02,226.92 133.39,221.95 133.98,217.21 C134.56,212.47 134.68,208.05 133.63,202.28 C132.57,196.52 129.15,184.46 127.66,182.62 C126.16,180.77 125.67,189.29 124.67,191.22 C123.68,193.15 122.91,194.03 121.69,194.21 C120.46,194.38 118.47,193.62 117.30,192.27 C116.13,190.93 115.16,194.44 114.66,186.13 C114.16,177.82 114.98,152.18 114.31,142.41 C113.64,132.63 112.50,132.54 110.62,127.48 C108.75,122.42 104.65,112.41 103.07,112.03 Z"/></path>
      </svg>
    </div>
    <div class="heartGlowBehind">
      <svg viewBox="0 0 24 24"><path fill="#ff5a1f" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </div>
    <div class="heartWrap" id="heartWrap">
      <svg viewBox="0 0 24 24">
        <defs>
          <clipPath id="heartClip">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </clipPath>
          <linearGradient id="liquidGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#220301"/>
            <stop offset="40%" stop-color="#5c0a06"/>
            <stop offset="75%" stop-color="#8f120a"/>
            <stop offset="100%" stop-color="#c41f12"/>
          </linearGradient>
          <radialGradient id="fireLickGrad" cx="50%" cy="100%" r="75%">
            <stop offset="0%" stop-color="#ff9a3a" stop-opacity=".9"/>
            <stop offset="45%" stop-color="#ff5a1f" stop-opacity=".5"/>
            <stop offset="100%" stop-color="#ff5a1f" stop-opacity="0"/>
          </radialGradient>
          <clipPath id="liquidClip">
            <rect id="liquidClipRect" x="0" y="24" width="24" height="0"/>
          </clipPath>
        </defs>
        <path class="heartBase" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        <g clip-path="url(#heartClip)">
          <rect id="liquidRect" class="liquidRect" x="0" y="24" width="24" height="0" fill="url(#liquidGrad)"/>
          <g clip-path="url(#liquidClip)">
            <circle class="bloodBubble" cx="7.5" cy="26" r="0.7" fill="#e63a1f" opacity="0">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 -14" keyTimes="0;0.08;1" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;.85;.85;0" keyTimes="0;0.1;0.8;1" dur="2.4s" repeatCount="indefinite"/>
            </circle>
            <circle class="bloodBubble" cx="13" cy="27" r="0.5" fill="#8f120a" opacity="0">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 -16" keyTimes="0;0.08;1" dur="2.9s" begin=".6s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;.8;.8;0" keyTimes="0;0.1;0.8;1" dur="2.9s" begin=".6s" repeatCount="indefinite"/>
            </circle>
            <circle class="bloodBubble" cx="10" cy="28" r="0.9" fill="#a81810" opacity="0">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 -15" keyTimes="0;0.08;1" dur="2.1s" begin="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;.75;.75;0" keyTimes="0;0.1;0.8;1" dur="2.1s" begin="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle class="bloodBubble" cx="16" cy="25.5" r="0.55" fill="#e63a1f" opacity="0">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 -13" keyTimes="0;0.08;1" dur="2.6s" begin="1.7s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;.8;.8;0" keyTimes="0;0.1;0.8;1" dur="2.6s" begin="1.7s" repeatCount="indefinite"/>
            </circle>
          </g>
          <rect id="liquidShine" x="0" width="24" height="0.5" fill="#ff5a3a" opacity=".8"/>
          <ellipse class="heartFireLick" cx="12" cy="21" rx="11" ry="7" fill="url(#fireLickGrad)"/>
          <path class="heartHighlight" d="M7.8 5.2c1.6-1 3.4-.3 4 .9-1.6-.4-3 .1-3.9 1.4-.6.9-.6 1.9-.3 2.6C6.4 9 5.6 7 6.3 6c.4-.5.9-.6.9-.6z"/>
        </g>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#000" stroke-width=".4"/>
        <path class="heartEnergyEdge" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#ff7a2a"/>
        <text id="furyNumText" class="furyNum" x="12" y="11.7">0</text>
      </svg>
    </div>
  </div>
  `;
}
function classHtml(x) {
  if (x.cls === 'rogue')
    return `<div class="resource">Fichas en mano: <b>${ x.rogue.hand }</b> · Gastadas: ${ x.rogue.spent }<div class="row"><button id="rDraw">Robar ficha</button><button id="rSpend">Gastar ficha</button></div></div>`;
  if (x.cls === 'ranger')
    return `<div class="resource">El mazo de Flechas se resuelve físicamente: Rápido, Certero o Fallido.</div>`;
  if (x.cls === 'shaman')
    return shamanHtml(x);
  if (x.cls === 'paladin')
    return `<p class="notice">Revisa la pestaña "Consagración" para ver y usar el Escudo de Consagración.</p>`;
  if (x.cls === 'mage') {
    const active = x.mage.slots[x.mage.amulet];
    return `<div class="resource"><b>Cara activa del Talismán:</b> ${ active.name } <small>(${ active.manaCost } maná)</small><p class="muted top">Revisa la pestaña "Talismán" para ver las 4 caras, usar la activa o forzar el giro.</p></div>`;
  }
  const stances = {
    'Furia Sangrienta': 'Ataque: gasta 1 Furia para relanzar cualquier dado.',
    'Temerario': 'Movimiento: gasta 1 Furia para obtener +1 PM.',
    'Provocador': 'Defensa: gasta 1 Furia para infligir 1 Herida al atacante.'
  };
  return `<p class="notice">Furia: <b>${ x.berserker.fury }/7</b> · Postura activa: <b>${ x.berserker.stance }</b>. Revisa la pestaña "Furia" para ver el Corazón y cambiar de postura.</p>`;
}
function skillPrereqMet(x, q) {
  if (!q.grade || q.grade <= 1)
    return true;
  const chosenNames = Object.keys(x.lockedChoices).filter(n => x.lockedChoices[n]).map(n => x.choices[n]);
  const chosenSkills = chosenNames.map(name => skills(x).find(s2 => s2.name === name)).filter(Boolean);
  return chosenSkills.some(s2 => s2.branch === q.branch && s2.grade === q.grade - 1);
}
function skillsHtml(x) {
  let html = '<div class="card"><h2>Elecciones</h2>';
  for (let n = 1; n <= x.level; n++) {
    let v = x.choices[n], locked = x.lockedChoices[n];
    if (locked)
      html += `<div class="skill skillLocked"><b>Nivel ${ n }</b><br>${ v }<div class="inventoryActions"><button data-undo="${ n }">Deshacer elección</button></div></div>`;
    else
      html += `<div class="choiceBox"><label>Nivel ${ n }<select data-choice="${ n }"><option value="">Seleccionar</option>${ skills(x).filter(q => q.level <= n && skillPrereqMet(x, q)).map(q => `<option value="${ q.name }" ${ v === q.name ? 'selected' : '' }>${ q.name }${ q.grade > 1 ? ` (Grado ${ q.grade })` : '' }</option>`).join('') }</select></label><button data-confirm="${ n }" class="primary">Confirmar</button></div>`;
  }
  html += '</div><div class="card"><h2>Habilidades activas</h2>' + activeSkills(x).map(q => `<div class="skill">${ q.name }</div>`).join('') + '</div>';
  return html;
}
function missionTurnButton(x) {
  const m = getActiveMission();
  if (m && m.id === 'cursed_sword' && s.missionState.bearerId === x.id && !s.missionResult)
    return `<button id="destroyCrystalBtn" ${ x.actions < 1 ? 'disabled' : '' }>Destruir Cristal del Pecado</button>`;
  if (m && m.id === 'terrifying_beast' && !s.missionResult && s.missionState.beastMaxHp !== null && s.missionState.beastMaxHp !== undefined && s.missionState.beastVulnerable)
    return `<button id="attackBeastBtn" ${ x.actions < 1 ? 'disabled' : '' }>Atacar a la Bestia (vulnerable)</button>`;
  if (m && m.id === 'free_michael' && !s.missionResult && !s.missionState.finalCombatActive && s.missionState.sealsBreached < 4)
    return `<button id="breakSealBtn" ${ x.actions < 1 ? 'disabled' : '' }>Romper Sello de Corrupción</button>`;
  if (m && m.id === 'free_michael' && !s.missionResult && s.missionState.finalCombatActive && michaelTotalCorruption() > 0)
    return `<button id="removeCorruptionBtn" ${ x.actions < 1 ? 'disabled' : '' }>Retirar Ficha de Corrupción</button>`;
  if (m && m.id === 'soul_collector' && !s.missionResult)
    return `<button id="destroyCageBtn" ${ x.actions < 1 ? 'disabled' : '' }>Destruir Jaula de Almas</button>`;
  if (m && m.id === 'soul_keys' && !s.missionResult && !s.missionState.finalCombatActive) {
    const st = s.missionState;
    return st.keysCollected.map((done, i) => done ? '' : `<button data-collectkey="${ i }" ${ x.actions < 1 ? 'disabled' : '' }>Recoger Llave ${ i + 1 } (${ st.keyTimeTokens[i] } ficha${ st.keyTimeTokens[i] !== 1 ? 's' : '' } de Tiempo restantes)</button>`).join('');
  }
  if (m && m.id === 'soul_keys' && !s.missionResult && s.missionState.finalCombatActive)
    return `<button data-addtime="1" ${ x.actions < 1 ? 'disabled' : '' }>Añadir ficha de Tiempo (Reloj 1)</button><button data-addtime="2" ${ x.actions < 1 ? 'disabled' : '' }>Añadir ficha de Tiempo (Reloj 2)</button>`;
  return '';
}
function actionsHtml(x) {
  return `<div class="card"><h2>Turno de ${ x.name }</h2><p class="notice">Acciones restantes: <b>${ x.actions }</b></p><div class="actions"><button id="moveAction">Movimiento</button><button id="attackAction">Ataque</button><button data-action="Recuperación">Recuperación</button><button data-action="Intercambiar y equipar">Intercambiar y equipar</button><button data-action="Acción especial">Acción especial (objeto)</button>${ missionTurnButton(x) }<button id="finishTurn" class="primary">Finalizar turno</button></div><button id="enemyBurningBtn" class="top">Un enemigo está Quemado: tirar dado amarillo</button></div>${ flowHtml(x) }`;
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
  if (x.flow.type === 'Acción especial')
    return `<div class="card actionFlow active"><h2>Acción especial de objeto</h2><p class="notice">Algunos objetos tienen una acción especial que se resuelve gastando 1 acción. Anota qué objeto usas y su efecto.</p><label>Objeto y efecto<input id="specialActionText" placeholder="Ej.: Amuleto de Fuego — inflige 1 herida al objetivo"></label><button id="confirmSpecialAction" class="primary top">Confirmar acción especial</button></div>`;
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
  if (m.id === 'soul_collector' && (s.missionState.souls || 0) >= (s.missionState.soulsNeeded || 0))
    return `<button id="missionEscapeBtn" class="primary top" ${ x.move.pm < 1 ? 'disabled' : '' }>Salir de la mazmorra (1 PM)</button>`;
  return '';
}
function missionInteractOptions(x) {
  const m = getActiveMission();
  if (m && m.id === 'demonic_artifact' && !s.missionResult)
    return `<button data-move="interact">Interactuar (genérico)</button><button id="collectFragmentBtn" ${ x.move.pm < 1 ? 'disabled' : '' }>Recoger fragmento de artefacto</button>`;
  if (m && m.id === 'terrifying_beast' && !s.missionResult)
    return `<button data-move="interact">Interactuar (genérico)</button><button id="collectFeatherBtn" ${ x.move.pm < 1 ? 'disabled' : '' }>Recoger Pluma de Ángel</button><button id="placeFeatherBtn" ${ x.move.pm < 1 || !x.angelFeathers ? 'disabled' : '' }>Colocar Pluma en la Bestia (${ x.angelFeathers || 0 })</button>`;
  return `<button data-move="interact">Interactuar</button>`;
}
function moveFlow(x) {
  const suggestion = berserkerStanceSuggestion(x, 'move');
  return `<div class="card actionFlow active"><h2>Movimiento</h2><div class="flowSteps"><span class="flowStep active">Gastar PM</span><span class="flowStep">Finalizar</span></div><p class="notice">PM disponibles: <b>${ x.move.pm }</b></p>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }<div class="actions"><button data-move="move">Mover 1 zona</button><button data-move="door">Abrir puerta</button>${ missionInteractOptions(x) }${ x.cls === 'berserker' && x.berserker.stance === 'Temerario' ? `<button id="furyExtraPm" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: +1 PM (${ x.berserker.fury }/7)</button>` : '' }<button id="finishMove" class="primary">Finalizar movimiento</button></div>${ missionEscapeButton(x) }${ getActiveMission()?.id === 'free_michael' && s.missionState.sealsBreached >= 4 && !s.missionState.finalCombatActive && !s.missionResult ? `<button id="enterChamberBtn" class="primary top" ${ x.move.pm < 1 ? 'disabled' : '' }>Entrar a la Cámara de la Corrupción (1 PM)</button>` : '' }${ getActiveMission()?.id === 'soul_keys' && (s.missionState.keysCollectedCount || 0) >= 3 && !s.missionState.finalCombatActive && !s.missionResult ? `<button id="enterTimeChamberBtn" class="primary top" ${ x.move.pm < 1 ? 'disabled' : '' }>Entrar a la Cámara del Tiempo (1 PM)</button>` : '' }</div>`;
}
function arrowFlow(x) {
  return `<div class="card actionFlow active"><h2>Mazo de Flechas</h2><p class="notice">Saca cartas del mazo de Flechas e indica el resultado obtenido.</p><div class="actions"><button data-arrow="rapido">Disparo rápido (menos de 7)</button><button data-arrow="certero">Disparo certero (7 justas)</button><button data-arrow="lento">Disparo lento o fallido (más de 7)</button></div></div>`;
}
function attackTypeSelector(x) {
  if (x.cls === 'mage') {
    const active = x.mage.slots[x.mage.amulet];
    return `<div class="card actionFlow active"><h2>Ataque del Mago</h2><p class="notice">Revisa la cara activa del Talismán (pestaña "Talismán") para ver qué habilidad puedes usar, o gasta 1 maná para forzar el giro a otra cara.</p><p class="muted">Cara activa ahora: <b>${ active.name }</b> (${ active.manaCost } maná).</p><button id="mageAttackContinue" class="primary top">Continuar con el ataque</button></div>`;
  }
  return `<div class="card actionFlow active"><h2>Tipo de Ataque</h2><p class="notice">¿Qué tipo de ataque realiza ${ x.name }?</p><div class="actions"><button data-attacktype="distancia">A distancia</button><button data-attacktype="cuerpo">Cuerpo a cuerpo</button><button data-attacktype="magico">Mágico</button></div></div>`;
}
function attackFlow(x) {
  const a = x.flow.attack || {};
  if (!x.flow.attackType)
    return attackTypeSelector(x);
  if (x.cls === 'ranger' && x.flow.attackType === 'distancia' && !x.flow.arrowResult)
    return arrowFlow(x);
  const suggestion = berserkerStanceSuggestion(x, 'attack');
  if (x.flow.attackTarget === 'beast') {
    const st = s.missionState;
    return `<div class="card actionFlow active"><h2>Ataque a la Bestia</h2><button id="repeatAttackSteps" class="top">🔊 Repetir pasos</button><ol class="notice top"><li>Arma tu reserva de dados según tu tipo de ataque.</li><li>Lanza físicamente los dados.</li><li>Revisa habilidades y efectos disponibles.</li><li>Marca el daño causado y confirma.</li></ol><div class="resultBox">${ attackReminders(x) }</div>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }${ x.cls === 'berserker' && x.berserker.stance === 'Furia Sangrienta' ? `<button id="furyReroll" class="top" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: relanzar un dado (${ x.berserker.fury }/7)</button>` : '' }<p class="notice top">Vida actual de la Bestia: <b>${ st.beastHp }/${ st.beastMaxHp }</b></p><label>Daño causado a la Bestia<select id="beastDamageAmount">${ Array.from({ length: 21 }, (_, i) => i).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label><button id="confirmBeastDamage" class="primary top">Confirmar daño a la Bestia</button></div>`;
  }
  if (getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult) {
    const st = s.missionState;
    if (st.michaelInvulnerable)
      return `<div class="card actionFlow active"><h2>Ataque al Arcángel Miguel</h2><p class="notice">⚠️ Miguel es invulnerable mientras existan fichas de Corrupción en la Cámara (actualmente ${ michaelTotalCorruption() }). Este ataque no puede herirlo.</p><button id="finishFlow" class="primary top">Finalizar acción</button></div>`;
    return `<div class="card actionFlow active"><h2>Ataque al Arcángel Miguel</h2><button id="repeatAttackSteps" class="top">🔊 Repetir pasos</button><ol class="notice top"><li>Arma tu reserva de dados según tu tipo de ataque.</li><li>Lanza físicamente los dados.</li><li>Revisa habilidades y efectos disponibles.</li><li>Marca el daño causado y confirma.</li></ol><div class="resultBox">${ attackReminders(x) }</div>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }${ x.cls === 'berserker' && x.berserker.stance === 'Furia Sangrienta' ? `<button id="furyReroll" class="top" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: relanzar un dado (${ x.berserker.fury }/7)</button>` : '' }<p class="notice top">Vida actual de Miguel: <b>${ st.michaelHp }/${ st.michaelMaxHp }</b></p>${ !x.flow.michaelClawsResolved ? `<p class="notice">Miguel lanza dados negros para defenderse. ¿Salió al menos 1 garra? Si es así, te inflige 1 Herida por cada ficha de Corrupción propia que tengas (${ x.personalCorruption || 0 }).</p><div class="actions"><button id="michaelClawsYes" class="primary">Sí, salió al menos 1 garra</button><button id="michaelClawsNo">No, ninguna garra</button></div>` : '' }<label>Daño causado a Miguel<select id="michaelDamageDealt">${ Array.from({ length: 21 }, (_, i) => i).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label><button id="confirmMichaelDamage" class="primary top">Confirmar daño a Miguel</button></div>`;
  }
  if (getActiveMission()?.id === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult) {
    const st = s.missionState;
    return `<div class="card actionFlow active"><h2>Ataque a la Parca</h2><button id="repeatAttackSteps" class="top">🔊 Repetir pasos</button><ol class="notice top"><li>Arma tu reserva de dados según tu tipo de ataque.</li><li>Lanza físicamente los dados.</li><li>Revisa habilidades y efectos disponibles.</li><li>Marca el daño causado y confirma.</li></ol><div class="resultBox">${ attackReminders(x) }</div>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }${ x.cls === 'berserker' && x.berserker.stance === 'Furia Sangrienta' ? `<button id="furyReroll" class="top" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: relanzar un dado (${ x.berserker.fury }/7)</button>` : '' }<p class="notice top">Vida actual de la Parca: <b>${ st.parcaHp }/${ st.parcaMaxHp }</b></p><label>Daño causado a la Parca<select id="parcaDamageDealt">${ Array.from({ length: 21 }, (_, i) => i).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label><button id="confirmParcaDamage" class="primary top">Confirmar daño a la Parca</button></div>`;
  }
  return `<div class="card actionFlow active"><h2>Ataque</h2><button id="repeatAttackSteps" class="top">🔊 Repetir pasos</button><ol class="notice top"><li>Arma tu reserva de dados según tu tipo de ataque.</li><li>Lanza físicamente los dados.</li><li>Revisa habilidades y efectos disponibles.</li><li>Marca el resultado del ataque y confirma.</li></ol><div class="resultBox">${ attackReminders(x) }</div>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }${ x.cls === 'berserker' && x.berserker.stance === 'Furia Sangrienta' ? `<button id="furyReroll" class="top" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: relanzar un dado (${ x.berserker.fury }/7)</button>` : '' }<label class="top">Resultado del ataque (puedes marcar varias)<select id="attackResult" multiple size="5"><option value="m1">1 secuaz eliminado</option><option value="m2">2 secuaces eliminados</option><option value="m3">3 secuaces eliminados</option><option value="leader">Líder eliminado</option><option value="roamer">Errante eliminado</option>${ getActiveMission()?.id === 'infernal_labyrinth' && !s.missionResult ? '<option value="beast">Bestia Errante eliminada</option>' : '' }</select></label><button id="attackCalc" class="primary top">Ataque resuelto</button></div>`;
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
  arr.push('Si estás en Zona de Oscuridad: añade el dado de Oscuridad y aplica Sombras.');
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
    html += `${ shamanElementsBoardHtml(x) }${ attackAbilities ? `<h3>Hechizos de ataque disponibles</h3>${ attackAbilities }` : '' }`;
  }
  return html;
}
function bindHero() {
  const x = h();
  if ($('mpDeselectHeroBtn'))
    $('mpDeselectHeroBtn').onclick = () => {
      if (!confirm('¿Deseleccionar este héroe? Volverá a estar disponible para que cualquier jugador de la sala lo elija.'))
        return;
      s.myHeroIndex = null;
      save();
      const lastRoom = JSON.parse(localStorage.getItem('md2_last_room') || 'null');
      if (lastRoom)
        localStorage.setItem('md2_last_room', JSON.stringify({ ...lastRoom, heroIndex: null, timestamp: Date.now() }));
      mpUpdatePresenceName('Sin héroe elegido', -1);
      renderMultiplayerPanel();
      tab('settings');
      say('Has liberado el héroe. Elige otro desde Configuración si quieres.');
    };
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
    x.lockedChoices[n] = true;
    log(`Habilidad bloqueada: ${ v }.`);
    if (x.cls === 'mage') {
      x.mage.pendingReplacement = v;
      x.mage.pendingReplacementLevel = n;
      const base = mageSkillBaseName(v);
      const sameFamilyIdx = x.mage.slots.findIndex(q => mageSkillBaseName(q.name) === base);
      if (sameFamilyIdx !== -1) {
        x.mage.pendingReplacementSlot = sameFamilyIdx;
        save();
        renderHero();
        say(`${ v } mejora la misma habilidad. Confirma el maná para la Cara ${ sameFamilyIdx + 1 }.`, x);
        return;
      }
      save();
      renderHero();
      say('Elige qué cara del Talismán reemplazar.', x);
      return;
    }
    if (x.cls === 'berserker') {
      x.berserker.pendingStanceAssign = v;
      save();
      renderHero();
      say(`¿En qué postura dejas ${ v }?`, x);
      return;
    }
    save();
    renderHero();
    if (s.phase === 2)
      continueLevelQueueAfterSkill();
    else
      advancePending();
    say('Habilidad confirmada.', x);
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
    if (s.roomCode && s.myHeroIndex !== null && s.myHeroIndex !== undefined && s.active !== s.myHeroIndex)
      return alert(`Este héroe pertenece a otro jugador. Elige "${ s.heroes[s.myHeroIndex]?.name }" (el tuyo) para actuar.`);
    x.actions = 0;
    finishFlow(true);
  };
  bindFlow(x);
  if (x.cls === 'shaman' && document.getElementById('fireMedallionCircle'))
    bindShamanElementBoard(x);
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
    document.querySelectorAll('.energy-circle[data-color]').forEach(circle => circle.onclick = () => {
      const color = circle.dataset.color;
      const isActive = x.paladin.consecrations[color];
      if (isActive) {
        x.paladin.consecrations[color] = false;
        save();
        renderHero();
        say('Retiras la Consagración de esa zona.');
        return;
      }
      if (x.mana < 1) {
        circle.classList.add('shake');
        setTimeout(() => circle.classList.remove('shake'), 300);
        say('Maná insuficiente.');
        return;
      }
      x.mana--;
      x.paladin.consecrations[color] = true;
      save();
      renderHero();
      say('Gastas 1 maná para consagrar. Comprueba la línea de visión y que la zona no tenga otra Consagración.');
    });
    if ($('paladinBlessingSelect'))
      $('paladinBlessingSelect').onchange = e => {
        x.paladin.blessed = e.target.value;
        save();
        renderHero();
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
      x.mage.totalRotations = (x.mage.totalRotations || 0) + 1;
      const nextFace = x.mage.slots[x.mage.amulet];
      spinTalismanThenRender(x);
      say(`${ face.name }. ${ face.type === 'ataque' ? 'Recuerda que necesitas un arma con alcance mágico equipada para usar hechizos de ataque. ' : '' }El Talismán gira. Cara activa ahora: ${ nextFace.name }.`);
    });
    bindTalismanDrag(x);
    document.querySelectorAll('[data-replace-slot]').forEach(b => b.onclick = () => {
      x.mage.pendingReplacementSlot = +b.dataset.replaceSlot;
      save();
      renderHero();
    });
    if ($('confirmTalismanReplace'))
      $('confirmTalismanReplace').onclick = () => {
        const idx = x.mage.pendingReplacementSlot;
        const manaCost = +$('talismanManaCost').value;
        const v = x.mage.pendingReplacement;
        const oldFace = x.mage.slots[idx];
        x.mage.slots[idx] = {
          name: v,
          manaCost,
          type: ''
        };
        log(`${ x.name } reemplaza la Cara ${ idx + 1 } del Talismán (${ oldFace.name }) por ${ v } (coste ${ manaCost } maná).`);
        x.mage.pendingReplacement = null;
        x.mage.pendingReplacementSlot = null;
        save();
        renderHero();
        if (s.phase === 2)
          continueLevelQueueAfterSkill();
        else
          advancePending();
        say('Talismán actualizado.', x);
      };
  }
  if (x.cls === 'berserker' && document.getElementById('board'))
    bindBerserkerFuryBoard(x);
  if (x.cls === 'berserker' && x.berserker.pendingStanceAssign)
    document.querySelectorAll('[data-assign-stance]').forEach(b => b.onclick = () => {
      const v = x.berserker.pendingStanceAssign;
      const stanceName = b.dataset.assignStance;
      const base = v.replace(/\s+\d+$/, '').trim();
      Object.keys(x.berserker.stanceAbilities).forEach(st => {
        x.berserker.stanceAbilities[st] = x.berserker.stanceAbilities[st].filter(a => a.replace(/\s+\d+$/, '').trim() !== base);
      });
      x.berserker.stanceAbilities[stanceName].push(v);
      x.berserker.pendingStanceAssign = null;
      log(`"${ v }" se integró a la postura ${ stanceName }.`);
      save();
      renderHero();
      if (s.phase === 2)
        continueLevelQueueAfterSkill();
      else
        advancePending();
      say(`${ v } queda en la postura ${ stanceName }.`, x);
    });
}
function bindFlow(x) {
  if ($('enemyBurningBtn'))
    $('enemyBurningBtn').onclick = () => {
      const panel = $('heroPage');
      if (!panel)
        return;
      panel.innerHTML = `<div class="card"><h2>Enemigo Quemado</h2><p class="notice">Lanza 1 dado amarillo por el enemigo con ficha de fuego. ¿Cuántas espadas salieron?</p><div class="actions">${ Array.from({ length: 7 }, (_, i) => i).map(n => `<button data-enemy-burn="${ n }" class="primary">${ n }</button>`).join('') }</div><button id="cancelEnemyBurn" class="top">Cancelar</button></div>`;
      document.querySelectorAll('[data-enemy-burn]').forEach(b => b.onclick = () => {
        const dmg = +b.dataset.enemyBurn;
        log(`Enemigo Quemado: recibe ${ dmg } de daño por fuego (aplícalo en la miniatura física).`);
        say(dmg > 0 ? `El enemigo recibe ${ dmg } de daño por Quemado.` : 'El enemigo no recibe daño por Quemado esta vez.');
        renderHero();
      });
      if ($('cancelEnemyBurn'))
        $('cancelEnemyBurn').onclick = () => renderHero();
    };
  if ($('mageAttackContinue'))
    $('mageAttackContinue').onclick = () => {
      x.flow.attackType = 'magico';
      log(`${ x.name } declara un ataque mágico.`);
      save();
      renderHero();
      say('Ataque declarado.');
    };
  document.querySelectorAll('[data-attacktype]').forEach(b => b.onclick = () => {
    const type = b.dataset.attacktype;
    x.flow.attackType = type;
    const label = type === 'distancia' ? 'a distancia' : type === 'cuerpo' ? 'cuerpo a cuerpo' : 'mágico';
    log(`${ x.name } declara un ataque ${ label }.`);
    const m = getActiveMission();
    if (m && m.id === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult) {
      x.flow.awaitingMichaelClawsCheck = true;
    }
    save();
    renderHero();
    if (x.cls === 'ranger' && type === 'distancia')
      duckAndSay(`Ataque ${ label } declarado. Explorador, saca cartas del mazo de Flechas e indícame el resultado.`);
    else
      duckAndSay(`Ataque ${ label } declarado. Arma tu reserva de dados y confirma.`);
  });
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
  if ($('confirmSpecialAction'))
    $('confirmSpecialAction').onclick = () => {
      const text = $('specialActionText').value.trim();
      if (!text)
        return alert('Describe qué objeto usas y su efecto.');
      log(`${ x.name } usa una acción especial de objeto: ${ text }.`);
      say(`${ x.name } usa una acción especial de objeto.`);
      finishFlow();
    };
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
  if ($('confirmBeastDamage'))
    $('confirmBeastDamage').onclick = () => {
      const dmg = +$('beastDamageAmount').value;
      const st = s.missionState;
      st.beastHp = Math.max(0, st.beastHp - dmg);
      log(`${ x.name } inflige ${ dmg } de daño a la Bestia. Vida restante: ${ st.beastHp }/${ st.beastMaxHp }.`);
      save();
      stopBossSong();
      if (st.beastHp <= 0) {
        triggerMissionResult('victory');
        log('La Bestia ha sido derrotada. Victoria.');
        finishFlow(true);
        duckAndSay('La Bestia ha sido derrotada. La misión termina en victoria.');
        return;
      }
      if ((st.feathersUsed || 0) >= 5) {
        triggerMissionResult('defeat');
        log('Se gastaron las 5 Plumas de Ángel y la Bestia sigue con vida. Derrota.');
        finishFlow(true);
        duckAndSay('Se agotaron las Plumas de Ángel y la Bestia sigue con vida. La misión termina en derrota.');
        return;
      }
      finishFlow(true);
      renderMissions();
      say(`Infliges ${ dmg } de daño a la Bestia. Le quedan ${ st.beastHp } de vida.`);
    };
  if ($('michaelClawsYes'))
    $('michaelClawsYes').onclick = () => {
      const dmg = x.personalCorruption || 0;
      x.flow.michaelClawsResolved = true;
      if (dmg > 0) {
        x.hp = Math.max(0, x.hp - dmg);
        x.personalCorruption = 0;
        log(`Miguel inflige ${ dmg } Heridas a ${ x.name } por Garras (1 por cada ficha de Corrupción propia). Fichas descartadas.`);
        if (x.hp === 0 && !x.unconscious)
          knockOut(x);
      } else {
        log(`Miguel saca Garras contra ${ x.name }, pero no tenía Corrupción propia: sin efecto.`);
      }
      save();
      renderHero();
    };
  if ($('michaelClawsNo'))
    $('michaelClawsNo').onclick = () => {
      x.flow.michaelClawsResolved = true;
      save();
      renderHero();
    };
  if ($('confirmMichaelDamage'))
    $('confirmMichaelDamage').onclick = () => {
      const dmg = +$('michaelDamageDealt').value;
      const st = s.missionState;
      st.michaelHp = Math.max(0, st.michaelHp - dmg);
      log(`${ x.name } inflige ${ dmg } de daño al Arcángel Miguel. Vida restante: ${ st.michaelHp }/${ st.michaelMaxHp }.`);
      save();
      if (st.michaelHp <= 0) {
        stopMichaelSong();
        triggerMissionResult('victory');
        log('El Arcángel Miguel ha sido derrotado. Victoria.');
        finishFlow(true);
        duckAndSay('Miguel ha sido liberado de la Corrupción. La misión termina en victoria.');
        return;
      }
      finishFlow(true);
      renderMissions();
      say(`Infliges ${ dmg } de daño a Miguel. Le quedan ${ st.michaelHp } de vida.`);
    };
  if ($('confirmParcaDamage'))
    $('confirmParcaDamage').onclick = () => {
      const dmg = +$('parcaDamageDealt').value;
      const st = s.missionState;
      st.parcaHp = Math.max(0, st.parcaHp - dmg);
      log(`${ x.name } inflige ${ dmg } de daño a la Parca. Vida restante: ${ st.parcaHp }/${ st.parcaMaxHp }.`);
      save();
      if (st.parcaHp <= 0) {
        stopParcaSong();
        triggerMissionResult('victory');
        log('La Parca ha sido derrotada. Victoria.');
        finishFlow(true);
        duckAndSay('La Parca ha sido derrotada. La misión termina en victoria.');
        return;
      }
      finishFlow(true);
      renderMissions();
      say(`Infliges ${ dmg } de daño a la Parca. Le quedan ${ st.parcaHp } de vida.`);
    };
  if ($('attackCalc'))
    $('attackCalc').onclick = () => {
      let a = x.flow.attack = x.flow.attack || {};
      const selected = Array.from($('attackResult').selectedOptions).map(o => o.value);
      a.killedMinions = selected.includes('m3') ? 3 : selected.includes('m2') ? 2 : selected.includes('m1') ? 1 : 0;
      a.leaderDamage = selected.includes('leader') ? 1 : 0;
      a.killedRoamer = selected.includes('roamer') ? 1 : 0;
      let xpMsgs = [];
      const soulMission = getActiveMission()?.id === 'soul_collector' && !s.missionResult;
      const st = s.missionState;
      if (a.killedMinions > 0) {
        x.xp += a.killedMinions;
        log(`${ x.name } gana ${ a.killedMinions } XP por eliminar ${ a.killedMinions } secuaz${ a.killedMinions > 1 ? 'ces' : '' }.`);
        xpMsgs.push(`Ganas ${ a.killedMinions } de experiencia por secuaces.`);
        if (soulMission) {
          st.souls = (st.souls || 0) + a.killedMinions;
          log(`El grupo gana ${ a.killedMinions } Alma${ a.killedMinions > 1 ? 's' : '' } por los secuaces eliminados. Total: ${ st.souls }/${ st.soulsNeeded }.`);
          xpMsgs.push(`El grupo gana ${ a.killedMinions } Alma${ a.killedMinions > 1 ? 's' : '' }.`);
        }
      }
      if (a.leaderDamage > 0) {
        s.heroes.forEach(q => q.xp += 2);
        log('Líder eliminado. Todo el grupo gana 2 XP.');
        xpMsgs.push('El grupo gana 2 de experiencia por el líder eliminado.');
        if (soulMission) {
          st.souls = (st.souls || 0) + 1;
          log(`El grupo gana 1 Alma por el líder eliminado. Total: ${ st.souls }/${ st.soulsNeeded }.`);
          xpMsgs.push('El grupo gana 1 Alma por el líder.');
        }
      }
      if (a.killedRoamer > 0) {
        s.heroes.forEach(q => q.xp += 4);
        log('Monstruo errante eliminado. Todo el grupo gana 4 XP.');
        xpMsgs.push('El grupo gana 4 de experiencia por el errante eliminado.');
        if (soulMission) {
          st.souls = (st.souls || 0) + 3;
          log(`El grupo gana 3 Almas por el Monstruo Errante eliminado. Total: ${ st.souls }/${ st.soulsNeeded }.`);
          xpMsgs.push('El grupo gana 3 Almas por el errante.');
        }
      }
      if (selected.includes('beast') && getActiveMission()?.id === 'infernal_labyrinth' && !s.missionResult) {
        s.heroes.forEach(q => q.xp += 4);
        s.missionState.beastsKilled = (s.missionState.beastsKilled || 0) + 1;
        log(`Bestia Errante eliminada. Todo el grupo gana 4 XP. Bestias eliminadas: ${ s.missionState.beastsKilled }/4.`);
        xpMsgs.push(`El grupo gana 4 de experiencia por la Bestia Errante. Eliminadas: ${ s.missionState.beastsKilled } de 4.`);
        if (s.missionState.beastsKilled >= 4) {
          log('Las 4 Bestias Errantes han sido eliminadas. Victoria.');
        }
      }
      log('Ataque resuelto.');
      if (s.missionState.beastsKilled >= 4 && getActiveMission()?.id === 'infernal_labyrinth') {
        save();
        finishFlow(true);
        triggerMissionResult('victory');
        duckAndSay('Las 4 Bestias Errantes han sido eliminadas. La misión termina en victoria.');
        return;
      }
      duckAndSay(`Ataque resuelto. ${ xpMsgs.length ? xpMsgs.join(' ') : 'Sin eliminaciones registradas.' }`);
      finishFlow(true);
    };
}
function startHeroTurn(x) {
  x.turnAnnounced = false;
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
function startAction(type, targetBeast = false) {
  const x = h();
  if (s.roomCode && s.myHeroIndex !== null && s.myHeroIndex !== undefined && s.active !== s.myHeroIndex)
    return alert(`Este héroe pertenece a otro jugador. Elige "${ s.heroes[s.myHeroIndex]?.name }" (el tuyo) para actuar.`);
  if (s.missionResult)
    return alert('La misión ya terminó. Ve a la pestaña Misiones para reiniciar o continuar.');
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
      'Intercambiar y equipar',
      'Acción especial'
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
  if (type === 'attack')
    x.flow.attackType = null;
  if (type === 'attack')
    x.flow.michaelClawsResolved = false;
  if (type === 'attack' && x.cls === 'ranger')
    x.flow.arrowResult = null;
  if (type === 'attack' && targetBeast)
    x.flow.attackTarget = 'beast';
  if (type === 'attack' && targetBeast)
    playBossSong();
  else if (type === 'attack' && !((getActiveMission()?.id === 'free_michael' || getActiveMission()?.id === 'soul_keys') && s.missionState.finalCombatActive))
    playAttackSong();
  save();
  renderHero();
  setTimeout(() => document.querySelector('.actionFlow')?.scrollIntoView({ behavior: 'smooth' }), 30);
  const actionLabel = type === 'move' ? 'Movimiento' : type === 'attack' ? 'Ataque' : type === 'defense' ? 'Defensa' : type;
  const extraInfo = `${ x.cls === 'shaman' && type === 'attack' ? ' Revisa tus elementos.' : '' }${ type === 'attack' ? ' Elige el tipo de ataque.' : '' }`;
  let baseAnnouncement;
  if (!x.turnAnnounced) {
    x.turnAnnounced = true;
    baseAnnouncement = `Héroe activo: ${ heroSpoken(x) }. ${ actionLabel }. ${ x.actions } acciones restantes.${ extraInfo }`;
  } else {
    baseAnnouncement = `${ actionLabel }. ${ x.actions } acciones restantes.${ extraInfo }`;
  }
  if (type === 'attack' && x.cls !== 'ranger') {
    duckAndSay(baseAnnouncement);
    if (s.voice === 'yes' && confirm('¿Quieres que el asistente de voz lea los pasos del ataque?'))
      duckAndSay('Arma tu reserva de dados, lanza, revisa habilidades, y confirma el resultado.');
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
function triggerMissionResult(result) {
  s.missionResult = result;
  save();
  tab('missions');
  renderMissions();
  playMissionResultSound(result);
}
function playMissionResultSound(result) {
  stopAmbient();
  const id = result === 'victory' ? 'victorySong' : 'defeatSong';
  const src = result === 'victory' ? 'victoria.mp3' : 'derrota.mp3';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('audio');
    el.id = id;
    el.src = src;
    el.preload = 'auto';
    document.body.appendChild(el);
  }
  try {
    el.currentTime = 0;
    el.volume = s.musicMuted ? 0 : 1;
    el.play().catch(() => {
    });
  } catch (err) {
  }
}
function checkMissionExitVictory() {
  const available = s.heroes.filter(q => !q.unconscious);
  if (available.length > 0 && available.every(q => q.exitedMap)) {
    triggerMissionResult('victory');
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
      const zoneLabel = m.id === 'road_to_hell' ? 'la zona del Altar' : m.id === 'soul_collector' ? 'la zona del Portón (ficha de Objetivo gris)' : 'la zona de la Grieta';
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
  const enterChamberBtn = document.getElementById('enterChamberBtn');
  if (enterChamberBtn)
    enterChamberBtn.onclick = () => {
      const st = s.missionState;
      if (st.sealsBreached < 4)
        return alert('Todavía no se han roto los 4 Sellos de Corrupción.');
      if (x.move.pm < 1)
        return alert('No tienes puntos de movimiento disponibles para esta acción.');
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de la puerta de la Cámara de la Corrupción y que quieres gastar 1 punto de movimiento para entrar. Esto activa el Combate Final.`))
        return;
      primeAudioElement(michaelSongEl());
      x.move.pm--;
      x.move.on = false;
      log(`${ x.name } entra a la Cámara de la Corrupción. Se realiza una Fase de Subida de Nivel antes de comenzar el Combate Final.`);
      st.pendingChamberEntry = 'michael';
      s.phase = 2;
      save();
      renderHero();
      showPhaseCurtain('Fase de Subida de Nivel');
      beginLevelPhase();
    };
  const enterTimeChamberBtn = document.getElementById('enterTimeChamberBtn');
  if (enterTimeChamberBtn)
    enterTimeChamberBtn.onclick = () => {
      const st = s.missionState;
      if ((st.keysCollectedCount || 0) < 3)
        return alert('Todavía no se han recogido las 3 Llaves del Alma.');
      if (x.move.pm < 1)
        return alert('No tienes puntos de movimiento disponibles para esta acción.');
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de la puerta de la Cámara del Tiempo y que quieres gastar 1 punto de movimiento para entrar. Esto activa el Combate Final.`))
        return;
      primeAudioElement(parcaSongEl());
      x.move.pm--;
      x.move.on = false;
      log(`${ x.name } entra a la Cámara del Tiempo. Se realiza una Fase de Subida de Nivel antes de comenzar el Combate Final.`);
      st.pendingChamberEntry = 'parca';
      s.phase = 2;
      save();
      renderHero();
      showPhaseCurtain('Fase de Subida de Nivel');
      beginLevelPhase();
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
      sayShared(`${ x.name } recoge un fragmento. Gana 5 de experiencia.`);
    };
  const featherBtn = document.getElementById('collectFeatherBtn');
  if (featherBtn)
    featherBtn.onclick = () => {
      if (x.move.pm < 1)
        return alert('No tienes puntos de movimiento disponibles para esta acción.');
      if (!confirm(`¿${ x.name } está recogiendo una Pluma de Ángel en esta zona?`))
        return;
      x.move.pm--;
      if (!x.move.pm)
        x.move.on = false;
      x.angelFeathers = (x.angelFeathers || 0) + 1;
      log(`${ x.name } recoge una Pluma de Ángel. Total: ${ x.angelFeathers }.`);
      save();
      renderHero();
      say(`${ x.name } recoge una Pluma de Ángel. Ahora tiene ${ x.angelFeathers }.`);
    };
  const placeFeatherBtn = document.getElementById('placeFeatherBtn');
  if (placeFeatherBtn)
    placeFeatherBtn.onclick = () => {
      if (x.move.pm < 1)
        return alert('No tienes puntos de movimiento disponibles para esta acción.');
      if (!x.angelFeathers)
        return alert('No tienes Plumas de Ángel disponibles.');
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de la Bestia. Se gastará 1 punto de movimiento y 1 Pluma de Ángel para volverla vulnerable el resto de la ronda.`))
        return;
      x.move.pm--;
      if (!x.move.pm)
        x.move.on = false;
      x.angelFeathers--;
      const st = s.missionState;
      st.feathersUsed = (st.feathersUsed || 0) + 1;
      st.beastVulnerable = true;
      log(`${ x.name } coloca 1 Pluma de Ángel en la Bestia. Queda vulnerable el resto de la ronda. Plumas gastadas: ${ st.feathersUsed }/5.`);
      save();
      renderHero();
      renderMissions();
      if (st.feathersUsed >= 5 && st.beastHp > 0) {
        triggerMissionResult('defeat');
        log('Se gastaron las 5 Plumas de Ángel y la Bestia sigue con vida. Derrota.');
        duckAndSay('Se agotaron las Plumas de Ángel y la Bestia sigue con vida. La misión termina en derrota.');
        return;
      }
      sayShared(`Pluma colocada. La Bestia es vulnerable el resto de la ronda.`);
    };
  const attackBeastBtn = document.getElementById('attackBeastBtn');
  if (attackBeastBtn)
    attackBeastBtn.onclick = () => {
      if (!s.missionState.beastVulnerable) {
        alert('La Bestia sigue invulnerable. Coloca una Pluma de Ángel en su zona primero.');
        return;
      }
      startAction('attack', true);
      renderMissions();
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
        triggerMissionResult('victory');
        duckAndSay('Los 5 Cristales del Pecado han sido destruidos. La misión termina en victoria.');
        return;
      }
      save();
      renderHero();
      renderMissions();
      sayShared(`Cristal destruido. ${ st.crystalsDestroyed } de 5.${ bonus ? ` La espada gana ${ bonus }.` : '' }`);
    };
  const breakSealBtn = document.getElementById('breakSealBtn');
  if (breakSealBtn)
    breakSealBtn.onclick = () => {
      if (x.actions < 1)
        return alert('No quedan acciones disponibles.');
      const st = s.missionState;
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de un Sello de Corrupción. Se gastará 1 acción para romperlo.`))
        return;
      x.actions--;
      st.sealsBreached = (st.sealsBreached || 0) + 1;
      s.heroes.forEach(q => q.xp += 5);
      log(`${ x.name } rompe un Sello de Corrupción (${ st.sealsBreached }/4). Todo el grupo gana 5 XP.`);
      save();
      renderHero();
      renderMissions();
      if (st.sealsBreached >= 4)
        sayShared(`Sello roto. ${ st.sealsBreached } de 4. Los 4 Sellos están rotos: ya pueden entrar a la Cámara de la Corrupción gastando 1 punto de movimiento.`);
      else
        sayShared(`Sello roto. ${ st.sealsBreached } de 4. Todo el grupo gana 5 de experiencia.`);
    };
  const removeCorruptionBtn = document.getElementById('removeCorruptionBtn');
  if (removeCorruptionBtn)
    removeCorruptionBtn.onclick = () => {
      if (x.actions < 1)
        return alert('No quedan acciones disponibles.');
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de una ficha de Corrupción. Se gastará 1 acción para intentar eliminarla.`))
        return;
      x.actions--;
      s.missionState.awaitingCorruptionRoll = x.id;
      save();
      renderHero();
    };
  const destroyCageBtn = document.getElementById('destroyCageBtn');
  if (destroyCageBtn)
    destroyCageBtn.onclick = () => {
      if (x.actions < 1)
        return alert('No quedan acciones disponibles.');
      const st = s.missionState;
      if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de una Jaula de Almas. Se gastará 1 acción para destruirla.`))
        return;
      x.actions--;
      st.souls = (st.souls || 0) + 5;
      x.xp += 5;
      log(`${ x.name } destruye una Jaula de Almas. Gana 5 XP. El grupo gana 5 Almas. Total: ${ st.souls }/${ st.soulsNeeded }.`);
      save();
      renderHero();
      renderMissions();
      sayShared(`Jaula destruida. Ganas 5 de experiencia. El grupo tiene ${ st.souls } de ${ st.soulsNeeded } Almas.`);
    };
  document.querySelectorAll('[data-collectkey]').forEach(b => b.onclick = () => {
    if (x.actions < 1)
      return alert('No quedan acciones disponibles.');
    const i = +b.dataset.collectkey, st = s.missionState;
    if (st.keysCollected[i])
      return;
    if (!confirm(`Confirma que ${ x.name } se encuentra en la zona de la Llave ${ i + 1 }. Se gastará 1 acción para recogerla.`))
      return;
    x.actions--;
    st.keysCollected[i] = true;
    st.keysCollectedCount = (st.keysCollectedCount || 0) + 1;
    s.heroes.forEach(q => q.xp += 8);
    log(`${ x.name } recoge la Llave ${ i + 1 } del Alma. Todo el grupo gana 8 XP. Llaves recogidas: ${ st.keysCollectedCount }/3.`);
    save();
    renderHero();
    renderMissions();
    sayShared(`Llave recogida. Todo el grupo gana 8 de experiencia. Llaves: ${ st.keysCollectedCount } de 3.`);
  });
  document.querySelectorAll('[data-addtime]').forEach(b => b.onclick = () => {
    if (x.actions < 1)
      return alert('No quedan acciones disponibles.');
    const zone = b.dataset.addtime, st = s.missionState;
    if (!confirm(`Confirma que ${ x.name } se encuentra en la Zona de Reloj de Arena ${ zone }. Se gastará 1 acción para añadir 1 ficha de Tiempo.`))
      return;
    x.actions--;
    if (zone === '1')
      st.clockZone1 = (st.clockZone1 || 0) + 1;
    else
      st.clockZone2 = (st.clockZone2 || 0) + 1;
    log(`${ x.name } añade 1 ficha de Tiempo a la Zona de Reloj de Arena ${ zone }.`);
    save();
    renderHero();
    renderMissions();
    say(`Ficha de Tiempo añadida al Reloj de Arena ${ zone }.`);
  });
}
function michaelTotalCorruption() {
  return s.missionState.corruptionChamber || 0;
}
function addMichaelCorruption(n) {
  const st = s.missionState;
  const wasZero = michaelTotalCorruption() === 0;
  st.corruptionChamber = (st.corruptionChamber || 0) + n;
  if (wasZero && n > 0 && !st.michaelInvulnerable) {
    st.michaelInvulnerable = true;
    return true;
  }
  return false;
}
function michaelBlessingMultiplier(level) {
  if (level >= 5)
    return 3;
  if (level >= 3)
    return 2;
  return 1;
}
function triggerMichaelActivation(isLastHero) {
  const st = s.missionState;
  st.awaitingMichaelActivation = true;
  st.michaelPendingAfter = isLastHero ? 'phase' : 'prompt';
  st.michaelClawStep = 'ask';
  save();
  render();
  duckAndSay('El Arcángel Miguel se activa. Lanza 2 dados negros.');
}
function resolveMichaelAfterActivation() {
  const st = s.missionState;
  st.awaitingMichaelActivation = false;
  st.michaelClawStep = null;
  const pendingAfter = st.michaelPendingAfter;
  st.michaelPendingAfter = null;
  save();
  if (pendingAfter === 'phase') {
    renderHero();
    nextPhase();
    return;
  }
  const pendingHeroes = s.heroes.filter(q => !q.unconscious && !q.turnDone);
  if (pendingHeroes.length <= 1) {
    if (pendingHeroes.length === 1)
      s.active = s.heroes.indexOf(pendingHeroes[0]);
    save();
    render();
    return;
  }
  s.turnPrompt = true;
  save();
  render();
}
function renderMichaelActivation() {
  const st = s.missionState;
  const panel = $('heroPage');
  if (!panel)
    return;
  if (st.michaelClawStep === 'ask' || !st.michaelClawStep) {
    panel.innerHTML = `<div class="card"><h2>⚔️ Activación del Arcángel Miguel</h2><p class="notice">Lanza 2 dados negros. ¿Cuántas <b>garras</b> salieron?</p><div class="actions"><button data-claws="0" class="primary">0 garras</button><button data-claws="1" class="primary">1 garra</button><button data-claws="2" class="primary">2 garras</button></div></div>`;
    document.querySelectorAll('[data-claws]').forEach(b => b.onclick = () => resolveMichaelAbility(+b.dataset.claws));
    return;
  }
  if (st.michaelClawStep === 'single-damage') {
    const available = s.heroes.filter(q => !q.unconscious && !q.exitedMap);
    panel.innerHTML = `<div class="card"><h2>${ st.michaelAbilityName }</h2><p class="notice">${ st.michaelAbilityText }</p><label>Héroe atacado<select id="michaelTargetHero">${ available.map(q => `<option value="${ s.heroes.indexOf(q) }">${ q.name }</option>`).join('') }</select></label><label>Daño recibido<select id="michaelDamageAmount">${ Array.from({ length: 11 }, (_, i) => i).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label><button id="confirmMichaelSingleDamage" class="primary top">Confirmar daño</button></div>`;
    $('confirmMichaelSingleDamage').onclick = () => {
      const idx = +$('michaelTargetHero').value, dmg = +$('michaelDamageAmount').value, target = s.heroes[idx];
      target.hp = Math.max(0, target.hp - dmg);
      log(`${ target.name } recibe ${ dmg } de daño de Miguel (${ st.michaelAbilityName }). Vida restante: ${ target.hp }/${ target.hpMax }.`);
      if (target.hp === 0 && !target.unconscious)
        knockOut(target);
      save();
      renderMissions();
      resolveMichaelAfterActivation();
    };
    return;
  }
  if (st.michaelClawStep === 'blessing-damage') {
    const available = s.heroes.filter(q => !q.unconscious && !q.exitedMap);
    const total = st.michaelBlessingTotal || 0;
    const dist = st.michaelBlessingDist || {};
    const assigned = Object.values(dist).reduce((a, b) => a + b, 0);
    const remaining = total - assigned;
    panel.innerHTML = `<div class="card"><h2>Bendición Oscura</h2><p class="notice">Inflige ${ total } Heridas en total, repartidas entre los héroes como el grupo decida.</p><div class="grid top">${ available.map(q => {
      const i = s.heroes.indexOf(q);
      return `<div class="elementRow"><span class="badge">${ q.name }: ${ dist[i] || 0 }</span><button data-blessdmg="${ i }" data-d="-1" ${ (dist[i] || 0) <= 0 ? 'disabled' : '' }>−</button><button data-blessdmg="${ i }" data-d="1" ${ remaining <= 0 ? 'disabled' : '' }>+</button></div>`;
    }).join('') }</div><p class="muted top">Heridas por repartir: ${ remaining }</p><button id="confirmMichaelBlessing" class="primary top" ${ remaining !== 0 ? 'disabled' : '' }>Confirmar reparto</button></div>`;
    document.querySelectorAll('[data-blessdmg]').forEach(b => b.onclick = () => {
      const i = +b.dataset.blessdmg, d = +b.dataset.d;
      st.michaelBlessingDist = st.michaelBlessingDist || {};
      const cur = st.michaelBlessingDist[i] || 0;
      const curRemaining = total - Object.values(st.michaelBlessingDist).reduce((a, b2) => a + b2, 0);
      if (d > 0 && curRemaining <= 0)
        return;
      if (d < 0 && cur <= 0)
        return;
      st.michaelBlessingDist[i] = cur + d;
      save();
      renderMichaelActivation();
    });
    if ($('confirmMichaelBlessing'))
      $('confirmMichaelBlessing').onclick = () => {
        Object.entries(st.michaelBlessingDist || {}).forEach(([i, dmg]) => {
          if (!dmg)
            return;
          const target = s.heroes[+i];
          target.hp = Math.max(0, target.hp - dmg);
          log(`${ target.name } recibe ${ dmg } de daño de Bendición Oscura. Vida restante: ${ target.hp }/${ target.hpMax }.`);
          if (target.hp === 0 && !target.unconscious)
            knockOut(target);
        });
        st.michaelBlessingDist = {};
        save();
        renderMissions();
        resolveMichaelAfterActivation();
      };
    return;
  }
}
function resolveMichaelAbility(claws) {
  const st = s.missionState;
  if (claws === 0) {
    st.michaelAbilityName = 'Justicia Celestial';
    st.michaelAbilityText = 'Miren las Zonas donde hay héroes: identifiquen cuál Zona tiene MÁS fichas de Corrupción. Miguel se mueve a esa Zona. Elige a qué héroe ataca.';
    st.michaelClawStep = 'single-damage';
    log('Miguel se activa con 0 garras: Justicia Celestial.');
    save();
    render();
    duckAndSay('Justicia Celestial. Miguel ataca al héroe en la Zona con más Corrupción.');
    return;
  }
  if (claws === 1) {
    const restored1 = addMichaelCorruption(1);
    if (restored1)
      log('Nueva ficha de Corrupción: Miguel vuelve a ser invulnerable.');
    st.michaelAbilityName = 'Embestida de Lanza';
    st.michaelAbilityText = `Coloca 1 ficha de Corrupción en la Zona con héroe que tenga MENOS fichas de Corrupción (entre las Zonas donde hay héroes). Miguel se mueve a esa Zona. Elige a qué héroe ataca. Corrupción total en la Cámara: ${ st.corruptionChamber }.`;
    st.michaelClawStep = 'single-damage';
    log(`Miguel se activa con 1 garra: Embestida de Lanza. Corrupción total: ${ st.corruptionChamber }.`);
    save();
    render();
    renderMissions();
    duckAndSay(`Embestida de Lanza. Coloca 1 ficha en la Zona con menos Corrupción entre las Zonas con héroes, y ataca ahí.`);
    return;
  }
  const restored2 = addMichaelCorruption(1);
  if (restored2)
    log('Nueva ficha de Corrupción: Miguel vuelve a ser invulnerable.');
  const mult = michaelBlessingMultiplier(st.darkLevel || 0);
  const totalCorruption = michaelTotalCorruption();
  const total = mult * totalCorruption;
  st.michaelBlessingTotal = total;
  st.michaelBlessingDist = {};
  st.michaelClawStep = 'blessing-damage';
  st.michaelAbilityName = 'Bendición Oscura';
  st.michaelAbilityText = `Coloca a Miguel en la Zona central de la Cámara de la Corrupción. Agrega 1 ficha de Corrupción a la Piedra con menos fichas. ${ mult } de daño por cada una de las ${ totalCorruption } fichas de Corrupción en la Loseta = ${ total } Heridas en total.`;
  log(`Miguel se activa con 2 garras: Bendición Oscura. Va al centro de la Cámara. ${ mult } de daño por cada una de las ${ totalCorruption } fichas de Corrupción totales = ${ total } Heridas en total.`);
  save();
  render();
  renderMissions();
  duckAndSay(`Bendición Oscura. Miguel va al centro de la Cámara. Inflige ${ total } Heridas, distribúyanlas como deseen.`);
}
function triggerParcaActivation(isLastHero) {
  const st = s.missionState;
  st.awaitingParcaActivation = true;
  st.parcaPendingAfter = isLastHero ? 'phase' : 'prompt';
  st.parcaClawStep = 'ask';
  st.parcaActivationsRemaining = st.parcaActions || 1;
  st.parcaActivationsTotal = st.parcaActions || 1;
  save();
  render();
  const n = st.parcaActivationsTotal;
  duckAndSay(n > 1 ? `La Parca se activa. Con el medidor en su nivel actual, realizará ${ n } activaciones seguidas. Lanza 2 dados negros para la primera.` : 'La Parca se activa. Lanza 2 dados negros.');
}
function resolveParcaAfterActivation() {
  const st = s.missionState;
  st.parcaActivationsRemaining = Math.max(0, (st.parcaActivationsRemaining || 1) - 1);
  if (st.parcaActivationsRemaining > 0) {
    st.parcaClawStep = 'ask';
    save();
    render();
    duckAndSay(`La Parca se activa de nuevo (activación ${ st.parcaActivationsTotal - st.parcaActivationsRemaining + 1 } de ${ st.parcaActivationsTotal }). Lanza 2 dados negros.`);
    return;
  }
  st.awaitingParcaActivation = false;
  st.parcaClawStep = null;
  const pendingAfter = st.parcaPendingAfter;
  st.parcaPendingAfter = null;
  save();
  if (pendingAfter === 'phase') {
    renderHero();
    nextPhase();
    return;
  }
  const pendingHeroes = s.heroes.filter(q => !q.unconscious && !q.turnDone);
  if (pendingHeroes.length <= 1) {
    if (pendingHeroes.length === 1)
      s.active = s.heroes.indexOf(pendingHeroes[0]);
    save();
    render();
    return;
  }
  s.turnPrompt = true;
  save();
  render();
}
function checkParcaClockDefeat() {
  const st = s.missionState;
  if ((st.clockZone1 || 0) <= 0 && (st.clockZone2 || 0) <= 0 && !s.missionResult) {
    triggerMissionResult('defeat');
    log('Ambas Zonas de Reloj de Arena se quedaron sin fichas de Tiempo. Derrota.');
    duckAndSay('El tiempo se agota. La misión termina en derrota.');
    return true;
  }
  return false;
}
function renderCorruptionRemoval() {
  const st = s.missionState;
  const heroId = st.awaitingCorruptionRoll;
  const x = s.heroes.find(q => q.id === heroId) || h();
  const panel = $('heroPage');
  if (!panel)
    return;
  panel.innerHTML = `<div class="card"><h2>Retirar Ficha de Corrupción</h2><p class="notice">${ x.name } lanza 1 dado negro. ¿Qué símbolo salió?</p><div class="actions"><button data-corruptionroll="none" class="primary">Ninguno (limpio)</button><button data-corruptionroll="claw">Garra</button><button data-corruptionroll="hand">Mano</button><button data-corruptionroll="both">Ambos símbolos</button></div></div>`;
  document.querySelectorAll('[data-corruptionroll]').forEach(b => b.onclick = () => resolveCorruptionRemoval(x, b.dataset.corruptionroll));
}
function resolveCorruptionRemoval(x, result) {
  const st = s.missionState;
  st.corruptionChamber = Math.max(0, (st.corruptionChamber || 0) - 1);
  let msg = `${ x.name } retira 1 ficha de la Cámara de la Corrupción. Quedan ${ st.corruptionChamber } en total.`;
  if (result === 'claw' || result === 'both') {
    x.hp = Math.max(0, x.hp - 1);
    msg += ` Sale garra: ${ x.name } recibe 1 Herida.`;
    if (x.hp === 0 && !x.unconscious)
      knockOut(x);
  }
  if (result === 'hand' || result === 'both') {
    x.personalCorruption = (x.personalCorruption || 0) + 1;
    msg += ` Sale mano: ${ x.name } gana 1 ficha de Corrupción en su propio tablero (total: ${ x.personalCorruption }).`;
  }
  log(msg);
  st.awaitingCorruptionRoll = null;
  save();
  renderHero();
  renderMissions();
  say(msg);
}
function renderParcaActivation() {
  const st = s.missionState;
  const panel = $('heroPage');
  if (!panel)
    return;
  if (st.parcaClawStep === 'ask' || !st.parcaClawStep) {
    panel.innerHTML = `<div class="card"><h2>☠ Activación de la Parca</h2><p class="notice">Lanza 2 dados negros. ¿Cuántas <b>garras</b> salieron?</p><div class="actions"><button data-parcaclaws="0" class="primary">0 garras</button><button data-parcaclaws="1" class="primary">1 garra</button><button data-parcaclaws="2" class="primary">2 garras</button></div></div>`;
    document.querySelectorAll('[data-parcaclaws]').forEach(b => b.onclick = () => resolveParcaAbility(+b.dataset.parcaclaws));
    return;
  }
  if (st.parcaClawStep === 'single-damage') {
    const available = s.heroes.filter(q => !q.unconscious && !q.exitedMap);
    panel.innerHTML = `<div class="card"><h2>${ st.parcaAbilityName }</h2><p class="notice">${ st.parcaAbilityText }</p><label>Héroe atacado<select id="parcaTargetHero">${ available.map(q => `<option value="${ s.heroes.indexOf(q) }">${ q.name }</option>`).join('') }</select></label><label>Daño recibido<select id="parcaDamageAmount">${ Array.from({ length: 11 }, (_, i) => i).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label><label class="top">¿Salieron 2 garras en los dados negros de este combate?<select id="parcaIceProc"><option value="no">No</option><option value="yes">Sí</option></select></label><button id="confirmParcaSingleDamage" class="primary top">Confirmar daño</button></div>`;
    $('confirmParcaSingleDamage').onclick = () => {
      const idx = +$('parcaTargetHero').value, dmg = +$('parcaDamageAmount').value, target = s.heroes[idx];
      const iceProc = $('parcaIceProc').value === 'yes';
      target.hp = Math.max(0, target.hp - dmg);
      log(`${ target.name } recibe ${ dmg } de daño de la Parca (${ st.parcaAbilityName }). Vida restante: ${ target.hp }/${ target.hpMax }.`);
      if (iceProc && target.mana === 0 && !target.unconscious) {
        target.iceTokens = (target.iceTokens || 0) + 1;
        log(`${ target.name } no tenía Maná: gana 1 Ficha de Hielo. Perderá 1 acción al comenzar su próximo turno.`);
      }
      if (target.hp === 0 && !target.unconscious)
        knockOut(target);
      save();
      renderHero();
      renderMissions();
      resolveParcaAfterActivation();
    };
    return;
  }
  if (st.parcaClawStep === 'ask-swords') {
    panel.innerHTML = `<div class="card"><h2>La Muerte se Acerca</h2><p class="notice">La Parca se mueve a la Zona central. Lanza 1 dado amarillo. ¿Cuántas espadas salieron?</p><div class="actions">${ [0, 1, 2, 3].map(n => `<button data-swords="${ n }" class="primary">${ n }</button>`).join('') }</div></div>`;
    document.querySelectorAll('[data-swords]').forEach(b => b.onclick = () => {
      const swords = +b.dataset.swords;
      const totalClockTokens = (st.clockZone1 || 0) + (st.clockZone2 || 0);
      s.heroes.forEach(q => {
        if (!q.unconscious)
          q.mana = Math.max(0, q.mana - swords);
      });
      if (swords > totalClockTokens) {
        log(`La Muerte se Acerca: salen ${ swords } espadas, pero solo quedan ${ totalClockTokens } ficha(s) de Tiempo en total. Los Relojes de Arena llegan a cero: la Parca ha destruido las almas de los héroes. Derrota.`);
        st.clockZone1 = 0;
        st.clockZone2 = 0;
        save();
        stopParcaSong();
        triggerMissionResult('defeat');
        finishFlow(true);
        duckAndSay(`Salen ${ swords } espadas, más de las fichas de Tiempo que quedan. Los Relojes de Arena llegan a cero. La misión termina en derrota.`);
        return;
      }
      st.parcaSwordsResult = swords;
      st.parcaClawStep = 'clock-distribute';
      st.parcaClockDist = {
        1: 0,
        2: 0
      };
      log(`La Muerte se Acerca: salen ${ swords } espadas. Todos los héroes pierden ${ swords } de Maná. Deben retirarse ${ swords } ficha(s) de Tiempo repartidas entre ambas Zonas de Reloj de Arena.`);
      save();
      render();
      duckAndSay(`Salen ${ swords } espadas. Todos pierden ${ swords } de Maná. Reparte ${ swords } ficha${ swords !== 1 ? 's' : '' } de Tiempo entre ambos relojes.`);
    });
    return;
  }
  if (st.parcaClawStep === 'clock-distribute') {
    const swords = st.parcaSwordsResult || 0;
    const dist = st.parcaClockDist || {
      1: 0,
      2: 0
    };
    const assigned = (dist[1] || 0) + (dist[2] || 0);
    const remaining = swords - assigned;
    panel.innerHTML = `<div class="card"><h2>Repartir pérdida de fichas</h2><p class="notice">Reparte ${ swords } ficha(s) de Tiempo a retirar entre ambos Relojes de Arena (no más de las que tenga cada uno).</p><div class="grid top"><div class="elementRow"><span class="badge">Reloj 1: -${ dist[1] || 0 } (tiene ${ st.clockZone1 || 0 })</span><button data-clockdist="1" data-d="-1" ${ (dist[1] || 0) <= 0 ? 'disabled' : '' }>−</button><button data-clockdist="1" data-d="1" ${ remaining <= 0 || (dist[1] || 0) >= (st.clockZone1 || 0) ? 'disabled' : '' }>+</button></div><div class="elementRow"><span class="badge">Reloj 2: -${ dist[2] || 0 } (tiene ${ st.clockZone2 || 0 })</span><button data-clockdist="2" data-d="-1" ${ (dist[2] || 0) <= 0 ? 'disabled' : '' }>−</button><button data-clockdist="2" data-d="1" ${ remaining <= 0 || (dist[2] || 0) >= (st.clockZone2 || 0) ? 'disabled' : '' }>+</button></div></div><p class="muted top">Por repartir: ${ remaining }</p><button id="confirmParcaClockDist" class="primary top" ${ remaining !== 0 ? 'disabled' : '' }>Confirmar</button></div>`;
    document.querySelectorAll('[data-clockdist]').forEach(b => b.onclick = () => {
      const zone = b.dataset.clockdist, d = +b.dataset.d;
      st.parcaClockDist = st.parcaClockDist || {
        1: 0,
        2: 0
      };
      st.parcaClockDist[zone] = (st.parcaClockDist[zone] || 0) + d;
      save();
      renderParcaActivation();
    });
    if ($('confirmParcaClockDist'))
      $('confirmParcaClockDist').onclick = () => {
        st.clockZone1 = Math.max(0, (st.clockZone1 || 0) - (st.parcaClockDist[1] || 0));
        st.clockZone2 = Math.max(0, (st.clockZone2 || 0) - (st.parcaClockDist[2] || 0));
        log(`Se retiran fichas de Tiempo: Reloj 1 ahora ${ st.clockZone1 }, Reloj 2 ahora ${ st.clockZone2 }.`);
        st.parcaClockDist = {};
        save();
        renderMissions();
        if (checkParcaClockDefeat())
          return;
        resolveParcaAfterActivation();
      };
    return;
  }
}
function resolveParcaAbility(claws) {
  const st = s.missionState;
  if (claws === 0) {
    st.parcaAbilityName = 'Drenaje del Alma';
    st.parcaAbilityText = 'Coloca a la Parca en la Zona del héroe con menos Maná y ataca a ese héroe.';
    st.parcaClawStep = 'single-damage';
    log('La Parca se activa con 0 garras: Drenaje del Alma.');
    save();
    render();
    duckAndSay('Drenaje del Alma.');
    return;
  }
  if (claws === 1) {
    const z1 = st.clockZone1 || 0, z2 = st.clockZone2 || 0;
    let fromZone;
    if (z1 >= z2) {
      st.clockZone1 = Math.max(0, z1 - 1);
      fromZone = '1';
    } else {
      st.clockZone2 = Math.max(0, z2 - 1);
      fromZone = '2';
    }
    log(`La Parca se activa con 1 garra: El Tiempo Vuela. Se retira 1 ficha de Tiempo del Reloj de Arena ${ fromZone }. Reloj 1: ${ st.clockZone1 }, Reloj 2: ${ st.clockZone2 }.`);
    save();
    renderMissions();
    if (checkParcaClockDefeat())
      return;
    render();
    duckAndSay(`El Tiempo Vuela. Se retira 1 ficha del Reloj de Arena ${ fromZone }.`);
    resolveParcaAfterActivation();
    return;
  }
  st.parcaClawStep = 'ask-swords';
  log('La Parca se activa con 2 garras: La Muerte se Acerca.');
  save();
  render();
}
function finishFlow(skipGenericVoice = false) {
  const x = h();
  if (s.roomCode && s.myHeroIndex !== null && s.myHeroIndex !== undefined && s.active !== s.myHeroIndex)
    return alert(`Este héroe pertenece a otro jugador. Elige "${ s.heroes[s.myHeroIndex]?.name }" (el tuyo) para actuar.`);
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
  if (wasAttack && !((getActiveMission()?.id === 'free_michael' || getActiveMission()?.id === 'soul_keys') && s.missionState.finalCombatActive))
    stopAttackSong();
  if (x.actions <= 0) {
    x.turnDone = true;
    if (s.roomCode)
      s.lastActingClientId = mpClientId();
    const pendingHeroes = s.heroes.filter(q => !q.unconscious && !q.turnDone);
    if (getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult) {
      save();
      renderHero();
      triggerMichaelActivation(pendingHeroes.length === 0);
      return;
    }
    if (getActiveMission()?.id === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult) {
      save();
      renderHero();
      triggerParcaActivation(pendingHeroes.length === 0);
      return;
    }
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
  if (getActiveMission()?.id === 'terrifying_beast' && s.missionState.beastVulnerable) {
    s.missionState.beastVulnerable = false;
    log('Nueva ronda: la Bestia vuelve a ser invulnerable hasta que se coloque otra Pluma de Ángel.');
  }
  reviveScheduled();
  s.heroes.forEach(x => {
    x.actions = x.unconscious ? 0 : s.mode === 'solo' ? 4 : 3;
    x.turnDone = false;
    x.heroTabAnnouncedThisRound = false;
    x.flow = {
      type: null,
      step: 0,
      attack: {},
      defense: {}
    };
    if (x.iceTokens > 0 && !x.unconscious) {
      const lost = Math.min(x.iceTokens, x.actions);
      x.actions -= lost;
      log(`${ x.name } tenía ${ x.iceTokens } Ficha${ x.iceTokens > 1 ? 's' : '' } de Hielo: pierde ${ lost } acción${ lost > 1 ? 'es' : '' } al comenzar su turno.`);
      x.iceTokens = 0;
    }
    if (x.cls === 'paladin' && x.paladin.blessed) {
      let old = x.paladin.blessed;
      x.paladin.blessed = '';
      say(`${ heroSpoken(x) }: retira la habilidad bendecida ${ old }; vuelve a su lado normal.`, x);
    }
  });
  applyCursedSwordDamage();
  log('Comienza la Fase de Héroes.');
  if (s.roomCode)
    s.turnPrompt = true;
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
    triggerMissionResult('defeat');
    log(`${ bearer.name } ha sostenido la Espada Maldita 4 rondas consecutivas y pierde su alma. Derrota.`);
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
    if (getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult) {
      s.phase = 2;
      showPhaseCurtain('Fase de Subida de Nivel');
      beginLevelPhase();
      save();
      render();
      return;
    }
    if (getActiveMission()?.id === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult) {
      s.phase = 2;
      showPhaseCurtain('Fase de Subida de Nivel');
      beginLevelPhase();
      save();
      render();
      return;
    }
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
    if (getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive && !s.missionResult)
      advanceMichaelDarkness();
    else if (getActiveMission()?.id === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult)
      advanceParcaDarkness();
    else if (getActiveMission()?.id === 'soul_keys' && !s.missionState.finalCombatActive && !s.missionResult)
      advanceSoulKeysDarkness();
    else
      advanceDark(true);
    save();
    render();
    return;
  }
}
function startNewHeroPhaseForFinalCombat() {
  s.phase = 0;
  s.heroes.forEach(x => {
    x.actions = x.unconscious ? 0 : s.mode === 'solo' ? 4 : 3;
    x.turnDone = false;
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
  });
  s.turnPrompt = false;
  s.active = s.heroes.findIndex(x => !x.unconscious);
  if (s.active < 0)
    s.active = 0;
}
function activateParcaChamber() {
  const st = s.missionState;
  const heroCountForHp = s.mode === 'solo' ? 2 : s.heroes.length;
  st.parcaMaxHp = 25 * heroCountForHp;
  st.parcaHp = st.parcaMaxHp;
  st.finalCombatActive = true;
  st.clockZone1 = 2;
  st.clockZone2 = 2;
  st.parcaDarkLevel = 1;
  st.parcaActions = 1;
  s.heroes.forEach(q => {
    q.hp = q.hpMax;
    q.mana = q.manaMax;
  });
  startNewHeroPhaseForFinalCombat();
  log(`Comienza el Combate Final contra la Parca. Vida de la Parca: ${ st.parcaHp }. Se colocan 2 fichas de Tiempo en cada Zona de Reloj de Arena. El medidor de la Parca inicia en nivel 1 (1 acción por activación).`);
  save();
  showPhaseCurtain('Fase de Héroes');
  renderHero();
  renderMissions();
  startParcaSong();
  duckAndSay('Comienza el Combate Final.');
}
function activateMichaelChamber() {
  const st = s.missionState;
  const heroCountForHp = s.mode === 'solo' ? 2 : s.heroes.length;
  st.michaelMaxHp = 15 * heroCountForHp;
  st.michaelHp = st.michaelMaxHp;
  st.michaelInvulnerable = true;
  st.finalCombatActive = true;
  st.darkLevel = 1;
  const total = 2 * heroCountForHp;
  st.corruptionChamber = total;
  st.awaitingCorruptionSetup = true;
  s.heroes.forEach(q => {
    q.hp = q.hpMax;
    q.mana = q.manaMax;
  });
  log(`Comienza el Combate Final contra el Arcángel Miguel corrupto. Vida de Miguel: ${ st.michaelHp }. Se colocan ${ total } fichas de Corrupción en las Piedras (2 por héroe), repartidas equitativamente.`);
  save();
  renderHero();
  renderMissions();
  say(`Coloquen ${ total } fichas de Corrupción en las Piedras, repartidas de forma equitativa.`);
}
function renderCorruptionSetup() {
  const st = s.missionState;
  const panel = $('heroPage');
  if (!panel)
    return;
  panel.innerHTML = `<div class="card"><h2>Colocar Fichas de Corrupción</h2><p class="notice">Coloquen <b>${ st.corruptionChamber }</b> fichas de Corrupción en las Piedras de la Cámara de la Corrupción (2 por héroe), repartidas de la forma más equitativa posible entre las Piedras disponibles.</p><button id="confirmCorruptionSetup" class="primary top">Ya las coloqué, continuar</button></div>`;
  if ($('confirmCorruptionSetup'))
    $('confirmCorruptionSetup').onclick = () => finishMichaelCorruptionSetup();
}
function finishMichaelCorruptionSetup() {
  const st = s.missionState;
  st.awaitingCorruptionSetup = false;
  startNewHeroPhaseForFinalCombat();
  log(`Fichas de Corrupción colocadas en la Cámara: ${ st.corruptionChamber } en total.`);
  save();
  showPhaseCurtain('Fase de Héroes');
  renderHero();
  renderMissions();
  startMichaelSong();
  duckAndSay('Comienza el Combate Final.');
}
function finishLevelPhaseOrChamberEntry() {
  const pending = s.missionState && s.missionState.pendingChamberEntry;
  if (pending) {
    s.missionState.pendingChamberEntry = null;
    save();
    if (pending === 'michael')
      activateMichaelChamber();
    else if (pending === 'parca')
      activateParcaChamber();
    return;
  }
  nextPhase();
}
function beginLevelPhase() {
  const newlyMaxed = s.heroes.filter(x => x.level >= 5 && !x.maxLevelAnnounced);
  newlyMaxed.forEach(x => {
    x.maxLevelAnnounced = true;
    log(`${ x.name } está en nivel máximo. Ya no se revisa en la fase de subida de nivel.`);
  });
  s.levelQueue = s.heroes.filter(x => x.level < 5).map(x => ({
    i: s.heroes.indexOf(x),
    status: 'pending'
  }));
  s.levelCursor = 0;
  s.levelPhaseResolved = false;
  s.anyLeveledUp = false;
  if (s.levelQueue.length === 0 && s.heroes.length > 0) {
    s.levelPhaseResolved = true;
    save();
    render();
    duckAndSay('Todos los héroes están en nivel máximo. Avanzamos a Oscuridad.');
    setTimeout(finishLevelPhaseOrChamberEntry, 2600);
    return;
  }
  if (newlyMaxed.length) {
    save();
    duckAndSay(newlyMaxed.map(x => `${ x.name } en nivel máximo.`).join(' '));
    setTimeout(processNextLevelHero, 1400);
    return;
  }
  processNextLevelHero();
}
function showLevelTransition(x, oldLevel, newLevel, onDone) {
  const overlay = document.getElementById('levelUpTransition');
  if (!overlay) {
    if (onDone)
      onDone();
    return;
  }
  document.getElementById('levelUpHeroName').textContent = x.name;
  document.getElementById('levelUpHeroClass').textContent = C[x.cls].label;
  const oldSlot = document.getElementById('levelUpBadgeOld');
  const newSlot = document.getElementById('levelUpBadgeNew');
  const oldNum = document.getElementById('levelUpNumberOld');
  const newNum = document.getElementById('levelUpNumberNew');
  oldSlot.innerHTML = eyeBadgeSvg(oldLevel, 64);
  newSlot.innerHTML = '';
  oldNum.textContent = `Nivel ${ oldLevel }`;
  oldNum.className = 'levelUpNumber';
  newNum.textContent = `Nivel ${ newLevel }`;
  newNum.className = 'levelUpNumber levelUpNumberNew';
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => overlay.classList.add('show'));
  setTimeout(() => {
    oldSlot.querySelector('svg')?.classList.add('badgeOut');
    newSlot.innerHTML = eyeBadgeSvg(newLevel, 64);
    newSlot.querySelector('svg')?.classList.add('badgeIn');
    oldNum.classList.add('numberFadeOut');
    newNum.classList.add('numberFadeIn');
  }, 400);
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.classList.add('hidden');
      if (onDone)
        onDone();
    }, 220);
  }, 1200);
}
function processNextLevelHero() {
  if (s.levelCursor >= s.levelQueue.length) {
    s.levelPhaseResolved = true;
    save();
    render();
    duckAndSay(s.anyLeveledUp ? 'Revisión completa. Avanzamos a Oscuridad.' : 'Ningún héroe sube de nivel por falta de experiencia. Avanzamos a Oscuridad.');
    setTimeout(finishLevelPhaseOrChamberEntry, 2600);
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
  const oldLevel = x.level;
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
  log(`${ x.name } sube a nivel ${ x.level }. +${ g.hp } vida, +${ g.mana } maná. ${ g.treasure }`);
  save();
  render();
  const gainParts = [];
  if (g.hp)
    gainParts.push(`${ g.hp } de vida`);
  if (g.mana)
    gainParts.push(`${ g.mana } de maná`);
  duckAndSay(`Nivel ${ x.level }. Gana ${ gainParts.join(' y ') }. ${ g.treasure }`);
  showLevelTransition(x, oldLevel, x.level, () => {
    tab('hero');
    setTimeout(() => document.querySelector('[data-sec="skills"]')?.click(), 30);
    setTimeout(showLevelUpBurst, 60);
    say('Elige una habilidad.');
  });
}
function continueLevelQueueAfterSkill() {
  if (s.phase !== 2)
    return;
  const entry = s.levelQueue[s.levelCursor];
  if (!entry)
    return;
  const x = s.heroes[entry.i];
  const cost = x.level < 5 ? MD2.levelCosts[x.level] : null;
  if (cost && x.xp >= cost) {
    save();
    render();
    setTimeout(processNextLevelHero, 800);
    return;
  }
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
function advanceSoulKeysDarkness() {
  const st = s.missionState;
  const exhaustedKey = st.keyTimeTokens.findIndex((tokens, i) => !st.keysCollected[i] && tokens <= 0);
  if (exhaustedKey !== -1) {
    triggerMissionResult('defeat');
    log(`La Llave ${ exhaustedKey + 1 } del Alma se quedó sin fichas de Tiempo antes de ser recogida. Derrota.`);
    duckAndSay(`La Llave ${ exhaustedKey + 1 } del Alma desaparece. La misión termina en derrota.`);
    return;
  }
  st.keyTimeTokens = st.keyTimeTokens.map((tokens, i) => st.keysCollected[i] ? tokens : tokens - 1);
  s.darknessPending = true;
  const remaining = st.keyTimeTokens.map((tk, i) => st.keysCollected[i] ? 'recogida' : `${ tk } ficha${ tk !== 1 ? 's' : '' }`);
  const t = `Fase de Oscuridad. Se retira 1 ficha de Tiempo de cada Llave pendiente. Llave 1: ${ remaining[0] }. Llave 2: ${ remaining[1] }. Llave 3: ${ remaining[2] }.`;
  log(t);
  save();
  renderGame();
  renderMissions();
  duckAndSay(t);
}
function advanceParcaDarkness() {
  const st = s.missionState;
  if ((st.parcaDarkLevel || 0) >= 5) {
    s.darknessPending = true;
    log('El medidor de la Parca ya está en su nivel máximo. No avanza más.');
    save();
    renderGame();
    duckAndSay('El medidor de la Parca ya está en su nivel máximo. No avanza más.');
    return;
  }
  st.parcaDarkLevel = (st.parcaDarkLevel || 0) + 1;
  const actions = st.parcaDarkLevel === 1 ? 1 : st.parcaDarkLevel === 5 ? 3 : 2;
  st.parcaActions = actions;
  const t = `Fase de Oscuridad de la Parca. El medidor avanza al nivel ${ st.parcaDarkLevel }. La Parca realizará ${ actions } acción${ actions > 1 ? 'es' : '' } en su próxima activación.`;
  s.darknessPending = true;
  log(t);
  save();
  renderGame();
  renderMissions();
  duckAndSay(t);
}
function advanceMichaelDarkness() {
  const st = s.missionState;
  if ((st.darkLevel || 0) >= 5) {
    s.darknessPending = true;
    log('El medidor de Miguel ya está en su nivel máximo. No avanza más.');
    save();
    renderGame();
    duckAndSay('El medidor del Arcángel ya está en su nivel máximo. No avanza más.');
    return;
  }
  st.darkLevel = (st.darkLevel || 0) + 1;
  let effectText = '';
  if (st.darkLevel === 1) {
    effectText = 'Bendición Oscura inflige 1 Herida por cada ficha de Corrupción en la Cámara.';
  } else if (st.darkLevel === 2) {
    st.extraBlackDice = 1;
    effectText = 'Miguel lanza 1 dado negro adicional en combate (ataque y defensa, de Miguel y de los héroes).';
  } else if (st.darkLevel === 3) {
    effectText = 'Bendición Oscura ahora inflige 2 Heridas por cada ficha de Corrupción en la Cámara.';
  } else if (st.darkLevel === 4) {
    st.extraBlackDice = 2;
    effectText = 'Miguel lanza 2 dados negros adicionales en combate (ataque y defensa, de Miguel y de los héroes).';
  } else if (st.darkLevel === 5) {
    effectText = 'Bendición Oscura ahora inflige 3 Heridas por cada ficha de Corrupción en la Cámara. El medidor de Miguel llega a su nivel máximo.';
  }
  const t = `Fase de Oscuridad del Arcángel. El medidor avanza al nivel ${ st.darkLevel }. ${ effectText }`;
  s.darknessPending = true;
  log(t);
  save();
  renderGame();
  renderMissions();
  duckAndSay(t);
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
$('reactivateAmbient').onclick = () => reactivateAmbient();
$('muteMusicBtn').onclick = () => setMusicMuted(!s.musicMuted);
$('musicVolumeSlider').oninput = e => setMusicVolume(+e.target.value / 100);
renderMusicControls();
function renderMultiplayerPanel() {
  const statusEl = $('mpStatus'), controlsEl = $('mpControls'), infoEl = $('mpRoomInfo');
  if (!statusEl)
    return;
  if (s.roomCode) {
    statusEl.textContent = `Conectado a la sala ${ s.roomCode }.`;
    controlsEl.classList.add('hidden');
    infoEl.classList.remove('hidden');
    $('mpRoomCodeDisplay').textContent = s.roomCode;
    const select = $('mpHeroSelect');
    const clientId = mpClientId();
    select.innerHTML = '<option value="">Solo observar (fase/oscuridad/enemigos)</option>' + s.heroes.map((x, i) => {
      const takenBy = Object.entries(mpPresenceData || {}).find(([cid, p]) => cid !== clientId && p.connected && p.heroIndex === i);
      if (takenBy)
        return `<option value="${ i }" disabled>${ x.name } (${ C[x.cls].label }) — elegido por otro jugador</option>`;
      return `<option value="${ i }" ${ s.myHeroIndex === i ? 'selected' : '' }>${ x.name } (${ C[x.cls].label })</option>`;
    }).join('');
    const presenceTable = $('mpPresenceTable');
    if (presenceTable) {
      const entries = Object.values(mpPresenceData || {});
      presenceTable.innerHTML = entries.length ? entries.map(p => `<div class="elementRow"><span>${ p.connected ? '🟢' : '🔴' } ${ p.name || 'Sin héroe elegido' }</span></div>`).join('') : '<p class="muted">Todavía no hay datos de otros jugadores.</p>';
    }
  } else {
    statusEl.textContent = 'Sin conectar.';
    controlsEl.classList.remove('hidden');
    infoEl.classList.add('hidden');
  }
}
$('mpCreateBtn').onclick = () => {
  if (!s.heroes.length) {
    alert('Primero prepara el grupo de héroes antes de crear la sala.');
    return;
  }
  const code = mpCreateRoom();
  if (code) {
    renderMultiplayerPanel();
    alert(`Sala creada. Compartí este código con el resto del grupo: ${ code }`);
  }
};
$('mpJoinBtn').onclick = () => {
  const code = $('mpJoinCode').value.trim().toUpperCase();
  if (!code || code.length !== 5) {
    alert('Ingresa un código de sala válido de 5 caracteres.');
    return;
  }
  mpJoinRoom(code, ok => {
    if (ok) {
      renderMultiplayerPanel();
      render();
      syncMusicToGameState();
    }
  });
};
$('mpLeaveBtn').onclick = () => {
  if (!confirm('¿Salir de la sala multijugador? Podrás seguir jugando localmente.'))
    return;
  mpLeaveRoom();
  renderMultiplayerPanel();
};
$('mpHeroSelect').onchange = e => {
  const idx = e.target.value === '' ? null : +e.target.value;
  if (idx !== null && (!s.heroes || !s.heroes[idx])) {
    alert('No se pudo cargar ese héroe. Es probable que la sala no se haya sincronizado bien: sal de la sala y vuelve a unirte con el código.');
    return;
  }
  if (idx !== null && mpHeroIndexTakenByOther(idx)) {
    alert('Ese héroe ya lo eligió otro jugador de la sala. Elige otro.');
    renderMultiplayerPanel();
    return;
  }
  s.myHeroIndex = idx;
  save();
  const lastRoom = JSON.parse(localStorage.getItem('md2_last_room') || 'null');
  if (lastRoom)
    localStorage.setItem('md2_last_room', JSON.stringify({ ...lastRoom, heroIndex: idx, timestamp: Date.now() }));
  if (s.myHeroIndex !== null) {
    s.active = s.myHeroIndex;
    save();
    tab('hero');
    render();
    mpUpdatePresenceName(`${ h().name } (${ C[h().cls].label })`, idx);
    say(`Tu héroe es ${ heroSpoken(h()) }.`);
  } else {
    mpUpdatePresenceName('Sin héroe elegido', -1);
  }
};
renderMultiplayerPanel();
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
    currentGameTrack = null;
    startMenuAmbient();
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
      if (s.activeMissionId === 'infernal_labyrinth')
        s.missionState = {
          beastsKilled: 0
        };
      if (s.activeMissionId === 'terrifying_beast')
        s.missionState = {
          beastMaxHp: null,
          beastHp: null,
          feathersUsed: 0
        };
      if (s.activeMissionId === 'free_michael')
        s.missionState = {
          sealsBreached: 0,
          finalCombatActive: false,
          michaelMaxHp: null,
          michaelHp: null,
          michaelInvulnerable: true,
          corruptionChamber: 0,
          darkLevel: 0,
          awaitingMichaelActivation: false
        };
      if (s.activeMissionId === 'soul_collector')
        s.missionState = {
          souls: 0,
          soulsNeeded: 10 * (s.mode === 'solo' ? 2 : s.heroes.length)
        };
      if (s.activeMissionId === 'soul_keys')
        s.missionState = {
          keyTimeTokens: [1, 3, 5],
          keysCollected: [false, false, false],
          keysCollectedCount: 0,
          finalCombatActive: false,
          parcaMaxHp: null,
          parcaHp: null,
          clockZone1: 0,
          clockZone2: 0,
          parcaDarkLevel: 0,
          awaitingParcaActivation: false
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
      stopAmbient();
      startAmbient();
      $('missionSelect').value = '';
      renderMissions();
      render();
      say('Continúa la partida con los mismos héroes.');
    } else {
      s = fresh();
      save();
      stopAmbient();
      currentGameTrack = null;
      startMenuAmbient();
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
  stopAmbient();
  startAmbient();
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
  if (m.id === 'infernal_labyrinth') {
    const st = s.missionState;
    st.beastsKilled = st.beastsKilled || 0;
    return `<div class="card"><h3>Bestias Errantes</h3><p class="notice">Eliminadas: <b>${ st.beastsKilled } / 4</b></p><p class="muted">Cuando un héroe elimine una Bestia Errante, márcalo en el selector de resultado de ataque como "Bestia Errante eliminada". Se otorgan 4 XP a todo el grupo y el contador sube automáticamente. Al llegar a 4, la partida termina en victoria.</p></div>`;
  }
  if (m.id === 'terrifying_beast') {
    const st = s.missionState;
    if (st.beastMaxHp === null || st.beastMaxHp === undefined)
      return `<div class="card"><h3>La Bestia</h3><p class="notice">¿Cuánta vida tiene la Bestia? Elige el valor indicado en la ficha del Monstruo Errante.</p><label>Vida de la Bestia<select id="beastHpSelect">${ Array.from({ length: 100 }, (_, i) => i + 1).map(n => `<option value="${ n }" ${ n === 20 ? 'selected' : '' }>${ n }</option>`).join('') }</select></label><button id="confirmBeastHpBtn" class="primary top">Confirmar vida de la Bestia</button></div>`;
    const pct = Math.max(0, Math.min(100, Math.round(st.beastHp / st.beastMaxHp * 100)));
    return `<div class="card"><h3>La Bestia</h3><div class="statBarRow"><small>Vida</small><div class="statBarTrack"><div class="statBarFill hpFill" style="width:${ pct }%"></div></div><span class="statBarNum">${ st.beastHp }/${ st.beastMaxHp }</span></div><p class="notice top">Estado: <b>${ st.beastVulnerable ? 'Vulnerable esta ronda' : 'Invulnerable' }</b></p><p class="muted">Plumas de Ángel gastadas: ${ st.feathersUsed || 0 } / 5</p><p class="muted">Recoger una Pluma cuesta 1 PM. Colocarla en la zona de la Bestia (1 PM) la vuelve vulnerable el resto de la ronda; vuelve a ser invulnerable en la ronda siguiente. Si se gastan las 5 plumas y sigue con vida, derrota.</p></div>`;
  }
  if (m.id === 'free_michael') {
    const st = s.missionState;
    if (!st.finalCombatActive)
      return `<div class="card"><h3>Sellos de Corrupción</h3><p class="notice">Rotos: <b>${ st.sealsBreached || 0 } / 4</b></p><p class="muted">Cada héroe puede gastar 1 acción en la zona de un Sello para romperlo ("Romper Sello de Corrupción" en su turno). Todo el grupo gana 5 XP por sello. Al romper los 4, se habilita "Entrar a la Cámara de la Corrupción" en Movimiento.</p></div>`;
    const pct = Math.max(0, Math.min(100, Math.round(st.michaelHp / st.michaelMaxHp * 100)));
    return `<div class="card bossPanel"><div class="bossTitle">✦ EL ARCÁNGEL MIGUEL ✦<span class="bossSubtitle">El Arcángel Corrupto</span></div><div class="bossHealthTrack"><div class="bossHealthFill" style="width:${ pct }%"></div><span class="bossHealthNum">${ st.michaelHp } / ${ st.michaelMaxHp }</span></div><div class="grid top"><div><small>Nivel del medidor</small><b>${ st.darkLevel || 0 } / 5</b></div><div><small>Corrupción en la Cámara</small><b>${ st.corruptionChamber || 0 }</b></div><div><small>Dados negros extra</small><b>+${ st.extraBlackDice || 0 }</b></div><div><small>Estado</small><b>${ st.michaelInvulnerable ? 'Invulnerable' : 'Vulnerable' }</b></div></div>${ st.michaelInvulnerable ? `<button id="removeInvulnBtn" class="primary top">Quitar invulnerabilidad</button>` : `<button id="restoreInvulnBtn" class="top">Restaurar invulnerabilidad</button>` }<p class="muted top">Al tirar sus dados negros, Miguel lanza +${ st.extraBlackDice || 0 } dado(s) extra (según el medidor).</p><button id="michaelClawsEffectBtn" class="top">Miguel ataca: salieron Garras en sus dados negros</button><button id="michaelBurningBtn" class="top">Miguel está Quemado: tirar dado amarillo</button></div>`;
  }
  if (m.id === 'soul_collector') {
    const st = s.missionState;
    const pct = Math.max(0, Math.min(100, Math.round((st.souls || 0) / (st.soulsNeeded || 1) * 100)));
    return `<div class="card"><h3>Almas recolectadas</h3><div class="statBarRow"><small>Almas</small><div class="statBarTrack"><div class="statBarFill xpFill" style="width:${ pct }%"></div></div><span class="statBarNum">${ st.souls || 0 }/${ st.soulsNeeded || 0 }</span></div><p class="muted top">Se ganan Almas de forma colectiva: 1 por Secuaz o Líder eliminado, 3 por Monstruo Errante, 5 por Jaula de Almas destruida (además de 5 XP solo para quien la destruye). Al reunir el total necesario, se habilita "Salir de la mazmorra" en Movimiento. Al salir todos los héroes, victoria.</p></div>`;
  }
  if (m.id === 'soul_keys') {
    const st = s.missionState;
    if (!st.finalCombatActive) {
      const keyList = st.keyTimeTokens.map((tk, i) => st.keysCollected[i] ? `<li>Llave ${ i + 1 }: recogida ✓</li>` : `<li>Llave ${ i + 1 }: ${ tk } ficha${ tk !== 1 ? 's' : '' } de Tiempo restantes</li>`).join('');
      return `<div class="card"><h3>Llaves del Alma</h3><p class="notice">Recogidas: <b>${ st.keysCollectedCount || 0 } / 3</b></p><ul>${ keyList }</ul><p class="muted top">Cada Fase de Oscuridad se retira 1 ficha de Tiempo de cada Llave pendiente. Si a alguna se le acaban antes de recogerla, derrota inmediata. Al recoger las 3, se habilita "Entrar a la Cámara del Tiempo" en Movimiento.</p></div>`;
    }
    const pct = Math.max(0, Math.min(100, Math.round(st.parcaHp / st.parcaMaxHp * 100)));
    return `<div class="card parcaPanel"><div class="parcaTitle">☠ LA PARCA ☠<span class="parcaSubtitle">La Muerte Corrupta</span></div><div class="parcaHealthTrack"><div class="parcaHealthFill" style="width:${ pct }%"></div><span class="parcaHealthNum">${ st.parcaHp } / ${ st.parcaMaxHp }</span></div><div class="grid top"><div><small>Nivel del medidor</small><b>${ st.parcaDarkLevel || 0 } / 5</b></div><div><small>Acciones por activación</small><b>${ st.parcaActions || 1 }</b></div><div><small>Reloj de Arena 1</small><b>${ st.clockZone1 || 0 } fichas</b></div><div><small>Reloj de Arena 2</small><b>${ st.clockZone2 || 0 } fichas</b></div></div></div>`;
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
      triggerMissionResult('victory');
      log('El Artefacto Demoníaco ha sido forjado. Victoria.');
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
  if (m.id === 'terrifying_beast' && $('confirmBeastHpBtn'))
    $('confirmBeastHpBtn').onclick = () => {
      const hp = +$('beastHpSelect').value;
      s.missionState.beastMaxHp = hp;
      s.missionState.beastHp = hp;
      log(`Vida de la Bestia confirmada: ${ hp }.`);
      save();
      renderMissions();
      say(`Vida de la Bestia confirmada en ${ hp }. Es invulnerable hasta que un héroe gaste una Pluma de Ángel para atacarla.`);
    };
  if (m.id === 'free_michael' && $('removeInvulnBtn'))
    $('removeInvulnBtn').onclick = () => {
      if (michaelTotalCorruption() > 0)
        return alert(`Todavía quedan ${ s.missionState.corruptionChamber || 0 } fichas de Corrupción en la Cámara. Miguel sigue invulnerable.`);
      if (!confirm('Confirma que las 4 Piedras de Corrupción están vacías. ¿Quitar la invulnerabilidad de Miguel?'))
        return;
      s.missionState.michaelInvulnerable = false;
      log('Las 4 Piedras de Corrupción están vacías. Miguel deja de ser invulnerable.');
      save();
      renderMissions();
    };
  if (m.id === 'free_michael' && $('restoreInvulnBtn'))
    $('restoreInvulnBtn').onclick = () => {
      s.missionState.michaelInvulnerable = true;
      log('Vuelven a existir fichas de Corrupción en la Cámara. Miguel recupera su invulnerabilidad.');
      save();
      renderMissions();
      say('Miguel vuelve a ser invulnerable.');
    };
  if (m.id === 'free_michael' && $('michaelClawsEffectBtn'))
    $('michaelClawsEffectBtn').onclick = () => {
      const withCorruption = s.heroes.filter(q => (q.personalCorruption || 0) > 0);
      const opts = s.heroes.map(q => `<button data-claws-hero="${ q.id }" class="primary">${ q.name } (${ q.personalCorruption || 0 } Corrupción)</button>`).join('');
      const panel = $('heroPage');
      if (!panel)
        return;
      panel.innerHTML = `<div class="card"><h2>Garras en dados negros de Miguel</h2><p class="notice">Se infligen Heridas al héroe involucrado en el combate (atacante o defensor), 1 por cada ficha de Corrupción en su tablero personal. Luego se descartan esas fichas. ¿Cuál héroe participó en este combate?</p><div class="actions">${ opts }</div></div>`;
      document.querySelectorAll('[data-claws-hero]').forEach(b => b.onclick = () => {
        const hero = s.heroes.find(q => q.id === b.dataset.clawsHero);
        const dmg = hero.personalCorruption || 0;
        if (dmg > 0) {
          hero.hp = Math.max(0, hero.hp - dmg);
          log(`${ hero.name } recibe ${ dmg } Heridas por las Garras de Miguel (1 por cada ficha de Corrupción propia). Fichas descartadas.`);
          say(`${ hero.name } recibe ${ dmg } Heridas por Corrupción propia.`);
        } else {
          log(`${ hero.name } no tenía Corrupción propia: sin efecto de Garras.`);
        }
        hero.personalCorruption = 0;
        save();
        renderMissions();
        renderHero();
      });
    };
  if (m.id === 'free_michael' && $('michaelBurningBtn'))
    $('michaelBurningBtn').onclick = () => {
      const panel = $('heroPage');
      if (!panel)
        return;
      panel.innerHTML = `<div class="card"><h2>Miguel está Quemado</h2><p class="notice">Lanza 1 dado amarillo. ¿Cuántas espadas salieron?</p><div class="actions">${ Array.from({ length: 7 }, (_, i) => i).map(n => `<button data-burn-swords="${ n }" class="primary">${ n }</button>`).join('') }</div></div>`;
      document.querySelectorAll('[data-burn-swords]').forEach(b => b.onclick = () => {
        const dmg = +b.dataset.burnSwords;
        const st = s.missionState;
        st.michaelHp = Math.max(0, st.michaelHp - dmg);
        log(`Miguel está Quemado: recibe ${ dmg } de daño por fuego. Vida restante: ${ st.michaelHp }/${ st.michaelMaxHp }.`);
        say(`Miguel recibe ${ dmg } de daño por Quemado.`);
        save();
        renderMissions();
        renderHero();
        if (st.michaelHp <= 0) {
          stopMichaelSong();
          triggerMissionResult('victory');
          log('El Arcángel Miguel ha sido derrotado. Victoria.');
          finishFlow(true);
          duckAndSay('Miguel ha sido liberado de la Corrupción. La misión termina en victoria.');
        }
      });
    };
}
initMissions();
render();
function firstTouchStartMenuMusic() {
  document.removeEventListener('pointerdown', firstTouchStartMenuMusic);
  document.removeEventListener('touchstart', firstTouchStartMenuMusic);
  document.removeEventListener('click', firstTouchStartMenuMusic);
  document.removeEventListener('keydown', firstTouchStartMenuMusic);
  const splashEl = document.getElementById('splash');
  if (splashEl)
    splashEl.classList.add('dismiss');
  if (!s.confirmed && !s.musicMuted)
    startMenuAmbient();
}
document.addEventListener('pointerdown', firstTouchStartMenuMusic, { once: true });
document.addEventListener('touchstart', firstTouchStartMenuMusic, { once: true });
document.addEventListener('click', firstTouchStartMenuMusic, { once: true });
document.addEventListener('keydown', firstTouchStartMenuMusic, { once: true });
let onboardDemoSnapshot = null;
function startHeroDemo() {
  onboardDemoSnapshot = JSON.parse(JSON.stringify(s));
  window.__tutorialDemoActive = true;
  const demo = makeHero('paladin');
  demo.name = 'Héroe de ejemplo';
  demo.hp = Math.max(1, demo.hpMax - 2);
  demo.mana = Math.max(0, demo.manaMax - 1);
  const lvl1 = skills(demo).find(q => q.level === 1);
  if (lvl1) {
    demo.choices = { 1: lvl1.name };
    demo.lockedChoices = { 1: true };
  }
  s.heroes = [demo];
  s.active = 0;
  s.confirmed = true;
  s.mode = 'solo';
  s.phase = 0;
  s.turnPrompt = false;
  tab('hero');
  renderHeroTabs();
  render();
}
function endHeroDemo() {
  if (!onboardDemoSnapshot)
    return;
  s = onboardDemoSnapshot;
  onboardDemoSnapshot = null;
  window.__tutorialDemoActive = false;
  tab('setup');
  renderHeroTabs();
  render();
}
const ONBOARD_STEPS = [
  {
    type: 'card',
    icon: '🎲',
    title: '¡Hola! Bienvenido/a',
    body: 'Soy tu asistente digital para las partidas de Massive Darkness 2. Tú juegas con el tablero físico de siempre; yo me encargo de llevar la cuenta de vida, maná, turnos y todos los números. Te voy a mostrar los botones principales tocando cada uno en la pantalla real.'
  },
  {
    type: 'spotlight',
    selector: '#playerMode',
    title: '1. Elige el modo de partida',
    body: 'Aquí eliges si van a jugar en Solitario (1 héroe) o en Grupo (2 a 6 héroes). Empezamos siempre por acá.'
  },
  {
    type: 'spotlight',
    selector: '#classPicker',
    title: '2. Elige las clases',
    body: 'Toca la clase de cada héroe que va a participar en la partida. Solo esas clases van a aparecer durante el juego.'
  },
  {
    type: 'spotlight',
    selector: '#addSelectedClass',
    title: '3. Añade cada héroe',
    body: 'Después de elegir una clase, presiona aquí para añadirla al grupo. Repite esto por cada héroe que vayan a jugar.'
  },
  {
    type: 'spotlight',
    selector: '#confirmGroup',
    title: '4. Confirma el grupo',
    body: 'Cuando ya añadiste a todos los héroes, presiona aquí. De ahí en adelante te voy guiando paso a paso, empezando por elegir la primera habilidad de cada héroe.'
  },
  {
    type: 'card',
    demo: true,
    icon: '🛡️',
    title: 'Así se ve un héroe en juego',
    body: 'Preparé un Paladín de ejemplo para mostrarte cómo se maneja un héroe una vez que la partida arrancó. No es un héroe real, es solo para que conozcas la pantalla.'
  },
  {
    type: 'spotlight',
    demo: true,
    selector: '#heroTabs',
    title: '5. Cambiar entre héroes',
    body: 'Arriba siempre vas a ver un botón por cada héroe del grupo. Tócalo para cambiar de héroe activo en cualquier momento.'
  },
  {
    type: 'spotlight',
    demo: true,
    selector: '[data-sec="summary"]',
    title: '6. Pestaña Resumen',
    body: 'Esta es la pantalla principal de cada héroe: su vida, maná, habilidad propia, y los estados activos (como Quemado o Envenenado).'
  },
  {
    type: 'spotlight',
    demo: true,
    selector: ['#statAdjustRow1', '#statAdjustRow2'],
    title: '7. Ajuste manual',
    body: 'Si en algún momento se marca mal la vida, el maná o la experiencia (por un error de dedo o algo del juego físico), puedes corregirlo aquí mismo, sumando o restando manualmente.'
  },
  {
    type: 'spotlight',
    demo: true,
    selector: '[data-sec="skills"]',
    title: '8. Pestaña Habilidades',
    body: 'Acá se eligen las habilidades del héroe a medida que sube de nivel, organizadas por rama.'
  },
  {
    type: 'card',
    demo: true,
    icon: '⭐',
    title: 'Subir de nivel',
    body: 'Cuando un héroe junta suficiente experiencia, la app te avisa que subió de nivel y te pide elegir una nueva habilidad para esa rama. Vas a ver una pantalla especial para elegirla antes de poder seguir jugando.'
  },
  {
    type: 'spotlight',
    demo: true,
    selector: '[data-sec="actions"]',
    title: '9. Pestaña Turno',
    body: 'Acá es donde el héroe actúa: Moverse, Atacar, Recuperarse, o usar un objeto. La app te va guiando paso a paso durante cada acción.'
  },
  {
    type: 'spotlight',
    demo: true,
    selector: '[data-sec="consagracion"]',
    title: '10. Pestañas especiales',
    body: 'Algunos héroes (como este Paladín) tienen una pestaña extra con una mecánica única de su clase. El Mago tiene su Talismán, el Chamán su Tablero de Elementos, el Berserker su Corazón de Furia, y así con cada clase especial.'
  },
  {
    type: 'card',
    icon: '🔄',
    title: 'Cómo avanza una ronda',
    body: 'Cada ronda pasa por 4 fases en orden: <b>Héroes</b> (cada uno juega su turno), <b>Enemigos</b> (se activan y atacan), <b>Subida de Nivel</b> (se revisa si alguien subió), y <b>Oscuridad</b> (un evento aleatorio afecta la partida). El botón "Siguiente fase" te va llevando de una a otra, y la app te indica qué hacer en cada una.'
  },
  {
    type: 'spotlight',
    selector: 'nav',
    title: '11. Siempre a mano, abajo',
    body: 'Estos 3 botones están disponibles en todo momento: Preparación, Misiones, y Configuración. Ahí puedes ajustar el volumen, la voz, y encontrar el número de versión de la app.'
  },
  {
    type: 'spotlight',
    preAction: () => tab('missions'),
    selector: '#missionSelect',
    title: '12. Elegir misión',
    body: 'Desde acá eliges qué misión están jugando. Al elegirla, se activa automáticamente y algunas mecánicas del juego cambian según esa misión (por ejemplo, combates finales especiales con reglas propias, como el de la Parca o el del Arcángel Miguel).'
  },
  {
    type: 'spotlight',
    preAction: () => tab('settings'),
    selector: ['#reactivateAmbient', '#repeatLastAnnouncement'],
    title: '13. Si se corta el audio',
    body: 'A veces el celular puede cortar la música o la narración por voz (por ejemplo, al pasar la app a segundo plano un buen rato). Si eso pasa, estos botones la reactivan sin perder nada de la partida.'
  },
  {
    type: 'card',
    icon: '🌐',
    title: 'La función estrella: multijugador',
    body: 'Esta app permite que <b>cada jugador use su propio celular</b> a la vez, todos conectados a la misma partida en tiempo real. Uno arma el grupo completo con todos los héroes, y luego cada persona se conecta desde su dispositivo y elige cuál de esos héroes va a manejar.'
  },
  {
    type: 'spotlight',
    preAction: () => tab('settings'),
    selector: '#mpControls',
    title: '14. Crear o unirse a una sala',
    body: 'Un jugador (normalmente quien arma el grupo) toca "Crear sala" y le va a aparecer un código de 5 letras. Ese código se comparte con el resto del grupo. Cada uno de los demás jugadores, desde su propio celular, escribe ese código acá y toca "Unirse".'
  },
  {
    type: 'card',
    icon: '🎮',
    title: 'Cada jugador, su héroe',
    body: 'Una vez dentro de la sala, cada jugador elige en su celular cuál héroe del grupo va a controlar él. <b>Un jugador solo puede manejar el héroe que eligió</b>: puede ver a los demás héroes, pero no puede tocar sus botones ni cambiar sus datos. Así cada uno juega su propio turno desde su propio dispositivo, y todos ven la partida actualizarse en tiempo real en las pantallas de los demás.'
  },
  {
    type: 'card',
    icon: '📖',
    title: 'Sobre las reglas',
    body: 'Una vez que confirmes tu grupo, vas a ver un botón "Reglas" arriba, junto a los héroes. Ahí encontrás explicaciones rápidas de varias mecánicas del juego. Pero recuerda siempre: esta app aclara dudas puntuales, el <b>libro de reglas físico de Massive Darkness 2 es la fuente definitiva</b> ante cualquier duda o diferencia. Si algo en la app no coincide con el manual, el manual manda.'
  },
  {
    type: 'card',
    icon: '✅',
    title: '¡Listo para jugar!',
    body: 'Eso es todo lo esencial. Si en algún momento algo no se entiende, prueba tocar el botón, explora sin miedo: esto está para ayudarte, no para complicarte. ¡Que tengan una gran partida!'
  }
];
let onboardStepIndex = 0;
function positionSpotlight(selectorOrArray) {
  const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
  const els = selectors.map(sel => document.querySelector(sel)).filter(Boolean);
  const hole = $('spotlightHole');
  const tip = $('spotlightTooltip');
  if (!els.length) {
    hole.style.display = 'none';
    tip.style.top = '50%';
    tip.style.left = '50%';
    tip.style.transform = 'translate(-50%,-50%)';
    return;
  }
  function combinedRect() {
    const rects = els.map(el => el.getBoundingClientRect());
    return {
      top: Math.min(...rects.map(r => r.top)),
      left: Math.min(...rects.map(r => r.left)),
      right: Math.max(...rects.map(r => r.right)),
      bottom: Math.max(...rects.map(r => r.bottom))
    };
  }
  const pad = 8;
  const r = combinedRect();
  hole.style.display = 'block';
  hole.style.top = (r.top - pad) + 'px';
  hole.style.left = (r.left - pad) + 'px';
  hole.style.width = (r.right - r.left + pad * 2) + 'px';
  hole.style.height = (r.bottom - r.top + pad * 2) + 'px';
  els[0].scrollIntoView({ block: 'center', behavior: 'instant' });
  requestAnimationFrame(() => {
    const r2 = combinedRect();
    hole.style.top = (r2.top - pad) + 'px';
    hole.style.left = (r2.left - pad) + 'px';
    hole.style.width = (r2.right - r2.left + pad * 2) + 'px';
    hole.style.height = (r2.bottom - r2.top + pad * 2) + 'px';
    const tipW = 280, tipH = tip.offsetHeight || 160;
    let top = r2.bottom + pad + 10;
    if (top + tipH > window.innerHeight - 10)
      top = Math.max(10, r2.top - tipH - pad - 10);
    let left = Math.min(Math.max(10, r2.left), window.innerWidth - tipW - 10);
    tip.style.transform = 'none';
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  });
}
function renderOnboardStep() {
  const step = ONBOARD_STEPS[onboardStepIndex];
  const isLast = onboardStepIndex === ONBOARD_STEPS.length - 1;
  const needsDemo = !!step.demo;
  const demoIsActive = !!onboardDemoSnapshot;
  if (needsDemo && !demoIsActive)
    startHeroDemo();
  else if (!needsDemo && demoIsActive)
    endHeroDemo();
  if (step.preAction)
    step.preAction();
  if (step.type === 'card') {
    $('spotlightOverlay').classList.remove('active');
    $('onboardTutorialModal').classList.remove('hidden');
    $('onboardStepContent').innerHTML = `<div class="onboardStepIcon">${ step.icon }</div><h2>${ step.title }</h2><p>${ step.body }</p>`;
    $('onboardStepDots').innerHTML = ONBOARD_STEPS.map((_, i) => `<div class="onboardStepDot ${ i === onboardStepIndex ? 'active' : '' }"></div>`).join('');
    $('onboardPrevBtn').disabled = onboardStepIndex === 0;
    $('onboardNextBtn').textContent = isLast ? '¡Listo, a jugar!' : 'Siguiente →';
  } else {
    $('onboardTutorialModal').classList.add('hidden');
    $('spotlightOverlay').classList.add('active');
    $('spotlightTitle').textContent = step.title;
    $('spotlightBody').innerHTML = step.body;
    $('spotlightCounter').textContent = `Paso ${ onboardStepIndex + 1 } de ${ ONBOARD_STEPS.length }`;
    $('spotlightPrevBtn').disabled = onboardStepIndex === 0;
    $('spotlightNextBtn').textContent = isLast ? '¡Listo, a jugar!' : 'Siguiente →';
    positionSpotlight(step.selector);
  }
}
function advanceOnboard() {
  if (onboardStepIndex === ONBOARD_STEPS.length - 1) {
    closeOnboarding();
    return;
  }
  onboardStepIndex++;
  renderOnboardStep();
}
function retreatOnboard() {
  if (onboardStepIndex > 0) {
    onboardStepIndex--;
    renderOnboardStep();
  }
}
function closeOnboarding() {
  if (onboardDemoSnapshot)
    endHeroDemo();
  $('onboardTutorialModal').classList.add('hidden');
  $('spotlightOverlay').classList.remove('active');
  checkMpReconnect();
}
function initOnboardingFlow() {
  setTimeout(() => {
    $('disclaimerModal').classList.remove('hidden');
  }, 4300);
  $('acceptDisclaimerBtn').onclick = () => {
    $('disclaimerModal').classList.add('hidden');
    $('onboardAskModal').classList.remove('hidden');
  };
  $('onboardYesBtn').onclick = () => {
    $('onboardAskModal').classList.add('hidden');
    onboardStepIndex = 0;
    renderOnboardStep();
  };
  $('onboardNoBtn').onclick = () => {
    $('onboardAskModal').classList.add('hidden');
    checkMpReconnect();
  };
  $('onboardNextBtn').onclick = advanceOnboard;
  $('onboardPrevBtn').onclick = retreatOnboard;
  $('spotlightNextBtn').onclick = advanceOnboard;
  $('spotlightPrevBtn').onclick = retreatOnboard;
  $('onboardSkipBtn').onclick = () => closeOnboarding();
  window.addEventListener('resize', () => {
    const step = ONBOARD_STEPS[onboardStepIndex];
    if (step && step.type === 'spotlight' && $('spotlightOverlay').classList.contains('active'))
      positionSpotlight(step.selector);
  });
}
initOnboardingFlow();
function checkMpReconnect() {
  const lastRoom = JSON.parse(localStorage.getItem('md2_last_room') || 'null');
  if (!lastRoom || s.roomCode) {
    return;
  }
  const hoursSince = (Date.now() - (lastRoom.timestamp || 0)) / 3600000;
  if (hoursSince > 12) {
    localStorage.removeItem('md2_last_room');
    return;
  }
  $('mpReconnectText').textContent = `Este dispositivo estaba unido a la sala ${ lastRoom.code }. ¿Quieres reconectarte para seguir jugando?`;
  $('mpReconnectModal').classList.remove('hidden');
  $('mpReconnectYesBtn').onclick = () => {
    $('mpReconnectModal').classList.add('hidden');
    mpJoinRoom(lastRoom.code, ok => {
      if (!ok) {
        localStorage.removeItem('md2_last_room');
        return;
      }
      if (lastRoom.heroIndex !== null && lastRoom.heroIndex !== undefined && s.heroes[lastRoom.heroIndex]) {
        s.myHeroIndex = lastRoom.heroIndex;
        s.active = lastRoom.heroIndex;
        save();
        mpUpdatePresenceName(`${ s.heroes[lastRoom.heroIndex].name } (${ C[s.heroes[lastRoom.heroIndex].cls].label })`, lastRoom.heroIndex);
        tab('hero');
      } else {
        tab('setup');
      }
      renderMultiplayerPanel();
      render();
      syncMusicToGameState();
      say('Te reconectaste a la sala.');
    });
  };
  $('mpReconnectNoBtn').onclick = () => {
    $('mpReconnectModal').classList.add('hidden');
    localStorage.removeItem('md2_last_room');
  };
}
