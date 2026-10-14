import Phaser from 'phaser';
import { GAME_W, GAME_H, FONT, TITLE_FONT } from '../config.js';
import { music } from '../audio/music.js';
import { VolumeSliders } from '../ui/VolumeSliders.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 110, 'PAUSE', {
        fontFamily: TITLE_FONT,
        fontSize: '40px',
        color: '#ffe14a',
        stroke: '#1e140d',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 40, 'P / ESC: weiterspielen     Q: aufgeben (zum Menü)', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#f3ead2',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, GAME_H / 2 + 20, 'Lautstärke  (↑ ↓ wählen, ← → ändern, oder mit der Maus)', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#c9b99a',
      })
      .setOrigin(0.5);
    this.sliders = new VolumeSliders(this, GAME_W / 2 - 190, GAME_H / 2 + 70);
    this.input.keyboard.on('keydown', (e) => this.sliders.handleKey(e));

    const resume = (e) => {
      if (e.repeat) return;
      this.scene.stop();
      this.scene.resume('Game');
    };
    this.input.keyboard.on('keydown-P', resume);
    this.input.keyboard.on('keydown-ESC', resume);
    this.input.keyboard.on('keydown-Q', () => {
      music.stop();
      this.scene.stop('Game');
      this.scene.start('Menu');
    });
  }
}
