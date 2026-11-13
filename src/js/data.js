// Tidy Hollow — the catalog (480 items) and every level
(function () {
  'use strict';
  const TH = window.TH;

  // Colour families. Every category has one item of each, so colour-sorting always works.
  TH.FAMS = {
    r: { name: 'Red', hex: '#d95a4e' },
    o: { name: 'Orange', hex: '#ea9146' },
    y: { name: 'Yellow', hex: '#f0c64a' },
    g: { name: 'Green', hex: '#79ad5c' },
    b: { name: 'Blue', hex: '#5a8fca' },
    p: { name: 'Purple', hex: '#9873c6' },
    k: { name: 'Pink', hex: '#f092b4' },
    n: { name: 'Brown', hex: '#a87b50' }
  };
  TH.FAM_KEYS = Object.keys(TH.FAMS);
  for (const k of TH.FAM_KEYS) {
    const f = TH.FAMS[k];
    f.pal = { m: f.hex, l: TH.mix(f.hex, '#ffffff', 0.42), d: TH.mix(f.hex, '#3a2416', 0.3) };
  }

  // room -> categories -> 8 items written as "Name:family"
  const R = (id, name, badge, blurb, pattern, cats) => ({ id, name, badge, blurb, pattern, cats });
  const C = (id, name, shape, items) => ({ id, name, shape, items });
  const ROOMS = [
    R('pantry', 'The Pantry', 'Pantry Pro', 'Grandma never threw out a single jar.', 0, [
      C('jam', 'Jams', 'jar', 'Strawberry Jam:r,Orange Marmalade:o,Lemon Curd:y,Kiwi Jelly:g,Blueberry Jam:b,Plum Preserve:p,Rose Petal Jelly:k,Chestnut Spread:n'),
      C('can', 'Tins', 'can', 'Tomato Soup:r,Baked Beans:o,Sweet Corn:y,Garden Peas:g,Sardines:b,Pickled Beetroot:p,Pink Salmon:k,Mushroom Stew:n'),
      C('spice', 'Spices', 'spice', 'Paprika:r,Turmeric:o,Mustard Seed:y,Dried Basil:g,Blue Poppy Seed:b,Lavender Buds:p,Pink Peppercorn:k,Cinnamon:n'),
      C('box', 'Boxes', 'box', 'Cherry Crunch Cereal:r,Honey Oat Hoops:o,Pasta Shells:y,Matcha Biscuits:g,Blueberry Granola:b,Violet Shortbread:p,Strawberry Wafers:k,Cocoa Puffs:n'),
      C('tea', 'Tea Tins', 'tin', 'Rooibos Tea:r,Peach Oolong:o,Chamomile Tea:y,Peppermint Tea:g,Earl Grey:b,Lavender Tea:p,Rosehip Tea:k,Chai:n'),
      C('cake', 'Cupcakes', 'treat', 'Cherry Cupcake:r,Pumpkin Cupcake:o,Lemon Cupcake:y,Pistachio Cupcake:g,Blueberry Cupcake:b,Ube Cupcake:p,Strawberry Cupcake:k,Chocolate Cupcake:n')
    ]),
    R('nook', 'The Reading Nook', 'Bookworm', 'Dusty shelves, good stories, zero order.', 1, [
      C('book', 'Books', 'book', 'Tales of the Red Fox:r,Autumn Almanac:o,The Honeybee Handbook:y,Forest Field Guide:g,Songs of the Sea:b,Midnight Mysteries:p,The Rose Garden:k,Old Oak Stories:n'),
      C('scroll', 'Scrolls', 'scroll', 'Dragon Map:r,Sunset Chart:o,Star Chart:y,Woodland Map:g,Ocean Chart:b,Wizard’s Decree:p,Love Poem Scroll:k,Treasure Map:n'),
      C('pencil', 'Pencils', 'pencil', 'Cherry Pencil:r,Tangerine Pencil:o,Sunflower Pencil:y,Fern Pencil:g,Sky Pencil:b,Grape Pencil:p,Bubblegum Pencil:k,Walnut Pencil:n'),
      C('letter', 'Letters', 'envelope', 'Valentine:r,Harvest Invitation:o,Birthday Card:y,Garden Party Invite:g,Seaside Postcard:b,Royal Summons:p,Thank-You Note:k,Grandma’s Letter:n'),
      C('ink', 'Inks', 'ink', 'Crimson Ink:r,Copper Ink:o,Gold Ink:y,Emerald Ink:g,Sapphire Ink:b,Amethyst Ink:p,Blossom Ink:k,Sepia Ink:n'),
      C('quill', 'Quills', 'quill', 'Cardinal Quill:r,Robin Quill:o,Canary Quill:y,Parrot Quill:g,Bluejay Quill:b,Starling Quill:p,Flamingo Quill:k,Owl Quill:n')
    ]),
    R('craft', 'The Craft Corner', 'Crafty', 'Half-finished projects as far as the eye can see.', 2, [
      C('yarn', 'Yarn', 'yarn', 'Poppy Yarn:r,Pumpkin Yarn:o,Buttercup Yarn:y,Moss Yarn:g,Denim Yarn:b,Lilac Yarn:p,Peony Yarn:k,Alpaca Yarn:n'),
      C('button', 'Buttons', 'button', 'Ladybird Button:r,Clementine Button:o,Daisy Button:y,Clover Button:g,Sailor Button:b,Plum Button:p,Candy Button:k,Wooden Button:n'),
      C('fabric', 'Fabric', 'fabric', 'Red Gingham:r,Rust Paisley:o,Sunflower Print:y,Fern Linen:g,Navy Polka:b,Violet Velvet:p,Blossom Chintz:k,Burlap Roll:n'),
      C('paint', 'Paints', 'tube', 'Vermilion Paint:r,Burnt Orange Paint:o,Naples Yellow Paint:y,Sap Green Paint:g,Cobalt Paint:b,Mauve Paint:p,Rose Madder Paint:k,Raw Umber Paint:n'),
      C('thread', 'Thread', 'spool', 'Ruby Thread:r,Apricot Thread:o,Golden Thread:y,Olive Thread:g,Azure Thread:b,Orchid Thread:p,Pink Ribbon:k,Garden Twine:n'),
      C('snip', 'Scissors', 'scissors', 'Cherry Scissors:r,Pumpkin Snips:o,Bumblebee Scissors:y,Froggy Scissors:g,Bluebird Scissors:b,Plum Pinking Shears:p,Flamingo Scissors:k,Antique Shears:n')
    ]),
    R('shed', 'The Potting Shed', 'Green Thumb', 'Muddy boots welcome. Mess not so much.', 3, [
      C('seed', 'Seeds', 'packet', 'Tomato Seeds:r,Carrot Seeds:o,Sunflower Seeds:y,Lettuce Seeds:g,Cornflower Seeds:b,Aubergine Seeds:p,Radish Seeds:k,Onion Seeds:n'),
      C('plant', 'Pot Plants', 'pot', 'Geranium Pot:r,Marigold Pot:o,Daffodil Pot:y,Fern Pot:g,Hydrangea Pot:b,Violet Pot:p,Begonia Pot:k,Clay Pot Cactus:n'),
      C('trowel', 'Hand Tools', 'trowel', 'Ruby Trowel:r,Copper Hand Fork:o,Sunny Trowel:y,Sprout Hand Fork:g,Bluebell Trowel:b,Thistle Hand Fork:p,Petal Trowel:k,Oak Hand Fork:n'),
      C('wcan', 'Watering Cans', 'wcan', 'Poppy Watering Can:r,Copper Watering Can:o,Buttercup Watering Can:y,Mint Watering Can:g,Rainy Day Watering Can:b,Lavender Watering Can:p,Rosy Watering Can:k,Rustic Watering Can:n'),
      C('glove', 'Gloves', 'glove', 'Rose-Pruner Glove:r,Pumpkin Patch Glove:o,Canary Glove:y,Greenhouse Glove:g,Bluebird Glove:b,Heather Glove:p,Blossom Glove:k,Leather Glove:n'),
      C('bird', 'Birdhouses', 'birdhouse', 'Robin’s Lodge:r,Oriole Inn:o,Finch Cottage:y,Wren’s Nest:g,Bluebird Bungalow:b,Martin Manor:p,Rosefinch Roost:k,Sparrow Shack:n')
    ]),
    R('wardrobe', 'The Wardrobe', 'Sharp Dresser', 'One sock here, its twin… somewhere.', 0, [
      C('sock', 'Socks', 'sock', 'Cherry Stripe Sock:r,Fox Sock:o,Banana Sock:y,Frog Sock:g,Whale Sock:b,Grape Sock:p,Piglet Sock:k,Bear Sock:n'),
      C('hat', 'Beanies', 'hat', 'Cranberry Beanie:r,Ember Beanie:o,Mustard Beanie:y,Pine Beanie:g,Glacier Beanie:b,Plum Beanie:p,Cotton Candy Beanie:k,Cocoa Beanie:n'),
      C('scarf', 'Scarves', 'scarf', 'Tartan Scarf:r,Autumn Scarf:o,Honey Scarf:y,Ivy Scarf:g,Frost Scarf:b,Dusk Scarf:p,Sorbet Scarf:k,Camel Scarf:n'),
      C('tee', 'T-Shirts', 'shirt', 'Tomato Tee:r,Tiger Tee:o,Lemon Tee:y,Lime Tee:g,Ocean Tee:b,Galaxy Tee:p,Flamingo Tee:k,Mocha Tee:n'),
      C('boot', 'Boots', 'boot', 'Ladybird Wellie:r,Puddle-Jumper Boot:o,Duckling Wellie:y,Frog Wellie:g,Rainy Day Wellie:b,Jelly Boot:p,Peony Wellie:k,Hiking Boot:n'),
      C('mitt', 'Mittens', 'mitten', 'Holly Mitten:r,Campfire Mitten:o,Sunbeam Mitten:y,Juniper Mitten:g,Snowflake Mitten:b,Twilight Mitten:p,Marshmallow Mitten:k,Gingerbread Mitten:n')
    ]),
    R('kitchen', 'The Kitchen', 'Head Chef', 'Every cupboard is a surprise avalanche.', 1, [
      C('mug', 'Mugs', 'mug', 'Cranberry Mug:r,Terracotta Mug:o,Honeycomb Mug:y,Sage Mug:g,Blue Willow Mug:b,Lavender Mug:p,Blush Mug:k,Stoneware Mug:n'),
      C('plate', 'Plates', 'plate', 'Poppy Plate:r,Sunset Plate:o,Buttercream Plate:y,Olive Leaf Plate:g,Delft Plate:b,Violet Rim Plate:p,Rosebud Plate:k,Rustic Clay Plate:n'),
      C('teapot', 'Teapots', 'teapot', 'Ruby Teapot:r,Pumpkin Teapot:o,Sunny Teapot:y,Jade Teapot:g,Cobalt Teapot:b,Wisteria Teapot:p,Rosy Teapot:k,Chestnut Teapot:n'),
      C('spoon', 'Utensils', 'spoon', 'Chili Spatula:r,Carrot Spoon:o,Butter Spatula:y,Pesto Spoon:g,Blueberry Spatula:b,Beetroot Spoon:p,Icing Spatula:k,Wooden Spoon:n'),
      C('pan', 'Pots & Pans', 'pan', 'Tomato Saucepan:r,Pumpkin Pot:o,Custard Pan:y,Pea Soup Pot:g,Blue Enamel Pot:b,Plum Jam Pan:p,Rose Enamel Pot:k,Copper Pot:n'),
      C('bowl', 'Bowls', 'bowl', 'Cherry Bowl:r,Apricot Bowl:o,Lemon Bowl:y,Avocado Bowl:g,Blueberry Bowl:b,Fig Bowl:p,Peach Blossom Bowl:k,Walnut Bowl:n')
    ]),
    R('toys', 'The Toy Chest', 'Big Kid', 'Stepping on one of these at night is a rite of passage.', 2, [
      C('block', 'Blocks', 'block', 'Rocket Block:r,Otter Block:o,Yo-Yo Block:y,Giraffe Block:g,Boat Block:b,Pony Block:p,Kitten Block:k,Nut Block:n'),
      C('bear', 'Teddies', 'plush', 'Scarlet Bear:r,Marmalade Bear:o,Honey Bear:y,Clover Bear:g,Blueberry Bear:b,Sugarplum Bear:p,Bubblegum Bear:k,Biscuit Bear:n'),
      C('ball', 'Balls', 'ball', 'Cherry Bouncer:r,Basketball:o,Sunny Ball:y,Melon Ball:g,Ocean Ball:b,Galaxy Ball:p,Bubble Ball:k,Leather Football:n'),
      C('car', 'Toy Cars', 'car', 'Fire Engine:r,Little Digger:o,Taxi Cab:y,Tiny Tractor:g,Police Car:b,Party Bus:p,Ice-Cream Van:k,Wooden Wagon:n'),
      C('duck', 'Bath Ducks', 'duck', 'Devil Duck:r,Tiger Duck:o,Classic Duck:y,Froggy Duck:g,Sailor Duck:b,Wizard Duck:p,Ballerina Duck:k,Cowboy Duck:n'),
      C('top', 'Spinning Tops', 'top', 'Ruby Spinner:r,Ember Top:o,Sunbeam Top:y,Emerald Top:g,Whirlpool Top:b,Nebula Top:p,Candy Top:k,Wooden Top:n')
    ]),
    R('apoth', 'The Apothecary', 'Hedge Witch', 'Do not drink anything in here. Probably.', 3, [
      C('potion', 'Potions', 'potion', 'Dragon’s Breath:r,Phoenix Tonic:o,Liquid Sunshine:y,Swamp Brew:g,Mermaid Tears:b,Dream Draught:p,Love Potion:k,Mud Remedy:n'),
      C('gem', 'Crystals', 'crystal', 'Garnet:r,Carnelian:o,Citrine:y,Emerald:g,Sapphire:b,Amethyst:p,Rose Quartz:k,Smoky Quartz:n'),
      C('candle', 'Candles', 'candle', 'Cranberry Candle:r,Pumpkin Spice Candle:o,Beeswax Candle:y,Pine Candle:g,Sea Breeze Candle:b,Lavender Candle:p,Peony Candle:k,Sandalwood Candle:n'),
      C('shroom', 'Mushrooms', 'mushroom', 'Fly Agaric:r,Chanterelle:o,Golden Cap:y,Moss Cap:g,Indigo Milkcap:b,Amethyst Deceiver:p,Pink Oyster:k,Porcini:n'),
      C('shell', 'Shells', 'shell', 'Coral Scallop:r,Sunset Scallop:o,Sandy Scallop:y,Sea-Glass Shell:g,Tidepool Shell:b,Mussel Shell:p,Pink Conch:k,Cowrie Shell:n'),
      C('herb', 'Herb Bundles', 'herb', 'Red Clover Bundle:r,Calendula Bundle:o,Yarrow Bundle:y,Sage Bundle:g,Borage Bundle:b,Lavender Bundle:p,Rose Bundle:k,Dried Wheat Bundle:n')
    ]),
    R('workshop', 'The Workshop', 'Handy', 'Grandpa’s system was “I know where everything is.”', 0, [
      C('driver', 'Screwdrivers', 'driver', 'Cherry Screwdriver:r,Amber Screwdriver:o,Stubby Screwdriver:y,Green Flathead:g,Blue Phillips:b,Precision Driver:p,Pocket Driver:k,Grandpa’s Screwdriver:n'),
      C('pcan', 'Paint Cans', 'paintcan', 'Barn Red:r,Terracotta Wash:o,Sunroom Yellow:y,Garden Gate Green:g,Front Door Blue:b,Plum Wall Paint:p,Nursery Pink:k,Walnut Stain:n'),
      C('tape', 'Tape', 'tape', 'Stop Tape:r,Caution Tape:o,Masking Tape:y,Garden Tape:g,Painter’s Tape:b,Washi Tape:p,Glitter Tape:k,Parcel Tape:n'),
      C('hammer', 'Hammers', 'hammer', 'Claw Hammer:r,Copper Mallet:o,Tack Hammer:y,Rubber Mallet:g,Ball-Peen Hammer:b,Toy Hammer:p,Upholstery Hammer:k,Carpenter’s Mallet:n'),
      C('gear', 'Gears', 'gear', 'Ruby Cog:r,Brass Gear:o,Golden Gear:y,Patina Cog:g,Steel-Blue Gear:b,Anodized Cog:p,Rosy Gear:k,Rusty Cog:n'),
      C('bulb', 'Light Bulbs', 'bulb', 'Red Party Bulb:r,Amber Bulb:o,Warm Glow Bulb:y,Grow-Light Bulb:g,Daylight Bulb:b,Blacklight Bulb:p,Flamingo Bulb:k,Vintage Edison Bulb:n')
    ]),
    R('trunk', 'The Holiday Trunk', 'Festive Spirit', 'Every celebration, crammed into one trunk.', 1, [
      C('bauble', 'Baubles', 'bauble', 'Holly Bauble:r,Ember Bauble:o,Gold Bauble:y,Evergreen Bauble:g,Frost Bauble:b,Plum Bauble:p,Sugar Bauble:k,Bronze Bauble:n'),
      C('gift', 'Presents', 'gift', 'Scarlet Present:r,Tangerine Present:o,Golden Present:y,Mistletoe Present:g,Icy Present:b,Royal Present:p,Sweetheart Present:k,Kraft-Paper Parcel:n'),
      C('globe', 'Snow Globes', 'globe', 'Cabin Globe:r,Fox Globe:o,Star Globe:y,Pine Globe:g,Snowman Globe:b,Castle Globe:p,Carousel Globe:k,Reindeer Globe:n'),
      C('bell', 'Bells', 'bell', 'Ruby Bell:r,Copper Bell:o,Golden Bell:y,Jade Bell:g,Silver-Blue Bell:b,Violet Bell:p,Rose Bell:k,Bronze Bell:n'),
      C('lantern', 'Paper Lanterns', 'lantern', 'Lucky Lantern:r,Harvest Lantern:o,Moon Lantern:y,Bamboo Lantern:g,River Lantern:b,Dusk Lantern:p,Blossom Lantern:k,Paper-Bag Lantern:n'),
      C('candy', 'Sweets', 'candy', 'Cherry Drop:r,Butterscotch:o,Lemon Sherbet:y,Apple Sour:g,Blue Raspberry:b,Parma Violet:p,Strawberry Cream:k,Toffee:n')
    ])
  ];

  // ---------- flatten into lookup tables ----------
  TH.ROOMS = ROOMS;
  TH.ITEMS = {};
  TH.ITEM_LIST = [];
  TH.CATS = {};
  ROOMS.forEach((room, ri) => {
    room.index = ri;
    room.itemIds = [];
    room.cats.forEach((cat) => {
      cat.room = room.id;
      TH.CATS[cat.id] = cat;
      cat.items = cat.items.split(',').map((s, vi) => {
        const [name, fam] = s.split(':');
        const it = { id: cat.id + '_' + fam, name, fam, cat: cat.id, room: room.id, shape: cat.shape, v: vi };
        TH.ITEMS[it.id] = it;
        TH.ITEM_LIST.push(it);
        room.itemIds.push(it.id);
        return it;
      });
    });
  });
  TH.ROOM_BY_ID = {};
  ROOMS.forEach((r) => { TH.ROOM_BY_ID[r.id] = r; });

  // ---------- bins ----------
  const typeBin = (cat) => ({ key: cat.id, kind: 'type', label: cat.name, icon: cat.items[7].id, tip: cat.name });
  const famBin = (f) => ({ key: f, kind: 'color', label: TH.FAMS[f].name, fam: f, tip: 'Anything ' + TH.FAMS[f].name.toLowerCase() });
  const roomBin = (room) => ({
    key: room.id, kind: 'room', label: room.name.replace(/^The /, ''), icon: room.cats[0].items[0].id,
    tip: room.name + ': ' + room.cats.map((c) => c.name).join(' · ')
  });
  TH.keyOf = (def, rule) => (rule === 'color' ? def.fam : rule === 'room' ? def.room : def.cat);
  TH.makeBins = { typeBin, famBin, roomBin };

  // ---------- campaign levels ----------
  const LEVELS = [];
  const add = (room, n, name, rule, bins, items, hint) => {
    LEVELS.push({ id: room.id + '-' + n, room: room.id, n, name, rule, bins, items, hint, index: LEVELS.length });
  };
  const HINTS = { type: 'Sort by what it is', color: 'Sort by colour', room: 'Sort by which room it lives in' };

  ROOMS.forEach((room, ri) => {
    const rng = TH.rng(1000 + ri * 77);
    const cats = room.cats;
    const ids = (cs) => cs.flatMap((c) => c.items.map((i) => i.id));
    add(room, 1, 'First Box', 'type', cats.slice(0, 3).map(typeBin), ids(cats.slice(0, 3)), HINTS.type);
    add(room, 2, 'Second Box', 'type', cats.slice(3).map(typeBin), ids(cats.slice(3)), HINTS.type);
    const nf = ri < 3 ? 4 : ri < 6 ? 5 : 6;
    const fams = []; for (let i = 0; i < nf; i++) fams.push(TH.FAM_KEYS[(ri * 3 + i * (nf === 4 ? 2 : 1)) % 8]);
    add(room, 3, 'Colour Day', 'color', fams.map(famBin), room.itemIds.filter((id) => fams.includes(TH.ITEMS[id].fam)), HINTS.color);
    const big = room.itemIds.slice();
    if (ri >= 4) { const extra = TH.shuffle(room.itemIds.slice(), rng).slice(0, 12); big.push(...extra); }
    add(room, 4, 'The Big Tidy', 'type', cats.map(typeBin), big, HINTS.type);
  });

  // The Great Attic — everything mixed together
  const attic = {
    id: 'attic', name: 'The Great Attic', badge: 'Attic Legend', index: ROOMS.length, pattern: 2, cats: [],
    blurb: 'Where everything that never got sorted ended up.'
  };
  TH.ATTIC = attic;
  TH.ROOM_BY_ID.attic = attic;
  (function () {
    const rng = TH.rng(4242);
    const some = (room, n) => TH.shuffle(room.itemIds.slice(), rng).slice(0, n);
    const r1 = ROOMS.slice(0, 5), r2 = ROOMS.slice(5);
    add(attic, 1, 'Mixed Delivery', 'room', r1.map(roomBin), r1.flatMap((r) => some(r, 10)), HINTS.room);
    add(attic, 2, 'Second Van', 'room', r2.map(roomBin), r2.flatMap((r) => some(r, 10)), HINTS.room);
    const rainbow = TH.FAM_KEYS.flatMap((f) => TH.shuffle(TH.ITEM_LIST.filter((i) => i.fam === f).map((i) => i.id), rng).slice(0, 8));
    add(attic, 3, 'Rainbow Rummage', 'color', TH.FAM_KEYS.map(famBin), rainbow, HINTS.color);
    add(attic, 4, 'The Grand Tidy', 'room', ROOMS.map(roomBin), ROOMS.flatMap((r) => some(r, 8)), HINTS.room);
  })();
  TH.LEVELS = LEVELS;
  TH.LEVEL_BY_ID = {};
  LEVELS.forEach((l) => { TH.LEVEL_BY_ID[l.id] = l; });
  TH.ALL_ROOMS = ROOMS.concat([attic]);

  // ---------- endless mode ----------
  TH.makeEndless = (round) => {
    const rule = TH.pick(['type', 'type', 'color', 'room']);
    const size = TH.clamp(4 + Math.floor(round / 3), 4, 6);
    let bins, items;
    if (rule === 'type') {
      const cats = TH.shuffle(Object.values(TH.CATS)).slice(0, size);
      bins = cats.map(typeBin);
      items = cats.flatMap((c) => TH.shuffle(c.items.map((i) => i.id)).slice(0, 6));
    } else if (rule === 'color') {
      const fams = TH.shuffle(TH.FAM_KEYS.slice()).slice(0, size);
      bins = fams.map(famBin);
      items = fams.flatMap((f) => TH.shuffle(TH.ITEM_LIST.filter((i) => i.fam === f).map((i) => i.id)).slice(0, 6));
    } else {
      const rooms = TH.shuffle(ROOMS.slice()).slice(0, size);
      bins = rooms.map(roomBin);
      items = rooms.flatMap((r) => TH.shuffle(r.itemIds.slice()).slice(0, 6));
    }
    return { id: 'endless', room: 'endless', n: round, name: 'Endless — Round ' + round, rule, bins, items, hint: HINTS[rule], endless: true, pattern: round % 4 };
  };
})();
