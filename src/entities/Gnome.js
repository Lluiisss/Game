import { PX } from '../config.js';

export class Gnome {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.timer = 0.6;
    this.range = 130;
    this.sprite = scene.add.image(x, y, 'gnome').setOrigin(0.5, 1).setScale(0).setDepth(y);
    this.shadow = scene.add.image(x, y - 1, 'shadow').setScale(PX).setAlpha(0.3).setDepth(y - 40);
    scene.tweens.add({ targets: this.sprite, scale: PX, duration: 300, ease: 'Back.Out' });
  }

  update(dt, rateMult) {
    this.timer -= dt;
    if (this.timer > 0) return;
    const target = this.scene.findGnomeTarget(this);
    if (!target) {
      this.timer = 0.25;
      return;
    }
    this.timer = 2.0 / rateMult;
    this.scene.tweens.add({ targets: this.sprite, y: this.y - 8, duration: 90, yoyo: true, ease: 'Quad.Out' });
    this.scene.gnomeThrow(this, target);
  }
}
