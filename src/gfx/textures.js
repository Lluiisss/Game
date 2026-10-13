// Sämtliche Grafiken werden hier im Code als Pixelart erzeugt.
// Kleine Sprites werden aus "Pixel-Karten" (Strings) gezeichnet, Rasen,
// Hecke und Hügel prozedural mit etwas Rauschen.

const OUTLINE = '#1e140d';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Zeichnet eine Pixel-Karte in eine Canvas-Textur, optional mit automatischer Outline.
function drawMap(scene, key, rows, pal, outline = OUTLINE) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const pad = outline ? 1 : 0;
  const W = w + pad * 2;
  const H = h + pad * 2;
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  const filled = new Uint8Array(W * H);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + pad, y + pad, 1, 1);
      filled[(y + pad) * W + x + pad] = 1;
    }
  });
  if (outline) {
    ctx.fillStyle = outline;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (filled[y * W + x]) continue;
        const n =
          (x > 0 && filled[y * W + x - 1]) ||
          (x < W - 1 && filled[y * W + x + 1]) ||
          (y > 0 && filled[(y - 1) * W + x]) ||
          (y < H - 1 && filled[(y + 1) * W + x]);
        if (n) ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  tex.refresh();
}

// ---------------------------------------------------------------- Opa

const OPA_PAL = {
  H: '#e2e2e2',
  h: '#9e9e9e',
  S: '#f2c49b',
  s: '#d79f76',
  E: '#222222',
  M: '#f7f7f7',
  W: '#f4f4f4',
  C: '#a8433a',
  c: '#7d2f28',
  P: '#5e5348',
  p: '#463d35',
  B: '#3a2a1e',
};

const OPA_DOWN = [
  '.....hHhHhh.....',
  '...hHHhHHhHHh...',
  '..hHHHHhHHHHHh..',
  '..HhHSSSSSShHh..',
  '..hHShhSShhSHh..',
  '..hHSSESSESSHh..',
  '...hSSSssSSSh...',
  '....SMMMMMMS....',
  '.....sSSSSs.....',
  '....CCWWWWCC....',
  '...CCCCccCCCC...',
  '..SCCCCccCCCCS..',
  '....PPPPPPPP....',
  '....PPPppPPP....',
];

const OPA_UP = [
  '.....hHhHhh.....',
  '...hHHhHHhHHh...',
  '..hHHHHhHHHHHh..',
  '..HhHHhHHHhHHh..',
  '..hHHhHHhHHhHH..',
  '..hHHHHhHHHHHh..',
  '...hHhHHhHhHh...',
  '....sSSSSSSs....',
  '.....sSSSSs.....',
  '....CCCCCCCC....',
  '...CCCCccCCCC...',
  '..SCCCCccCCCCS..',
  '....PPPPPPPP....',
  '....PPPppPPP....',
];

const OPA_SIDE = [
  '....hHhHhh......',
  '..hHHhHHhHh.....',
  '.hHHHHhHHHHh....',
  '.HhHHhHHhSSS....',
  '.hHHhHHShhSSS...',
  '.hHhHHSSSSESS...',
  '..hHHSSSSSSSSs..',
  '...hHSSSSMMMM...',
  '.....sSSSSSs....',
  '.....CCWWCC.....',
  '....CCCCCCCC....',
  '....CCCCSSCC....',
  '.....PPPPPP.....',
  '.....PPPPPP.....',
];

const LEGS_FRONT = [
  ['....PPP..PPP....', '....BBB..BBB....'],
  ['.....PP..PPP....', '.....BB..BBB....'],
  ['....PPP..PP.....', '....BBB..BB.....'],
];

const LEGS_SIDE = [
  ['.....PP..PP.....', '.....BBB.BBB....'],
  ['....PP....PP....', '...BBB....BBB...'],
  ['......PPPP......', '......BBBBB.....'],
];

function makeOpa(scene) {
  for (let f = 0; f < 3; f++) {
    drawMap(scene, `opa_down_${f}`, [...OPA_DOWN, ...LEGS_FRONT[f]], OPA_PAL);
    drawMap(scene, `opa_up_${f}`, [...OPA_UP, ...LEGS_FRONT[f]], OPA_PAL);
    drawMap(scene, `opa_side_${f}`, [...OPA_SIDE, ...LEGS_SIDE[f]], OPA_PAL);
  }
}

// ---------------------------------------------------------------- Maulwürfe

