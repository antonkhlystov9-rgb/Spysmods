// Tidy Hollow — procedural item art. Every item is drawn in a 100x100 box centred on (0,0).
(function () {
  'use strict';
  const TH = window.TH;
  const O = '#4b382a', CR = '#fff4dc', WD = '#cfa06c', WDD = '#a3764a', MT = '#d3d7dc', MTD = '#9399a1';
  const LF = '#7fb062', LFD = '#5b8c47', GL = '#e7f1f3', PI2 = Math.PI * 2;
  let c;

  // tiny drawing vocabulary
  const F = (f, s = O, w = 3) => { if (f) { c.fillStyle = f; c.fill(); } if (s) { c.strokeStyle = s; c.lineWidth = w; c.stroke(); } };
  const S = (col = O, w = 3) => { c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const R = (x, y, w, h, r = 0) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const E = (x, y, rx, ry = rx, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, PI2); };
  const P = (...a) => { c.beginPath(); c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); c.closePath(); };
  const L = (...a) => { c.beginPath(); c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); };
  const B = (fn) => { c.beginPath(); fn(); };
  const HI = (x, y, w, h) => { R(x, y, w, h, Math.min(w, h) / 2); F('rgba(255,255,255,.5)', null); };
  const RING = (col, w) => { S(O, w + 5); S(col, w); };
  const ROT = (a, fn) => { c.save(); c.rotate(a); fn(); c.restore(); };
  const CLIP = (shape, fn) => { c.save(); shape(); c.clip(); fn(); c.restore(); };

  const D = {};

  // ----- pantry -----
  D.jar = (k) => {
    R(-28, -22, 56, 62, 12); F(GL);
    R(-24, -8, 48, 44, 9); F(k.m, null);
    R(-28, -22, 56, 62, 12); S();
    R(-30, -38, 60, 18, 5); F(k.d);
    R(-16, 2, 32, 20, 4); F(CR, O, 2);
    E(0, 12, 5); F(k.m, null);
    HI(-21, -14, 5, 38);
  };
  D.can = (k) => {
    R(-26, -36, 52, 72, 8); F(MT);
    R(-26, -20, 52, 40, 0); F(k.m);
    E(0, 0, 12); F(CR, O, 2);
    E(0, 0, 5); F(k.d, null);
    L(-26, -28, 26, -28); S(MTD, 2);
    L(-26, 28, 26, 28); S(MTD, 2);
    HI(-20, -16, 5, 32);
  };
  D.spice = (k) => {
    R(-17, -16, 34, 54, 8); F(GL);
    R(-13, 0, 26, 34, 5); F(k.m, null);
    R(-17, -16, 34, 54, 8); S();
    R(-19, -36, 38, 22, 7); F(k.d);
    for (let i = -1; i <= 1; i++) { E(i * 9, -25, 2.2); F(CR, null); }
    R(-11, 8, 22, 14, 3); F(CR, O, 2);
    L(-6, 15, 6, 15); S(k.d, 2);
  };
  D.box = (k) => {
    R(-28, -40, 56, 80, 5); F(k.m);
    R(-28, -40, 56, 20, [5, 5, 0, 0]); F(k.d);
    R(-18, -34, 36, 8, 3); F(CR, null);
    E(0, 12, 18); F(CR, O, 2.5);
    E(0, 12, 10); F(k.l, k.d, 2);
    HI(-23, -14, 4, 46);
  };
  D.tin = (k) => {
    R(-27, -24, 54, 62, 10); F(k.m);
    R(-23, -38, 46, 16, 6); F(k.d);
    R(-16, -6, 32, 30, 6); F(CR, O, 2);
    B(() => { c.moveTo(-8, 18); c.quadraticCurveTo(-10, -2, 9, -1); c.quadraticCurveTo(10, 17, -8, 18); }); F(LF, O, 1.8);
    L(-7, 17, 5, 3); S(LFD, 1.5);
    HI(-22, -14, 4, 40);
  };
  D.treat = (k) => {
    P(-22, 6, 22, 6, 16, 40, -16, 40); F(CR);
    for (let i = -1; i <= 1; i++) { L(i * 10, 9, i * 8, 38); S(WDD, 1.6); }
    B(() => {
      c.moveTo(-28, 8); c.bezierCurveTo(-36, -8, -20, -16, -17, -18);
      c.bezierCurveTo(-18, -36, 10, -40, 14, -22); c.bezierCurveTo(32, -20, 35, 0, 28, 8); c.closePath();
    }); F(k.m);
    B(() => { c.moveTo(-16, -6); c.quadraticCurveTo(0, -14, 18, -8); }); S(k.l, 3);
    E(2, -38, 6); F('#d9433f', O, 2);
    R(-14, -2, 6, 3, 1.5); F(CR, null); R(8, 0, 6, 3, 1.5); F(CR, null);
  };

  // ----- reading nook -----
  D.book = (k) => {
    R(-25, -38, 50, 76, 5); F(k.m);
    R(-25, -38, 11, 76, [5, 0, 0, 5]); F(k.d, O, 2.5);
    R(-8, -24, 26, 18, 3); F(CR, O, 2);
    L(-3, -18, 13, -18); S(k.d, 2); L(-3, -12, 9, -12); S(k.d, 2);
    R(-8, 20, 26, 5, 2); F(k.l, null);
    R(-8, 28, 26, 3, 1.5); F(k.l, null);
  };
  D.scroll = (k) => {
    R(-34, -17, 68, 34, 6); F('#f3e2b8');
    E(-34, 0, 7, 18); F('#e0c88f'); E(34, 0, 7, 18); F('#e0c88f');
    R(-9, -19, 18, 38, 2); F(k.m);
    E(0, 0, 9); F(k.d);
    E(0, 0, 3.5); F(k.l, null);
  };
  D.pencil = (k) => ROT(-0.62, () => {
    R(-38, -8, 60, 16, 2); F(k.m);
    L(-36, -2.5, 20, -2.5); S(k.d, 2); L(-36, 3, 20, 3); S(k.l, 2);
    P(22, -8, 42, 0, 22, 8); F('#f0d9b0');
    P(35, -3, 42, 0, 35, 3); F(O, null);
    R(-48, -8, 11, 16, 4); F('#f3a3ad');
    R(-40, -8, 6, 16, 0); F(MT, O, 2);
  });
  D.envelope = (k) => {
    R(-37, -25, 74, 50, 5); F(k.m);
    L(-36, -23, 0, 7, 36, -23); S(O, 2.5);
    L(-36, 24, -10, 0); S(k.d, 2); L(36, 24, 10, 0); S(k.d, 2);
    E(0, 7, 9); F(CR, O, 2.5);
    E(0, 7, 4); F(k.d, null);
  };
  D.ink = (k) => {
    R(-10, -26, 20, 20, 3); F(GL);
    R(-25, -10, 50, 44, 9); F(GL);
    R(-21, 2, 42, 28, 6); F(k.m, null);
    R(-25, -10, 50, 44, 9); S();
    R(-13, -38, 26, 13, 4); F(k.d);
    R(-12, 8, 24, 15, 3); F(CR, O, 2);
    E(0, 15.5, 4); F(k.m, null);
    HI(-19, -4, 4, 26);
  };
  D.quill = (k) => {
    B(() => { c.moveTo(-18, 22); c.bezierCurveTo(-32, -8, 0, -38, 30, -42); c.bezierCurveTo(32, -10, 6, 18, -18, 22); }); F(k.m);
    L(-36, 42, 28, -40); S(O, 2.5);
    L(-8, 6, -14, -6); S(k.d, 2); L(2, -6, -4, -20); S(k.d, 2); L(12, -18, 8, -30); S(k.d, 2);
    L(-4, 2, 10, 4); S(k.l, 2); L(6, -10, 20, -10); S(k.l, 2);
    P(-38, 44, -30, 32, -27, 38); F(O, null);
  };

  // ----- craft corner -----
  D.yarn = (k) => {
    B(() => { c.moveTo(22, 24); c.quadraticCurveTo(46, 30, 36, 44); }); S(O, 6); S(k.d, 3);
    E(0, 0, 34); F(k.m);
    CLIP(() => E(0, 0, 33), () => {
      for (let i = -3; i <= 3; i++) { E(i * 11, 0, 44, 15, 0.7); S(k.d, 2); }
      for (let i = -2; i <= 2; i++) { E(i * 13, 4, 44, 16, -0.6); S(k.l, 2); }
    });
    E(0, 0, 34); S();
  };
  D.button = (k, v) => {
    E(0, 0, 33); F(k.m);
    E(0, 0, 23); F(k.l, k.d, 2.5);
    const h = v % 2 ? [[-7, 0], [7, 0]] : [[-7, -7], [7, -7], [-7, 7], [7, 7]];
    for (const [x, y] of h) { E(x, y, 3.6); F(O, null); }
    HI(-22, -24, 14, 6);
  };
  D.fabric = (k, v) => {
    P(14, 16, 38, 16, 38, 38, 20, 32); F(k.m);
    R(-36, -22, 74, 42, 8); F(k.m);
    CLIP(() => R(-34, -20, 70, 38, 7), () => {
      if (v % 3 === 0) { for (let x = -30; x < 40; x += 14) for (let y = -14; y < 20; y += 12) { E(x + (y % 24 ? 7 : 0), y, 3); F(k.l, null); } }
      else if (v % 3 === 1) { for (let x = -40; x < 60; x += 12) { L(x, -24, x - 14, 24); S(k.l, 3); } }
      else { for (let x = -30; x < 40; x += 14) { L(x, -24, x, 24); S(k.d, 2); } for (let y = -12; y < 20; y += 12) { L(-40, y, 44, y); S(k.d, 2); } }
    });
    R(-36, -22, 74, 42, 8); S();
    E(-34, -1, 7, 21); F(k.d); E(-34, -1, 3, 9); F(CR, O, 1.5);
  };
  D.tube = (k) => {
    ROT(0.5, () => {
      P(-16, -30, 16, -30, 20, 26, -20, 26); F(MT);
      R(-17.5, -14, 35, 28, 2); F(k.m, O, 2.5);
      R(-22, 24, 44, 9, 2); F(MTD);
      R(-8, -43, 16, 14, 3); F(k.d);
    });
    E(28, 36, 10, 6); F(k.m, O, 2.5);
  };
  D.spool = (k) => {
    R(-19, -28, 38, 56, 4); F(k.m);
    for (let i = 0; i < 6; i++) { L(-19, -20 + i * 9, 19, -16 + i * 9); S(k.d, 1.8); }
    R(-26, -38, 52, 11, 4); F(WD); R(-26, 27, 52, 11, 4); F(WD);
    B(() => { c.moveTo(19, 18); c.quadraticCurveTo(36, 22, 32, 40); }); S(k.d, 2.5);
  };
  D.scissors = (k) => {
    P(-5, 0, 7, -44, 12, -40, 3, 6); F(MT);
    P(5, 0, -7, -44, -12, -40, -3, 6); F(MT);
    E(0, -4, 3); F(O, null);
    E(-14, 26, 12, 16, 0.3); RING(k.m, 6);
    E(14, 26, 12, 16, -0.3); RING(k.m, 6);
  };

  // ----- potting shed -----
  D.packet = (k) => {
    R(-27, -38, 54, 76, 4); F(CR);
    R(-27, -38, 54, 17, [4, 4, 0, 0]); F(k.m);
    E(-11, -6, 9, 4.5, -0.6); F(LF, O, 1.8); E(11, -6, 9, 4.5, 0.6); F(LF, O, 1.8);
    E(0, 8, 14); F(k.m, O, 2.5);
    E(-4, 4, 4); F(k.l, null);
    R(-15, 28, 30, 4, 2); F(k.d, null);
  };
  D.pot = (k) => {
    E(-13, -18, 10, 21, -0.45); F(LF); E(13, -18, 10, 21, 0.45); F(LF);
    E(0, -26, 9, 20); F(LFD);
    E(0, -42, 8); F(k.l, O, 2.5); E(0, -42, 3); F(k.d, null);
    P(-26, 4, 26, 4, 20, 42, -20, 42); F(k.m);
    R(-30, -6, 60, 13, 4); F(k.d);
    HI(-18, 12, 4, 22);
  };
  D.trowel = (k, v) => ROT(0.55, () => {
    if (v % 2 === 0) {
      B(() => { c.moveTo(-13, -8); c.quadraticCurveTo(-15, -36, 0, -47); c.quadraticCurveTo(15, -36, 13, -8); c.closePath(); }); F(MT);
      L(0, -40, 0, -12); S(MTD, 2);
    } else {
      for (let i = -1; i <= 1; i++) { R(i * 10 - 3, -47, 6, 36, 3); F(MT); }
      R(-14, -16, 28, 9, 3); F(MT);
    }
    R(-3.5, -9, 7, 16, 2); F(MTD);
    R(-8, 5, 16, 41, 7); F(k.m);
    HI(-4, 10, 3, 28);
  });
  D.wcan = (k) => {
    P(20, 6, 40, -18, 46, -12, 24, 20); F(k.m);
    E(44, -17, 8, 4.5, 0.85); F(k.d);
    B(() => c.arc(-22, 4, 17, Math.PI * 0.5, Math.PI * 1.5)); RING(k.d, 5);
    R(-25, -14, 50, 50, 8); F(k.m);
    R(-25, -14, 50, 9, 4); F(k.d);
    HI(-19, 2, 5, 26);
  };
  D.glove = (k) => {
    c.save(); c.translate(24, 4); c.rotate(0.7); R(-6, -18, 12, 26, 6); F(k.m); c.restore();
    for (let i = 0; i < 4; i++) { R(-21 + i * 10.5, -38 + (i === 0 || i === 3 ? 7 : 0), 10.5, 34, 5); F(k.m); }
    R(-21, -12, 42, 38, 10); F(k.m);
    R(-18, -14, 36, 20, 4); F(k.m, null);
    R(-17, 22, 34, 19, 5); F(k.d);
    L(-10, 28, 10, 28); S(k.l, 2);
  };
  D.birdhouse = (k) => {
    R(-32, 36, 64, 7, 3); F(WD);
    R(-24, -14, 48, 52, 4); F(k.m);
    P(-35, -11, 0, -43, 35, -11); F(k.d);
    E(0, 6, 10); F(O, null);
    R(-2.5, 20, 5, 12, 2); F(WD, O, 2);
    HI(-19, -6, 4, 34);
  };

  // ----- wardrobe -----
  D.sock = (k) => {
    B(() => {
      c.moveTo(-14, -40); c.lineTo(11, -40); c.lineTo(12, 4); c.quadraticCurveTo(36, 10, 36, 26);
      c.quadraticCurveTo(36, 41, 18, 41); c.lineTo(-2, 41); c.quadraticCurveTo(-18, 40, -16, 18); c.closePath();
    }); F(k.m);
    L(-15, -16, 11, -16); S(k.d, 3.5); L(-15, -6, 12, -6); S(k.d, 3.5);
    B(() => c.arc(22, 27, 13, -1.1, 1.5)); S(k.d, 3);
    R(-17, -43, 31, 13, 4); F(k.l);
  };
  D.hat = (k) => {
    B(() => { c.moveTo(-30, 14); c.quadraticCurveTo(-30, -32, 0, -32); c.quadraticCurveTo(30, -32, 30, 14); c.closePath(); }); F(k.m);
    for (let i = -2; i <= 2; i++) { L(i * 9, -27 + Math.abs(i) * 5, i * 11, 12); S(k.d, 2); }
    R(-34, 10, 68, 21, 8); F(k.l);
    for (let i = -2; i <= 2; i++) { L(i * 12, 14, i * 12, 27); S(k.m, 2); }
    E(0, -36, 10); F(CR);
  };
  D.scarf = (k) => {
    P(-19, -10, 0, -10, -2, 34, -23, 34); F(k.m);
    P(3, -10, 21, -10, 26, 26, 8, 26); F(k.m);
    L(-22, 20, -2, 20); S(k.l, 4); L(6, 12, 24, 12); S(k.l, 4);
    for (let i = 0; i < 5; i++) { L(-21 + i * 4.5, 34, -21 + i * 4.5, 43); S(O, 2); }
    for (let i = 0; i < 4; i++) { L(10 + i * 5, 26, 11 + i * 5, 35); S(O, 2); }
    R(-31, -32, 62, 26, 13); F(k.m);
    L(-18, -26, -12, -12); S(k.l, 4); L(4, -26, 10, -12); S(k.l, 4);
  };
  D.shirt = (k) => {
    P(-18, -34, -8, -38, 8, -38, 18, -34, 41, -18, 31, -3, 20, -11, 20, 39, -20, 39, -20, -11, -31, -3, -41, -18); F(k.m);
    B(() => c.arc(0, -38, 9, 0, Math.PI)); F(k.d, O, 2.5);
    E(0, 8, 10); F(k.l, null);
    E(0, 8, 4); F(k.d, null);
  };
  D.boot = (k) => {
    B(() => {
      c.moveTo(-16, -40); c.lineTo(11, -40); c.lineTo(11, 8); c.quadraticCurveTo(38, 12, 38, 30);
      c.lineTo(38, 36); c.lineTo(-16, 36); c.closePath();
    }); F(k.m);
    R(-19, 33, 59, 9, 3); F(k.d);
    R(-19, -43, 33, 11, 4); F(k.l);
    HI(-10, -26, 5, 44);
  };
  D.mitten = (k) => {
    E(-25, 2, 9, 15, -0.4); F(k.m);
    B(() => { c.moveTo(-18, 22); c.lineTo(-18, -16); c.quadraticCurveTo(-18, -41, 2, -41); c.quadraticCurveTo(21, -41, 21, -16); c.lineTo(21, 22); c.closePath(); }); F(k.m);
    R(-21, 18, 45, 21, 6); F(k.l);
    for (let i = -1; i <= 1; i++) { L(1.5 + i * 12, 22, 1.5 + i * 12, 35); S(k.m, 2); }
    E(1.5, -10, 8); F(CR, null);
    E(1.5, -10, 3.5); F(k.d, null);
  };

  // ----- kitchen -----
  D.mug = (k) => {
    E(26, 4, 13, 15); RING(k.d, 5);
    R(-30, -24, 54, 58, [6, 6, 17, 17]); F(k.m);
    R(-30, -24, 54, 10, 4); F(k.l);
    E(-3, 12, 9); F(CR, null);
    B(() => { c.moveTo(-10, -30); c.quadraticCurveTo(-16, -37, -10, -44); }); S('rgba(255,255,255,.85)', 3);
    B(() => { c.moveTo(4, -30); c.quadraticCurveTo(-2, -37, 4, -44); }); S('rgba(255,255,255,.85)', 3);
  };
  D.plate = (k) => {
    E(0, 0, 40); F(CR);
    E(0, 0, 32); S(k.m, 7);
    E(0, 0, 21); F('#fffaf0', k.d, 2);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; E(Math.cos(a) * 32, Math.sin(a) * 32, 2.2); F(CR, null); }
  };
  D.teapot = (k) => {
    B(() => { c.moveTo(-22, 8); c.quadraticCurveTo(-42, 4, -44, -16); c.lineTo(-35, -18); c.quadraticCurveTo(-32, -4, -20, -6); c.closePath(); }); F(k.m);
    E(29, 4, 13, 15); RING(k.d, 5);
    E(0, 8, 31, 28); F(k.m);
    R(-15, -25, 30, 9, 4); F(k.d);
    E(0, -30, 5.5); F(k.d);
    HI(-20, -6, 6, 20);
  };
  D.spoon = (k, v) => ROT(-0.5, () => {
    R(-5.5, -6, 11, 52, 5.5); F(k.m);
    if (v % 2) { E(0, -25, 15, 21); F(WD); E(0, -25, 8, 13); F(WDD, null); }
    else { R(-15, -46, 30, 40, 7); F(WD); for (let i = -1; i <= 1; i++) { R(i * 8 - 1.5, -40, 3, 24, 1.5); F(WDD, null); } }
    HI(-2.5, 4, 3, 30);
  });
  D.pan = (k) => {
    R(20, -6, 32, 9, 4); F(WDD);
    R(-32, -10, 58, 44, [4, 4, 13, 13]); F(k.m);
    R(-35, -17, 64, 10, 4); F(k.d);
    R(-10, -28, 14, 11, 4); F(k.l);
    HI(-26, -2, 5, 24);
  };
  D.bowl = (k) => {
    R(-13, 30, 26, 8, 3); F(k.d);
    B(() => { c.moveTo(-37, -8); c.quadraticCurveTo(-35, 34, 0, 34); c.quadraticCurveTo(35, 34, 37, -8); c.closePath(); }); F(k.m);
    B(() => { c.moveTo(-32, 8); c.quadraticCurveTo(0, 22, 32, 8); }); S(k.d, 3);
    E(0, -8, 37, 10); F(k.l);
  };

  // ----- toy chest -----
  D.block = (k, v, def) => {
    R(-31, -31, 62, 62, 8); F(k.m);
    R(-21, -21, 42, 42, 5); F(k.l, k.d, 2.5);
    c.fillStyle = k.d; c.font = 'bold 36px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText((def ? def.name[0] : 'A').toUpperCase(), 0, 3);
  };
  D.plush = (k) => {
    E(-22, -28, 10); F(k.m); E(22, -28, 10); F(k.m);
    E(-22, -28, 4.5); F(k.l, null); E(22, -28, 4.5); F(k.l, null);
    E(-24, 22, 9, 11); F(k.m); E(24, 22, 9, 11); F(k.m);
    E(0, 24, 24, 20); F(k.m);
    E(0, 26, 12, 11); F(k.l, null);
    E(0, -8, 28, 25); F(k.m);
    E(0, 0, 11, 9); F(k.l, null);
    E(-10, -13, 3); F(O, null); E(10, -13, 3); F(O, null); E(0, -3, 3.6, 2.6); F(O, null);
  };
  D.ball = (k) => {
    E(0, 0, 35); F(k.m);
    CLIP(() => E(0, 0, 34), () => {
      B(() => { c.moveTo(-40, -8); c.quadraticCurveTo(0, -28, 40, -8); c.lineTo(40, 10); c.quadraticCurveTo(0, -10, -40, 10); c.closePath(); }); F(CR, null);
      B(() => { c.moveTo(-40, 22); c.quadraticCurveTo(0, 4, 40, 22); }); S(k.d, 4);
    });
    E(0, 0, 35); S();
    HI(-19, -25, 13, 7);
  };
  D.car = (k) => {
    P(-22, -2, -14, -25, 14, -25, 25, -2); F(k.m);
    R(-41, -3, 82, 28, 9); F(k.m);
    P(-15, -4, -10, -19, -2, -19, -2, -4); F('#cfe8f5', O, 2);
    P(3, -4, 3, -19, 11, -19, 17, -4); F('#cfe8f5', O, 2);
    L(-36, 10, 36, 10); S(k.d, 2.5);
    E(37, 6, 3.5); F('#ffe08a', O, 1.5);
    for (const x of [-22, 22]) { E(x, 25, 11); F(O, null); E(x, 25, 4.5); F(MT, null); }
  };
  D.duck = (k) => {
    P(-32, 8, -45, -6, -26, -2); F(k.m);
    E(-4, 14, 31, 22); F(k.m);
    E(14, -16, 17); F(k.m);
    E(10, -6, 14, 10); F(k.m, null);
    P(28, -19, 45, -13, 28, -8); F('#f08c3a');
    E(18, -21, 3); F(O, null);
    E(-9, 14, 14, 9, -0.2); F(k.d, O, 2.5);
  };
  D.top = (k) => {
    R(-3.5, -45, 7, 22, 3); F(WD);
    P(-34, -18, 34, -18, 0, 41); F(k.m);
    B(() => { c.moveTo(-23, 0); c.quadraticCurveTo(0, 10, 23, 0); }); S(k.d, 3.5);
    B(() => { c.moveTo(-13, 17); c.quadraticCurveTo(0, 23, 13, 17); }); S(k.l, 3);
    E(0, -18, 34, 10); F(k.l);
    E(0, -18, 6, 2.5); F(WDD, null);
  };

  // ----- apothecary -----
  D.potion = (k) => {
    R(-9, -30, 18, 22, 2); F(GL);
    E(0, 13, 28); F(GL);
    CLIP(() => E(0, 13, 25), () => { R(-30, 6, 60, 40); F(k.m, null); E(0, 6, 27, 5); F(k.l, null); });
    E(0, 13, 28); S();
    R(-11.5, -42, 23, 13, 4); F(WD);
    E(-8, 24, 3.2); F(k.l, null); E(7, 18, 2.2); F(k.l, null); E(2, 30, 2); F(k.l, null);
    HI(-19, 0, 5, 16);
  };
  D.crystal = (k) => {
    P(12, 38, 14, 6, 26, -12, 35, 8, 30, 38); F(k.d);
    P(-8, 38, -23, 6, -12, -34, 4, -41, 15, -8, 11, 38); F(k.m);
    P(-21, 6, -12, -33, 2, -39, -1, 37, -7, 37); F(k.l, null);
    P(-8, 38, -23, 6, -12, -34, 4, -41, 15, -8, 11, 38); S();
    L(3, -40, -1, 37); S(k.d, 2);
    P(-34, 38, -30, 18, -22, 12, -17, 38); F(k.m);
  };
  D.candle = (k) => {
    B(() => { c.moveTo(0, -46); c.quadraticCurveTo(13, -29, 0, -20); c.quadraticCurveTo(-13, -29, 0, -46); }); F('#ffd15c', O, 2.2);
    E(0, -27, 3, 4.5); F('#ff9a3c', null);
    L(0, -20, 0, -12); S(O, 2.5);
    R(-20, -13, 40, 48, 5); F(k.m);
    B(() => { c.moveTo(-20, -9); c.lineTo(-20, 0); c.quadraticCurveTo(-13, 10, -8, 0); c.quadraticCurveTo(-2, -8, 4, 2); c.quadraticCurveTo(8, 8, 12, -9); c.closePath(); }); F(k.l, null);
    R(-20, -13, 40, 48, 5); S();
    R(-29, 33, 58, 9, 4); F(MTD);
  };
  D.mushroom = (k) => {
    R(-11, -2, 22, 42, 9); F(CR);
    B(() => { c.moveTo(-39, 5); c.quadraticCurveTo(-37, -39, 0, -39); c.quadraticCurveTo(37, -39, 39, 5); c.quadraticCurveTo(0, 13, -39, 5); }); F(k.m);
    E(-15, -17, 6.5); F(CR, null); E(10, -24, 5); F(CR, null); E(19, -7, 4.5); F(CR, null); E(-3, -4, 3.5); F(CR, null);
  };
  D.shell = (k) => {
    P(-13, 28, 13, 28, 9, 41, -9, 41); F(k.l);
    B(() => { c.moveTo(0, 34); c.lineTo(-37, -2); c.quadraticCurveTo(-35, -39, 0, -39); c.quadraticCurveTo(35, -39, 37, -2); c.closePath(); }); F(k.m);
    for (let i = -2; i <= 2; i++) { L(0, 30, i * 14, -31 + Math.abs(i) * 6); S(k.d, 2.2); }
    HI(-22, -26, 10, 5);
  };
  D.herb = (k) => {
    for (let i = -2; i <= 2; i++) { L(i * 3, 40, i * 10, -8); S(LFD, 3); }
    E(-17, 10, 8, 4, 0.5); F(LF, O, 1.8); E(17, 12, 8, 4, -0.5); F(LF, O, 1.8);
    for (let i = -2; i <= 2; i++) { E(i * 11, -18 - (2 - Math.abs(i)) * 6, 8, 12); F(k.m, O, 2.5); E(i * 11 - 2, -22 - (2 - Math.abs(i)) * 6, 2.5, 4); F(k.l, null); }
    R(-11, 18, 22, 9, 3); F(CR, O, 2);
  };

  // ----- workshop -----
  D.driver = (k) => ROT(0.6, () => {
    R(-3, -44, 6, 40, 2); F(MT);
    P(-4.5, -44, 4.5, -44, 2, -51, -2, -51); F(MTD);
    R(-11, -6, 22, 48, 9); F(k.m);
    for (let i = 0; i < 3; i++) { L(-11, 8 + i * 9, 11, 8 + i * 9); S(k.d, 2.2); }
    HI(-6, 0, 3, 34);
  });
  D.paintcan = (k) => {
    B(() => c.arc(0, -22, 31, Math.PI * 1.12, Math.PI * 1.88)); S(O, 2.5);
    R(-29, -22, 58, 60, 5); F(MT);
    R(-29, -6, 58, 30, 0); F(k.m);
    R(-13, 2, 26, 14, 3); F(CR, O, 2);
    R(-32, -29, 64, 10, 4); F(MTD);
    R(-20, -21, 11, 20, 5.5); F(k.m, O, 2.2); R(-5, -21, 9, 11, 4.5); F(k.m, O, 2.2);
  };
  D.tape = (k) => {
    P(28, 12, 47, 20, 43, 32, 23, 24); F(k.l);
    E(0, 0, 36); F(k.m);
    E(0, 0, 26); S(k.d, 2);
    E(0, 0, 16); F('#eadcc2');
    HI(-24, -26, 14, 6);
  };
  D.hammer = (k, v) => ROT(0.5, () => {
    R(-5.5, -14, 11, 60, 4); F(WD);
    R(-27, -38, 54, 26, v % 2 ? 11 : 4); F(k.m);
    R(-27, -38, 11, 26, [v % 2 ? 11 : 4, 0, 0, v % 2 ? 11 : 4]); F(k.d, O, 2.5);
    HI(-10, -34, 30, 5);
  });
  D.gear = (k) => {
    c.save();
    for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); R(-7.5, -41, 15, 18, 3); F(k.m); }
    c.restore();
    E(0, 0, 30); F(k.m);
    E(0, 0, 19); S(k.d, 2.5);
    E(0, 0, 9); F('#5a4636');
  };
  D.bulb = (k) => {
    B(() => { c.arc(0, -10, 28, Math.PI * 0.72, Math.PI * 0.28); c.lineTo(11, 23); c.lineTo(-11, 23); c.closePath(); }); F(k.l);
    E(0, -10, 17); F(k.m, null);
    L(-8, 12, -4, -8, 4, -8, 8, 12); S(k.d, 2.5);
    R(-12, 22, 24, 17, 3); F(MT);
    L(-12, 28, 12, 28); S(O, 1.6); L(-12, 33.5, 12, 33.5); S(O, 1.6);
    HI(-18, -26, 9, 6);
  };

  // ----- holiday trunk -----
  D.bauble = (k) => {
    B(() => c.arc(0, -44, 5, 0, PI2)); S(O, 2.5);
    R(-7.5, -41, 15, 11, 3); F(MT);
    E(0, 4, 33); F(k.m);
    CLIP(() => E(0, 4, 32), () => {
      R(-40, -4, 80, 15); F(k.l, null);
      for (let i = -3; i <= 3; i++) { E(i * 11, 3.5, 3); F(k.d, null); }
    });
    E(0, 4, 33); S();
    HI(-20, -18, 11, 6);
  };
  D.gift = (k) => {
    R(-30, -14, 60, 52, 4); F(k.m);
    R(-34, -25, 68, 15, 4); F(k.m);
    R(-6.5, -25, 13, 63, 0); F(CR, O, 2.5);
    E(-13, -33, 12, 8, 0.4); F(CR); E(13, -33, 12, 8, -0.4); F(CR);
    E(0, -29, 5.5); F(CR);
    HI(-25, -6, 4, 36);
  };
  D.globe = (k) => {
    E(0, -6, 32); F('#dff0f7');
    CLIP(() => E(0, -6, 30), () => { R(-32, 12, 64, 20); F('#ffffff', null); });
    R(-2.5, 8, 5, 8); F(WDD, null);
    P(-12, 10, 0, -20, 12, 10); F(k.d, O, 2);
    for (const [x, y] of [[-17, -14], [15, -18], [-8, -26], [19, 0], [-20, 2], [6, -30]]) { E(x, y, 2.4); F('#ffffff', null); }
    E(0, -6, 32); S();
    P(-25, 21, 25, 21, 31, 41, -31, 41); F(k.m);
    L(-27, 30, 27, 30); S(k.d, 2.2);
    HI(-21, -27, 11, 6);
  };
  D.bell = (k) => {
    B(() => c.arc(0, -39, 6, 0, PI2)); S(O, 3);
    E(0, 32, 7); F(k.d);
    B(() => {
      c.moveTo(-31, 22); c.quadraticCurveTo(-18, 10, -18, -10); c.quadraticCurveTo(-18, -34, 0, -34);
      c.quadraticCurveTo(18, -34, 18, -10); c.quadraticCurveTo(18, 10, 31, 22); c.closePath();
    }); F(k.m);
    R(-33, 19, 66, 9, 4); F(k.d);
    HI(-11, -24, 5, 24);
  };
  D.lantern = (k) => {
    L(0, -48, 0, -38); S(O, 2.5);
    L(0, 40, 0, 49); S(O, 6); S(k.d, 3);
    E(0, 1, 31, 32); F(k.m);
    E(0, 1, 11, 15); F('rgba(255,244,190,.55)', null);
    E(0, 1, 10, 32); S(k.d, 2); E(0, 1, 21, 32); S(k.d, 2);
    R(-13, -39, 26, 9, 3); F(k.d); R(-13, 31, 26, 9, 3); F(k.d);
  };
  D.candy = (k) => {
    P(-21, 0, -43, -17, -40, 17); F(k.l); P(21, 0, 43, -17, 40, 17); F(k.l);
    L(-30, -6, -38, -10); S(k.d, 2); L(30, -6, 38, -10); S(k.d, 2);
    E(0, 0, 25, 21); F(k.m);
    CLIP(() => E(0, 0, 24, 20), () => { L(-13, -22, -5, 22); S(CR, 5.5); L(4, -22, 12, 22); S(CR, 5.5); });
    E(0, 0, 25, 21); S();
    HI(-15, -15, 12, 5);
  };

  // ---------- public API ----------
  const NEUTRAL = { m: '#e3d3b6', l: '#f5ecd9', d: '#bfa988' };
  const SP = 176, SCALE = 1.5;          // sprite pixels; 100 units -> 150 px with a margin
  const cache = new Map();
  const Draw = TH.Draw = {};
  Draw.SPRITE_RATIO = SP / (100 * SCALE);

  // paint one item centred at (x,y) where `size` is the pixel size of its 100-unit box
  Draw.paint = (ctx, id, x, y, size, opt = {}) => {
    const def = TH.ITEMS[id];
    if (!def) return;
    c = ctx;
    c.save();
    c.translate(x, y); c.scale(size / 100, size / 100);
    c.lineJoin = 'round'; c.lineCap = 'round';
    D[def.shape](opt.neutral ? NEUTRAL : TH.FAMS[def.fam].pal, def.v, def);
    c.restore();
  };

  Draw.sprite = (id, gold) => {
    const key = id + (gold ? '*' : '');
    let s = cache.get(key);
    if (s) return s;
    s = document.createElement('canvas'); s.width = s.height = SP;
    const x = s.getContext('2d');
    Draw.paint(x, id, SP / 2, SP / 2, 100 * SCALE);
    if (gold) {
      x.globalCompositeOperation = 'source-atop';
      const g = x.createLinearGradient(0, 0, SP, SP);
      g.addColorStop(0, 'rgba(255,225,120,.72)'); g.addColorStop(0.5, 'rgba(255,196,50,.6)'); g.addColorStop(1, 'rgba(214,150,30,.72)');
      x.fillStyle = g; x.fillRect(0, 0, SP, SP);
      x.globalCompositeOperation = 'source-over';
    }
    cache.set(key, s);
    return s;
  };
  Draw.icon = (id) => {
    const key = id + '~';
    let s = cache.get(key);
    if (s) return s;
    s = document.createElement('canvas'); s.width = s.height = 96;
    Draw.paint(s.getContext('2d'), id, 48, 48, 80, { neutral: true });
    cache.set(key, s);
    return s;
  };
  // blit a cached sprite so its 100-unit box is `size` wide
  Draw.blit = (ctx, id, gold, x, y, size, rot) => {
    const s = Draw.sprite(id, gold), w = size * Draw.SPRITE_RATIO;
    if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(s, -w / 2, -w / 2, w, w); ctx.restore(); }
    else ctx.drawImage(s, x - w / 2, y - w / 2, w, w);
  };

  // colour-blind helper shapes, one per colour family
  Draw.sym = (ctx, fam, x, y, r, col = '#fff') => {
    c = ctx; c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = O; c.lineWidth = Math.max(1.5, r * 0.22); c.lineJoin = 'round';
    switch (fam) {
      case 'r': P(0, -r, r, r * 0.8, -r, r * 0.8); break;
      case 'o': P(0, -r, r, 0, 0, r, -r, 0); break;
      case 'y': c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); break;
      case 'g': E(0, 0, r * 0.9); break;
      case 'b': R(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, 1); break;
      case 'p': c.beginPath(); c.moveTo(0, r); c.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.5, -r * 1.3, 0, -r * 0.4); c.bezierCurveTo(r * 0.5, -r * 1.3, r * 1.6, -r * 0.2, 0, r); break;
      case 'k': R(-r * 0.35, -r, r * 0.7, r * 2, 1); c.fill(); c.stroke(); R(-r, -r * 0.35, r * 2, r * 0.7, 1); break;
      default: c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
    }
    c.fill(); c.stroke(); c.restore();
  };

  Draw.OUTLINE = O;
  Draw.CREAM = CR;
})();
