// Tidy Hollow — core: namespace, helpers, settings and save data
(function () {
  'use strict';
  const TH = window.TH = {};
  TH.VERSION = '1.0.0';
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
  const SKEY = 'tidyhollow.settings.v1';
  TH.DEFAULTS = {
    audio: { master: 80, music: 55, sfx: 80, ambience: 40, ambType: 'fire', muteUnfocused: true },
    video: {
      mode: 'windowed', res: '1600x900', renderScale: 100, quality: 'high', fpsCap: 0,
      showFps: false, uiScale: 100, reduceMotion: false, shake: true, particles: true
    },
    controls: {
      carry: 'drag', assist: 'normal',
      keys: {
        ability1: 'Digit1', ability2: 'Digit2', ability3: 'Digit3', ability4: 'Digit4',
        shuffle: 'KeyR', pause: 'Escape', fullscreen: 'F11', mute: 'KeyM'
      }
    },
    game: { names: true, colorblind: false, tips: true }
  };
  TH.Settings = merge(clone(TH.DEFAULTS), store.get(SKEY));
  TH.saveSettings = () => store.set(SKEY, TH.Settings);
  TH.resetSettings = (section) => {
    TH.Settings[section] = clone(TH.DEFAULTS[section]);
    TH.saveSettings();
  };

  // ---------- save data ----------
  const DKEY = 'tidyhollow.save.v1';
  const blank = () => ({
    v: 1, coins: 0,
    stars: {},      // levelId -> 1..3
    best: {},       // levelId -> { mistakes, time, combo, perfect }
    catalog: {},    // itemId -> times sorted
    gold: {},       // itemId -> 1 when golden version found
    ach: {},        // achievementId -> timestamp
    abil: { magnet: 1, gust: 1, golden: 1, lantern: 1 },
    themes: ['honey'], theme: 'honey',
    pets: [], pet: '',
    tips: {},
    stats: {
      placed: 0, mistakes: 0, bestCombo: 0, bunnies: 0, golds: 0, abilUses: 0, magnetBest: 0,
      bins: 0, levels: 0, endless: 0, playTime: 0, earned: 0, spent: 0, shuffles: 0, fast: 0
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