const MOLE_BASE = [
  '.....ffffff.....',
  '...fFFFFFFFFf...',
  '..fFFFFFFFFFFf..',
  '..FFFwEFFEwFFF..',
  '.fFFFFFFFFFFFFf.',
  '.fFFFFFNNFFFFFf.',
  '.fFFFFFNNFFFFFf.',
  '.fFFFFLLLLFFFFf.',
  'KKfFFLLLLLLFFfKK',
  'KKKFFLLLLLLFFKKK',
  '.KfFFLLLLLLFFfK.',
  '..fFFLLLLLLFFf..',
  '..fFFFFFFFFFFf..',
  '...fFFFFFFFFf...',
];

const MOLE_PAL = {
  F: '#5a4740',
  f: '#3b2e2a',
  L: '#7a625a',
  N: '#ff8fa8',
  K: '#f7b6c2',
  E: '#111111',
  w: '#ffffff',
  x: '#111111',
  R: '#d8352a',
  D: '#151515',
  d: '#5c6b8a',
  Y: '#f2c230',
  y: '#b88a14',
  l: '#fffbd0',
  e: '#e01818',
};

function replaceRows(base, replacements) {
  const out = [...base];
  Object.entries(replacements).forEach(([i, row]) => {
    out[Number(i)] = row;
  });
  return out;
}

const DEAD_EYES = {
  2: '..fFxFxFFxFxFf..',
  3: '..FFFxFFFFxFFF..',
  4: '.fFxFxFFFxFxFFf.',
};

function makeMoles(scene) {
  drawMap(scene, 'mole', MOLE_BASE, MOLE_PAL);
  drawMap(scene, 'mole_dead', replaceRows(MOLE_BASE, DEAD_EYES), MOLE_PAL);

  // Flitzer: hellerer Pelz und rotes Stirnband
  const fastPal = { ...MOLE_PAL, F: '#8a5a3a', f: '#5e3b24', L: '#a8805f' };
  const fast = replaceRows(MOLE_BASE, { 1: '...fRRRRRRRRf...', 2: '..fRRRRRRRRRRf..' });
  drawMap(scene, 'mole_fast', fast, fastPal);
  drawMap(scene, 'mole_fast_dead', replaceRows(fast, { 3: DEAD_EYES[3], 4: DEAD_EYES[4] }), fastPal);

  // Chill-Maulwurf mit Sonnenbrille
  const chill = replaceRows(MOLE_BASE, { 3: '..FDDDDDDDDDDF..', 4: '.fFDdDDFFDdDDFf.' });
  drawMap(scene, 'mole_chill', chill, MOLE_PAL);
  drawMap(scene, 'mole_chill_dead', replaceRows(MOLE_BASE, DEAD_EYES), MOLE_PAL);

  // Boss: Bergarbeiter-Helm mit Lampe und roten Augen
  const boss = [
    '.....yYllYy.....',
    '...yYYYllYYYy...',
    '..yYYYYYYYYYYy..',
    '.yyyyyyyyyyyyyy.',
    '..FFFweFFewFFF..',
    ...MOLE_BASE.slice(4),
  ];
  drawMap(scene, 'mole_boss', boss, MOLE_PAL);
  drawMap(
    scene,
    'mole_boss_dead',
    replaceRows(boss, { 4: '..FFxFxFFxFxFF..', 5: '.fFFFxFNNFxFFFf.' }),
    MOLE_PAL,
  );
}

// ---------------------------------------------------------------- Gartenzwerg

function makeGnome(scene) {
  drawMap(
    scene,
    'gnome',
    [
      '.....RR.....',
      '....RRRr....',
      '....RRRr....',
      '...RRRRRr...',
      '...RRRRRr...',
      '..RRRRRRRr..',
      '..SSESSESS..',
      '..WSSNNSSW..',
      '.WWWWWWWWWW.',
      '.WWWWWWWWWW.',
      '.BWWWWWWWWB.',
      'SBBWWWWWWBBS',
      '.BBBwWWwBBB.',
      '..BBBBBBBB..',
      '..KKK..KKK..',
      '..KKK..KKK..',
    ],
    {
      R: '#d23c32',
      r: '#9a2620',
      S: '#f2c49b',
      E: '#222222',
      N: '#f29a8a',
      W: '#f4f4f4',
      w: '#cfcfcf',
      B: '#3b6fc4',
      K: '#3a2a1e',
    },
  );
}

// ---------------------------------------------------------------- Waffen

