import Phaser from 'phaser';
import { GAME_W, GAME_H, FONT, TITLE_FONT } from '../config.js';
import { music } from '../audio/music.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 40, 'PAUSE', {
        fontFamily: TITLE_FONT,
        fontSize: '40px',
        color: '#ffe14a',
        stroke: '#1e140d',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, GAME_H / 2 + 30, 'P / ESC: weiterspielen     Q: aufgeben (zum Menü)', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#f3ead2',
      })
      .setOrigin(0.5);

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
