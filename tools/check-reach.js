// Usage: node tools/check-reach.js     (needs Playwright)
// Flood-fills everywhere the player can walk (real colliders, real groundAt, all doors open) and checks that every
// bookcase, bookmark and loose book can be reached from somewhere you can stand.
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', (e) => console.log('pageerror: ' + e.message));
  page.setDefaultTimeout(180000);
  await page.addInitScript(() => { HTMLCanvasElement.prototype.requestPointerLock = undefined; });
  await page.goto('file://' + path.resolve(__dirname, '..', 'src', 'index.html')); await page.waitForTimeout(900);
  let bad = 0;
  for (let round = 0; round < 3; round++) {
    const res = await page.evaluate(() => {
      const G = TH.Game, D = G.debug, PR = D.PR, STEPH = D.STEP, CELL = 0.1, EYE = 1.62, REACH = 2.6;
      for (const g of D.gates) g.col.on = false;
      const free = (x, z, y) => { const lv = y > 1.5 ? 1 : 0; return !D.colliders.some((c) => c.on && (c.lv === undefined || c.lv === lv) && x > c.x0 - PR && x < c.x1 + PR && z > c.z0 - PR && z < c.z1 + PR); };
      const LEN = D.X0[5] + D.plans[5].w, half = (x) => { let w = 0; for (let i = 5; i > 0; i--) if (x >= D.X0[i]) { w = i; break; } return D.plans[w].d / 2; };
      const key = (x, z, y) => Math.round(x / CELL) + ',' + Math.round(z / CELL) + ',' + Math.round(y * 4);
      const seen = new Map(), q = [[1.02, 0.02, 0]]; seen.set(key(1.02, 0.02, 0), [1.02, 0.02, 0]);
      while (q.length) {
        const [x, z, y] = q.pop();
        for (const [dx, dz] of [[CELL, 0], [-CELL, 0], [0, CELL], [0, -CELL]]) {
          const nx = x + dx, nz = z + dz;
          if (nx < PR || nx > LEN - PR || Math.abs(nz) > half(nx) - PR || !free(nx, nz, y)) continue;
          const gy = D.groundAt(nx, nz, y); if (gy === null) continue;
          const k = key(nx, nz, gy); if (seen.has(k)) continue; seen.set(k, [nx, nz, gy]); q.push([nx, nz, gy]);
        }
      }
      const cells = [...seen.values()];
      const near = (x, y, z, pred) => cells.some(([cx, cz, cy]) => { const d = Math.hypot(cx - x, cy + EYE - y, cz - z); return d < REACH && (!pred || pred(cx, cz, cy)); });
      const out = { cells: cells.length, upper: cells.filter((c) => c[2] > 2.5).length, bad: [] };
      for (const cs of D.cases) for (const row of cs.rows) {
        // somewhere to stand in front of the shelf, on the same floor, within reach of both ends of the row
        for (const ex of [-0.45, 0.45]) if (!near(cs.x + ex, row.y + 0.2, cs.z + cs.s * 0.16, (cx, cz, cy) => Math.abs(cy - cs.y0) < 0.1 && (cz - cs.z) * cs.s > 0.2)) out.bad.push('shelf ' + cs.cat.name + ' row ' + row.se.name);
      }
      for (const m of D.marks) { const p = m.group.position; if (!near(p.x, p.y, p.z)) out.bad.push('bookmark ' + m.id + ' at ' + [p.x, p.y, p.z].map((v) => v.toFixed(2))); }
      let books = 0;
      for (const l of D.loose) for (const b of l) { books++; const lvl = b.base > 1.5 ? b.base : 0; if (!near(b.lx, b.base + 0.03, b.lz, (cx, cz, cy) => Math.abs(cy - lvl) < 0.5)) out.bad.push('book ' + b.id + ' at ' + [b.lx, b.base, b.lz].map((v) => v.toFixed(2))); }
      out.books = books;
      for (const t of D.tables) if (!near(t.x, t.top, t.z)) out.bad.push('table at ' + t.x);
      G.reshuffle(); G.rebuild();
      return out;
    });
    bad += res.bad.length; console.log('deal', round + 1 + ':', 'walkable cells', res.cells, '(upstairs ' + res.upper + ')', 'books checked', res.books, 'unreachable:', res.bad.length, res.bad.slice(0, 12));
  }
  await browser.close();
  console.log(bad ? '\nSomething cannot be reached.' : '\nEverything can be reached.'); process.exit(bad ? 1 : 0);
})();
