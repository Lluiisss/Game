// Sämtliche Grafiken werden hier im Code als Pixelart erzeugt.
// Kleine Sprites werden aus "Pixel-Karten" (Strings) gezeichnet, Rasen,
// Hecke und Hügel prozedural mit etwas Rauschen.

import { drawMap } from './pixel.js';
import { makeGarden, mulberry32 } from './garden.js';
import { makeExtras } from './extras.js';
import { makePeople } from './people.js';

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
  T: '#b8bcc4',
  t: '#6e737c',
  G: '#3f9c3a',
  g: '#2b6e28',
  W: '#ffffff',
  P: '#ff8cc6',
  p: '#d0508a',
  B: '#7fd0ff',
  k: '#111111',
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

  // Gigamaulwurf: goldene Krone mit Rubin, rote Augen
  const giga = [
    '...y...yy...y...',
    '...Y..YYYY..Y...',
    '...YYYYeeYYYY...',
    '...YYYYYYYYYY...',
    '..fFFFFFFFFFFf..',
    '..FFeeFFFFeeFF..',
    '.fFFFFFFFFFFFFf.',
    ...MOLE_BASE.slice(5),
  ];
  drawMap(scene, 'mole_giga', giga, MOLE_PAL);
  drawMap(scene, 'mole_giga_dead', replaceRows(giga, { 5: '..FxFxFFFFxFxF..' }), MOLE_PAL);

  // Panzer-Maulwurf: Stahlhelm
  const armor = [
    '.....TTTTTT.....',
    '...TTTTTTTTTT...',
    '..TtTTTTTTTTtT..',
    '.tttttttttttttt.',
    '..FFFwEFFEwFFF..',
    ...MOLE_BASE.slice(4),
  ];
  drawMap(scene, 'mole_armor', armor, MOLE_PAL);
  drawMap(scene, 'mole_armor_dead', replaceRows(armor, { 4: '..FFxFxFFxFxFF..' }), MOLE_PAL);

  // Buddel-Maulwurf: grünes Kopftuch, Erde an den Krallen
  const digPal = { ...MOLE_PAL, K: '#8a5a2a' };
  const dig = replaceRows(MOLE_BASE, { 1: '...fGGGGGGGGf...', 2: '..fGGgGGGGgGGf..' });
  drawMap(scene, 'mole_dig', dig, digPal);
  drawMap(scene, 'mole_dig_dead', replaceRows(dig, { 3: DEAD_EYES[3], 4: DEAD_EYES[4] }), digPal);

  // Angsthase: heller Pelz, große Augen, Schweißtropfen
  const scaredPal = { ...MOLE_PAL, F: '#8f7f78', f: '#5e504a', L: '#b0a09a' };
  const scared = replaceRows(MOLE_BASE, {
    1: '...fFFFFFFFFf.B.',
    2: '..fFwwFFFFwwFfBB',
    3: '..FFwEFFFFwEFF..',
  });
  drawMap(scene, 'mole_scared', scared, scaredPal);
  drawMap(scene, 'mole_scared_dead', replaceRows(MOLE_BASE, DEAD_EYES), scaredPal);

  // Doktor-Maulwurf: Haube mit rotem Kreuz
  const doc = replaceRows(MOLE_BASE, {
    0: '......WWWW......',
    1: '....WWWRRWWW....',
    2: '..fFWWRRRRWWFf..',
  });
  drawMap(scene, 'mole_doc', doc, MOLE_PAL);
  drawMap(scene, 'mole_doc_dead', replaceRows(doc, { 3: DEAD_EYES[3], 4: DEAD_EYES[4] }), MOLE_PAL);

  // Mama-Maulwurf: rosa Schleife und Wimpern
  const mama = replaceRows(MOLE_BASE, {
    0: '...PPp..pPP.....',
    1: '...PPPpPPPFFf...',
    2: '..fFPp..pPFFFf..',
    3: '..FFkwEFFEwkFF..',
  });
  drawMap(scene, 'mole_mama', mama, MOLE_PAL);
  drawMap(scene, 'mole_mama_dead', replaceRows(mama, { 3: DEAD_EYES[3], 4: DEAD_EYES[4] }), MOLE_PAL);
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
  makePeople(scene);
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
  makeExtras(scene);
}
