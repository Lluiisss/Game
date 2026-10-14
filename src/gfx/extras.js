// Zusätzliche Pixelart: Oma, Schusswaffen, Projektile, Garten-Helfer und Icons.
import { drawMap } from './pixel.js';

// ---------------------------------------------------------------- Neue Waffen

const W_PAL = {
  T: '#d0d4d8',
  t: '#8b9096',
  W: '#b07a45',
  w: '#7a5230',
  R: '#c0392b',
  r: '#8a2620',
  K: '#6a6a70',
  k: '#3f3f45',
  Y: '#f2c230',
  y: '#c4901a',
  G: '#4f7a3a',
  g: '#36572a',
  O: '#f07d1a',
  o: '#b85a0c',
  B: '#5ac8fa',
};

function col(n, row) {
  return Array(n).fill(row);
}

function makeWeapons(scene) {
  // Omas Bratpfanne
  drawMap(
    scene,
    'w_pan',
    ['..kKKKk..', '.KKkkkKK.', 'KKkkkkkKK', 'KKkkkkkKK', 'KKkkkkkKK', '.KKkkkKK.', '..kKKKk..', '....K....', '....K....', '....W....', '....W....', '....W....'],
    { K: '#1a1a1a', k: '#454548', W: '#3a2414' },
  );
  drawMap(
    scene,
    'w_chicken',
    [
      '..RR...',
      '.YYYY..',
      'YYEYYO.',
      '.YYYYOO',
      '..YY...',
      '.YYYY..',
      'YYYYYY.',
      'YyYYYY.',
      'YYYYyY.',
      '.YYYY..',
      '..OO...',
      '..O....',
      '..O....',
      '..O....',
    ],
    { Y: '#ffe14a', y: '#e0b820', R: '#e8302a', E: '#111111', O: '#f07d1a' },
  );
  drawMap(
    scene,
    'w_zucchini',
    ['..gg..', '.GGGG.', ...col(3, '.GgGG.'), ...col(3, '.GGgG.'), ...col(3, '.GgGG.'), ...col(3, '.GGgG.'), '.GGGG.', '..GG..', '..yy..', '..yy..'],
    { G: '#3f9c3a', g: '#8fd06a', y: '#c8b04a' },
  );
  drawMap(
    scene,
    'w_can',
    [
      'BB.B.....',
      '.ttT.....',
      '..tT.....',
      '...tT....',
      '....tGGGG',
      '....GGGGG',
      '...GGgGGG',
      '...GGGGGG',
      '...GGgGGG',
      '...GGGGGG',
      '....GGGG.',
      '.....kk..',
      '.....k...',
      '.....k...',
    ],
    { B: '#8fd3ff', t: '#8b9096', T: '#d0d4d8', G: '#3f9c3a', g: '#6fc05a', k: '#2b6e28' },
  );
  drawMap(
    scene,
    'w_whip',
    [
      '.yY.',
      '.YY.',
      '.GG.',
      'G...',
      'G...',
      '.G..',
      '..G.',
      '..G.',
      '.G..',
      'G...',
      'G...',
      '.G..',
      '..G.',
      '..G.',
      '.G..',
      '.GG.',
      '.RR.',
      '.RR.',
    ],
    { Y: '#f2c230', y: '#c4901a', G: '#3f9c3a', R: '#c0392b' },
  );
  drawMap(
    scene,
    'w_fork',
    ['T.T.T', 'T.T.T', 'T.T.T', 'T.T.T', 'ttttt', '..w..', ...col(16, '..W..')],
    W_PAL,
  );
  drawMap(
    scene,
    'w_scythe',
    [
      'TTTTTTTTT......',
      '.tTTTTTTTTT....',
      '...ttTTTTTTT...',
      '.......ttTTTw..',
      '...........W...',
      ...col(16, '...........W...'),
      '..........WWW..',
    ],
    W_PAL,
  );
  drawMap(
    scene,
    'w_chainsaw',
    [
      '.TtTtT.',
      'tKKKKKt',
      'TKkkkKT',
      'tKkkkKT',
      'TKkkkKt',
      'tKkkkKT',
      'TKkkkKt',
      'tKKKKKT',
      '.TtTtT.',
      'OOOOOOO',
      'OOoOOOO',
      'OOOOOOO',
      'OkOOOOO',
      '.OOOOO.',
      '.k...k.',
      '.kkkkk.',
    ],
    W_PAL,
  );
}

// ---------------------------------------------------------------- Helfer

