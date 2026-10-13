import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, LAWN, FONT, TITLE_FONT } from '../config.js';
import { loadScores, formatTime } from '../systems/leaderboard.js';
import { sfx, toggleMute, isMuted } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import { addButterflies } from '../gfx/ambient.js';

const row = (rank, name, score, time) =>
  `${rank} ${String(name).padEnd(12, ' ').slice(0, 12)} ${String(score).padStart(7, ' ')}  ${String(time).padStart(5, ' ')}`;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.image(0, HUD_H, 'garden').setOrigin(0).setScale(PX);
    this.add.rectangle(0, 0, GAME_W, HUD_H, 0x3b2716).setOrigin(0);

    // Dekorative Maulwürfe, die im Hintergrund auftauchen
    this.decoTimer = this.time.addEvent({ delay: 900, loop: true, callback: () => this.decoMole() });

    addButterflies(this, 6);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0804, 0.35).setOrigin(0).setDepth(5);

    const title = this.add
      .text(GAME_W / 2, 112, 'MAULWURF-ALARM!', {
        fontFamily: TITLE_FONT,
        fontSize: '44px',
        color: '#ffe14a',
        stroke: '#1e140d',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: title, y: 118, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add
      .text(GAME_W / 2, 168, 'Opa verteidigt seinen Rasen', {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#f3ead2',
        stroke: '#1e140d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Opa + Rechen
    const opa = this.add.image(GAME_W / 2 - 40, 318, 'opa_down_0').setScale(PX * 2.5).setOrigin(0.5, 1).setDepth(10);
    this.add.image(GAME_W / 2 - 10, 304, 'w_rake').setScale(PX * 2.5).setOrigin(0.5, 1).setRotation(0.35).setDepth(9);
    this.add.image(GAME_W / 2 + 70, 320, 'hill_0').setScale(PX * 2.5).setOrigin(0.5, 1).setDepth(10);
    const mole = this.add.image(GAME_W / 2 + 70, 284, 'mole').setScale(PX * 2.5).setOrigin(0.5, 1).setDepth(10);
    this.tweens.add({ targets: mole, scaleY: PX * 2.3, duration: 500, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: opa, angle: 4, duration: 400, yoyo: true, repeat: -1 });
    const oma = this.add.image(GAME_W / 2 - 130, 318, 'oma_side_0').setScale(PX * 2.2).setOrigin(0.5, 1).setDepth(10);
    this.tweens.add({ targets: oma, y: 312, duration: 300, yoyo: true, repeat: -1 });
    this.add.image(GAME_W / 2 + 170, 318, 'w_scythe').setScale(PX * 2).setOrigin(0.5, 1).setRotation(-0.5).setDepth(10);

    this.panel(124, 340, 400, 410, 'SO GEHT\'S');
    const help = [
      'Pfeiltasten / WASD  laufen',
      'Opa haut automatisch zu!',
      'P / ESC  Pause    M  Ton',
      '',
      'Maulwürfe tauchen mit einem',
      'Hügel auf und wieder ab.',
      'Hau die Maulwürfe UND die',
      'Hügel weg! Ist der Rasen zu',
      'verhügelt: Game Over.',
      '',
      'Level-Up = Upgrades, später',
      'neue Gartengeräte und Helfer.',
      'Ab Level 15 hilft Oma mit.',
      'Achtung, Bosse!',
    ];
    this.add
      .text(144, 380, help.join('\n'), { fontFamily: FONT, fontSize: '25px', color: '#f3ead2', lineSpacing: 1 })
      .setDepth(10);

    this.panel(564, 340, 400, 410, 'BESTENLISTE');
    const scores = loadScores();
    if (!scores.length) {
      this.add
        .text(764, 520, 'Noch keine Einträge.\nSei der Erste!', {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#c9b99a',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(10);
    } else {
      this.add
        .text(584, 384, row(' #', 'Name', 'Punkte', 'Zeit'), { fontFamily: FONT, fontSize: '25px', color: '#9fe870' })
        .setDepth(10);
      scores.slice(0, 10).forEach((s, i) => {
        const line = row(String(i + 1).padStart(2, ' '), s.name, s.score, formatTime(s.time));
        this.add
          .text(584, 414 + i * 30, line, {
            fontFamily: FONT,
            fontSize: '25px',
            color: i === 0 ? '#ffe14a' : '#f3ead2',
          })
          .setDepth(10);
      });
    }

    const start = this.add
      .text(GAME_W / 2, 792, 'LEERTASTE / ENTER zum Starten', {
        fontFamily: TITLE_FONT,
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#1e140d',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.muteText = this.add
      .text(GAME_W - 12, 8, '', { fontFamily: FONT, fontSize: '22px', color: '#c9b99a' })
      .setOrigin(1, 0)
      .setDepth(10);
    this.updateMuteText();

    this.add
      .text(12, 8, 'Highscores werden lokal im Browser gespeichert', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#8a7a5a',
      })
      .setDepth(10);

    music.play('menu');
    this.events.once('shutdown', () => music.stop());

    const go = (e) => {
      if (e && e.repeat) return;
      sfx.unlock();
      sfx.select();
      this.scene.start('Game');
    };
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.keyboard.on('keydown-M', () => {
      toggleMute();
      this.updateMuteText();
    });
    this.input.once('pointerdown', () => go());
  }

  updateMuteText() {
    this.muteText.setText(`M: Ton ${isMuted() ? 'aus' : 'an'}`);
  }

  panel(x, y, w, h, title) {
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x1e140d, 0.6).fillRoundedRect(x + 4, y + 6, w, h, 10);
    g.fillStyle(0x3b2716, 0.92).fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(3, 0x6e4a26, 1).strokeRoundedRect(x, y, w, h, 10);
    this.add
      .text(x + w / 2, y + 22, title, { fontFamily: TITLE_FONT, fontSize: '16px', color: '#ffe14a' })
      .setOrigin(0.5)
      .setDepth(10);
  }

  decoMole() {
    const x = Phaser.Math.Between(LAWN.x + 30, LAWN.right - 30);
    const y = Phaser.Math.Between(LAWN.y + 30, LAWN.bottom - 10);
    const hill = this.add.image(x, y, `hill_${Phaser.Math.Between(0, 2)}`).setOrigin(0.5, 1).setScale(0).setDepth(1);
    const mole = this.add
      .image(x, y - 14, Phaser.Math.RND.pick(['mole', 'mole', 'mole_chill', 'mole_fast']))
      .setOrigin(0.5, 1)
      .setScale(PX, 0)
      .setDepth(2);
    this.tweens.add({ targets: hill, scale: PX, duration: 250, ease: 'Back.Out' });
    this.tweens.add({
      targets: mole,
      scaleY: PX,
      duration: 250,
      delay: 150,
      hold: 1400,
      yoyo: true,
      onComplete: () => {
        mole.destroy();
        this.tweens.add({ targets: hill, alpha: 0, delay: 800, duration: 600, onComplete: () => hill.destroy() });
      },
    });
  }
}
