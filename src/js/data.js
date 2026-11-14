// The Night Shelver — the library's catalogue: 6 rooms, 36 sections, 144 series, 1,728 books.
// New sections go at the END of the list: a book's number is its place in this order, and saves rely on it.
// Which room a section lives in is set separately (ROOM_OF), so rooms can hold different numbers of sections.
(function () {
  'use strict';
  const TH = window.TH;
  TH.VOLS = 12;
  TH.ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

  TH.WINGS = [
    { id: 'reading', name: 'The Reading Room', wall: '#b9936a', rug: '#8f3f35', blurb: 'Where the town comes to read. Or used to.' },
    { id: 'nature', name: 'The Naturalist’s Gallery', wall: '#8fa07a', rug: '#3f6b52', blurb: 'Pressed flowers between every other page.' },
    { id: 'scholar', name: 'The Scholars’ Hall', wall: '#8b93b0', rug: '#34466e', blurb: 'Quiet enough to hear a footnote drop.' },
    { id: 'vault', name: 'The Curiosity Vault', wall: '#a58aa8', rug: '#5e3c66', blurb: 'The books nobody knew where else to put.' },
    { id: 'attic', name: 'The Makers’ Attic', wall: '#cdb083', rug: '#b5652f', blurb: 'Sawdust, wool and wet paint, all the way up the stairs.' },
    { id: 'cellar', name: 'The Travellers’ Cellar', wall: '#8f8a80', rug: '#7a3b2e', blurb: 'Cool stone, old trunks and tales from the road.' }
  ];

  // section name | four series
  const RAW = [
    ['Fables', 'The Fox & the Lantern|Tales from the Hollow Oak|The Tin Kettle Stories|Once Upon a Wren'],
    ['Cookery', 'The Butter Almanac|Soups for Rainy Days|A Baker’s Dozen|The Pickling Year'],
    ['Gardens', 'The Patient Gardener|Hedgerow Notes|Roses & Ruin|The Kitchen Plot'],
    ['Sea Voyages', 'The Salt Road|Logbook of the Heron|Charts of the Grey Coast|Lighthouse Letters'],
    ['Mysteries', 'Inspector Marrow Investigates|The Vicarage Murders|Death at Low Tide|The Locked Room Quarterly'],
    ['Poetry', 'Songs for Small Hours|The Collected Sparrow|Verses in Winter|Odes to Ordinary Things'],

    ['Botany', 'Flora of the Northern Fells|The Moss Compendium|Ferns & Their Allies|Orchard Trees'],
    ['Beasts', 'A Bestiary of the Marsh|Field Notes on Foxes|The Owl Papers|Hooves & Horns'],
    ['Weather', 'A Catalogue of Clouds|Storm Journals|The Frost Tables|Winds & Their Names'],
    ['Stars', 'The Night Sky Month by Month|Comets Observed|Tables of the Moon|The Wandering Planets'],
    ['Minerals', 'Stones of the River Bed|The Crystal Register|Ores & Veins|A Pebble Primer'],
    ['Insects', 'The Beetle Ledger|Moths at the Window|Lives of the Bees|Pond Skaters & Others'],

    ['History', 'Chronicles of Emberwick|The Border Wars|Lives of the Mayors|A History of Bridges'],
    ['Maps', 'Atlas of the Lowlands|Rivers Surveyed|Roads That No Longer Exist|Island Charts'],
    ['Mathematics', 'Elements of Number|The Geometer’s Notebook|Puzzles & Proofs|Tables of Chance'],
    ['Medicine', 'The Village Physician|Remedies & Tonics|A Manual of Bones|Fevers Described'],
    ['Law', 'Statutes of the Borough|Notable Trials|The Magistrate’s Companion|Disputes Over Fences'],
    ['Philosophy', 'On Quiet|Dialogues by the Fire|The Examined Afternoon|Questions Without Answers'],

    ['Clockwork', 'The Horologist’s Manual|Gears & Escapements|Automata Explained|Repairs for Stubborn Clocks'],
    ['Music', 'Airs for Fiddle|The Organist’s Year|Lullabies Collected|Marches & Reels'],
    ['Theatre', 'Plays for Small Stages|The Prompter’s Diary|Masks & Costumes|Comedies in One Act'],
    ['Alchemy', 'The Patient Crucible|Salts & Spirits|Notes Toward Gold|The Distiller’s Art'],
    ['Folklore', 'Hearth Tales|The Green Children|Customs of the Harvest|Things Seen at Dusk'],
    ['Dreams', 'The Dream Ledger|Sleepwalker’s Almanac|Night Visions Interpreted|Letters to Tomorrow'],

    ['Carpentry', 'The Joiner’s Bench|Chairs & Their Troubles|A Year of Small Boxes|The Boatshed Notes'],
    ['Needlework', 'The Mending Basket|Samplers & Stitches|A Quilt for Every Bed|Knots, Wool & Weather'],
    ['Pottery', 'The Stubborn Wheel|Glazes & Accidents|Jugs of the Lowlands|The Kiln Diary'],
    ['Bookbinding', 'The Binder’s Apprentice|Paper, Paste & Patience|Marbled Endpapers|Repairs to Old Friends'],
    ['Painting', 'Sketches from the Fells|The Watercolour Year|Portraits of Emberwick|A Box of Twelve Colours'],
    ['Toymaking', 'The Toymaker’s Ledger|Kites & Whirligigs|The Dollhouse Papers|Puppets on a Shoestring'],

    ['Railways', 'The Branch Line Gazette|Timetables & Tea|Signals in the Fog|The Last Train to Grey Coast'],
    ['Mountains', 'Over the High Pass|The Shepherd’s Hut Book|Cairns & Summits|A Winter Above the Tarn'],
    ['Inns', 'The Lamplit Goose|Landlords & Lodgers|A Guide to Good Suppers|Rooms at the Crossroads'],
    ['Letters', 'The Postmistress Writes|Letters Never Sent|Parcels Gone Astray|Postcards from the Coast'],
    ['Festivals', 'The Fair Comes to Town|Bonfire Night Annals|The Lantern Parade|Prizes at the Flower Show'],
    ['Hauntings', 'The Polite Ghost|Cold Spots Catalogued|Night Watch at the Old Hall|Things That Go Bump, Gently']
  ];

  // The room each section is shelved in, in the order of RAW. The rooms grow as you go: 3, 4, 5, 6, 8 and 10 sections.
  const ROOM_OF = [
    0, 4, 1, 5, 0, 0,       // Fables, Cookery, Gardens, Sea Voyages, Mysteries, Poetry
    1, 1, 5, 3, 3, 1,       // Botany, Beasts, Weather, Stars, Minerals, Insects
    2, 2, 2, 5, 2, 2,       // History, Maps, Mathematics, Medicine, Law, Philosophy
    3, 4, 5, 3, 3, 3,       // Clockwork, Music, Theatre, Alchemy, Folklore, Dreams
    4, 4, 4, 4, 4, 4,       // Carpentry, Needlework, Pottery, Bookbinding, Painting, Toymaking
    5, 5, 5, 5, 5, 5        // Railways, Mountains, Inns, Letters, Festivals, Hauntings
  ];
  const perRoom = TH.WINGS.map((_, i) => ROOM_OF.filter((r) => r === i).length), seenInRoom = TH.WINGS.map(() => 0);

  TH.CATS = []; TH.SERIES = []; TH.BOOKS = [];
  const rng = TH.rng(20261113);
  RAW.forEach(([name, list], ci) => {
    const wing = ROOM_OF[ci], k = seenInRoom[wing]++;
    const hue = (k * 360 / perRoom[wing] + wing * 16 + 4) % 360;        // spread evenly round the colour wheel within a room
    const cat = { id: ci, name, wing, hue, color: TH.hsl(hue, 0.52, 0.44), series: [] };
    TH.CATS.push(cat);
    list.split('|').forEach((sname, si) => {
      const se = {
        id: TH.SERIES.length, name: sname, cat: ci, wing, row: 3 - si,       // first series sits on the top shelf
        color: TH.hsl((hue + (si - 1.5) * 5 + 360) % 360, 0.5 + si * 0.03, 0.33 + si * 0.075),
        t: 0.066 + rng() * 0.013, h: 0.26 + rng() * 0.09, d: 0.19 + rng() * 0.04, books: []
      };
      TH.SERIES.push(se); cat.series.push(se);
      for (let v = 0; v < TH.VOLS; v++) {
        const b = { id: TH.BOOKS.length, series: se.id, cat: ci, wing, vol: v, gold: rng() < 0.035 };
        TH.BOOKS.push(b); se.books.push(b.id);
      }
    });
  });
  TH.bookTitle = (b) => `${TH.SERIES[b.series].name}, Vol. ${TH.ROMAN[b.vol]}`;
  TH.WINGS.forEach((w, i) => { w.index = i; w.cats = TH.CATS.filter((c) => c.wing === i); w.books = TH.BOOKS.filter((b) => b.wing === i).length; });
})();
