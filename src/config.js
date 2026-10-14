// Grundlegende Maße – alles in Bildschirmpixeln.
export const GAME_W = 1088;
export const GAME_H = 832;

// Pixelart wird nativ klein gezeichnet und mit diesem Faktor hochskaliert.
export const PX = 2;

export const HUD_H = 88;

// Der Rasen (Spielfeld). Drumherum liegt der Garten mit Zaun, Bäumen und Beeten.
export const LAWN = {
  x: 128,
  y: HUD_H + 100,
  w: 832,
  h: 544,
};
LAWN.right = LAWN.x + LAWN.w;
LAWN.bottom = LAWN.y + LAWN.h;

export const FONT = '"VT323", monospace';
export const TITLE_FONT = '"Press Start 2P", monospace';

// Ab dieser "Hügellast" ist der Rasen ruiniert (normaler Hügel = 1, Boss-Hügel = 3).
export const MAX_HILL_LOAD = 55;

export const PLAYER_SPEED = 140;

// Plätze für Bienenstöcke im Garten (Bildschirmkoordinaten, Fußpunkt) –
// jedes Bienen-Upgrade bekommt einen eigenen
export const BEEHIVES = [
  { x: 1028, y: HUD_H + 346 },
  { x: 320, y: HUD_H + 76 },
  { x: 60, y: HUD_H + 626 },
  { x: 780, y: HUD_H + 76 },
  { x: 1032, y: HUD_H + 596 },
];

// Ab diesem Level kommt Oma zu Hilfe
export const OMA_LEVEL = 15;

// Omas Platz am Terrassentisch (Fußpunkt des Sprites, Bildschirmkoordinaten)
export const OMA_SEAT = { x: 260, y: HUD_H + 688 };
