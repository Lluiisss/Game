import Phaser from 'phaser';
import '@fontsource/vt323';
import '@fontsource/press-start-2p';
import { GAME_W, GAME_H } from './config.js';
import { sfx } from './audio/sfx.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { LevelUpScene } from './scenes/LevelUpScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { OmaIntroScene } from './scenes/OmaIntroScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#1a120b',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, LevelUpScene, PauseScene, GameOverScene, OmaIntroScene],
};

// Pixel-Schriften laden, bevor Phaser Texte rendert.
async function loadFonts() {
  if (!document.fonts) return;
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  await Promise.race([
    Promise.all([document.fonts.load('24px "VT323"'), document.fonts.load('16px "Press Start 2P"')]),
    timeout,
  ]).catch(() => {});
}

// Browser erlauben Ton erst nach der ersten Eingabe
const unlock = () => sfx.unlock();
window.addEventListener('keydown', unlock, { once: true });
window.addEventListener('pointerdown', unlock, { once: true });

loadFonts().then(() => {
  window.game = new Phaser.Game(config);
});
