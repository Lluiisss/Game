// Grundlegende Maße – alles in Bildschirmpixeln.
export const GAME_W = 960;
export const GAME_H = 736;

// Pixelart wird nativ klein gezeichnet und mit diesem Faktor hochskaliert.
export const PX = 2;

export const HUD_H = 64;

// Der Rasen (Spielfeld). Drumherum liegt der Garten (Hecke, Beete).
export const LAWN = {
  x: 64,
  y: HUD_H + 64,
  w: 832,
  h: 544,
};
LAWN.right = LAWN.x + LAWN.w;
LAWN.bottom = LAWN.y + LAWN.h;

export const FONT = '"VT323", monospace';
export const TITLE_FONT = '"Press Start 2P", monospace';

// Ab dieser "Hügellast" ist der Rasen ruiniert (normaler Hügel = 1, Boss-Hügel = 3).
export const MAX_HILL_LOAD = 45;

export const PLAYER_SPEED = 140;