const WEAPON_PAL = {
  T: '#d0d4d8',
  t: '#8b9096',
  W: '#b07a45',
  w: '#7a5230',
  R: '#c0392b',
  K: '#7d7d7d',
  k: '#4f4f4f',
  Y: '#f2c230',
  y: '#c4901a',
  G: '#3f9c3a',
  g: '#2b6e28',
  O: '#f07d1a',
  o: '#b85a0c',
};

function handle(n, ch = 'W', width = 9) {
  const mid = Math.floor(width / 2);
  const row = '.'.repeat(mid) + ch + '.'.repeat(width - mid - 1);
  return Array(n).fill(row);
}

function makeWeapons(scene) {
  drawMap(
    scene,
    'w_rake',
    ['T.T.T.T.T', 'T.T.T.T.T', 'ttttttttt', '....w....', ...handle(16)],
    WEAPON_PAL,
  );
  drawMap(
    scene,
    'w_spade',
    [
      '..TTTTT..',
      '.TTTTTTT.',
      '.TTTTTTT.',
      '.TTTTTTT.',
      '.tTTTTTt.',
      '..ttttt..',
      '....w....',
      ...handle(10),
      '...WWW...',
      '..W...W..',
      '..WWWWW..',
    ],
    WEAPON_PAL,
  );
  drawMap(
    scene,
    'w_shears',
    [
      'T.......T',
      'T.......T',
      'TT.....TT',
      '.T.....T.',
      '.TT...TT.',
      '..T...T..',
      '..TT.TT..',
      '...T.T...',
      '...TtT...',
      '....t....',
      '...R.R...',
      '..RR.RR..',
      '..R...R..',
      '.RR...RR.',
      '.R.....R.',
      '.R.....R.',
    ],
    WEAPON_PAL,
  );
  drawMap(
    scene,
    'w_hammer',
    [
      'kkkkkkkkkkk',
      'KKKKKKKKKKK',
      'KKKKKKKKKKK',
      'KKKKKKKKKKK',
      'kkkkkkkkkkk',
      '.....w.....',
      ...handle(13, 'W', 11),
    ],
    WEAPON_PAL,
  );
  drawMap(
    scene,
    'w_hose',
    [
      '..YY..',
      '..YY..',
      '.YYYY.',
      '.yYYy.',
      '..GG..',
      '..Gg..',
      '..GG..',
      '..gG..',
      '..GG..',
      '..Gg..',
      '..GG..',
      '..gG..',
    ],
    WEAPON_PAL,
  );
  drawMap(
    scene,
    'w_strimmer',
    [
      '.OOOOOOO.',
      'OkkkkkkkO',
      '.kkkkkkk.',
      '....t....',
      ...handle(12, 't'),
      '...OOO...',
      '..OOOOO..',
      '..OkkkO..',
      '...ooo...',
      ...handle(3, 't'),
    ],
    WEAPON_PAL,
  );
}

// ---------------------------------------------------------------- Icons für Upgrades

const ICON_PAL = {
  ...WEAPON_PAL,
  w: '#ffffff',
  W: '#b07a45',
  B: '#9a6a3a',
  b: '#6e4a26',
  H: '#8a6a3a',
  S: '#f2c49b',
  E: '#222222',
  C: '#4f7ab0',
  L: '#7fc4ff',
  l: '#3d8fd6',
  P: '#f3ead2',
  F: '#e84a5f',
  M: '#ffd84a',
};

