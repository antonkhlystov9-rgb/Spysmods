// The Night Shelver — menus, HUD, settings, and boot
(function () {
  'use strict';
  const TH = window.TH, G = TH.Game;
  const S = () => TH.Save.data;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = TH.esc, fmt = TH.fmt;
  const UI = TH.UI = {};
  const NB = TH.BOOKS.length;

  // ---------- icons ----------
  const st = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const ICON = {
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
    magnet: '<path d="M6 4v8a6 6 0 0012 0V4h-4v8a2 2 0 01-4 0V4z" fill="currentColor"/><path d="M6 7.5h4M14 7.5h4" stroke="#fff6e2" stroke-width="1.6"/>',
    wind: '<path d="M3 9h10a3 3 0 10-3-3M3 14h15a3 3 0 11-3 3M3 19h7" ' + st + ' stroke-width="2.4"/>',
    sun: '<circle cx="12" cy="12" r="4.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" ' + st + ' stroke-width="2.2"/>',
    lantern: '<path d="M9 3h6M12 3v2M8 5h8l1 3v9l-1 3H8l-1-3V8z" ' + st + ' stroke-width="2.2"/><path d="M12 10c2 2 1.5 5.5 0 5.5s-2-3.5 0-5.5z" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7" ' + st + ' stroke-width="3.2"/>',
    paw: '<path d="M5 19c2-6 3-9 3-13M9 6c3 1 5 3 5 6M8 12c3 0 6 2 7 7M14 12c2-1 4-1 5 1" ' + st + ' stroke-width="2.4"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2" ' + st + ' stroke-width="2.2"/><path d="M9 20h6M12 16v4" ' + st + ' stroke-width="2.2"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" ' + st + ' stroke-width="2"/>',
    keys: '<rect x="2.5" y="6" width="19" height="12" rx="2.5" ' + st + ' stroke-width="2.2"/><path d="M6.5 10h.5M10.5 10h.5M14.5 10h.5M18 10h.2M7.5 14h9" ' + st + ' stroke-width="2.2"/>',
    heart: '<path d="M12 20S4 15 4 9.5A4.2 4.2 0 0112 7a4.2 4.2 0 018 2.5C20 15 12 20 12 20z" fill="currentColor"/>',
    retry: '<path d="M5 12a7 7 0 107-7H8M8 5l3-3M8 5l3 3" ' + st + ' stroke-width="2.4"/>'
  };
  const ico = (n) => `<svg class="ico" viewBox="0 0 24 24">${ICON[n] || ''}</svg>`;

  // ---------- state ----------
  let screen = 'title', modalKind = '', catWing = 0, shopTab = 'abil', setTab = 'game';
  let installEvent = null, installLate = false;
  // the hosted website (not the desktop app, not the single-file version)
  // inside someone else's page (an embedded preview) the browser will not let us hand over or pick a file
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const onWeb = !TH.desktop && /^https?:$/.test(location.protocol) && !!document.querySelector('link[rel="manifest"]');
  let rebinding = null, tipTimer = 0, flashTimer = 0, bannerTimer = 0, lastStreak = 0;

  const keyName = (code) => {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
    return { Escape: 'Esc', Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'R Shift', ControlLeft: 'Ctrl', ControlRight: 'R Ctrl', AltLeft: 'Alt', AltRight: 'R Alt', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', Backquote: '`', Minus: '-', Equal: '=', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: '\'', BracketLeft: '[', BracketRight: ']', Backslash: '\\' }[code] || code;
  };
  const keys = () => TH.Settings.controls.keys;
  UI.keyLabel = (action) => keyName(keys()[action]);
  const inGame = () => G.mode === 'play';

  // ---------- screens ----------
  const header = (title, extra) => `<header>
      <button class="btn icon-btn" data-act="back" title="Back">${ico('back')}</button>
      <h2>${title}</h2>${extra || ''}
      <span class="coinbox">${ico('book')} ${TH.shelvedCount()}/${NB}</span>
      <span class="coinbox">${ico('coin')} <span class="js-coins">${fmt(S().coins)}</span></span>
    </header>`;
  const VIEWS = { title: vTitle, catalog: vCatalog, ach: vAch, shop: vShop, settings: vSettings };

  // In the menus a view fills the screen; during play it opens over the paused game.
  UI.show = (name, quiet) => {
    const root = inGame() ? $('#modal') : $('#screens');
    if (inGame()) { screen = 'game'; modalKind = 'view:' + name; root.classList.remove('hidden'); }
    else { screen = name; $('#hud').classList.add('hidden'); hideTip(); }
    root.innerHTML = VIEWS[name]();
    if (quiet && root.firstElementChild) root.firstElementChild.style.animation = 'none';   // no pop-in when only refreshing
  };
  const currentView = () => (modalKind.startsWith('view:') ? modalKind.slice(5) : screen);
  const redraw = () => {
    const root = modalKind.startsWith('view:') ? $('#modal') : $('#screens');
    const body = $('.body', root), y = body ? body.scrollTop : 0;
    UI.show(currentView(), true);
    const nb = $('.body', root); if (nb) nb.scrollTop = y;
  };
  UI.refreshCoins = () => {
    document.querySelectorAll('.js-coins').forEach((e) => { e.textContent = fmt(S().coins); });
    if (inGame()) $('#hud-coins').textContent = fmt(S().coins);
  };

  function vTitle() {
    const s = S(), fresh = !s.stats.placed && s.stats.playTime < 5, done = TH.shelvedCount() === NB;
    const label = done ? 'Wander the finished library' : fresh ? 'Start the night shift' : `Continue — ${TH.shelvedCount()} of ${NB} shelved`;
    return `<div class="title">
      <div class="logo"><img src="icon.png" alt=""><div><h1>The Night <span>Shelver</span></h1><p>a cozy library organizing game</p></div></div>
      <div class="title-menu">
        <button class="btn big primary wide" data-act="enter">${ico('play')} ${esc(label)}</button>
        <button class="btn" data-act="go" data-to="catalog">${ico('book')} Card Catalogue</button>
        <button class="btn" data-act="go" data-to="ach">${ico('trophy')} Achievements · ${Object.keys(s.ach).length}/${TH.ACH.length}</button>
        <button class="btn" data-act="go" data-to="shop">${ico('bag')} Shop</button>
        <button class="btn" data-act="go" data-to="settings">${ico('gear')} Settings</button>
        <button class="btn ghost" data-act="help">How to Play</button>
        ${TH.desktop ? '<button class="btn ghost" data-act="quit">Quit</button>' : installEvent ? '<button class="btn ghost" data-act="install">Install as an app</button>' : '<span></span>'}
      </div>
    </div>
    <div class="title-foot"><span>The Night Shelver v${TH.VERSION}${onWeb ? ' · <a href="The-Night-Shelver.html" download>Download as one file</a>' : ''}</span><span>${TH.SERIES.filter((se) => TH.seriesCount(se) === TH.VOLS).length}/${TH.SERIES.length} rows complete · <span class="js-coins">${fmt(s.coins)}</span> coins</span></div>`;
  }

  function vCatalog() {
    const s = S(), have = TH.shelvedCount(), gold = TH.BOOKS.filter((b) => b.gold && s.shelved[b.id]).length, goldAll = TH.BOOKS.filter((b) => b.gold).length;
    const tabs = TH.WINGS.map((w, i) => `<button class="tab ${i === catWing ? 'on' : ''}" data-act="catwing" data-id="${i}">${TH.wingOpen(i) ? '' : ico('lock') + ' '}${esc(w.name.replace(/^The /, ''))} ${TH.shelvedCount(i)}/${w.books}</button>`).join('');
    const cards = TH.WINGS[catWing].cats.map((cat) => {
      let n = 0;
      const rows = cat.series.map((se) => {
        const c = TH.seriesCount(se); n += c;
        const cells = se.books.map((id) => (s.shelved[id]
          ? `<button class="on ${s.read[id] ? 'read' : ''} ${TH.BOOKS[id].gold ? 'gilt' : ''}" data-act="readbook" data-id="${id}" style="background:${se.color}" title="${esc(TH.bookTitle(TH.BOOKS[id]))}${TH.BOOKS[id].gold ? ' (gilded)' : ''} — click to read" aria-label="Read ${esc(TH.bookTitle(TH.BOOKS[id]))}"></button>`
          : `<i title="${esc(TH.bookTitle(TH.BOOKS[id]))} — still loose"></i>`)).join('');
        return `<div class="srow ${c === TH.VOLS ? 'full' : ''}"><span>${esc(se.name)}</span><div class="vols">${cells}</div><b>${c}/${TH.VOLS}</b></div>`;
      }).join('');
      return `<div class="sect"><h3><i style="background:${cat.color}"></i>${esc(cat.name)}<small>${n}/${TH.VOLS * 4}</small></h3>${rows}</div>`;
    }).join('');
    return `<div class="panel screen">${header('Card Catalogue')}<div class="body">
      <p class="note"><b>${have} of ${NB}</b> books are on their shelves · <b>${gold} of ${goldAll}</b> gilded books shelved · <b>${Object.keys(s.read).length}</b> read. Each little spine is one book: click a shelved one to read it. A dot means you have read it.</p>
      <div class="meter" style="margin-bottom:1rem"><i style="width:${have / NB * 100}%"></i></div>
      <div class="tabs">${tabs}</div><div class="sects">${cards}</div></div></div>`;
  }

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

  function vShop() {
    const s = S();
    const tabs = [['abil', 'Knacks'], ['gear', 'Gear'], ['mood', 'Moods']]
      .map(([id, n]) => `<button class="tab ${shopTab === id ? 'on' : ''}" data-act="shoptab" data-id="${id}">${n}</button>`).join('');
    const buyBtn = (cost, act, id, label) => `<button class="btn small ${s.coins >= cost ? 'primary' : 'off'}" data-act="${act}" data-id="${id}">${label} · ${ico('coin')} ${fmt(cost)}</button>`;
    const pips = (lvl, max) => `<span class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</span>`;
    let cards = '', note = '';
    if (shopTab === 'abil') {
      note = 'Knacks unlock as you finish shelf rows. They recharge each time you shelve a book by hand.';
      cards = TH.ABIL.map((a) => {
        const lvl = s.abil[a.id] || 1, open = TH.abilUnlocked(a);
        let btn;
        if (!open) btn = `<span class="coinbox">${ico('lock')} ${a.unlock} rows</span>`;
        else if (lvl >= 3) btn = `<span class="coinbox">${ico('check')} Maxed</span>`;
        else btn = buyBtn(TH.UPGRADE_COST[lvl - 1], 'upgrade', a.id, 'Upgrade');
        return `<div class="good"><div class="pic">${ico(a.icon)}</div>
          <div class="t"><h3>${esc(a.name)}${pips(lvl, 3)}</h3>
          <p>${esc(a.desc(a.vals[lvl - 1]))}${open && lvl < 3 ? ` <b>Next level: ${a.vals[lvl]}.</b>` : ''} Recharges every ${a.need} books.</p></div>${btn}</div>`;
      }).join('');
    } else if (shopTab === 'gear') {
      note = 'Gear is always on. It makes every trip across the library a little easier.';
      cards = TH.UPG.map((u) => {
        const lvl = s.upg[u.id] || 0, max = u.vals.length - 1;
        const btn = lvl >= max ? `<span class="coinbox">${ico('check')} Maxed</span>` : buyBtn(u.cost[lvl], 'buygear', u.id, 'Upgrade');
        return `<div class="good"><div class="pic">${ico(u.icon)}</div>
          <div class="t"><h3>${esc(u.name)}${pips(lvl, max)}</h3>
          <p>${esc(u.desc)} Now: <b>${u.vals[lvl]} ${u.unit}</b>${lvl < max ? `, next: <b>${u.vals[lvl + 1]} ${u.unit}</b>` : ''}.</p></div>${btn}</div>`;
      }).join('');
    } else {
      note = 'Moods change the light in every room. Purely for atmosphere.';
      cards = TH.MOODS.map((m) => {
        const own = s.moods.includes(m.id), on = s.mood === m.id;
        const btn = on ? `<span class="coinbox">${ico('check')} In use</span>` : own ? `<button class="btn small" data-act="usemood" data-id="${m.id}">Use</button>` : buyBtn(m.cost, 'buymood', m.id, 'Buy');
        return `<div class="good"><div class="pic"><div class="swatch"><i style="background:${m.win}"></i><i style="background:${m.fog}"></i></div></div>
          <div class="t"><h3>${esc(m.name)}</h3><p>${{ lamp: 'Warm lamps against a dark night.', morning: 'Bright, low sun through the windows.', rain: 'Grey light and glowing lamps.', moon: 'Cool blue shadows, very still.' }[m.id]}</p></div>${btn}</div>`;
      }).join('');
    }
    return `<div class="panel screen">${header('Shop')}<div class="body"><div class="tabs">${tabs}</div><p class="note">${note}</p><div class="shop-grid">${cards}</div></div></div>`;
  }

  // ---------- settings ----------
  const getPath = (p) => p.split('.').reduce((o, k) => o[k], TH.Settings);
  const setPath = (p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], TH.Settings)[last] = v; };
  const rTog = (path, label, sub) => `<div class="row"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>
    <button class="switch ${getPath(path) ? 'on' : ''}" data-act="toggle" data-path="${path}" role="switch" aria-checked="${!!getPath(path)}" aria-label="${esc(label)}"></button></div>`;
  const rSel = (path, label, opts, sub, dim) => `<div class="row ${dim ? 'dim' : ''}"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>
    <select data-path="${path}" ${dim ? 'disabled' : ''} aria-label="${esc(label)}">${opts.map(([v, n]) => `<option value="${v}" ${String(getPath(path)) === String(v) ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
  const rRange = (path, label, min, max, step, sub, unit) => `<div class="row"><label>${label}${sub ? `<small>${sub}</small>` : ''}</label>
    <input type="range" data-path="${path}" data-unit="${unit || '%'}" min="${min}" max="${max}" step="${step}" value="${getPath(path)}" aria-label="${esc(label)}"><span class="val">${getPath(path)}${unit || '%'}</span></div>`;
  const ACTIONS = [
    ['forward', 'Walk forward'], ['back', 'Walk back'], ['left', 'Step left'], ['right', 'Step right'], ['run', 'Run (hold)'],
    ['interact', 'Pick up / shelve'], ['grab', 'Gather nearby books of a section / take one off a shelf'], ['drop', 'Put a book down'], ['read', 'Read a book'],
    ['ability1', 'Knack 1 — Call the Strays'], ['ability2', 'Knack 2 — Tidy Hands'], ['ability3', 'Knack 3 — Golden Hour'], ['ability4', 'Knack 4 — Wayfinder'],
    ['pause', 'Pause'], ['fullscreen', 'Toggle fullscreen'], ['mute', 'Mute all sound']
  ];
  function vSettings() {
    const desk = !!TH.desktop;
    const tabs = [['game', 'Gameplay', 'heart'], ['controls', 'Controls', 'keys'], ['video', 'Video', 'monitor'], ['audio', 'Audio', 'sound']]
      .map(([id, n, ic]) => `<button class="tab ${setTab === id ? 'on' : ''}" data-act="settab" data-id="${id}">${ico(ic)} ${n}</button>`).join('');
    let rows = '', foot = '';
    if (setTab === 'game') {
      rows = rTog('game.names', 'Show what you are looking at', 'Book titles and shelf names appear under the crosshair.')
        + rTog('game.crosshair', 'Crosshair')
        + rTog('game.exact', 'Exact shelving', 'Harder: you must point at the right gap in the row, not just the right row. Pays +1 coin per book.')
        + rTog('game.tips', 'Tutorial tips', 'Short hints the first time something new shows up.')
        + `<p class="note"><b>Your progress saves by itself</b> after everything you do: shelved books, where every loose book lies, what you carry and where you stand. Each place you play (website, installed app, single file) keeps its own save.${framed ? '' : ' To move one across, save it to a file here and load that file there.'}</p>`;
      foot = `${framed ? '' : `<button class="btn small" data-act="savefile">Save progress to a file</button>
        <button class="btn small" data-act="loadfile">Load progress from a file…</button>`}
        <button class="btn small" data-act="resettips">Show all tips again</button>
        <button class="btn small" data-act="reshuffle">Reshuffle the library…</button>
        <button class="btn small danger" data-act="wipe">Erase all progress…</button>`;
    } else if (setTab === 'controls') {
      rows = `<p class="note">Mouse: move to look, left-click to pick up or shelve, right-click a loose book to gather the nearby ones of its section, right-click a shelved book to take it down. Esc always frees the mouse and pauses. Click a key below to rebind it.</p>`
        + rRange('controls.sens', 'Mouse sensitivity', 20, 300, 5)
        + rTog('controls.invertY', 'Invert vertical look')
        + rTog('controls.hold', 'Hold to repeat', 'Keep the mouse button down to keep picking up or shelving.')
        + ACTIONS.map(([id, n]) => `<div class="row"><label>${n}</label>
            <button class="kbd ${rebinding === id ? 'listen' : ''}" data-act="rebind" data-id="${id}">${rebinding === id ? 'Press a key…' : esc(keyName(keys()[id]))}</button></div>`).join('');
      foot = `<button class="btn small" data-act="resetsec" data-id="controls">Reset controls</button>`;
    } else if (setTab === 'video') {
      const res = [['1280x720', '1280 × 720'], ['1366x768', '1366 × 768'], ['1600x900', '1600 × 900'], ['1920x1080', '1920 × 1080'], ['2560x1440', '2560 × 1440']];
      rows = rSel('video.mode', 'Display mode', desk ? [['windowed', 'Windowed'], ['maximized', 'Maximized window'], ['fullscreen', 'Fullscreen']] : [['windowed', 'Windowed'], ['fullscreen', 'Fullscreen']])
        + rSel('video.res', 'Window size', res, desk ? 'Used in windowed mode.' : 'Only available in the desktop app.', !desk || TH.Settings.video.mode !== 'windowed')
        + rSel('video.quality', 'Graphics quality', [['low', 'Low — no lamps, fog or smoothing'], ['medium', 'Medium'], ['high', 'High — smooth edges, dust in the air']])
        + rSel('video.renderScale', 'Render scale', [[50, '50%'], [75, '75%'], [100, '100% (native)'], [150, '150% (supersampled)']], 'Lower it on slow machines for a big speed boost.')
        + rSel('video.fpsCap', 'Frame rate limit', [[0, 'Match display'], [30, '30 FPS'], [60, '60 FPS'], [120, '120 FPS']])
        + rRange('video.fov', 'Field of view', 60, 100, 1, 'Wider shows more of the room; narrower feels closer.', '°')
        + rRange('video.uiScale', 'Interface size', 80, 130, 5)
        + rTog('video.bob', 'Head bob', 'A slight sway as you walk.')
        + rTog('video.particles', 'Particles', 'Sparkles when books land and dust in the light.')
        + rTog('video.reduceMotion', 'Reduce motion', 'Turns off head bob, book arcs and menu animations.')
        + rTog('video.showFps', 'Show FPS counter');
      foot = `<button class="btn small" data-act="resetsec" data-id="video">Reset video</button>`;
    } else {
      rows = rRange('audio.master', 'Master volume', 0, 100, 1)
        + rRange('audio.music', 'Music', 0, 100, 1)
        + rRange('audio.sfx', 'Sound effects', 0, 100, 1)
        + rRange('audio.ambience', 'Ambience', 0, 100, 1)
        + rSel('audio.ambType', 'Background ambience', [['off', 'None'], ['fire', 'Hearth rumble'], ['rain', 'Rain on the window'], ['night', 'Summer night']], 'An optional layer under the music. Off by default.')
        + rTog('audio.steps', 'Footsteps', 'A soft step sound while you walk. Off by default.')
        + rTog('audio.muteUnfocused', 'Mute when the window is in the background');
      foot = `<button class="btn small" data-act="testsound">Test sound</button>
        <button class="btn small" data-act="resetsec" data-id="audio">Reset audio</button>`;
    }
    return `<div class="panel screen">${header('Settings')}<div class="body"><div class="set-wrap">
      <div class="set-tabs">${tabs}</div>
      <div><div class="set-list">${rows}</div><div class="set-foot">${foot}</div></div>
    </div></div></div>`;
  }

  function applyVideo() {
    const v = TH.Settings.video;
    const base = Math.min(window.innerWidth / 1600, window.innerHeight / 900) * 16 * v.uiScale / 100;
    document.documentElement.style.fontSize = TH.clamp(base, 8, 34) + 'px';
    document.body.classList.toggle('reduce', v.reduceMotion);
    $('#fps').classList.toggle('hidden', !v.showFps);
    $('#cross').classList.toggle('hidden', !TH.Settings.game.crosshair);
    G.applyVideo();
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
    if (path.startsWith('video') || path.startsWith('game')) { applyVideo(); if (path === 'video' || path === 'video.mode' || path === 'video.res') applyMode(); }
    if (path.startsWith('audio')) TH.Audio.apply();
    if (inGame()) { hudBuild(); UI.hud(); }
  }

  // ---------- dialogs ----------
  function openModal(kind, html) {
    modalKind = kind;
    const m = $('#modal'); m.innerHTML = html; m.classList.remove('hidden');
    // a confirmation opens on Cancel, so a stray Enter can never erase anything
    const f = kind === 'confirm' ? m.querySelector('[data-act="no"]') : m.querySelector('.btn.primary, .btn'); if (f) f.focus({ preventScroll: true });
  }
  function closeModal() {
    modalKind = ''; const m = $('#modal'); m.classList.add('hidden'); m.innerHTML = '';
    if (installLate && screen === 'title') { installLate = false; UI.show('title', true); }     // the install offer arrived while a dialog was open
  }
  UI.confirm = (title, text, yes, cb) => {
    UI._yes = cb; UI._from = modalKind;
    openModal('confirm', `<div class="panel dialog"><h2>${title}</h2><p>${text}</p>
      <div class="btns rowed"><button class="btn danger" data-act="yes">${yes}</button><button class="btn" data-act="no">Cancel</button></div></div>`);
  };
  function pauseMenu() {
    G.pause(true);
    const w = TH.WINGS[G.wing()];
    openModal('pause', `<div class="panel dialog"><h2>Paused</h2><p>${esc(w.name)} · ${TH.shelvedCount()} of ${NB} books shelved. No timer, no rush. Your progress saves by itself.</p>
      <div class="btns">
        <button class="btn primary" data-act="resume">${ico('play')} Resume</button>
        <button class="btn" data-act="go" data-to="catalog">${ico('book')} Card Catalogue</button>
        <button class="btn" data-act="go" data-to="shop">${ico('bag')} Shop</button>
        <button class="btn" data-act="go" data-to="ach">${ico('trophy')} Achievements</button>
        <button class="btn" data-act="go" data-to="settings">${ico('gear')} Settings</button>
        <button class="btn" data-act="help">How to Play</button>
        <button class="btn" data-act="totitle">${ico('home')} Save and quit to menu</button>
      </div></div>`);
  }
  let lastAuto = 0;
  UI.autoPause = () => { if (inGame() && !modalKind) { lastAuto = performance.now(); pauseMenu(); } };
  function resume() { closeModal(); G.pause(false); G.lock(); UI.hud(); UI.lockHint(); }
  function helpDialog() {
    const k = keys();
    UI._from = modalKind;
    openModal('help', `<div class="panel dialog help"><h2>How to Play</h2>
      <ul>
        <li><b>Walk the library.</b> Look with the mouse, move with <b>${esc(keyName(k.forward))} ${esc(keyName(k.left))} ${esc(keyName(k.back))} ${esc(keyName(k.right))}</b>, hold <b>${esc(keyName(k.run))}</b> to run.</li>
        <li><b>Pick books up.</b> They are scattered all over the floor: point at one and click. Every book of a series is the same colour. Right-click (or <b>${esc(keyName(k.grab))}</b>) gathers the nearby books of the same section.</li>
        <li><b>Put books down.</b> Press <b>${esc(keyName(k.drop))}</b> to drop the last book you picked up, on the floor or on a table. Changed your mind about a shelved book? Click it with empty hands (or right-click it) to take it back down.</li>
        <li><b>Shelve them.</b> Each bookcase is one section (its name is on top). Each shelf is one series. Point at the right shelf and click — the book slides into its place in volume order.</li>
        <li><b>Read anything.</b> Point at any book, on the floor or on a shelf, and press <b>${esc(keyName(k.read))}</b> to open it. Each series is one story told across its twelve volumes, so a finished shelf reads from start to end.</li>
        <li><b>Keep a streak.</b> Clicking a shelf where nothing you carry belongs breaks your streak. A longer streak pays more coins per book. There is no timer and you can never fail.</li>
        <li><b>Finish rows</b> to unlock knacks (keys <b>${esc(keyName(k.ability1))} ${esc(keyName(k.ability2))} ${esc(keyName(k.ability3))} ${esc(keyName(k.ability4))}</b>). Shelve ${Math.round(TH.GATE_AT * 100)}% of a room to open the door to the next.</li>
        <li><b>Spend coins</b> in the Shop on knack upgrades, a bigger book strap, faster slippers and new lighting moods. Keep an eye out for gilded books and lost bookmarks.</li>
      </ul>
      <div class="btns"><button class="btn primary" data-act="closehelp">Got it</button></div></div>`);
  }
  // ---------- the reader ----------
  // A book can be opened if you can lay hands on it: it is shelved, in your arms, or the one you just pointed at.
  const canOpen = (id) => !!S().shelved[id] || (inGame() && G.held.includes(id)) || id === UI._bookFirst;
  UI.openBook = (id) => {
    const b = TH.BOOKS[id], se = TH.SERIES[b.series], cat = TH.CATS[b.cat], story = TH.STORIES && TH.STORIES[se.id] && TH.STORIES[se.id][b.vol];
    if (modalKind !== 'book') { UI._bookFrom = modalKind; UI._bookFirst = id; if (inGame() && !G.paused) G.pause(true); }
    if (!S().read[id]) { S().read[id] = 1; TH.Save.commit(); TH.checkAch(); }
    const title = story ? story[0] : 'Faded Pages', text = story ? story[1] : 'The ink on these pages has faded past reading. Perhaps the next volume has fared better.';
    const verse = cat.name === 'Poetry';
    const paras = text.split(/\n\s*\n/).map((p) => `<p${!verse && p.includes('\n') ? ' class="lines"' : ''}>${esc(p)}</p>`).join('');
    const nav = (d) => {
      const v = b.vol + d;
      if (v < 0 || v >= TH.VOLS) return `<span class="rnav"></span>`;
      const nid = se.books[v], ok = canOpen(nid);
      return `<button class="btn small rnav ${ok ? '' : 'off'}" ${ok ? `data-act="readbook" data-id="${nid}"` : 'disabled title="You have not found this volume yet"'}>${d < 0 ? '‹ ' : ''}${ok ? '' : ico('lock') + ' '}Vol. ${TH.ROMAN[v]}${d > 0 ? ' ›' : ''}</button>`;
    };
    modalKind = 'book';
    const m = $('#modal');
    m.innerHTML = `<div class="reader${b.gold ? ' gilded' : ''}" style="--cover:${se.color}">
      <div class="spread">
        <div class="page left"><small>${esc(cat.name)}</small><h2>${esc(se.name)}</h2><div class="orn"></div>
          <p class="vol">Volume ${TH.ROMAN[b.vol]}</p><h3>${esc(title)}</h3><p class="lib">${b.gold ? 'Gilded edition · ' : ''}Emberwick Library</p></div>
        <div class="page right ${verse ? 'verse' : ''}"><div class="text">${paras}</div><div class="folio">— ${TH.ROMAN[b.vol]} —</div></div>
      </div>
      <div class="reader-bar">${nav(-1)}<button class="btn small primary" data-act="closebook">Close the book · ${esc(keyName(keys().read))}</button>${nav(1)}</div>
    </div>`;
    m.classList.remove('hidden');
    TH.Audio.play('pick');
  };
  function closeBook() {
    const from = UI._bookFrom || '';
    UI._bookFirst = -1;
    if (from.startsWith('view:')) { modalKind = ''; UI.show(from.slice(5), true); }
    else if (from === 'pause') pauseMenu();
    else if (inGame()) resume();
    else { closeModal(); if (screen === 'catalog') redraw(); }      // show the new 'read' dot
  }
  UI.finale = () => {
    if (!inGame()) return;
    S().finaleShown = 1; TH.Save.commit();
    G.pause(true);
    const s = S().stats;
    const row = (a, b) => `<span>${a}</span><b>${b}</b>`;
    openModal('finale', `<div class="panel dialog"><h2>The library is in order</h2>
      <p>Every one of the ${NB.toLocaleString('en-US')} books is back where it belongs. Somewhere, a very old librarian is smiling.</p>
      <div class="tally">
        ${row('Books shelved, all time', fmt(s.placed))}
        ${row('Best streak', '×' + s.bestStreak)}
        ${row('Distance walked', (s.metres / 1000).toFixed(2) + ' km')}
        ${row('Time in the library', TH.time(s.playTime))}
        ${row('Gilded books', s.golds)}
        ${row('Lost bookmarks', Object.keys(S().marks).length + '/20')}
      </div>
      <div class="btns">
        <button class="btn primary" data-act="resume">${ico('play')} Keep wandering</button>
        <button class="btn" data-act="reshuffle">${ico('retry')} Reshuffle and tidy it again</button>
        <button class="btn" data-act="totitle">${ico('home')} Back to menu</button>
      </div></div>`);
  };

  // ---------- HUD ----------
  function hudBuild() {
    $('#hud-abil').innerHTML = TH.ABIL.map((a, i) => {
      const open = TH.abilUnlocked(a);
      const tip = open ? `${a.name} (level ${S().abil[a.id]}) — ${a.desc(TH.abilVal(a))}` : `${a.name} — unlocks after ${a.unlock} finished rows`;
      return `<button class="abil ${open ? '' : 'lock'}" data-act="abil" data-i="${i}" title="${esc(tip)}">
        <span class="fill"></span><span class="key">${esc(keyName(keys()[a.bind]))}</span>${ico(open ? a.icon : 'lock')}
        <span class="lbl">${open ? esc(a.short) : a.unlock + ' rows'}</span></button>`;
    }).join('');
  }
  UI.hudBuild = hudBuild;
  function heldList() {
    const el = $('#held'), a = G.aim, fits = a && a.type === 'row' ? a.fits : [];
    if (!G.held.length) { el.innerHTML = `<div class="held-h">Hands empty · room for ${TH.upgVal('satchel')}</div>`; return; }
    el.innerHTML = `<div class="held-h">Carrying ${G.held.length}/${TH.upgVal('satchel')}</div>` + G.held.map((id) => {
      const b = TH.BOOKS[id], se = TH.SERIES[b.series];
      return `<div class="hb ${fits.includes(id) ? 'fit' : ''}"><i class="${b.gold ? 'gilt' : ''}" style="background:${se.color}"></i><span><b>${esc(se.name)} ${TH.ROMAN[b.vol]}</b><small>${esc(TH.CATS[b.cat].name)}</small></span></div>`;
    }).join('');
  }
  UI.hud = () => {
    if (!inGame()) return;
    $('#hud').classList.remove('hidden');
    const s = S(), w = G.wing(), wg = TH.WINGS[w], n = TH.shelvedCount(w), total = TH.shelvedCount();
    $('#hud-name').textContent = wg.name;
    const gateOpen = w === TH.WINGS.length - 1 || s.gates[w];
    $('#hud-hint').textContent = n === wg.books ? 'Room complete' : gateOpen ? `${n} of ${wg.books} shelved here` : `${n} of ${wg.books} · next door opens at ${Math.ceil(wg.books * TH.GATE_AT)}`;
    $('#hud-bar').style.width = (n / wg.books * 100) + '%';
    $('#hud-count').textContent = total + '/' + NB;
    const cb = $('#hud-combo');
    cb.firstElementChild.textContent = '×' + G.streak;
    cb.classList.toggle('hot', G.streak >= 10);
    if (G.streak > lastStreak && !TH.Settings.video.reduceMotion) { cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
    lastStreak = G.streak;
    $('#hud-coins').textContent = fmt(s.coins);
    const fx = [];
    if (G.fx.golden > 0) fx.push(`<div class="chip fx">${ico('sun')} Double coins ×${G.fx.golden}</div>`);
    if (G.fx.way > 0) fx.push(`<div class="chip fx">${ico('lantern')} Wayfinder ${Math.ceil(G.fx.way)}s</div>`);
    $('#hud-fx').innerHTML = fx.join('');
    document.querySelectorAll('#hud-abil .abil').forEach((el, i) => {
      const a = TH.ABIL[i]; if (!TH.abilUnlocked(a)) return;
      const p = Math.min(1, (s.charge[a.id] || 0) / a.need);
      el.querySelector('.fill').style.height = (p * 100) + '%';
      el.classList.toggle('ready', p >= 1);
    });
    heldList();
  };
  UI.target = (title, hint, tone) => {
    const el = $('#target');
    el.classList.toggle('hidden', !title || !TH.Settings.game.names);
    el.className = el.className.replace(/ ?(good|warn)/g, '') + (tone ? ' ' + tone : '');
    el.firstElementChild.textContent = title; el.lastElementChild.textContent = hint;
    heldList();
  };
  UI.flash = (text, tone) => {
    const el = $('#flash'); el.textContent = text; el.className = tone || '';
    clearTimeout(flashTimer); flashTimer = setTimeout(() => el.classList.add('hidden'), 1900);
  };
  UI.banner = (title, sub) => {
    const el = $('#banner'); el.firstElementChild.textContent = title; el.lastElementChild.textContent = sub || '';
    el.classList.remove('hidden'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => el.classList.add('hidden'), 3600);
  };
  UI.lockHint = () => $('#lockhint').classList.toggle('hidden', !(inGame() && !G.paused && !G.locked && !modalKind) || !!G.touch);
  UI.fps = (n) => { if (TH.Settings.video.showFps) $('#fps').textContent = n + ' FPS'; };

  function hideTip() { clearTimeout(tipTimer); $('#tip').classList.add('hidden'); }
  UI.tip = (id, text) => {
    if (!TH.Settings.game.tips || S().tips[id]) return;
    S().tips[id] = 1; TH.Save.commit();
    const t = $('#tip'); t.textContent = text; t.classList.remove('hidden');
    clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 9000);
  };
  UI.toast = (kind, title, sub) => {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${ico(kind === 'ach' ? 'trophy' : 'star')}<div><small>${kind === 'ach' ? 'Achievement unlocked' : 'The Night Shelver'}</small><b>${esc(title)}</b>${sub ? `<i>${esc(sub)}</i>` : ''}</div>`;
    const box = $('#toasts');
    while (box.children.length >= 3) box.firstElementChild.remove();
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 4200);
    setTimeout(() => el.remove(), 4600);
  };

  // ---------- flow ----------
  function enterGame() {
    closeModal();
    $('#screens').innerHTML = ''; screen = 'game';
    G.enter();
    hudBuild(); UI.hud(); G.lock(); UI.lockHint();
  }
  function toTitle() { closeModal(); G.stop(); $('#hud').classList.add('hidden'); UI.show('title'); }
  function togglePause() {
    if (!inGame()) return;
    if (modalKind === 'pause') resume();
    else if (!modalKind) pauseMenu();
  }
  function goBack() {
    if (rebinding) { rebinding = null; redraw(); return; }
    if (modalKind === 'book') return closeBook();
    if (modalKind === 'help') return act.closehelp();
    if (modalKind === 'confirm') return act.no();
    if (modalKind === 'finale') return;
    if (modalKind.startsWith('view:')) return pauseMenu();
    if (inGame()) return togglePause();
    if (screen !== 'title') UI.show('title');
  }
  function bought() { TH.Save.flush(); TH.Audio.play('buy'); TH.checkAch(); G.applyVideo(); redraw(); }

  const act = {
    go: (el) => UI.show(el.dataset.to),
    back: () => goBack(),
    enter: () => enterGame(),
    pause: () => togglePause(),
    read: () => G.read(),
    readbook: (el) => UI.openBook(+el.dataset.id),
    closebook: () => closeBook(),
    resume: () => resume(),
    totitle: () => toTitle(),
    help: () => helpDialog(),
    closehelp: () => { if (UI._from === 'pause') pauseMenu(); else closeModal(); },
    abil: (el) => G.useAbility(+el.dataset.i),
    quit: () => { TH.Save.flush(); if (TH.desktop) TH.desktop.quit(); },
    install: () => { const ev = installEvent; if (!ev) return; installEvent = null; ev.prompt(); if (screen === 'title') UI.show('title', true); },
    catwing: (el) => { catWing = +el.dataset.id; redraw(); },
    shoptab: (el) => { shopTab = el.dataset.id; redraw(); },
    settab: (el) => { setTab = el.dataset.id; rebinding = null; redraw(); },
    toggle: (el) => { const p = el.dataset.path; setPath(p, !getPath(p)); settingChanged(p); redraw(); },
    rebind: (el) => { rebinding = rebinding === el.dataset.id ? null : el.dataset.id; redraw(); },
    resetsec: (el) => { TH.resetSettings(el.dataset.id); settingChanged(el.dataset.id); redraw(); },
    resettips: () => { S().tips = {}; TH.Save.commit(); UI.toast('info', 'Tips reset', 'Hints will show again.'); },
    testsound: () => { TH.Audio.play('bin'); },
    drop: () => G.drop(),
    savefile: () => {
      G.sync(true);
      const a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(S())], { type: 'application/json' }));
      a.href = url; a.download = 'night-shelver-save.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      UI.toast('info', 'Progress saved to a file', 'night-shelver-save.json');
    },
    loadfile: () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          let d = null; try { d = JSON.parse(r.result); } catch (e) { /* not a save */ }
          if (!TH.Save.valid(d)) { UI.toast('info', 'That is not a Night Shelver save file'); return; }
          UI.confirm('Load this save?', `It has ${d.shelved.filter(Boolean).length} of ${NB} books shelved and ${fmt(d.coins)} coins. It replaces the progress on this device.`, 'Load it', () => {
            closeModal(); if (inGame()) G.stop(); TH.Save.replace(d); G.rebuild(); G.applyVideo(); $('#hud').classList.add('hidden'); UI.show('title');
            UI.toast('info', 'Progress loaded');
          });
        };
        r.readAsText(f);
      };
      inp.click();
    },
    reshuffle: () => UI.confirm('Reshuffle the library?', 'Every book goes back onto the floor and the doors lock again. You keep your coins, upgrades, knacks and achievements.', 'Reshuffle', () => {
      const playing = inGame(); G.reshuffle(); closeModal();
      if (playing) enterGame(); else { G.rebuild(); UI.show('title'); }
    }),
    wipe: () => UI.confirm('Erase everything?', 'This deletes every shelved book, your coins, upgrades and achievements. It cannot be undone.', 'Erase', () => {
      closeModal(); if (inGame()) G.stop(); TH.Save.reset(); G.rebuild(); G.applyVideo(); $('#hud').classList.add('hidden'); UI.show('title');
    }),
    yes: () => { const cb = UI._yes; UI._yes = null; if (cb) cb(); else closeModal(); },
    no: () => { const from = UI._from || ''; if (from.startsWith('view:')) { closeModal(); UI.show(from.slice(5)); } else if (from === 'finale') UI.finale(); else closeModal(); },
    upgrade: (el) => {
      const a = TH.ABIL.find((x) => x.id === el.dataset.id), lvl = S().abil[a.id];
      if (lvl >= 3 || !TH.Save.spend(TH.UPGRADE_COST[lvl - 1])) return TH.Audio.play('deny');
      S().abil[a.id] = lvl + 1; bought();
    },
    buygear: (el) => {
      const u = TH.UPG.find((x) => x.id === el.dataset.id), lvl = S().upg[u.id] || 0;
      if (lvl >= u.vals.length - 1 || !TH.Save.spend(u.cost[lvl])) return TH.Audio.play('deny');
      S().upg[u.id] = lvl + 1; bought();
    },
    buymood: (el) => {
      const m = TH.MOODS.find((x) => x.id === el.dataset.id);
      if (S().moods.includes(m.id) || !TH.Save.spend(m.cost)) return TH.Audio.play('deny');
      S().moods.push(m.id); S().mood = m.id; bought();
    },
    usemood: (el) => { S().mood = el.dataset.id; TH.Save.commit(); G.applyVideo(); redraw(); }
  };

  // ---------- events ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    TH.Audio.init();
    if (!el.classList.contains('abil')) TH.Audio.play('click');
    const fn = act[el.dataset.act];
    if (fn) fn(el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.path === 'video.uiScale') { settingChanged('video.uiScale'); return; }      // applied on release, see below
    if (!el.dataset || !el.dataset.path || el.tagName !== 'SELECT') return;
    const cur = getPath(el.dataset.path);
    setPath(el.dataset.path, typeof cur === 'number' ? Number(el.value) : el.value);
    settingChanged(el.dataset.path); redraw();
  });
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.type !== 'range' || !el.dataset.path) return;
    setPath(el.dataset.path, Number(el.value));
    el.nextElementSibling.textContent = el.value + el.dataset.unit;
    if (el.dataset.path === 'video.uiScale') return;      // resizing the page under the pointer mid-drag makes the slider jitter
    settingChanged(el.dataset.path);
  });
  let lastHover = null;
  document.addEventListener('mouseover', (e) => {
    const b = e.target.closest('.btn, .tab');
    if (b && b !== lastHover) TH.Audio.play('hover');
    lastHover = b;
  });
  const MOVE = { forward: 1, back: 1, left: 1, right: 1, run: 1 };
  document.addEventListener('keydown', (e) => {
    TH.Audio.init();
    if (rebinding) {
      e.preventDefault();
      if (e.code !== 'Escape') {
        const k = keys(), other = Object.keys(k).find((a) => k[a] === e.code && a !== rebinding);
        if (other) k[other] = k[rebinding];          // swap so nothing ends up unbound
        k[rebinding] = e.code; TH.saveSettings();
      }
      rebinding = null; redraw();
      if (inGame()) hudBuild();
      return;
    }
    if (e.code === 'Escape') { if (!e.repeat && performance.now() - lastAuto > 400) goBack(); return; }
    const k = keys(), a = Object.keys(k).find((x) => k[x] === e.code);
    if (!a) return;
    const playing = inGame() && !G.paused && !modalKind;
    if (MOVE[a]) { if (playing) { G.keys[a] = true; e.preventDefault(); } return; }
    if (e.repeat) return;
    const typing = e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT');
    if (a === 'fullscreen') {
      e.preventDefault();
      if (TH.Settings.video.mode === 'fullscreen') TH.Settings.video.mode = UI._windowMode || 'windowed';
      else { UI._windowMode = TH.Settings.video.mode; TH.Settings.video.mode = 'fullscreen'; }
      settingChanged('video.mode');
      if (currentView() === 'settings') redraw();
    } else if (typing) return;
    else if (a === 'pause') { e.preventDefault(); togglePause(); }
    else if (a === 'mute') UI.toast('info', TH.Audio.toggleMute() ? 'Sound muted' : 'Sound on');
    else if (a === 'read' && modalKind === 'book') closeBook();
    else if (playing) {
      if (a === 'interact') G.interact();
      else if (a === 'read') G.read();
      else if (a === 'grab') G.grabAll();
      else if (a === 'drop') G.drop();
      else if (a.startsWith('ability')) G.useAbility(+a.slice(7) - 1);
    }
  });
  document.addEventListener('keyup', (e) => {
    const k = keys(), a = Object.keys(k).find((x) => k[x] === e.code);
    if (a && MOVE[a]) G.keys[a] = false;
  });
  window.addEventListener('resize', applyVideo);
  window.addEventListener('blur', () => TH.Audio.setFocus(false));
  window.addEventListener('focus', () => TH.Audio.setFocus(true));
  document.addEventListener('fullscreenchange', () => {
    if (TH.desktop) return;
    const on = !!document.fullscreenElement;
    if ((TH.Settings.video.mode === 'fullscreen') !== on) { TH.Settings.video.mode = on ? 'fullscreen' : 'windowed'; TH.saveSettings(); if (currentView() === 'settings') redraw(); }
  });
  if (TH.desktop) {
    TH.desktop.onFullscreen((on) => {
      const m = TH.Settings.video.mode;
      if (on && m !== 'fullscreen') TH.Settings.video.mode = 'fullscreen';
      else if (!on && m === 'fullscreen') TH.Settings.video.mode = 'windowed';
      else return;
      TH.saveSettings(); if (currentView() === 'settings') redraw();
    });
  }

  // ---------- web version: installable, and playable offline ----------
  // Chrome and Edge offer to install the site as an app; we keep their offer and show our own button for it.
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; if (screen === 'title' && !modalKind) UI.show('title', true); else installLate = true; });
  window.addEventListener('appinstalled', () => { installEvent = null; if (screen === 'title' && !modalKind) UI.show('title', true); UI.toast('info', 'Installed', 'The Night Shelver is now an app on this computer.'); });
  if (!TH.desktop && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && document.querySelector('link[rel="manifest"]')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // ---------- boot ----------
  document.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = ico(el.dataset.icon); });
  G.init($('#cv'));
  applyVideo();
  applyMode();
  UI.show('title');
})();
