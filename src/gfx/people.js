// Opa und Oma als Pixelart (je 3 Richtungen × 3 Lauf-Frames).
import { drawMap } from './pixel.js';

const SKIN = { S: '#f2c49b', s: '#d79f76', E: '#222222', r: '#b0605a', B: '#3a2a1e' };

// Opa (nach Vorlage): grau-braune Locken mit Halbglatze, Brille, braune Jacke,
// grünes Hemd, braune Hose
const OPA_PAL = {
  ...SKIN,
  H: '#b9ab92',
  h: '#857760',
  l: '#ddd2bc',
  g: '#a0a6ae',
  r: '#7a2a2a',
  J: '#4a3226',
  j: '#2f2018',
  G: '#8a9a72',
  P: '#6a5038',
  p: '#4e3a28',
  B: '#2a2420',
};

const OPA_DOWN = [
  '.....hlSShl.....',
  '....hlSSSShl....',
  '...hHlSSSSlHh...',
  '...hlSSSSSSlh...',
  '...hlShSShSlh...',
  '...hlgEggEglh...',
  '....hSSssSSh....',
  '.....SrrrrS.....',
  '......sSSs......',
  '....JJGGGGJJ....',
  '...JJJJGGJJJJ...',
  '...JJJJGGJJJJ...',
  '...SJJJGGJJJS...',
  '.....PPPPPP.....',
  '.....PPppPP.....',
];

const OPA_UP = [
  '.....hlSShl.....',
  '....hlSSSShl....',
  '...hHlSSSSlHh...',
  '...hlHhSShHlh...',
  '...hHlhHlhHlh...',
  '...hlHhlHhlHh...',
  '....hHlhHlhh....',
  '.....sSSSSs.....',
  '......sSSs......',
  '....JJJJJJJJ....',
  '...JJJJJJJJJJ...',
  '...JJJJjjJJJJ...',
  '...SJJJjjJJJS...',
  '.....PPPPPP.....',
  '.....PPppPP.....',
];

const OPA_SIDE = [
  '....hlSSh.......',
  '...hlSSSSh......',
  '..hHlSSSSSS.....',
  '..hlHhSSSSSS....',
  '..hHlhSShhSS....',
  '..hlHhSgEgSS....',
  '...hHlSSSSSSs...',
  '....hlSSSrr.....',
  '......sSSs......',
  '......JJGJ......',
  '.....JJJGJJ.....',
  '.....JJJSSJ.....',
  '.....JJJJJJ.....',
  '......PPPP......',
  '......PPpP......',
];

// Oma (nach Vorlage): helle Locken, Brille, roter Pulli, dunkle Hose,
// braune Schuhe – und eine Bratpfanne!
const OMA_PAL = {
  ...SKIN,
  H: '#d8d0c0',
  h: '#a89e8c',
  l: '#f2eee6',
  g: '#8a8a90',
  r: '#c05050',
  D: '#c82828',
  d: '#8e1818',
  P: '#4a3a2e',
  p: '#33281f',
  K: '#1a1a1a',
  k: '#3a3a3a',
  B: '#8a5a32',
};

const OMA_DOWN = [
  '.....hlHhlh.....',
  '....hlHhlHhl....',
  '...hHlhHlhHlh...',
  '...hlSSSSSShl...',
  '...hlgEggEglh...',
  '....hSSssSSh....',
  '.....SSrrSS.....',
  '......sSSs......',
  '.....DDDDDD.....',
  '....DDDDDDDD....',
  '....DDdddDDDS...',
  '....SDDDDDDkKKK.',
  '.....DDDDDD.KKK.',
  '.....PPPPPP.....',
  '.....PPppPP.....',
];

const OMA_UP = [
  '.....hlHhlh.....',
  '....hlHhlHhl....',
  '...hHlhHlhHlh...',
  '...hlHhlHhlHh...',
  '...hHlhHlhHlh...',
  '....hHlhHlhh....',
  '.....sSSSSs.....',
  '......sSSs......',
  '.....DDDDDD.....',
  '....DDDDDDDD....',
  '...SDDdddDDD....',
  '.KKKkDDDDDDS....',
  '.KKK.DDDDDD.....',
  '.....PPPPPP.....',
  '.....PPppPP.....',
];

const OMA_SIDE = [
  '....hlHhlh......',
  '...hlHhlHhl.....',
  '..hHlhHlhHl.....',
  '..hlHhlhSSSS....',
  '..hHlhlgEgSS....',
  '..hlHhlSSSSSs...',
  '...hHlSSSrr.....',
  '......sSSs......',
  '......DDDD......',
  '.....DDDDDD.....',
  '.....DDdSSkKK...',
  '.....DDDDD.KKK..',
  '......DDDD.KK...',
  '......PPPP......',
  '......PPpP......',
];

const LEGS_FRONT = [
  ['.....PP..PP.....', '.....BB..BB.....'],
  ['......P..PP.....', '......B..BB.....'],
  ['.....PP..P......', '.....BB..B......'],
];

const LEGS_SIDE = [
  ['......PP.P......', '......BB.BB.....'],
  ['.....PP...P.....', '....BB....BB....'],
  ['.......PP.......', '.......BBB......'],
];

function makePerson(scene, prefix, maps, pal) {
  for (let f = 0; f < 3; f++) {
    drawMap(scene, `${prefix}_down_${f}`, [...maps.down, ...LEGS_FRONT[f]], pal);
    drawMap(scene, `${prefix}_up_${f}`, [...maps.up, ...LEGS_FRONT[f]], pal);
    drawMap(scene, `${prefix}_side_${f}`, [...maps.side, ...LEGS_SIDE[f]], pal);
  }
}

export function makePeople(scene) {
  makePerson(scene, 'opa', { down: OPA_DOWN, up: OPA_UP, side: OPA_SIDE }, OPA_PAL);
  makePerson(scene, 'oma', { down: OMA_DOWN, up: OMA_UP, side: OMA_SIDE }, OMA_PAL);
  // Oma-Porträt für Ankündigung & Icon
  drawMap(scene, 'i_oma', [...OMA_DOWN, ...LEGS_FRONT[0]], OMA_PAL);
}
