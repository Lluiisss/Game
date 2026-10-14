// Opa und Oma als Pixelart (je 3 Richtungen × 3 Lauf-Frames), 20×24 Pixel:
// runde Köpfe mit Ohren, Augen (Weiß + Pupille), Augenbrauen, Nase und Mund.
import { drawMap } from './pixel.js';

const FACE = {
  S: '#f2c49b',
  s: '#d79f76',
  e: '#e0a882',
  N: '#b97a58',
  W: '#ffffff',
  E: '#2a1a10',
  m: '#6a2020',
  r: '#b0505a',
  B: '#2a2420',
};

// Opa (nach Vorlage): Halbglatze mit grau-braunen Locken an den Seiten, Brille,
// braune Jacke, grünes Hemd, braune Hose
const OPA_PAL = {
  ...FACE,
  H: '#b9ab92',
  h: '#857760',
  l: '#ddd2bc',
  b: '#6e6250',
  g: '#8a9098',
  J: '#4a3226',
  j: '#2f2018',
  G: '#8a9a72',
  P: '#6a5038',
  p: '#4e3a28',
};

// Oma (nach Vorlage): helle Locken, Brille, roter Pulli, dunkle Hose, braune Schuhe
const OMA_PAL = {
  ...FACE,
  H: '#e2dacb',
  h: '#aea38f',
  l: '#f6f2ea',
  b: '#9a8e7a',
  g: '#8a8a90',
  D: '#c82828',
  d: '#8e1818',
  P: '#4a3a2e',
  p: '#33281f',
  B: '#8a5a32',
};

const OPA_DOWN = [
  '.......SSSSSS.......',
  '.....SSSSSSSSSS.....',
  '....hSSSSSSSSSSh....',
  '...hlhSSSSSSSShlh...',
  '...hHlSbbSSbbSlHh...',
  '..ehlSgWEggEWgSlhe..',
  '..ehHSSSSssSSSSHhe..',
  '...hlSSSSssSSSSlh...',
  '....hSSSsNNsSSSh....',
  '.....SSSSSSSSSS.....',
  '.....SSmrrrrmSS.....',
  '......sSSSSSSs......',
  '........ssss........',
  '.....JJJGGGGJJJ.....',
  '....JJJJJGGJJJJJ....',
  '...JJJJJJGGJJJJJJ...',
  '...JJJJJJGGJJJJJJ...',
  '...SJJJJJGGJJJJJS...',
  '.....JJJJJJJJJJ.....',
  '.....PPPPPPPPPP.....',
  '.....PPPPppPPPP.....',
];

const OPA_UP = [
  '.......SSSSSS.......',
  '.....SSSSSSSSSS.....',
  '....hSSSSSSSSSSh....',
  '...hlhSSSSSSSShlh...',
  '...hHlhSSSSSShlHh...',
  '..ehlHhlHSShlHhlhe..',
  '..ehHlhHlhHlhHlHhe..',
  '...hlHhlHhlHhlHlh...',
  '....hHlhHlhHlhHh....',
  '.....hlHhlHhlHh.....',
  '......sSSSSSSs......',
  '.......sSSSSs.......',
  '........ssss........',
  '.....JJJJJJJJJJ.....',
  '....JJJJJJJJJJJJ....',
  '...JJJJJJjjJJJJJJ...',
  '...JJJJJJjjJJJJJJ...',
  '...SJJJJJjjJJJJJS...',
  '.....JJJJJJJJJJ.....',
  '.....PPPPPPPPPP.....',
  '.....PPPPppPPPP.....',
];