const ICONS = {
  i_dmg: [
    '..........M.',
    '.........MMM',
    'T.T.T.T...M.',
    'T.T.T.T.....',
    'T.T.T.T.....',
    'ttttttt.....',
    '...W........',
    '...W........',
    '...W........',
    '...W........',
    '...W........',
    '...W........',
  ],
  i_speed: [
    '............',
    '............',
    'ww..........',
    '......YYYY..',
    'www.YYYYYYY.',
    '...YYYYYYYYY',
    'wwYYyyyyyYYY',
    '..YYYYYYYYYY',
    '...yyyyyyyy.',
    '............',
    '............',
    '............',
  ],
  i_range: [
    '............',
    '............',
    '............',
    '.w........w.',
    'ww........ww',
    'WWWWWWWWWWWW',
    'ww........ww',
    '.w........w.',
    '............',
    '............',
    '............',
    '............',
  ],
  i_rate: [
    '..G.G.G.....',
    '..G.G.G.G...',
    '..G.G.G.G...',
    '..GGGGGGG...',
    'G.GGGGGGG...',
    'GGGGGGGGG...',
    '.GGGGGGGG...',
    '..GGGGGG....',
    '..YYYYYY....',
    '..YYYYYY....',
    '............',
    '............',
  ],
  i_arc: [
    '...wwwwww...',
    '.ww......ww.',
    'w..........w',
    'w..........w',
    '.....T.T....',
    '.....T.T....',
    '.....ttt....',
    '......W.....',
    '......W.....',
    '......W.....',
    '......W.....',
    '............',
  ],
  i_hill: [
    '.........W..',
    '........W...',
    '.......W....',
    '......W.....',
    '..KKKKKK....',
    '.KkkkkkkK...',
    '.KkkkkkkK...',
    '.KkkkkkkK...',
    '..KKKKKK....',
    'GGGGGGGGGGGG',
    'gGgGgGgGgGgG',
    '............',
  ],
  i_crit: [
    '..GG....GG..',
    '.GGGG..GGGG.',
    '.GGGGggGGGG.',
    '..GGGggGGG..',
    '...gggggg...',
    '..GGGggGGG..',
    '.GGGGggGGGG.',
    '.GGGG..GGGG.',
    '..GG.g..GG..',
    '.....g......',
    '....g.......',
    '....g.......',
  ],
  i_xp: [
    '..bbbbbbbb..',
    '..BBBBBBBB..',
    '.BBBBBBBBBB.',
    '.BBBBGGBBBB.',
    '.BBBGGGGBBB.',
    '.BBBBGGBBBB.',
    '.BBBBBgBBBB.',
    '.BBBBBgBBBB.',
    '.BBBBBBBBBB.',
    '.BBBBBBBBBB.',
    '..BBBBBBBB..',
    '............',
  ],
  i_scare: [
    '....HHH.....',
    '...HHHHH....',
    '.HHHHHHHHH..',
    '...SSSSS....',
    '...SESES....',
    '...SSSSS....',
    'YCCCCCCCCCY.',
    '....CCC.....',
    '....CCC.....',
    '.....W......',
    '.....W......',
    '.....W......',
  ],
  i_seeds: [
    '.PPPPPPPPPP.',
    '.PPPPPPPPPP.',
    '.PPPPFFPPPP.',
    '.PPPFMMFPPP.',
    '.PPPPFFPPPP.',
    '.PPPPPGPPPP.',
    '.PPPPGGPPPP.',
    '.PPPPPGPPPP.',
    '.PPPPPPPPPP.',
    '.bbbbbbbbbb.',
    '............',
    '............',
  ],
  i_sprinkler: [
    'L....L....L.',
    '.L...L...L..',
    '..L..L..L...',
    '...l.l.l....',
    '....lll.....',
    '.....K......',
    '.....K......',
    '.....K......',
    '....KKK.....',
    '...KKKKK....',
    'GGGGGGGGGGGG',
    '............',
  ],
  i_cart: [
    '............',
    '............',
    '.BBBBBBBB...',
    '.BbbbbbbBWWW',
    '..BBBBBB....',
    '...BBBB.....',
    '...k..W.....',
    '..kKk..W....',
    '..kKk...W...',
    '...k........',
    '............',
    '............',
  ],
};

function makeIcons(scene) {
  Object.entries(ICONS).forEach(([key, rows]) => drawMap(scene, key, rows, ICON_PAL));
}

// ---------------------------------------------------------------- Hügel

function makeHill(scene, key, w, h, seed) {
  const rng = mulberry32(seed);
  const tex = scene.textures.createCanvas(key, w + 2, h + 2);
  const ctx = tex.getContext();
  const inside = new Uint8Array((w + 2) * (h + 2));
  const W = w + 2;
  const holeW = Math.round(w * 0.5);
  const holeCy = 2.5;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2);
      const ny = (h - (y + 0.5)) / (h - 0.5);
      const prof = Math.pow(Math.max(0, 1 - nx * nx), 0.65);
      if (ny > prof + (rng() - 0.5) * 0.14) continue;
      const light = ny * 0.7 - nx * 0.35 + (rng() - 0.5) * 0.25;
      let col;
      if (light > 0.55) col = '#a16b37';
      else if (light > 0.3) col = '#87552a';
      else if (light > 0.05) col = '#6c4220';
      else col = '#523117';
      const r = rng();
      if (r < 0.06) col = '#b9834b';
      else if (r < 0.11) col = '#3e2410';
      // Loch oben auf dem Hügel
      const hx = (x + 0.5 - w / 2) / (holeW / 2);
      const hy = (y + 0.5 - holeCy) / 1.6;
      if (hx * hx + hy * hy <= 1) col = hy < 0 ? '#2a170a' : '#1b0f06';
      ctx.fillStyle = col;
      ctx.fillRect(x + 1, y + 1, 1, 1);
      inside[(y + 1) * W + x + 1] = 1;
    }
  }
  ctx.fillStyle = '#2e1a0c';
  for (let y = 0; y < h + 2; y++) {
    for (let x = 0; x < W; x++) {
      if (inside[y * W + x]) continue;
      const n =
        (x > 0 && inside[y * W + x - 1]) ||
        (x < W - 1 && inside[y * W + x + 1]) ||
        (y > 0 && inside[(y - 1) * W + x]) ||
        (y < h + 1 && inside[(y + 1) * W + x]);
      if (n) ctx.fillRect(x, y, 1, 1);
    }
  }
  tex.refresh();
}

