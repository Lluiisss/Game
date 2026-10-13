import Phaser from 'phaser';
import { PX } from '../config.js';

export class Hill {
  constructor(scene, x, y, boss, hp) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.boss = boss;
    this.maxHp = hp;
    this.hp = hp;
    this.weight = boss ? 3 : 1;
    this.mole = null;
    this.removed = false;
    this.age = 0;

    const key = boss ? 'hill_boss' : `hill_${Phaser.Math.Between(0, 2)}`;
    this.img = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y).setScale(0);
    const f = this.img.frame;
    this.w = f.width * PX;
    this.h = f.height * PX;
    this.radius = this.w * 0.5;
    // Das Loch oben auf dem Hügel – hier kommt der Maulwurf raus.
    this.holeY = y - this.h + 4.5 * PX;

    scene.tweens.add({ targets: this.img, scale: PX, duration: 260, ease: 'Back.Out' });
  }

  get hitX() {
    return this.x;
  }

  get hitY() {
    return this.y - this.h * 0.45;
  }

  destroy() {
    this.removed = true;
    this.img.destroy();
  }
}
