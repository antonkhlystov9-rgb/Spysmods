// The Night Shelver — core: namespace, helpers, settings and save data
(function () {
  'use strict';
  const TH = window.TH = {};
  TH.VERSION = '2.0.0';
  TH.desktop = window.desktop || null;

  // ---------- helpers ----------
  TH.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  TH.lerp = (a, b, t) => a + (b - a) * t;
  TH.rand = (a, b) => a + Math.random() * (b - a);
  TH.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  TH.shuffle = (a, rng = Math.random) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (rng() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  TH.rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hex2 = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  TH.mix = (h1, h2, t) => {
    const a = hex2(h1), b = hex2(h2);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  TH.hsl = (h, sat, l) => {
    const f = (n) => { const k = (n + h / 30) % 12, a = sat * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
    return '#' + f(0) + f(8) + f(4);
  };
  TH.fmt = (n) => Math.floor(n).toLocaleString('en-US');
  TH.time = (s) => { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  TH.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const merge = (base, over) => {
    const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    if (!over || typeof over !== 'object') return out;
    for (const k of Object.keys(over)) {
      const b = base[k], o = over[k];
      if (b && typeof b === 'object' && !Array.isArray(b) && o && typeof o === 'object' && !Array.isArray(o)) out[k] = merge(b, o);
      else if (o !== undefined && o !== null) out[k] = o;
    }
    return out;
  };
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------- settings ----------
  const SKEY = 'nightshelver.settings.v1';
  TH.DEFAULTS = {
    audio: { master: 80, music: 55, sfx: 80, ambience: 30, ambType: 'off', muteUnfocused: true, ambFix: 1 },
    video: {
      mode: 'windowed', res: '1600x900', renderScale: 100, quality: 'high', fpsCap: 0, fov: 75,
      showFps: false, uiScale: 100, reduceMotion: false, bob: true, particles: true
    },
    controls: {
      sens: 100, invertY: false, hold: true,
      keys: {
        forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', run: 'ShiftLeft',
        interact: 'KeyE', grab: 'KeyF', read: 'KeyR',
        ability1: 'Digit1', ability2: 'Digit2', ability3: 'Digit3', ability4: 'Digit4',
        pause: 'KeyP', fullscreen: 'F11', mute: 'KeyM'
      }
    },
    game: { names: true, exact: false, tips: true, crosshair: true }
  };
  const savedSettings = store.get(SKEY);
  TH.Settings = merge(clone(TH.DEFAULTS), savedSettings);
  // Earlier versions turned a noisy fireplace ambience on by default; switch it off once for anyone who still has it.
  if (savedSettings && savedSettings.audio && !savedSettings.audio.ambFix) { TH.Settings.audio.ambType = 'off'; TH.Settings.audio.ambFix = 1; store.set(SKEY, TH.Settings); }
  TH.saveSettings = () => store.set(SKEY, TH.Settings);
  TH.resetSettings = (section) => {
    TH.Settings[section] = clone(TH.DEFAULTS[section]);
    TH.saveSettings();
  };

  // ---------- save data ----------
  const DKEY = 'nightshelver.save.v1';
  const blank = () => ({
    v: 1, coins: 0, started: false,
    shelved: [],    // one 0/1 per book
    goldFound: {},  // bookId -> 1 once a gilded book has been shelved
    read: {},       // bookId -> 1 once you have opened it
    marks: {},      // bookmarkId -> 1 when collected
    gates: {},      // wing index -> 1 when its door is open
    ach: {},        // achievementId -> timestamp
    abil: { gather: 1, tidy: 1, golden: 1, way: 1 },
    charge: {},
    upg: { satchel: 0, boots: 0, reach: 0 },
    moods: ['lamp'], mood: 'lamp',
    tips: {},
    pos: null,      // where you were standing
    stats: {
      placed: 0, mistakes: 0, bestStreak: 0, rows: 0, cases: 0, wings: 0, golds: 0, marks: 0, abilUses: 0,
      gatherBest: 0, piles: 0, metres: 0, playTime: 0, earned: 0, spent: 0, mostHeld: 0, rounds: 0
    }
  });
  let saveTimer = 0;
  TH.Save = {
    data: merge(blank(), store.get(DKEY)),
    commit() {
      if (saveTimer) return;
      saveTimer = setTimeout(() => { saveTimer = 0; store.set(DKEY, TH.Save.data); }, 400);
    },
    flush() { clearTimeout(saveTimer); saveTimer = 0; store.set(DKEY, TH.Save.data); },
    reset() { TH.Save.data = blank(); TH.Save.flush(); },
    earn(n) {
      n = Math.round(n); if (n <= 0) return 0;
      TH.Save.data.coins += n; TH.Save.data.stats.earned += n; TH.Save.commit(); return n;
    },
    spend(n) {
      const d = TH.Save.data; if (d.coins < n) return false;
      d.coins -= n; d.stats.spent += n; TH.Save.commit(); return true;
    }
  };
  window.addEventListener('beforeunload', () => TH.Save.flush());
})();