// ---------------------------------------------------------------- Garten-Hintergrund

function valueNoise(seed, cell) {
  const rng = mulberry32(seed);
  const cache = new Map();
  const at = (ix, iy) => {
    const k = ix * 7919 + iy * 104729;
    if (!cache.has(k)) cache.set(k, rng());
    return cache.get(k);
  };
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// Native Größe: halbe Bildschirmauflösung, Rasen beginnt bei (32, 32).
export const GARDEN_NATIVE = { w: 480, h: 336, lawnX: 32, lawnY: 32, lawnW: 416, lawnH: 272 };

function makeGarden(scene) {
  const { w: W, h: H, lawnX, lawnY, lawnW, lawnH } = GARDEN_NATIVE;
  const tex = scene.textures.createCanvas('garden', W, H);
  const ctx = tex.getContext();
  const img = ctx.createImageData(W, H);
  const rng = mulberry32(4711);
  const hedgeNoise = valueNoise(17, 4);
  const hedgeNoise2 = valueNoise(99, 2);
  const soilNoise = valueNoise(5, 3);
  const lx1 = lawnX + lawnW;
  const ly1 = lawnY + lawnH;

  const put = (x, y, hex) => {
    const [r, g, b] = hexToRgb(hex);
    const i = (y * W + x) * 4;
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = 255;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inLawn = x >= lawnX && x < lx1 && y >= lawnY && y < ly1;
      if (inLawn) {
        // gemähte Streifen
        const stripe = Math.floor((x - lawnX) / 32) % 2 === 0;
        const r = rng();
        let col;
        if (stripe) col = r < 0.08 ? '#4c9a30' : r > 0.94 ? '#7cc255' : r > 0.6 ? '#66b043' : '#5fa83d';
        else col = r < 0.08 ? '#43892a' : r > 0.94 ? '#6db547' : r > 0.6 ? '#5aa138' : '#549b34';
        // leichter Schatten an der oberen/linken Kante
        if (y - lawnY < 3 || x - lawnX < 2) col = stripe ? '#4a8f2e' : '#43862a';
        put(x, y, col);
        continue;
      }
      const dOut = Math.min(x, y, W - 1 - x, H - 1 - y);
      const dx = x < lawnX ? lawnX - x : x >= lx1 ? x - lx1 + 1 : 0;
      const dy = y < lawnY ? lawnY - y : y >= ly1 ? y - ly1 + 1 : 0;
      const dIn = Math.max(dx, dy);
      if (dIn <= 3) {
        // Steinkante
        const along = dx >= dy ? y : x;
        let col = (along % 7 === 0) ? '#6e6e66' : dIn === 1 ? '#c4c4ba' : '#a3a39a';
        if (dIn === 3) col = '#7d7d74';
        if (rng() < 0.07) col = '#8f8f86';
        put(x, y, col);
      } else if (dOut < 15) {
        // Hecke
        const n = hedgeNoise(x, y) * 0.7 + hedgeNoise2(x, y) * 0.3;
        let col = n < 0.35 ? '#204a25' : n < 0.55 ? '#2b5f2f' : n < 0.72 ? '#377337' : '#478a42';
        if (rng() < 0.04) col = '#5ea052';
        if (dOut === 0) col = '#163319';
        put(x, y, col);
      } else {
        // Blumenbeet (Erde)
        const n = soilNoise(x, y);
        let col = n < 0.4 ? '#5c3f27' : n < 0.7 ? '#6b4a2e' : '#7a5636';
        if (rng() < 0.05) col = '#4a3220';
        put(x, y, col);
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // Blumen im Beet
  const flowerCols = ['#e84a5f', '#f7d038', '#a66cff', '#ffffff', '#ff8cc6', '#ff7b29'];
  const inBed = (x, y) => {
    const dOut = Math.min(x, y, W - 1 - x, H - 1 - y);
    const dx = x < lawnX ? lawnX - x : x >= lx1 ? x - lx1 + 1 : 0;
    const dy = y < lawnY ? lawnY - y : y >= ly1 ? y - ly1 + 1 : 0;
    return dOut >= 16 && Math.max(dx, dy) >= 6;
  };
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * H);
    if (!inBed(x, y)) continue;
    const c = flowerCols[Math.floor(rng() * flowerCols.length)];
    ctx.fillStyle = '#2f7a2c';
    ctx.fillRect(x, y + 1, 1, 2);
    ctx.fillStyle = c;
    ctx.fillRect(x - 1, y, 1, 1);
    ctx.fillRect(x + 1, y, 1, 1);
    ctx.fillRect(x, y - 1, 1, 1);
    ctx.fillStyle = c === '#f7d038' ? '#c0581a' : '#ffe066';
    ctx.fillRect(x, y, 1, 1);
  }

  // Gänseblümchen im Rasen
  for (let i = 0; i < 45; i++) {
    const x = lawnX + 4 + Math.floor(rng() * (lawnW - 8));
    const y = lawnY + 5 + Math.floor(rng() * (lawnH - 9));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y, 1, 1);
    ctx.fillRect(x + 1, y, 1, 1);
    ctx.fillRect(x, y - 1, 1, 1);
    ctx.fillRect(x, y + 1, 1, 1);
    ctx.fillStyle = '#f7d038';
    ctx.fillRect(x, y, 1, 1);
  }
  // Klee-Flecken
  for (let i = 0; i < 18; i++) {
    const x = lawnX + 4 + Math.floor(rng() * (lawnW - 8));
    const y = lawnY + 4 + Math.floor(rng() * (lawnH - 8));
    ctx.fillStyle = '#3f8a2a';
    for (let k = 0; k < 6; k++) ctx.fillRect(x + Math.floor(rng() * 5) - 2, y + Math.floor(rng() * 3) - 1, 2, 1);
  }
  tex.refresh();
}

