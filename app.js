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
    s = mpDeepFixArrays(remote);
    try {
      normalizeState();
    } catch (err) {
      console.error('Error al normalizar estado remoto:', err);
    }
    s.myHeroIndex = myHeroIndex;
    if (myActive !== undefined && myActive !== null && s.heroes && s.heroes[myActive])
      s.active = myActive;
    localStorage.setItem(KEY, JSON.stringify(s));
    mpApplyingRemote = false;
    render();
  });
}
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
  mpSubscribe(code);
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
    mpApplyingRemote = false;
    mpSubscribe(code);
    if (cb)
      cb(true);
  }).catch(err => {
    console.error(err);
    alert(`Error al buscar la sala: ${ (err && err.message) || err || 'desconocido' }`);
    if (cb)
      cb(false);
  });
}
function mpLeaveRoom() {
  if (mpRoomRef) {
    mpRoomRef.off();
    mpRoomRef = null;
  }
  s.roomCode = null;
  s.myHeroIndex = null;
  save();
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
function mpDeepFixArrays(obj, seen) {
  seen = seen || new Set();
  if (!obj || typeof obj !== 'object' || seen.has(obj))
    return obj;
  seen.add(obj);
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++)
      obj[i] = mpDeepFixArrays(obj[i], seen);
    return obj;
  }
  const keys = Object.keys(obj);
  const looksLikeArray = keys.length > 0 && keys.every(k => /^\d+$/.test(k));
  if (looksLikeArray) {
    const arr = [];
    keys.forEach(k => {
      arr[+k] = mpDeepFixArrays(obj[k], seen);
    });
    return arr;
  }
  keys.forEach(k => {
    obj[k] = mpDeepFixArrays(obj[k], seen);
  });
  return obj;
}
function normalizeState() {
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
const MICHAEL_SONG_RESTART_AT = 185;
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
      if (!el.__restarting && el.currentTime >= MICHAEL_SONG_RESTART_AT)
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
let currentGameTrack = null;
function ambientEl() {
  let el = document.getElementById('ambientSong');
  if (!el) {
    el = document.createElement('audio');
    el.id = 'ambientSong';
    el.preload = 'auto';
    el.addEventListener('ended', onAmbientTrackEnded);
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
function playRandomGameTrack(withFadeOutFirst = false) {
  const el = ambientEl();
  const doSwitch = () => {
    el.loop = false;
    const options = GAME_TRACKS.filter(t => t !== currentGameTrack);
    const next = options[Math.floor(Math.random() * options.length)] || GAME_TRACKS[0];
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
    const el = document.getElementById('michaelSong');
    if (el && !el.paused) {
      say('La música ya se está reproduciendo.');
      return;
    }
    startMichaelSong();
    say('Música del Combate Final reactivada.');
    return;
  }
  if (activeMissionId === 'soul_keys' && s.missionState.finalCombatActive && !s.missionResult) {
    const el = document.getElementById('parcaSong');
    if (el && !el.paused) {
      say('La música ya se está reproduciendo.');
      return;
    }
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
  renderMultiplayerPanel();
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
  $('heroPage').innerHTML = `<div class="activeHeroBanner">Héroe activo: ${ heroSpoken(x) }</div>${ x.unconscious ? '<div class="unconsciousBanner">INCONSCIENTE \xB7 Tumba la miniatura. No realiza acciones ni puede ser objetivo.</div>' : '' }<div class="card heroHeader zone-${ x.zone === 'dark' ? 'dark' : 'light' }" id="heroHeaderCard"><div id="floatNumSlot"></div><div class="row between"><div><h2>${ classIcon(x.cls) }${ x.name }</h2><small>${ C[x.cls].label }</small></div>${ levelBadge(x.level) }</div>${ heroBarsHtml(x) }<div class="stats top"><div><small>Acciones</small><b>${ x.actions }</b></div><div><small>Zona</small><b>${ x.zone === 'dark' ? 'Oscuridad' : 'Luz' }</b></div><div><small>Habilidad pendiente</small><b>${ pending(x) ? 'Sí' : 'No' }</b></div>${ getActiveMission()?.id === 'terrifying_beast' ? `<div><small>Plumas de Ángel</small><b>${ x.angelFeathers || 0 } 🪶</b></div>` : '' }${ getActiveMission()?.id === 'free_michael' && s.missionState.finalCombatActive ? `<div><small>Corrupción propia</small><b>${ x.personalCorruption || 0 } 😈</b></div>` : '' }</div></div><div class="sectionTabs"><button data-sec="summary" class="${ !x.flow.type && (!activeSec || activeSec === 'summary') ? 'active' : '' }">Resumen</button><button data-sec="skills" class="${ activeSec === 'skills' ? 'active' : '' }">Habilidades${ pending(x) ? '<span class="alertDot"></span>' : '' }</button><button data-sec="actions" class="${ x.flow.type || activeSec === 'actions' ? 'active' : '' }">Turno</button>${ x.cls === 'shaman' ? `<button data-sec="spirits" class="${ activeSec === 'spirits' ? 'active' : '' }">Espíritus</button>` : '' }<button data-sec="inventory" class="${ activeSec === 'inventory' ? 'active' : '' }">Inventario</button></div><div id="sec-summary" class="heroSection ${ !x.flow.type && (!activeSec || activeSec === 'summary') ? 'active' : '' }">${ summaryHtml(x) }</div><div id="sec-skills" class="heroSection ${ activeSec === 'skills' ? 'active' : '' }">${ skillsHtml(x) }</div><div id="sec-actions" class="heroSection ${ x.flow.type || activeSec === 'actions' ? 'active' : '' }">${ actionsHtml(x) }</div>${ x.cls === 'shaman' ? `<div id="sec-spirits" class="heroSection ${ activeSec === 'spirits' ? 'active' : '' }"><div class="card"><h2>Espíritus invocados</h2>${ shamanSpiritHtml(x) }</div></div>` : '' }<div id="sec-inventory" class="heroSection ${ activeSec === 'inventory' ? 'active' : '' }">${ inventoryHtml(x) }</div>`;
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
  return `<div class="card"><h2>Turno de ${ x.name }</h2><p class="notice">Acciones restantes: <b>${ x.actions }</b></p><div class="actions"><button id="moveAction">Movimiento</button><button id="attackAction">Ataque</button><button data-action="Recuperación">Recuperación</button><button data-action="Intercambiar y equipar">Intercambiar y equipar</button><button data-action="Acción especial">Acción especial (objeto)</button>${ missionTurnButton(x) }<button id="finishTurn" class="primary">Finalizar turno</button></div></div>${ flowHtml(x) }`;
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
    return `<div class="card actionFlow active"><h2>Ataque al Arcángel Miguel</h2><button id="repeatAttackSteps" class="top">🔊 Repetir pasos</button><ol class="notice top"><li>Arma tu reserva de dados según tu tipo de ataque.</li><li>Lanza físicamente los dados.</li><li>Revisa habilidades y efectos disponibles.</li><li>Marca el daño causado y confirma.</li></ol><div class="resultBox">${ attackReminders(x) }</div>${ suggestion ? `<button id="berserkerStanceSuggest" class="top">${ suggestion.label }</button>` : '' }${ x.cls === 'berserker' && x.berserker.stance === 'Furia Sangrienta' ? `<button id="furyReroll" class="top" ${ x.berserker.fury < 1 ? 'disabled' : '' }>Gastar 1 Furia: relanzar un dado (${ x.berserker.fury }/7)</button>` : '' }<p class="notice top">Vida actual de Miguel: <b>${ st.michaelHp }/${ st.michaelMaxHp }</b></p><label>Daño causado a Miguel<select id="michaelDamageDealt">${ Array.from({ length: 21 }, (_, i) => i).map(n => `<option value="${ n }">${ n }</option>`).join('') }</select></label><button id="confirmMichaelDamage" class="primary top">Confirmar daño a Miguel</button></div>`;
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
  document.querySelectorAll('[data-attacktype]').forEach(b => b.onclick = () => {
    const type = b.dataset.attacktype;
    x.flow.attackType = type;
    const label = type === 'distancia' ? 'a distancia' : type === 'cuerpo' ? 'cuerpo a cuerpo' : 'mágico';
    log(`${ x.name } declara un ataque ${ label }.`);
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
  const extraInfo = `${ x.cls === 'shaman' && type === 'attack' ? ' Revisa tus Bendiciones y las habilidades del Chamán disponibles según tus elementos.' : '' }${ type === 'attack' ? ' Elige primero el tipo de ataque.' : '' }`;
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
      say(`${ x.name } recoge un fragmento. Gana 5 de experiencia.`);
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
      say(`Pluma colocada. La Bestia es vulnerable el resto de la ronda.`);
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
      say(`Cristal destruido. ${ st.crystalsDestroyed } de 5.${ bonus ? ` La espada gana ${ bonus }.` : '' }`);
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
        say(`Sello roto. ${ st.sealsBreached } de 4. Los 4 Sellos están rotos: ya pueden entrar a la Cámara de la Corrupción gastando 1 punto de movimiento.`);
      else
        say(`Sello roto. ${ st.sealsBreached } de 4. Todo el grupo gana 5 de experiencia.`);
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
      say(`Jaula destruida. Ganas 5 de experiencia. El grupo tiene ${ st.souls } de ${ st.soulsNeeded } Almas.`);
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
    say(`Llave recogida. Todo el grupo gana 8 de experiencia. Llaves: ${ st.keysCollectedCount } de 3.`);
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
  const st = s.missionState;
  return (st.corruptionStone1 || 0) + (st.corruptionStone2 || 0);
}
function addMichaelCorruption(n) {
  const st = s.missionState;
  const wasZero = michaelTotalCorruption() === 0;
  for (let i = 0; i < n; i++) {
    if ((st.corruptionStone1 || 0) <= (st.corruptionStone2 || 0))
      st.corruptionStone1 = (st.corruptionStone1 || 0) + 1;
    else
      st.corruptionStone2 = (st.corruptionStone2 || 0) + 1;
  }
  if (wasZero && !st.michaelInvulnerable) {
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
    panel.innerHTML = `<div class="card"><h2>⚔️ Activación del Arcángel Miguel</h2><p class="notice">Lanza 2 dados negros. ¿Cuántas <b>garras</b> (no marcas de garra, esas se ignoran) salieron?</p><div class="actions"><button data-claws="0" class="primary">0 garras</button><button data-claws="1" class="primary">1 garra</button><button data-claws="2" class="primary">2 garras</button></div></div>`;
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
    st.michaelAbilityText = 'Coloca a Miguel en la Zona del héroe con más Vida y ataca a ese héroe.';
    st.michaelClawStep = 'single-damage';
    log('Miguel se activa con 0 garras: Justicia Celestial.');
    save();
    render();
    duckAndSay('Justicia Celestial.');
    return;
  }
  if (claws === 1) {
    const restored = addMichaelCorruption(1);
    if (restored)
      log('Nueva ficha de Corrupción en la Cámara: Miguel vuelve a ser invulnerable.');
    st.michaelAbilityName = 'Embestida de Lanza';
    st.michaelAbilityText = `Coloca 1 ficha de Corrupción en la Piedra con menor cantidad. Coloca a Miguel en la Zona del héroe con menos Vida y ataca a ese héroe. Fichas de Corrupción: Piedra 1: ${ st.corruptionStone1 }, Piedra 2: ${ st.corruptionStone2 }.`;
    st.michaelClawStep = 'single-damage';
    log(`Miguel se activa con 1 garra: Embestida de Lanza. Piedra 1: ${ st.corruptionStone1 }, Piedra 2: ${ st.corruptionStone2 }.`);
    save();
    render();
    renderMissions();
    duckAndSay(`Embestida de Lanza. Una ficha de Corrupción más en la Piedra con menos fichas.`);
    return;
  }
  const restored = addMichaelCorruption(1);
  if (restored)
    log('Nueva ficha de Corrupción en la Cámara: Miguel vuelve a ser invulnerable.');
  const mult = michaelBlessingMultiplier(st.darkLevel || 0);
  const totalCorruption = michaelTotalCorruption();
  const total = mult * totalCorruption;
  st.michaelBlessingTotal = total;
  st.michaelBlessingDist = {};
  st.michaelClawStep = 'blessing-damage';
  log(`Miguel se activa con 2 garras: Bendición Oscura. ${ mult } de daño por cada una de las ${ totalCorruption } fichas de Corrupción totales = ${ total } Heridas en total.`);
  save();
  render();
  renderMissions();
  duckAndSay(`Bendición Oscura. Inflige ${ total } Heridas, distribúyanlas como deseen.`);
}
function triggerParcaActivation(isLastHero) {
  const st = s.missionState;
  st.awaitingParcaActivation = true;
  st.parcaPendingAfter = isLastHero ? 'phase' : 'prompt';
  st.parcaClawStep = 'ask';
  save();
  render();
  duckAndSay('La Parca se activa. Lanza 2 dados negros.');
}
function resolveParcaAfterActivation() {
  const st = s.missionState;
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
  if (!st.corruptionRollStone) {
    panel.innerHTML = `<div class="card"><h2>Retirar Ficha de Corrupción</h2><p class="notice">${ x.name }, ¿de cuál Piedra de Corrupción estás retirando la ficha?</p><div class="actions"><button data-corrstone="1" class="primary">Piedra 1 (${ st.corruptionStone1 || 0 })</button><button data-corrstone="2" class="primary">Piedra 2 (${ st.corruptionStone2 || 0 })</button></div></div>`;
    document.querySelectorAll('[data-corrstone]').forEach(b => b.onclick = () => {
      st.corruptionRollStone = b.dataset.corrstone;
      save();
      renderCorruptionRemoval();
    });
    return;
  }
  panel.innerHTML = `<div class="card"><h2>Retirar Ficha de Corrupción</h2><p class="notice">${ x.name } lanza 1 dado negro. ¿Qué símbolo salió?</p><div class="actions"><button data-corruptionroll="none" class="primary">Ninguno (limpio)</button><button data-corruptionroll="claw">Garra</button><button data-corruptionroll="hand">Mano</button><button data-corruptionroll="both">Ambos símbolos</button></div></div>`;
  document.querySelectorAll('[data-corruptionroll]').forEach(b => b.onclick = () => resolveCorruptionRemoval(x, b.dataset.corruptionroll));
}
function resolveCorruptionRemoval(x, result) {
  const st = s.missionState;
  const stoneKey = st.corruptionRollStone === '2' ? 'corruptionStone2' : 'corruptionStone1';
  st[stoneKey] = Math.max(0, (st[stoneKey] || 0) - 1);
  let msg = `${ x.name } retira 1 ficha de la Piedra ${ st.corruptionRollStone }. Piedra 1: ${ st.corruptionStone1 }, Piedra 2: ${ st.corruptionStone2 }.`;
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
  st.corruptionRollStone = null;
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
    panel.innerHTML = `<div class="card"><h2>☠ Activación de la Parca</h2><p class="notice">Lanza 2 dados negros. ¿Cuántas <b>garras</b> (no marcas de garra, esas se ignoran) salieron?</p><div class="actions"><button data-parcaclaws="0" class="primary">0 garras</button><button data-parcaclaws="1" class="primary">1 garra</button><button data-parcaclaws="2" class="primary">2 garras</button></div></div>`;
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
      st.parcaSwordsResult = swords;
      st.parcaClawStep = 'clock-distribute';
      st.parcaClockDist = {
        1: 0,
        2: 0
      };
      s.heroes.forEach(q => {
        if (!q.unconscious)
          q.mana = Math.max(0, q.mana - swords);
      });
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
  const half = Math.floor(total / 2);
  st.corruptionSetupTotal = total;
  st.corruptionStone1 = half;
  st.corruptionStone2 = total - half;
  st.awaitingCorruptionSetup = true;
  s.heroes.forEach(q => {
    q.hp = q.hpMax;
    q.mana = q.manaMax;
  });
  log(`Comienza el Combate Final contra el Arcángel Miguel corrupto. Vida de Miguel: ${ st.michaelHp }. Se deben colocar ${ total } fichas de Corrupción entre las 2 Piedras.`);
  save();
  renderHero();
  renderMissions();
  say(`Deben colocar ${ total } fichas de Corrupción entre las dos Piedras.`);
}
function renderCorruptionSetup() {
  const st = s.missionState;
  const panel = $('heroPage');
  if (!panel)
    return;
  const assigned = (st.corruptionStone1 || 0) + (st.corruptionStone2 || 0);
  const remaining = st.corruptionSetupTotal - assigned;
  panel.innerHTML = `<div class="card"><h2>Repartir Fichas de Corrupción</h2><p class="notice">Se colocan ${ st.corruptionSetupTotal } fichas de Corrupción entre las 2 Piedras, de la forma más equitativa posible. Propuesta: Piedra 1: ${ st.corruptionStone1 }, Piedra 2: ${ st.corruptionStone2 }.</p><div class="grid top"><div class="elementRow"><span class="badge">Piedra 1: ${ st.corruptionStone1 }</span><button data-corrsetup="1" data-d="-1" ${ (st.corruptionStone1 || 0) <= 0 ? 'disabled' : '' }>−</button><button data-corrsetup="1" data-d="1" ${ remaining <= 0 ? 'disabled' : '' }>+</button></div><div class="elementRow"><span class="badge">Piedra 2: ${ st.corruptionStone2 }</span><button data-corrsetup="2" data-d="-1" ${ (st.corruptionStone2 || 0) <= 0 ? 'disabled' : '' }>−</button><button data-corrsetup="2" data-d="1" ${ remaining <= 0 ? 'disabled' : '' }>+</button></div></div><p class="muted top">Por repartir: ${ remaining }</p><button id="confirmCorruptionSetup" class="primary top" ${ remaining !== 0 ? 'disabled' : '' }>Confirmar reparto</button></div>`;
  document.querySelectorAll('[data-corrsetup]').forEach(b => b.onclick = () => {
    const stone = b.dataset.corrsetup, d = +b.dataset.d;
    const key = stone === '1' ? 'corruptionStone1' : 'corruptionStone2';
    st[key] = Math.max(0, (st[key] || 0) + d);
    save();
    renderCorruptionSetup();
  });
  if ($('confirmCorruptionSetup'))
    $('confirmCorruptionSetup').onclick = () => finishMichaelCorruptionSetup();
}
function finishMichaelCorruptionSetup() {
  const st = s.missionState;
  st.awaitingCorruptionSetup = false;
  startNewHeroPhaseForFinalCombat();
  log(`Fichas de Corrupción repartidas: Piedra 1: ${ st.corruptionStone1 }, Piedra 2: ${ st.corruptionStone2 }.`);
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
    effectText = 'Sin efecto adicional (las fichas iniciales ya están repartidas entre las Piedras).';
  } else if (st.darkLevel === 2) {
    st.extraBlackDice = 1;
    effectText = 'Miguel lanza 1 dado negro adicional en ataque y defensa.';
  } else if (st.darkLevel === 3) {
    const restored = addMichaelCorruption(2);
    effectText = restored ? 'Se añaden 2 fichas de Corrupción más entre las Piedras: Miguel vuelve a ser invulnerable.' : 'Se añaden 2 fichas de Corrupción más entre las Piedras.';
  } else if (st.darkLevel === 4) {
    st.extraBlackDice = 2;
    effectText = 'Miguel lanza 2 dados negros adicionales en ataque y defensa.';
  } else if (st.darkLevel === 5) {
    const restored = addMichaelCorruption(3);
    effectText = (restored ? 'Se añaden 3 fichas de Corrupción más entre las Piedras: Miguel vuelve a ser invulnerable. ' : 'Se añaden 3 fichas de Corrupción más entre las Piedras. ') + 'El medidor de Miguel llega a su nivel máximo.';
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
    select.innerHTML = '<option value="">Solo observar (fase/oscuridad/enemigos)</option>' + s.heroes.map((x, i) => `<option value="${ i }" ${ s.myHeroIndex === i ? 'selected' : '' }>${ x.name } (${ C[x.cls].label })</option>`).join('');
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
  s.myHeroIndex = idx;
  save();
  if (s.myHeroIndex !== null) {
    s.active = s.myHeroIndex;
    save();
    tab('hero');
    render();
    say(`Tu héroe es ${ heroSpoken(h()) }.`);
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
          corruptionStone1: 0,
          corruptionStone2: 0,
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
    return `<div class="card bossPanel"><div class="bossTitle">✦ EL ARCÁNGEL MIGUEL ✦<span class="bossSubtitle">El Arcángel Corrupto</span></div><div class="bossHealthTrack"><div class="bossHealthFill" style="width:${ pct }%"></div><span class="bossHealthNum">${ st.michaelHp } / ${ st.michaelMaxHp }</span></div><div class="grid top"><div><small>Nivel del medidor</small><b>${ st.darkLevel || 0 } / 5</b></div><div><small>Piedra 1</small><b>${ st.corruptionStone1 || 0 }</b></div><div><small>Piedra 2</small><b>${ st.corruptionStone2 || 0 }</b></div><div><small>Dados negros extra</small><b>+${ st.extraBlackDice || 0 }</b></div><div><small>Estado</small><b>${ st.michaelInvulnerable ? 'Invulnerable' : 'Vulnerable' }</b></div></div>${ st.michaelInvulnerable ? `<button id="removeInvulnBtn" class="primary top">Quitar invulnerabilidad</button>` : `<button id="restoreInvulnBtn" class="top">Restaurar invulnerabilidad</button>` }</div>`;
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
        return alert(`Todavía quedan fichas de Corrupción (Piedra 1: ${ s.missionState.corruptionStone1 || 0 }, Piedra 2: ${ s.missionState.corruptionStone2 || 0 }). Miguel sigue invulnerable.`);
      if (!confirm('Confirma que ambas Piedras de Corrupción están vacías. ¿Quitar la invulnerabilidad de Miguel?'))
        return;
      s.missionState.michaelInvulnerable = false;
      log('Ambas Piedras de Corrupción están vacías. Miguel deja de ser invulnerable.');
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