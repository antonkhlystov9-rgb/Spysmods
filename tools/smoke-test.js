// Headless smoke test: boots the game in Chromium, plays levels automatically, and checks for errors.
// Usage: node tools/smoke-test.js [screenshot-dir]
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const shots = process.argv[2];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const shot = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
  const assert = (ok, msg) => { if (!ok) { errors.push('assert: ' + msg); console.log('FAIL', msg); } else console.log('ok  ', msg); };

  await page.goto('file://' + path.resolve(__dirname, '..', 'src', 'index.html'));
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => ({ items: TH.ITEM_LIST.length, levels: TH.LEVELS.length, ach: TH.ACH.length, ids: new Set(TH.ITEM_LIST.map((i) => i.id)).size, names: new Set(TH.ITEM_LIST.map((i) => i.name)).size }));
  console.log(info);
  assert(info.items === 480 && info.ids === 480, '480 unique item ids');
  assert(info.names === 480, '480 unique item names');
  assert(info.levels === 44, '44 levels');

  // every item sprite draws without throwing and is not blank
  const blank = await page.evaluate(() => TH.ITEM_LIST.filter((i) => {
    const s = TH.Draw.sprite(i.id, false), d = s.getContext('2d').getImageData(0, 0, s.width, s.height).data;
    let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++;
    return n < 1500;
  }).map((i) => i.id));
  assert(blank.length === 0, 'all sprites render (' + blank.join(',') + ')');
  // every level: bin capacities add up to the item count
  const bad = await page.evaluate(() => TH.LEVELS.filter((l) => l.items.some((id) => !l.bins.find((b) => b.key === TH.keyOf(TH.ITEMS[id], l.rule)))).map((l) => l.id));
  assert(bad.length === 0, 'every item has a bin in every level');

  await shot('01-title');
  await page.click('[data-act="continue"]');
  await page.waitForTimeout(1500);
  await shot('02-level-start');

  // a real drag with the mouse: one wrong, one right
  const drag = await page.evaluate(() => {
    const G = TH.Game, cv = document.getElementById('cv'), r = cv.getBoundingClientRect();
    const toScreen = (x, y) => ({ x: r.left + x / 1600 * r.width, y: r.top + y / 900 * r.height });
    const it = G.pile.slice().sort((a, b) => b.z - a.z)[0];
    const right = G.bins.find((b) => b.key === it.def.cat), wrong = G.bins.find((b) => b.key !== it.def.cat);
    return { from: toScreen(it.x, it.y), right: toScreen(right.x + right.w / 2, right.y + right.h / 2), wrong: toScreen(wrong.x + wrong.w / 2, wrong.y + wrong.h / 2), id: it.id };
  });
  await page.mouse.move(drag.from.x, drag.from.y); await page.mouse.down();
  await page.mouse.move(drag.wrong.x, drag.wrong.y, { steps: 8 });
  await page.waitForTimeout(150); await shot('03-dragging');
  await page.mouse.up(); await page.waitForTimeout(700);
  assert(await page.evaluate(() => TH.Game.mistakes) === 1, 'wrong drop counts as a mistake');
  const again = await page.evaluate((id) => {
    const G = TH.Game, cv = document.getElementById('cv'), r = cv.getBoundingClientRect();
    const it = G.pile.find((p) => p.id === id);
    return { x: r.left + it.x / 1600 * r.width, y: r.top + it.y / 900 * r.height, top: G.pile.every((p) => p === it || p.z < it.z || Math.hypot(p.x - it.x, p.y - it.y) > 50) };
  }, drag.id);
  await page.mouse.move(again.x, again.y); await page.mouse.down();
  await page.mouse.move(drag.right.x, drag.right.y, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(700);
  assert(await page.evaluate(() => TH.Game.landed) === 1, 'correct drop lands in the crate');

  // abilities
  await page.evaluate(() => { TH.Save.data.stars['x1'] = 50;   /* temporary: unlock every ability */ for (const a of TH.ABIL) TH.Game.charge[a.id] = a.need; });
  await page.keyboard.press('Digit2'); await page.waitForTimeout(900);
  assert(await page.evaluate(() => TH.Game.landed) >= 5, 'Broom Breeze sorts items');
  await page.keyboard.press('Digit1');
  const mg = await page.evaluate(() => {
    const G = TH.Game, r = document.getElementById('cv').getBoundingClientRect(), sx = r.width / 1600, sy = r.height / 900;
    const counts = {}; G.pile.forEach((p) => { counts[p.def.cat] = (counts[p.def.cat] || 0) + 1; });
    const cat = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const it = G.pile.filter((p) => p.def.cat === cat).sort((a, b) => b.z - a.z)[0]; it.z = 1e6;
    const bin = G.bins.find((b) => b.key === cat);
    return { fx: r.left + it.x * sx, fy: r.top + it.y * sy, tx: r.left + (bin.x + bin.w / 2) * sx, ty: r.top + (bin.y + bin.h / 2) * sy, before: G.placed, same: counts[cat] };
  });
  await page.mouse.move(mg.fx, mg.fy); await page.mouse.down(); await page.mouse.move(mg.tx, mg.ty, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(900);
  const pulled = await page.evaluate((b) => TH.Game.placed - b, mg.before);
  assert(mg.same < 2 || pulled >= 2, 'Magnet Mitt pulls matching items (' + pulled + ' placed from ' + mg.same + ' matching)');
  await page.evaluate(() => { TH.Game.charge.lantern = 99; });
  await page.keyboard.press('Digit4');
  const ln = await page.evaluate(() => {
    const G = TH.Game, r = document.getElementById('cv').getBoundingClientRect(), sx = r.width / 1600, sy = r.height / 900;
    const it = G.pile.filter((p) => !p.an).sort((a, b) => b.z - a.z)[0]; it.z = 2e6;
    const bin = G.bins.find((b) => b.key !== it.def.cat);
    return { fx: r.left + it.x * sx, fy: r.top + it.y * sy, tx: r.left + (bin.x + bin.w / 2) * sx, ty: r.top + (bin.y + bin.h / 2) * sy, m: G.mistakes, placed: G.placed };
  });
  await page.mouse.move(ln.fx, ln.fy); await page.mouse.down(); await page.mouse.move(ln.tx, ln.ty, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(600);
  assert(await page.evaluate((o) => TH.Game.mistakes === o.m && TH.Game.placed === o.placed + 1, ln), 'Guiding Lantern redirects a wrong drop');
  await shot('04-mid-level');

  // finish this level automatically
  const finish = async () => {
    for (let i = 0; i < 400; i++) {
      const done = await page.evaluate(() => { TH.Game.autoStep(); return TH.Game.done; });
      if (done) break;
      await page.waitForTimeout(30);
    }
    await page.waitForSelector('#modal .stars', { timeout: 8000 });
  };
  await finish();
  await page.waitForTimeout(1300);
  await shot('05-level-done');
  await page.evaluate(() => { delete TH.Save.data.stars.x1; });
  assert(await page.evaluate(() => TH.Save.data.stars['pantry-1'] >= 1), 'level result is saved');

  // play through every remaining level quickly to catch layout / logic errors
  const total = await page.evaluate(() => TH.LEVELS.length);
  for (let n = 1; n < total; n++) {
    await page.click('[data-act="next"]');
    await page.waitForTimeout(250);
    if (n === 2 || n === 3 || n === 19 || n === 40 || n === 43) { await page.waitForTimeout(1300); await shot('lvl-' + (await page.evaluate(() => TH.Game.level.id))); }
    await finish();
  }
  await page.waitForTimeout(1200);
  await shot('06-finale');
  assert(await page.evaluate(() => TH.totalStars() === TH.maxStars()), 'all levels completable (stars ' + await page.evaluate(() => TH.totalStars()) + ')');
  await page.click('[data-act="tomap"]'); await page.waitForTimeout(400); await shot('07-rooms');
  for (const [to, name] of [['catalog', '08-catalog'], ['ach', '09-achievements'], ['shop', '10-shop']]) {
    await page.click('[data-act="back"]'); await page.click(`[data-act="go"][data-to="${to}"]`); await page.waitForTimeout(350); await shot(name);
  }
  await page.click('[data-act="upgrade"]'); await page.waitForTimeout(200);
  assert(await page.evaluate(() => TH.Save.data.abil.magnet === 2), 'ability upgrade purchase works');
  await page.click('[data-act="shoptab"][data-id="theme"]'); await page.click('[data-act="buytheme"]');
  await page.click('[data-act="shoptab"][data-id="pet"]'); await page.click('[data-act="buypet"]'); await page.waitForTimeout(200); await shot('11-shop-pets');
  await page.click('[data-act="back"]'); await page.click('[data-act="go"][data-to="settings"]');
  for (const t of ['game', 'controls', 'video', 'audio']) { await page.click(`[data-act="settab"][data-id="${t}"]`); await page.waitForTimeout(200); await shot('12-settings-' + t); }
  // rebind a key
  await page.click('[data-act="settab"][data-id="controls"]'); await page.click('[data-act="rebind"][data-id="shuffle"]'); await page.keyboard.press('KeyT');
  assert(await page.evaluate(() => TH.Settings.controls.keys.shuffle === 'KeyT'), 'key rebinding works');
  // endless + pause
  await page.click('[data-act="back"]'); await page.click('[data-act="endless"]'); await page.waitForTimeout(1500); await shot('13-endless');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); await shot('14-pause');
  assert(await page.evaluate(() => TH.Game.paused), 'Esc pauses');
  await page.click('[data-act="pausesettings"]'); await page.waitForTimeout(200); await page.click('[data-act="back"]'); await page.click('[data-act="resume"]');
  await finish(); await page.waitForTimeout(600);
  assert(await page.evaluate(() => TH.Save.data.stats.endless === 1), 'endless round completes');
  // save survives a reload
  await page.evaluate(() => TH.Save.flush());
  await page.reload(); await page.waitForTimeout(500);
  assert(await page.evaluate(() => TH.totalStars() === TH.maxStars() && TH.Save.data.pet === 'cat'), 'progress persists after reload');
  console.log('achievements unlocked:', await page.evaluate(() => Object.keys(TH.Save.data.ach).length), '/', info.ach);
  console.log('coins:', await page.evaluate(() => TH.Save.data.coins), 'earned:', await page.evaluate(() => TH.Save.data.stats.earned));

  await browser.close();
  if (errors.length) { console.log('\nERRORS:\n' + errors.join('\n')); process.exit(1); }
  console.log('\nSmoke test passed.');
})().catch((e) => { console.error(e); process.exit(1); });
