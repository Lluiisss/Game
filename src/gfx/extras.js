// Zusätzliche Pixelart: Oma, Schusswaffen, Projektile, Garten-Helfer und Icons.
import { drawMap } from './pixel.js';

// ---------------------------------------------------------------- Oma

const OMA_PAL = {
  H: '#dcdce4',
  h: '#9a9aa8',
  l: '#ffffff',
  S: '#f2c49b',
  s: '#d79f76',
  E: '#222222',
  g: '#4a3a7a',
  r: '#c0606a',
  W: '#ffffff',
  D: '#8a4fb0',
  d: '#6a3590',
  K: '#c0392b',
  L: '#e8c2a0',
  B: '#3a2a1e',
};

const OMA_DOWN = [
  '......hHHh......',
  '.....hHlHHh.....',
  '....hHHHHHHh....',
  '...hHHHHHHHHh...',
  '...hHSSSSSSHh...',
  '...hSgEggEgSh...',
  '....SSSSSSSS....',
  '.....SSrrSS.....',
  '....DDWWWWDD....',
  '...DDDDddDDDD...',
  '..SDDDDddDDDDK..',
  '..DDDDDDDDDDKK..',
  '...DDDDDDDDDD...',
  '....DDDDDDDD....',
];

const OMA_UP = [
  '......hHHh......',
  '.....hHlHHh.....',
  '....hHHHHHHh....',
  '...hHHHHHHHHh...',
  '...hHHHlHHHHh...',
  '...hHHHHHHHHh...',
  '....sHHHHHHs....',
  '.....sSSSSs.....',
  '....DDDDDDDD....',
  '...DDDDddDDDD...',
  '..KDDDDddDDDDS..',
  '..KKDDDDDDDDDD..',
  '...DDDDDDDDDD...',
  '....DDDDDDDD....',
];

const OMA_SIDE = [
  '.....hHHh.......',
  '....hHlHHh......',
  '...hHHHHHHh.....',
  '..hHHHHHSSSS....',
  '..hHHHHSgEgS....',
  '..hHHHSSSSSSSs..',
  '...hHSSSSrrS....',
  '.....sSSSSs.....',
  '.....DDWWDD.....',
  '....DDDDDDDD....',
  '....DDDDSSDD....',
  '....DDDDKKDD....',
  '...DDDDDKKDDD...',
  '....DDDDDDDD....',
];

const OMA_LEGS_FRONT = [
  ['.....LL..LL.....', '.....BB..BB.....'],
  ['......L..LL.....', '......B..BB.....'],
  ['.....LL..L......', '.....BB..B......'],
];
const OMA_LEGS_SIDE = [
  ['.....LL..LL.....', '.....BBB.BBB....'],
  ['....LL....LL....', '...BBB....BBB...'],
  ['......LLLL......', '......BBBBB.....'],
];

