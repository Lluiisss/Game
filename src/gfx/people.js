// Opa und Oma als kleine Pixelart (16×17, je 3 Richtungen × 3 Lauf-Frames).
// Bewusst wenige Pixel: kleiner runder Kopf, einfaches Gesicht mit Brille.
import { drawMap } from './pixel.js';

const FACE = {
  S: '#f2c49b',
  s: '#d79f76',
  e: '#e0a882',
  E: '#2a1a10',
  m: '#8a3030',
  r: '#c05a5a',
  B: '#2a2420',
};

// Opa (nach Vorlage): volle grau-braune Locken, Brille, braune Jacke, grünes Hemd, braune Hose
const OPA_PAL = {
  ...FACE,
  H: '#b9ab92',
  h: '#857760',
  l: '#ddd2bc',
  g: '#9aa0a8',
  J: '#4a3226',
  j: '#2f2018',
  G: '#8a9a72',
  P: '#6a5038',
  p: '#4e3a28',
};

// Oma (nach Vorlage): helle Locken über den Ohren, Brille, roter Pulli, dunkle Hose
const OMA_PAL = {
  ...FACE,
  H: '#e2dacb',
  h: '#aea38f',
  l: '#f6f2ea',
  g: '#9a9aa0',
  D: '#c82828',
  d: '#8e1818',
  P: '#4a3a2e',
  p: '#33281f',
  B: '#8a5a32',
};

const OPA_DOWN = [
  '.....hlHHlh.....',
  '....hlHhHlHh....',
  '....hHSSSSHh....',
  '....hgESSEgh....',
  '....eSSssSSe....',
  '.....SSmmSS.....',
  '......ssss......',
  '....JJGGGGJJ....',
  '...JJJJGGJJJJ...',
  '...JJJJGGJJJJ...',
  '...SJJJGGJJJS...',
  '....JJJJJJJJ....',
  '....PPPPPPPP....',
  '....PPPppPPP....',
];

const OPA_UP = [
  '.....hlHHlh.....',
  '....hlHhHlHh....',
  '....hHlhHlHh....',
  '....hlHhlHhh....',
  '....eHlhHlhe....',
  '.....hlHhlh.....',
  '......ssss......',
  '....JJJJJJJJ....',
  '...JJJJJJJJJJ...',
  '...JJJJjjJJJJ...',
  '...SJJJjjJJJS...',
  '....JJJJJJJJ....',
  '....PPPPPPPP....',
  '....PPPppPPP....',
];

const OPA_SIDE = [
  '.....hlHHl......',
  '....hlHhHlH.....',
  '....hHlSSSSS....',
  '....hlhSSgES....',
  '....hesSSSSS....',
  '.....SSSSmS.....',
  '......sss.......',
  '.....JJGJ.......',
  '.....JJJGJ......',
  '.....JJJJJ......',
  '.....JJSSJ......',
  '.....JJJJJ......',
  '......PPPP......',
  '......PPpP......',
];

const OMA_DOWN = [
  '.....hlHHlh.....',
  '...hlHhHlHhlh...',
  '...hlHSSSSHlh...',
  '...hHgESSEgHh...',
  '....hSSssSSh....',
  '.....SSrrSS.....',
  '......ssss......',
  '....DDDDDDDD....',
  '...DDDDDDDDDD...',
  '...DDDddddDDD...',
  '...SDDDDDDDDS...',
  '....DDDDDDDD....',
  '....PPPPPPPP....',
  '....PPPppPPP....',
];

const OMA_UP = [
  '.....hlHHlh.....',
  '...hlHhHlHhlh...',
  '...hHlhHlhHlh...',
  '...hlHhlHhlHh...',
  '....hHlhHlhh....',
  '.....hlHhlh.....',
  '......ssss......',
  '....DDDDDDDD....',
  '...DDDDDDDDDD...',
  '...DDDDDDDDDD...',
  '...SDDDDDDDDS...',
  '....DDDDDDDD....',
  '....PPPPPPPP....',
  '....PPPppPPP....',
];

const OMA_SIDE = [
  '....hlHHl.......',
  '...hlHhHlH......',
  '...hHlhSSSSS....',
  '...hlHhSSgES....',
  '...hHlhSSSSS....',
  '.....hlSSrS.....',
  '......sss.......',
  '.....DDDD.......',
  '.....DDDDD......',
  '.....DDDDD......',
  '.....DDSSD......',
  '.....DDDDD......',
  '......PPPP......',
  '......PPpP......',
];

const LEGS_FRONT = [
  ['....PPP..PPP....', '....PPP..PPP....', '....BBB..BBB....'],
  ['.....PP..PPP....', '.....PP..PPP....', '.....BB..BBB....'],
  ['....PPP..PP.....', '....PPP..PP.....', '....BBB..BB.....'],
];

const LEGS_SIDE = [
  ['......PP.P......', '......PP.P......', '......BB.BB.....'],
  ['.....PP..PP.....', '.....PP..PP.....', '....BB...BB.....'],
  ['.......PP.......', '.......PP.......', '.......BBB......'],
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