// ---------------------------------------------------------------- Kleinkram

function makeMisc(scene) {
  // 1x1 weißer Pixel für Partikel
  let t = scene.textures.createCanvas('px', 2, 2);
  let c = t.getContext();
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, 2, 2);
  t.refresh();

  // Schatten
  t = scene.textures.createCanvas('shadow', 14, 5);
  c = t.getContext();
  c.fillStyle = '#000000';
  c.fillRect(2, 0, 10, 5);
  c.fillRect(0, 1, 14, 3);
  t.refresh();

  // Frische Erde nach dem Entfernen eines Hügels
  t = scene.textures.createCanvas('patch', 16, 8);
  c = t.getContext();
  const rng = mulberry32(3);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 16; x++) {
      const nx = (x + 0.5 - 8) / 8;
      const ny = (y + 0.5 - 4) / 4;
      if (nx * nx + ny * ny > 1 - rng() * 0.2) continue;
      c.fillStyle = rng() < 0.5 ? '#6b4a2e' : '#5c3f27';
      c.fillRect(x, y, 1, 1);
    }
  }
  t.refresh();

  drawMap(scene, 'stone', ['.KK.', 'KKKk', '.kk.'], { K: '#9a9a90', k: '#6e6e66' });
  drawMap(scene, 'star', ['..Y..', '.YYY.', 'YYYYY', '.YYY.', '.Y.Y.'], { Y: '#ffe14a' });
  drawMap(scene, 'drop', ['.L.', 'LLL', 'Ll.'], { L: '#8fd3ff', l: '#ffffff' }, null);
}

export function generateTextures(scene) {
  makeOpa(scene);
  makeMoles(scene);
  makeGnome(scene);
  makeWeapons(scene);
  makeIcons(scene);
  makeHill(scene, 'hill_0', 18, 11, 11);
  makeHill(scene, 'hill_1', 18, 11, 22);
  makeHill(scene, 'hill_2', 18, 11, 33);
  makeHill(scene, 'hill_boss', 30, 17, 44);
  makeGarden(scene);
  makeMisc(scene);
}
