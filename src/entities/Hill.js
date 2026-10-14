import Phaser from 'phaser';
import { PX } from '../config.js';

export class Hill {
  // size: 1 = normal, < 1 kleine Hügel (Babys, Buddler), > 1 Riesenhügel (Gigamaulwurf)
  constructor(scene, x, y, boss, hp, size = 1) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.boss = boss;
    this.maxHp = hp;
    this.hp = hp;
    this.weight = size > 1 ? 6 : boss ? 3 : size < 1 ? 0.5 : 1;
    const scale = PX * size;
    this.mole = null;
    this.removed = false;
    this.age = 0;

    const key = boss ? 'hill_boss' : `hill_${Phaser.Math.Between(0, 2)}`;
    this.img = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y).setScale(0);
    const f = this.img.frame;
    this.w = f.width * scale;
    this.h = f.height * scale;
    this.radius = this.w * 0.5;
    // Das Loch oben auf dem Hügel – hier kommt der Maulwurf raus.
    this.holeY = y - this.h + 4.5 * scale;

    scene.tweens.add({ targets: this.img, scale, duration: 260, ease: 'Back.Out' });
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