function makeHelpers(scene) {
  drawMap(scene, 'bee', ['.ww..', 'YkYkY', 'YkYkY', '.....'].slice(0, 3), {
    Y: '#f2c230',
    k: '#222222',
    w: '#ffffff',
  });
  drawMap(
    scene,
    'hedgehog',
    ['..b.b.b.', '.bBbBbBb', 'bBbBbBbB', 'BbBbBbBb', 'bBbBbBbB', '.bBbBbB.', '..bBbB..'],
    { B: '#8a6a3a', b: '#3a2a1e' },
  );
  drawMap(
    scene,
    'mower',
    [
      '..RRRRRRRRRR..',
      '.RRRRRRRRRRRR.',
      'kRRkkkkkkkkRRk',
      'kRRkGGGGGGkRRk',
      '.RRkkkkkkkkRR.',
      '.RRRRRRRRRRRR.',
      'kRRRRYRRYRRRRk',
      'kRRRRRRRRRRRRk',
      '..RRRRRRRRRR..',
    ],
    { R: '#d8352a', k: '#222222', G: '#56e04a', Y: '#f2c230' },
  );
  drawMap(
    scene,
    'cloud',
    [
      '.......wwww.........',
      '....wwwwwwwwww......',
      '..wwwwwwwwwwwwwww...',
      '.wwwwwwwwwwwwwwwwww.',
      'wwwwwwwwwwwwwwwwwwww',
      'LLLLLLLLLLLLLLLLLLLL',
      '.LLLLLLLLLLLLLLLLLL.',
      '...LLLLLLLLLLLLLL...',
    ],
    { w: '#f4f6fa', L: '#aab6c4' },
  );
  drawMap(scene, 'butterfly_0', ['P.P', 'PkP', 'P.P'], { P: '#ff8cc6', k: '#3a2a1e' }, null);
  drawMap(scene, 'butterfly_1', ['...', 'PkP', '...'], { P: '#ff8cc6', k: '#3a2a1e' }, null);
  drawMap(scene, 'butterfly2_0', ['Y.Y', 'YkY', 'Y.Y'], { Y: '#f7d038', k: '#3a2a1e' }, null);
  drawMap(scene, 'butterfly2_1', ['...', 'YkY', '...'], { Y: '#f7d038', k: '#3a2a1e' }, null);
}

// ---------------------------------------------------------------- Icons

const ICON_PAL = {
  ...W_PAL,
  w: '#ffffff',
  L: '#aab6c4',
  l: '#5ac8fa',
  M: '#ffe14a',
  b: '#3a2a1e',
  B: '#8a6a3a',
  S: '#d9b38c',
  E: '#222222',
  N: '#111111',
};

const ICONS = {
  i_bees: [
    '...YYYY.....',
    '..YyyyyY....',
    '.YYYYYYYY...',
    '.YyyyyyyY...',
    '.YYYYYYYY...',
    '..YyyyyY....',
    '...YbbY.....',
    '............',
    '.......ww.ww',
    '......YkYkY.',
    '......YkYkY.',
    '............',
  ],
  i_hedgehog: [
    '............',
    '...b.b.b....',
    '..bBbBbBb...',
    '.bBbBbBbBb..',
    'bBbBbBbBbBS.',
    'BbBbBbBbBSSE',
    'bBbBbBbBSSSN',
    '.SSSSSSSSSS.',
    '..k.....k...',
    '............',
  ],
  i_mower: [
    '............',
    '..RRRRRRRR..',
    '.RRRRRRRRRR.',
    '.RRkkkkkkRR.',
    '.RRkGGGGkRR.',
    '.RRkkkkkkRR.',
    '.RRRRRRRRRR.',
    'kk.RRRRRR.kk',
    'kk........kk',
    'gggggggggggg',
  ],
  i_cloud: [
    '....wwww....',
    '..wwwwwwww..',
    '.wwwwwwwwww.',
    'wwwwwwwwwwww',
    'LLLLLLLLLLLL',
    '.LLLLLLLLLL.',
    '............',
    '..l..l..l...',
    '.l..l..l....',
    '............',
    '..l..l..l...',
    '.l..l..l....',
  ],
  i_storm: [
    '......MMM...',
    '.....MMM....',
    '....MMM.....',
    '...MMM......',
    '..MMMMMMM...',
    '.....MMM....',
    '....MMM.....',
    '...MMM......',
    '..MM........',
    '.MM.........',
    '.M..........',
    '............',
  ],
};

function makeIcons(scene) {
  Object.entries(ICONS).forEach(([key, rows]) => {
    if (key === 'i_mower') drawMap(scene, key, rows, { ...ICON_PAL, R: '#d8352a', G: '#56e04a', g: '#3f9c3a' });
    else drawMap(scene, key, rows, ICON_PAL);
  });
}

export function makeExtras(scene) {
  makeWeapons(scene);
  makeHelpers(scene);
  makeIcons(scene);
}
