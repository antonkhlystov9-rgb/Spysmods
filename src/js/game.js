// Tidy Hollow — the play scene: pile, bins, dragging, abilities, effects
(function () {
  'use strict';
  const TH = window.TH, D = TH.Draw;
  const W = 1600, H = 900, WALL_Y = 470;
  const PILE = { x0: 110, x1: 1490, y0: 548, y1: 842 };
  // parts of the table kept clear for the HUD: ability bar, box stack, companion
  const KEEP_OUT = [[510, 1090, 765], [0, 200, 730], [1440, 1600, 750]];
  const MAXP = 22, BATCH = 12, ITEM = 96;
  const O = D.OUTLINE, CREAM = D.CREAM;
  const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  const S = () => TH.Save.data;
  const { clamp, lerp, rand } = TH;

  const G = TH.Game = { W, H, active: false, paused: false, done: false, level: null, bins: [], pile: [], fly: [], queue: [], held: null, fx: {}, charge: {} };
  let cv, c, pxW = 0, pxH = 0, SC = 1, OX = 0, OY = 0, bg = null, bgKey = '';
  let particles = [], floaters = [], bunnies = [], drift = [];
  let zc = 1, clock = 0, last = 0, lastDraw = 0, fpsT = 0, fpsN = 0, shakeT = 0, petHop = 0, finishT = -1, sparkT = 0;
  const mouse = { x: 800, y: 600 };
  let hover = null, hoverBin = null, hoverT = 0;

  const quality = () => (TH.Settings.video.particles ? { low: 0.35, medium: 0.7, high: 1 }[TH.Settings.video.quality] || 1 : 0);
  const detail = () => ({ low: 0, medium: 1, high: 2 }[TH.Settings.video.quality]);
  const calm = () => TH.Settings.video.reduceMotion;
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const easeBounce = (p) => {
    const n = 7.5625, d = 2.75;
    if (p < 1 / d) return n * p * p;
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
    return n * (p -= 2.625 / d) * p + 0.984375;
  };
  const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const drop = (arr, it) => { const i = arr.indexOf(it); if (i >= 0) arr.splice(i, 1); };
  const keyOf = (it) => TH.keyOf(it.def, G.level.rule);

  // ---------- setup ----------
  G.init = (canvas) => {
    cv = canvas; c = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', () => putBack());
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', G.resize);
    window.addEventListener('blur', () => { if (TH.Settings.controls.carry === 'drag') putBack(); });
    G.resize();
    for (let i = 0; i < 16; i++) drift.push(newDrift(true));
    requestAnimationFrame(frame);
  };

  G.resize = () => {
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1, rs = TH.Settings.video.renderScale / 100;
    pxW = Math.max(320, Math.round(cv.clientWidth * dpr * rs));
    pxH = Math.max(180, Math.round(cv.clientHeight * dpr * rs));
    cv.width = pxW; cv.height = pxH;
    SC = Math.min(pxW / W, pxH / H); OX = (pxW - W * SC) / 2; OY = (pxH - H * SC) / 2;
    bgKey = '';
  };
  G.redrawBg = () => { bgKey = ''; };

  function layout(level) {
    const n = level.bins.length, rows = n > 6 ? 2 : 1, perRow = Math.ceil(n / rows);
    const top = 92, gap = 14, areaH = WALL_Y - 22 - top;
    const bh = (areaH - (rows - 1) * gap) / rows;
    const bw = Math.min(300, (1540 - (perRow - 1) * gap) / perRow);
    return level.bins.map((spec, i) => {
      const r = Math.floor(i / perRow), ci = i % perRow, cnt = r === rows - 1 ? n - perRow * (rows - 1) : perRow;
      const x = (W - (cnt * bw + (cnt - 1) * gap)) / 2 + ci * (bw + gap), y = top + r * (bh + gap);
      const cap = level.items.filter((id) => TH.keyOf(TH.ITEMS[id], level.rule) === spec.key).length;
      const labelH = rows === 1 ? 48 : 34;
      const ix = x + 12, iy = y + labelH + 8, iw = bw - 24, ih = bh - labelH - 18;
      let best = { cell: 0, cols: 1, rws: 1 };
      for (let cols = 1; cols <= cap; cols++) {
        const rws = Math.ceil(cap / cols), cell = Math.min(iw / cols, ih / rws);
        if (cell > best.cell) best = { cell, cols, rws };
      }
      const cell = Math.min(best.cell, 104), gw = best.cols * cell, gh = best.rws * cell, slots = [];
      for (let k = 0; k < cap; k++) {
        const col = k % best.cols, row = Math.floor(k / best.cols);
        slots.push({ x: ix + (iw - gw) / 2 + col * cell + cell / 2, y: iy + (ih - gh) / 2 + gh - row * cell - cell / 2 });
      }
      return Object.assign({}, spec, { x, y, w: bw, h: bh, labelH, cap, slots, cell, n: 0, landed: 0, items: [], shake: 0, pulse: 0, doneT: -1 });
    });
  }

  G.start = (level) => {
    G.level = level; G.active = true; G.paused = false; G.done = false;
    G.combo = 0; G.bestCombo = 0; G.mistakes = 0; G.placed = 0; G.landed = 0; G.total = level.items.length;
    G.coins = 0; G.time = 0; G.newItems = 0; G.golds = 0; G.caught = 0;
    G.fx = { magnet: false, golden: 0, lantern: 0 };
    G.bins = layout(level);
    G.queue = TH.shuffle(level.items.slice()).map((id) => ({
      id, def: TH.ITEMS[id], gold: Math.random() < 0.04, x: 0, y: 0, rot: 0, size: ITEM, z: 0, st: 'queue', an: null, sq: 1
    }));
    G.pile = []; G.fly = []; G.held = null;
    particles = []; floaters = []; bunnies = []; finishT = -1; hover = null; hoverBin = null;
    for (const a of TH.ABIL) G.charge[a.id] = TH.abilUnlocked(a) ? Math.floor(a.need * 0.6) : 0;
    bgKey = '';
    dump(true); dump(true);
    TH.UI.hud();
    if (level.index === 0) TH.UI.tip('drag', 'Drag each item into the crate with the matching label.');
    else if (level.rule === 'color') TH.UI.tip('color', 'Colour day! Ignore what things are — sort them by colour.');
    else if (level.rule === 'room') TH.UI.tip('room', 'Everything’s mixed up. Send each item back to the room it came from. Hover a crate to see what lives there.');
  };
  G.stop = () => { G.active = false; G.held = null; bgKey = ''; TH.Save.flush(); };
  G.pause = (p) => { G.paused = p; if (p) putBack(); };

  // ---------- pile ----------
  function findSpot() {
    let best = null, bestD = -1;
    for (let i = 0; i < 18; i++) {
      const x = rand(PILE.x0, PILE.x1), y = rand(PILE.y0, PILE.y1);
      if (KEEP_OUT.some(([a, b, top]) => x > a && x < b && y > top)) continue;
      let d = 1e9;
      for (const o of G.pile) { const tx = o.an ? o.an.x1 : o.x, ty = o.an ? o.an.y1 : o.y; d = Math.min(d, Math.hypot(tx - x, (ty - y) * 1.4)); }
      if (d > bestD) { bestD = d; best = { x, y }; }
    }
    return best || { x: rand(300, 1300), y: rand(PILE.y0, 740) };
  }
  function anim(it, to, dur, o = {}) {
    it.an = {
      t: -(o.delay || 0), d: calm() ? Math.min(dur, 0.14) : dur, x0: it.x, y0: it.y, r0: it.rot, s0: it.size,
      x1: to.x, y1: to.y, r1: to.rot == null ? it.rot : to.rot, s1: to.size || it.size,
      arc: calm() ? 0 : o.arc || 0, ease: o.ease || easeOut, done: o.done
    };
  }
  function stepAnim(it, dt) {
    const a = it.an; if (!a) return;
    a.t += dt; if (a.t < 0) return;
    const p = Math.min(1, a.t / a.d), e = a.ease(p);
    it.x = lerp(a.x0, a.x1, e); it.y = lerp(a.y0, a.y1, e) - a.arc * Math.sin(Math.PI * p);
    it.rot = lerp(a.r0, a.r1, e); it.size = lerp(a.s0, a.s1, e);
    if (p >= 1) { it.an = null; if (a.done) a.done(); }
  }
  function dump(quiet) {
    const n = Math.min(G.queue.length, BATCH, MAXP - G.pile.length);
    if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      const it = G.queue.pop(), spot = findSpot();
      it.st = 'pile'; it.z = ++zc; it.size = ITEM;
      it.x = spot.x + rand(-60, 60); it.y = -90 - rand(0, 120); it.rot = rand(-2, 2);
      G.pile.push(it);
      anim(it, { x: spot.x, y: spot.y, rot: rand(-0.45, 0.45) }, 0.75, { delay: i * 0.045, ease: easeBounce });
    }
    if (!quiet) TH.Audio.play('dump');
    if (bunnies.length < 3 && Math.random() < 0.45) {
      bunnies.push({ x: rand(PILE.x0, PILE.x1), y: rand(PILE.y0, PILE.y1), tx: 0, ty: 0, wait: rand(0.5, 2), hop: 0, dir: 1, flee: false });
      TH.UI.tip('bunny', 'A dust bunny is hiding in the pile! Click it to shoo it away for bonus coins.');
    }
    if (G.pile.some((i) => i.gold)) TH.UI.tip('gold', 'Ooh — a golden item! It’s worth a pile of bonus coins.');
    TH.UI.hud();
  }
  G.shuffle = () => {
    if (!G.active || G.paused || G.done) return;
    const items = G.pile.filter((i) => !i.an);
    if (!items.length) return;
    G.pile = G.pile.filter((i) => i.an);
    for (const it of items) { const s = findSpot(); G.pile.push(it); it.z = ++zc; anim(it, { x: s.x, y: s.y, rot: rand(-0.45, 0.45) }, 0.4, { arc: 30 }); }
    S().stats.shuffles++; TH.Audio.play('shuffle'); TH.checkAch();
  };

  // ---------- input ----------
  function toWorld(e) {
    const r = cv.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width * pxW - OX) / SC;
    mouse.y = ((e.clientY - r.top) / r.height * pxH - OY) / SC;
  }
  function itemAt(x, y) {
    let best = null;
    for (const it of G.pile) {
      if (it.an && it.an.t < it.an.d * 0.6) continue;
      if (Math.hypot(it.x - x, it.y - y) < it.size * 0.46 && (!best || it.z > best.z)) best = it;
    }
    return best;
  }
  function binAt(x, y, exact) {
    const m = exact ? 0 : { off: 0, normal: 16, generous: 46 }[TH.Settings.controls.assist] || 0;
    let best = null, bd = 1e9;
    for (const b of G.bins) {
      if (x > b.x - m && x < b.x + b.w + m && y > b.y - m && y < b.y + b.h + m) {
        const d = Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y);
        if (d < bd) { bd = d; best = b; }
      }
    }
    return best;
  }
  function onDown(e) {
    TH.Audio.init();
    toWorld(e);
    if (!G.active || G.paused || G.done || e.button !== 0) return;
    if (G.held) { if (TH.Settings.controls.carry === 'click') release(); return; }
    const it = itemAt(mouse.x, mouse.y);
    if (it) {
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      drop(G.pile, it); it.st = 'held'; it.an = null; G.held = it;
      TH.Audio.play('pick');
      return;
    }
    for (const b of bunnies) {
      if (!b.flee && Math.hypot(b.x - mouse.x, b.y - 10 - mouse.y) < 30) { catchBunny(b); return; }
    }
  }
  function onMove(e) { toWorld(e); }
  function onUp(e) { toWorld(e); if (G.held && TH.Settings.controls.carry === 'drag') release(); }
  function release() {
    const it = G.held; if (!it) return;
    G.held = null;
    const b = binAt(mouse.x, mouse.y);
    if (b) tryDrop(it, b);
    else toPile(it, { x: clamp(it.x, PILE.x0 - 40, PILE.x1 + 40), y: clamp(it.y, PILE.y0 - 20, PILE.y1 + 20) }, true);
  }
  function putBack() { const it = G.held; if (!it) return; G.held = null; toPile(it, findSpot()); }
  function toPile(it, spot, soft) {
    it.st = 'pile'; it.z = ++zc; G.pile.push(it);
    anim(it, { x: spot.x, y: spot.y, rot: rand(-0.4, 0.4), size: ITEM }, soft ? 0.16 : 0.34, { arc: soft ? 0 : 40 });
    if (soft) TH.Audio.play('drop');
  }

  // ---------- placing ----------
  function tryDrop(it, bin) {
    const key = keyOf(it);
    let target = bin;
    if (bin.key !== key) {
      if (G.fx.lantern > 0) target = G.bins.find((b) => b.key === key);
      else return miss(it, bin);
    }
    if (G.fx.lantern > 0) G.fx.lantern--;
    place(it, target, true, 0);
    if (G.fx.magnet) {
      G.fx.magnet = false;
      const more = G.pile.filter((p) => keyOf(p) === key).slice(0, TH.abilVal(TH.ABIL[0]));
      more.forEach((p, i) => place(p, target, false, 0.12 + i * 0.07));
      if (more.length) {
        S().stats.magnetBest = Math.max(S().stats.magnetBest, more.length);
        float(`Magnet +${more.length}!`, target.x + target.w / 2, target.y - 6, '#ff9d8a');
      }
    }
    TH.UI.hud();
  }
  function miss(it, bin) {
    G.mistakes++; G.combo = 0; S().stats.mistakes++;
    bin.shake = 0.35;
    TH.Audio.play('wrong');
    float(`${it.def.name} doesn’t go there`, clamp(bin.x + bin.w / 2, 220, W - 220), bin.y + bin.h + 18, '#ffd7cf');
    toPile(it, findSpot());
    TH.checkAch(); TH.UI.hud();
  }
  function place(it, bin, manual, delay) {
    drop(G.pile, it); it.st = 'fly'; G.fly.push(it);
    const slot = bin.slots[bin.n++], s = S();
    G.placed++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    s.stats.placed++; s.stats.bestCombo = Math.max(s.stats.bestCombo, G.combo);
    if (!s.catalog[it.id]) G.newItems++;
    s.catalog[it.id] = (s.catalog[it.id] || 0) + 1;
    let gain = 2 + Math.min(3, Math.floor(G.combo / 5));
    if (G.fx.golden > 0) { gain *= 2; G.fx.golden--; }
    if (it.gold) { gain += 15; s.stats.golds++; s.gold[it.id] = 1; G.golds++; }
    G.coins += gain; TH.Save.earn(gain);
    if (manual) {
      for (const a of TH.ABIL) {
        if (!TH.abilUnlocked(a) || G.charge[a.id] >= a.need) continue;
        if (++G.charge[a.id] >= a.need) TH.Audio.play('ready');
      }
    }
    if (G.combo === 10 || G.combo === 25 || G.combo === 50 || G.combo === 80) {
      float(`Streak ×${G.combo}!`, W / 2, WALL_Y + 40, '#fff3b0', 34); petHop = 1;
    }
    const combo = G.combo;
    anim(it, { x: slot.x, y: slot.y, rot: 0, size: bin.cell * 0.84 }, 0.34, { delay, arc: 70, done: () => land(it, bin, gain, combo) });
  }
  function land(it, bin, gain, combo) {
    drop(G.fly, it); it.st = 'slot'; it.sq = 1.3; bin.items.push(it); bin.landed++; bin.pulse = 0.25; G.landed++;
    TH.Audio.play('place', combo);
    burst(it.x, it.y, TH.FAMS[it.def.fam].hex, 8);
    float('+' + gain, it.x, it.y - 26, it.gold ? '#ffd24a' : '#ffffff', it.gold ? 30 : 22);
    if (it.gold) { TH.Audio.play('gold'); burst(it.x, it.y, '#ffd24a', 16, true); }
    if (bin.landed === bin.cap) {
      bin.doneT = 0; G.coins += 10; TH.Save.earn(10); S().stats.bins++;
      TH.Audio.play('bin');
      burst(bin.x + bin.w / 2, bin.y + bin.h / 2, '#fff3b0', 26, true);
      float('Full! +10', bin.x + bin.w / 2, bin.y + 30, '#fff3b0', 28);
      shakeT = 0.25; petHop = 1;
    }
    if (G.landed === 1) TH.UI.tip('streak', 'Nice! Keep a streak going without mistakes to earn more coins per item.');
    TH.checkAch(); TH.UI.hud();
    if (G.landed === G.total && !G.done) {
      G.done = true; finishT = 0.9; putBack();
      bunnies.forEach((b) => { b.flee = true; });
      TH.Audio.play('level');
      for (let i = 0; i < 6; i++) burst(rand(200, 1400), rand(150, 420), TH.pick(Object.values(TH.FAMS)).hex, 14, true);
    }
  }
  function catchBunny(b) {
    drop(bunnies, b);
    S().stats.bunnies++; G.caught++; G.coins += 5; TH.Save.earn(5);
    TH.Audio.play('bunny');
    burst(b.x, b.y - 10, '#d8d2cc', 14);
    float('Shoo! +5', b.x, b.y - 40, '#ffffff', 24);
    TH.checkAch(); TH.UI.hud();
  }

  // ---------- abilities ----------
  G.useAbility = (i) => {
    const a = TH.ABIL[i];
    if (!a || !G.active || G.paused || G.done || !TH.abilUnlocked(a)) return;
    if (G.charge[a.id] < a.need) { TH.Audio.play('deny'); return; }
    const v = TH.abilVal(a);
    if (a.id === 'magnet') {
      if (G.fx.magnet) return;
      G.fx.magnet = true;
    } else if (a.id === 'gust') {
      const picks = TH.shuffle(G.pile.filter((p) => !p.an || p.an.t >= p.an.d * 0.6)).slice(0, v);
      if (!picks.length) { TH.Audio.play('deny'); return; }
      picks.forEach((p, k) => place(p, G.bins.find((b) => b.key === keyOf(p)), false, k * 0.09));
      for (let k = 0; k < 14; k++) burst(rand(PILE.x0, PILE.x1), rand(PILE.y0, PILE.y1), '#ffffff', 2);
    } else if (a.id === 'golden') {
      G.fx.golden += v;
    } else if (a.id === 'lantern') {
      G.fx.lantern += v;
    }
    G.charge[a.id] = 0; S().stats.abilUses++;
    TH.Audio.play('ability');
    float(a.name + '!', W / 2, WALL_Y + 44, '#fff3b0', 34);
    TH.checkAch(); TH.UI.hud();
  };

  // test / accessibility helper: sort one item automatically
  G.autoStep = () => {
    if (!G.active || G.done) return false;
    const it = G.pile.find((p) => !p.an);
    if (!it) return false;
    place(it, G.bins.find((b) => b.key === keyOf(it)), true, 0);
    TH.UI.hud();
    return true;
  };

  // ---------- effects ----------
  function burst(x, y, col, n, star) {
    n = Math.round(n * quality());
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(60, star ? 420 : 260);
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 0, max: rand(0.4, 0.95), size: rand(4, star ? 11 : 8), col, star, rot: rand(0, 6) });
    }
  }
  function float(text, x, y, col, size) { floaters.push({ text, x, y, col: col || '#fff', size: size || 22, life: 0 }); }
  function newDrift(any) {
    const x0 = -OX / SC, x1 = W + OX / SC;
    return { id: TH.pick(TH.ITEM_LIST).id, x: rand(x0, x1), y: any ? rand(-100, H) : -100, vy: rand(18, 42), rot: rand(0, 6), vr: rand(-0.4, 0.4), size: rand(60, 100) };
  }

  // ---------- update ----------
  function update(dt) {
    clock += dt;
    if (!G.active) {
      for (let i = 0; i < drift.length; i++) {
        const d = drift[i]; d.y += d.vy * dt; d.rot += d.vr * dt;
        if (d.y > H + OY / SC + 100) drift[i] = newDrift(false);
      }
      return;
    }
    if (G.paused) return;
    if (!G.done) { G.time += dt; S().stats.playTime += dt; }

    const h = G.held;
    if (h) {
      const f = Math.min(1, dt * 24), px = h.x;
      h.x += (mouse.x - h.x) * f; h.y += (mouse.y - 10 - h.y) * f;
      const tilt = calm() ? 0 : clamp((h.x - px) / Math.max(dt, 0.001) / 1600, -0.4, 0.4);
      h.rot += (tilt - h.rot) * Math.min(1, dt * 10);
      h.size += (ITEM * 1.16 - h.size) * Math.min(1, dt * 14);
    }
    for (const it of G.pile.slice()) stepAnim(it, dt);
    for (const it of G.fly.slice()) stepAnim(it, dt);
    for (const b of G.bins) {
      if (b.shake > 0) b.shake -= dt;
      if (b.pulse > 0) b.pulse -= dt;
      if (b.doneT >= 0) b.doneT += dt;
      for (const it of b.items) if (it.sq > 1) it.sq = Math.max(1, it.sq - dt * 2.4);
    }
    const hv = h ? null : itemAt(mouse.x, mouse.y);
    if (hv !== hover) { hover = hv; hoverT = 0; } else hoverT += dt;
    hoverBin = binAt(mouse.x, mouse.y, !h);

    if (!G.done && G.queue.length && G.pile.length + (h ? 1 : 0) <= 8) dump(false);

    for (let i = bunnies.length - 1; i >= 0; i--) {
      const b = bunnies[i];
      if (b.flee) { b.x -= 520 * dt; b.hop += dt * 16; if (b.x < -OX / SC - 80) bunnies.splice(i, 1); continue; }
      if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0) { b.tx = rand(PILE.x0, PILE.x1); b.ty = rand(PILE.y0, PILE.y1); } continue; }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      if (d < 6) { b.wait = rand(1.5, 4); b.hop = 0; continue; }
      b.dir = dx < 0 ? -1 : 1; b.x += dx / d * 80 * dt; b.y += dy / d * 80 * dt; b.hop += dt * 11;
    }
    sparkT -= dt;
    if (sparkT <= 0) {
      sparkT = 0.22;
      for (const it of G.pile) if (it.gold && !it.an) burst(it.x + rand(-34, 34), it.y + rand(-34, 34), '#ffe27a', 1, true);
      if (h && h.gold) burst(h.x + rand(-34, 34), h.y + rand(-34, 34), '#ffe27a', 1, true);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.life += dt;
      if (p.life >= p.max) { particles.splice(i, 1); continue; }
      p.vy += 620 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.rot += dt * 4;
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i]; f.life += dt; f.y -= 34 * dt;
      if (f.life > 1.5) floaters.splice(i, 1);
    }
    if (shakeT > 0) shakeT -= dt;
    if (petHop > 0) petHop = Math.max(0, petHop - dt * 2);
    if (finishT > 0) {
      finishT -= dt;
      if (finishT <= 0) {
        finishT = -1;
        const run = { mistakes: G.mistakes, total: G.total, time: G.time, bestCombo: G.bestCombo, coins: G.coins, newItems: G.newItems, golds: G.golds, caught: G.caught };
        TH.UI.levelDone(G.level, run, TH.finishLevel(G.level, run));
      }
    }
  }

  // ---------- rendering ----------
  function paintBg(g) {
    const th = TH.theme(), x0 = -OX / SC - 2, x1 = W + OX / SC + 2, y0 = -OY / SC - 2, y1 = H + OY / SC + 2;
    g.fillStyle = th.wall; g.fillRect(x0, y0, x1 - x0, WALL_Y - y0);
    const lv = G.active ? G.level : null;
    const pat = lv ? (lv.pattern != null ? lv.pattern : TH.ROOM_BY_ID[lv.room].pattern) : 0;
    g.fillStyle = th.wall2;
    if (pat === 0) { for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) g.fillRect(x, y0, 45, WALL_Y - y0); }
    else if (pat === 1) {
      for (let y = WALL_Y - 40, r = 0; y > y0 - 20; y -= 56, r++) for (let x = Math.floor(x0 / 64) * 64 + (r % 2 ? 32 : 0); x < x1; x += 64) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }
    } else if (pat === 2) {
      for (let y = WALL_Y - 50, r = 0; y > y0 - 30; y -= 60, r++) for (let x = Math.floor(x0 / 80) * 80 + (r % 2 ? 40 : 0); x < x1; x += 80) { g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 12, y); g.lineTo(x, y + 16); g.lineTo(x - 12, y); g.fill(); }
    } else { for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) { g.fillRect(x, y0, 10, WALL_Y - y0); g.fillRect(x + 54, y0, 3, WALL_Y - y0); g.fillRect(x + 66, y0, 3, WALL_Y - y0); } }
    g.fillStyle = th.trim; g.fillRect(x0, WALL_Y - 16, x1 - x0, 16);
    g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x0, WALL_Y - 16, x1 - x0, 4);
    const tg = g.createLinearGradient(0, WALL_Y, 0, y1); tg.addColorStop(0, th.table); tg.addColorStop(1, th.table2);
    g.fillStyle = tg; g.fillRect(x0, WALL_Y, x1 - x0, y1 - WALL_Y);
    g.strokeStyle = 'rgba(60,30,10,.1)'; g.lineWidth = 3;
    for (let y = WALL_Y + 86, r = 0; y < y1; y += 96, r++) {
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      for (let x = Math.floor(x0 / 420) * 420 + (r % 2 ? 210 : 0); x < x1; x += 420) { g.beginPath(); g.moveTo(x, y - 96); g.lineTo(x, y); g.stroke(); }
    }
    const sg = g.createLinearGradient(0, WALL_Y, 0, WALL_Y + 30); sg.addColorStop(0, 'rgba(40,20,5,.22)'); sg.addColorStop(1, 'rgba(40,20,5,0)');
    g.fillStyle = sg; g.fillRect(x0, WALL_Y, x1 - x0, 30);
    if (detail() > 0) {
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, Math.max(x1 - x0, y1 - y0) * 0.62);
      vg.addColorStop(0, 'rgba(40,20,5,0)'); vg.addColorStop(1, 'rgba(40,20,5,.28)');
      g.fillStyle = vg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  function ensureBg() {
    const key = [pxW, pxH, S().theme, G.active ? G.level.id + G.level.n : 'menu', TH.Settings.video.quality].join('|');
    if (key === bgKey && bg) return;
    bgKey = key;
    if (!bg) bg = document.createElement('canvas');
    bg.width = pxW; bg.height = pxH;
    const g = bg.getContext('2d');
    g.setTransform(SC, 0, 0, SC, OX, OY);
    paintBg(g);
  }
  function fitText(text, maxW, size, weight) {
    c.font = `${weight || 700} ${size}px ${FONT}`;
    while (size > 10 && c.measureText(text).width > maxW) { size -= 1; c.font = `${weight || 700} ${size}px ${FONT}`; }
  }
  function drawBin(b) {
    const th = TH.theme();
    const sx = b.shake > 0 && !calm() ? Math.sin(b.shake * 42) * 7 * (b.shake / 0.35) : 0;
    const pop = b.pulse > 0 && !calm() ? 1 + 0.03 * (b.pulse / 0.25) : 1;
    c.save();
    c.translate(b.x + b.w / 2 + sx, b.y + b.h / 2); c.scale(pop, pop); c.translate(-b.x - b.w / 2, -b.y - b.h / 2);
    let body = th.crate;
    if (b.kind === 'color') body = TH.mix(TH.FAMS[b.fam].hex, '#ffffff', 0.22);
    if (detail() > 0) { c.fillStyle = 'rgba(40,20,5,.18)'; rr(b.x + 3, b.y + 9, b.w, b.h, 16); c.fill(); }
    rr(b.x, b.y, b.w, b.h, 16); c.fillStyle = body; c.fill(); c.strokeStyle = O; c.lineWidth = 4; c.stroke();
    rr(b.x + 8, b.y + b.labelH + 2, b.w - 16, b.h - b.labelH - 10, 10); c.fillStyle = TH.mix(body, '#3a2416', 0.3); c.fill();
    if (b.shake > 0) { c.fillStyle = `rgba(214,70,60,${0.35 * b.shake / 0.35})`; c.fill(); }
    // label plaque
    const ly = b.y + 7, lh = b.labelH - 8;
    rr(b.x + 9, ly, b.w - 18, lh, 9); c.fillStyle = CREAM; c.fill(); c.strokeStyle = O; c.lineWidth = 2.5; c.stroke();
    const ic = lh - 6, icx = b.x + 14 + ic / 2, icy = ly + lh / 2;
    if (b.kind === 'color') {
      c.beginPath(); c.arc(icx, icy, ic / 2 - 1, 0, 7); c.fillStyle = TH.FAMS[b.fam].hex; c.fill(); c.lineWidth = 2; c.stroke();
      if (TH.Settings.game.colorblind) D.sym(c, b.fam, icx, icy, ic * 0.24);
    } else {
      c.drawImage(D.icon(b.icon), icx - ic / 2 - 2, icy - ic / 2 - 2, ic + 4, ic + 4);
    }
    const cnt = b.landed + '/' + b.cap, small = b.labelH < 40;
    c.textBaseline = 'middle'; c.textAlign = 'right';
    c.font = `700 ${small ? 13 : 15}px ${FONT}`; c.fillStyle = '#9a7a5c';
    const cw = c.measureText(cnt).width;
    c.fillText(cnt, b.x + b.w - 17, icy + 1);
    c.textAlign = 'left'; c.fillStyle = O;
    fitText(b.label, b.w - 18 - ic - 22 - cw, small ? 16 : 20);
    c.fillText(b.label, icx + ic / 2 + 7, icy + 1);
    // contents
    for (const it of b.items) D.blit(c, it.id, it.gold, it.x, it.y, it.size * it.sq, 0);
    // state outlines
    const held = G.held;
    if (held && G.fx.lantern > 0 && b.key === keyOf(held)) {
      rr(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 19); c.strokeStyle = `rgba(255,214,90,${0.65 + 0.35 * Math.sin(clock * 8)})`; c.lineWidth = 8; c.stroke();
    } else if (held && b === hoverBin) {
      rr(b.x - 3, b.y - 3, b.w + 6, b.h + 6, 18); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 6; c.stroke();
    }
    if (b.doneT >= 0) {
      const p = calm() ? 1 : Math.min(1, b.doneT / 0.3), s = easeOut(p) * (b.labelH < 40 ? 15 : 20);
      const bx = b.x + b.w - 6, by = b.y + 4;
      c.beginPath(); c.arc(bx, by, s, 0, 7); c.fillStyle = '#6dbb5a'; c.fill(); c.strokeStyle = O; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.moveTo(bx - s * 0.45, by); c.lineTo(bx - s * 0.1, by + s * 0.38); c.lineTo(bx + s * 0.5, by - s * 0.35);
      c.strokeStyle = '#fff'; c.lineWidth = s * 0.26; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    }
    c.restore();
  }
  function drawItem(it, lifted) {
    const s = it.size;
    if (detail() > 0) {
      c.fillStyle = lifted ? 'rgba(50,25,8,.2)' : 'rgba(50,25,8,.24)';
      c.beginPath(); c.ellipse(it.x + (lifted ? 10 : 2), it.y + s * 0.4 + (lifted ? 18 : 0), s * (lifted ? 0.4 : 0.36), s * 0.12, 0, 0, 7); c.fill();
    }
    if (it.gold) {
      const g = c.createRadialGradient(it.x, it.y, s * 0.2, it.x, it.y, s * 0.78);
      g.addColorStop(0, `rgba(255,226,120,${0.55 + 0.2 * Math.sin(clock * 5)})`); g.addColorStop(1, 'rgba(255,226,120,0)');
      c.fillStyle = g; c.beginPath(); c.arc(it.x, it.y, s * 0.78, 0, 7); c.fill();
    }
    D.blit(c, it.id, it.gold, it.x, it.y, s, it.rot);
    if (TH.Settings.game.colorblind && G.level.rule === 'color') D.sym(c, it.def.fam, it.x + s * 0.3, it.y + s * 0.3, s * 0.12, TH.FAMS[it.def.fam].hex);
  }
  function tag(text, x, y, size) {
    size = size || 19;
    c.font = `700 ${size}px ${FONT}`;
    const w = Math.min(c.measureText(text).width + 26, 560), hh = size + 16;
    x = clamp(x, w / 2 + 8, W - w / 2 - 8); y = Math.max(y, hh / 2 + 6);
    rr(x - w / 2, y - hh / 2, w, hh, hh / 2); c.fillStyle = 'rgba(255,246,224,.97)'; c.fill(); c.strokeStyle = O; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = O; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 1, 540);
  }
  function drawBunny(b) {
    const moving = b.wait <= 0 || b.flee, y = b.y - (moving && !calm() ? Math.abs(Math.sin(b.hop)) * 9 : 0);
    c.save(); c.translate(b.x, y); c.scale(b.flee ? -1 : b.dir, 1);
    c.fillStyle = 'rgba(50,25,8,.2)'; c.beginPath(); c.ellipse(0, b.y - y + 16, 20, 6, 0, 0, 7); c.fill();
    c.fillStyle = '#c9c2bc'; c.strokeStyle = O; c.lineWidth = 2.5;
    for (const [x, r] of [[-7, -0.3], [5, 0.2]]) { c.beginPath(); c.ellipse(x, -24, 5, 13, r, 0, 7); c.fill(); c.stroke(); }
    c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, r = 21 + (i % 2 ? 3 : 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.86); } c.closePath(); c.fill(); c.stroke();
    c.fillStyle = O; c.beginPath(); c.arc(4, -4, 2.6, 0, 7); c.arc(13, -4, 2.6, 0, 7); c.fill();
    c.fillStyle = '#f3a3ad'; c.beginPath(); c.arc(9, 2, 2, 0, 7); c.fill();
    c.restore();
  }
  function petArt(id, blink) {
    c.lineWidth = 3; c.strokeStyle = O; c.lineJoin = 'round';
    const el = (x, y, rx, ry, col, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fillStyle = col; c.fill(); c.stroke(); };
    const eye = (x, y) => { c.fillStyle = O; if (blink) c.fillRect(x - 4, y - 1, 8, 2.5); else { c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); } };
    if (id === 'cat') {
      c.beginPath(); c.moveTo(22, 20); c.quadraticCurveTo(48, 14, 40, -8); c.lineWidth = 11; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#e8a35c'; c.lineWidth = 6; c.stroke(); c.lineWidth = 3; c.strokeStyle = O; c.lineCap = 'butt';
      el(0, 10, 26, 22, '#e8a35c');
      c.fillStyle = '#e8a35c'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 20, -30); c.lineTo(s * 22, -50); c.lineTo(s * 6, -40); c.closePath(); c.fill(); c.stroke(); }
      el(0, -22, 22, 19, '#e8a35c'); el(0, -15, 8, 6, '#fff4dc');
      eye(-9, -24); eye(9, -24);
      c.fillStyle = '#f3a3ad'; c.beginPath(); c.arc(0, -17, 2.4, 0, 7); c.fill();
    } else if (id === 'frog') {
      el(0, 8, 32, 24, '#8cc46a'); el(0, 14, 18, 12, '#d7ecb8');
      el(-14, -18, 11, 11, '#8cc46a'); el(14, -18, 11, 11, '#8cc46a');
      eye(-14, -19); eye(14, -19);
      c.beginPath(); c.arc(0, -4, 12, 0.2, Math.PI - 0.2); c.strokeStyle = O; c.lineWidth = 2.5; c.stroke();
    } else {
      el(-9, -46, 7, 20, '#eee6de', -0.15); el(9, -46, 7, 20, '#eee6de', 0.15);
      el(0, 8, 26, 24, '#eee6de'); el(0, -20, 20, 18, '#eee6de');
      eye(-8, -22); eye(8, -22);
      c.fillStyle = '#f3a3ad'; c.beginPath(); c.arc(0, -15, 2.6, 0, 7); c.fill();
    }
  }
  function drawPet() {
    const id = S().pet; if (!id) return;
    const hop = calm() ? 0 : Math.sin(petHop * Math.PI) * 26, br = 1 + Math.sin(clock * 2) * 0.02;
    c.fillStyle = 'rgba(50,25,8,.2)'; c.beginPath(); c.ellipse(1538, 870, 36, 9, 0, 0, 7); c.fill();
    c.save(); c.translate(1538, 836 - hop); c.scale(1.1, 1.1 * br);
    petArt(id, clock % 4 < 0.14);
    c.restore();
  }
  // used by the shop to show a portrait
  G.paintPet = (canvas, id) => {
    const keep = c, k = canvas.width / 104;
    c = canvas.getContext('2d');
    c.save(); c.translate(canvas.width / 2, canvas.height / 2 + 16 * k); c.scale(k, k); petArt(id, false); c.restore();
    c = keep;
  };
  function drawBoxes() {
    const n = Math.ceil(G.queue.length / BATCH); if (!n) return;
    const x = 30, y = 800;
    for (let i = Math.min(n, 3) - 1; i >= 0; i--) {
      const by = y - i * 22;
      rr(x, by, 64, 46, 5); c.fillStyle = '#d2a56d'; c.fill(); c.strokeStyle = O; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#e9cf9c'; c.fillRect(x + 26, by + 1.5, 12, 43);
    }
    tag(n + (n === 1 ? ' box left' : ' boxes left'), x + 46, y + 66, 15);
  }

  function render() {
    ensureBg();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(bg, 0, 0);
    let shx = 0, shy = 0;
    if (shakeT > 0 && TH.Settings.video.shake && !calm()) { const m = shakeT / 0.25 * 5; shx = rand(-m, m); shy = rand(-m, m); }
    c.setTransform(SC, 0, 0, SC, OX + shx * SC, OY + shy * SC);
    c.lineJoin = 'round'; c.lineCap = 'butt';
    if (!G.active) {
      c.globalAlpha = 0.85;
      for (const d of drift) D.blit(c, d.id, false, d.x, d.y, d.size, d.rot);
      c.globalAlpha = 1;
      return;
    }
    for (const b of G.bins) drawBin(b);
    drawBoxes();
    drawPet();
    for (const b of bunnies) drawBunny(b);
    G.pile.sort((a, b) => a.z - b.z);
    for (const it of G.pile) drawItem(it, false);
    if (hover && !hover.an) {
      c.beginPath(); c.arc(hover.x, hover.y, hover.size * 0.5, 0, 7); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.stroke();
    }
    for (const it of G.fly) drawItem(it, true);
    const h = G.held;
    if (h) {
      if (G.fx.magnet) { c.beginPath(); c.arc(h.x, h.y, h.size * 0.62 + Math.sin(clock * 9) * 3, 0, 7); c.strokeStyle = 'rgba(255,120,100,.9)'; c.lineWidth = 4; c.setLineDash([10, 8]); c.stroke(); c.setLineDash([]); }
      drawItem(h, true);
    }
    for (const p of particles) {
      const a = 1 - p.life / p.max; c.globalAlpha = a; c.fillStyle = p.col;
      if (p.star) {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? p.size * 0.4 : p.size; c.lineTo(Math.cos(i * 0.785) * r, Math.sin(i * 0.785) * r); }
        c.closePath(); c.fill(); c.restore();
      } else { c.beginPath(); c.arc(p.x, p.y, p.size * (0.4 + a * 0.6), 0, 7); c.fill(); }
    }
    c.globalAlpha = 1;
    if (TH.Settings.game.names) {
      if (h) tag(h.def.name, h.x, h.y - h.size * 0.72);
      else if (hover && hoverT > 0.12 && !hover.an) tag(hover.def.name, hover.x, hover.y - hover.size * 0.66);
    }
    if (!h && hoverBin && hoverBin.kind === 'room') tag(hoverBin.tip, hoverBin.x + hoverBin.w / 2, hoverBin.y + hoverBin.h + 22, 16);
    for (const f of floaters) {
      const a = f.life < 1 ? 1 : 1 - (f.life - 1) / 0.5, pop = calm() ? 1 : 1 + Math.max(0, 0.2 - f.life) * 2;
      c.globalAlpha = Math.max(0, a); c.font = `800 ${f.size * pop}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 5; c.strokeStyle = O; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y);
    }
    c.globalAlpha = 1;
  }

  function frame(t) {
    requestAnimationFrame(frame);
    const cap = TH.Settings.video.fpsCap;
    if (cap && t - lastDraw < 1000 / cap - 1.5) return;
    lastDraw = t;
    let dt = (t - last) / 1000; last = t;
    if (!(dt > 0)) dt = 0.016;
    if (dt > 0.1) dt = 0.1;
    update(dt);
    render();
    fpsN++; fpsT += dt;
    if (fpsT >= 0.5) { if (TH.UI) TH.UI.fps(Math.round(fpsN / fpsT)); fpsN = 0; fpsT = 0; }
  }
})();
