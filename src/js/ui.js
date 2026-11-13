// Tidy Hollow — menus, HUD, settings, and boot
(function () {
  'use strict';
  const TH = window.TH, G = TH.Game, D = TH.Draw;
  const S = () => TH.Save.data;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = TH.esc, fmt = TH.fmt;
  const UI = TH.UI = {};

  // ---------- icons ----------
  const st = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
    pause: '<path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z" fill="currentColor"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
    coin: '<circle cx="12" cy="12" r="9.5" fill="currentColor"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#fff6e2" stroke-width="1.7"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="currentColor"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 018 0v3" ' + st + ' stroke-width="2.4"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4c0 3 1.5 4.5 3.5 4.8M17 6h3c0 3-1.5 4.5-3.5 4.8M12 14v4M8 20h8" ' + st + ' stroke-width="2.2"/>',
    book: '<path d="M4 5c3-1.2 6-1.2 8 .5 2-1.7 5-1.7 8-.5v13c-3-1.2-6-1.2-8 .5-2-1.7-5-1.7-8-.5zM12 5.5v13" ' + st + ' stroke-width="2.2"/>',
    bag: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2" ' + st + ' stroke-width="2.2"/>',
    gear: '<circle cx="12" cy="12" r="3.4" ' + st + ' stroke-width="2.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" ' + st + ' stroke-width="2.6"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" ' + st + ' stroke-width="2.2"/>',
    back: '<path d="M14 5l-7 7 7 7" ' + st + ' stroke-width="3"/>',
    loop: '<path d="M12 12c-1.5-3-3-4.5-5-4.5a4.5 4.5 0 000 9c2 0 3.5-1.5 5-4.5zm0 0c1.5 3 3 4.5 5 4.5a4.5 4.5 0 000-9c-2 0-3.5 1.5-5 4.5z" ' + st + ' stroke-width="2.3"/>',
    magnet: '<path d="M6 4v8a6 6 0 0012 0V4h-4v8a2 2 0 01-4 0V4z" fill="currentColor"/><path d="M6 7.5h4M14 7.5h4" stroke="#fff6e2" stroke-width="1.6"/>',
    wind: '<path d="M3 9h10a3 3 0 10-3-3M3 14h15a3 3 0 11-3 3M3 19h7" ' + st + ' stroke-width="2.4"/>',
    sun: '<circle cx="12" cy="12" r="4.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" ' + st + ' stroke-width="2.2"/>',
    lantern: '<path d="M9 3h6M12 3v2M8 5h8l1 3v9l-1 3H8l-1-3V8z" ' + st + ' stroke-width="2.2"/><path d="M12 10c2 2 1.5 5.5 0 5.5s-2-3.5 0-5.5z" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7" ' + st + ' stroke-width="3.2"/>',
    paw: '<circle cx="6.5" cy="10" r="2.2" fill="currentColor"/><circle cx="10.2" cy="6" r="2.2" fill="currentColor"/><circle cx="14.8" cy="6.2" r="2.2" fill="currentColor"/><circle cx="18" cy="10.5" r="2.2" fill="currentColor"/><path d="M12 11c3 0 5.5 3.5 5 6-.4 2-2.5 2-5 2s-4.6 0-5-2c-.5-2.5 2-6 5-6z" fill="currentColor"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2" ' + st + ' stroke-width="2.2"/><path d="M9 20h6M12 16v4" ' + st + ' stroke-width="2.2"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" ' + st + ' stroke-width="2"/>',
    keys: '<rect x="2.5" y="6" width="19" height="12" rx="2.5" ' + st + ' stroke-width="2.2"/><path d="M6.5 10h.5M10.5 10h.5M14.5 10h.5M18 10h.2M7.5 14h9" ' + st + ' stroke-width="2.2"/>',
    heart: '<path d="M12 20S4 15 4 9.5A4.2 4.2 0 0112 7a4.2 4.2 0 018 2.5C20 15 12 20 12 20z" fill="currentColor"/>',
    retry: '<path d="M5 12a7 7 0 107-7H8M8 5l3-3M8 5l3 3" ' + st + ' stroke-width="2.4"/>'
  };
  const ico = (n) => `<svg class="ico" viewBox="0 0 24 24">${ICON[n] || ''}</svg>`;

  // ---------- state ----------
  let screen = 'title', modalKind = '', catRoom = 'pantry', shopTab = 'abil', setTab = 'game', setInModal = false;
  let rebinding = null, endlessRound = 1, tipTimer = 0, lastCombo = 0, lastResult = null;

  const roomOf = (lv) => (lv.endless ? { name: 'Endless Mode' } : TH.ROOM_BY_ID[lv.room]);
  const keyName = (code) => {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    return { Escape: 'Esc', Space: 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Backquote: '`', Minus: '-', Equal: '=', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: '\'', BracketLeft: '[', BracketRight: ']', Backslash: '\\' }[code] || code;
  };
  const keys = () => TH.Settings.controls.keys;

  // ---------- generic pieces ----------
  function paintCanvases(root) {
    root.querySelectorAll('canvas[data-item]').forEach((cv) => {
      cv.width = cv.height = 120;
      D.paint(cv.getContext('2d'), cv.dataset.item, 60, 60, 100);
    });
    root.querySelectorAll('canvas[data-pet]').forEach((cv) => { cv.width = cv.height = 132; G.paintPet(cv, cv.dataset.pet); });
  }
  const header = (title, extra) => `<header>
      <button class="btn icon-btn" data-act="back" title="Back">${ico('back')}</button>
      <h2>${title}</h2>${extra || ''}
      <span class="coinbox starbox">${ico('star')} ${TH.totalStars()}/${TH.maxStars()}</span>
      <span class="coinbox">${ico('coin')} <span class="js-coins">${fmt(S().coins)}</span></span>
    </header>`;

  UI.show = (name) => {
    screen = name;
    const root = $('#screens');
    $('#hud').classList.toggle('hidden', name !== 'game');
    if (name !== 'game') hideTip();
    const html = { title: vTitle, map: vMap, catalog: vCatalog, ach: vAch, shop: vShop, settings: () => vSettings(false), game: () => '' }[name]();
    root.innerHTML = html;
    paintCanvases(root);
  };
  UI.refreshCoins = () => {
    document.querySelectorAll('.js-coins').forEach((e) => { e.textContent = fmt(S().coins); });
    if (G.active) $('#hud-coins').textContent = fmt(S().coins);
  };

  // ---------- title ----------
  function vTitle() {
    const next = TH.nextLevel(), fresh = !Object.keys(S().stars).length && !S().stats.placed;
    const label = next ? `${fresh ? 'Start Tidying' : 'Continue'} — ${roomOf(next).name.replace(/^The /, '')} · ${next.name}` : 'Everything is tidy! Replay a room';
    const endless = TH.endlessUnlocked();
    const got = Object.keys(S().ach).length;
    return `<div class="title">
      <div class="logo"><h1>Tidy <span>Hollow</span></h1><p>a cozy organizing game</p></div>
      <div class="title-menu">
        <button class="btn big primary wide" data-act="continue">${ico('play')} ${esc(label)}</button>
        <button class="btn" data-act="go" data-to="map">${ico('home')} Rooms</button>
        <button class="btn ${endless ? '' : 'off'}" data-act="endless">${ico(endless ? 'loop' : 'lock')} Endless Mode</button>
        <button class="btn" data-act="go" data-to="catalog">${ico('book')} Catalog · ${TH.discovered()}/${TH.ITEM_LIST.length}</button>
        <button class="btn" data-act="go" data-to="ach">${ico('trophy')} Achievements · ${got}/${TH.ACH.length}</button>
        <button class="btn" data-act="go" data-to="shop">${ico('bag')} Shop</button>
        <button class="btn" data-act="go" data-to="settings">${ico('gear')} Settings</button>
        <button class="btn ghost" data-act="help">How to Play</button>
        ${TH.desktop ? '<button class="btn ghost" data-act="quit">Quit</button>' : '<span></span>'}
      </div>
    </div>
    <div class="title-foot"><span>Tidy Hollow v${TH.VERSION}</span><span>${TH.totalStars()}/${TH.maxStars()} stars · <span class="js-coins">${fmt(S().coins)}</span> coins</span></div>`;
  }

  // ---------- rooms ----------
  function vMap() {
    const next = TH.nextLevel();
    const rows = TH.ALL_ROOMS.map((room) => {
      const lvls = TH.LEVELS.filter((l) => l.room === room.id), open = TH.levelUnlocked(lvls[0]);
      const emblem = room.id === 'attic' ? 'gift_y' : room.cats[0].items[room.index % 8].id;
      const btns = lvls.map((l) => {
        const ok = TH.levelUnlocked(l), s = S().stars[l.id] || 0, b = S().best[l.id];
        if (!ok) return `<button class="btn lvl off" disabled>${ico('lock')}<span>${esc(l.name)}</span></button>`;
        return `<button class="btn lvl ${next && next.id === l.id ? 'next' : ''}" data-act="play" data-id="${l.id}">
          <span>${esc(l.name)}</span><span class="st"><b>${'★'.repeat(s)}</b>${'★'.repeat(3 - s)}</span>
          <span class="perfect">${b && b.perfect ? 'spotless' : l.items.length + ' items'}</span></button>`;
      }).join('');
      return `<div class="room ${open ? '' : 'locked'}">
        <canvas data-item="${emblem}"></canvas>
        <div class="info"><h3>${esc(room.name)}</h3><p>${esc(room.blurb)}</p><small>★ ${TH.roomStars(room)}/${lvls.length * 3}</small></div>
        <div class="levels">${btns}</div>
      </div>`;
    }).join('');
    return `<div class="panel screen">${header('Rooms')}<div class="body">${rows}</div></div>`;
  }

  // ---------- catalog ----------
  function vCatalog() {
    const s = S(), total = TH.ITEM_LIST.length, have = TH.discovered(), gold = Object.keys(s.gold).length;
    const tabs = TH.ROOMS.map((r) => {
      const n = r.itemIds.filter((id) => s.catalog[id]).length;
      return `<button class="tab ${r.id === catRoom ? 'on' : ''}" data-act="catroom" data-id="${r.id}">${esc(r.name.replace(/^The /, ''))} ${n}/${r.itemIds.length}</button>`;
    }).join('');
    const room = TH.ROOM_BY_ID[catRoom];
    const groups = room.cats.map((cat) => {
      const n = cat.items.filter((i) => s.catalog[i.id]).length;
      const tiles = cat.items.map((i) => {
        const cnt = s.catalog[i.id] || 0;
        return `<div class="tile ${cnt ? '' : 'unknown'}" title="${cnt ? esc(i.name) + ' — sorted ' + cnt + ' time' + (cnt === 1 ? '' : 's') : 'Not found yet'}">
          ${s.gold[i.id] ? '<i class="g" title="Golden version found">★</i>' : ''}${cnt ? `<i class="n">×${cnt}</i>` : ''}
          <canvas data-item="${i.id}"></canvas><span>${cnt ? esc(i.name) : '???'}</span></div>`;
      }).join('');
      return `<div class="cat-group"><h3>${esc(cat.name)} <small>${n}/8</small></h3><div class="tiles">${tiles}</div></div>`;
    }).join('');
    return `<div class="panel screen">${header('Catalog')}<div class="body">
      <p class="note"><b>${have} of ${total}</b> items discovered · <b>${gold}</b> golden versions found. Items are added the first time you sort them.</p>
      <div class="meter" style="margin-bottom:1rem"><i style="width:${have / total * 100}%"></i></div>
      <div class="tabs">${tabs}</div>${groups}</div></div>`;
  }

  // ---------- achievements ----------
  function vAch() {
    const s = S(), got = Object.keys(s.ach).length;
    const cards = TH.ACH.map((a) => {
      const has = !!s.ach[a.id], [cur, max] = a.prog(s), p = TH.clamp(cur / max, 0, 1);
      return `<div class="ach ${has ? 'got' : ''}">
        <div class="medal">${ico(has ? 'trophy' : 'lock')}</div>
        <div class="t"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>
          ${has ? '' : `<div class="meter"><i style="width:${p * 100}%"></i></div>`}</div>
        <div class="rw">${has ? ico('check') : '+' + a.reward}</div>
      </div>`;
    }).join('');
    return `<div class="panel screen">${header('Achievements', `<span class="coinbox">${ico('trophy')} ${got}/${TH.ACH.length}</span>`)}
      <div class="body"><div class="ach-grid">${cards}</div></div></div>`;
  }

  // ---------- shop ----------
  function vShop() {
    const s = S();
    const tabs = [['abil', 'Abilities'], ['theme', 'Room Themes'], ['pet', 'Companions']]
      .map(([id, n]) => `<button class="tab ${shopTab === id ? 'on' : ''}" data-act="shoptab" data-id="${id}">${n}</button>`).join('');
    let cards = '';
    const buyBtn = (cost, act, id, label) => `<button class="btn small ${s.coins >= cost ? 'primary' : 'off'}" data-act="${act}" data-id="${id}">${label} · ${ico('coin')} ${fmt(cost)}</button>`;
    if (shopTab === 'abil') {
      cards = TH.ABIL.map((a) => {
        const lvl = s.abil[a.id] || 1, open = TH.abilUnlocked(a);
        const pips = [1, 2, 3].map((i) => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('');
        let btn;
        if (!open) btn = `<span class="coinbox">${ico('lock')} ${a.unlock} ★</span>`;
        else if (lvl >= 3) btn = `<span class="coinbox">${ico('check')} Maxed</span>`;
        else btn = buyBtn(TH.UPGRADE_COST[lvl - 1], 'upgrade', a.id, 'Upgrade');
        const nextTxt = open && lvl < 3 ? ` <b>Next level: ${a.vals[lvl]}.</b>` : '';
        return `<div class="good"><div class="pic">${ico(a.icon)}</div>
          <div class="t"><h3>${esc(a.name)}<span class="pips">${pips}</span></h3>
          <p>${esc(a.desc(a.vals[lvl - 1]))}${nextTxt} Recharges every ${a.need} items you sort by hand.</p></div>${btn}</div>`;
      }).join('');
    } else if (shopTab === 'theme') {
      cards = TH.THEMES.map((t) => {
        const own = s.themes.includes(t.id), on = s.theme === t.id;
        const btn = on ? `<span class="coinbox">${ico('check')} In use</span>` : own ? `<button class="btn small" data-act="usetheme" data-id="${t.id}">Use</button>` : buyBtn(t.cost, 'buytheme', t.id, 'Buy');
        return `<div class="good"><div class="pic"><div class="swatch"><i style="background:${t.wall}"></i><i style="background:${t.table}"></i></div></div>
          <div class="t"><h3>${esc(t.name)}</h3><p>Repaints the walls, the table and the crates.</p></div>${btn}</div>`;
      }).join('');
    } else {
      cards = TH.PETS.map((p) => {
        const own = s.pets.includes(p.id), on = s.pet === p.id;
        const btn = on ? `<button class="btn small" data-act="usepet" data-id="">Send home</button>` : own ? `<button class="btn small good" data-act="usepet" data-id="${p.id}">Bring along</button>` : buyBtn(p.cost, 'buypet', p.id, 'Adopt');
        return `<div class="good"><div class="pic"><canvas data-pet="${p.id}"></canvas></div>
          <div class="t"><h3>${esc(p.name)}</h3><p>${esc(p.blurb)}</p></div>${btn}</div>`;
      }).join('');
    }
    return `<div class="panel screen">${header('Shop')}<div class="body"><div class="tabs">${tabs}</div><div class="shop-grid">${cards}</div></div></div>`;
  }

  // ---------- settings ----------
  const getPath = (p) => p.split('.').reduce((o, k) => o[k], TH.Settings);
  const setPath = (p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], TH.Settings)[last] = v; };
  const rTog = (path, label, sub) => `<div class="row"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>
    <button class="switch ${getPath(path) ? 'on' : ''}" data-act="toggle" data-path="${path}" role="switch" aria-checked="${!!getPath(path)}" aria-label="${esc(label)}"></button></div>`;
  const rSel = (path, label, opts, sub, dim) => `<div class="row ${dim ? 'dim' : ''}"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>
    <select data-path="${path}" ${dim ? 'disabled' : ''} aria-label="${esc(label)}">${opts.map(([v, n]) => `<option value="${v}" ${String(getPath(path)) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
  const rRange = (path, label, min, max, step, sub) => `<div class="row"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>
    <input type="range" data-path="${path}" min="${min}" max="${max}" step="${step}" value="${getPath(path)}" aria-label="${esc(label)}"><span class="val">${getPath(path)}%</span></div>`;
  const ACTIONS = [
    ['ability1', 'Ability 1 — Magnet Mitt'], ['ability2', 'Ability 2 — Broom Breeze'], ['ability3', 'Ability 3 — Golden Hour'],
    ['ability4', 'Ability 4 — Guiding Lantern'], ['shuffle', 'Shuffle the pile'], ['pause', 'Pause / back'],
    ['fullscreen', 'Toggle fullscreen'], ['mute', 'Mute all sound']
  ];
  function vSettings(inModal) {
    setInModal = inModal;
    const desk = !!TH.desktop;
    const tabs = [['game', 'Gameplay', 'heart'], ['controls', 'Controls', 'keys'], ['video', 'Video', 'monitor'], ['audio', 'Audio', 'sound']]
      .map(([id, n, ic]) => `<button class="tab ${setTab === id ? 'on' : ''}" data-act="settab" data-id="${id}">${ico(ic)} ${n}</button>`).join('');
    let rows = '', foot = '';
    if (setTab === 'game') {
      rows = rTog('game.names', 'Show item names', 'A name tag appears when you hover or hold an item.')
        + rTog('game.colorblind', 'Colour-blind symbols', 'Adds a unique shape to every colour, so colour levels never rely on hue alone.')
        + rTog('game.tips', 'Tutorial tips', 'Short hints the first time something new shows up.');
      foot = `<button class="btn small" data-act="resettips">Show all tips again</button>
        <button class="btn small danger" data-act="wipe">Erase all progress…</button>`;
    } else if (setTab === 'controls') {
      rows = `<p class="note">Mouse: left-click an item to pick it up, then drop it on a crate. Click a dust bunny to shoo it. Click a key below to rebind it.</p>`
        + rSel('controls.carry', 'Pick-up style', [['drag', 'Hold and drag'], ['click', 'Click to pick up, click to drop']], 'Click mode is easier on your hand in long sessions.')
        + rSel('controls.assist', 'Drop assist', [['off', 'Off — exact'], ['normal', 'Normal'], ['generous', 'Generous']], 'How close to a crate still counts as inside it.')
        + ACTIONS.map(([id, n]) => `<div class="row"><label>${n}</label>
            <button class="kbd ${rebinding === id ? 'listen' : ''}" data-act="rebind" data-id="${id}">${rebinding === id ? 'Press a key…' : esc(keyName(keys()[id]))}</button></div>`).join('');
      foot = `<button class="btn small" data-act="resetsec" data-id="controls">Reset controls</button>`;
    } else if (setTab === 'video') {
      const res = [['1280x720', '1280 × 720'], ['1366x768', '1366 × 768'], ['1600x900', '1600 × 900'], ['1920x1080', '1920 × 1080'], ['2560x1440', '2560 × 1440']];
      rows = rSel('video.mode', 'Display mode', desk ? [['windowed', 'Windowed'], ['maximized', 'Maximized window'], ['fullscreen', 'Fullscreen']] : [['windowed', 'Windowed'], ['fullscreen', 'Fullscreen']])
        + rSel('video.res', 'Window size', res, desk ? 'Used in windowed mode.' : 'Only available in the desktop app.', !desk || TH.Settings.video.mode !== 'windowed')
        + rSel('video.quality', 'Graphics quality', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], 'Shadows, lighting and how many particles fly around.')
        + rSel('video.renderScale', 'Render scale', [[50, '50%'], [75, '75%'], [100, '100% (native)'], [150, '150% (supersampled)']], 'Lower it on slow machines for a big speed boost.')
        + rSel('video.fpsCap', 'Frame rate limit', [[0, 'Match display'], [30, '30 FPS'], [60, '60 FPS'], [120, '120 FPS']])
        + rRange('video.uiScale', 'Interface size', 80, 130, 5)
        + rTog('video.particles', 'Particles', 'Sparkles and bursts when you place things.')
        + rTog('video.shake', 'Screen shake')
        + rTog('video.reduceMotion', 'Reduce motion', 'Turns off bounces, tilts, wobbles and pop-in animations.')
        + rTog('video.showFps', 'Show FPS counter');
      foot = `<button class="btn small" data-act="resetsec" data-id="video">Reset video</button>`;
    } else {
      rows = rRange('audio.master', 'Master volume', 0, 100, 1)
        + rRange('audio.music', 'Music', 0, 100, 1)
        + rRange('audio.sfx', 'Sound effects', 0, 100, 1)
        + rRange('audio.ambience', 'Ambience', 0, 100, 1)
        + rSel('audio.ambType', 'Ambience sound', [['fire', 'Crackling fireplace'], ['rain', 'Rain on the window'], ['night', 'Summer night'], ['off', 'None']])
        + rTog('audio.muteUnfocused', 'Mute when the window is in the background');
      foot = `<button class="btn small" data-act="testsound">Test sound</button>
        <button class="btn small" data-act="resetsec" data-id="audio">Reset audio</button>`;
    }
    const head = inModal
      ? `<header><button class="btn icon-btn" data-act="back" title="Back">${ico('back')}</button><h2>Settings</h2></header>`
      : header('Settings');
    return `<div class="panel screen">${head}<div class="body"><div class="set-wrap">
      <div class="set-tabs">${tabs}</div>
      <div><div class="set-list">${rows}</div><div class="set-foot">${foot}</div></div>
    </div></div></div>`;
  }
  function redrawSettings() {
    const root = setInModal ? $('#modal') : $('#screens');
    const body = $('.body', root), y = body ? body.scrollTop : 0;
    root.innerHTML = vSettings(setInModal);
    const nb = $('.body', root); if (nb) nb.scrollTop = y;
  }

  function applyVideo() {
    const v = TH.Settings.video;
    const base = Math.min(window.innerWidth / 1600, window.innerHeight / 900) * 16 * v.uiScale / 100;
    document.documentElement.style.fontSize = TH.clamp(base, 8, 34) + 'px';
    document.body.classList.toggle('reduce', v.reduceMotion);
    $('#fps').classList.toggle('hidden', !v.showFps);
    G.resize();
  }
  function applyMode() {
    const v = TH.Settings.video;
    if (TH.desktop) {
      TH.desktop.setMode(v.mode);
      if (v.mode === 'windowed') { const [w, h] = v.res.split('x').map(Number); TH.desktop.setSize(w, h); }
    } else if (v.mode === 'fullscreen') {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  function settingChanged(path) {
    TH.saveSettings();
    if (path.startsWith('video')) { applyVideo(); if (path === 'video.mode' || path === 'video.res') applyMode(); G.redrawBg(); }
    if (path.startsWith('audio')) TH.Audio.apply();
    if (G.active) UI.hud();
  }

  // ---------- modal dialogs ----------
  function openModal(kind, html) {
    modalKind = kind; setInModal = false;
    const m = $('#modal'); m.innerHTML = html; m.classList.remove('hidden');
    const f = m.querySelector('.btn.primary, .btn'); if (f) f.focus({ preventScroll: true });
  }
  function closeModal() { modalKind = ''; setInModal = false; const m = $('#modal'); m.classList.add('hidden'); m.innerHTML = ''; }
  UI.confirm = (title, text, yes, cb) => {
    UI._yes = cb; UI._confirmFromPause = setInModal;
    openModal('confirm', `<div class="panel dialog"><h2>${title}</h2><p>${text}</p>
      <div class="btns rowed"><button class="btn danger" data-act="yes">${yes}</button><button class="btn" data-act="no">Cancel</button></div></div>`);
  };
  function pauseMenu() {
    G.pause(true);
    const lv = G.level;
    openModal('pause', `<div class="panel dialog"><h2>Paused</h2><p>${esc(roomOf(lv).name)} · ${esc(lv.name)} — no timer, no rush.</p>
      <div class="btns">
        <button class="btn primary" data-act="resume">${ico('play')} Resume</button>
        <button class="btn" data-act="retry">${ico('retry')} Restart level</button>
        <button class="btn" data-act="pausesettings">${ico('gear')} Settings</button>
        <button class="btn" data-act="help">How to Play</button>
        <button class="btn" data-act="tomap">${ico('home')} ${lv.endless ? 'Back to menu' : 'Back to rooms'}</button>
      </div></div>`);
  }
  function helpDialog() {
    const k = keys(), was = modalKind;
    UI._helpFrom = was;
    openModal('help', `<div class="panel dialog help"><h2>How to Play</h2>
      <ul>
        <li><b>Sort the pile.</b> Pick items up with the mouse and drop each one in the crate whose label matches. Some days you sort by <b>what it is</b>, some by <b>colour</b>, and in the attic by <b>which room it belongs to</b>.</li>
        <li><b>Keep a streak.</b> Every correct drop in a row raises your streak, and a higher streak pays more coins per item. A mistake only resets it — there is no timer and you can never fail.</li>
        <li><b>Abilities</b> unlock as you earn stars and recharge as you sort. Use them with the buttons at the bottom or keys <b>${esc(keyName(k.ability1))} ${esc(keyName(k.ability2))} ${esc(keyName(k.ability3))} ${esc(keyName(k.ability4))}</b>.</li>
        <li><b>Golden items</b> pay big. <b>Dust bunnies</b> hide in the pile — click them. Press <b>${esc(keyName(k.shuffle))}</b> to shuffle the pile if something is buried.</li>
        <li><b>Spend coins</b> in the Shop on ability upgrades, room themes and a companion. Every new item you sort is added to your <b>Catalog</b>.</li>
      </ul>
      <div class="btns"><button class="btn primary" data-act="closehelp">Got it</button></div></div>`);
  }
  UI.levelDone = (level, run, res) => {
    lastResult = { level, run, res };
    hideTip();
    const stars = [0, 1, 2].map((i) => `<span class="${i < res.stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.3}s">★</span>`).join('');
    for (let i = 0; i < res.stars; i++) setTimeout(() => TH.Audio.play('star', i), 250 + i * 300);
    const row = (a, b, cls) => `<span class="${cls || ''}">${a}</span><b class="${cls || ''}">${b}</b>`;
    const unlocked = res.unlocked.map((a) => `<div class="unlock">${ico(a.icon)}<div>New ability: ${esc(a.name)}<small>${esc(a.desc(a.vals[0]))}</small></div></div>`).join('');
    const hasNext = level.endless || level.index < TH.LEVELS.length - 1;
    const finale = !level.endless && !hasNext;
    openModal('done', `<div class="panel dialog">
      <h2>${finale ? 'The whole house is tidy!' : res.perfect ? 'Spotless!' : 'All tidy!'}</h2>
      <p>${esc(roomOf(level).name)} · ${esc(level.name)}</p>
      <div class="stars">${stars}</div>
      <div class="tally">
        ${row('Items sorted', run.total)}
        ${row('Mistakes', run.mistakes === 0 ? 'None!' : run.mistakes)}
        ${row('Best streak', '×' + run.bestCombo)}
        ${row('Time', TH.time(run.time))}
        ${run.newItems ? row('New catalog entries', '+' + run.newItems) : ''}
        ${run.golds ? row('Golden items', run.golds) : ''}
        ${run.caught ? row('Dust bunnies shooed', run.caught) : ''}
        ${row('Coins from sorting', '+' + fmt(run.coins))}
        ${row(res.perfect ? 'Star + spotless bonus' : 'Star bonus', '+' + res.bonus)}
        ${row('Total earned', '+' + fmt(res.coins), 'sum')}
      </div>
      ${unlocked}
      <div class="btns">
        ${hasNext ? `<button class="btn primary" data-act="next">${ico('play')} ${level.endless ? 'Next round' : 'Next level'}</button>` : ''}
        <div class="btns rowed" style="margin:0"><button class="btn" data-act="retry">${ico('retry')} Replay</button>
        <button class="btn" data-act="tomap">${ico('home')} ${level.endless ? 'Menu' : 'Rooms'}</button></div>
      </div></div>`);
    UI.refreshCoins();
  };

  // ---------- HUD ----------
  function hudBuild() {
    const lv = G.level;
    $('#hud-name').textContent = lv.endless ? lv.name : roomOf(lv).name.replace(/^The /, '') + ' · ' + lv.name;
    $('#hud-hint').textContent = lv.hint;
    $('#hud-abil').innerHTML = TH.ABIL.map((a, i) => {
      const open = TH.abilUnlocked(a);
      const tip = open ? `${a.name} (level ${S().abil[a.id]}) — ${a.desc(TH.abilVal(a))}` : `${a.name} — unlocks at ${a.unlock} stars`;
      return `<button class="abil ${open ? '' : 'lock'}" data-act="abil" data-i="${i}" title="${esc(tip)}">
        <span class="fill"></span><span class="key">${esc(keyName(keys()[a.bind]))}</span>${ico(open ? a.icon : 'lock')}
        <span class="lbl">${open ? esc(a.name.split(' ')[0]) : a.unlock + ' ★'}</span></button>`;
    }).join('');
    $('#hud-shuffle').textContent = `Shuffle pile [${keyName(keys().shuffle)}]`;
    lastCombo = 0;
  }
  UI.hud = () => {
    if (!G.active || screen !== 'game') return;
    $('#hud-bar').style.width = (G.landed / G.total * 100) + '%';
    $('#hud-count').textContent = G.landed + '/' + G.total;
    const cb = $('#hud-combo');
    cb.firstElementChild.textContent = '×' + G.combo;
    cb.classList.toggle('hot', G.combo >= 10);
    if (G.combo > lastCombo && !TH.Settings.video.reduceMotion) { cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
    lastCombo = G.combo;
    $('#hud-coins').textContent = fmt(S().coins);
    const fx = [];
    if (G.fx.magnet) fx.push(`<div class="chip fx">${ico('magnet')} Magnet armed</div>`);
    if (G.fx.golden > 0) fx.push(`<div class="chip fx">${ico('sun')} Double coins ×${G.fx.golden}</div>`);
    if (G.fx.lantern > 0) fx.push(`<div class="chip fx">${ico('lantern')} Lantern ×${G.fx.lantern}</div>`);
    $('#hud-fx').innerHTML = fx.join('');
    document.querySelectorAll('#hud-abil .abil').forEach((el, i) => {
      const a = TH.ABIL[i]; if (!TH.abilUnlocked(a)) return;
      const p = Math.min(1, G.charge[a.id] / a.need);
      el.querySelector('.fill').style.height = (p * 100) + '%';
      el.classList.toggle('ready', p >= 1);
      el.classList.toggle('armed', a.id === 'magnet' && G.fx.magnet);
    });
  };
  UI.fps = (n) => { if (TH.Settings.video.showFps) $('#fps').textContent = n + ' FPS'; };

  // ---------- tips & toasts ----------
  function hideTip() { clearTimeout(tipTimer); $('#tip').classList.add('hidden'); }
  UI.tip = (id, text) => {
    if (!TH.Settings.game.tips || S().tips[id]) return;
    S().tips[id] = 1; TH.Save.commit();
    const t = $('#tip'); t.textContent = text; t.classList.remove('hidden');
    clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 7000);
  };
  UI.toast = (kind, title, sub) => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${ico(kind === 'ach' ? 'trophy' : 'star')}<div><small>${kind === 'ach' ? 'Achievement unlocked' : 'Tidy Hollow'}</small><b>${esc(title)}</b>${sub ? `<i>${esc(sub)}</i>` : ''}</div>`;
    const box = $('#toasts');
    while (box.children.length >= 3) box.firstElementChild.remove();   // never bury the screen in pop-ups
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 4200);
    setTimeout(() => el.remove(), 4600);
  };

  // ---------- flow ----------
  function play(level) {
    closeModal();
    UI.show('game');
    G.start(level);
    hudBuild(); UI.hud();
  }
  function leaveGame(to) { closeModal(); G.stop(); UI.show(to); }
  function togglePause() {
    if (!G.active || G.done) return;
    if (modalKind === 'pause') { closeModal(); G.pause(false); }
    else if (!modalKind) pauseMenu();
  }
  function goBack() {
    if (rebinding) { rebinding = null; redrawSettings(); return; }
    if (modalKind === 'help') return act.closehelp();
    if (modalKind === 'confirm') return act.no();
    if (modalKind === 'settings') return pauseMenu();
    if (modalKind === 'done') return;
    if (screen === 'game') return togglePause();
    if (screen !== 'title') UI.show('title');
  }

  const act = {
    go: (el) => UI.show(el.dataset.to),
    back: () => goBack(),
    continue: () => { const n = TH.nextLevel(); if (n) play(n); else UI.show('map'); },
    play: (el) => { const lv = TH.LEVEL_BY_ID[el.dataset.id]; if (lv && TH.levelUnlocked(lv)) play(lv); },
    endless: () => {
      if (!TH.endlessUnlocked()) { TH.Audio.play('deny'); UI.toast('info', 'Endless Mode is locked', 'Finish the first two rooms to open it.'); return; }
      endlessRound = 1; play(TH.makeEndless(1));
    },
    next: () => {
      const lv = lastResult.level;
      if (lv.endless) play(TH.makeEndless(++endlessRound));
      else play(TH.LEVELS[lv.index + 1]);
    },
    retry: () => { const lv = G.level; play(lv.endless ? TH.makeEndless(endlessRound) : lv); },
    tomap: () => leaveGame(G.level && G.level.endless ? 'title' : 'map'),
    pause: () => togglePause(),
    resume: () => togglePause(),
    pausesettings: () => { modalKind = 'settings'; $('#modal').innerHTML = vSettings(true); },
    help: () => helpDialog(),
    closehelp: () => { if (UI._helpFrom === 'pause') pauseMenu(); else closeModal(); },
    abil: (el) => G.useAbility(+el.dataset.i),
    shuffle: () => G.shuffle(),
    quit: () => { TH.Save.flush(); if (TH.desktop) TH.desktop.quit(); },
    catroom: (el) => { catRoom = el.dataset.id; UI.show('catalog'); },
    shoptab: (el) => { shopTab = el.dataset.id; UI.show('shop'); },
    settab: (el) => { setTab = el.dataset.id; rebinding = null; redrawSettings(); },
    toggle: (el) => { const p = el.dataset.path; setPath(p, !getPath(p)); settingChanged(p); redrawSettings(); },
    rebind: (el) => { rebinding = rebinding === el.dataset.id ? null : el.dataset.id; redrawSettings(); },
    resetsec: (el) => { TH.resetSettings(el.dataset.id); settingChanged(el.dataset.id); if (el.dataset.id === 'video') applyMode(); redrawSettings(); },
    resettips: () => { S().tips = {}; TH.Save.commit(); UI.toast('info', 'Tips reset', 'Hints will show again.'); },
    testsound: () => { TH.Audio.play('bin'); },
    wipe: () => UI.confirm('Erase everything?', 'This deletes all stars, coins, catalog entries, achievements and purchases. It cannot be undone.', 'Erase', () => {
      const wasGame = G.active; TH.Save.reset(); if (wasGame) G.stop(); closeModal(); G.redrawBg(); UI.show('title');
    }),
    yes: () => { const cb = UI._yes; UI._yes = null; if (cb) cb(); else closeModal(); },
    no: () => { if (UI._confirmFromPause) act.pausesettings(); else closeModal(); },
    upgrade: (el) => {
      const a = TH.ABIL.find((x) => x.id === el.dataset.id), lvl = S().abil[a.id];
      if (lvl >= 3 || !TH.Save.spend(TH.UPGRADE_COST[lvl - 1])) return TH.Audio.play('deny');
      S().abil[a.id] = lvl + 1; bought();
    },
    buytheme: (el) => {
      const t = TH.THEMES.find((x) => x.id === el.dataset.id);
      if (S().themes.includes(t.id) || !TH.Save.spend(t.cost)) return TH.Audio.play('deny');
      S().themes.push(t.id); S().theme = t.id; G.redrawBg(); bought();
    },
    usetheme: (el) => { S().theme = el.dataset.id; TH.Save.commit(); G.redrawBg(); UI.show('shop'); },
    buypet: (el) => {
      const p = TH.PETS.find((x) => x.id === el.dataset.id);
      if (S().pets.includes(p.id) || !TH.Save.spend(p.cost)) return TH.Audio.play('deny');
      S().pets.push(p.id); S().pet = p.id; bought();
    },
    usepet: (el) => { S().pet = el.dataset.id; TH.Save.commit(); UI.show('shop'); }
  };
  function bought() { TH.Save.flush(); TH.Audio.play('buy'); TH.checkAch(); UI.show('shop'); }

  // ---------- events ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    TH.Audio.init();
    if (!el.classList.contains('abil')) TH.Audio.play('click');
    const fn = act[el.dataset.act];
    if (fn) fn(el);
    if (el.blur && screen === 'game' && !modalKind) el.blur();
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.path || el.tagName !== 'SELECT') return;
    const cur = getPath(el.dataset.path);
    setPath(el.dataset.path, typeof cur === 'number' ? Number(el.value) : el.value);
    settingChanged(el.dataset.path); redrawSettings();
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type !== 'range' || !el.dataset.path) return;
    setPath(el.dataset.path, Number(el.value));
    el.nextElementSibling.textContent = el.value + '%';
    settingChanged(el.dataset.path);
  });
  let lastHover = null;
  document.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.btn, .tab, .abil');
    if (b && b !== lastHover) TH.Audio.play('hover');
    lastHover = b;
  });
  document.addEventListener('keydown', (e) => {
    TH.Audio.init();
    if (rebinding) {
      e.preventDefault();
      const k = keys(), other = Object.keys(k).find((a) => k[a] === e.code && a !== rebinding);
      if (other) k[other] = k[rebinding];          // swap so nothing ends up unbound
      k[rebinding] = e.code; rebinding = null;
      TH.saveSettings(); redrawSettings();
      if (G.active) { hudBuild(); UI.hud(); }
      return;
    }
    if (e.repeat) return;
    const k = keys(), a = Object.keys(k).find((x) => k[x] === e.code);
    if (!a) return;
    const typing = e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT');
    if (a === 'fullscreen') {
      e.preventDefault();
      TH.Settings.video.mode = TH.Settings.video.mode === 'fullscreen' ? 'windowed' : 'fullscreen';
      settingChanged('video.mode');
      if (screen === 'settings' || modalKind === 'settings') redrawSettings();
    } else if (a === 'pause') { e.preventDefault(); goBack(); }
    else if (typing) return;
    else if (a === 'mute') UI.toast('info', TH.Audio.toggleMute() ? 'Sound muted' : 'Sound on');
    else if (screen === 'game' && !modalKind) {
      if (a === 'shuffle') G.shuffle();
      else if (a.startsWith('ability')) G.useAbility(+a.slice(7) - 1);
    }
  });
  window.addEventListener('resize', applyVideo);
  window.addEventListener('blur', () => TH.Audio.setFocus(false));
  window.addEventListener('focus', () => TH.Audio.setFocus(true));
  document.addEventListener('fullscreenchange', () => {
    if (TH.desktop) return;
    const on = !!document.fullscreenElement;
    if ((TH.Settings.video.mode === 'fullscreen') !== on) { TH.Settings.video.mode = on ? 'fullscreen' : 'windowed'; TH.saveSettings(); if (screen === 'settings') redrawSettings(); }
  });
  if (TH.desktop) {
    TH.desktop.onFullscreen((on) => {
      const m = TH.Settings.video.mode;
      if (on && m !== 'fullscreen') TH.Settings.video.mode = 'fullscreen';
      else if (!on && m === 'fullscreen') TH.Settings.video.mode = 'windowed';
      else return;
      TH.saveSettings(); if (screen === 'settings' || modalKind === 'settings') redrawSettings();
    });
  }

  // ---------- boot ----------
  document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = ico(el.dataset.icon); });
  G.init($('#cv'));
  applyVideo();
  applyMode();
  UI.show('title');
})();
