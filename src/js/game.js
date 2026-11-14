// The Night Shelver — the 3D library: world building, walking, picking up, shelving, knacks
(function () {
  'use strict';
  const TH = window.TH, T = window.THREE;
  const S = () => TH.Save.data;
  const { clamp, rand } = TH;

  // ---------- dimensions (metres) ----------
  const RW = 10, RD = 8, RH = 3.6, HALF = RD / 2, NW = TH.WINGS.length, LEN = RW * NW;
  const DOOR_W = 2.2, DOOR_H = 2.5;
  const CD = 0.32, IW = 1.0, CH = 2.08, ROW_Y0 = 0.14, ROW_DY = 0.48, ROW_H = 0.44;
  const EYE = 1.62, PR = 0.25, NV = TH.VOLS, NB = TH.BOOKS.length;
  const IRON = '#2f2a27';
  // Each room has its own plan. A case is [x, z, facing] (facing 1 looks toward +z); a table is [x, z].
  const WN = -HALF + CD / 2, WS = HALF - CD / 2;
  const PLANS = [
    { h: 3.6, wood: ['#7a5236', '#553622', '#a9794f'], floor: 'planks', ceil: '#d8c6a6', frame: '#553622', win: [0.95, 1.4, 1.8],
      cases: [[1.8, WN, 1], [5, WN, 1], [8.2, WN, 1], [1.8, WS, -1], [5, WS, -1], [8.2, WS, -1]],        // three along each long wall
      tables: [[2.5, 0], [5, 0], [7.5, 0]], rows: [-2.55, -1.6, 1.6, 2.55], winN: [3.4, 6.6], winS: [3.4, 6.6], lamps: [[9.45, -3.3], [9.45, 3.3]] },
    { h: 4.4, wood: ['#b89468', '#8f6f48', '#d9bd90'], floor: 'tiles', ceil: '#e8ecdb', frame: '#f3efe2', win: [1.25, 2.4, 2.2], cloth: '#4f7d5c',
      cases: [[1.0, WN, 1], [2.6, WN, 1], [4.2, WN, 1], [5.8, WN, 1], [7.4, WN, 1], [9.0, WN, 1]],        // one long wall of bookcases
      tables: [[2.2, 2.75], [5, 2.75], [7.8, 2.75]], rows: [-2.1, -1.0, 0.1, 1.2], winN: [], winS: [1.3, 3.6, 6.4, 8.7], lamps: [[0.5, 3.45]] },
    { h: 4.0, wood: ['#4a3327', '#2f2019', '#6b4a38'], floor: 'slate', ceil: '#c9cbd6', frame: '#8a8b99', win: [0.62, 2.2, 2.1], cloth: '#2f5d4a',
      cases: [[2.4, -0.17, -1], [5, -0.17, -1], [7.6, -0.17, -1], [2.4, 0.17, 1], [5, 0.17, 1], [7.6, 0.17, 1]],  // free-standing stacks, back to back
      tables: [[2.2, -3.2], [7.8, -3.2], [5, 3.2]], rows: [-2.35, -1.4, 1.4, 2.35], winN: [1.0, 5, 9.0], winS: [1.4, 3.0, 7.0, 8.6], lamps: [[9.5, -3.4], [0.5, 3.4]] },
    { h: 3.8, wood: ['#5b3d4e', '#3c2735', '#8a6a4a'], floor: 'star', ceil: '#3f3350', frame: '#b8893a', win: [1.05, 0, 2.2], round: true,
      cases: [[1.3, WN, 1], [2.6, WN, 1], [3.9, WN, 1], [6.1, WS, -1], [7.4, WS, -1], [8.7, WS, -1]],     // two clusters on opposite walls
      tables: [[7.2, -2.6], [2.8, 2.6], [5, 0]], rows: [-2.3, -1.25, 1.25, 2.3], winN: [6.3, 8.1], winS: [1.0, 2.8, 4.5], lamps: [[0.55, -3.3]] }
  ];

  const G = TH.Game = { mode: 'menu', paused: false, locked: false, held: [], aim: null, fx: { golden: 0, way: 0 }, streak: 0, keys: {} };
  let cv, renderer, scene, camera, handScene, handCam, handGroup;
  let fireLight = null, woodFine = null, woodFast = null;
  const fineSwap = [], sways = [], roomGroups = [];
  let cover, pages, handCover, handPages, hemi, sun, winMat, lampMat, dust, sparks, hlBook, hlRow, ghost;
  const lamps = [], halos = [], flames = [], spinners = [], clockHands = {}, books = [], piles = [], cases = [], colliders = [], gates = [], marks = [], anims = [], handMeshes = [], beacons = [];
  const P = { x: 1.05, z: 0, yaw: -Math.PI / 2, pitch: 0 };
  let dirty = false, clock = 0, last = 0, lastDraw = 0, fpsT = 0, fpsN = 0, bob = 0, stepPhase = 0, pending = 0;
  let lockFails = 0, epoch = 0;
  let mouseDown = false, repeatT = 0, lastOk = false, aimKey = '', aaOn = null, saveT = 0, lastWing = -1;
  const stick = { x: 0, y: 0 }, touches = {};

  const _m = new T.Matrix4(), _s = new T.Vector3(), _v = new T.Vector3(), _v2 = new T.Vector3(), _hv = new T.Vector3(), _q = new T.Quaternion();
  const Y_AXIS = new T.Vector3(0, 1, 0), Q_FLAT = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), Math.PI / 2);
  const calm = () => TH.Settings.video.reduceMotion;
  const cap = () => TH.upgVal('satchel');
  const reach = () => TH.upgVal('reach');
  const wingOf = (x) => clamp(Math.floor(x / RW), 0, NW - 1);
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
  function floorTexture(kind) {
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
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(RW / rep, RD / rep); t.anisotropy = 8;
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
  // One 384x384 tile per series in a 4096 atlas: a 96px-wide spine and a 288px-wide front cover, in the series' own colours.
  // The volume numeral is a second small texture that the shader stamps onto each book.
  const BLK = 384, ATLAS = 4096, ACOLS = 10, SU = BLK / ATLAS, SERIF = 'Georgia, "Times New Roman", serif';
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
      const bx = (se.id % ACOLS) * BLK, by = Math.floor(se.id / ACOLS) * BLK, cat = TH.CATS[se.cat].name.toUpperCase();
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
    }
    const cloth = document.createElement('canvas'); cloth.width = cloth.height = BLK;
    const cx2 = cloth.getContext('2d');
    for (let i = 0; i < 9000; i++) { cx2.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${0.03 + Math.random() * 0.07})`; if (i % 2) cx2.fillRect(Math.random() * BLK, Math.random() * BLK, 3, 1); else cx2.fillRect(Math.random() * BLK, Math.random() * BLK, 1, 3); }
    for (const se of TH.SERIES) x.drawImage(cloth, (se.id % ACOLS) * BLK, Math.floor(se.id / ACOLS) * BLK);
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
        if (vInst.y > 0.5) {
          float lum = dot(texelColor.rgb, vec3(0.299, 0.587, 0.114));
          texelColor.rgb = vec3(1.0, 0.78, 0.30) * (0.5 + 0.8 * lum);
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
    const block = (x0, x1, z0, z1) => { const c = { x0, x1, z0, z1, on: true }; colliders.push(c); return c; };

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
    const windowAt = (x, sgn, wd, ht, cy, frame, round) => {
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

    solid(-0.15, PLANS[0].h / 2, 0, 0.3, PLANS[0].h, RD + 0.6, TH.WINGS[0].wall);
    solid(LEN + 0.15, PLANS[NW - 1].h / 2, 0, 0.3, PLANS[NW - 1].h, RD + 0.6, TH.WINGS[NW - 1].wall);

    TH.WINGS.forEach((wg, w) => {
      const x0 = w * RW, pl = PLANS[w], h = pl.h, [wood, woodD, woodL] = pl.wood;
      room = scene;                                 // floor and ceiling always show: you can see them through the doorways
      // floor and ceiling
      const ftex = floorTexture(pl.floor), shiny = pl.floor === 'tiles' || pl.floor === 'slate';
      const floor = add(new T.PlaneGeometry(RW, RD), null, x0 + RW / 2, 0, 0); floor.rotation.x = -Math.PI / 2;
      relief(floor, new T.MeshStandardMaterial({ map: ftex, bumpMap: ftex, bumpScale: shiny ? 0.03 : 0.02, roughness: shiny ? 0.5 : 0.72, metalness: 0 }), new T.MeshLambertMaterial({ map: ftex }));
      const ceil = add(new T.PlaneGeometry(RW, RD), pl.floor === 'star' ? new T.MeshBasicMaterial({ map: starTexture() }) : new T.MeshLambertMaterial({ color: pl.ceil, map: Object.assign(plaster.clone(), { needsUpdate: true, repeat: new T.Vector2(6, 5) }) }), x0 + RW / 2, h, 0); ceil.rotation.x = Math.PI / 2;
      room = new T.Group(); scene.add(room); roomGroups[w] = room;
      // long walls with skirting, then this room's windows
      for (const sgn of [-1, 1]) {
        solid(x0 + RW / 2, h / 2, sgn * (HALF + 0.15), RW, h, 0.3, wg.wall);
        solid(x0 + RW / 2, 0.09, sgn * (HALF - 0.02), RW, 0.18, 0.04, woodD);
        for (const lx of (sgn < 0 ? pl.winN : pl.winS)) windowAt(x0 + lx, sgn, pl.win[0], pl.win[1], pl.win[2], pl.frame, pl.round);
      }
      // wall to the previous room, with a doorway and a gate
      if (w > 0) {
        const hm = Math.max(h, PLANS[w - 1].h), seg = (HALF - DOOR_W / 2), zc = (HALF + DOOR_W / 2) / 2;
        for (const sgn of [-1, 1]) { solid(x0, hm / 2, sgn * zc, 0.3, hm, seg, TH.mix(wg.wall, TH.WINGS[w - 1].wall, 0.5)); wall(x0 - 0.15, x0 + 0.15, sgn * zc - seg / 2, sgn * zc + seg / 2); }
        solid(x0, (DOOR_H + 0.1 + hm) / 2, 0, 0.3, hm - DOOR_H - 0.1, DOOR_W, TH.mix(wg.wall, TH.WINGS[w - 1].wall, 0.5));
        solid(x0, DOOR_H + 0.06, 0, 0.36, 0.12, DOOR_W + 0.16, woodD);
        solid(x0, DOOR_H / 2, -DOOR_W / 2 + 0.04, 0.34, DOOR_H, 0.08, woodD); solid(x0, DOOR_H / 2, DOOR_W / 2 - 0.04, 0.34, DOOR_H, 0.08, woodD);
        const grp = new T.Group();
        for (let i = 0; i < 9; i++) { const b = new T.Mesh(barGeo, ironMat); b.position.set(0, DOOR_H / 2, -DOOR_W / 2 + 0.16 + i * (DOOR_W - 0.32) / 8); grp.add(b); }
        for (const y of [0.25, 1.3, DOOR_H - 0.12]) { const r = new T.Mesh(railGeo, ironMat); r.position.set(0, y, 0); grp.add(r); }
        grp.position.set(x0, 0, 0); scene.add(grp);
        gates.push({ idx: w - 1, x: x0, group: grp, col: wall(x0 - 0.1, x0 + 0.1, -DOOR_W / 2, DOOR_W / 2), open: false });
      }
      // tables, with three piles each
      for (const [tx, tz] of pl.tables) {
        solid(x0 + tx, 0.75, tz, 1.6, 0.06, 0.9, woodL);
        if (pl.cloth) solid(x0 + tx, 0.784, tz, 1.36, 0.012, 0.66, pl.cloth);
        for (const a of [-1, 1]) for (const b of [-1, 1]) solid(x0 + tx + a * 0.72, 0.36, tz + b * 0.37, 0.07, 0.72, 0.07, wood);
        block(x0 + tx - 0.8, x0 + tx + 0.8, tz - 0.45, tz + 0.45);
        for (const dx of [-0.5, 0, 0.5]) piles.push({ wing: w, x: x0 + tx + dx, z: tz, y0: pl.cloth ? 0.792 : 0.782, books: [], h: 0, col: null });
      }
      // standing lamps and the hanging lights
      for (const [lx, lz] of pl.lamps) {
        solid(x0 + lx, 0.8, lz, 0.05, 1.6, 0.05, IRON); solid(x0 + lx, 0.03, lz, 0.3, 0.06, 0.3, IRON);
        add(bulbGeo, lampMat, x0 + lx, 1.72, lz);
        block(x0 + lx - 0.12, x0 + lx + 0.12, lz - 0.12, lz + 0.12);
      }
      for (const lx of [2.5, 7.5]) {
        hang(x0 + lx, h - 0.85, 0, h, 1.3);
        const lt = new T.PointLight(0xffb463, 1, 11, 2); lt.position.set(x0 + lx, h - 0.95, 0); scene.add(lt); lamps.push(lt);
      }
      // bookcases
      wg.cats.forEach((cat, k) => {
        const [lx0, z, s] = pl.cases[k], x = x0 + lx0, rotY = s > 0 ? 0 : Math.PI;
        const at = (lx, ly, lz, sx, sy, sz, col) => solid(x + s * lx, ly, z + s * lz, sx, sy, sz, col);
        at(0, CH / 2, -CD / 2 + 0.012, IW + 0.07, CH, 0.024, woodD);
        at(-(IW / 2 + 0.02), CH / 2, 0, 0.04, CH, CD, wood); at(IW / 2 + 0.02, CH / 2, 0, 0.04, CH, CD, wood);
        for (let i = 0; i <= 4; i++) at(0, ROW_Y0 - 0.0175 + i * ROW_DY, 0, IW, 0.035, CD, wood);
        at(0, 0.06, 0.01, IW, 0.12, CD - 0.04, woodD);
        at(0, CH + 0.03, 0.02, IW + 0.16, 0.06, CD + 0.06, woodD);
        at(0, CH + 0.2, CD / 2 - 0.06, 1.02, 0.25, 0.03, woodD);
        const plaque = add(new T.PlaneGeometry(0.98, 0.21), new T.MeshBasicMaterial({ map: textTexture(cat.name, 512, 110, cat.color, '#fff6e2', 62, 'rgba(255,246,226,.8)') }), x, CH + 0.2, z + s * (CD / 2 - 0.042));
        plaque.rotation.y = rotY;
        const cs = { id: cat.id, cat, wing: w, x, z, s, quat: new T.Quaternion().setFromAxisAngle(Y_AXIS, rotY), rows: [], done: false };
        cat.series.forEach((se) => {
          const y = ROW_Y0 + se.row * ROW_DY;
          const lab = add(new T.PlaneGeometry(0.8, 0.066), new T.MeshBasicMaterial({ map: textTexture(se.name, 512, 42, '#3b2a1d', '#f7dfae', 32) }), x, y - 0.026, z + s * (CD / 2 + 0.004));
          lab.rotation.y = rotY;
          cs.rows[se.row] = { se, cs, y, slots: new Array(NV).fill(-1), filled: 0, landed: 0 };
        });
        cases[cat.id] = cs;
        block(x - (IW / 2 + 0.06), x + (IW / 2 + 0.06), z - CD / 2 - 0.02, z + CD / 2 + 0.02);
      });
      // piles on the floor: a grid that leaves the tables and bookcases clear
      for (let i = 0; i < 7; i++) for (const pz of pl.rows) {
        const lx = 1.3 + i * 1.233, px = x0 + lx;
        if (pl.tables.some(([tx, tz]) => Math.abs(lx - tx) < 1.27 && Math.abs(pz - tz) < 1.12)) continue;
        if (pl.cases.some(([cx, cz]) => Math.abs(lx - cx) < 0.9 && Math.abs(pz - cz) < 0.75)) continue;
        piles.push({ wing: w, x: px, z: pz, y0: 0.002, books: [], h: 0, col: block(px - 0.17, px + 0.17, pz - 0.17, pz + 0.17) });
      }
      // five lost bookmarks per room
      const c1 = pl.cases[1], t0 = pl.tables[0], t2 = pl.tables[2];
      [[c1[0], 2.42, c1[1]], [t2[0], 0.32, t2[1]], [0.5, 0.3, HALF - 0.5], [t0[0] - 0.74, 0.98, t0[1] + 0.3], [9.5, 0.3, -HALF + 0.5]].forEach(([lx, ly, lz], i) => {
        const g = new T.Group();
        g.add(new T.Mesh(markGeo, new T.MeshBasicMaterial({ color: [0xe2574c, 0x5aa9e6, 0xf0c64a, 0x7fc06a, 0xc084d8][i] })));
        const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, blending: T.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.setScalar(0.55); g.add(sp);
        g.position.set(x0 + lx, ly, lz); room.add(g);
        marks.push({ id: w * 5 + i, wing: w, group: g, y: ly, got: false });
      });

      // ----- what makes each room its own place -----
      if (w === 0) {
        // The Reading Room: oak panelling, heavy beams, a rug and a fire in the hearth
        for (const sgn of [-1, 1]) { solid(x0 + RW / 2, 0.6, sgn * (HALF - 0.014), RW, 0.84, 0.028, wood); solid(x0 + RW / 2, 1.04, sgn * (HALF - 0.02), RW, 0.07, 0.04, woodD); }
        for (const bx of [2.5, 5, 7.5]) solid(x0 + bx, h - 0.09, 0, 0.2, 0.18, RD, woodD);
        rugAt(x0 + 5, 0, 7.8, 2.3, wg.rug);
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
        for (const bx of [1.25, 3.75, 6.25, 8.75]) solid(x0 + bx, h - 0.06, 0, 0.12, 0.12, RD, '#f3efe2');
        for (const bx of [2.5, 5, 7.5]) { const sky = add(new T.PlaneGeometry(1.7, 3.2), winMat, x0 + bx, h - 0.012, 0.3); sky.rotation.x = Math.PI / 2; solid(x0 + bx, h - 0.03, 0.3, 0.05, 0.05, 3.2, '#f3efe2'); solid(x0 + bx, h - 0.03, 0.3, 1.7, 0.05, 0.05, '#f3efe2'); }
        for (const sgn of [-1, 1]) solid(x0 + RW / 2, 2.95, sgn * (HALF - 0.02), RW, 0.06, 0.04, '#f3efe2');
        rugAt(x0 + 5, -0.45, 8.8, 1.5, wg.rug);
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
        tree(3.6, 3.5, 1.6); tree(6.4, 3.5, 1.85); tree(9.45, 2.6, 1.7);
        pl.cases.forEach(([cx, cz], k) => { if (k % 2) return; cyl(x0 + cx + 0.3, CH + 0.13, cz - 0.02, 0.09, 0.07, 0.14, '#b5653c'); cyl(x0 + cx + 0.3, CH + 0.2, cz - 0.02, 0.1, 0.09, 0.02, '#9c5430'); crown(x0 + cx + 0.3, CH + 0.32, cz - 0.02, 0.2, 9); });
        const board = specimenTexture();
        for (const lx of [1.8, 5, 8.2]) { const fr = add(new T.PlaneGeometry(1.5, 0.9), new T.MeshLambertMaterial({ map: board }), x0 + lx, 3.55, -HALF + 0.03); void fr; solid(x0 + lx, 3.55, -HALF + 0.012, 1.6, 1.0, 0.02, woodD); }
      } else if (w === 2) {
        // The Scholars' Hall: stone piers, ribbed ceiling, banners, reading desks and a globe
        const SN = '#a8a9b6', SND = '#8a8b99';
        for (const sgn of [-1, 1]) for (const px of [0.25, 3.95, 6.05, 9.75]) {
          block(x0 + px - 0.25, x0 + px + 0.25, sgn > 0 ? HALF - 0.34 : -HALF, sgn > 0 ? HALF : -HALF + 0.34);
          solid(x0 + px, h / 2, sgn * (HALF - 0.14), 0.36, h, 0.28, SN); solid(x0 + px, 0.14, sgn * (HALF - 0.16), 0.48, 0.28, 0.34, SND); solid(x0 + px, h - 0.14, sgn * (HALF - 0.16), 0.5, 0.28, 0.36, SND);
        }
        for (const bx of [0.25, 3.95, 6.05, 9.75]) solid(x0 + bx, h - 0.11, 0, 0.3, 0.22, RD, SN);
        for (const bz of [-2, 2]) solid(x0 + RW / 2, h - 0.08, bz, RW, 0.16, 0.2, SND);
        const banner = (lx, sgn, c1x, c2x) => { solid(x0 + lx, 3.18, sgn * (HALF - 0.03), 0.9, 0.05, 0.05, IRON); solid(x0 + lx, 2.55, sgn * (HALF - 0.035), 0.78, 1.2, 0.02, c1x); solid(x0 + lx, 2.55, sgn * (HALF - 0.05), 0.2, 1.2, 0.02, c2x); solid(x0 + lx, 1.9, sgn * (HALF - 0.035), 0.5, 0.14, 0.02, c1x); };
        banner(2.2, -1, '#2f4a86', '#d9b24a'); banner(7.8, -1, '#2f4a86', '#d9b24a'); banner(5, 1, '#7a2f3a', '#d9b24a');
        for (const lx of [2.5, 7.5]) {      // candle rings under the hanging lights
          const ring = add(new T.TorusGeometry(0.42, 0.025, 6, 20), ironMat, x0 + lx, h - 1.0, 0); ring.rotation.x = Math.PI / 2;
          for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const b = add(bulbGeo, lampMat, x0 + lx + Math.cos(a) * 0.42, h - 0.92, Math.sin(a) * 0.42); b.scale.setScalar(0.42); }
        }
        cyl(x0 + 0.62, 0.45, -3.3, 0.05, 0.16, 0.9, woodD); const globe = ball(x0 + 0.62, 1.2, -3.3, 0.34, '#4f7fa8'); globe.rotation.z = 0.4;
        const land = add(new T.SphereGeometry(0.345, 8, 6, 0.4, 1.6, 0.7, 1.4), lam('#7fa56a'), x0 + 0.62, 1.2, -3.3); spinners.push({ m: land, ax: 'y', sp: 0.15 }); spinners.push({ m: globe, ax: 'y', sp: 0.15 });
        const ring = add(new T.TorusGeometry(0.4, 0.02, 6, 24), lam('#b8893a'), x0 + 0.62, 1.2, -3.3); ring.rotation.x = 0.35;
        block(x0 + 0.3, x0 + 0.95, -3.62, -2.98);
        for (const lz of [-0.775, 0.775]) rugAt(x0 + 5, lz, 9.2, 0.9, wg.rug);
      } else {
        // The Curiosity Vault: a painted night ceiling, portholes, brass pipes, turning gears and a great clock
        const BR = '#b8893a', CU = '#a8643a';
        for (const bz of [-3.3, 3.3]) { const p = cyl(x0 + RW / 2, h - 0.3, bz, 0.06, 0.06, RW, BR, 10); p.rotation.z = Math.PI / 2; for (const bx of [1.5, 5, 8.5]) cyl(x0 + bx, h - 0.15, bz, 0.03, 0.03, 0.3, CU, 8); }
        for (const sgn of [-1, 1]) solid(x0 + RW / 2, 1.1, sgn * (HALF - 0.02), RW, 0.05, 0.04, BR);
        roundRugAt(x0 + 5, 0, 2.1, wg.rug);
        const xe = x0 + RW - 0.02;                    // the far wall
        const face = add(new T.CircleGeometry(0.85, 40), new T.MeshBasicMaterial({ map: clockTexture() }), xe, 2.35, 0); face.rotation.y = -Math.PI / 2;
        const rim = add(new T.TorusGeometry(0.87, 0.07, 8, 40), lam(BR), xe, 2.35, 0); rim.rotation.y = Math.PI / 2;
        for (const [len, wd, kind] of [[0.5, 0.06, 'h'], [0.72, 0.04, 'm']]) {
          const pivot = new T.Group(); pivot.position.set(xe - 0.03, 2.35, 0);
          const hand = new T.Mesh(new T.BoxGeometry(0.02, len, wd), lam('#2b1c10')); hand.position.y = len / 2 - 0.06; pivot.add(hand); room.add(pivot); clockHands[kind] = pivot;
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
      }
    });

    room = scene;
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
      books.push({ id: i, def, se, st: 'pile', pos: new T.Vector3(), quat: new T.Quaternion(), vis: true, yaw: rand(-0.5, 0.5), jx: rand(-0.02, 0.02), jz: rand(-0.02, 0.02), pile: null });
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
    for (let i = 0; i < DN; i++) { dp[i * 3] = rand(0, RW); dp[i * 3 + 1] = rand(0.3, RH - 0.3); dp[i * 3 + 2] = rand(-HALF, HALF); }
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
    return out.set(cs.x + cs.s * lx, ROW_Y0 + se.row * ROW_DY + se.h / 2 + 0.004, cs.z + cs.s * lz);
  }
  const pileQuat = (b, out) => out.setFromAxisAngle(Y_AXIS, b.yaw).multiply(Q_FLAT);
  function restack(p, fast) {
    let y = p.y0;
    for (const id of p.books) {
      const b = books[id], ty = y + b.se.t / 2;
      if (fast) { b.pos.set(p.x + b.jx, ty, p.z + b.jz); pileQuat(b, b.quat); b.vis = true; write(b); }
      else if (Math.abs(b.pos.y - ty) > 1e-4 && b.st === 'pile') fly(b, new T.Vector3(p.x + b.jx, ty, p.z + b.jz), pileQuat(b, new T.Quaternion()), 0.16, 0);
      y += b.se.t;
    }
    p.h = y - p.y0;
    if (p.col) p.col.on = p.books.length > 0;
  }
  function fly(b, p1, q1, dur, arc, done) {
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i].b === b) anims.splice(i, 1);
    anims.push({ b, p0: b.pos.clone(), q0: b.quat.clone(), p1, q1, t: 0, d: calm() ? Math.min(dur, 0.14) : dur, arc: calm() ? 0 : arc, done });
  }
  function handWorld(out) { return camera.localToWorld(out.set(0.28, -0.3, -0.55)); }

  // ---------- round state ----------
  function newRound() {
    const s = S();
    s.shelved = TH.BOOKS.map(() => 0);
    for (const b of TH.shuffle(TH.BOOKS.slice()).slice(0, 138)) s.shelved[b.id] = 1;      // always 1,014 left to shelve
    for (const se of TH.SERIES) if (se.books.every((id) => s.shelved[id])) s.shelved[se.books[0]] = 0;   // never start with a finished row
    s.marks = {}; s.gates = {}; s.pos = null; s.started = true; s.charge = {}; s.fx = { golden: 0, way: 0 }; s.streak = 0; s.finaleShown = 0;
    for (const a of TH.ABIL) s.charge[a.id] = Math.floor(a.need * 0.6);
    TH.Save.flush();
  }
  function buildState() {
    const s = S();
    epoch++;                                                         // cancels any delayed moves from before
    anims.length = 0; G.held = []; pending = 0; G.streak = s.streak || 0; G.fx = { golden: (s.fx && s.fx.golden) || 0, way: (s.fx && s.fx.way) || 0 };
    for (const p of piles) p.books = [];
    for (const cs of cases) { cs.done = false; for (const r of cs.rows) { r.slots.fill(-1); r.filled = 0; r.landed = 0; } }
    const loose = TH.WINGS.map(() => []);
    for (const b of books) {
      if (s.shelved[b.id]) {
        const row = cases[b.def.cat].rows[b.se.row];
        b.st = 'shelf'; b.vis = true; b.pile = null; slotPos(b, b.pos); b.quat.copy(row.cs.quat); write(b);
        row.slots[b.def.vol] = b.id; row.filled++; row.landed++;
      } else loose[b.def.wing].push(b);
    }
    for (const cs of cases) cs.done = cs.rows.every((r) => r.landed === NV);
    loose.forEach((list, w) => {
      TH.shuffle(list);
      const wp = TH.shuffle(piles.filter((p) => p.wing === w)), size = Math.max(4, Math.ceil(list.length / wp.length) + 1);
      let k = 0;
      for (const b of list) {
        let tries = 0;
        while (wp[k % wp.length].books.length >= size + (k % 3) && tries++ < wp.length) k++;
        const p = wp[k % wp.length]; p.books.push(b.id); b.pile = p; b.st = 'pile';
        if (Math.random() < 0.55) k++;
      }
    });
    for (const p of piles) restack(p, true);
    for (const g of gates) {
      if (TH.shelvedCount(g.idx) / TH.WINGS[g.idx].books >= TH.GATE_AT) s.gates[g.idx] = 1;      // in case the game closed before the door swung
      g.open = !!s.gates[g.idx]; g.group.visible = !g.open; g.col.on = !g.open;
    }
    for (const mk of marks) { mk.got = !!s.marks[mk.id]; mk.group.visible = !mk.got; }
    refreshHand();
  }

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
    if (!S().started || S().shelved.length !== NB) newRound();
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
    if (!s.started || s.shelved.length !== NB) newRound();
    buildState();
    const p = s.pos;
    if (p && TH.wingOpen(wingOf(p.x))) { P.x = p.x; P.z = p.z; P.yaw = p.yaw; P.pitch = 0; } else { P.x = 1.05; P.z = 0; P.yaw = -Math.PI / 2; P.pitch = -0.12; }
    // piles are dealt afresh each time, so the saved spot may now be inside one: step out to the nearest clear floor
    const stuck = (x, z) => colliders.some((c) => c.on && x > c.x0 - PR && x < c.x1 + PR && z > c.z0 - PR && z < c.z1 + PR);
    if (stuck(P.x, P.z)) {
      search: for (let r = 0.1; r < 3; r += 0.1) for (let a = 0; a < 6.28; a += 0.4) {
        const nx = P.x + Math.cos(a) * r, nz = P.z + Math.sin(a) * r;
        if (nx > PR && nx < LEN - PR && Math.abs(nz) < HALF - PR && wingOf(nx) === wingOf(P.x) && !stuck(nx, nz)) { P.x = nx; P.z = nz; break search; }
      }
    }
    G.mode = 'play'; G.paused = false; aimKey = '';
    TH.UI.hud();
    if (TH.shelvedCount() === NB && !s.finaleShown) setTimeout(() => { if (G.mode === 'play') TH.UI.finale(); }, 1500);
    TH.UI.tip('move', 'Look around with the mouse and walk with W A S D. Point at a book in a pile and click to pick it up.');
  };
  G.stop = () => { savePos(); G.mode = 'menu'; G.paused = false; G.aim = null; G.held = []; pending = 0; epoch++; refreshHand(); hideAim(); if (document.pointerLockElement) document.exitPointerLock(); TH.Save.flush(); };
  G.pause = (p) => { G.paused = p; G.keys = {}; mouseDown = false; stick.x = stick.y = 0; if (p) { savePos(); if (document.pointerLockElement) document.exitPointerLock(); } };
  G.reshuffle = () => { S().stats.rounds++; newRound(); TH.checkAch(); };
  G.rebuild = () => { if (!S().started || S().shelved.length !== NB) newRound(); buildState(); };
  G.lock = () => {
    if (G.mode !== 'play' || G.paused || document.pointerLockElement === cv) return;
    try { if (!cv.requestPointerLock) { lockFails = 2; return; } const r = cv.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { lockFails = 2; /* not available: drag-to-look still works */ }
  };
  function savePos() { if (G.mode === 'play') { const s = S(); s.pos = { x: P.x, z: P.z, yaw: P.yaw }; s.fx = { golden: G.fx.golden, way: Math.round(G.fx.way) }; s.streak = G.streak; TH.Save.commit(); } }

  // ---------- input ----------
  function onLock() {
    const was = G.locked;
    G.locked = document.pointerLockElement === cv;
    if (G.locked) lockFails = 0;
    if (was && !G.locked && G.mode === 'play' && !G.paused) TH.UI.autoPause();
    TH.UI.lockHint();
  }
  function onMove(e) {
    if (G.mode !== 'play' || G.paused) return;
    if (!G.locked && !(e.buttons & 2)) return;          // without mouse capture, hold the right button to look
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
    for (const p of piles) {
      if (!p.books.length || Math.abs(p.x - o.x) > R + 0.3) continue;
      const t = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, p.x - 0.2, p.x + 0.2, p.y0, p.y0 + p.h, p.z - 0.2, p.z + 0.2);
      if (t < 0 || t >= bt) continue;
      const hy = o.y + d.y * t - 1e-4;
      let y = p.y0, idx = p.books.length - 1;
      for (let i = 0; i < p.books.length; i++) { y += books[p.books[i]].se.t; if (hy <= y) { idx = i; break; } }
      bt = t; best = { type: 'pile', pile: p, idx, book: books[p.books[idx]] };
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
      const t = rayBox(o.x, o.y, o.z, d.x, d.y, d.z, c.x0, c.x1, 0, 5, c.z0, c.z1);
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
      tone = full ? 'warn' : ''; key = 'p' + b.id + full;
    } else if (a && a.type === 'row') {
      const row = a.row, cs = a.cs, se = row.se;
      hlRow.visible = true; hlRow.position.set(cs.x, row.y + ROW_H / 2, cs.z + cs.s * (CD / 2 + 0.006)); hlRow.quaternion.copy(cs.quat);
      hlRow.material.color.set(a.cand >= 0 ? 0x9df08a : a.fits.length ? 0xffe08a : 0xffffff); hlRow.material.opacity = a.cand >= 0 ? 0.13 : 0.05;
      title = `${cs.cat.name} › ${se.name}`; hint = `${row.filled}/${NV} shelved`;
      if (a.cand >= 0) {
        const b = books[a.cand];
        ghost.visible = true; slotPos(b, ghost.position); ghost.quaternion.copy(cs.quat); ghost.scale.set(se.t, se.h, se.d); ghost.material.color.set(b.def.gold ? '#f0c24e' : se.color);
        hint += ` · click to shelve Vol. ${TH.ROMAN[b.def.vol]}`; tone = 'good';
      } else if (a.fits.length) {
        const b = books[a.fits[0]], dir = b.def.vol < a.slot ? 'left' : 'right';
        hint += ` · Vol. ${TH.ROMAN[b.def.vol]} goes further ${dir} (gap ${b.def.vol + 1})`; tone = 'warn';
      } else if (G.held.length) hint += ' · nothing you carry goes here';
      if (a.book && a.cand < 0) {
        const b = a.book;
        hlBook.visible = true; hlBook.position.copy(b.pos); hlBook.quaternion.copy(b.quat); hlBook.scale.set(b.se.t + 0.006, b.se.h + 0.012, b.se.d + 0.012);
        title = TH.bookTitle(b.def); hint = `${cs.cat.name} · on its shelf · ${TH.UI.keyLabel('read')} to read` + (a.fits.length ? '' : G.held.length ? ' · nothing you carry goes here' : ''); tone = '';
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
  function takeFromPile(p, idx) {
    const b = books[p.books[idx]];
    p.books.splice(idx, 1); b.pile = null; b.st = 'held'; b.vis = false; write(b);
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i].b === b) anims.splice(i, 1);
    G.held.push(b.id);
    restack(p, false);
    if (!p.books.length) S().stats.piles++;
    S().stats.mostHeld = Math.max(S().stats.mostHeld, G.held.length);
    return b;
  }
  // `repeat` is true for hold-to-repeat: it may only do something valid, never complain or cost a streak.
  G.interact = (repeat) => {
    const a = G.aim;
    if (G.mode !== 'play' || G.paused || !a) return false;
    if (a.type === 'pile') {
      if (a.pile.books[a.idx] !== a.book.id) return false;           // the aim is from an earlier frame
      if (repeat && G.held.length + pending >= cap()) return false;
      if (G.held.length + pending >= cap()) { TH.Audio.play('deny'); TH.UI.flash('Your hands are full — shelve some first'); return false; }
      takeFromPile(a.pile, a.idx);
      TH.Audio.play('pick'); refreshHand(); TH.checkAch(); TH.UI.hud(); aimKey = '';
      if (G.held.length === 1) TH.UI.tip('shelve', `Now find the bookcase with that section’s name on top, point at the shelf for its series, and click. Curious what’s inside? Press ${TH.UI.keyLabel('read')} to read any book.`);
      return true;
    }
    if (a.type === 'row') {
      if (a.cand >= 0) { if (!G.held.includes(a.cand)) return false; shelve(books[a.cand], true); return true; }
      if (repeat) return false;
      if (!G.held.length) { TH.UI.flash('Pick up some books first'); return false; }
      if (a.fits.length) { TH.Audio.play('deny'); return false; }           // exact mode: right shelf, wrong gap
      G.streak = 0; S().stats.mistakes++; TH.Audio.play('wrong');
      TH.UI.flash('None of those belong on this shelf'); TH.checkAch(); TH.UI.hud();
      return false;
    }
    if (repeat) return false;
    if (a.type === 'mark') {
      const mk = a.mark; if (mk.got) return false; mk.got = true; mk.group.visible = false;
      S().marks[mk.id] = 1; S().stats.marks++; TH.Save.earn(25);
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
  G.grabAll = () => {
    const a = G.aim;
    if (G.mode !== 'play' || G.paused || !a || a.type !== 'pile') return;
    const cat = a.book.def.cat, p = a.pile;
    let n = 0;
    for (let i = p.books.length - 1; i >= 0 && G.held.length + pending < cap(); i--) if (books[p.books[i]].def.cat === cat) { takeFromPile(p, i); n++; }
    if (!n) { TH.Audio.play('deny'); TH.UI.flash('Your hands are full — shelve some first'); return; }
    TH.Audio.play('pick'); refreshHand(); TH.checkAch(); TH.UI.hud(); aimKey = '';
  };
  function shelve(b, manual, delay) {
    if (b.st !== 'held') return;                                       // already on its way (two inputs in one frame)
    const s = S(), row = cases[b.def.cat].rows[b.se.row];
    const i = G.held.indexOf(b.id); if (i >= 0) G.held.splice(i, 1);
    b.st = 'fly'; b.vis = true; handWorld(b.pos); pileQuat(b, b.quat).premultiply(_q.setFromAxisAngle(Y_AXIS, P.yaw));
    row.slots[b.def.vol] = b.id; row.filled++;
    s.shelved[b.id] = 1; s.stats.placed++;
    G.streak++; s.stats.bestStreak = Math.max(s.stats.bestStreak, G.streak);
    let gain = 2 + Math.min(3, Math.floor(G.streak / 5));
    if (manual && TH.Settings.game.exact) gain += 1;
    if (G.fx.golden > 0) { gain *= 2; G.fx.golden--; }
    if (b.def.gold) { gain += 15; s.stats.golds++; s.goldFound[b.id] = 1; }
    TH.Save.earn(gain);
    const ev = {};
    if (row.filled === NV) {
      const cs = row.cs, full = (c) => c.rows.every((r) => r.filled === NV);
      ev.row = true; s.stats.rows++; TH.Save.earn(15);
      ev.knack = TH.ABIL.find((a) => a.unlock === s.stats.rows);
      if (full(cs)) { ev.cs = true; s.stats.cases++; TH.Save.earn(60); if (cases.every((c) => c.wing !== cs.wing || full(c))) { ev.wing = true; s.stats.wings++; TH.Save.earn(250); } }
    }
    if (manual) for (const a of TH.ABIL) { if (!TH.abilUnlocked(a) || s.charge[a.id] >= a.need) continue; if (++s.charge[a.id] >= a.need) TH.Audio.play('ready'); }
    const to = slotPos(b, new T.Vector3()), streak = G.streak;
    const dur = clamp(b.pos.distanceTo(to) / 7, 0.3, 1.1);
    const go = () => fly(b, to, row.cs.quat.clone(), dur, 0.22, () => land(b, row, gain, streak, ev)), ep = epoch;
    if (delay) { b.vis = false; write(b); setTimeout(() => { if (b.st === 'fly' && ep === epoch) { b.vis = true; handWorld(b.pos); go(); } }, delay * 1000); } else go();
    refreshHand(); TH.UI.hud(); aimKey = '';
    if (G.streak === 10 || G.streak === 25 || G.streak === 50 || G.streak === 100) TH.UI.flash(`Streak ×${G.streak}!`, 'good');
  }
  function land(b, row, gain, streak, ev) {
    const s = S();
    b.st = 'shelf'; row.landed++;
    TH.Audio.play('place', streak);
    burst(b.pos, b.def.gold ? 16 : 5);
    if (b.def.gold) { TH.Audio.play('gold'); TH.UI.flash(`Gilded book! +${gain} coins`, 'good'); TH.UI.tip('gold', 'Gilded books are rare and pay a big bonus when shelved.'); }
    if (s.stats.placed === 1) TH.UI.tip('streak', 'Keep shelving without trying a wrong shelf to build a streak — a longer streak pays more per book.');
    if (ev.row) {
      TH.Audio.play('bin');
      for (let v = 0; v < NV; v++) burst(slotPos(books[row.slots[v]], _v), 4);
      const cs = row.cs;
      if (ev.cs) {
        cs.done = true;
        TH.UI.banner(cs.cat.name + ' is complete!', 'A whole bookcase in order · +75 coins');
        TH.Audio.play('level'); burst(_v.set(cs.x, CH + 0.3, cs.z), 40);
        if (ev.wing) { setTimeout(() => TH.UI.banner(TH.WINGS[cs.wing].name + ' restored!', 'Every book back where it belongs · +250 coins'), 2600); }
      } else TH.UI.banner('Row complete', row.se.name + ' · +15 coins');
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
      for (const p of piles) {
        if (p.wing !== aim.cs.wing) continue;
        for (let k = p.books.length - 1; k >= 0 && got.length < Math.min(v, room); k--) if (books[p.books[k]].def.cat === cat) { const b = books[p.books[k]]; p.books.splice(k, 1); got.push([b, p]); }
      }
      if (!got.length) { TH.Audio.play('deny'); TH.UI.flash('No loose ' + aim.cs.cat.name + ' books left in this room'); return; }
      const touched = new Set(), ep = epoch;
      got.forEach(([b, p], k) => {
        b.pile = null; b.st = 'fly'; pending++; touched.add(p);
        setTimeout(() => ep === epoch && fly(b, handWorld(new T.Vector3()), b.quat.clone(), 0.45, 0.35, () => { pending--; b.st = 'held'; b.vis = false; write(b); G.held.push(b.id); s.stats.mostHeld = Math.max(s.stats.mostHeld, G.held.length); refreshHand(); TH.UI.hud(); aimKey = ''; TH.Audio.play('pick'); }), k * 70);
      });
      for (const p of touched) { restack(p, false); if (!p.books.length) s.stats.piles++; }
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
      m.se = se; m.y = h + se.t / 2; m.yaw = 0.32 + ((i * 37) % 9 - 4) * 0.03; h += se.t;
    });
    inst.needsUpdate = true;
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
        const cs = cases[b.def.cat], bc = beacons[n++], y = ROW_Y0 + b.se.row * ROW_DY, pulse = 0.28 + 0.14 * Math.sin(clock * 5);
        bc.quad.visible = bc.beam.visible = true;
        bc.quad.position.set(cs.x, y + ROW_H / 2, cs.z + cs.s * (CD / 2 + 0.008)); bc.quad.quaternion.copy(cs.quat); bc.quad.material.opacity = pulse;
        bc.beam.position.set(cs.x, CH + 0.9, cs.z + cs.s * 0.1); bc.beam.material.opacity = pulse;
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
    P.x = clamp(P.x + dx, PR, LEN - PR);
    for (const c of colliders) if (c.on && P.x > c.x0 - PR && P.x < c.x1 + PR && P.z > c.z0 - PR && P.z < c.z1 + PR) P.x = dx > 0 ? c.x0 - PR : c.x1 + PR;
    P.z = clamp(P.z + dz, -HALF + PR, HALF - PR);
    for (const c of colliders) if (c.on && P.x > c.x0 - PR && P.x < c.x1 + PR && P.z > c.z0 - PR && P.z < c.z1 + PR) P.z = dz > 0 ? c.z0 - PR : c.z1 + PR;
    const moved = Math.hypot(P.x - ox, P.z - oz);
    S().stats.metres += moved;
    bob += moved * 3.4; stepPhase += moved;
    if (stepPhase > 1.3) { stepPhase = 0; if (TH.Settings.audio.steps) TH.Audio.play('step'); }
  }
  function update(dt) {
    clock += dt;
    if (G.mode === 'menu') {
      const a = calm() ? 0.6 : clock * 0.045;
      camera.position.set(5 + Math.cos(a * 0.7) * 1.6, 1.6, Math.sin(a * 0.9) * 0.9);
      camera.rotation.set(-0.06, a, 0);
    } else if (!G.paused) {
      move(dt);
      const s = S(); s.stats.playTime += dt;
      camera.position.set(P.x, EYE + (TH.Settings.video.bob && !calm() ? Math.sin(bob) * 0.028 : 0), P.z);
      camera.rotation.set(P.pitch, P.yaw, 0);
      camera.updateMatrixWorld();
      G.aim = pick(); showAim();
      if (G.wing() !== lastWing) { lastWing = G.wing(); TH.UI.hud(); }
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
    if (dust.visible) { dust.position.x = wingOf(camera.position.x) * RW; dust.position.y = Math.sin(clock * 0.2) * 0.12; dust.rotation.y = 0; }
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
    books, piles, cases, gates, marks, P,
    lookAt(x, y, z) { const dx = x - P.x, dy = y - EYE, dz = z - P.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); },
    stand(x, z) { P.x = x; P.z = z; },
    slot(id) { return slotPos(books[id], new T.Vector3()); },
    flush() { for (const id of G.held.slice()) shelve(books[id], true); },
    // shelve one loose book directly (skips walking), used to fast-forward
    auto(wing) {
      for (const p of piles) { if (wing != null && p.wing !== wing) continue; if (p.books.length) { const b = takeFromPile(p, p.books.length - 1); shelve(b, true); return true; } }
      return false;
    }
  };
})();
