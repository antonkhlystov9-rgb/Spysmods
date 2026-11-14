// Headless smoke test: boots the game in Chromium, plays it through its real pick/shelve code, and checks for errors.
// Usage: node tools/smoke-test.js [screenshot-dir]     (needs Playwright; set QUICK=1 to stop after the hands-on part)
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const shots = process.argv[2];
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  // No mouse capture here: a captured mouse turns every pointer move the test makes into a look, which makes aiming a matter of luck.
  // Without it the game falls back to drag-to-look, which is what the checks below drive.
  await page.addInitScript(() => { HTMLCanvasElement.prototype.requestPointerLock = undefined; });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
  const assert = (ok, msg) => { if (!ok) { errors.push('assert: ' + msg); console.log('FAIL', msg); } else console.log('ok  ', msg); };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const wait = (ms) => page.waitForTimeout(ms);
  // software rendering is slow, so wait on game state rather than the clock
  const frames = (n = 3) => ev((k) => new Promise((res) => { let i = 0; const f = () => (++i >= k ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const landed = async () => { for (let i = 0; i < 400; i++) { if (!(await ev(() => TH.Game.debug.busy() || TH.Game.debug.books.some((b) => b.st === 'fly')))) break; await wait(100); } await frames(2); };

  page.setDefaultTimeout(180000);            // software rendering can take most of a minute to build the library
  await page.goto('file://' + path.resolve(__dirname, '..', 'src', 'index.html'));
  await wait(900);
  const info = await ev(() => ({ books: TH.BOOKS.length, series: TH.SERIES.length, cats: TH.CATS.length, titles: new Set(TH.BOOKS.map(TH.bookTitle)).size, names: new Set(TH.SERIES.map((s) => s.name)).size, ach: TH.ACH.length, pre: TH.shelvedCount() }));
  console.log(info);
  assert(info.books === 1152 && info.titles === 1152, '1,152 books with unique titles');
  assert(info.series === 96 && info.names === 96 && info.cats === 24, '96 series in 24 sections');
  assert(info.pre === 0, 'a new library starts with nothing on the shelves');
  const lay = await ev(() => { const D = TH.Game.debug; let floor = 0, high = 0, apart = 0; const per = D.loose.map((l) => l.length);
    for (const l of D.loose) for (const b of l) { if (b.base < 0.1) floor++; if (b.top > 0.4) high++; if (!l.some((o) => o !== b && Math.hypot(o.lx - b.lx, o.lz - b.lz) < 0.27)) apart++; }
    return { per, floor, high, apart }; });
  console.log(lay);
  assert(lay.per.every((n) => n === 288) && lay.floor === 1152, 'all 1,152 books start on the floor, 288 in each room');
  assert(lay.high === 0 && lay.apart > 700, 'they are scattered, not stacked (' + lay.apart + ' lie on their own, tallest heap under 40 cm)');
  const st = await ev(() => { let n = 0, short = 0, words = 0; (TH.STORIES || []).forEach((se) => (se || []).forEach((v) => { n++; const w = v[1].trim().split(/\s+/).length; words += w; if (w < 50 || !v[0]) short++; })); return { n, short, words }; });
  assert(st.n === 1152 && st.short === 0, 'every one of the 1,152 books has a page to read (' + st.n + ' pages, ' + st.words + ' words)');
  await shot('01-title');

  await page.click('[data-act="enter"]'); await wait(700);
  assert(await ev(() => TH.Game.mode === 'play'), 'game starts');

  // --- walking and looking (no mouse capture in headless, so right-drag looks) ---
  const p0 = await ev(() => { const D = TH.Game.debug; D.stand(0.8, 1.0); D.lookAt(6, 1.62, 1.0); return { x: D.P.x, yaw: D.P.yaw }; });
  await page.keyboard.down('KeyW'); await frames(4); await page.keyboard.up('KeyW');
  const p1 = await ev(() => TH.Game.debug.P.x);
  assert(p1 > p0.x + 0.5, 'W walks forward (' + (p1 - p0.x).toFixed(2) + ' m)');
  await page.keyboard.down('KeyA'); await frames(40); await page.keyboard.up('KeyA');
  assert(await ev(() => TH.Game.debug.P.z > -4 && TH.Game.debug.P.z < 4), 'walls stop you');
  await page.mouse.move(800, 450); await page.mouse.down({ button: 'right' }); await page.mouse.move(900, 450, { steps: 4 }); await page.mouse.up({ button: 'right' }); await frames();
  assert(await ev((y) => TH.Game.debug.P.yaw !== y, p0.yaw), 'mouse turns the view');

  // --- pick up a real book by aiming at it ---
  const aimAt = (id) => ev((i) => { const D = TH.Game.debug, b = D.books[i]; D.stand(b.pos.x - 0.35, b.pos.z + 0.3); D.lookAt(b.pos.x, b.pos.y, b.pos.z); }, id);
  // a book with nothing lying on it
  const clear = (w, skip) => ev(([w, skip]) => { const l = TH.Game.debug.loose[w]; for (let i = l.length - 1; i >= 0; i--) { const b = l[i]; if (!skip.includes(b.id) && b.base < 0.1 && !l.slice(i + 1).some((o) => Math.hypot(o.lx - b.lx, o.lz - b.lz) < 0.3)) return b.id; } return -1; }, [w, skip || []]);
  const first = await clear(0);
  await aimAt(first); await frames(); await shot('02-aim-floor');
  assert(await ev((id) => TH.Game.aim && TH.Game.aim.type === 'pile' && TH.Game.aim.book.id === id, first), 'crosshair finds a book lying on the floor');
  await page.mouse.down(); await page.mouse.up(); await frames();   // a real left click on the canvas
  const held = await ev(() => TH.Game.held.slice());
  assert(held.length === 1 && held[0] === first, 'clicking picks the book up');

  // --- put it down on a table, pick it up again, drop another on the floor ---
  await ev(() => { const D = TH.Game.debug, t = D.tables.find((x) => x.wing === 0); D.stand(t.x, t.z + 1.0); D.lookAt(t.x, t.top, t.z); });
  await frames(); await page.keyboard.press('KeyQ'); await landed(); await shot('02b-on-table');
  assert(await ev((id) => { const D = TH.Game.debug, b = D.books[id], t = D.tables.find((x) => x.wing === 0); return TH.Game.held.length === 0 && b.st === 'loose' && b.base === t.top && Math.abs(b.pos.y - (t.top + b.se.t / 2)) < 0.002 && Math.abs(b.lx - t.x) < 0.7; }, first), 'Q puts the book down on the table you are looking at');
  await page.keyboard.press('KeyQ'); await frames();
  assert(await ev(() => TH.Game.held.length === 0), 'Q with empty hands does nothing');
  await ev((id) => { const D = TH.Game.debug, b = D.books[id]; D.stand(b.pos.x, b.pos.z + 0.8); D.lookAt(b.pos.x, b.pos.y, b.pos.z); }, first);
  await frames(); await page.mouse.down(); await page.mouse.up(); await frames();
  assert(await ev((id) => TH.Game.held.length === 1 && TH.Game.held[0] === id, first), 'and it can be picked up off the table again');
  const second = await clear(0, [first]);
  await aimAt(second); await frames(); await page.mouse.down(); await page.mouse.up(); await frames();
  await ev(() => { const D = TH.Game.debug; D.stand(1.0, 0); D.lookAt(1.5, 0, 0.2); });
  await frames(); await page.keyboard.press('KeyQ'); await landed();
  assert(await ev(([a, b]) => { const D = TH.Game.debug, x = D.books[b]; return TH.Game.held.length === 1 && TH.Game.held[0] === a && x.st === 'loose' && Math.hypot(x.lx - 1.5, x.lz - 0.2) < 0.3 && x.pos.y < 0.5; }, [first, second]), 'the last book picked up is the one dropped, where you look on the floor');

  // --- closing the game right now loses nothing: every loose book, the one in your hand, and where you stand ---
  const before = await ev(() => { const D = TH.Game.debug; return { pos: D.books.map((b) => (b.st === 'loose' ? [b.lx, b.lz, b.base > 0.1] : null)), x: D.P.x, z: D.P.z }; });
  await page.reload({ timeout: 180000 }); await wait(900);
  const same = await ev((bf) => { const D = TH.Game.debug; let bad = 0; D.books.forEach((b, i) => { const p = bf.pos[i]; if (!p) { if (b.st === 'loose') bad++; return; } if (b.st !== 'loose' || Math.abs(b.lx - p[0]) > 0.002 || Math.abs(b.lz - p[1]) > 0.002 || (b.base > 0.1) !== p[2]) bad++; }); return bad; }, before);
  assert(same === 0, 'after closing and reopening, every loose book lies exactly where it was left');
  await page.click('[data-act="enter"]'); await wait(700);
  assert(await ev(([id, bf]) => TH.Game.held.length === 1 && TH.Game.held[0] === id && Math.abs(TH.Game.debug.P.x - bf.x) < 0.02 && Math.abs(TH.Game.debug.P.z - bf.z) < 0.02, [first, before]), 'you are still carrying the same book and standing in the same spot');

  // wrong shelf first, then the right one
  await ev((id) => { const D = TH.Game.debug, b = D.books[id], cs = D.cases.find((c) => c.wing === 0 && c.id !== b.def.cat), r = cs.rows[1]; D.stand(cs.x, cs.z + cs.s * 1.6); D.lookAt(cs.x, r.y + 0.2, cs.z); }, held[0]);
  await frames(); await ev(() => TH.Game.interact());
  assert(await ev(() => TH.Save.data.stats.mistakes === 1 && TH.Game.held.length === 1), 'a wrong shelf counts as a mistake and keeps the book ' + await ev(() => JSON.stringify([TH.Save.data.stats.mistakes, TH.Game.held, TH.Game.aim && TH.Game.aim.type, TH.Game.paused, TH.Game.locked, TH.Game.debug.P])));
  await ev((id) => { const D = TH.Game.debug, s = D.slot(id), cs = D.cases[D.books[id].def.cat]; D.stand(s.x + 0.4, cs.z + cs.s * 1.6); D.lookAt(s.x, s.y, s.z); }, held[0]);
  await frames(); await shot('03-aim-shelf');
  assert(await ev(() => TH.Game.aim && TH.Game.aim.type === 'row' && TH.Game.aim.cand >= 0), 'the right shelf offers to take the book');
  await ev(() => TH.Game.interact()); await landed();
  assert(await ev((id) => { const D = TH.Game.debug, b = D.books[id], s = D.slot(id); return b.st === 'shelf' && b.pos.distanceTo(s) < 0.001 && TH.Save.data.shelved[id] === 1 && TH.Game.held.length === 0; }, held[0]), 'the book lands in its exact slot');

  // --- reading: point at the shelved book and open it ---
  await ev((id) => { const D = TH.Game.debug, s = D.slot(id), cs = D.cases[D.books[id].def.cat]; D.stand(s.x, cs.z + cs.s * 1.4); D.lookAt(s.x, s.y, s.z); }, held[0]);
  await frames();
  assert(await ev((id) => TH.Game.aim && TH.Game.aim.type === 'row' && TH.Game.aim.book && TH.Game.aim.book.id === id, held[0]), 'crosshair picks out a single book on a shelf');
  await page.keyboard.press('KeyR'); await wait(400); await shot('03b-reading');
  const rd = await ev((id) => { const b = TH.BOOKS[id], se = TH.SERIES[b.series], el = document.querySelector('#modal .reader'); return el ? { h2: el.querySelector('h2').textContent === se.name, h3: el.querySelector('h3').textContent === TH.STORIES[se.id][b.vol][0], text: el.querySelector('.text').textContent.length, paused: TH.Game.paused, read: TH.Save.data.read[id] } : null; }, held[0]);
  assert(rd && rd.h2 && rd.h3 && rd.text > 300 && rd.paused && rd.read === 1, 'R opens the book with the right title and its page of text');
  await page.keyboard.press('KeyR'); await wait(300);
  assert(await ev(() => !document.querySelector('#modal .reader') && !TH.Game.paused), 'R closes the book and returns to the game');

  // --- take a shelved book back down: it must not pay out a second time ---
  const pay0 = await ev(() => ({ coins: TH.Save.data.coins, placed: TH.Save.data.stats.placed, streak: TH.Game.streak }));
  await page.mouse.down(); await page.mouse.up(); await frames();         // empty hands, pointing at the shelved book
  assert(await ev((id) => TH.Game.held.length === 1 && TH.Game.held[0] === id && TH.Save.data.shelved[id] === 0 && TH.Game.debug.books[id].st === 'held', held[0]), 'clicking a shelved book with empty hands takes it down');
  await ev((id) => { const D = TH.Game.debug, s = D.slot(id), cs = D.cases[D.books[id].def.cat]; D.stand(s.x, cs.z + cs.s * 1.4); D.lookAt(s.x, s.y, s.z); }, held[0]);   // capturing the mouse can nudge the view
  await frames(); await ev(() => TH.Game.interact()); await landed();
  const pay1 = await ev(() => ({ coins: TH.Save.data.coins, placed: TH.Save.data.stats.placed, streak: TH.Game.streak }));
  assert(await ev((id) => TH.Save.data.shelved[id] === 1 && TH.Game.debug.books[id].st === 'shelf', held[0]) && pay1.coins === pay0.coins && pay1.placed === pay0.placed && pay1.streak === pay0.streak, 'putting it back earns nothing the second time ' + JSON.stringify([pay0, pay1]));

  // right-click gathers the nearby loose books of one section
  const seedId = await ev(() => { const l = TH.Game.debug.loose[0]; let best = -1, most = 0; l.forEach((b, i) => { if (l.slice(i + 1).some((o) => Math.hypot(o.lx - b.lx, o.lz - b.lz) < 0.3)) return; const n = l.filter((o) => o.def.cat === b.def.cat && Math.hypot(o.lx - b.lx, o.lz - b.lz) < 0.75).length; if (n > most) { most = n; best = b.id; } }); return best; });
  await aimAt(seedId); await frames(); await ev(() => TH.Game.grabAll()); await frames();
  const got = await ev(() => TH.Game.held.slice());
  assert(got.length >= 2 && got.includes(seedId) && (await ev(() => new Set(TH.Game.held.map((id) => TH.BOOKS[id].cat)).size)) === 1, 'right-click gathers nearby books of one section only (' + got.length + ')');
  await landed(); await shot('04-carrying');
  // holding the button down must never auto-click a wrong shelf
  const rep = await ev(() => { const G = TH.Game, D = G.debug, cat = TH.BOOKS[G.held[0]].cat, cs = D.cases.find((c) => c.wing === 0 && c.id !== cat), r = cs.rows[1]; D.stand(cs.x, cs.z + cs.s * 1.6); D.lookAt(cs.x, r.y + 0.2, cs.z); return TH.Save.data.stats.mistakes; });
  await frames();
  assert(await ev((m) => TH.Game.interact(true) === false && TH.Save.data.stats.mistakes === m, rep), 'hold-to-repeat never counts a wrong shelf');

  if (process.env.QUICK) { await browser.close(); console.log(errors.length ? '\nERRORS:\n' + errors.join('\n') : '\nQuick test passed.'); process.exit(errors.length ? 1 : 0); }

  // lost bookmark
  await ev(() => { const D = TH.Game.debug, m = D.marks[2].group.position; D.stand(m.x + 0.9, m.z - 0.9); D.lookAt(m.x, m.y, m.z); });
  await frames(); await ev(() => TH.Game.interact());
  assert(await ev(() => TH.Save.data.stats.marks === 1), 'lost bookmark can be collected');

  // --- fast-forward: the door opens at 60% ---
  const fast = async (wing, until) => { for (let i = 0; i < 60; i++) { const done = await ev(([w, u]) => { for (let k = 0; k < 12; k++) { if (TH.shelvedCount(w) >= u) return true; if (!TH.Game.debug.auto(w)) return true; } return false; }, [wing, until]); if (done) break; await wait(60); } await landed(); };
  assert(await ev(() => !TH.Game.debug.gates[0].open), 'door to wing 2 starts locked');
  await ev(() => TH.Game.debug.flush()); await landed();
  await fast(0, 175);
  assert(await ev(() => TH.Game.debug.gates[0].open && TH.Save.data.gates[0] === 1), 'door opens at 60% shelved');
  await fast(0, 288); await shot('05-wing-done');
  assert(await ev(() => TH.Save.data.stats.rows === 24 && TH.Save.data.stats.cases === 6 && TH.Save.data.stats.wings === 1), 'rows, bookcases and the wing register as complete');
  await fast(1, 288);
  assert(await ev(() => TH.ABIL.every(TH.abilUnlocked)), 'all four knacks unlock from finished rows');

  // --- knacks, in wing 3 ---
  await ev(() => { const D = TH.Game.debug, cs = D.cases[12], r = cs.rows[2]; for (const a of TH.ABIL) TH.Save.data.charge[a.id] = a.need; D.stand(cs.x, cs.z + cs.s * 1.6); D.lookAt(cs.x, r.y + 0.2, cs.z); });
  await frames(); await page.keyboard.press('Digit1'); await wait(400); await landed();
  const called = await ev(() => TH.Game.held.map((id) => TH.BOOKS[id].cat));
  assert(called.length === 3 && called.every((c) => c === 12), 'Call the Strays pulls 3 books of that section (' + called.length + ')');
  await shot('06-knack');
  await page.keyboard.press('Digit2'); await wait(1500); await landed();
  assert(await ev(() => TH.Game.held.length === 0), 'Tidy Hands shelves what you carry');
  await page.keyboard.press('Digit3'); await page.keyboard.press('Digit4'); await wait(100);
  assert(await ev(() => TH.Game.fx.golden === 12 && TH.Game.fx.way > 30), 'Golden Hour and Wayfinder switch on');

  // --- pause, in-game shop and settings ---
  await page.keyboard.press('KeyP'); await wait(200);
  assert(await ev(() => TH.Game.paused), 'P pauses'); await shot('07-pause');
  await page.click('[data-act="go"][data-to="shop"]'); await wait(150); await shot('08-shop');
  await page.click('[data-act="upgrade"]'); await page.click('[data-act="shoptab"][data-id="gear"]'); await page.click('[data-act="buygear"]'); await wait(100); await shot('09-gear');
  assert(await ev(() => TH.Save.data.abil.gather === 2 && TH.Save.data.upg.satchel === 1 && TH.upgVal('satchel') === 7), 'shop upgrades apply');
  await page.click('[data-act="shoptab"][data-id="mood"]'); await page.click('[data-act="buymood"]'); await wait(100);
  await page.click('[data-act="back"]'); await page.click('[data-act="go"][data-to="settings"]');
  for (const t of ['game', 'controls', 'video', 'audio']) { await page.click(`[data-act="settab"][data-id="${t}"]`); await wait(120); await shot('10-settings-' + t); }
  await page.click('[data-act="settab"][data-id="controls"]'); await page.click('[data-act="rebind"][data-id="grab"]'); await page.keyboard.press('KeyG');
  assert(await ev(() => TH.Settings.controls.keys.grab === 'KeyG'), 'key rebinding works');
  await page.click('[data-act="settab"][data-id="video"]'); await page.selectOption('select[data-path="video.quality"]', 'low'); await wait(300);
  await page.selectOption('select[data-path="video.quality"]', 'high'); await wait(300);
  assert(await ev(() => TH.Settings.video.quality === 'high'), 'graphics quality switches (renderer rebuilt)');
  await page.click('[data-act="back"]'); await page.click('[data-act="go"][data-to="catalog"]'); await wait(150); await shot('11-catalogue');
  await page.click('.vols button'); await wait(300);
  assert(await ev(() => !!document.querySelector('#modal .reader')), 'a shelved book can be read from the Card Catalogue');
  await page.click('.reader-bar .rnav:not(.off)[data-act="readbook"]'); await wait(200);
  await page.click('[data-act="closebook"]'); await wait(200);
  assert(await ev(() => !!document.querySelector('#modal .sects')), 'closing the book returns to the catalogue');
  await page.click('[data-act="back"]'); await page.click('[data-act="go"][data-to="ach"]'); await wait(150); await shot('12-achievements');
  await page.click('[data-act="back"]'); await page.click('[data-act="resume"]'); await wait(300);
  assert(await ev(() => !TH.Game.paused && TH.Game.mode === 'play'), 'resume returns to the game');
  await ev(() => { const D = TH.Game.debug; D.stand(22, 1.2); D.lookAt(28, 1.5, -4); }); await frames(4); await shot('13-morning-mood');

  // --- finish the library ---
  await fast(2, 288); await fast(3, 288); await page.waitForSelector('#modal .dialog .tally', { timeout: 60000 });
  await shot('14-finale');
  assert(await ev(() => TH.shelvedCount() === 1152 && TH.Save.data.stats.cases === 24 && TH.Save.data.stats.rows === 96), 'every book can be shelved (24 bookcases, 96 rows)');
  assert(await page.locator('#modal .dialog h2').innerText() === 'The library is in order', 'finale appears');
  assert(await ev(() => TH.Game.debug.books.every((b) => b.st === 'shelf' && b.pos.distanceTo(TH.Game.debug.slot(b.id)) < 0.001)), 'all books sit in their own slots');

  // --- persistence, reshuffle ---
  await ev(() => TH.Save.flush());
  await page.reload({ timeout: 180000 }); await wait(900);
  assert(await ev(() => TH.shelvedCount() === 1152 && TH.Save.data.upg.satchel === 1 && TH.Settings.controls.keys.grab === 'KeyG'), 'progress and settings persist after reload');
  await page.click('[data-act="go"][data-to="settings"]'); await page.click('[data-act="reshuffle"]'); await page.click('[data-act="yes"]'); await wait(400);
  assert(await ev(() => TH.shelvedCount() === 0 && TH.Game.debug.loose.every((l) => l.length === 288) && TH.Save.data.upg.satchel === 1 && TH.Save.data.stats.rounds === 1), 'reshuffle puts every book back on the floor but keeps upgrades');
  console.log('achievements unlocked:', await ev(() => Object.keys(TH.Save.data.ach).length), '/', info.ach, ' coins earned:', await ev(() => TH.Save.data.stats.earned));

  await browser.close();
  if (errors.length) { console.log('\nERRORS:\n' + errors.join('\n')); process.exit(1); }
  console.log('\nSmoke test passed.');
})().catch((e) => { console.error(e); process.exit(1); });
