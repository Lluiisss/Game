import Phaser from 'phaser';
import { GAME_W, GAME_H, FONT, TITLE_FONT } from '../config.js';
import { sfx } from '../audio/sfx.js';

// Große Ankündigung, wenn Oma freigeschaltet wird.
export class OmaIntroScene extends Phaser.Scene {
  constructor() {
    super('OmaIntro');
  }

  create() {
    this.done = false;
    this.ready = false;
    const bg = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1a0508, 0).setOrigin(0);
    this.tweens.add({ targets: bg, fillAlpha: 0.8, duration: 300 });

    // Strahlenkranz hinter Oma
    const rays = this.add.graphics({ x: GAME_W / 2, y: GAME_H / 2 - 30 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      rays.fillStyle(i % 2 ? 0xff6a6a : 0xffcf6a, 0.25);
      rays.slice(0, 0, 420, a, a + Math.PI / 16, false);
      rays.fillPath();
    }
    this.tweens.add({ targets: rays, angle: 360, duration: 14000, repeat: -1 });

    const title = this.add
      .text(GAME_W / 2, 150, 'OMA KOMMT ZU HILFE!', {
        fontFamily: TITLE_FONT,
        fontSize: '40px',
        color: '#ff8a8a',
        stroke: '#1e140d',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScale(0.2);
    this.tweens.add({ targets: title, scale: 1, duration: 500, ease: 'Back.Out' });

    const oma = this.add.image(GAME_W + 120, GAME_H / 2 + 60, 'oma_side_0').setOrigin(0.5, 1).setScale(9).setFlipX(true);
    let f = 0;
    const walk = this.time.addEvent({
      delay: 110,
      loop: true,
      callback: () => {
        f = (f + 1) % 4;
        oma.setTexture(`oma_side_${[1, 0, 2, 0][f]}`);
      },
    });
    this.tweens.add({
      targets: oma,
      x: GAME_W / 2,
      duration: 900,
      ease: 'Quad.Out',
      onComplete: () => {
        walk.remove();
        oma.setTexture('oma_down_0').setFlipX(false);
        const pan = this.add.image(oma.x + 70, oma.y - 60, 'w_pan').setOrigin(0.5, 1).setScale(8).setRotation(0.5);
        this.tweens.add({ targets: pan, rotation: -0.3, duration: 260, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: oma, scaleY: 9.6, duration: 260, yoyo: true, repeat: -1 });
      },
    });

    const lines = [
      'Oma hat genug von den Maulwürfen in ihrem Garten!',
      'Sie läuft ab jetzt selbstständig über den Rasen',
      'und haut die Maulwürfe mit ihrer Bratpfanne weg!',
      'Mit jedem Level wird sie ein bisschen stärker.',
    ];
    const text = this.add
      .text(GAME_W / 2, GAME_H / 2 + 110, lines.join('\n'), {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        align: 'center',
        stroke: '#1e140d',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, delay: 700, duration: 400 });

    const hint = this.add
      .text(GAME_W / 2, GAME_H - 60, 'LEERTASTE / ENTER: Weiter', {
        fontFamily: TITLE_FONT,
        fontSize: '16px',
        color: '#ffcf6a',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    sfx.oma();
    this.time.delayedCall(900, () => {
      this.ready = true;
      hint.setAlpha(1);
      this.tweens.add({ targets: hint, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    });
    this.time.delayedCall(9000, () => this.close());

    this.input.keyboard.on('keydown', (e) => {
      if (e.repeat || !this.ready) return;
      if (e.code === 'Space' || e.code === 'Enter') this.close();
    });
    this.input.on('pointerdown', () => {
      if (this.ready) this.close();
    });
  }

  close() {
    if (this.done) return;
    this.done = true;
    this.scene.stop();
    this.scene.resume('Game');
  }
}