function makeOma(scene) {
  for (let f = 0; f < 3; f++) {
    drawMap(scene, `oma_down_${f}`, [...OMA_DOWN, ...OMA_LEGS_FRONT[f]], OMA_PAL);
    drawMap(scene, `oma_up_${f}`, [...OMA_UP, ...OMA_LEGS_FRONT[f]], OMA_PAL);
    drawMap(scene, `oma_side_${f}`, [...OMA_SIDE, ...OMA_LEGS_SIDE[f]], OMA_PAL);
  }
}

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
  drawMap(
    scene,
    'w_sling',
    [
      'W.......W',
      'W.......W',
      'WR.....RW',
      '.W.....W.',
      '.WR...RW.',
      '..W...W..',
      '..WwwwW..',
      '...WWW...',
      '....W....',
      '....W....',
      '...RRR...',
      '...RrR...',
      '...RRR...',
      '....R....',
    ],
    W_PAL,
  );
  drawMap(
    scene,
    'w_pumpkin',
    [
      '..OOOOOOO..',
      '.OkkkkkkkO.',
      '.OkkkkkkkO.',
      '..KKKKKKK..',
      ...col(4, '..KKKkKKK..'),
      '..OOOOOOO..',
      ...col(4, '..KKKkKKK..'),
      '.KKKKKKKKK.',
      '.WWWWWWWWW.',
      'WWWwWWWwWWW',
      '.WWWWWWWWW.',
    ],
    W_PAL,
  );
  drawMap(
    scene,
    'w_flamer',
    [
      '.kYYYk.',
      '.kOOOk.',
      '..kkk..',
      ...col(11, '...t...'),
      '..RRR..',
      '.RRRRR.',
      '.RYRRR.',
      '.RRRRR.',
      '.RRRRR.',
      '.rrrrr.',
    ],
    { ...W_PAL, t: '#9a9aa0' },
  );
  drawMap(
    scene,
    'w_rocket',
    [
      '...RRR...',
      '..RRRRR..',
      '.GGGGGGG.',
      '.GgGGGgG.',
      ...col(3, '.GGGGGGG.'),
      '.YYYYYYY.',
      ...col(3, '.GGGGGGG.'),
      '.GgGGGgG.',
      '.YYYYYYY.',
      ...col(3, '.GGGGGGG.'),
      '.GGkkkGG.',
      '..K...K..',
      '..K...K..',
    ],
    W_PAL,
  );
}

// ---------------------------------------------------------------- Projektile

function makeProjectiles(scene) {
  drawMap(scene, 'p_chestnut', ['.BB.', 'BbBB', 'BBBB', '.bb.'], { B: '#8a4a1e', b: '#c07a3e' });
  drawMap(
    scene,
    'p_pumpkin',
    ['...g...', '.OOgOO.', 'OOoOoOO', 'OOoOoOO', 'OOoOoOO', '.OOOOO.'],
    { O: '#f07d1a', o: '#c45a0c', g: '#3f9c3a' },
  );
  // Rakete zeigt nach rechts
  drawMap(
    scene,
    'p_rocket',
    ['RR.......', 'RWWWWWWRR.', 'RWWYWWWRRR', 'RWWWWWWRR.', 'RR.......'],
    { R: '#d8352a', W: '#eeeeee', Y: '#3b6fc4' },
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
  C: '#8a4a1e',
  c: '#c07a3e',
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
  i_multi: [
    '............',
    '..CCC..CCC..',
    '.CCcCCCCcCC.',
    '.CCCCCCCCCC.',
    '.bCCCbbCCCb.',
    '..bbb..bbb..',
    '............',
    '....w..w....',
    '...www.www..',
    '....w..w....',
    '............',
    '............',
  ],
  i_oma: [
    '....hHHh....',
    '...hHHHHh...',
    '..hHSSSShh..',
    '..hSgEgESh..',
    '...SSrrSS...',
    '..DDWWWWDD..',
    '.DDDDddDDDD.',
    '.SDDDddDDDK.',
    '..DDDDDDDKK.',
    '..DDDDDDDD..',
    '...L....L...',
    '...B....B...',
  ],
};

function makeIcons(scene) {
  const pal = { ...ICON_PAL, H: '#dcdce4', h: '#9a9aa8', g: '#4a3a7a', r: '#c0606a', D: '#8a4fb0', d: '#6a3590', K: '#c0392b', W: '#ffffff', L: '#e8c2a0', B: '#3a2a1e' };
  Object.entries(ICONS).forEach(([key, rows]) => {
    if (key === 'i_oma') drawMap(scene, key, rows, pal);
    else if (key === 'i_mower') drawMap(scene, key, rows, { ...ICON_PAL, R: '#d8352a', G: '#56e04a', g: '#3f9c3a' });
    else drawMap(scene, key, rows, ICON_PAL);
  });
}

export function makeExtras(scene) {
  makeOma(scene);
  makeWeapons(scene);
  makeProjectiles(scene);
  makeHelpers(scene);
  makeIcons(scene);
}
