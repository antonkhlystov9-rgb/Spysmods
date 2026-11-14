// The Night Shelver — the 3D library: world building, walking, picking up, shelving, knacks
(function () {
  'use strict';
  const TH = window.TH, T = window.THREE;
  const S = () => TH.Save.data;
  const { clamp, rand } = TH;

  // ---------- dimensions (metres) ----------
  const NW = TH.WINGS.length;
  const DOOR_W = 2.2, DOOR_H = 2.5;
  const CD = 0.32, IW = 1.0, CH = 2.08, ROW_Y0 = 0.14, ROW_DY = 0.48, ROW_H = 0.44;
  const EYE = 1.62, PR = 0.25, NV = TH.VOLS, NB = TH.BOOKS.length;
  const IRON = '#2f2a27';
  // One plan per room. Each room is longer and deeper than the one before it and holds more bookcases; the last two
  // have an upper floor. x runs along the library (0..w inside a room), z across it (-d/2..d/2); 'N' and 'S' mean
  // "against the north/south wall". A bookcase is [x, z, facing, upstairs?].
  const PLANS = [
    { w: 7, d: 6, h: 3.4, wood: ['#7a5236', '#553622', '#a9794f'], floor: 'planks', ceil: '#d8c6a6', frame: '#553622', win: [0.95, 1.4, 1.75],
      cases: [[2.2, 'N', 1], [4.8, 'N', 1], [3.5, 'S', -1]],
      tables: [[2.5, 0], [4.7, 0]], winN: [3.5], winS: [1.6, 5.4], lamps: [[6.5, -2.55], [6.5, 2.55]] },
    { w: 8, d: 7, h: 4.4, wood: ['#b89468', '#8f6f48', '#d9bd90'], floor: 'tiles', ceil: '#e8ecdb', frame: '#f3efe2', win: [1.25, 2.4, 2.2], cloth: '#4f7d5c',
      cases: [[1.6, 'N', 1], [3.2, 'N', 1], [4.8, 'N', 1], [6.4, 'N', 1]],                                    // one long wall of bookcases
      tables: [[2.4, 2.3], [5.6, 2.3]], winN: [], winS: [1.4, 3.1, 4.9, 6.6], lamps: [[0.45, -3.05]] },
    { w: 9, d: 8, h: 4.0, wood: ['#4a3327', '#2f2019', '#6b4a38'], floor: 'slate', ceil: '#c9cbd6', frame: '#8a8b99', win: [0.62, 2.2, 2.1], cloth: '#2f5d4a',
      cases: [[2.6, -0.17, -1], [4.5, -0.17, -1], [6.4, -0.17, -1], [3.55, 0.17, 1], [5.45, 0.17, 1]],       // free-standing stacks, back to back
      tables: [[2.0, -3.2], [7.0, -3.2], [4.5, 3.2]], winN: [1.6, 4.5, 7.4], winS: [1.6, 2.6, 6.4, 7.4], lamps: [[8.4, -3.3], [0.6, 3.3]] },
    { w: 10, d: 8, h: 3.8, wood: ['#5b3d4e', '#3c2735', '#8a6a4a'], floor: 'star', ceil: '#3f3350', frame: '#b8893a', win: [1.05, 0, 2.2], round: true,
      cases: [[1.3, 'N', 1], [2.6, 'N', 1], [3.9, 'N', 1], [6.1, 'S', -1], [7.4, 'S', -1], [8.7, 'S', -1]],   // two clusters on opposite walls
      tables: [[7.2, -2.6], [2.8, 2.6], [5, 0]], winN: [6.3, 8.1], winS: [1.0, 2.8, 4.5], lamps: [[0.55, -3.3]] },
    { w: 12, d: 9, h: 5.8, wood: ['#c79a5e', '#9b7340', '#e0bd85'], floor: 'boards', ceil: '#eadfc6', frame: '#9b7340', win: [0.9, 0.9, 2.05],
      upper: { x0: 0, x1: 12, z0: -4.5, z1: -1.9, y: 2.9 }, upShare: 0.26,                                   // a loft along the north side
      stair: { x0: 6.6, x1: 11.2, z0: -1.9, z1: -0.8, flat: 1.0, parapet: ['S', 'E'] },
      rails: [[0.15, -1.9, 9.9, -1.9], [11.2, -1.9, 11.85, -1.9]],
      cases: [[2.5, 'N', 1, 1], [6, 'N', 1, 1], [9.5, 'N', 1, 1], [2.0, 'N', 1], [4.0, 'N', 1], [2.2, 'S', -1], [6, 'S', -1], [9.8, 'S', -1]],
      tables: [[3.2, 0.9], [8.4, 1.9], [4.2, 3.1]], winN: [[4.25, 4.45], [7.75, 4.45]], winS: [4.1, 8.0, [3, 4.4], [6, 4.4], [9, 4.4]],
      lamps: [[11.5, -4.0]], hangs: [[3.2, 1.3, 3.9], [8.8, 1.3, 3.9]] },
    { w: 14, d: 10, h: 6.2, wood: ['#6b4a2e', '#46301e', '#8a6740'], floor: 'flag', ceil: '#a39c90', frame: '#46301e', win: [0.9, 0.42, 2.8], cloth: '#7a3b2e',
      upper: { x0: 9.5, x1: 14, z0: -5, z1: 5, y: 3.0 }, upShare: 0.24,                                       // a gallery across the far end, up a wide stair
      stair: { x0: 5.0, x1: 9.5, z0: -0.8, z1: 0.8, flat: 0, parapet: ['N', 'S'] },
      rails: [[9.5, -4.85, 9.5, -0.8], [9.5, 0.8, 9.5, 4.85]],
      cases: [[10.8, 'N', 1, 1], [12.6, 'N', 1, 1], [10.8, 'S', -1, 1], [12.6, 'S', -1, 1], [2.0, 'N', 1], [3.2, 'N', 1], [2.0, 'S', -1], [3.2, 'S', -1], [6.2, 'S', -1], [7.4, 'S', -1]],
      tables: [[2.6, 1.6], [2.6, -1.6], [7.2, 2.9]], winN: [0.95, [11.7, 5.75]], winS: [0.95, [11.7, 5.75]],
      lamps: [[0.5, -4.4]], hangs: [[2.6, 0, 4.2], [7.2, 0, 4.9], [11.8, 0, 5.4]] }
  ];
  const X0 = []; let LEN = 0;
  for (const pl of PLANS) { X0.push(LEN); LEN += pl.w; }
  const LAYOUT = 3;                                // bump when rooms change shape, so saved book positions are not reused
  const STEP = 0.45;                               // the tallest step you can take without stairs
  const uppers = [], stairsA = [], occluders = []; // per room: its upper floor and stairs; and every solid that hides what is behind it

  const G = TH.Game = { mode: 'menu', paused: false, locked: false, held: [], aim: null, fx: { golden: 0, way: 0 }, streak: 0, keys: {} };
  let cv, renderer, scene, camera, handScene, handCam, handGroup;
  let fireLight = null, woodFine = null, woodFast = null;
  const fineSwap = [], sways = [], roomGroups = [];
  const loose = TH.WINGS.map(() => []);        // per room: the books lying about, in the order they were laid down
  const _c = new T.Color();
  let built = false, lockAt = 0, lampWing = -1;
  const lampSpots = [];
  let cover, pages, handCover, handPages, hemi, sun, winMat, lampMat, dust, sparks, hlBook, hlRow, ghost;
  const lamps = [], halos = [], flames = [], spinners = [], clockHands = {}, books = [], tables = [], cases = [], colliders = [], gates = [], marks = [], anims = [], handMeshes = [], beacons = [];
  const P = { x: 1.05, z: 0, y: 0, yaw: -Math.PI / 2, pitch: 0 };
  let camY = 0;
  let dirty = false, clock = 0, last = 0, lastDraw = 0, fpsT = 0, fpsN = 0, bob = 0, stepPhase = 0, pending = 0;
  let lockFails = 0, epoch = 0;
  let mouseDown = false, repeatT = 0, lastOk = false, aimKey = '', aaOn = null, saveT = 0, lastWing = -1;
  const stick = { x: 0, y: 0 }, touches = {};

  const _m = new T.Matrix4(), _s = new T.Vector3(), _v = new T.Vector3(), _v2 = new T.Vector3(), _hv = new T.Vector3(), _q = new T.Quaternion();
  const Y_AXIS = new T.Vector3(0, 1, 0), Q_FLAT = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), Math.PI / 2);
  const calm = () => TH.Settings.video.reduceMotion;
  const cap = () => TH.upgVal('satchel');
  const reach = () => TH.upgVal('reach');
  const wingOf = (x) => { for (let w = NW - 1; w > 0; w--) if (x >= X0[w]) return w; return 0; };
  const halfAt = (x) => PLANS[wingOf(x)].d / 2;
  const inRect = (r, x, z) => !!r && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
  const lvOf = (y) => (y > 1.5 ? 1 : 0);          // 0 = downstairs, 1 = upstairs
  // Stairs climb along x. Their height at a point: a ramp, then (optionally) a flat landing at the top.
  const stairY = (st, x) => st.y * clamp((x - st.x0) / (st.x1 - st.x0 - st.flat), 0, 1);
  // The floor you would be standing on at (x, z), coming from height y. null = nothing there within one step.
  function groundAt(x, z, y) {
    const w = wingOf(x), st = stairsA[w], up = uppers[w];
    let best = null;
    const tryY = (c) => { if (Math.abs(c - y) <= STEP && (best === null || Math.abs(c - y) < Math.abs(best - y))) best = c; };
    if (inRect(st, x, z)) { tryY(stairY(st, x)); return best; }
    tryY(0);
    if (inRect(up, x, z)) tryY(up.y);
    return best;
  }
  G.wing = () => wingOf(P.x);

  // ---------- small builders ----------
  function textTexture(text, w, h, bg, fg, size, border) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, w, h);
    if (border) { x.strokeStyle = border; x.lineWidth = 6; x.strokeRect(5, 5, w - 10, h - 10); }
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    do { x.font = `bold ${size}px Georgia, "Times New Roman", serif`; size -= 2; } while (x.measureText(text).width > w - 30 && size > 10);
    x.fillText(text, w / 2, h / 2 + 2);
    const t = new T.CanvasTexture(c); t.anisotropy = 4;
    return t;
  }
  function floorTexture(kind, fw, fd) {
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.scale(2, 2);                          // drawn in 512 units at double resolution
    let rep = 2;
    if (kind === 'tiles') {                 // terracotta and cream checks
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
        const sh = Math.floor(Math.random() * 14) - 7, a = (r + k) % 2;
        x.fillStyle = a ? `rgb(${200 + sh},${138 + sh},${96 + sh})` : `rgb(${232 + sh},${216 + sh},${188 + sh})`; x.fillRect(k * 128, r * 128, 128, 128);
      }
      for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '70,40,20' : '255,250,235'},${Math.random() * 0.1})`; x.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5); }
      for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(i * 128 + 3, 0, 2, 512); x.fillRect(0, i * 128 + 3, 512, 2); x.fillStyle = 'rgba(60,35,20,.2)'; x.fillRect(i * 128 + 124, 0, 3, 512); x.fillRect(0, i * 128 + 124, 512, 3); }
      x.fillStyle = 'rgba(70,45,30,.75)'; for (let i = 0; i < 4; i++) { x.fillRect(i * 128, 0, 3, 512); x.fillRect(0, i * 128, 512, 3); }
    } else if (kind === 'slate') {          // large blue-grey flagstones
      rep = 1.6;
      for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) {
        const sh = Math.floor(Math.random() * 16) - 8, a = (r + k) % 2;
        x.fillStyle = a ? `rgb(${104 + sh},${110 + sh},${126 + sh})` : `rgb(${84 + sh},${90 + sh},${104 + sh})`; x.fillRect(k * 256, r * 256, 256, 256);
        x.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 30; i++) x.fillRect(k * 256 + Math.random() * 250, r * 256 + Math.random() * 250, 6, 2);
      }
      for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(${Math.random() < 0.6 ? '225,230,240' : '20,22,30'},${0.06 + Math.random() * 0.12})`; x.lineWidth = 0.6 + Math.random(); x.beginPath(); let px = Math.random() * 512, py = Math.random() * 512; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += Math.random() * 60 - 30; py += Math.random() * 60 - 30; x.lineTo(px, py); } x.stroke(); }
      for (let i = 0; i < 2; i++) { x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(i * 256 + 4, 0, 2, 512); x.fillRect(0, i * 256 + 4, 512, 2); }
      x.fillStyle = 'rgba(22,24,32,.8)'; for (let i = 0; i < 2; i++) { x.fillRect(i * 256, 0, 4, 512); x.fillRect(0, i * 256, 512, 4); }
    } else if (kind === 'star') {           // dark boards with brass inlay
      for (let r = 0; r < 8; r++) { const sh = Math.floor(Math.random() * 14); x.fillStyle = `rgb(${62 + sh},${42 + sh},${58 + sh})`; x.fillRect(0, r * 64, 512, 64); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, r * 64, 512, 2); }
      x.strokeStyle = '#c9a24a'; x.lineWidth = 3;
      for (const [cx, cy] of [[128, 128], [384, 384]]) { x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? 22 : 54; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.stroke(); }
      x.lineWidth = 1.5; x.strokeRect(1, 1, 510, 510);
      for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(15,8,14,${0.05 + Math.random() * 0.16})`; x.fillRect(Math.random() * 512, Math.random() * 512, 14 + Math.random() * 70, 0.8); }
    } else if (kind === 'boards') {         // the attic: wide, pale, scrubbed pine boards
      rep = 2.5;
      for (let r = 0; r < 4; r++) {
        for (let k = -1; k < 2; k++) {
          const px = k * 512 + (r % 2 ? 210 : 0), sh = Math.floor(Math.random() * 22);
          x.fillStyle = `rgb(${204 + sh},${172 + sh},${122 + sh})`; x.fillRect(px, r * 128, 512, 128);
          x.fillStyle = 'rgba(70,45,20,.4)'; x.fillRect(px, r * 128, 3, 128);
          for (const nx of [36, 476]) for (const ny of [28, 100]) { x.fillStyle = 'rgba(50,35,25,.7)'; x.beginPath(); x.arc(px + nx, r * 128 + ny, 2.6, 0, 7); x.fill(); }
        }
        x.fillStyle = 'rgba(70,45,20,.6)'; x.fillRect(0, r * 128, 512, 3.5);
        x.fillStyle = 'rgba(255,245,215,.2)'; x.fillRect(0, r * 128 + 3.5, 512, 1.5);
      }
      for (let i = 0; i < 1300; i++) { x.fillStyle = `rgba(110,75,35,${0.04 + Math.random() * 0.13})`; x.fillRect(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 110, 0.8); }
      for (let i = 0; i < 14; i++) { const kx = Math.random() * 512, ky = Math.random() * 512; for (let r = 2; r < 9; r += 2.2) { x.strokeStyle = 'rgba(95,60,28,.3)'; x.lineWidth = 1; x.beginPath(); x.ellipse(kx, ky, r * 1.7, r, 0, 0, 7); x.stroke(); } }
    } else if (kind === 'flag') {           // the cellar: worn sandstone flags of odd sizes
      rep = 2.2;
      x.fillStyle = '#3a342d'; x.fillRect(0, 0, 512, 512);
      const cols = [0, 150, 256, 420, 512], rows = [0, 110, 256, 350, 512];
      for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
        const sh = Math.floor(Math.random() * 26) - 13, px = cols[k], py = rows[r], w = cols[k + 1] - px, hh = rows[r + 1] - py;
        x.fillStyle = `rgb(${150 + sh},${138 + sh},${118 + sh})`; x.beginPath(); x.roundRect(px + 3, py + 3, w - 6, hh - 6, 7); x.fill();
        x.fillStyle = 'rgba(255,250,235,.1)'; x.fillRect(px + 6, py + 5, w - 12, 2);
        for (let i = 0; i < 18; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '40,32,24' : '235,225,205'},${0.05 + Math.random() * 0.1})`; x.fillRect(px + 8 + Math.random() * (w - 30), py + 8 + Math.random() * (hh - 20), 4 + Math.random() * 14, 1.5); }
      }
      for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(30,24,18,${Math.random() * 0.09})`; x.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5); }
    } else {                                // warm oak planks
      for (let r = 0; r < 8; r++) {
        for (let k = -1; k < 3; k++) {
          const w = 256, px = k * w + (r % 2 ? 128 : 0), sh = 150 + Math.floor(Math.random() * 34);
          x.fillStyle = `rgb(${sh + 22},${sh - 26},${sh - 70})`; x.fillRect(px, r * 64, w, 64);
          x.fillStyle = 'rgba(40,20,5,.35)'; x.fillRect(px, r * 64, 3, 64);
        }
        x.fillStyle = 'rgba(40,20,5,.55)'; x.fillRect(0, r * 64, 512, 3);
        x.fillStyle = 'rgba(255,235,200,.12)'; x.fillRect(0, r * 64 + 3, 512, 1.5);
      }
      for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(50,25,8,${0.05 + Math.random() * 0.17})`; x.fillRect(Math.random() * 512, Math.random() * 512, 16 + Math.random() * 90, 0.8); }
      for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(30,15,5,.5)'; x.beginPath(); x.arc(Math.random() * 512, (Math.random() * 8 | 0) * 64 + 10 + Math.random() * 44, 1.3, 0, 7); x.fill(); }
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(fw / rep, fd / rep); t.anisotropy = 8;
    return t;
  }
  // ---------- surface detail ----------
  // Wood grain: fine wavy lines running along U, tileable both ways. Used as colour and as relief.
  function grainTexture() {
    const N = 512, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d');
    x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 26; i++) { const y = Math.random() * N, hgt = 8 + Math.random() * 40; x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + Math.random() * 0.06})`; for (const o of [-N, 0, N]) x.fillRect(0, y + o, N, hgt); }
    for (let i = 0; i < 150; i++) {
      const y0 = Math.random() * N, a1 = 1 + Math.random() * 5, a2 = Math.random() * 2.5, p1 = Math.random() * 6.3, p2 = Math.random() * 6.3, k1 = 1 + (Math.random() * 2 | 0), k2 = 3 + (Math.random() * 4 | 0);
      x.strokeStyle = `rgba(40,25,10,${0.07 + Math.random() * 0.26})`; x.lineWidth = 0.6 + Math.random() * 2.2;
      for (const o of [-N, 0, N]) { x.beginPath(); for (let px = 0; px <= N; px += 8) { const y = y0 + o + a1 * Math.sin(px / N * 6.2832 * k1 + p1) + a2 * Math.sin(px / N * 6.2832 * k2 + p2); if (px) x.lineTo(px, y); else x.moveTo(px, y); } x.stroke(); }
    }
    for (const [kx, ky] of [[150, 170], [380, 360]]) for (let r = 3; r < 22; r += 3.2) { x.strokeStyle = `rgba(35,20,8,${0.34 - r * 0.012})`; x.lineWidth = 1.3; x.beginPath(); x.ellipse(kx, ky, r * 2.1, r, 0, 0, 7); x.stroke(); }
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(30,18,8,${Math.random() * 0.12})`; x.fillRect(Math.random() * N, Math.random() * N, 2 + Math.random() * 7, 1); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8;
    return t;
  }
  function plasterTexture() {               // a faint mottle so walls and stone are not flat colour
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d');
    x.fillStyle = '#eeeeee'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 46; i++) { const px = Math.random() * N, py = Math.random() * N, r = 10 + Math.random() * 30; x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${0.008 + Math.random() * 0.016})`; for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { x.beginPath(); x.arc(px + ox, py + oy, r, 0, 7); x.fill(); } }
    for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.045})`; x.fillRect(Math.random() * N, Math.random() * N, 1.5, 1.5); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4;
    return t;
  }
  function pageTexture() {                  // the edge of a block of pages
    const c = document.createElement('canvas'); c.width = 128; c.height = 8;
    const x = c.getContext('2d');
    x.fillStyle = '#f6edd8'; x.fillRect(0, 0, 128, 8);
    for (let px = 0; px < 128; px += 1 + (Math.random() * 3 | 0)) { x.fillStyle = `rgba(120,95,60,${0.08 + Math.random() * 0.3})`; x.fillRect(px, 0, 1, 8); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, 1); t.anisotropy = 4;
    return t;
  }
  // Boxes are scaled, not modelled, so texture coordinates are worked out in the shader from each box's real size:
  // the pattern keeps its scale on every piece, and (for wood) runs along the longer side of each face.
  function boxMapped(mat, along, across, longways) {
    mat.customProgramCacheKey = () => 'box|' + along + '|' + across + '|' + longways;      // otherwise three reuses one compiled shader for all of these
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
        vec3 bsc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        vec3 blp = position * bsc; vec3 ban = abs(normal); vec2 bq; vec2 bs;
        if (ban.x > 0.5) { bq = blp.zy; bs = bsc.zy; } else if (ban.y > 0.5) { bq = blp.xz; bs = bsc.xz; } else { bq = blp.xy; bs = bsc.xy; }
        ${longways ? 'if (bs.y > bs.x) bq = bq.yx;' : ''}
        vec3 btr = instanceMatrix[3].xyz;
        vUv = bq * vec2(${along.toFixed(3)}, ${across.toFixed(3)}) + vec2(fract(btr.x * 3.17 + btr.z * 1.31 + btr.y * 0.53), fract(btr.y * 2.63 + btr.x * 0.71 + btr.z * 1.9));`);
    };
    return mat;
  }
  function starTexture() {                  // the Vault's painted night ceiling
    const c = document.createElement('canvas'); c.width = 640; c.height = 512;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(320, 256, 40, 320, 256, 420); g.addColorStop(0, '#3b2f5c'); g.addColorStop(1, '#1d1733');
    x.fillStyle = g; x.fillRect(0, 0, 640, 512);
    for (let i = 0; i < 170; i++) { const r = Math.random() < 0.12 ? 2.6 : 1 + Math.random() * 0.8; x.fillStyle = `rgba(255,${226 + Math.random() * 29 | 0},${150 + Math.random() * 90 | 0},${0.5 + Math.random() * 0.5})`; x.beginPath(); x.arc(Math.random() * 640, Math.random() * 512, r, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(201,162,74,.5)'; x.lineWidth = 1.5;
    for (let k = 0; k < 5; k++) { x.beginPath(); let px = 60 + Math.random() * 520, py = 60 + Math.random() * 390; x.moveTo(px, py); for (let i = 0; i < 4; i++) { px += Math.random() * 90 - 45; py += Math.random() * 90 - 45; x.lineTo(px, py); } x.stroke(); }
    return new T.CanvasTexture(c);
  }
  function clockTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#f6ecd0'; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill();
    x.strokeStyle = '#2b1c10'; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 112, 0, 7); x.stroke();
    x.fillStyle = '#2b1c10'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = 'bold 22px Georgia, serif';
    TH.ROMAN.forEach((r, i) => { const a = (i + 1) / 12 * Math.PI * 2 - Math.PI / 2; x.fillText(r, 128 + Math.cos(a) * 92, 129 + Math.sin(a) * 92); });
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; x.fillRect(128 + Math.cos(a) * 116 - 1, 128 + Math.sin(a) * 116 - 1, 2, 2); }
    return new T.CanvasTexture(c);
  }
  function roundRugTexture(col) {
    const N = 1024, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'), m = N / 2;
    x.fillStyle = col; x.fillRect(0, 0, N, N);
    x.strokeStyle = 'rgba(255,236,190,.85)'; x.lineWidth = 20; x.beginPath(); x.arc(m, m, 464, 0, 7); x.stroke(); x.lineWidth = 8; x.beginPath(); x.arc(m, m, 416, 0, 7); x.stroke();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 8; x.beginPath(); x.arc(m, m, 440, 0, 7); x.stroke();
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; x.fillStyle = 'rgba(255,236,190,.6)'; x.beginPath(); x.arc(m + Math.cos(a) * 380, m + Math.sin(a) * 380, 10, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(255,236,190,.78)'; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, r = i % 2 ? 120 : 336; x.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r); } x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 - Math.PI / 2, r = i % 2 ? 70 : 200; x.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r); } x.closePath(); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(m, m, 56, 0, 7); x.fill();
    weave(x, N, N, 150000);
    return Object.assign(new T.CanvasTexture(c), { anisotropy: 8 });
  }
  function specimenTexture() {              // a board of pinned butterflies for the Gallery
    const c = document.createElement('canvas'); c.width = 384; c.height = 230;
    const x = c.getContext('2d');
    x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, 384, 230);
    const cols = ['#d98a3a', '#5a8fca', '#c95a6a', '#e9c84a', '#7fa56a', '#9873c6', '#d9655a', '#4f9aa0'];
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
      const cx = 52 + k * 93, cy = 62 + r * 106; x.fillStyle = cols[r * 4 + k];
      for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(cx, cy); x.bezierCurveTo(cx + sx * 44, cy - 46, cx + sx * 50, cy + 6, cx + sx * 6, cy + 6); x.bezierCurveTo(cx + sx * 36, cy + 14, cx + sx * 28, cy + 40, cx, cy + 14); x.fill(); }
      x.fillStyle = '#2b1c10'; x.fillRect(cx - 2, cy - 14, 4, 34); x.fillRect(cx - 14, cy + 34, 28, 2);
    }
    return new T.CanvasTexture(c);
  }
  // woven look: thousands of tiny warp and weft dashes, light and dark, so the pile catches the light
  function weave(x, w, h, n) {
    for (let i = 0; i < n; i++) {
      x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,245,225'},${0.04 + Math.random() * 0.1})`;
      if (Math.random() < 0.5) x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1); else x.fillRect(Math.random() * w, Math.random() * h, 1, 2 + Math.random() * 3);
    }
  }
  function rugTexture(col, long) {
    const W = 2048, H = long ? 320 : 640, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), k = H / 160;
    x.fillStyle = col; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,240,210,.8)'; x.lineWidth = 7 * k; x.strokeRect(16 * k, 16 * k, W - 32 * k, H - 32 * k);
    x.lineWidth = 2.5 * k; x.strokeRect(30 * k, 30 * k, W - 60 * k, H - 60 * k);
    x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 3 * k; x.strokeRect(23 * k, 23 * k, W - 46 * k, H - 46 * k);
    const nn = Math.floor((W - 120 * k) / (52 * k));
    for (let i = 0; i < nn; i++) {
      const cx = 60 * k + (i + 0.5) * (W - 120 * k) / nn, cy = H / 2, r = 20 * k;
      x.fillStyle = 'rgba(255,240,210,.62)'; x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.72, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.72, cy); x.closePath(); x.fill();
      x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(cx, cy, 4 * k, 0, 7); x.fill();
    }
    weave(x, W, H, long ? 90000 : 180000);
    const t = new T.CanvasTexture(c); t.anisotropy = 8;
    return t;
  }
  function leafTexture() {                  // overlapping leaf shapes, light and dark
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d');
    x.fillStyle = '#b4b4b4'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < 300; i++) {
      const px = Math.random() * N, py = Math.random() * N, r = 9 + Math.random() * 13, a = Math.random() * 3.14, g = 150 + Math.random() * 105 | 0;
      for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
        x.fillStyle = `rgb(${g},${g},${g})`; x.beginPath(); x.ellipse(px + ox, py + oy, r, r * 0.42, a, 0, 7); x.fill();
        x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(px + ox - Math.cos(a) * r, py + oy - Math.sin(a) * r); x.lineTo(px + ox + Math.cos(a) * r, py + oy + Math.sin(a) * r); x.stroke();
      }
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 4;
    return t;
  }
  // ---------- readable books ----------
  // One tile per series in a 4096 atlas, drawn in 384 units (a 96-wide spine and a 288-wide front cover) and scaled to fit the grid.
  // The volume numeral is a second small texture that the shader stamps onto each book.
  const BLK = 384, ATLAS = 4096, ACOLS = Math.max(10, Math.ceil(Math.sqrt(TH.SERIES.length))), PIX = Math.floor(ATLAS / ACOLS), SU = PIX / ATLAS, SERIF = 'Georgia, "Times New Roman", serif';
  function fitLines(x, text, maxW, maxH, maxSize, minSize, weight) {
    const words = text.split(' ');
    for (let size = maxSize; size >= minSize; size -= 1) {
      x.font = `${weight} ${size}px ${SERIF}`;
      const lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && x.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }
      lines.push(cur);
      if (lines.length * size * 1.16 <= maxH && lines.every((l) => x.measureText(l).width <= maxW)) return { lines, size };
    }
    return { lines: [text], size: minSize };
  }
  function bookAtlas() {
    const c = document.createElement('canvas'); c.width = c.height = ATLAS;
    const x = c.getContext('2d');
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const se of TH.SERIES) {
      const bx = 0, by = 0, cat = TH.CATS[se.cat].name.toUpperCase();
      x.save(); x.translate((se.id % ACOLS) * PIX, Math.floor(se.id / ACOLS) * PIX); x.scale(PIX / BLK, PIX / BLK);
      const rgb = [1, 3, 5].map((i) => parseInt(se.color.slice(i, i + 2), 16)), light = (rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11) > 118;
      const ink = light ? '#2b1c10' : '#fdeec8', line = light ? 'rgba(43,28,16,.75)' : 'rgba(253,238,200,.8)', plate = TH.mix(se.color, '#000000', 0.62);
      x.fillStyle = se.color; x.fillRect(bx, by, BLK, BLK);
      const plateAt = (px, py, pw, ph) => { x.fillStyle = plate; x.beginPath(); x.roundRect(px, py, pw, ph, 6); x.fill(); x.strokeStyle = '#fdeec8'; x.lineWidth = 2; x.stroke(); };
      // spine
      x.fillStyle = TH.mix(se.color, '#000000', 0.22); x.fillRect(bx, by, 96, 10); x.fillRect(bx, by + 374, 96, 10);
      x.fillStyle = line; x.fillRect(bx + 6, by + 50, 84, 3); x.fillRect(bx + 6, by + 56, 84, 1.5); x.fillRect(bx + 6, by + 296, 84, 3); x.fillRect(bx + 6, by + 290, 84, 1.5);
      x.fillStyle = ink;
      let fs = 15; do { x.font = `bold ${fs}px ${SERIF}`; fs -= 1; } while (x.measureText(cat).width > 84 && fs > 8);
      x.fillText(cat, bx + 48, by + 31);
      x.save(); x.translate(bx + 48, by + 174); x.rotate(Math.PI / 2);
      const st = fitLines(x, se.name, 214, 80, 46, 15, 'bold');
      st.lines.forEach((l, i) => x.fillText(l, 0, (i - (st.lines.length - 1) / 2) * st.size * 1.12 + 2));
      x.restore();
      plateAt(bx + 11.5, by + 311, 73, 50);
      // front cover
      const ox = bx + 96;
      x.strokeStyle = line; x.lineWidth = 3; x.strokeRect(ox + 15, by + 15, 258, 354); x.lineWidth = 1.5; x.strokeRect(ox + 23, by + 23, 242, 338);
      x.fillStyle = ink; x.font = `bold 17px ${SERIF}`; x.fillText(cat.split('').join(' '), ox + 144, by + 52);
      x.fillStyle = line; x.fillRect(ox + 94, by + 68, 100, 2);
      x.fillStyle = ink;
      const ct = fitLines(x, se.name, 216, 150, 42, 20, 'bold');
      ct.lines.forEach((l, i) => x.fillText(l, ox + 144, by + 152 + (i - (ct.lines.length - 1) / 2) * ct.size * 1.16));
      x.save(); x.translate(ox + 144, by + 244); x.rotate(Math.PI / 4); x.fillStyle = line; x.fillRect(-6, -6, 12, 12); x.restore();
      x.fillStyle = ink; x.font = `bold 12px ${SERIF}`; x.fillText('V O L U M E', ox + 144, by + 263);
      plateAt(ox + 98, by + 273, 92, 46);
      x.font = `italic 12px ${SERIF}`; x.fillText('Emberwick Library', ox + 144, by + 343);
      x.restore();
    }
    const cloth = document.createElement('canvas'); cloth.width = cloth.height = BLK;
    const cx2 = cloth.getContext('2d');
    for (let i = 0; i < 9000; i++) { cx2.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + Math.random() * 0.07})`; if (i % 2) cx2.fillRect(Math.random() * BLK, Math.random() * BLK, 3, 1); else cx2.fillRect(Math.random() * BLK, Math.random() * BLK, 1, 3); }
    for (const se of TH.SERIES) x.drawImage(cloth, (se.id % ACOLS) * PIX, Math.floor(se.id / ACOLS) * PIX, PIX, PIX);
    const t = new T.CanvasTexture(c); t.anisotropy = 8;
    return t;
  }
  function numeralTexture() {
    const c = document.createElement('canvas'); c.width = 2048; c.height = 64;      // 16 slots of 128px, 12 used
    const x = c.getContext('2d');
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fdeec8';
    TH.ROMAN.forEach((r, i) => { let fs = 46; do { x.font = `bold ${fs}px ${SERIF}`; fs -= 2; } while (x.measureText(r).width > 108); x.fillText(r, i * 128 + 64, 35); });
    const t = new T.CanvasTexture(c); t.anisotropy = 4;
    return t;
  }
  // A unit box whose +z face is the spine and +x face the front cover; the other faces are plain.
  function bookGeometry() {
    const pos = [], nor = [], uv = [], num = [], idx = [], e = 0.006;
    const face = (n, pts, rect, plate) => {
      const base = pos.length / 3, corner = [[0, 0], [1, 0], [1, 1], [0, 1]];
      pts.forEach((pt, i) => {
        pos.push(...pt); nor.push(...n);
        const [fu, fv] = corner[i];
        if (rect.length === 2) uv.push(rect[0], rect[1]); else uv.push(rect[0] + (rect[1] - rect[0]) * fu, rect[2] + (rect[3] - rect[2]) * fv);
        if (plate) num.push((fu - plate[0]) / (plate[1] - plate[0]), (fv - plate[2]) / (plate[3] - plate[2])); else num.push(-1, -1);
      });
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };
    const h = 0.5, plain = [0.263, 0.5];
    face([0, 0, 1], [[-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]], [e, 0.25 - e, e, 1 - e], [11.5 / 96, 84.5 / 96, 23 / 384, 73 / 384]);
    face([1, 0, 0], [[h, -h, h], [h, -h, -h], [h, h, -h], [h, h, h]], [0.25 + e, 1 - e, e, 1 - e], [98 / 288, 190 / 288, 65 / 384, 111 / 384]);
    face([-1, 0, 0], [[-h, -h, -h], [-h, -h, h], [-h, h, h], [-h, h, -h]], plain);
    face([0, 0, -1], [[h, -h, -h], [-h, -h, -h], [-h, h, -h], [h, h, -h]], plain);
    face([0, 1, 0], [[-h, h, h], [h, h, h], [h, h, -h], [-h, h, -h]], plain);
    face([0, -1, 0], [[-h, -h, -h], [h, -h, -h], [h, -h, h], [-h, -h, h]], plain);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('aNum', new T.Float32BufferAttribute(num, 2));
    g.setIndex(idx);
    return g;
  }
  // per-instance aInst = (atlas column, atlas row, volume, gilded)
  function bookMesh(geo, mat, count) {
    geo.setAttribute('aInst', new T.InstancedBufferAttribute(new Float32Array(count * 4), 4));
    const m = new T.InstancedMesh(geo, mat, count); m.frustumCulled = false;
    return m;
  }
  function bookMaterial() {
    const numMap = numeralTexture(), m = new T.MeshLambertMaterial({ map: bookAtlas() });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.numMap = { value: numMap };
      sh.vertexShader = 'attribute vec4 aInst;\nattribute vec2 aNum;\nvarying vec2 vNum;\nvarying vec2 vInst;\n' + sh.vertexShader.replace('#include <uv_vertex>',
        `#include <uv_vertex>\n  vUv = vec2((uv.x + aInst.x) * ${SU.toFixed(6)}, 1.0 - (aInst.y + 1.0 - uv.y) * ${SU.toFixed(6)});\n  vNum = aNum; vInst = aInst.zw;`);
      sh.fragmentShader = 'uniform sampler2D numMap;\nvarying vec2 vNum;\nvarying vec2 vInst;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
        vec4 texelColor = texture2D( map, vUv );
        if (vNum.x > 0.0 && vNum.x < 1.0 && vNum.y > 0.0 && vNum.y < 1.0) {
          vec4 nm = texture2D( numMap, vec2((vInst.x + vNum.x) / 16.0, vNum.y) );
          texelColor.rgb = mix(texelColor.rgb, nm.rgb, nm.a);
        }
        texelColor = mapTexelToLinear( texelColor );
        diffuseColor *= texelColor;`);
    };
    return m;
  }
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,236,170,1)'); g.addColorStop(0.4, 'rgba(255,210,110,.45)'); g.addColorStop(1, 'rgba(255,200,90,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }

  // ---------- world ----------
  function placeLamps(cw) {
    if (cw === lampWing) return;
    lampWing = cw;
    const near = TH.WINGS.map((_, w) => w).sort((a, b) => Math.abs(a - cw) - Math.abs(b - cw) || a - b).slice(0, lamps.length / 2);
    let i = 0;
    for (const sp of lampSpots) if (near.includes(sp[3]) && i < lamps.length) lamps[i++].position.set(sp[0], sp[1], sp[2]);
  }
  function buildWorld() {
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(TH.Settings.video.fov, 16 / 9, 0.05, 90);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    hemi = new T.HemisphereLight(0xffffff, 0x444444, 0.7); scene.add(hemi);
    sun = new T.DirectionalLight(0xffffff, 0.3); sun.position.set(0.4, 1, 0.6); scene.add(sun);

    const solids = [];
    const solid = (x, y, z, sx, sy, sz, col) => solids.push([x, y, z, sx, sy, sz, col]);
    const wall = (x0, x1, z0, z1, on) => { const c = { x0, x1, z0, z1, on: on !== false, wall: true }; colliders.push(c); return c; };
    // furniture: lv 0 stops you downstairs, 1 upstairs, -1 on both floors
    const block = (x0, x1, z0, z1, lv) => { const c = { x0, x1, z0, z1, on: true, lv: lv === -1 ? undefined : lv || 0 }; colliders.push(c); return c; };

    winMat = new T.MeshBasicMaterial({ color: 0x2b3a66 });
    lampMat = new T.MeshBasicMaterial({ color: 0xffd9a0 });
    const bulbGeo = new T.SphereGeometry(0.11, 14, 10), glowTex = glowTexture();
    const ironMat = new T.MeshLambertMaterial({ color: IRON }), barGeo = new T.BoxGeometry(0.05, DOOR_H, 0.05), railGeo = new T.BoxGeometry(0.06, 0.06, DOOR_W);
    const markGeo = new T.BoxGeometry(0.06, 0.24, 0.012);
    // round and tapered shapes that the box mesh cannot do
    const mats = {};
    const lam = (c) => mats[c] || (mats[c] = new T.MeshLambertMaterial({ color: c }));
    let room = scene;                               // while a room is being built, its loose objects go in that room's group
    const add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); room.add(m); return m; };
    const cyl = (x, y, z, r0, r1, h, c, seg) => add(new T.CylinderGeometry(r0, r1, h, seg || 14), lam(c), x, y, z);
    const ball = (x, y, z, r, c) => add(new T.SphereGeometry(r, 14, 10), lam(c), x, y, z);
    // A surface with relief has a costly "fine" material and a plain "fast" one for the Low quality setting.
    const relief = (mesh, fine, fast) => { fineSwap.push({ mesh, fine, fast }); mesh.material = fine; return mesh; };
    const plaster = plasterTexture(), leafTex = leafTexture();
    // a rug with real thickness, a woven surface and a fringe at each end
    const rugAt = (x, z, wd, dp, col2) => {
      const tex = rugTexture(col2, wd / dp > 5), plain = lam(TH.mix(col2, '#000000', 0.25));
      const top = new T.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.02, roughness: 0.95, metalness: 0 });
      const m = add(new T.BoxGeometry(wd, 0.022, dp), [plain, plain, top, plain, plain, plain], x, 0.011, z);
      fineSwap.push({ mesh: m, fine: [plain, plain, top, plain, plain, plain], fast: [plain, plain, new T.MeshLambertMaterial({ map: tex }), plain, plain, plain] });
      for (const e of [-1, 1]) for (let k = 0; k < dp / 0.045; k++) solid(x + e * (wd / 2 + 0.035), 0.006, z - dp / 2 + 0.02 + k * 0.045, 0.07, 0.008, 0.016, '#e8dcc0');
    };
    const roundRugAt = (x, z, r, col2) => {
      const tex = roundRugTexture(col2), plain = lam(TH.mix(col2, '#000000', 0.25));
      const top = new T.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.02, roughness: 0.95, metalness: 0 });
      const m = add(new T.CylinderGeometry(r, r, 0.022, 64), [plain, top, plain], x, 0.011, z);
      fineSwap.push({ mesh: m, fine: [plain, top, plain], fast: [plain, new T.MeshLambertMaterial({ map: tex }), plain] });
    };
    // foliage: lumpy faceted clumps in three greens, layered so the crown has shadowed hollows and bright tips
    const clump = [0, 1, 2].map(() => { const g = new T.IcosahedronGeometry(1, 1), pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const k = 0.82 + Math.random() * 0.36; pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k, pa.getZ(i) * k); } g.computeVertexNormals(); return g; });
    const greens = ['#3d8040', '#5fa653', '#8cc66c'].map((c) => new T.MeshStandardMaterial({ color: c, map: leafTex, bumpMap: leafTex, bumpScale: 0.02, roughness: 0.9, metalness: 0, flatShading: true }));
    const greensFast = ['#3d8040', '#5fa653', '#8cc66c'].map((c) => new T.MeshLambertMaterial({ color: c, map: leafTex }));
    const bark = new T.MeshStandardMaterial({ color: '#6f4d31', map: plaster, bumpMap: plaster, bumpScale: 0.06, roughness: 0.95, metalness: 0 });
    const crown = (cx, cy, cz, r, n) => {
      const g = new T.Group(); g.position.set(cx, cy, cz);
      for (let i = 0; i < n; i++) {
        const inner = i < n * 0.3, a = Math.random() * 6.283, rad = inner ? Math.random() * r * 0.35 : r * (0.45 + Math.random() * 0.5), yy = (Math.random() - 0.35) * r * (inner ? 0.5 : 1.0);
        const k = inner ? 0 : Math.random() < 0.45 ? 1 : 2, m = new T.Mesh(clump[i % 3], greens[k]);
        m.position.set(Math.cos(a) * rad, yy, Math.sin(a) * rad); m.scale.setScalar(r * (inner ? 0.5 : 0.24 + Math.random() * 0.2)); m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        g.add(m); fineSwap.push({ mesh: m, fine: greens[k], fast: greensFast[k] });
      }
      room.add(g); sways.push({ g, p: Math.random() * 6 });
    };
    const hang = (x, y, z, top, scale) => {          // a lamp on a cord, with a glow
      solid(x, (y + top) / 2 + 0.05, z, 0.03, top - y - 0.1, 0.03, IRON);
      const bulb = add(bulbGeo, lampMat, x, y, z); bulb.scale.setScalar(scale);
      const halo = new T.Sprite(new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }));
      halo.scale.setScalar(scale * 0.85); halo.position.set(x, y, z); room.add(halo); halos.push(halo);
    };
    // a window on a long wall; sgn -1 is the north wall, +1 the south wall
    const windowAt = (x, sgn, wd, ht, cy, frame, round, HALF) => {
      const zf = sgn * (HALF - 0.03), rot = sgn > 0 ? Math.PI : 0;
      if (round) {
        const pane = add(new T.CircleGeometry(wd / 2, 28), winMat, x, cy, sgn * (HALF - 0.012)); pane.rotation.y = rot;
        const ring = add(new T.TorusGeometry(wd / 2, 0.055, 8, 28), lam(frame), x, cy, zf);
        ring.rotation.y = rot;
        solid(x, cy, zf, 0.04, wd, 0.04, frame); solid(x, cy, zf, wd, 0.04, 0.04, frame);
        return;
      }
      const pane = add(new T.PlaneGeometry(wd, ht), winMat, x, cy, sgn * (HALF - 0.012)); pane.rotation.y = rot;
      solid(x, cy + ht / 2 + 0.03, zf, wd + 0.14, 0.07, 0.06, frame); solid(x, cy - ht / 2 - 0.03, zf, wd + 0.14, 0.07, 0.06, frame);
      solid(x - wd / 2 - 0.035, cy, zf, 0.07, ht + 0.06, 0.06, frame); solid(x + wd / 2 + 0.035, cy, zf, 0.07, ht + 0.06, 0.06, frame);
      if (wd > 0.8) solid(x, cy, zf, 0.035, ht, 0.04, frame);
      for (let k = 1; k * 0.75 < ht; k++) solid(x, cy - ht / 2 + k * 0.75, zf, wd, 0.03, 0.04, frame);
      solid(x, cy - ht / 2 - 0.08, sgn * (HALF - 0.09), wd + 0.2, 0.05, 0.18, frame);
    };

    const first = PLANS[0], last = PLANS[NW - 1];
    solid(-0.15, first.h / 2, 0, 0.3, first.h, first.d + 0.6, TH.WINGS[0].wall);
    solid(LEN + 0.15, last.h / 2, 0, 0.3, last.h, last.d + 0.6, TH.WINGS[NW - 1].wall);

    TH.WINGS.forEach((wg, w) => {
      const pl = PLANS[w], x0 = X0[w], W = pl.w, D = pl.d, hf = D / 2, h = pl.h, [wood, woodD, woodL] = pl.wood;
      const zOf = (z) => (z === 'N' ? -hf + CD / 2 : z === 'S' ? hf - CD / 2 : z);
      room = scene;                                 // floor and ceiling always show: you can see them through the doorways
      // floor and ceiling
      const ftex = floorTexture(pl.floor, W, D), shiny = pl.floor === 'tiles' || pl.floor === 'slate', rough = pl.floor === 'flag';
      const floor = add(new T.PlaneGeometry(W, D), null, x0 + W / 2, 0, 0); floor.rotation.x = -Math.PI / 2;
      relief(floor, new T.MeshStandardMaterial({ map: ftex, bumpMap: ftex, bumpScale: shiny ? 0.03 : rough ? 0.045 : 0.02, roughness: shiny ? 0.5 : rough ? 0.9 : 0.72, metalness: 0 }), new T.MeshLambertMaterial({ map: ftex }));
      const ceil = add(new T.PlaneGeometry(W, D), pl.floor === 'star' ? new T.MeshBasicMaterial({ map: starTexture() }) : new T.MeshLambertMaterial({ color: pl.ceil, map: Object.assign(plaster.clone(), { needsUpdate: true, repeat: new T.Vector2(W * 0.6, D * 0.6) }) }), x0 + W / 2, h, 0); ceil.rotation.x = Math.PI / 2;
      room = new T.Group(); scene.add(room); roomGroups[w] = room;
      // long walls with skirting, then this room's windows
      for (const sgn of [-1, 1]) {
        solid(x0 + W / 2, h / 2, sgn * (hf + 0.15), W, h, 0.3, wg.wall);
        solid(x0 + W / 2, 0.09, sgn * (hf - 0.02), W, 0.18, 0.04, woodD);
        for (const e of (sgn < 0 ? pl.winN : pl.winS)) { const [lx, cy] = Array.isArray(e) ? e : [e, pl.win[2]]; windowAt(x0 + lx, sgn, pl.win[0], pl.win[1], cy, pl.frame, pl.round, hf); }
      }
      // wall to the previous room (as tall and as deep as the bigger of the two), with a doorway and a gate
      if (w > 0) {
        const pv = PLANS[w - 1], hm = Math.max(h, pv.h), far = Math.max(hf, pv.d / 2) + 0.3, seg = far - DOOR_W / 2, zc = (far + DOOR_W / 2) / 2;
        const mixed = TH.mix(wg.wall, TH.WINGS[w - 1].wall, 0.5);
        for (const sgn of [-1, 1]) { solid(x0, hm / 2, sgn * zc, 0.3, hm, seg, mixed); wall(x0 - 0.15, x0 + 0.15, sgn * zc - seg / 2, sgn * zc + seg / 2); }
        solid(x0, (DOOR_H + 0.1 + hm) / 2, 0, 0.3, hm - DOOR_H - 0.1, DOOR_W, mixed);
        solid(x0, DOOR_H + 0.06, 0, 0.36, 0.12, DOOR_W + 0.16, woodD);
        solid(x0, DOOR_H / 2, -DOOR_W / 2 + 0.04, 0.34, DOOR_H, 0.08, woodD); solid(x0, DOOR_H / 2, DOOR_W / 2 - 0.04, 0.34, DOOR_H, 0.08, woodD);
        const grp = new T.Group();
        for (let i = 0; i < 9; i++) { const b = new T.Mesh(barGeo, ironMat); b.position.set(0, DOOR_H / 2, -DOOR_W / 2 + 0.16 + i * (DOOR_W - 0.32) / 8); grp.add(b); }
        for (const y of [0.25, 1.3, DOOR_H - 0.12]) { const r = new T.Mesh(railGeo, ironMat); r.position.set(0, y, 0); grp.add(r); }
        grp.position.set(x0, 0, 0); scene.add(grp);
        gates.push({ idx: w - 1, x: x0, group: grp, col: wall(x0 - 0.1, x0 + 0.1, -DOOR_W / 2, DOOR_W / 2), open: false });
      }
      // an upper floor: a slab, railings along its open edges, and a staircase of solid steps
      if (pl.upper) {
        const u = pl.upper, H = u.y, ua = { x0: x0 + u.x0, x1: x0 + u.x1, z0: u.z0, z1: u.z1, y: H };
        uppers[w] = ua;
        solid((ua.x0 + ua.x1) / 2, H - 0.09, (u.z0 + u.z1) / 2, u.x1 - u.x0, 0.18, u.z1 - u.z0, woodL);
        occluders.push([ua.x0, ua.x1, H - 0.18, H, u.z0, u.z1]);
        for (const [xa, za, xb, zb] of pl.rails) {
          const alongX = za === zb, len = alongX ? xb - xa : zb - za, n = Math.max(1, Math.round(len / 1.15));
          for (let k = 0; k <= n; k++) solid(x0 + xa + (alongX ? len * k / n : 0), H + 0.5, za + (alongX ? 0 : len * k / n), 0.07, 1.0, 0.07, woodD);
          for (const ry of [0.98, 0.52]) solid(x0 + (xa + xb) / 2, H + ry, (za + zb) / 2, alongX ? len : 0.05, ry > 0.9 ? 0.07 : 0.04, alongX ? 0.05 : len, ry > 0.9 ? woodD : wood);
          block(x0 + xa - (alongX ? 0 : 0.04), x0 + xb + (alongX ? 0 : 0.04), za - (alongX ? 0.04 : 0), zb + (alongX ? 0.04 : 0), 1);
        }
        const st = pl.stair, sa = { x0: x0 + st.x0, x1: x0 + st.x1, z0: st.z0, z1: st.z1, flat: st.flat, y: H }, STEPS = 15;
        stairsA[w] = sa;
        const run = (st.x1 - st.x0 - st.flat) / STEPS, rise = H / STEPS, zc = (st.z0 + st.z1) / 2, wd = st.z1 - st.z0;
        for (let k = 0; k < STEPS; k++) {
          const cx = sa.x0 + (k + 0.5) * run, top = (k + 1) * rise;
          solid(cx, top / 2, zc, run, top, wd, k % 2 ? wood : woodL);
          occluders.push([cx - run / 2, cx + run / 2, 0, top, st.z0, st.z1]);
          for (const side of st.parapet) if (side === 'N' || side === 'S') solid(cx, top + 0.5, side === 'N' ? st.z0 + 0.03 : st.z1 - 0.03, run, 1.0, 0.06, woodD);
        }
        // The parapets are solid on every floor, so you get on at the foot and off at the top, and nobody on the ramp can
        // ever be standing where the upper floor's railing is.
        const ramp1 = sa.x1 - st.flat;
        block(sa.x0, st.parapet.includes('N') ? sa.x1 : ramp1 - 0.3, st.z0 - 0.04, st.z0 + 0.04, -1);     // (stopping short leaves a wide way off at the top)
        block(sa.x0, st.parapet.includes('S') ? sa.x1 : ramp1, st.z1 - 0.04, st.z1 + 0.04, -1);
        if (st.parapet.includes('E')) block(sa.x1 - 0.04, sa.x1 + 0.04, st.z0, st.z1, -1);
        if (st.flat) {
          const cx = sa.x1 - st.flat / 2;
          solid(cx, H / 2, zc, st.flat, H, wd, woodL); occluders.push([sa.x1 - st.flat, sa.x1, 0, H, st.z0, st.z1]);
          for (const side of st.parapet) {
            if (side === 'N' || side === 'S') solid(cx, H + 0.5, side === 'N' ? st.z0 + 0.03 : st.z1 - 0.03, st.flat, 1.0, 0.06, woodD);
            if (side === 'E') solid(sa.x1 - 0.03, H + 0.5, zc, 0.06, 1.0, wd, woodD);
          }
        }
      }
      // tables: a surface books can be put on
      for (const [tx, tz] of pl.tables) {
        const top = pl.cloth ? 0.792 : 0.782;
        solid(x0 + tx, 0.75, tz, 1.6, 0.06, 0.9, woodL);
        if (pl.cloth) solid(x0 + tx, 0.784, tz, 1.36, 0.012, 0.66, pl.cloth);
        for (const a of [-1, 1]) for (const b of [-1, 1]) solid(x0 + tx + a * 0.72, 0.36, tz + b * 0.37, 0.07, 0.72, 0.07, wood);
        block(x0 + tx - 0.8, x0 + tx + 0.8, tz - 0.45, tz + 0.45);
        tables.push({ wing: w, x: x0 + tx, z: tz, top });
        occluders.push([x0 + tx - 0.8, x0 + tx + 0.8, 0.72, top, tz - 0.45, tz + 0.45]);
      }
      // standing lamps and the hanging lights
      for (const [lx, lz] of pl.lamps) {
        solid(x0 + lx, 0.8, lz, 0.05, 1.6, 0.05, IRON); solid(x0 + lx, 0.03, lz, 0.3, 0.06, 0.3, IRON);
        add(bulbGeo, lampMat, x0 + lx, 1.72, lz);
        block(x0 + lx - 0.12, x0 + lx + 0.12, lz - 0.12, lz + 0.12);
      }
      const hangs = pl.hangs || [[W * 0.27, 0, h - 0.85], [W * 0.73, 0, h - 0.85]];
      for (const [lx, lz, ly] of hangs) { hang(x0 + lx, ly, lz, h, 1.3); lampSpots.push([x0 + lx, ly - 0.1, lz, w]); }
      // bookcases
      wg.cats.forEach((cat, k) => {
        const [lx0, zt, s, upstairs] = pl.cases[k], x = x0 + lx0, z = zOf(zt), y0 = upstairs ? pl.upper.y : 0, rotY = s > 0 ? 0 : Math.PI;
        const at = (lx, ly, lz, sx, sy, sz, col) => solid(x + s * lx, y0 + ly, z + s * lz, sx, sy, sz, col);
        at(0, CH / 2, -CD / 2 + 0.012, IW + 0.07, CH, 0.024, woodD);
        at(-(IW / 2 + 0.02), CH / 2, 0, 0.04, CH, CD, wood); at(IW / 2 + 0.02, CH / 2, 0, 0.04, CH, CD, wood);
        for (let i = 0; i <= 4; i++) at(0, ROW_Y0 - 0.0175 + i * ROW_DY, 0, IW, 0.035, CD, wood);
        at(0, 0.06, 0.01, IW, 0.12, CD - 0.04, woodD);
        at(0, CH + 0.03, 0.02, IW + 0.16, 0.06, CD + 0.06, woodD);
        at(0, CH + 0.2, CD / 2 - 0.06, 1.02, 0.25, 0.03, woodD);
        const plaque = add(new T.PlaneGeometry(0.98, 0.21), new T.MeshBasicMaterial({ map: textTexture(cat.name, 512, 110, cat.color, '#fff6e2', 62, 'rgba(255,246,226,.8)') }), x, y0 + CH + 0.2, z + s * (CD / 2 - 0.042));
        plaque.rotation.y = rotY;
        const cs = { id: cat.id, cat, wing: w, x, z, s, y0, quat: new T.Quaternion().setFromAxisAngle(Y_AXIS, rotY), rows: [], done: false };
        cat.series.forEach((se) => {
          const y = y0 + ROW_Y0 + se.row * ROW_DY;
          const lab = add(new T.PlaneGeometry(0.8, 0.066), new T.MeshBasicMaterial({ map: textTexture(se.name, 512, 42, '#3b2a1d', '#f7dfae', 32) }), x, y - 0.026, z + s * (CD / 2 + 0.004));
          lab.rotation.y = rotY;
          cs.rows[se.row] = { se, cs, y, slots: new Array(NV).fill(-1), filled: 0, landed: 0 };
        });
        cases[cat.id] = cs;
        block(x - (IW / 2 + 0.06), x + (IW / 2 + 0.06), z - CD / 2 - 0.02, z + CD / 2 + 0.02, upstairs ? 1 : 0);
      });
      // five lost bookmarks per room
      const c1 = pl.cases[Math.min(1, pl.cases.length - 1)], t0 = pl.tables[0], tL = pl.tables[pl.tables.length - 1];
      [[c1[0], (c1[3] ? pl.upper.y : 0) + 2.42, zOf(c1[1])], [tL[0], 0.32, tL[1]], [0.5, 0.3, hf - 0.5], [t0[0] - 0.74, 0.98, t0[1] + 0.3], [W - 0.5, 0.3, -hf + 0.5]].forEach(([lx, ly, lz], i) => {
        const g = new T.Group();
        g.add(new T.Mesh(markGeo, new T.MeshBasicMaterial({ color: [0xe2574c, 0x5aa9e6, 0xf0c64a, 0x7fc06a, 0xc084d8][i] })));
        const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.setScalar(0.55); g.add(sp);
        g.position.set(x0 + lx, ly, lz); room.add(g);
        marks.push({ id: w * 5 + i, wing: w, group: g, y: ly, got: false });
      });

      // ----- what makes each room its own place -----
      if (w === 0) {
        // The Reading Room: oak panelling, heavy beams, a rug and a fire in the hearth
        for (const sgn of [-1, 1]) { solid(x0 + W / 2, 0.6, sgn * (hf - 0.014), W, 0.84, 0.028, wood); solid(x0 + W / 2, 1.04, sgn * (hf - 0.02), W, 0.07, 0.04, woodD); }
        for (const bx of [W * 0.25, W * 0.5, W * 0.75]) solid(x0 + bx, h - 0.09, 0, 0.2, 0.18, D, woodD);
        rugAt(x0 + W / 2 + 0.3, 0, W - 2.4, 2.0, wg.rug);
        const ST = '#8d8479', STD = '#6f675e';
        solid(x0 + 0.2, 0.7, -0.8, 0.4, 1.4, 0.34, ST); solid(x0 + 0.2, 0.7, 0.8, 0.4, 1.4, 0.34, ST); solid(x0 + 0.2, 1.52, 0, 0.44, 0.26, 1.94, STD);
        solid(x0 + 0.24, 1.69, 0, 0.56, 0.07, 2.2, woodD); solid(x0 + 0.03, 0.7, 0, 0.06, 1.4, 1.3, '#1a1310'); solid(x0 + 0.28, 0.04, 0, 0.6, 0.08, 1.7, STD);
        solid(x0 + 0.13, (1.73 + h) / 2, 0, 0.26, h - 1.73, 1.6, TH.mix(wg.wall, '#000000', 0.12));
        solid(x0 + 0.27, 2.45, 0, 0.03, 0.8, 1.05, woodD); solid(x0 + 0.29, 2.45, 0, 0.02, 0.66, 0.9, '#4f6f5a');
        for (const lz of [-0.22, 0.2]) { const log = cyl(x0 + 0.22, 0.14, lz, 0.07, 0.07, 0.5, '#4a3020', 8); log.rotation.x = Math.PI / 2; log.rotation.z = 0.3; }
        const fm = [new T.MeshBasicMaterial({ color: 0xff8a2a }), new T.MeshBasicMaterial({ color: 0xffc94a }), new T.MeshBasicMaterial({ color: 0xffe9a0 })];
        [[-0.2, 0.34, 0], [0.05, 0.46, 1], [0.24, 0.3, 0], [0.02, 0.26, 2]].forEach(([lz, fh, k]) => { const f = add(new T.ConeGeometry(0.11, fh, 7), fm[k], x0 + 0.22, 0.2 + fh / 2, lz); flames.push({ m: f, y: 0.2, h: fh, p: Math.random() * 6 }); });
        fireLight = new T.PointLight(0xff8a3a, 0.9, 6, 2); fireLight.position.set(x0 + 0.7, 0.6, 0); scene.add(fireLight);
        block(x0, x0 + 0.5, -1.0, 1.0);
      } else if (w === 1) {
        // The Naturalist's Gallery: a tall, bright room with skylights, potted trees and specimen boards
        for (const bx of [W * 0.125, W * 0.375, W * 0.625, W * 0.875]) solid(x0 + bx, h - 0.06, 0, 0.12, 0.12, D, '#f3efe2');
        for (const bx of [W * 0.25, W * 0.5, W * 0.75]) { const sky = add(new T.PlaneGeometry(1.5, 3.0), winMat, x0 + bx, h - 0.012, 0.3); sky.rotation.x = Math.PI / 2; solid(x0 + bx, h - 0.03, 0.3, 0.05, 0.05, 3.0, '#f3efe2'); solid(x0 + bx, h - 0.03, 0.3, 1.5, 0.05, 0.05, '#f3efe2'); }
        for (const sgn of [-1, 1]) solid(x0 + W / 2, 2.95, sgn * (hf - 0.02), W, 0.06, 0.04, '#f3efe2');
        rugAt(x0 + W / 2, -0.6, W - 1.4, 1.5, wg.rug);
        const tree = (lx, lz, tall) => {
          const tx = x0 + lx;
          cyl(tx, 0.23, lz, 0.27, 0.19, 0.46, '#b5653c', 20); cyl(tx, 0.47, lz, 0.3, 0.28, 0.06, '#9c5430', 20); cyl(tx, 0.475, lz, 0.25, 0.25, 0.06, '#2e2117', 16);
          cyl(tx, 0.03, lz, 0.3, 0.3, 0.03, '#9c5430', 20);
          const t1 = add(new T.CylinderGeometry(0.045, 0.07, tall * 0.62, 9), bark, tx + 0.02, 0.48 + tall * 0.31, lz); t1.rotation.z = -0.05;
          const t2 = add(new T.CylinderGeometry(0.03, 0.045, tall * 0.45, 8), bark, tx + 0.02, 0.48 + tall * 0.8, lz + 0.02); t2.rotation.z = 0.09;
          for (const [a, len] of [[0.6, 0.5], [2.6, 0.42], [4.5, 0.46]]) { const br = add(new T.CylinderGeometry(0.014, 0.028, len, 6), bark, tx + Math.cos(a) * len * 0.3, 0.5 + tall * 0.86, lz + Math.sin(a) * len * 0.3); br.rotation.z = -Math.cos(a) * 0.9; br.rotation.x = Math.sin(a) * 0.9; }
          crown(tx, 0.62 + tall, lz, 0.62, 26);
          block(tx - 0.22, tx + 0.22, lz - 0.22, lz + 0.22);
        };
        tree(4.0, 3.05, 1.6); tree(7.4, 2.9, 1.85); tree(0.6, 2.9, 1.7);
        pl.cases.forEach(([cx, czt], k) => { if (k % 2) return; const cz = zOf(czt); cyl(x0 + cx + 0.3, CH + 0.13, cz - 0.02, 0.09, 0.07, 0.14, '#b5653c'); cyl(x0 + cx + 0.3, CH + 0.2, cz - 0.02, 0.1, 0.09, 0.02, '#9c5430'); crown(x0 + cx + 0.3, CH + 0.32, cz - 0.02, 0.2, 9); });
        const board = specimenTexture();
        for (const lx of [2.4, 5.6]) { const fr = add(new T.PlaneGeometry(1.5, 0.9), new T.MeshLambertMaterial({ map: board }), x0 + lx, 3.55, -hf + 0.03); void fr; solid(x0 + lx, 3.55, -hf + 0.012, 1.6, 1.0, 0.02, woodD); }
      } else if (w === 2) {
        // The Scholars' Hall: stone piers, ribbed ceiling, banners, reading desks and a globe
        const SN = '#a8a9b6', SND = '#8a8b99';
        for (const sgn of [-1, 1]) for (const px of [0.25, 3.3, 5.7, W - 0.25]) {
          block(x0 + px - 0.25, x0 + px + 0.25, sgn > 0 ? hf - 0.34 : -hf, sgn > 0 ? hf : -hf + 0.34);
          solid(x0 + px, h / 2, sgn * (hf - 0.14), 0.36, h, 0.28, SN); solid(x0 + px, 0.14, sgn * (hf - 0.16), 0.48, 0.28, 0.34, SND); solid(x0 + px, h - 0.14, sgn * (hf - 0.16), 0.5, 0.28, 0.36, SND);
        }
        for (const bx of [0.25, 3.3, 5.7, W - 0.25]) solid(x0 + bx, h - 0.11, 0, 0.3, 0.22, D, SN);
        for (const bz of [-2, 2]) solid(x0 + W / 2, h - 0.08, bz, W, 0.16, 0.2, SND);
        const banner = (lx, sgn, c1x, c2x) => { solid(x0 + lx, 3.18, sgn * (hf - 0.03), 0.9, 0.05, 0.05, IRON); solid(x0 + lx, 2.55, sgn * (hf - 0.035), 0.78, 1.2, 0.02, c1x); solid(x0 + lx, 2.55, sgn * (hf - 0.05), 0.2, 1.2, 0.02, c2x); solid(x0 + lx, 1.9, sgn * (hf - 0.035), 0.5, 0.14, 0.02, c1x); };
        banner(2.5, -1, '#2f4a86', '#d9b24a'); banner(6.5, -1, '#2f4a86', '#d9b24a'); banner(4.5, 1, '#7a2f3a', '#d9b24a');
        for (const lx of [W * 0.27, W * 0.73]) {      // candle rings under the hanging lights
          const ring = add(new T.TorusGeometry(0.42, 0.025, 6, 20), ironMat, x0 + lx, h - 1.0, 0); ring.rotation.x = Math.PI / 2;
          for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const b = add(bulbGeo, lampMat, x0 + lx + Math.cos(a) * 0.42, h - 0.92, Math.sin(a) * 0.42); b.scale.setScalar(0.42); }
        }
        cyl(x0 + 0.62, 0.45, -3.3, 0.05, 0.16, 0.9, woodD); const globe = ball(x0 + 0.62, 1.2, -3.3, 0.34, '#4f7fa8'); globe.rotation.z = 0.4;
        const land = add(new T.SphereGeometry(0.345, 8, 6, 0.4, 1.6, 0.7, 1.4), lam('#7fa56a'), x0 + 0.62, 1.2, -3.3); spinners.push({ m: land, ax: 'y', sp: 0.15 }); spinners.push({ m: globe, ax: 'y', sp: 0.15 });
        const ring = add(new T.TorusGeometry(0.4, 0.02, 6, 24), lam('#b8893a'), x0 + 0.62, 1.2, -3.3); ring.rotation.x = 0.35;
        block(x0 + 0.3, x0 + 0.95, -3.62, -2.98);
        for (const lz of [-0.775, 0.775]) rugAt(x0 + W / 2, lz, W - 0.8, 0.9, wg.rug);
      } else if (w === 3) {
        // The Curiosity Vault: a painted night ceiling, portholes, brass pipes, turning gears and a great clock
        const BR = '#b8893a', CU = '#a8643a';
        for (const bz of [-3.3, 3.3]) { const p = cyl(x0 + W / 2, h - 0.3, bz, 0.06, 0.06, W, BR, 10); p.rotation.z = Math.PI / 2; for (const bx of [1.5, 5, 8.5]) cyl(x0 + bx, h - 0.15, bz, 0.03, 0.03, 0.3, CU, 8); }
        for (const sgn of [-1, 1]) solid(x0 + W / 2, 1.1, sgn * (hf - 0.02), W, 0.05, 0.04, BR);
        roundRugAt(x0 + 5, 0, 2.1, wg.rug);
        const xe = x0 + W - 0.17, cy = 3.2;          // the far wall; the clock hangs over the doorway
        const face = add(new T.CircleGeometry(0.5, 40), new T.MeshBasicMaterial({ map: clockTexture() }), xe, cy, 0); face.rotation.y = -Math.PI / 2;
        const rim = add(new T.TorusGeometry(0.51, 0.05, 8, 40), lam(BR), xe, cy, 0); rim.rotation.y = Math.PI / 2;
        for (const [len, wd, kind] of [[0.3, 0.045, 'h'], [0.42, 0.03, 'm']]) {
          const pivot = new T.Group(); pivot.position.set(xe - 0.03, cy, 0);
          const hand = new T.Mesh(new T.BoxGeometry(0.02, len, wd), lam('#2b1c10')); hand.position.y = len / 2 - 0.04; pivot.add(hand); room.add(pivot); clockHands[kind] = pivot;
        }
        const gear = (gy, gz, r, c, sp) => {
          const g = new T.Group(), body = new T.Mesh(new T.CylinderGeometry(r, r, 0.06, 24), lam(c)); body.rotation.z = Math.PI / 2; g.add(body);
          const n = Math.round(r * 26);
          for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, t = new T.Mesh(new T.BoxGeometry(0.06, 0.09, 0.07), lam(c)); t.position.set(0, Math.cos(a) * (r + 0.03), Math.sin(a) * (r + 0.03)); t.rotation.x = a; g.add(t); }
          const hub = new T.Mesh(new T.CylinderGeometry(r * 0.28, r * 0.28, 0.1, 12), lam('#3a2a1c')); hub.rotation.z = Math.PI / 2; g.add(hub);
          g.position.set(xe - 0.05, gy, gz); room.add(g); spinners.push({ m: g, ax: 'x', sp });
        };
        gear(1.15, -2.2, 0.42, BR, 0.5); gear(1.62, -2.86, 0.26, CU, -0.81); gear(1.25, 2.3, 0.5, CU, -0.35); gear(1.86, 2.9, 0.3, BR, 0.58); gear(3.2, -1.55, 0.3, CU, 0.4); gear(3.15, 1.6, 0.36, BR, -0.33);
        solid(x0 + 4.9, 0.25, -3.6, 0.5, 0.5, 0.5, '#8a6a4a'); solid(x0 + 5.35, 0.2, -3.62, 0.4, 0.4, 0.4, '#7a5c40'); solid(x0 + 4.95, 0.7, -3.62, 0.4, 0.4, 0.4, '#96754f');
        block(x0 + 4.6, x0 + 5.6, -3.9, -3.3);
        for (const [a, b] of [[-0.25, -0.2], [0.25, -0.2], [0, 0.28]]) { const leg = cyl(x0 + 9.3 + a * 0.6, 0.5, -3.3 + b * 0.6, 0.02, 0.02, 1.05, '#3a2a1c', 6); leg.rotation.z = -a * 0.5; leg.rotation.x = b * 0.5; }
        const tube = cyl(x0 + 9.3, 1.18, -3.3, 0.06, 0.085, 1.0, BR, 12); tube.rotation.z = Math.PI / 2 - 0.5; tube.rotation.y = -0.6;
        block(x0 + 9.05, x0 + 9.55, -3.55, -3.05);
        for (const [lx, lz, c] of [[5, -2.4, 0x9c7bd8], [5, 2.4, 0x62b8a8]]) { solid(x0 + lx, h - 0.45, lz, 0.02, 0.9, 0.02, IRON); const lan = add(new T.SphereGeometry(0.13, 10, 8), new T.MeshBasicMaterial({ color: c }), x0 + lx, h - 0.95, lz); void lan; solid(x0 + lx, h - 0.8, lz, 0.2, 0.03, 0.2, BR); }
      } else if (w === 4) {
        // The Makers' Attic: two floors under a trussed roof. A loft runs along the north side, reached by the stairs;
        // below are the workbench, an easel, a potter's wheel and, in the rafters, kites.
        const beamMat = lam(woodD), rise = 0.8, rl = Math.hypot(hf, rise), ang = Math.atan(rise / hf), H = pl.upper.y;
        for (const bx of [1.0, 3.5, 6.0, 8.5, 11.0]) for (const sgn of [-1, 1]) { const r = add(new T.BoxGeometry(0.14, 0.16, rl), beamMat, x0 + bx, h - 0.12 - rise / 2, sgn * hf / 2); r.rotation.x = sgn * ang; }
        solid(x0 + W / 2, h - 0.08, 0, W, 0.16, 0.18, woodD);
        for (const sgn of [-1, 1]) solid(x0 + W / 2, h - 0.68, sgn * hf / 2, W, 0.12, 0.12, woodD);
        rugAt(x0 + 6, 0.4, 6.0, 1.5, wg.rug);
        // posts and joists under the loft, and two lanterns in its shade
        for (const px of [2.0, 4.3]) { solid(x0 + px, (H - 0.18) / 2, -1.83, 0.14, H - 0.18, 0.14, woodD); block(x0 + px - 0.1, x0 + px + 0.1, -1.93, -1.73); }
        for (const jx of [1.5, 3.5, 5.5, 7.5, 9.5, 11.0]) solid(x0 + jx, H - 0.25, (-hf - 1.9) / 2, 0.1, 0.14, hf - 1.9, woodD);
        for (const lx of [3.0, 9.0]) { solid(x0 + lx, H - 0.36, -3.3, 0.02, 0.36, 0.02, IRON); add(new T.BoxGeometry(0.12, 0.16, 0.12), lampMat, x0 + lx, H - 0.6, -3.3); }
        // the workbench along the east wall, with its tools
        const bx = x0 + W - 0.49, bzc = 2.85;
        solid(bx, 0.9, bzc, 0.6, 0.08, 2.7, woodL); solid(bx, 0.2, bzc, 0.5, 0.04, 2.5, wood);
        for (const lz of [1.62, 2.85, 4.08]) for (const lx of [-0.24, 0.24]) solid(bx + lx, 0.43, lz, 0.09, 0.86, 0.09, wood);
        block(bx - 0.3, x0 + W, 1.5, 4.2);
        solid(bx - 0.2, 1.0, 1.75, 0.2, 0.12, 0.14, '#4a4f57'); solid(bx - 0.2, 1.08, 1.75, 0.03, 0.03, 0.3, IRON);
        solid(bx - 0.05, 0.975, 2.25, 0.09, 0.07, 0.34, '#8a5a34'); solid(bx - 0.05, 1.03, 2.33, 0.05, 0.06, 0.05, '#5d3a20');
        solid(bx + 0.05, 0.99, 2.75, 0.2, 0.1, 0.11, '#b98b55'); solid(bx - 0.14, 0.97, 2.75, 0.26, 0.035, 0.035, '#5d3a20');
        ['#d9534a', '#e8b23a', '#4f8fc0', '#5aa469', '#f2ead8'].forEach((c, k) => { cyl(bx + 0.06, 1.0, 3.15 + k * 0.21, 0.07, 0.06, 0.12, '#d8d2c4', 12); cyl(bx + 0.06, 1.063, 3.15 + k * 0.21, 0.06, 0.06, 0.01, c, 12); });
        solid(x0 + W - 0.165, 1.5, bzc, 0.03, 0.46, 1.5, woodD);
        for (let k = 0; k < 7; k++) { solid(x0 + W - 0.2, 1.47, bzc - 0.6 + k * 0.2, 0.02, 0.2 + (k % 3) * 0.05, 0.03, '#9aa0a8'); solid(x0 + W - 0.2, 1.63, bzc - 0.6 + k * 0.2, 0.03, 0.1, 0.045, '#8a5a34'); }
        // a painting on the easel and another on the wall
        const painting = (sky, hill) => {
          const c = document.createElement('canvas'); c.width = 320; c.height = 240;
          const g2 = c.getContext('2d'), sg = g2.createLinearGradient(0, 0, 0, 150); sg.addColorStop(0, sky[0]); sg.addColorStop(1, sky[1]);
          g2.fillStyle = sg; g2.fillRect(0, 0, 320, 240);
          g2.fillStyle = 'rgba(255,244,200,.9)'; g2.beginPath(); g2.arc(236, 62, 22, 0, 7); g2.fill();
          hill.forEach((col2, i) => { g2.fillStyle = col2; g2.beginPath(); g2.moveTo(0, 240); for (let px = 0; px <= 320; px += 16) g2.lineTo(px, 120 + i * 34 + Math.sin(px * 0.018 * (i + 1) + i * 2) * (22 - i * 5)); g2.lineTo(320, 240); g2.fill(); });
          g2.fillStyle = '#f2ead8'; g2.fillRect(96, 168, 30, 20); g2.fillStyle = '#9c4a3a'; g2.beginPath(); g2.moveTo(92, 168); g2.lineTo(111, 152); g2.lineTo(130, 168); g2.fill();
          for (let i = 0; i < 500; i++) { g2.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.07})`; g2.fillRect(Math.random() * 320, Math.random() * 240, 7, 2); }
          return new T.MeshLambertMaterial({ map: new T.CanvasTexture(c) });
        };
        const ex = x0 + 0.85, ez = 3.2;
        for (const lz of [-0.3, 0.3]) solid(ex, 0.85, ez + lz, 0.05, 1.7, 0.05, woodD);
        { const back = add(new T.BoxGeometry(0.05, 1.6, 0.05), beamMat, ex - 0.26, 0.76, ez); back.rotation.z = -0.32; }
        solid(ex + 0.05, 0.86, ez, 0.1, 0.04, 0.9, woodD); solid(ex + 0.01, 1.22, ez, 0.03, 0.68, 0.86, '#f2ead8');
        { const pic = add(new T.PlaneGeometry(0.8, 0.62), painting(['#8fb8d8', '#f3d9a6'], ['#8fa57a', '#5f8a5c', '#3f6b48']), ex + 0.03, 1.22, ez); pic.rotation.y = Math.PI / 2; }
        block(ex - 0.5, ex + 0.2, ez - 0.45, ez + 0.45);
        solid(x0 + 0.162, 2.0, 2.0, 0.02, 0.78, 1.0, woodD);
        { const pic = add(new T.PlaneGeometry(0.9, 0.68), painting(['#e59a6a', '#f6e2b0'], ['#7a6f9a', '#56567a', '#34405c']), x0 + 0.18, 2.0, 2.0); pic.rotation.y = Math.PI / 2; }
        // the potter's wheel, turning, and a shelf of finished pots, in the shade of the loft
        cyl(x0 + 0.8, 0.26, -3.6, 0.3, 0.34, 0.52, '#7d6a55', 16);
        { const disc = cyl(x0 + 0.8, 0.55, -3.6, 0.3, 0.3, 0.05, '#5d5148', 24), pot = add(new T.CylinderGeometry(0.075, 0.13, 0.24, 14), lam('#b5653c'), x0 + 0.8, 0.695, -3.6); spinners.push({ m: disc, ax: 'y', sp: 1.5 }); spinners.push({ m: pot, ax: 'y', sp: 1.5 }); }
        block(x0 + 0.45, x0 + 1.15, -3.95, -3.25);
        for (const sy of [1.45, 1.95]) { solid(x0 + 0.27, sy, -2.2, 0.22, 0.04, 1.5, wood); [-2.8, -2.45, -2.1, -1.75].forEach((pz, k) => cyl(x0 + 0.27, sy + 0.02 + 0.08 + (k % 2) * 0.03, pz + (sy > 1.5 ? 0.15 : 0), 0.06 + (k % 3) * 0.015, 0.085, 0.16 + (k % 2) * 0.06, ['#b5653c', '#6f8f9a', '#d8c9a0', '#8a5a44'][(k + (sy > 1.5 ? 1 : 0)) % 4], 12)); }
        // a basket of wool
        cyl(x0 + 0.7, 0.15, 1.9, 0.3, 0.24, 0.3, '#b08a52', 16);
        [[0, 0, '#c9584c'], [0.14, 0.1, '#e8c15a'], [-0.13, 0.08, '#5a8fb8'], [0.02, -0.15, '#6fa56a'], [-0.1, -0.1, '#b98bc4']].forEach(([dx, dz, c], k) => ball(x0 + 0.7 + dx, 0.34 + (k ? 0 : 0.08), 1.9 + dz, 0.105, c));
        block(x0 + 0.4, x0 + 1.0, 1.6, 2.2);
        // crates of offcuts up in the loft
        solid(x0 + 11.35, H + 0.25, -4.1, 0.5, 0.5, 0.5, '#8a6a4a'); solid(x0 + 11.3, H + 0.7, -4.12, 0.4, 0.4, 0.4, '#96754f'); solid(x0 + 10.8, H + 0.2, -4.15, 0.4, 0.4, 0.4, '#7a5c40');
        block(x0 + 10.55, x0 + 11.65, -hf, -3.8, 1);
        // kites hung from the rafters
        const kite = (lx, lz, c1, c2, ry) => {
          const g = new T.Group(), km = (c) => new T.MeshLambertMaterial({ color: c, side: T.DoubleSide });
          g.position.set(x0 + lx, h - 0.42, lz); g.rotation.y = ry;
          const sh = new T.Shape(); sh.moveTo(0, -0.1); sh.lineTo(0.26, -0.42); sh.lineTo(0, -0.95); sh.lineTo(-0.26, -0.42); sh.closePath();
          g.add(new T.Mesh(new T.ShapeGeometry(sh), km(c1)));
          const spar = new T.Mesh(new T.BoxGeometry(0.52, 0.012, 0.012), km('#5d3a20')); spar.position.set(0, -0.42, 0.008); g.add(spar);
          const mast = new T.Mesh(new T.BoxGeometry(0.012, 0.85, 0.012), km('#5d3a20')); mast.position.set(0, -0.525, 0.008); g.add(mast);
          const cord = new T.Mesh(new T.BoxGeometry(0.008, 0.36, 0.008), km('#e8dcc0')); cord.position.set(0, 0.08, 0); g.add(cord);
          for (let k = 0; k < 3; k++) { const bow = new T.Mesh(new T.BoxGeometry(0.12, 0.045, 0.008), km(c2)); bow.position.set(k % 2 ? 0.03 : -0.03, -1.05 - k * 0.13, 0); bow.rotation.z = k % 2 ? 0.5 : -0.5; g.add(bow); }
          room.add(g); sways.push({ g, p: Math.random() * 6 });
        };
        kite(3.0, 0.6, '#d9534a', '#f2ead8', 0.5); kite(7.0, 2.6, '#4f8fc0', '#e8b23a', -0.6); kite(10.0, 0.9, '#e8b23a', '#d9534a', 0.2);
      } else if (w === 5) {
        // The Travellers' Cellar: stone piers and ribs, barrels, trunks and a signpost below; up the wide stair, a gallery
        // across the far end with the departures board.
        const SN = '#9a9388', SND = '#7b756b', H = pl.upper.y;
        for (const px of [0.3, 4.6, 8.9, W - 0.3]) {
          solid(x0 + px, h - 0.13, 0, 0.4, 0.26, D, SN);
          for (const sgn of [-1, 1]) {
            solid(x0 + px, h / 2, sgn * (hf - 0.14), 0.4, h, 0.28, SN); solid(x0 + px, 0.14, sgn * (hf - 0.16), 0.5, 0.28, 0.34, SND);
            solid(x0 + px, h - 0.44, sgn * (hf - 0.5), 0.4, 0.36, 0.5, SND); solid(x0 + px, h - 0.78, sgn * (hf - 0.36), 0.4, 0.32, 0.2, SND);
            block(x0 + px - 0.22, x0 + px + 0.22, sgn > 0 ? hf - 0.32 : -hf, sgn > 0 ? hf : -hf + 0.32, -1);
            if (px > 1 && px < 9) { solid(x0 + px, 2.16, sgn * (hf - 0.33), 0.12, 0.03, 0.12, IRON); add(new T.BoxGeometry(0.1, 0.16, 0.1), lampMat, x0 + px, 2.06, sgn * (hf - 0.33)); solid(x0 + px, 1.97, sgn * (hf - 0.33), 0.12, 0.02, 0.12, IRON); }
          }
        }
        rugAt(x0 + 2.7, 0, 4.2, 1.4, wg.rug);
        // posts under the front of the gallery, and lanterns in its shade
        for (const pz of [-4.7, -2.7, 2.7, 4.7]) { solid(x0 + 9.58, (H - 0.18) / 2, pz, 0.16, H - 0.18, 0.16, woodD); block(x0 + 9.46, x0 + 9.7, pz - 0.12, pz + 0.12); }
        for (const lz of [-2.6, 2.6]) { solid(x0 + 11.75, H - 0.36, lz, 0.02, 0.36, 0.02, IRON); add(new T.BoxGeometry(0.12, 0.16, 0.12), lampMat, x0 + 11.75, H - 0.6, lz); }
        // barrels on a rack against the north wall
        const bzc = -hf + 0.56, hoop = lam(IRON), head = lam(woodD);
        const barrel = (lx, y) => {
          const b = cyl(x0 + lx, y, bzc, 0.4, 0.4, 1.0, wood, 20); b.rotation.x = Math.PI / 2;
          const mid = cyl(x0 + lx, y, bzc, 0.425, 0.425, 0.5, wood, 20); mid.rotation.x = Math.PI / 2;
          for (const dz of [-0.36, -0.25, 0.25, 0.36]) { const t = add(new T.TorusGeometry(dz * dz > 0.1 ? 0.405 : 0.43, 0.016, 6, 24), hoop, x0 + lx, y, bzc + dz); void t; }
          const hd = add(new T.CylinderGeometry(0.36, 0.36, 0.02, 20), head, x0 + lx, y, bzc + 0.5); hd.rotation.x = Math.PI / 2;
          cyl(x0 + lx, y - 0.18, bzc + 0.53, 0.025, 0.025, 0.06, '#b8893a', 8).rotation.x = Math.PI / 2;
        };
        for (const lx of [5.9, 6.75, 7.6]) barrel(lx, 0.55); for (const lx of [6.325, 7.175]) barrel(lx, 1.3);
        for (const dz of [-0.3, 0.3]) solid(x0 + 6.75, 0.07, bzc + dz, 2.7, 0.14, 0.12, woodD);
        block(x0 + 5.43, x0 + 8.07, -hf, bzc + 0.58);
        // the map of the country round about
        const mapTex = (() => {
          const c = document.createElement('canvas'); c.width = 640; c.height = 400;
          const g2 = c.getContext('2d'); g2.fillStyle = '#e6d5ac'; g2.fillRect(0, 0, 640, 400);
          for (let i = 0; i < 60; i++) { g2.fillStyle = `rgba(${Math.random() < 0.5 ? '120,90,40' : '255,250,230'},${0.03 + Math.random() * 0.05})`; g2.beginPath(); g2.arc(Math.random() * 640, Math.random() * 400, 20 + Math.random() * 50, 0, 7); g2.fill(); }
          const coast = []; for (let py = 0; py <= 400; py += 20) coast.push([470 + Math.sin(py * 0.021) * 46 + Math.sin(py * 0.07) * 14, py]);
          g2.fillStyle = '#a9c4c9'; g2.beginPath(); g2.moveTo(640, 0); coast.forEach(([px, py]) => g2.lineTo(px, py)); g2.lineTo(640, 400); g2.fill();
          g2.strokeStyle = '#5b4a2e'; g2.lineWidth = 2.5; g2.beginPath(); coast.forEach(([px, py], i) => (i ? g2.lineTo(px, py) : g2.moveTo(px, py))); g2.stroke();
          g2.strokeStyle = '#6f93a8'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(40, 70); g2.bezierCurveTo(160, 120, 240, 240, 330, 220); g2.bezierCurveTo(400, 205, 430, 260, 478, 268); g2.stroke();
          g2.fillStyle = '#8a7a52'; for (const [mx, my] of [[90, 60], [130, 48], [170, 66], [215, 52], [70, 100]]) { g2.beginPath(); g2.moveTo(mx - 20, my + 18); g2.lineTo(mx, my - 16); g2.lineTo(mx + 20, my + 18); g2.fill(); }
          g2.strokeStyle = '#8a3b2e'; g2.lineWidth = 2; g2.setLineDash([9, 7]); g2.beginPath(); g2.moveTo(60, 330); g2.lineTo(200, 300); g2.lineTo(330, 236); g2.lineTo(440, 150); g2.moveTo(330, 236); g2.lineTo(360, 350); g2.stroke(); g2.setLineDash([]);
          g2.fillStyle = '#2b1c10'; g2.textAlign = 'center';
          for (const [name, tx, ty, sz, dot] of [['Emberwick', 330, 262, 24, 1], ['Grey Coast', 556, 200, 19, 0], ['The Northern Fells', 150, 132, 19, 0], ['The Lowlands', 190, 366, 19, 0], ['the marsh', 400, 322, 15, 0]]) { g2.font = `${dot ? 'bold' : 'italic'} ${sz}px Georgia, serif`; g2.fillText(name, tx, ty); if (dot) { g2.beginPath(); g2.arc(330, 236, 6, 0, 7); g2.fill(); } }
          g2.strokeStyle = '#2b1c10'; g2.lineWidth = 2; g2.beginPath(); g2.arc(584, 344, 26, 0, 7); g2.moveTo(584, 308); g2.lineTo(584, 380); g2.moveTo(548, 344); g2.lineTo(620, 344); g2.stroke(); g2.font = 'bold 16px Georgia, serif'; g2.fillText('N', 584, 304);
          g2.lineWidth = 6; g2.strokeStyle = '#5b4a2e'; g2.strokeRect(3, 3, 634, 394);
          return new T.CanvasTexture(c);
        })();
        solid(x0 + 6.75, 2.5, -hf + 0.012, 1.84, 1.16, 0.02, woodD);
        add(new T.PlaneGeometry(1.72, 1.04), new T.MeshLambertMaterial({ map: mapTex }), x0 + 6.75, 2.5, -hf + 0.03);
        // trunks and cases left by travellers, under the gallery
        const tx = x0 + 12.75, tz = -hf + 0.5;
        solid(tx, 0.23, tz, 0.92, 0.46, 0.56, '#7a4a2a'); solid(tx, 0.23, tz, 0.94, 0.06, 0.58, '#3a2618'); solid(tx - 0.22, 0.23, tz + 0.29, 0.07, 0.4, 0.02, '#b8893a'); solid(tx + 0.22, 0.23, tz + 0.29, 0.07, 0.4, 0.02, '#b8893a');
        solid(tx - 0.04, 0.63, tz - 0.02, 0.72, 0.32, 0.46, '#3f5a4a'); solid(tx - 0.04, 0.63, tz + 0.22, 0.2, 0.05, 0.02, '#b8893a');
        solid(tx + 0.06, 0.89, tz, 0.5, 0.2, 0.36, '#a8793a'); solid(tx + 0.06, 1.0, tz, 0.16, 0.03, 0.05, '#3a2618');
        cyl(tx - 0.62, 0.16, tz - 0.1, 0.2, 0.2, 0.32, '#8a3b2e', 18); cyl(tx - 0.62, 0.33, tz - 0.1, 0.21, 0.21, 0.03, '#6a2c22', 18);
        block(tx - 0.85, tx + 0.5, -hf, tz + 0.32);
        // a station bench
        const sbx = x0 + 11.0, sbz = -hf + 0.32;
        solid(sbx, 0.44, sbz, 1.6, 0.06, 0.44, woodL); solid(sbx, 0.82, sbz - 0.22, 1.6, 0.5, 0.05, wood);
        for (const lx of [-0.72, 0.72]) { solid(sbx + lx, 0.21, sbz, 0.07, 0.42, 0.42, IRON); solid(sbx + lx, 0.62, sbz - 0.21, 0.07, 0.4, 0.07, IRON); }
        block(sbx - 0.8, sbx + 0.8, -hf, sbz + 0.26);
        // a signpost that has lost its crossroads
        const sx = x0 + 4.4, sz = 1.5;
        solid(sx, 1.1, sz, 0.09, 2.2, 0.09, '#f2ead8'); solid(sx, 0.05, sz, 0.36, 0.1, 0.36, SND); solid(sx, 2.24, sz, 0.13, 0.08, 0.13, IRON);
        [['GREY COAST 9', 1.96, 0.36], ['THE FELLS 14', 1.7, -0.36], ['EMBERWICK ½', 1.44, 0.36]].forEach(([text, y, off]) => {
          solid(sx, y, sz + off, 0.03, 0.17, 0.74, '#f2ead8');
          const arm = add(new T.PlaneGeometry(0.72, 0.15), new T.MeshBasicMaterial({ map: textTexture(text, 384, 80, '#f2ead8', '#2b1c10', 44) }), sx - 0.017, y, sz + off); arm.rotation.y = -Math.PI / 2;
        });
        block(sx - 0.18, sx + 0.18, sz - 0.18, sz + 0.18);
        // up on the gallery: the departures board on the end wall, and a pile of luggage
        const board = (() => {
          const c = document.createElement('canvas'); c.width = 768; c.height = 384;
          const g2 = c.getContext('2d'); g2.fillStyle = '#1d1a17'; g2.fillRect(0, 0, 768, 384);
          g2.strokeStyle = '#b8893a'; g2.lineWidth = 8; g2.strokeRect(6, 6, 756, 372);
          g2.fillStyle = '#f2d98a'; g2.textAlign = 'center'; g2.font = 'bold 40px Georgia, serif'; g2.fillText('D E P A R T U R E S', 384, 62);
          g2.fillStyle = '#b8893a'; g2.fillRect(60, 84, 648, 3);
          g2.font = '32px Georgia, serif';
          [['Grey Coast', '9.15', 'on time'], ['The Northern Fells', '10.40', 'on time'], ['The Lowlands', '12.05', 'when ready'], ['Emberwick Halt', '— —', 'you are here'], ['Somewhere Else', '4.50', 'cancelled, 1887']].forEach(([to, at2, note], k) => {
            const y = 136 + k * 52; g2.textAlign = 'left'; g2.fillStyle = '#f2ead8'; g2.fillText(to, 70, y); g2.textAlign = 'right'; g2.fillText(at2, 480, y); g2.fillStyle = k > 1 ? '#d98a6a' : '#9ad18a'; g2.fillText(note, 700, y);
          });
          return new T.CanvasTexture(c);
        })();
        solid(x0 + W - 0.165, H + 2.35, 0, 0.03, 1.36, 2.6, woodD);
        { const bd = add(new T.PlaneGeometry(2.48, 1.24), new T.MeshBasicMaterial({ map: board }), x0 + W - 0.185, H + 2.35, 0); bd.rotation.y = -Math.PI / 2; }
        solid(x0 + 13.45, H + 0.25, 0.3, 0.5, 0.5, 0.8, '#7a4a2a'); solid(x0 + 13.45, H + 0.25, 0.3, 0.52, 0.06, 0.82, '#3a2618'); solid(x0 + 13.42, H + 0.66, 0.2, 0.42, 0.3, 0.6, '#3f5a4a'); solid(x0 + 13.4, H + 0.2, -0.6, 0.4, 0.4, 0.5, '#a8793a');
        block(x0 + 13.1, x0 + W, -0.9, 0.75, 1);
      }
    });

    room = scene;
    // Eight lights serve the whole library: they sit in the four rooms nearest to you (see placeLamps).
    for (let i = 0; i < Math.min(8, lampSpots.length); i++) { const lt = new T.PointLight(0xffb463, 1, 11, 2); scene.add(lt); lamps.push(lt); }
    placeLamps(0);
    // Every wall, shelf and table is an instanced box. Wooden pieces get a grain texture with relief; the rest a faint plaster mottle.
    const col = new T.Color(), boxGeo = new T.BoxGeometry(1, 1, 1);
    const woods = new Set(PLANS.flatMap((p) => p.wood).concat(['#8a6a4a', '#7a5c40', '#96754f']));
    const grain = grainTexture();
    woodFine = boxMapped(new T.MeshStandardMaterial({ map: grain, bumpMap: grain, bumpScale: 0.012, roughness: 0.58, metalness: 0 }), 0.55, 1.7, true);
    woodFast = boxMapped(new T.MeshLambertMaterial({ map: grain }), 0.55, 1.7, true);
    const instanced = (list, mat) => {
      const m = new T.InstancedMesh(boxGeo, mat, list.length);
      list.forEach(([x, y, z, sx, sy, sz, c], i) => { _v.set(x, y, z); _s.set(sx, sy, sz); _m.compose(_v, _q.set(0, 0, 0, 1), _s); m.setMatrixAt(i, _m); m.setColorAt(i, col.set(c)); });
      m.frustumCulled = false; scene.add(m); return m;
    };
    fineSwap.push({ mesh: instanced(solids.filter((q) => woods.has(q[6])), woodFine), fine: woodFine, fast: woodFast });
    instanced(solids.filter((q) => !woods.has(q[6])), boxMapped(new T.MeshLambertMaterial({ map: plasterTexture() }), 1.1, 1.1, false));

    // books: a coloured cover box and a cream page block per book
    const box = new T.BoxGeometry(1, 1, 1);
    const bookMat = bookMaterial();
    cover = bookMesh(bookGeometry(), bookMat, NB);
    pages = new T.InstancedMesh(box, new T.MeshLambertMaterial({ map: pageTexture() }), NB);
    pages.frustumCulled = false;
    const inst = cover.geometry.attributes.aInst;
    TH.BOOKS.forEach((def, i) => {
      const se = TH.SERIES[def.series];
      inst.setXYZW(i, se.id % ACOLS, Math.floor(se.id / ACOLS), def.vol, def.gold ? 1 : 0);
      pages.setColorAt(i, col.set(def.gold ? '#f7c948' : '#ffffff'));       // gilt edges
      books.push({ id: i, def, se, st: 'loose', pos: new T.Vector3(), quat: new T.Quaternion(), vis: true, yaw: 0, lx: 0, lz: 0, base: 0.002, top: 0, room: 0 });
    });
    scene.add(cover); scene.add(pages);

    // helpers: highlight boxes, ghost book, wayfinder beacons, sparkles, dust
    hlBook = new T.Mesh(box, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false })); hlBook.visible = false; scene.add(hlBook);
    hlRow = new T.Mesh(new T.PlaneGeometry(IW, ROW_H - 0.02), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide })); hlRow.visible = false; scene.add(hlRow);
    ghost = new T.Mesh(box, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })); ghost.visible = false; scene.add(ghost);
    const beamGeo = new T.CylinderGeometry(0.1, 0.16, 1.3, 10, 1, true);
    for (let i = 0; i < 12; i++) {
      const quad = new T.Mesh(new T.PlaneGeometry(IW, ROW_H - 0.02), new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
      const beam = new T.Mesh(beamGeo, new T.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
      quad.visible = beam.visible = false; scene.add(quad); scene.add(beam); beacons.push({ quad, beam });
    }
    const SP = 240, sg = new T.BufferGeometry();
    sg.setAttribute('position', new T.BufferAttribute(new Float32Array(SP * 3).fill(-99), 3));
    sparks = new T.Points(sg, new T.PointsMaterial({ size: 0.07, map: glowTex, color: 0xffe08a, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    sparks.frustumCulled = false; sparks.userData = { vel: new Float32Array(SP * 3), life: new Float32Array(SP), next: 0, n: SP }; scene.add(sparks);
    const DN = 260, dg = new T.BufferGeometry(), dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) { dp[i * 3] = rand(0, 1); dp[i * 3 + 1] = rand(0.08, 0.92); dp[i * 3 + 2] = rand(-0.5, 0.5); }      // a unit box, stretched to fit the room you are in
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    dust = new T.Points(dg, new T.PointsMaterial({ size: 0.035, map: glowTex, color: 0xfff0cc, transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); dust.frustumCulled = false; scene.add(dust);

    // the books you carry are drawn in their own little scene on top of the view
    handScene = new T.Scene(); handCam = new T.PerspectiveCamera(50, 16 / 9, 0.01, 10);
    handScene.add(new T.AmbientLight(0xffffff, 0.75));
    const hl = new T.DirectionalLight(0xffffff, 0.55); hl.position.set(-0.5, 1, 0.8); handScene.add(hl);
    handGroup = new T.Group(); handScene.add(handGroup);
    handCover = bookMesh(bookGeometry(), bookMat, 12); handPages = new T.InstancedMesh(box, pages.material, 12); handPages.frustumCulled = false;
    handGroup.add(handCover); handGroup.add(handPages);
    for (let i = 0; i < 12; i++) handMeshes.push({ id: -1, pop: 1 });
  }

  // ---------- book transforms ----------
  function write(b) {
    if (!b.vis) { _s.set(0, 0, 0); _m.compose(b.pos, b.quat, _s); cover.setMatrixAt(b.id, _m); pages.setMatrixAt(b.id, _m); dirty = true; return; }
    const se = b.se;
    _s.set(se.t, se.h, se.d); _m.compose(b.pos, b.quat, _s); cover.setMatrixAt(b.id, _m);
    _v.set(0, 0, -0.006).applyQuaternion(b.quat).add(b.pos); _s.set(se.t * 0.8, se.h + 0.008, se.d); _m.compose(_v, b.quat, _s); pages.setMatrixAt(b.id, _m);
    dirty = true;
  }
  function slotPos(b, out) {
    const cs = cases[b.def.cat], se = b.se;
    const lx = (b.def.vol + 0.5 - NV / 2) * se.t, lz = CD / 2 - 0.03 - se.d / 2;
    return out.set(cs.x + cs.s * lx, cs.y0 + ROW_Y0 + se.row * ROW_DY + se.h / 2 + 0.004, cs.z + cs.s * lz);
  }
  const pileQuat = (b, out) => out.setFromAxisAngle(Y_AXIS, b.yaw).multiply(Q_FLAT);
  // Loose books lie flat wherever they were left. One that overlaps an earlier one rests on top of it,
  // so heaps form by themselves and the books above drop when one is pulled out from underneath.
  const REST2 = 0.27 * 0.27, FLOOR = 0.002;
  function settle(w, animate) {
    const list = loose[w];
    for (let i = 0; i < list.length; i++) {
      const b = list[i]; let y = b.base;
      for (let k = 0; k < i; k++) { const o = list[k]; if (o.base !== b.base) continue; const dx = o.lx - b.lx, dz = o.lz - b.lz; if (dx * dx + dz * dz < REST2 && o.top > y) y = o.top; }
      b.top = y + b.se.t;
      const ty = y + b.se.t / 2;
      if (!animate) { b.pos.set(b.lx, ty, b.lz); pileQuat(b, b.quat); b.vis = true; write(b); }
      else if (b.st === 'loose' && (Math.abs(b.pos.y - ty) > 1e-4 || Math.abs(b.pos.x - b.lx) > 1e-4 || Math.abs(b.pos.z - b.lz) > 1e-4) && !anims.some((a) => a.b === b && Math.abs(a.p1.y - ty) < 1e-4))
        fly(b, new T.Vector3(b.lx, ty, b.lz), pileQuat(b, new T.Quaternion()), 0.22, 0);
    }
  }
  const tableAt = (x, z) => tables.find((t) => Math.abs(x - t.x) < 0.8 && Math.abs(z - t.z) < 0.45);
  const inFurniture = (x, z, m, lv) => colliders.some((c) => (c.on || !c.wall) && (c.lv === undefined || c.lv === lv) && x > c.x0 - m && x < c.x1 + m && z > c.z0 - m && z < c.z1 + m);
  // can a book lie here? lv 0 = on the ground floor, 1 = on the upper floor of that room
  const freeFloor = (x, z, lv) => {
    if (!(x > 0.22 && x < LEN - 0.22 && Math.abs(z) < halfAt(x) - 0.22)) return false;
    const w = wingOf(x), up = uppers[w], st = stairsA[w];
    if (st && x > st.x0 - 0.2 && x < st.x1 + 0.2 && z > st.z0 - 0.2 && z < st.z1 + 0.2) return false;          // never on the stairs
    if (lv && !(up && x > up.x0 + 0.25 && x < up.x1 - 0.25 && z > up.z0 + 0.25 && z < up.z1 - 0.25)) return false;
    return !inFurniture(x, z, 0.14, lv || 0);
  };
  const baseOf = (w, lv) => (lv ? uppers[w].y : 0) + FLOOR;
  // scatter a room's books across its floors: singles everywhere, with loose heaps here and there
  function dealRoom(w, list) {
    const pl = PLANS[w], x0 = X0[w], hf = pl.d / 2, up = uppers[w], mine = loose[w];
    const crowd = (x, z, base) => { let n = 0; for (const o of mine) if (o.base === base && (o.lx - x) * (o.lx - x) + (o.lz - z) * (o.lz - z) < REST2) n++; return n; };
    for (const b of TH.shuffle(list)) {
      const heap = mine.length > 0 && Math.random() < 0.14;        // most lie on their own; a few lean on a neighbour
      const upstairs = !!up && Math.random() < pl.upShare;
      let x = x0 + pl.w / 2, z = up ? 2.4 : 2, lv = 0, least = 99;
      for (let k = 0; k < 140; k++) {
        const seed = heap && k < 30 ? mine[(Math.random() * mine.length) | 0] : null, clv = seed ? lvOf(seed.base) : upstairs ? 1 : 0;
        const cx = seed ? seed.lx + rand(-0.22, 0.22) : clv ? rand(up.x0 + 0.3, up.x1 - 0.3) : x0 + rand(0.3, pl.w - 0.3);
        const cz = seed ? seed.lz + rand(-0.22, 0.22) : clv ? rand(up.z0 + 0.3, up.z1 - 0.3) : rand(-hf + 0.3, hf - 0.3);
        if (cx < x0 + 0.26 || cx > x0 + pl.w - 0.26 || !freeFloor(cx, cz, clv) || Math.hypot(cx - 1.05, cz) < 0.55) continue;
        const n = crowd(cx, cz, baseOf(w, clv));
        if (seed ? n <= 2 : n === 0) { x = cx; z = cz; lv = clv; break; }
        if (!seed && n < least) { least = n; x = cx; z = cz; lv = clv; }
      }
      b.st = 'loose'; b.room = w; b.lx = x; b.lz = z; b.base = baseOf(w, lv); b.yaw = rand(0, 6.283); mine.push(b);
    }
  }
  function fly(b, p1, q1, dur, arc, done) {
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i].b === b) anims.splice(i, 1);
    anims.push({ b, p0: b.pos.clone(), q0: b.quat.clone(), p1, q1, t: 0, d: calm() ? Math.min(dur, 0.14) : dur, arc: calm() ? 0 : arc, done });
  }
  function handWorld(out) { return camera.localToWorld(out.set(0.28, -0.3, -0.55)); }

  // ---------- round state ----------
  function newRound() {
    const s = S();
    s.shelved = TH.BOOKS.map(() => 0);                 // every book starts on the floor
    s.paid = {}; s.rowsDone = {}; s.casesDone = {}; s.wingsDone = {}; s.loose = null; s.held = []; s.lay = LAYOUT;
    s.marks = {}; s.gates = {}; s.pos = null; s.started = true; s.charge = {}; s.fx = { golden: 0, way: 0 }; s.streak = 0; s.finaleShown = 0;
    for (const a of TH.ABIL) s.charge[a.id] = Math.floor(a.need * 0.6);
    TH.Save.flush();
  }
  // A save from a smaller library keeps everything it had: the new rooms' books are simply added, loose, and the
  // finale can be earned again. Only a save that fits nothing (or no save at all) starts a fresh round.
  function fitSave() {
    const s = S();
    if (!s.started || !Array.isArray(s.shelved) || !s.shelved.length || s.shelved.length > NB) return newRound();
    if (s.shelved.length < NB) { while (s.shelved.length < NB) s.shelved.push(0); s.finaleShown = 0; TH.Save.commit(); }
    // The rooms changed shape since this save was made: the shelves keep their books, but the loose ones are scattered afresh,
    // and "room restored" is worked out again because rooms now hold different sections.
    if (s.lay !== LAYOUT) {
      s.lay = LAYOUT; s.loose = null; s.pos = null; s.wingsDone = {};
      TH.WINGS.forEach((wg, w) => { if (TH.shelvedCount(w) === wg.books) s.wingsDone[w] = 1; });
      TH.Save.commit();
    }
  }
  function buildState() {
    const s = S();
    epoch++;                                                         // cancels any delayed moves from before
    anims.length = 0; G.held = []; pending = 0; G.streak = s.streak || 0; G.fx = { golden: (s.fx && s.fx.golden) || 0, way: (s.fx && s.fx.way) || 0 };
    for (const list of loose) list.length = 0;
    for (const cs of cases) { cs.done = false; for (const r of cs.rows) { r.slots.fill(-1); r.filled = 0; r.landed = 0; } }
    const seen = new Set();
    for (const b of books) {
      if (s.shelved[b.id]) {
        const row = cases[b.def.cat].rows[b.se.row];
        b.st = 'shelf'; b.vis = true; slotPos(b, b.pos); b.quat.copy(row.cs.quat); write(b);
        row.slots[b.def.vol] = b.id; row.filled++; row.landed++; seen.add(b.id);
      }
    }
    for (const cs of cases) cs.done = cs.rows.every((r) => r.landed === NV);
    // saves from before these existed: whatever is on the shelves has already been paid for and counted
    if (!s.paid) { s.paid = {}; for (const b of books) if (s.shelved[b.id]) s.paid[b.id] = 1; }
    if (!s.rowsDone) {
      s.rowsDone = {}; s.casesDone = {}; s.wingsDone = {};
      for (const cs of cases) { for (const r of cs.rows) if (r.filled === NV) s.rowsDone[r.se.id] = 1; if (cs.done) s.casesDone[cs.id] = 1; }
      for (let w = 0; w < NW; w++) if (cases.every((c) => c.wing !== w || c.done)) s.wingsDone[w] = 1;
    }
    // every loose book goes back exactly where it was left; the ones in your arms stay in your arms
    if (Array.isArray(s.loose)) s.loose.forEach((list, w) => {
      if (w >= NW || !Array.isArray(list)) return;
      for (const e of list) {
        const b = books[e[0]];
        if (!b || seen.has(b.id) || !(e[1] > 0 && e[1] < LEN) || !(Math.abs(e[2]) < halfAt(e[1]))) continue;
        const rw = wingOf(e[1]), t = e[4] === 1 ? tableAt(e[1], e[2]) : null, upst = e[4] === 2 && inRect(uppers[rw], e[1], e[2]);
        b.st = 'loose'; b.room = rw; b.lx = e[1]; b.lz = e[2]; b.yaw = e[3] || 0; b.base = t ? t.top : baseOf(rw, upst ? 1 : 0);
        loose[b.room].push(b); seen.add(b.id);
      }
    });
    for (const id of Array.isArray(s.held) ? s.held : []) {
      const b = books[id];
      if (!b || seen.has(id) || G.held.length >= cap()) continue;
      b.st = 'held'; b.vis = false; write(b); G.held.push(id); seen.add(id);
    }
    const fresh = TH.WINGS.map(() => []);
    for (const b of books) if (!seen.has(b.id)) fresh[b.def.wing].push(b);          // a new library, or anything unaccounted for
    fresh.forEach((list, w) => { if (list.length) dealRoom(w, list); });
    for (let w = 0; w < NW; w++) settle(w, false);
    for (const g of gates) {
      if (TH.shelvedCount(g.idx) / TH.WINGS[g.idx].books >= TH.GATE_AT) s.gates[g.idx] = 1;      // in case the game closed before the door swung
      g.open = !!s.gates[g.idx]; g.group.visible = !g.open; g.col.on = !g.open;
    }
    for (const mk of marks) { mk.got = !!s.marks[mk.id]; mk.group.visible = !mk.got; }
    refreshHand();
    built = true;
    syncSave(false);
  }
  // Write down where everything is. Called after every change, so closing the game at any moment loses nothing.
  function syncSave(now) {
    const s = S();
    s.loose = loose.map((list) => list.map((b) => [b.id, +b.lx.toFixed(3), +b.lz.toFixed(3), +b.yaw.toFixed(2), b.base > 1.5 ? 2 : b.base > 0.1 ? 1 : 0]));    // 0 floor, 1 table, 2 upper floor
    s.held = G.held.slice();
    if (G.mode === 'play') { s.pos = { x: +P.x.toFixed(2), z: +P.z.toFixed(2), y: +P.y.toFixed(2), yaw: +P.yaw.toFixed(3) }; s.fx = { golden: G.fx.golden, way: Math.round(G.fx.way) }; s.streak = G.streak; }
    if (now) TH.Save.flush(); else TH.Save.commit();
  }
  G.sync = syncSave;

  // ---------- setup ----------
  function makeRenderer() {
    const q = TH.Settings.video.quality, aa = q === 'high';
    if (renderer && aa === aaOn) return;
    if (renderer) { renderer.forceContextLoss(); renderer.dispose(); const n = cv.cloneNode(false); cv.replaceWith(n); cv = n; }
    aaOn = aa;
    renderer = new T.WebGLRenderer({ canvas: cv, antialias: aa, powerPreference: 'high-performance' });
    renderer.autoClear = false;
    cv.addEventListener('mousedown', onDown);
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) cv.addEventListener(ev, onTouch, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  G.init = (canvas) => {
    cv = canvas;
    buildWorld();
    makeRenderer();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', () => { mouseDown = false; });
    document.addEventListener('pointerlockchange', onLock);
    document.addEventListener('pointerlockerror', () => { G.locked = false; lockFails++; });
    window.addEventListener('resize', G.resize);
    window.addEventListener('blur', () => { G.keys = {}; mouseDown = false; });
    // write everything down the moment the window is hidden or closed, so nothing is ever lost
    const saveNow = () => { if (built) syncSave(true); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
    window.addEventListener('pagehide', saveNow);
    window.addEventListener('beforeunload', saveNow);
    fitSave();
    buildState();
    G.applyVideo();
    requestAnimationFrame(frame);
  };
  G.resize = () => {
    if (!renderer) return;
    const v = TH.Settings.video, w = cv.clientWidth || 1, h = cv.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, v.quality === 'low' ? 1 : 2);
    renderer.setPixelRatio(dpr * v.renderScale / 100);
    renderer.setSize(w, h, false);
    camera.aspect = handCam.aspect = w / h; camera.fov = v.fov;
    camera.updateProjectionMatrix(); handCam.updateProjectionMatrix();
  };
  G.applyVideo = () => {
    makeRenderer();
    const v = TH.Settings.video, m = TH.mood();
    hemi.color.set(m.sky); hemi.groundColor.set(m.ground); hemi.intensity = m.hemi;
    sun.color.set(m.sun); sun.intensity = m.sunI;
    for (const l of lamps) { l.color.set(m.lamp); l.intensity = m.lampI; l.visible = v.quality !== 'low'; }
    if (v.quality === 'low') hemi.intensity = m.hemi + m.lampI * 0.25;
    lampMat.color.set(m.lamp).lerp(new T.Color(0xffffff), 0.5).multiplyScalar(0.8 + Math.min(1, m.lampI) * 0.2);
    for (const h of halos) h.material.opacity = 0.15 + Math.min(1, m.lampI) * 0.6;
    winMat.color.set(m.win);
    scene.background = new T.Color(m.fog);
    scene.fog = v.quality === 'low' ? null : new T.Fog(m.fog, 9, 46);
    dust.visible = v.quality === 'high' && v.particles;
    for (const f of fineSwap) f.mesh.material = v.quality === 'low' ? f.fast : f.fine;      // relief shading is the costly part
    G.resize();
  };

  G.enter = () => {
    const s = S();
    fitSave();
    buildState();
    const p = s.pos;
    if (p && TH.wingOpen(wingOf(p.x))) { P.x = p.x; P.z = p.z; P.yaw = p.yaw; P.pitch = 0; const gy = groundAt(p.x, p.z, p.y || 0); P.y = gy === null ? 0 : gy; } else { P.x = 1.05; P.z = 0; P.y = 0; P.yaw = -Math.PI / 2; P.pitch = -0.12; }
    camY = P.y;
    // if the saved spot is somehow inside furniture, step out to the nearest clear floor
    const lvP = lvOf(P.y), stuck = (x, z) => groundAt(x, z, P.y) === null || colliders.some((c) => c.on && (c.lv === undefined || c.lv === lvP) && x > c.x0 - PR && x < c.x1 + PR && z > c.z0 - PR && z < c.z1 + PR);
    if (stuck(P.x, P.z)) {
      search: for (let r = 0.1; r < 3; r += 0.1) for (let a = 0; a < 6.28; a += 0.4) {
        const nx = P.x + Math.cos(a) * r, nz = P.z + Math.sin(a) * r;
        if (nx > PR && nx < LEN - PR && Math.abs(nz) < halfAt(nx) - PR && wingOf(nx) === wingOf(P.x) && !stuck(nx, nz)) { P.x = nx; P.z = nz; P.y = camY = groundAt(nx, nz, P.y); break search; }
      }
    }
    G.mode = 'play'; G.paused = false; aimKey = '';
    TH.UI.hud();
    if (TH.shelvedCount() === NB && !s.finaleShown) setTimeout(() => { if (G.mode === 'play') TH.UI.finale(); }, 1500);
    TH.UI.tip('move', 'Look around with the mouse and walk with W A S D. Point at a book on the floor and click to pick it up.');
  };
  G.stop = () => { syncSave(true); G.mode = 'menu'; G.paused = false; G.aim = null; hideAim(); if (document.pointerLockElement) document.exitPointerLock(); TH.Save.flush(); };
  G.pause = (p) => { G.paused = p; G.keys = {}; mouseDown = false; stick.x = stick.y = 0; if (p) { savePos(); if (document.pointerLockElement) document.exitPointerLock(); } };
  G.reshuffle = () => { S().stats.rounds++; newRound(); TH.checkAch(); };
  G.rebuild = () => { fitSave(); buildState(); };
  G.lock = () => {
    if (G.mode !== 'play' || G.paused || document.pointerLockElement === cv) return;
    try { if (!cv.requestPointerLock) { lockFails = 2; return; } const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { lockFails = 2; /* not available: drag-to-look still works */ }
  };
  function savePos() { if (G.mode === 'play') syncSave(false); }

  // ---------- input ----------
  function onLock() {
    const was = G.locked;
    G.locked = document.pointerLockElement === cv;
    if (G.locked) { lockFails = 0; lockAt = performance.now(); }
    if (was && !G.locked && G.mode === 'play' && !G.paused) TH.UI.autoPause();
    TH.UI.lockHint();
  }
  function onMove(e) {
    if (G.mode !== 'play' || G.paused) return;
    if (!G.locked && !(e.buttons & 2)) return;          // without mouse capture, hold the right button to look
    if (G.locked && performance.now() - lockAt < 150) return;      // browsers can report one wild jump as the mouse is captured
    const k = 0.0022 * TH.Settings.controls.sens / 100;
    P.yaw -= e.movementX * k;
    P.pitch = clamp(P.pitch - e.movementY * k * (TH.Settings.controls.invertY ? -1 : 1), -1.45, 1.45);
  }
  // touch: drag the left half to walk, the right half to look, tap to pick up or shelve
  function onTouch(e) {
    e.preventDefault(); TH.Audio.init();
    if (!G.touch) { G.touch = true; document.body.classList.add('touch'); TH.UI.lockHint(); }
    if (G.mode !== 'play' || G.paused) return;
    for (const t of e.changedTouches) {
      if (e.type === 'touchstart') touches[t.identifier] = { side: t.clientX < window.innerWidth / 2 ? 'move' : 'look', x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, t0: performance.now(), far: 0 };
      const o = touches[t.identifier]; if (!o) continue;
      const dx = t.clientX - o.x, dy = t.clientY - o.y; o.x = t.clientX; o.y = t.clientY; o.far += Math.abs(dx) + Math.abs(dy);
      if (e.type === 'touchmove') {
        if (o.side === 'look') { const k = 0.006 * TH.Settings.controls.sens / 100; P.yaw -= dx * k; P.pitch = clamp(P.pitch - dy * k * (TH.Settings.controls.invertY ? -1 : 1), -1.45, 1.45); }
        else { stick.x = clamp((o.x - o.x0) / 60, -1, 1); stick.y = clamp((o.y0 - o.y) / 60, -1, 1); }
      } else if (e.type !== 'touchstart') {
        if (o.side === 'move') { stick.x = 0; stick.y = 0; }
        if (e.type === 'touchend' && performance.now() - o.t0 < 300 && o.far < 14) G.interact();
        delete touches[t.identifier];
      }
    }
  }
  function onDown(e) {
    TH.Audio.init();
    if (G.mode !== 'play' || G.paused) return;
    // The click that captures the mouse must not also act (it could break a streak). If capture keeps failing, clicks act anyway.
    if (!G.locked) { G.lock(); if (e.button !== 0 || lockFails < 2) return; }
    if (e.button === 0) { mouseDown = true; repeatT = 0.3; lastOk = G.interact(); }
    else if (e.button === 2 && G.locked) G.grabAll();
  }

  // ---------- picking ----------
  function rayBox(ox, oy, oz, dx, dy, dz, x0, x1, y0, y1, z0, z1) {
    let t0 = 0, t1 = 1e9;
    for (let a = 0; a < 3; a++) {
      const o = a === 0 ? ox : a === 1 ? oy : oz, d = a === 0 ? dx : a === 1 ? dy : dz;
      const lo = a === 0 ? x0 : a === 1 ? y0 : z0, hi = a === 0 ? x1 : a === 1 ? y1 : z1;
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return -1; continue; }
      let a0 = (lo - o) / d, a1 = (hi - o) / d;
      if (a0 > a1) { const tmp = a0; a0 = a1; a1 = tmp; }
      if (a0 > t0) t0 = a0;
      if (a1 < t1) t1 = a1;
      if (t0 > t1) return -1;
    }
    return t0;
  }
  function pick() {
    const o = camera.position, d = camera.getWorldDirection(_v2), R = reach();
    let best = null, bt = R;
    const cw = wingOf(o.x), lim = (R + 0.3) * (R + 0.3);
    // table tops, upper floors and stairs hide whatever is behind them
    for (const oc of occluders) { if (oc[0] > o.x + R + 1 || oc[1] < o.x - R - 1) continue; const tt = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, oc[0], oc[1], oc[2], oc[3], oc[4], oc[5]); if (tt > 0 && tt < bt) { bt = tt; best = null; } }
    for (let w = Math.max(0, cw - 1); w <= Math.min(NW - 1, cw + 1); w++) for (const b of loose[w]) {
      if (b.st !== 'loose') continue;
      const ex = b.pos.x - o.x, ez = b.pos.z - o.z; if (ex * ex + ez * ez > lim) continue;
      // the ray in the book's own frame: it lies flat, turned by its yaw
      const cs = Math.cos(b.yaw), sn = Math.sin(b.yaw);
      const t = rayBox(-(cs * ex - sn * ez), o.y - b.pos.y, -(sn * ex + cs * ez), cs * d.x - sn * d.z, d.y, sn * d.x + cs * d.z,
        -b.se.h / 2, b.se.h / 2, -b.se.t / 2, b.se.t / 2, -b.se.d / 2, b.se.d / 2);
      if (t < 0 || t >= bt) continue;
      bt = t; best = { type: 'pile', book: b };
    }
    for (const cs of cases) {
      if (Math.abs(cs.x - o.x) > R + 0.6) continue;
      const lox = (o.x - cs.x) * cs.s, loz = (o.z - cs.z) * cs.s, ldx = d.x * cs.s, ldz = d.z * cs.s;
      for (const row of cs.rows) {
        const t = rayBox(lox, o.y, loz, ldx, d.y, ldz, -IW / 2, IW / 2, row.y, row.y + ROW_H, -CD / 2, CD / 2);
        if (t < 0 || t >= bt) continue;
        const slot = clamp(Math.floor((lox + ldx * t) / row.se.t + NV / 2), 0, NV - 1);
        bt = t; best = { type: 'row', row, cs, slot, book: row.slots[slot] >= 0 && books[row.slots[slot]].st === 'shelf' ? books[row.slots[slot]] : null };
      }
    }
    for (const mk of marks) {
      if (mk.got) continue;
      const g = mk.group.position, ex = g.x - o.x, ey = g.y - o.y, ez = g.z - o.z, tc = ex * d.x + ey * d.y + ez * d.z;
      if (tc < 0 || tc >= bt) continue;
      if (ex * ex + ey * ey + ez * ez - tc * tc < 0.05) { bt = tc; best = { type: 'mark', mark: mk }; }
    }
    for (const c of colliders) {
      if (!c.wall || !c.on) continue;
      const t = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, c.x0, c.x1, 0, 12, c.z0, c.z1);
      if (t >= 0 && t < bt) { const g = gates.find((x) => x.col === c); bt = t; best = g ? { type: 'gate', gate: g } : null; }
    }
    if (best && best.type === 'row') {
      const fits = G.held.filter((id) => books[id].se === best.row.se);
      let cand = -1;
      if (TH.Settings.game.exact) cand = fits.find((id) => books[id].def.vol === best.slot);
      else { let bd = 99; for (const id of fits) { const dd = Math.abs(books[id].def.vol - best.slot); if (dd < bd) { bd = dd; cand = id; } } }
      best.fits = fits; best.cand = cand == null ? -1 : cand;
    }
    return best;
  }
  function hideAim() { hlBook.visible = hlRow.visible = ghost.visible = false; }
  function showAim() {
    const a = G.aim;
    hideAim();
    let key = 'none', title = '', hint = '', tone = '';
    if (a && a.type === 'pile') {
      const b = a.book, full = G.held.length + pending >= cap();
      hlBook.visible = true; hlBook.position.copy(b.pos); hlBook.quaternion.copy(b.quat); hlBook.scale.set(b.se.t + 0.012, b.se.h + 0.02, b.se.d + 0.02);
      title = TH.bookTitle(b.def); hint = (b.def.gold ? 'Gilded · ' : '') + TH.CATS[b.def.cat].name + (full ? ' · your hands are full' : ' · click to pick up') + ` · ${TH.UI.keyLabel('read')} to read`;
      if (G.held.length) hint += ` · ${TH.UI.keyLabel('drop')} drops one here`;
      tone = full ? 'warn' : ''; key = 'p' + b.id + full;
    } else if (a && a.type === 'row') {
      const row = a.row, cs = a.cs, se = row.se;
      hlRow.visible = true; hlRow.position.set(cs.x, row.y + ROW_H / 2, cs.z + cs.s * (CD / 2 + 0.006)); hlRow.quaternion.copy(cs.quat);
      hlRow.material.color.set(a.cand >= 0 ? 0x9df08a : a.fits.length ? 0xffe08a : 0xffffff); hlRow.material.opacity = a.cand >= 0 ? 0.13 : 0.05;
      title = `${cs.cat.name} › ${se.name}`; hint = `${row.filled}/${NV} shelved`;
      if (a.cand >= 0) {
        const b = books[a.cand];
        ghost.visible = true; slotPos(b, ghost.position); ghost.quaternion.copy(cs.quat); ghost.scale.set(se.t, se.h, se.d); ghost.material.color.set(se.color);
        hint += ` · click to shelve Vol. ${TH.ROMAN[b.def.vol]}`; tone = 'good';
      } else if (a.fits.length) {
        const b = books[a.fits[0]], dir = b.def.vol < a.slot ? 'left' : 'right';
        hint += ` · Vol. ${TH.ROMAN[b.def.vol]} goes further ${dir} (gap ${b.def.vol + 1})`; tone = 'warn';
      } else if (G.held.length) hint += ' · nothing you carry goes here';
      if (a.book && a.cand < 0) {
        const b = a.book;
        hlBook.visible = true; hlBook.position.copy(b.pos); hlBook.quaternion.copy(b.quat); hlBook.scale.set(b.se.t + 0.006, b.se.h + 0.012, b.se.d + 0.012);
        title = TH.bookTitle(b.def); hint = `${cs.cat.name} · on its shelf · ${TH.UI.keyLabel('read')} to read · ${G.held.length ? 'right-click' : 'click'} to take it down` + (a.fits.length ? '' : G.held.length ? ' · nothing you carry goes here' : ''); tone = '';
      }
      key = 'r' + se.id + '|' + a.cand + '|' + a.slot * (TH.Settings.game.exact ? 1 : 0) + '|' + row.filled + '|' + G.held.length + '|' + (a.book ? a.book.id : -1);
    } else if (a && a.type === 'mark') { title = 'A lost bookmark'; hint = 'Click to pick it up'; tone = 'good'; key = 'm' + a.mark.id; }
    else if (a && a.type === 'gate') {
      const w = a.gate.idx, pct = Math.floor(TH.shelvedCount(w) / TH.WINGS[w].books * 100);
      title = 'Locked — ' + TH.WINGS[w + 1].name; hint = `Shelve ${Math.round(TH.GATE_AT * 100)}% of ${TH.WINGS[w].name} to open it (${pct}% so far)`; tone = 'warn'; key = 'g' + w + pct;
    }
    if (key !== aimKey) { aimKey = key; TH.UI.target(title, hint, tone); }
  }

  // ---------- actions ----------
  function takeLoose(b) {
    const list = loose[b.room], i = list.indexOf(b);
    if (i >= 0) list.splice(i, 1);
    if (b.base < 0.1 || b.base > 1.5) S().stats.piles++;       // counts books picked up off a floor (either one), not off a table
    b.st = 'held'; b.vis = false; write(b);
    for (let k = anims.length - 1; k >= 0; k--) if (anims[k].b === b) anims.splice(k, 1);
    G.held.push(b.id);
    settle(b.room, true);
    S().stats.mostHeld = Math.max(S().stats.mostHeld, G.held.length);
    return b;
  }
  // take a book back down from its shelf
  function takeShelved(b) {
    if (b.st !== 'shelf') return false;
    if (G.held.length + pending >= cap()) { TH.Audio.play('deny'); TH.UI.flash('Your hands are full'); return false; }
    const s = S(), row = cases[b.def.cat].rows[b.se.row];
    if (row.landed !== row.filled) return false;                      // a book is still on its way into this row: let it land first
    row.slots[b.def.vol] = -1; row.filled--; row.landed--; row.cs.done = false; s.shelved[b.id] = 0;
    b.st = 'held'; b.vis = false; write(b); G.held.push(b.id);
    s.stats.mostHeld = Math.max(s.stats.mostHeld, G.held.length);
    TH.Audio.play('pick'); refreshHand(); syncSave(false); TH.UI.hud(); aimKey = '';
    return true;
  }
  // where a book would land if you let go: on the book, table or floor you are looking at, else at your feet
  function dropSpot() {
    const o = camera.position, d = camera.getWorldDirection(_v2), a = G.aim;
    if (a && a.type === 'pile') return { x: a.book.lx + rand(-0.06, 0.06), z: a.book.lz + rand(-0.06, 0.06), base: a.book.base };
    const here = wingOf(P.x), lv = lvOf(P.y), up = uppers[here];
    if (inRect(stairsA[here], P.x, P.z)) return null;                  // not while standing on the stairs
    let bt = reach() + 0.4, spot = null;
    if (!lv) for (const t of tables) {
      if (t.wing !== here) continue;                                  // never through a wall or a locked door
      const tt = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, t.x - 0.8, t.x + 0.8, 0.72, t.top, t.z - 0.45, t.z + 0.45);
      if (tt >= 0 && tt < bt) { bt = tt; spot = { x: clamp(o.x + d.x * tt, t.x - 0.64, t.x + 0.64), z: clamp(o.z + d.z * tt, t.z - 0.3, t.z + 0.3), base: t.top }; }
    }
    if (d.y < -0.05) for (const flv of lv ? [1, 0] : [0]) {            // the floor you stand on; from upstairs, also the one below, past the rail
      const fy = baseOf(here, flv), tt = (o.y - fy) / -d.y, x = o.x + d.x * tt, z = o.z + d.z * tt, there = wingOf(x);
      if (tt >= bt || (flv ? !inRect(up, x, z) : lv && inRect(up, x, z))) continue;
      // only into the room you are in, or through a doorway that is open: never past a locked door
      if (freeFloor(x, z, flv) && (there === here || (!flv && Math.abs(z) < DOOR_W / 2 - 0.15 && TH.wingOpen(Math.max(here, there))))) { spot = { x, z, base: baseOf(here, flv) }; bt = tt; }
    }
    if (!spot) {
      const x = P.x - Math.sin(P.yaw) * 0.6, z = P.z - Math.cos(P.yaw) * 0.6, ok = freeFloor(x, z, lv) && wingOf(x) === here;
      spot = { x: ok ? x : P.x, z: ok ? z : P.z, base: baseOf(here, lv) };
    }
    return spot;
  }
  G.drop = () => {
    if (G.mode !== 'play' || G.paused) return false;
    if (!G.held.length) { TH.UI.flash('You are not carrying anything'); return false; }
    const spot = dropSpot();
    if (!spot) { TH.UI.flash('Not on the stairs — find a floor first'); return false; }
    const b = books[G.held.pop()];
    b.st = 'loose'; b.room = wingOf(spot.x); b.lx = spot.x; b.lz = spot.z; b.base = spot.base; b.yaw = rand(0, 6.283);
    b.vis = true; handWorld(b.pos); pileQuat(b, b.quat);
    loose[b.room].push(b); settle(b.room, true);
    TH.Audio.play('drop'); refreshHand(); syncSave(false); TH.UI.hud(); aimKey = '';
    return true;
  };
  // `repeat` is true for hold-to-repeat: it may only do something valid, never complain or cost a streak.
  G.interact = (repeat) => {
    const a = G.aim;
    if (G.mode !== 'play' || G.paused || !a) return false;
    if (a.type === 'pile') {
      if (a.book.st !== 'loose') return false;                        // the aim is from an earlier frame
      if (repeat && G.held.length + pending >= cap()) return false;
      if (G.held.length + pending >= cap()) { TH.Audio.play('deny'); TH.UI.flash('Your hands are full — shelve some first'); return false; }
      takeLoose(a.book);
      TH.Audio.play('pick'); refreshHand(); syncSave(false); TH.checkAch(); TH.UI.hud(); aimKey = '';
      if (G.held.length === 1) TH.UI.tip('shelve', `Now find the bookcase with that section’s name on top, point at the shelf for its series, and click. Curious what’s inside? Press ${TH.UI.keyLabel('read')} to read any book.`);
      return true;
    }
    if (a.type === 'row') {
      if (a.cand >= 0) { if (!G.held.includes(a.cand)) return false; shelve(books[a.cand], true); return true; }
      if (repeat) return false;
      if (!G.held.length) { if (a.book) takeShelved(a.book); else TH.UI.flash('Pick up some books first'); return false; }
      if (a.fits.length) { TH.Audio.play('deny'); return false; }           // exact mode: right shelf, wrong gap
      G.streak = 0; S().stats.mistakes++; TH.Audio.play('wrong');
      TH.UI.flash('None of those belong on this shelf'); TH.checkAch(); TH.UI.hud();
      return false;
    }
    if (repeat) return false;
    if (a.type === 'mark') {
      const mk = a.mark; if (mk.got) return false; mk.got = true; mk.group.visible = false;
      S().marks[mk.id] = 1; S().stats.marks++; TH.Save.earn(25); syncSave(false);
      TH.Audio.play('gold'); burst(mk.group.position, 22);
      TH.UI.flash('Lost bookmark found! +25 coins', 'good'); TH.checkAch(); TH.UI.hud(); aimKey = '';
      return false;
    }
    if (a.type === 'gate') { TH.Audio.play('deny'); return false; }
    return false;
  };
  // open a book: the one under the crosshair (in a pile or on a shelf), otherwise the last one you picked up
  G.read = () => {
    if (G.mode !== 'play' || G.paused) return;
    const a = G.aim;
    const id = a && a.type === 'pile' ? a.book.id : a && a.type === 'row' && a.book ? a.book.id : G.held.length ? G.held[G.held.length - 1] : -1;
    if (id < 0) { TH.UI.flash('Point at a book, or pick one up, to read it'); return; }
    TH.UI.openBook(id);
  };
  // take every book in the pile that belongs to the same section as the one you point at
  // right-click: on a loose book, gather every nearby book of the same section; on a shelf, take that book down
  G.grabAll = () => {
    const a = G.aim;
    if (G.mode !== 'play' || G.paused || !a) return;
    if (a.type === 'row') { if (a.book) takeShelved(a.book); return; }
    if (a.type !== 'pile' || a.book.st !== 'loose') return;
    const cat = a.book.def.cat, c0 = a.book;
    const near = loose[c0.room].filter((b) => b.st === 'loose' && b.def.cat === cat && lvOf(b.base) === lvOf(c0.base) && Math.hypot(b.lx - c0.lx, b.lz - c0.lz) < 0.75)
      .sort((p, q) => Math.hypot(p.lx - c0.lx, p.lz - c0.lz) - Math.hypot(q.lx - c0.lx, q.lz - c0.lz));
    let n = 0;
    for (const b of near) { if (G.held.length + pending >= cap()) break; takeLoose(b); n++; }
    if (!n) { TH.Audio.play('deny'); TH.UI.flash('Your hands are full — shelve some first'); return; }
    TH.Audio.play('pick'); refreshHand(); syncSave(false); TH.checkAch(); TH.UI.hud(); aimKey = '';
  };
  function shelve(b, manual, delay) {
    if (b.st !== 'held') return;                                       // already on its way (two inputs in one frame)
    const s = S(), row = cases[b.def.cat].rows[b.se.row];
    const i = G.held.indexOf(b.id); if (i >= 0) G.held.splice(i, 1);
    b.st = 'fly'; b.vis = true; handWorld(b.pos); pileQuat(b, b.quat).premultiply(_q.setFromAxisAngle(Y_AXIS, P.yaw));
    row.slots[b.def.vol] = b.id; row.filled++;
    // Putting a book back that was taken down earns nothing: it was paid for the first time.
    const first = !s.paid[b.id]; s.paid[b.id] = 1; s.shelved[b.id] = 1;
    let gain = 0;
    if (first) {
      s.stats.placed++; G.streak++; s.stats.bestStreak = Math.max(s.stats.bestStreak, G.streak);
      gain = 2 + Math.min(3, Math.floor(G.streak / 5));
      if (manual && TH.Settings.game.exact) gain += 1;
      if (G.fx.golden > 0) { gain *= 2; G.fx.golden--; }
      if (b.def.gold) { gain += 15; s.stats.golds++; s.goldFound[b.id] = 1; }
      TH.Save.earn(gain);
    }
    const ev = {};
    if (row.filled === NV) {
      // Each reward is paid once, but each is checked on its own: a bookcase can be finished by putting back
      // a book taken down from a row that was already complete.
      const cs = row.cs, full = (c) => c.rows.every((r) => r.filled === NV);
      if (!s.rowsDone[b.se.id]) { s.rowsDone[b.se.id] = 1; ev.row = true; s.stats.rows++; TH.Save.earn(15); ev.knack = TH.ABIL.find((a) => a.unlock === s.stats.rows); }
      if (full(cs)) {
        if (!s.casesDone[cs.id]) { s.casesDone[cs.id] = 1; ev.cs = true; s.stats.cases++; TH.Save.earn(60); }
        if (!s.wingsDone[cs.wing] && cases.every((c) => c.wing !== cs.wing || full(c))) { s.wingsDone[cs.wing] = 1; ev.wing = true; s.stats.wings++; TH.Save.earn(250); }
      }
    }
    if (manual && first) for (const a of TH.ABIL) { if (!TH.abilUnlocked(a) || s.charge[a.id] >= a.need) continue; if (++s.charge[a.id] >= a.need) TH.Audio.play('ready'); }
    const to = slotPos(b, new T.Vector3()), streak = G.streak;
    const dur = clamp(b.pos.distanceTo(to) / 7, 0.3, 1.1);
    const go = () => fly(b, to, row.cs.quat.clone(), dur, 0.22, () => land(b, row, gain, streak, ev)), ep = epoch;
    if (delay) { b.vis = false; write(b); setTimeout(() => { if (b.st === 'fly' && ep === epoch) { b.vis = true; handWorld(b.pos); go(); } }, delay * 1000); } else go();
    refreshHand(); syncSave(false); TH.UI.hud(); aimKey = '';
    if (first && (G.streak === 10 || G.streak === 25 || G.streak === 50 || G.streak === 100)) TH.UI.flash(`Streak ×${G.streak}!`, 'good');
  }
  function land(b, row, gain, streak, ev) {
    const s = S();
    b.st = 'shelf'; row.landed++;
    TH.Audio.play('place', streak);
    burst(b.pos, b.def.gold ? 16 : 5);
    if (b.def.gold) { TH.Audio.play('gold'); TH.UI.flash(`Gilded book! +${gain} coins`, 'good'); TH.UI.tip('gold', 'Gilded books are rare and pay a big bonus when shelved.'); }
    if (s.stats.placed === 1) TH.UI.tip('streak', 'Keep shelving without trying a wrong shelf to build a streak — a longer streak pays more per book.');
    if (ev.row || ev.cs || ev.wing) {
      const cs = row.cs;
      TH.Audio.play('bin');
      for (let v = 0; v < NV; v++) if (row.slots[v] >= 0) burst(slotPos(books[row.slots[v]], _v), 4);
      cs.done = cs.rows.every((r) => r.filled === NV);
      if (ev.cs) {
        TH.UI.banner(cs.cat.name + ' is complete!', `A whole bookcase in order · +${ev.row ? 75 : 60} coins`);
        TH.Audio.play('level'); burst(_v.set(cs.x, cs.y0 + CH + 0.3, cs.z), 40);
      } else if (ev.row) TH.UI.banner('Row complete', row.se.name + ' · +15 coins');
      if (ev.wing) { const show = () => TH.UI.banner(TH.WINGS[cs.wing].name + ' restored!', 'Every book back where it belongs · +250 coins'); if (ev.cs) setTimeout(show, 2600); else show(); }
      const newly = ev.knack;
      if (newly) setTimeout(() => { TH.UI.banner('New knack: ' + newly.name, newly.desc(newly.vals[0])); TH.Audio.play('ach'); TH.UI.hudBuild(); TH.UI.hud(); }, 2700);
    }
    for (const g of gates) {
      if (g.open || TH.shelvedCount(g.idx) / TH.WINGS[g.idx].books < TH.GATE_AT) continue;
      g.open = true; g.col.on = false; g.group.visible = false; s.gates[g.idx] = 1;
      TH.Audio.play('ach'); burst(_v.set(g.x, 1.3, 0), 40);
      setTimeout(() => TH.UI.banner('A door unlocks', TH.WINGS[g.idx + 1].name + ' is open'), 400);
    }
    TH.Save.commit(); TH.checkAch(); TH.UI.hud(); aimKey = '';
    if (TH.shelvedCount() === NB && !books.some((x) => x.st === 'fly')) setTimeout(() => { if (G.mode === 'play') TH.UI.finale(); }, 3200);
  }

  G.useAbility = (i) => {
    const a = TH.ABIL[i], s = S();
    if (!a || G.mode !== 'play' || G.paused || !TH.abilUnlocked(a)) return;
    if (s.charge[a.id] < a.need) { TH.Audio.play('deny'); return; }
    const v = TH.abilVal(a);
    if (a.id === 'gather') {
      const aim = G.aim;
      if (!aim || aim.type !== 'row') { TH.Audio.play('deny'); TH.UI.flash('Look at a bookcase first'); return; }
      const room = cap() - G.held.length - pending, cat = aim.cs.cat.id, got = [];
      if (room <= 0) { TH.Audio.play('deny'); TH.UI.flash('Your hands are full'); return; }
      const want = Math.min(v, room);
      for (let w = 0; w < NW && got.length < want; w++) { if (!TH.wingOpen(w)) continue; for (let k = loose[w].length - 1; k >= 0 && got.length < want; k--) if (loose[w][k].def.cat === cat && loose[w][k].st === 'loose') got.push(loose[w].splice(k, 1)[0]); }
      if (!got.length) { TH.Audio.play('deny'); TH.UI.flash('No loose ' + aim.cs.cat.name + ' books left to call'); return; }
      const ep = epoch, rooms = new Set();
      got.forEach((b, k) => {
        rooms.add(b.room); b.st = 'fly'; pending++;
        setTimeout(() => ep === epoch && fly(b, handWorld(new T.Vector3()), b.quat.clone(), 0.45, 0.35, () => { pending--; b.st = 'held'; b.vis = false; write(b); G.held.push(b.id); s.stats.mostHeld = Math.max(s.stats.mostHeld, G.held.length); refreshHand(); syncSave(false); TH.UI.hud(); aimKey = ''; TH.Audio.play('pick'); }), k * 70);
      });
      for (const w of rooms) settle(w, true);
      s.stats.gatherBest = Math.max(s.stats.gatherBest, got.length);
    } else if (a.id === 'tidy') {
      const list = G.held.slice(0, v);
      if (!list.length) { TH.Audio.play('deny'); TH.UI.flash('You aren’t carrying anything'); return; }
      list.forEach((id, k) => shelve(books[id], false, k * 0.09));
    } else if (a.id === 'golden') G.fx.golden += v;
    else if (a.id === 'way') G.fx.way += v;
    s.charge[a.id] = 0; s.stats.abilUses++;
    TH.Audio.play('ability'); TH.UI.flash(a.name + '!', 'good');
    TH.checkAch(); TH.UI.hud();
  };

  // ---------- effects ----------
  function burst(pos, n) {
    if (!TH.Settings.video.particles) return;
    const u = sparks.userData, arr = sparks.geometry.attributes.position.array;
    if (TH.Settings.video.quality === 'low') n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const k = u.next; u.next = (u.next + 1) % u.n;
      arr[k * 3] = pos.x + rand(-0.05, 0.05); arr[k * 3 + 1] = pos.y + rand(-0.1, 0.1); arr[k * 3 + 2] = pos.z + rand(-0.05, 0.05);
      u.vel[k * 3] = rand(-0.9, 0.9); u.vel[k * 3 + 1] = rand(0.3, 1.8); u.vel[k * 3 + 2] = rand(-0.9, 0.9); u.life[k] = rand(0.5, 1.1);
    }
  }
  function refreshHand() {
    let h = 0;
    const inst = handCover.geometry.attributes.aInst;
    handMeshes.forEach((m, i) => {
      const id = G.held[i];
      if (id == null) { m.id = -1; return; }
      const b = books[id], se = b.se;
      if (m.id !== id) { m.id = id; m.pop = 0; }
      inst.setXYZW(i, se.id % ACOLS, Math.floor(se.id / ACOLS), b.def.vol, b.def.gold ? 1 : 0);
      handPages.setColorAt(i, _c.set(b.def.gold ? '#f7c948' : '#ffffff'));
      m.se = se; m.y = h + se.t / 2; m.yaw = 0.32 + ((i * 37) % 9 - 4) * 0.03; h += se.t;
    });
    inst.needsUpdate = true; if (handPages.instanceColor) handPages.instanceColor.needsUpdate = true;
    handGroup.userData.h = h;
  }
  function updateHand(dt) {
    const h = handGroup.userData.h || 0, sc = 0.55 * Math.min(1, 0.5 / Math.max(h, 0.01));
    handGroup.scale.setScalar(sc);
    handGroup.position.set(0.5, -0.43 + (calm() ? 0 : Math.sin(bob * 2) * 0.006), -1.0);
    handMeshes.forEach((m, i) => {
      if (m.id < 0) { _m.makeScale(0, 0, 0); handCover.setMatrixAt(i, _m); handPages.setMatrixAt(i, _m); return; }
      m.pop = Math.min(1, m.pop + dt * 6);
      const se = m.se, q = _q.setFromAxisAngle(Y_AXIS, m.yaw).multiply(Q_FLAT);
      _v.set(0, m.y + (1 - m.pop) * 0.12, 0); _s.set(se.t, se.h, se.d); _m.compose(_v, q, _s); handCover.setMatrixAt(i, _m);
      _hv.set(0, 0, -0.006).applyQuaternion(q).add(_v); _s.set(se.t * 0.8, se.h + 0.008, se.d); _m.compose(_hv, q, _s); handPages.setMatrixAt(i, _m);
    });
    handCover.instanceMatrix.needsUpdate = handPages.instanceMatrix.needsUpdate = true;
  }
  function updateBeacons() {
    let n = 0;
    if (G.fx.way > 0 && G.mode === 'play') {
      const seen = new Set();
      for (const id of G.held) {
        const b = books[id]; if (seen.has(b.se.id) || n >= beacons.length) continue; seen.add(b.se.id);
        const cs = cases[b.def.cat], bc = beacons[n++], y = cs.y0 + ROW_Y0 + b.se.row * ROW_DY, pulse = 0.28 + 0.14 * Math.sin(clock * 5);
        bc.quad.visible = bc.beam.visible = true;
        bc.quad.position.set(cs.x, y + ROW_H / 2, cs.z + cs.s * (CD / 2 + 0.008)); bc.quad.quaternion.copy(cs.quat); bc.quad.material.opacity = pulse;
        bc.beam.position.set(cs.x, cs.y0 + CH + 0.9, cs.z + cs.s * 0.1); bc.beam.material.opacity = pulse;
      }
    }
    for (; n < beacons.length; n++) beacons[n].quad.visible = beacons[n].beam.visible = false;
  }

  // ---------- per-frame ----------
  function move(dt) {
    const k = G.keys, f = (k.forward ? 1 : 0) - (k.back ? 1 : 0) + stick.y, r = (k.right ? 1 : 0) - (k.left ? 1 : 0) + stick.x;
    if (Math.abs(f) < 0.05 && Math.abs(r) < 0.05) return;
    const len = Math.max(1, Math.hypot(f, r)), sp = 2.7 * (k.run ? 1.75 : 1) * TH.upgVal('boots') / 100;
    const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
    const dx = (-sin * f + cos * r) / len * sp * dt, dz = (-cos * f - sin * r) / len * sp * dt;
    const ox = P.x, oz = P.z;
    // In short steps, one axis at a time. A step is refused if there is no floor there within a stride's height:
    // that is what keeps you on the stairs, behind the railings and off the edge of an upper floor.
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.12));
    const tryMove = (nx, nz, ax, dir) => {
      nx = clamp(nx, PR, LEN - PR); nz = clamp(nz, -halfAt(nx) + PR, halfAt(nx) - PR);
      const lv = lvOf(P.y);
      for (const c of colliders) {
        if (!c.on || (c.lv !== undefined && c.lv !== lv) || !(nx > c.x0 - PR && nx < c.x1 + PR && nz > c.z0 - PR && nz < c.z1 + PR)) continue;
        if (!c.wall && P.x > c.x0 - PR && P.x < c.x1 + PR && P.z > c.z0 - PR && P.z < c.z1 + PR) continue;      // already inside it somehow: let them walk out
        if (ax) nz = dir > 0 ? c.z0 - PR : c.z1 + PR; else nx = dir > 0 ? c.x0 - PR : c.x1 + PR;
      }
      const gy = groundAt(nx, nz, P.y);
      if (gy === null) return;
      P.x = nx; P.z = nz; P.y = gy;
    };
    for (let k = 0; k < n; k++) { tryMove(P.x + dx / n, P.z, 0, dx); tryMove(P.x, P.z + dz / n, 1, dz); }
    const moved = Math.hypot(P.x - ox, P.z - oz);
    S().stats.metres += moved;
    bob += moved * 3.4; stepPhase += moved;
    if (stepPhase > 1.3) { stepPhase = 0; if (TH.Settings.audio.steps) TH.Audio.play('step'); }
  }
  function update(dt) {
    clock += dt;
    if (G.mode === 'menu') {
      const a = calm() ? 0.6 : clock * 0.045;
      camera.position.set(PLANS[0].w / 2 + Math.cos(a * 0.7) * 1.2, 1.6, Math.sin(a * 0.9) * 0.8);
      camera.rotation.set(-0.06, a, 0);
    } else if (!G.paused) {
      move(dt);
      const s = S(); s.stats.playTime += dt;
      camY += (P.y - camY) * Math.min(1, dt * 14);                    // glide up the steps rather than jolt
      camera.position.set(P.x, camY + EYE + (TH.Settings.video.bob && !calm() ? Math.sin(bob) * 0.028 : 0), P.z);
      camera.rotation.set(P.pitch, P.yaw, 0);
      camera.updateMatrixWorld();
      G.aim = pick(); showAim();
      if (G.wing() !== lastWing) { lastWing = G.wing(); TH.UI.hud(); if (uppers[lastWing]) TH.UI.tip('stairs', 'This room has an upstairs. Take the stairs: there are more books and bookcases up there.'); }
      if (mouseDown && TH.Settings.controls.hold && lastOk) { repeatT -= dt; if (repeatT <= 0) { repeatT = 0.16; lastOk = G.interact(true); } }
      if (G.fx.way > 0) { G.fx.way = Math.max(0, G.fx.way - dt); if (Math.floor(G.fx.way) !== Math.floor(G.fx.way + dt)) TH.UI.hud(); }
      saveT += dt; if (saveT > 8) { saveT = 0; savePos(); }
    }
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i]; a.t += dt;
      const p = Math.min(1, a.t / a.d), e = 1 - Math.pow(1 - p, 3);
      a.b.pos.lerpVectors(a.p0, a.p1, e); a.b.pos.y += a.arc * Math.sin(Math.PI * p);
      a.b.quat.slerpQuaternions(a.q0, a.q1, e);
      write(a.b);
      if (p >= 1) { anims.splice(i, 1); if (a.done) a.done(); }
    }
    // A room's dressing is drawn when you are in it or next to it; further rooms only when you are lined up with the doorways.
    placeLamps(wingOf(camera.position.x));
    { const cw = wingOf(camera.position.x), az = Math.abs(camera.position.z); roomGroups.forEach((g, w) => { const d = Math.abs(w - cw); g.visible = d <= 1 || (az < (d === 2 ? 2.6 : 1.6) && gates.every((gt) => gt.open || gt.idx < Math.min(w, cw) || gt.idx >= Math.max(w, cw))); }); }
    for (const f of flames) { const k = calm() ? 1 : 0.8 + 0.3 * Math.sin(clock * 9 + f.p) + 0.12 * Math.sin(clock * 23 + f.p * 2); f.m.scale.set(1, k, 1); f.m.position.y = f.y + f.h * k / 2; }
    if (fireLight) fireLight.intensity = (TH.Settings.video.quality === 'low' ? 0 : 0.85) * (calm() ? 1 : 0.85 + 0.2 * Math.sin(clock * 11) + 0.1 * Math.sin(clock * 27));
    if (!calm()) for (const sp of spinners) sp.m.rotation[sp.ax] += sp.sp * dt;
    if (!calm()) for (const sw of sways) { sw.g.rotation.z = Math.sin(clock * 0.7 + sw.p) * 0.02; sw.g.rotation.x = Math.sin(clock * 0.53 + sw.p * 1.7) * 0.015; }
    if (clockHands.h) { const d = new Date(), mins = d.getMinutes() + d.getSeconds() / 60; clockHands.m.rotation.x = mins / 60 * Math.PI * 2; clockHands.h.rotation.x = ((d.getHours() % 12) + mins / 60) / 12 * Math.PI * 2; }
    for (const mk of marks) if (!mk.got) { mk.group.rotation.y = clock * 1.6 + mk.id; mk.group.position.y = mk.y + Math.sin(clock * 2 + mk.id) * 0.04; }
    const u = sparks.userData, arr = sparks.geometry.attributes.position.array;
    for (let k = 0; k < u.n; k++) {
      if (u.life[k] <= 0) continue;
      u.life[k] -= dt; u.vel[k * 3 + 1] -= 2.6 * dt;
      arr[k * 3] += u.vel[k * 3] * dt; arr[k * 3 + 1] += u.vel[k * 3 + 1] * dt; arr[k * 3 + 2] += u.vel[k * 3 + 2] * dt;
      if (u.life[k] <= 0) arr[k * 3 + 1] = -99;
    }
    sparks.geometry.attributes.position.needsUpdate = true;
    if (dust.visible) { const dw = wingOf(camera.position.x), dpl = PLANS[dw]; dust.scale.set(dpl.w, dpl.h, dpl.d); dust.position.set(X0[dw], Math.sin(clock * 0.2) * 0.12, 0); }
    updateBeacons();
    updateHand(dt);
    if (dirty) { cover.instanceMatrix.needsUpdate = true; pages.instanceMatrix.needsUpdate = true; dirty = false; }
  }
  function frame(t) {
    requestAnimationFrame(frame);
    const capFps = TH.Settings.video.fpsCap;
    if (capFps && t - lastDraw < 1000 / capFps - 1.5) return;
    lastDraw = t;
    let dt = (t - last) / 1000; last = t;
    if (!(dt > 0)) dt = 0.016;
    if (dt > 0.1) dt = 0.1;
    update(dt);
    renderer.clear();
    renderer.render(scene, camera);
    if (G.mode === 'play' && G.held.length) { renderer.clearDepth(); renderer.render(handScene, handCam); }
    fpsN++; fpsT += dt;
    if (fpsT >= 0.5) { if (TH.UI) TH.UI.fps(Math.round(fpsN / fpsT)); fpsN = 0; fpsT = 0; }
  }

  // ---------- hooks for the automated test ----------
  G.debug = {
    books, loose, tables, cases, gates, marks, P,
    lookAt(x, y, z) { const dx = x - P.x, dy = y - P.y - EYE, dz = z - P.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); },
    stand(x, z, y) { P.x = x; P.z = z; P.y = camY = y || 0; },
    plans: PLANS, X0, uppers, stairs: stairsA, groundAt, colliders, PR, STEP,
    slot(id) { return slotPos(books[id], new T.Vector3()); },
    flush() { for (const id of G.held.slice()) shelve(books[id], true); },
    busy() { return anims.length; },
    take(id) { if (books[id].st === 'loose') takeLoose(books[id]); refreshHand(); },
    put(id) { shelve(books[id], true); },
    down(id) { return takeShelved(books[id]); },
    // shelve one loose book directly (skips walking), used to fast-forward
    auto(wing) {
      for (let w = 0; w < NW; w++) { if (wing != null && w !== wing) continue; const b = loose[w].find((x) => x.st === 'loose'); if (b) { takeLoose(b); shelve(b, true); return true; } }
      return false;
    }
  };
})();
