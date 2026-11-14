// The Night Shelver — knacks (abilities), upgrades, moods and achievements
(function () {
  'use strict';
  const TH = window.TH;
  const S = () => TH.Save.data;

  // ---------- knacks: active abilities, unlocked by finishing shelf rows ----------
  TH.ABIL = [
    { id: 'gather', name: 'Call the Strays', short: 'Call', bind: 'ability1', icon: 'magnet', need: 12, unlock: 2, vals: [3, 5, 8],
      desc: (v) => `Look at a bookcase: up to ${v} of its books fly out of the piles and into your hands.` },
    { id: 'tidy', name: 'Tidy Hands', short: 'Tidy', bind: 'ability2', icon: 'wind', need: 16, unlock: 8, vals: [3, 6, 12],
      desc: (v) => `Up to ${v} books in your hands shelve themselves, wherever they belong.` },
    { id: 'golden', name: 'Golden Hour', short: 'Golden', bind: 'ability3', icon: 'sun', need: 22, unlock: 18, vals: [12, 20, 30],
      desc: (v) => `Double coins for your next ${v} books.` },
    { id: 'way', name: 'Wayfinder', short: 'Way', bind: 'ability4', icon: 'lantern', need: 14, unlock: 32, vals: [40, 80, 150],
      desc: (v) => `For ${v} seconds, a light marks the exact shelf for every book you carry.` }
  ];
  TH.UPGRADE_COST = [500, 1500];
  TH.abilUnlocked = (a) => S().stats.rows >= a.unlock;
  TH.abilVal = (a) => a.vals[(S().abil[a.id] || 1) - 1];

  // ---------- passive upgrades ----------
  TH.UPG = [
    { id: 'satchel', name: 'Book Strap', icon: 'bag', vals: [5, 7, 9, 12], cost: [250, 700, 1500], unit: 'books', desc: 'How many books you can carry at once.' },
    { id: 'boots', name: 'Soft Slippers', icon: 'paw', vals: [100, 115, 130], cost: [300, 900], unit: '% speed', desc: 'Walk and run faster.' },
    { id: 'reach', name: 'Long Arms', icon: 'check', vals: [2.6, 3.4, 4.2], cost: [300, 900], unit: 'm reach', desc: 'Pick up and shelve from further away.' }
  ];
  TH.upgVal = (id) => { const u = TH.UPG.find((x) => x.id === id); return u.vals[S().upg[id] || 0]; };

  // ---------- moods: lighting themes ----------
  TH.MOODS = [
    { id: 'lamp', name: 'Lamplight', cost: 0, win: '#2b3a66', sky: 0x9a8670, ground: 0x3a2a20, hemi: 0.62, sun: 0xffddb0, sunI: 0.22, lamp: 0xffbe78, lampI: 0.8, fog: '#1d140d' },
    { id: 'morning', name: 'Morning Sun', cost: 600, win: '#fff1c4', sky: 0xfff3da, ground: 0x8d7c66, hemi: 0.8, sun: 0xfff0cc, sunI: 0.42, lamp: 0xffc98a, lampI: 0.2, fog: '#cdbd9c' },
    { id: 'rain', name: 'Rainy Dusk', cost: 1000, win: '#93a8bb', sky: 0xb5c3cf, ground: 0x55504a, hemi: 0.74, sun: 0xcdd6de, sunI: 0.28, lamp: 0xffb873, lampI: 0.6, fog: '#7c8387' },
    { id: 'moon', name: 'Moonlight', cost: 1500, win: '#b7caff', sky: 0x7088cc, ground: 0x1c2238, hemi: 0.66, sun: 0x9fb4ff, sunI: 0.36, lamp: 0xffc48a, lampI: 0.4, fog: '#131a2e' }
  ];
  TH.mood = () => TH.MOODS.find((m) => m.id === S().mood) || TH.MOODS[0];

  // ---------- progress helpers ----------
  TH.shelvedCount = (wing) => {
    const sh = S().shelved; let n = 0;
    for (const b of TH.BOOKS) if (sh[b.id] && (wing == null || b.wing === wing)) n++;
    return n;
  };
  TH.seriesCount = (se) => { const sh = S().shelved; let n = 0; for (const id of se.books) if (sh[id]) n++; return n; };
  TH.GATE_AT = 0.6;                         // share of a wing that must be shelved to open the next door
  TH.wingOpen = (w) => w === 0 || !!S().gates[w - 1];

  // ---------- achievements ----------
  const ACH = TH.ACH = [];
  const A = (id, name, desc, reward, prog) => ACH.push({ id, name, desc, reward, prog });
  const N = TH.BOOKS.length;
  A('first', 'First Edition', 'Shelve your first book.', 10, (s) => [s.stats.placed, 1]);
  A('p100', 'Getting the Hang of It', 'Shelve 100 books.', 25, (s) => [s.stats.placed, 100]);
  A('p300', 'Spine Tingling', 'Shelve 300 books.', 50, (s) => [s.stats.placed, 300]);
  A('p600', 'Well Read', 'Shelve 600 books.', 100, (s) => [s.stats.placed, 600]);
  A('p1000', 'Every Last Volume', 'Shelve 1,000 books.', 250, (s) => [s.stats.placed, 1000]);
  A('c10', 'On a Roll', 'Reach a streak of 10.', 20, (s) => [s.stats.bestStreak, 10]);
  A('c25', 'In the Zone', 'Reach a streak of 25.', 40, (s) => [s.stats.bestStreak, 25]);
  A('c50', 'Flow State', 'Reach a streak of 50.', 80, (s) => [s.stats.bestStreak, 50]);
  A('c100', 'Unbreakable', 'Reach a streak of 100.', 150, (s) => [s.stats.bestStreak, 100]);
  A('r1', 'A Complete Set', 'Finish a shelf row.', 20, (s) => [s.stats.rows, 1]);
  A('r10', 'Row by Row', 'Finish 10 shelf rows.', 50, (s) => [s.stats.rows, 10]);
  A('r40', 'Shelf Respect', 'Finish 40 shelf rows.', 100, (s) => [s.stats.rows, 40]);
  // these two describe the library as it stands now, so a reshuffle cannot add up to them
  const rowFull = (s, se) => se.books.every((id) => s.shelved[id]);
  A('r96', 'Not a Gap in Sight', 'Have all 96 shelf rows complete at once.', 250, (s) => [TH.SERIES.filter((se) => rowFull(s, se)).length, TH.SERIES.length]);
  A('k1', 'Case Closed', 'Fill a whole bookcase.', 40, (s) => [s.stats.cases, 1]);
  A('k6', 'Section Head', 'Fill 6 bookcases.', 80, (s) => [s.stats.cases, 6]);
  A('k12', 'Half the Library', 'Fill 12 bookcases.', 120, (s) => [s.stats.cases, 12]);
  A('k24', 'Head Librarian', 'Have every bookcase full at once.', 300, (s) => [TH.CATS.filter((c) => c.series.every((se) => rowFull(s, se))).length, TH.CATS.length]);
  TH.WINGS.forEach((w, i) => A('wing' + i, w.name.replace(/^The /, '') + ' Restored', `Shelve every book in ${w.name}.`, 100,
    (s) => { let n = 0; for (const b of TH.BOOKS) if (b.wing === i && s.shelved[b.id]) n++; return [n, w.books]; }));
  A('g1', 'Gilt Edges', 'Shelve a gilded book.', 20, (s) => [s.stats.golds, 1]);
  A('g10', 'Gold Leaf', 'Shelve 10 gilded books.', 60, (s) => [s.stats.golds, 10]);
  A('g25', 'The Gilded Shelf', 'Shelve 25 gilded books.', 150, (s) => [s.stats.golds, 25]);
  const readN = (s) => Object.keys(s.read).length;
  A('read1', 'Opening Lines', 'Open a book and read it.', 10, (s) => [readN(s), 1]);
  A('read25', 'Page Turner', 'Read 25 different books.', 40, (s) => [readN(s), 25]);
  A('read100', 'Bookworm', 'Read 100 different books.', 100, (s) => [readN(s), 100]);
  A('read400', 'Well-Thumbed', 'Read 400 different books.', 200, (s) => [readN(s), 400]);
  A('series', 'Cover to Cover', 'Read all twelve volumes of one series.', 80, (s) => [Math.max(...TH.SERIES.map((se) => se.books.filter((id) => s.read[id]).length)), 12]);
  A('m1', 'Lost & Found', 'Find a lost bookmark.', 15, (s) => [s.stats.marks, 1]);
  A('m10', 'Page Keeper', 'Find 10 lost bookmarks.', 60, (s) => [s.stats.marks, 10]);
  A('m20', 'Never Lose Your Place', 'Find all 20 bookmarks in one tidy-up.', 150, (s) => [Object.keys(s.marks).length, 20]);
  A('ab1', 'A Little Help', 'Use a knack.', 15, (s) => [s.stats.abilUses, 1]);
  A('ab40', 'Helping Hands', 'Use knacks 40 times.', 80, (s) => [s.stats.abilUses, 40]);
  A('call5', 'Here, Kitty', 'Call 5 or more books at once.', 60, (s) => [s.stats.gatherBest, 5]);
  A('abmax', 'Fully Equipped', 'Raise every knack to level 3.', 200, (s) => [Object.values(s.abil).filter((l) => l >= 3).length, 4]);
  A('strap', 'Armful', 'Carry 12 books at once.', 60, (s) => [s.stats.mostHeld, 12]);
  A('piles', 'Clear the Floor', 'Empty 40 piles.', 60, (s) => [s.stats.piles, 40]);
  A('walk1', 'Stretching Your Legs', 'Walk 1 kilometre (in metres).', 30, (s) => [Math.floor(s.stats.metres), 1000]);
  A('walk5', 'Well-Worn Carpet', 'Walk 5 kilometres (in metres).', 100, (s) => [Math.floor(s.stats.metres), 5000]);
  A('hour', 'Night Shift', 'Spend an hour in the library (in minutes).', 100, (s) => [Math.floor(s.stats.playTime / 60), 60]);
  A('e1k', 'Late Fees', 'Earn 1,000 coins.', 50, (s) => [s.stats.earned, 1000]);
  A('e5k', 'Endowment', 'Earn 5,000 coins.', 150, (s) => [s.stats.earned, 5000]);
  A('sp3k', 'Big Spender', 'Spend 3,000 coins.', 100, (s) => [s.stats.spent, 3000]);
  A('mood3', 'Mood Lighting', 'Own 3 moods.', 60, (s) => [s.moods.length, 3]);
  A('oops', 'Nobody’s Perfect', 'Try the wrong shelf 25 times. It happens!', 10, (s) => [s.stats.mistakes, 25]);
  A('again', 'Once More, With Feeling', 'Reshuffle the library and start over.', 100, (s) => [s.stats.rounds, 1]);

  TH.checkAch = () => {
    const s = S();
    let again = false;
    for (const a of ACH) {
      if (s.ach[a.id]) continue;
      const [cur, max] = a.prog(s);
      if (cur >= max) {
        s.ach[a.id] = Date.now();
        TH.Save.earn(a.reward);
        again = true;
        if (TH.UI) TH.UI.toast('ach', a.name, `+${a.reward} coins`);
        TH.Audio.play('ach');
      }
    }
    if (again) { TH.Save.commit(); if (TH.UI) TH.UI.refreshCoins(); }
  };
})();
