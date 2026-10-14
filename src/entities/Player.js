import { PX, LAWN, PLAYER_SPEED } from '../config.js';

const WALK_CYCLE = [1, 0, 2, 0];

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.facing = Math.PI / 2;
    this.dir = 'down';
    this.walkT = 0;
    this.moving = false;
    this.swinging = false;
    this.swingAngle = 0;

    this.shadow = scene.add.image(x, y, 'shadow').setScale(PX * 1.3, PX).setAlpha(0.3);
    this.sprite = scene.add.image(x, y, 'opa_down_0').setOrigin(0.5, 1).setScale(PX);
    this.tool = scene.add.image(x, y, 'w_rake').setOrigin(0.5, 1).setScale(PX);
  }

  setWeapon(weapon) {
    this.tool.setTexture(weapon.tex);
  }

  update(dt, input, stats) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      const speed = PLAYER_SPEED * stats.speedMult;
      this.x = Math.min(LAWN.right - 14, Math.max(LAWN.x + 14, this.x + dx * speed * dt));
      this.y = Math.min(LAWN.bottom - 4, Math.max(LAWN.y + 26, this.y + dy * speed * dt));
      this.facing = Math.atan2(dy, dx);
      if (Math.abs(dx) > Math.abs(dy) + 0.01) this.dir = dx > 0 ? 'right' : 'left';
      else this.dir = dy > 0 ? 'down' : 'up';
      this.walkT += dt * stats.speedMult;
    } else {
      this.walkT = 0;
    }
    this.x = Math.min(LAWN.right - 14, Math.max(LAWN.x + 14, this.x));
    this.y = Math.min(LAWN.bottom - 4, Math.max(LAWN.y + 26, this.y));
    this.render();
  }

  render() {
    const frame = this.moving ? WALK_CYCLE[Math.floor(this.walkT * 9) % 4] : 0;
    const side = this.dir === 'left' || this.dir === 'right';
    this.sprite.setTexture(side ? `opa_side_${frame}` : `opa_${this.dir}_${frame}`);
    this.sprite.setFlipX(this.dir === 'left');
    const bob = this.moving && frame !== 0 ? -PX : 0;
    this.sprite.setPosition(this.x, this.y + bob).setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 2).setDepth(this.y - 40);

    if (!this.swinging) {
      // Gerät locker in der Hand halten
      const t = this.tool;
      t.setScale(PX);
      switch (this.dir) {
        case 'down':
          t.setPosition(this.x + 12, this.y - 9 + bob).setRotation(0.35).setDepth(this.y + 1);
          break;
        case 'up':
          t.setPosition(this.x - 12, this.y - 9 + bob).setRotation(-0.35).setDepth(this.y - 1);
          break;
        case 'right':
          t.setPosition(this.x + 6, this.y - 9 + bob).setRotation(0.6).setDepth(this.y + 1);
          break;
        default:
          t.setPosition(this.x - 6, this.y - 9 + bob).setRotation(-0.6).setDepth(this.y + 1);
      }
    }
  }

  // Mittelpunkt des Oberkörpers – von hier aus wird geschlagen.
  get cx() {
    return this.x;
  }

  get cy() {
    return this.y - 15;
  }
}
