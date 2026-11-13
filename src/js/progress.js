// Tidy Hollow — abilities, shop goods, achievements and level results
(function () {
  'use strict';
  const TH = window.TH;
  const S = () => TH.Save.data;

  // ---------- abilities ----------
  TH.ABIL = [
    { id: 'magnet', name: 'Magnet Mitt', bind: 'ability1', icon: 'magnet', need: 10, unlock: 3, vals: [3, 5, 8],
      desc: (v) => `Your next correct drop also pulls up to ${v} matching items out of the pile.` },
    { id: 'gust', name: 'Broom Breeze', bind: 'ability2', icon: 'wind', need: 16, unlock: 12, vals: [4, 6, 9],
      desc: (v) => `Sweeps ${v} random items straight into their homes.` },
    { id: 'golden', name: 'Golden Hour', bind: 'ability3', icon: 'sun', need: 22, unlock: 27, vals: [12, 20, 30],
      desc: (v) => `Double coins for your next ${v} placements.` },
    { id: 'lantern', name: 'Guiding Lantern', bind: 'ability4', icon: 'lantern', need: 12, unlock: 45, vals: [6, 10, 15],
      desc: (v) => `Your next ${v} drops always find the right home — mistakes are impossible.` }
  ];
  TH.UPGRADE_COST = [400, 1200];
  TH.totalStars = () => Object.values(S().stars).reduce((a, b) => a + b, 0);
  TH.maxStars = () => TH.LEVELS.length * 3;
  TH.abilUnlocked = (a) => TH.totalStars() >= a.unlock;
  TH.abilVal = (a) => a.vals[(S().abil[a.id] || 1) - 1];

  // ---------- shop ----------
  TH.THEMES = [
    { id: 'honey', name: 'Honey Oak', cost: 0, wall: '#f2deb6', wall2: '#e9cf9c', trim: '#b98858', table: '#cd9c66', table2: '#b98552', crate: '#dcae78', crateD: '#b08350', ink: '#5b422e' },
    { id: 'sage', name: 'Sage Morning', cost: 500, wall: '#dfe8cf', wall2: '#cbd9b6', trim: '#8a9c6c', table: '#c7a977', table2: '#b39563', crate: '#d9bd8c', crateD: '#a98c5c', ink: '#46523a' },
    { id: 'rose', name: 'Rose Tea', cost: 800, wall: '#f6dcd8', wall2: '#eec5c1', trim: '#c0827e', table: '#d3a17c', table2: '#bf8b68', crate: '#e3b792', crateD: '#b98a66', ink: '#6a4040' },
    { id: 'lav', name: 'Lavender Dusk', cost: 1100, wall: '#ddd5ee', wall2: '#c9bee3', trim: '#8573ad', table: '#b99b86', table2: '#a48672', crate: '#d3b9a3', crateD: '#a38872', ink: '#473d63' },
    { id: 'cocoa', name: 'Midnight Cocoa', cost: 1500, wall: '#4f4057', wall2: '#433649', trim: '#2f2433', table: '#7a5a44', table2: '#694b37', crate: '#a47d5c', crateD: '#77573d', ink: '#f2e3cf' }
  ];
  TH.theme = () => TH.THEMES.find((t) => t.id === S().theme) || TH.THEMES[0];
  TH.PETS = [
    { id: 'cat', name: 'Biscuit the Cat', cost: 600, blurb: 'Naps on the shelf. Perks up when you’re on a streak.' },
    { id: 'frog', name: 'Pip the Frog', cost: 1000, blurb: 'Small, round, and very proud of you.' },
    { id: 'bun', name: 'Clover the Bunny', cost: 1500, blurb: 'A reformed dust bunny. Mostly.' }
  ];

  // ---------- level access ----------
  TH.levelUnlocked = (lv) => lv.index === 0 || !!S().stars[TH.LEVELS[lv.index - 1].id];
  TH.nextLevel = () => TH.LEVELS.find((l) => !S().stars[l.id]) || null;
  TH.endlessUnlocked = () => TH.LEVELS.filter((l) => S().stars[l.id]).length >= 8;
  TH.roomStars = (room) => TH.LEVELS.filter((l) => l.room === room.id).reduce((a, l) => a + (S().stars[l.id] || 0), 0);
  TH.discovered = () => Object.keys(S().catalog).length;

  // ---------- achievements ----------
  const ACH = TH.ACH = [];
  const A = (id, name, desc, reward, prog) => ACH.push({ id, name, desc, reward, prog });
  const N = TH.ITEM_LIST.length;
  const perfects = (s) => Object.values(s.best).filter((b) => b.perfect).length;
  const starSum = (s) => Object.values(s.stars).reduce((a, b) => a + b, 0);

  A('first', 'First Things First', 'Put one item where it belongs.', 10, (s) => [s.stats.placed, 1]);
  A('p100', 'Getting the Hang of It', 'Sort 100 items.', 25, (s) => [s.stats.placed, 100]);
  A('p500', 'Neat Freak', 'Sort 500 items.', 50, (s) => [s.stats.placed, 500]);
  A('p1500', 'Master Organizer', 'Sort 1,500 items.', 100, (s) => [s.stats.placed, 1500]);
  A('p5000', 'Tidy Titan', 'Sort 5,000 items.', 250, (s) => [s.stats.placed, 5000]);
  A('c10', 'On a Roll', 'Reach a streak of 10.', 20, (s) => [s.stats.bestCombo, 10]);
  A('c25', 'In the Zone', 'Reach a streak of 25.', 40, (s) => [s.stats.bestCombo, 25]);
  A('c50', 'Flow State', 'Reach a streak of 50.', 80, (s) => [s.stats.bestCombo, 50]);
  A('c80', 'Unbreakable', 'Reach a streak of 80.', 150, (s) => [s.stats.bestCombo, 80]);
  A('perf1', 'Spotless', 'Finish a level with zero mistakes.', 25, (s) => [perfects(s), 1]);
  A('perf10', 'Perfectionist', 'Zero-mistake finish on 10 different levels.', 100, (s) => [perfects(s), 10]);
  A('perfAll', 'Immaculate', 'Zero-mistake finish on every level.', 300, (s) => [perfects(s), TH.LEVELS.length]);
  A('s30', 'Star Gazer', 'Collect 30 stars.', 40, (s) => [starSum(s), 30]);
  A('s75', 'Star Collector', 'Collect 75 stars.', 80, (s) => [starSum(s), 75]);
  A('sAll', 'Every Last Star', 'Collect every star in the game.', 250, (s) => [starSum(s), TH.LEVELS.length * 3]);
  TH.ALL_ROOMS.forEach((room) => {
    const lv = TH.LEVELS.filter((l) => l.room === room.id);
    A('room_' + room.id, room.badge, `Finish every level in ${room.name}.`, 30, (s) => [lv.filter((l) => s.stars[l.id]).length, lv.length]);
  });
  A('cat25', 'Curious Collector', 'Discover a quarter of the catalog.', 50, (s) => [Object.keys(s.catalog).length, N / 4]);
  A('cat50', 'Seasoned Curator', 'Discover half of the catalog.', 100, (s) => [Object.keys(s.catalog).length, N / 2]);
  A('cat100', 'Completionist', 'Discover every item in the catalog.', 300, (s) => [Object.keys(s.catalog).length, N]);
  A('g1', 'Ooh, Shiny!', 'Sort a golden item.', 20, (s) => [s.stats.golds, 1]);
  A('g25', 'Midas Touch', 'Sort 25 golden items.', 100, (s) => [s.stats.golds, 25]);
  A('gcat', 'Gilded Catalog', 'Find the golden version of 100 different items.', 250, (s) => [Object.keys(s.gold).length, 100]);
  A('b1', 'Shoo!', 'Catch a dust bunny.', 15, (s) => [s.stats.bunnies, 1]);
  A('b25', 'Dust Buster', 'Catch 25 dust bunnies.', 60, (s) => [s.stats.bunnies, 25]);
  A('b100', 'Bunny Whisperer', 'Catch 100 dust bunnies.', 150, (s) => [s.stats.bunnies, 100]);
  A('ab1', 'A Little Help', 'Use an ability.', 15, (s) => [s.stats.abilUses, 1]);
  A('ab50', 'Helping Hands', 'Use abilities 50 times.', 80, (s) => [s.stats.abilUses, 50]);
  A('mag5', 'Magnetic Personality', 'Pull 5 or more items with one Magnet Mitt.', 60, (s) => [s.stats.magnetBest, 5]);
  A('abmax', 'Fully Equipped', 'Upgrade every ability to level 3.', 200, (s) => [Object.values(s.abil).filter((l) => l >= 3).length, 4]);
  A('fast', 'Quick Hands', 'Finish a level of 24+ items in under a minute.', 60, (s) => [s.stats.fast ? 1 : 0, 1]);
  A('hour', 'Time Well Spent', 'Spend an hour tidying (in minutes).', 100, (s) => [Math.floor(s.stats.playTime / 60), 60]);
  A('e1k', 'Piggy Bank', 'Earn 1,000 coins.', 50, (s) => [s.stats.earned, 1000]);
  A('e5k', 'Treasure Chest', 'Earn 5,000 coins.', 150, (s) => [s.stats.earned, 5000]);
  A('sp2k', 'Big Spender', 'Spend 2,000 coins.', 100, (s) => [s.stats.spent, 2000]);
  A('th3', 'Interior Designer', 'Own 3 room themes.', 60, (s) => [s.themes.length, 3]);
  A('pet', 'Good Company', 'Adopt a companion.', 40, (s) => [s.pets.length, 1]);
  A('end5', 'Just One More', 'Finish 5 Endless rounds.', 50, (s) => [s.stats.endless, 5]);
  A('end25', 'Never-Ending Tidy', 'Finish 25 Endless rounds.', 150, (s) => [s.stats.endless, 25]);
  A('bins100', 'Lid On Tight', 'Fill 100 containers.', 60, (s) => [s.stats.bins, 100]);
  A('shuf', 'Shake It Up', 'Shuffle the pile 10 times.', 15, (s) => [s.stats.shuffles, 10]);
  A('oops', 'Nobody’s Perfect', 'Make 50 mistakes. It happens!', 10, (s) => [s.stats.mistakes, 50]);
  A('finale', 'Home Sweet Home', 'Finish The Grand Tidy.', 200, (s) => [s.stars['attic-4'] ? 1 : 0, 1]);

  // check everything; newly earned ones pay out and pop a toast
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

  // ---------- finishing a level ----------
  TH.starsFor = (mistakes, total) => (mistakes <= Math.ceil(total * 0.06) ? 3 : mistakes <= Math.ceil(total * 0.16) ? 2 : 1);
  TH.finishLevel = (level, run) => {
    const s = S();
    const stars = TH.starsFor(run.mistakes, run.total);
    const perfect = run.mistakes === 0;
    const bonus = stars * 15 + (perfect ? 30 : 0);
    TH.Save.earn(bonus);
    const before = TH.totalStars();
    s.stats.levels++;
    if (run.total >= 24 && run.time < 60) s.stats.fast = 1;
    let firstClear = false;
    if (level.endless) {
      s.stats.endless++;
    } else {
      firstClear = !s.stars[level.id];
      s.stars[level.id] = Math.max(s.stars[level.id] || 0, stars);
      const b = s.best[level.id] || { mistakes: 1e9, time: 1e9, combo: 0, perfect: false };
      b.mistakes = Math.min(b.mistakes, run.mistakes);
      b.time = Math.min(b.time, Math.round(run.time));
      b.combo = Math.max(b.combo, run.bestCombo);
      b.perfect = b.perfect || perfect;
      s.best[level.id] = b;
    }
    const after = TH.totalStars();
    const unlocked = TH.ABIL.filter((a) => before < a.unlock && after >= a.unlock);
    TH.Save.flush();
    TH.checkAch();
    return { stars, perfect, bonus, coins: run.coins + bonus, unlocked, firstClear };
  };
})();
