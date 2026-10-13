// Opa und Oma als Pixelart (je 3 Richtungen × 3 Lauf-Frames).
import { drawMap } from './pixel.js';

const SKIN = { S: '#f2c49b', s: '#d79f76', E: '#222222', r: '#b0605a', B: '#3a2a1e' };

// Opa: schlank, graue Locken, kariertes Hemd, graue Hose, kein Bart
const OPA_PAL = {
  ...SKIN,
  H: '#b4b4b4',
  h: '#7a7a7a',
  l: '#e0e0e0',
  C: '#c0392b',
  K: '#4a1410',
  Y: '#f0c870',
  P: '#8c8c8c',
  p: '#6a6a6a',
};

const OPA_DOWN = [
  '.....hlHhlh.....',
  '....hlHhlHhl....',
  '...hHlhHlhHlh...',
  '...hlSSSSSShl...',
  '...hlShSShSlh...',
  '...hlSESSESlh...',
  '....hSSssSSh....',
  '.....SSrrSS.....',
  '......sSSs......',
  '.....CYCCYC.....',
  '....KKKKKKKK....',
  '....CCYCCYCC....',
  '....SKKKKKKS....',
  '.....PPPPPP.....',
  '.....PPppPP.....',
];

const OPA_UP = [
  '.....hlHhlh.....',
  '....hlHhlHhl....',
  '...hHlhHlhHlh...',
  '...hlHhlHhlHh...',
  '...hHlhHlhHlh...',
  '...hlHhlHhlHh...',
  '....hHlhHlhh....',
  '.....sSSSSs.....',
  '......sSSs......',
  '.....CYCCYC.....',
  '....KKKKKKKK....',
  '....CCYCCYCC....',
  '....SKKKKKKS....',
  '.....PPPPPP.....',
  '.....PPppPP.....',
];

const OPA_SIDE = [
  '....hlHhlh......',
  '...hlHhlHhl.....',
  '..hHlhHlhHl.....',
  '..hlHhlhSSSS....',
  '..hHlhlShhSS....',
  '..hlHhlSSSES....',
  '...hHlSSSSSSs...',
  '....hlSSSrr.....',
  '......sSSs......',
  '......CYCC......',
  '.....KKKKKK.....',
  '.....CCYSSC.....',
  '.....KKKKKK.....',
  '......PPPP......',
  '......PPpP......',
];

// Oma: weiße Locken, Brille, roter Pulli, helle Hose, schwarze Handtasche
const OMA_PAL = {
  ...SKIN,
  H: '#ffffff',
  h: '#c4c4d0',
  l: '#e6e6ee',
  g: '#4a3a7a',
  D: '#d03030',
  d: '#8e1e1e',
  P: '#efe3c8',
  p: '#cbbd9e',
  K: '#1a1a1a',
  k: '#555555',
  B: '#6a4a3a',
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
  '....DDdddDDDk...',
  '....SDDDDDDSKK..',
  '.....DDDDDD.KK..',
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
  '...kDDDdddDD....',
  '..KKSDDDDDDS....',
  '..KK.DDDDDD.....',
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
  '.....DDdSSD.....',
  '.....DDDKKD.....',
  '......DDKK......',
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
