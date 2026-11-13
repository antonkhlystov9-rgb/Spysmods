// Tidy Hollow — all sound is synthesised live (no audio files)
(function () {
  'use strict';
  const TH = window.TH;
  const A = TH.Audio = {};
  let ac = null, master, musicG, sfxG, ambG, echo, noiseBuf, brownBuf;
  let focusMul = 1, userMute = false, ambKind = '', ambNodes = [], crackleTimer = 0, musicTimer = 0, nextBar = 0, bar = 0, melIdx = 4;

  const now = () => ac.currentTime;
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  A.init = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    const comp = ac.createDynamicsCompressor();
    master = ac.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(ac.destination);
    musicG = ac.createGain(); sfxG = ac.createGain(); ambG = ac.createGain();
    musicG.connect(master); sfxG.connect(master); ambG.connect(master);
    // soft echo for the music box
    echo = ac.createDelay(1); echo.delayTime.value = 0.42;
    const fb = ac.createGain(); fb.gain.value = 0.3;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    echo.connect(lp); lp.connect(fb); fb.connect(echo); lp.connect(musicG);
    // noise buffers
    const len = ac.sampleRate * 3;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    brownBuf = ac.createBuffer(1, len, ac.sampleRate);
    const w = noiseBuf.getChannelData(0), b = brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      w[i] = Math.random() * 2 - 1;
      last = (last + 0.02 * w[i]) / 1.02; b[i] = last * 3.5;
    }
    A.apply();
    nextBar = now() + 0.3;
    musicTimer = setInterval(schedule, 200);
  };

  A.apply = () => {
    if (!ac) return;
    const s = TH.Settings.audio, t = now();
    const m = userMute ? 0 : (s.master / 100) * focusMul;
    master.gain.setTargetAtTime(m, t, 0.08);
    musicG.gain.setTargetAtTime((s.music / 100) * 0.55, t, 0.08);
    sfxG.gain.setTargetAtTime((s.sfx / 100) * 0.9, t, 0.08);
    ambG.gain.setTargetAtTime((s.ambience / 100) * 0.6, t, 0.08);
    if (s.ambType !== ambKind) startAmb(s.ambType);
  };
  A.setFocus = (focused) => { focusMul = !focused && TH.Settings.audio.muteUnfocused ? 0 : 1; A.apply(); };
  A.toggleMute = () => { userMute = !userMute; A.apply(); return userMute; };
  A.isMuted = () => userMute;

  // ---------- building blocks ----------
  function tone(f, t, dur, type, vol, dest, attack, slideTo) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG);
    o.start(t); o.stop(t + dur + 0.05);
    return g;
  }
  function noise(t, dur, vol, type, freq, q, dest, sweepTo) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || sfxG);
    src.start(t, Math.random() * 2); src.stop(t + dur + 0.05);
  }
  const PENT = [0, 2, 4, 7, 9];
  const arp = (notes, gap, dur, type, vol) => { const t = now(); notes.forEach((n, i) => tone(midi(n), t + i * gap, dur, type, vol)); };

  // ---------- sound effects ----------
  const fx = {
    pick() { tone(540, now(), 0.07, 'triangle', 0.1); noise(now(), 0.04, 0.05, 'highpass', 2500); },
    place(combo) {
      const step = Math.min(combo, 14), semi = PENT[step % 5] + 12 * Math.floor(step / 5);
      const f = 392 * Math.pow(2, semi / 12), t = now();
      tone(f, t, 0.24, 'triangle', 0.2); tone(f * 2, t, 0.14, 'sine', 0.07);
      noise(t, 0.05, 0.12, 'lowpass', 900);
    },
    wrong() { const t = now(); tone(196, t, 0.2, 'sine', 0.22, null, 0.01, 130); tone(147, t + 0.02, 0.22, 'triangle', 0.1, null, 0.01, 98); },
    drop() { noise(now(), 0.06, 0.08, 'lowpass', 500); },
    bin() { arp([72, 76, 79, 84], 0.07, 0.35, 'triangle', 0.16); },
    level() { arp([60, 64, 67, 72, 76, 79, 84], 0.09, 0.7, 'triangle', 0.16); const t = now() + 0.7; [60, 64, 67, 72].forEach((n) => tone(midi(n), t, 1.6, 'sine', 0.09, null, 0.05)); },
    star(i) { const t = now(); tone(midi(79 + i * 4), t, 0.5, 'triangle', 0.18); tone(midi(91 + i * 4), t + 0.05, 0.4, 'sine', 0.08); },
    coin() { const t = now(); tone(1318, t, 0.08, 'square', 0.04); tone(1760, t + 0.06, 0.16, 'square', 0.04); },
    gold() { arp([84, 88, 91, 96], 0.05, 0.4, 'sine', 0.12); },
    ach() { arp([76, 81, 85, 88, 93], 0.08, 0.6, 'sine', 0.13); },
    ability() { const t = now(); noise(t, 0.45, 0.16, 'bandpass', 300, 1.2, null, 3200); tone(330, t, 0.4, 'sine', 0.12, null, 0.02, 990); },
    ready() { arp([79, 86], 0.08, 0.3, 'sine', 0.08); },
    dump() { const t = now(); noise(t, 0.25, 0.3, 'lowpass', 220); for (let i = 0; i < 6; i++) noise(t + 0.05 + i * 0.06, 0.07, 0.07, 'bandpass', 900 + Math.random() * 1500, 2); },
    bunny() { const t = now(); tone(900, t, 0.09, 'sine', 0.13, null, 0.005, 1500); tone(1500, t + 0.09, 0.1, 'sine', 0.1, null, 0.005, 1100); },
    shuffle() { const t = now(); for (let i = 0; i < 5; i++) noise(t + i * 0.04, 0.08, 0.07, 'bandpass', 700 + i * 300, 2); },
    click() { tone(660, now(), 0.06, 'triangle', 0.09); },
    hover() { tone(880, now(), 0.03, 'sine', 0.025); },
    deny() { tone(180, now(), 0.12, 'square', 0.04); },
    buy() { arp([72, 79, 84], 0.06, 0.3, 'triangle', 0.14); fx.coin(); }
  };
  A.play = (name, arg) => { if (ac && ac.state === 'running' && fx[name]) { try { fx[name](arg); } catch (e) { /* ignore audio glitches */ } } };

  // ---------- generative music box ----------
  const CHORDS = [
    [48, 55, 64, 71], [45, 52, 60, 67], [41, 48, 57, 64], [43, 50, 59, 64],
    [40, 47, 55, 62], [45, 52, 60, 67], [38, 45, 53, 60], [43, 50, 60, 62]
  ];
  const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
  const BEAT = 60 / 66;
  function bell(n, t, vol) {
    const f = midi(n);
    const g1 = tone(f, t, 1.5, 'sine', vol, musicG, 0.004);
    tone(f * 2, t, 0.7, 'sine', vol * 0.3, musicG, 0.004);
    tone(f * 3.01, t, 0.3, 'sine', vol * 0.1, musicG, 0.004);
    g1.connect(echo);
  }
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    if (nextBar < now() - 1) nextBar = now() + 0.1;      // caught up after the tab slept
    while (nextBar < now() + 0.6) {
      const ch = CHORDS[bar % CHORDS.length], t = nextBar;
      tone(midi(ch[0] - 12), t, BEAT * 3.2, 'sine', 0.16, musicG, 0.05);
      ch.slice(1).forEach((n, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
        o.type = 'triangle'; o.frequency.value = midi(n); o.detune.value = (i - 1) * 5;
        lp.type = 'lowpass'; lp.frequency.value = 700;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045, t + 1.1);
        g.gain.linearRampToValueAtTime(0.03, t + BEAT * 3.5); g.gain.linearRampToValueAtTime(0.0001, t + BEAT * 4.8);
        o.connect(lp); lp.connect(g); g.connect(musicG); o.start(t); o.stop(t + BEAT * 5);
      });
      for (let i = 0; i < 8; i++) {
        if (Math.random() < (i % 2 ? 0.22 : 0.42)) {
          melIdx = TH.clamp(melIdx + TH.pick([-2, -1, -1, 1, 1, 2]), 0, SCALE.length - 1);
          bell(SCALE[melIdx], t + i * BEAT / 2, 0.075);
        }
      }
      bar++; nextBar += BEAT * 4;
    }
  }

  // ---------- ambience ----------
  function startAmb(kind) {
    ambNodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } });
    ambNodes = []; clearTimeout(crackleTimer); ambKind = kind;
    if (!ac || kind === 'off') return;
    const loop = (buf, type, freq, vol) => {
      const s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      const g = ac.createGain(); g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(ambG); s.start(); ambNodes.push(s);
    };
    if (kind === 'fire') {
      loop(brownBuf, 'lowpass', 420, 0.5);
      const crackle = () => {
        if (ambKind !== 'fire') return;
        if (ac.state === 'running') noise(now(), 0.02 + Math.random() * 0.03, 0.05 + Math.random() * 0.2, 'highpass', 1400 + Math.random() * 2500, 1, ambG);
        crackleTimer = setTimeout(crackle, 40 + Math.random() * 420);
      };
      crackle();
    } else if (kind === 'rain') {
      loop(noiseBuf, 'highpass', 1800, 0.07);
      loop(noiseBuf, 'bandpass', 900, 0.06);
      loop(brownBuf, 'lowpass', 300, 0.25);
    } else if (kind === 'night') {
      loop(brownBuf, 'lowpass', 250, 0.2);
      const chirp = () => {
        if (ambKind !== 'night') return;
        if (ac.state === 'running') { const t = now(), f = 4200 + Math.random() * 600; for (let i = 0; i < 3; i++) tone(f, t + i * 0.07, 0.05, 'sine', 0.035, ambG); }
        crackleTimer = setTimeout(chirp, 500 + Math.random() * 1800);
      };
      chirp();
    }
  }
})();