const OPA_SIDE = [
  '......SSSSS.........',
  '....SSSSSSSSS.......',
  '...hSSSSSSSSSS......',
  '..hlhSSSSSSSSSS.....',
  '..hHlhSSSSSbbSS.....',
  '..hlHeeSSSgWEgS.....',
  '..hHlesSSSSSSSSS....',
  '...hlhSSSSSSSSSSS...',
  '....hSSSSSSSSNs.....',
  '.....SSSSSSmmrS.....',
  '.....sSSSSSSSS......',
  '......sSSSSSs.......',
  '........sss.........',
  '.......JJGJJ........',
  '......JJJJGJJ.......',
  '......JJJJJJJ.......',
  '......JJJSSJJ.......',
  '......JJJJJJJ.......',
  '......JJJJJJJ.......',
  '.......PPPPP........',
  '.......PPPpP........',
];

const OMA_DOWN = [
  '......hlHHHHlh......',
  '....hlHhlHHlhHlh....',
  '...hHlhHlhhlHhlHh...',
  '..hlHhSSSSSSSShHlh..',
  '..hHlSSbbSSbbSSlHh..',
  '..ehlSgWEggEWgSlhe..',
  '..ehHSSSSssSSSSHhe..',
  '...hlSSSSssSSSSlh...',
  '....hSSSsNNsSSSh....',
  '.....SSrSSSSrSS.....',
  '.....SSSrrrrSSS.....',
  '......sSSSSSSs......',
  '........ssss........',
  '.....DDDDDDDDDD.....',
  '....DDDDDDDDDDDD....',
  '...DDDDDdddDDDDDD...',
  '...DDDDDDDDDDDDDD...',
  '...SDDDDDDDDDDDDS...',
  '.....DDDDDDDDDD.....',
  '.....PPPPPPPPPP.....',
  '.....PPPPppPPPP.....',
];

const OMA_UP = [
  '......hlHHHHlh......',
  '....hlHhlHHlhHlh....',
  '...hHlhHlhhlHhlHh...',
  '..hlHhlHhlHhlHhlHh..',
  '..hHlhHlhHlhHlhHlh..',
  '..ehlHhlHhlHhlHhle..',
  '..ehHlhHlhHlhHlHhe..',
  '...hlHhlHhlHhlHlh...',
  '....hHlhHlhHlhHh....',
  '.....hlHhlHhlHh.....',
  '......sSSSSSSs......',
  '.......sSSSSs.......',
  '........ssss........',
  '.....DDDDDDDDDD.....',
  '....DDDDDDDDDDDD....',
  '...DDDDDDDDDDDDDD...',
  '...DDDDDDDDDDDDDD...',
  '...SDDDDDDDDDDDDS...',
  '.....DDDDDDDDDD.....',
  '.....PPPPPPPPPP.....',
  '.....PPPPppPPPP.....',
];

const OMA_SIDE = [
  '....hlHHlHh.........',
  '..hlHhlHhlHhS.......',
  '.hHlhHlhHSSSSS......',
  '.hlHhlHhSSSSSSS.....',
  '.hHlhHlhSSSSbbSS....',
  '.hlHhlHeeSSgWEgS....',
  '.hHlhHlesSSSSSSSS...',
  '..hlHhlhSSSSSSSSSS..',
  '...hHlhSSSSSSSSNs...',
  '....hlSSSSSSrrSS....',
  '.....sSSSSSSSSS.....',
  '......sSSSSSSs......',
  '........sss.........',
  '.......DDDDD........',
  '......DDDDDDD.......',
  '......DDDDDDD.......',
  '......DDDdSSD.......',
  '......DDDDDDD.......',
  '......DDDDDDD.......',
  '.......PPPPP........',
  '.......PPPpP........',
];

const LEGS_FRONT = [
  ['.....PPPP..PPPP.....', '.....PPPP..PPPP.....', '....BBBBB..BBBBB....'],
  ['......PPP..PPPP.....', '......PPP..PPPP.....', '......BBB..BBBBB....'],
  ['.....PPPP..PPP......', '.....PPPP..PPP......', '....BBBBB..BBB......'],
];

const LEGS_SIDE = [
  ['.......PP.PP........', '.......PP.PP........', '.......BBB.BBB......'],
  ['......PP...PP.......', '......PP...PP.......', '.....BBB...BBB......'],
  ['........PPP.........', '........PPP.........', '........BBBB........'],
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
