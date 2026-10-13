import Phaser from 'phaser';
import { PX, LAWN } from '../config.js';
import { sfx } from '../audio/sfx.js';

const dist = Phaser.Math.Distance.Between;

// ---------------------------------------------------------------- Gartenzwerg

export class Gnome {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.timer = 0.4;
    this.range = 175;
    this.sprite = scene.add.image(x, y, 'gnome').setOrigin(0.5, 1).setScale(0).setDepth(y);
    this.shadow = scene.add.image(x, y - 1, 'shadow').setScale(PX).setAlpha(0.3).setDepth(-400);
    scene.tweens.add({ targets: this.sprite, scale: PX, duration: 300, ease: 'Back.Out' });
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer > 0) return true;
    const target = this.scene.nearestTarget(this.x, this.y - 12, this.range);
    if (!target) {
      this.timer = 0.2;
      return true;
    }
    this.timer = 1.2 / this.scene.attackRateMult;
    this.scene.tweens.add({ targets: this.sprite, y: this.y - 8, duration: 90, yoyo: true, ease: 'Quad.Out' });
    const stone = this.scene.add.image(this.x, this.y - 22, 'stone').setScale(PX * 1.3).setDepth(8400);
    sfx.gnome();
    this.scene.tweens.add({
      targets: stone,
      x: target.x,
      y: target.y,
      angle: 360,
      duration: 200,
      onComplete: () => {
        stone.destroy();
        this.scene.hit(target, this.scene.attackDamage * 1.1, { quiet: true, small: true });
      },
    });
    return true;
  }
}

// ---------------------------------------------------------------- Biene

export class Bee {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.life = 7;
    this.stings = 2;
    this.target = null;
    this.t = Math.random() * 10;
    this.sprite = scene.add.image(x, y, 'bee').setScale(PX * 1.5).setDepth(8700);
  }

  update(dt) {
    this.life -= dt;
    this.t += dt;
    if (this.life <= 0 || this.stings <= 0) {
      this.sprite.destroy();
      return false;
    }
    if (!this.target || !this.scene.targetAlive(this.target)) {
      this.target = this.scene.randomMoleTarget() || this.scene.nearestTarget(this.x, this.y, 2000);
    }
    let tx = LAWN.x + LAWN.w / 2;
    let ty = LAWN.y + 40;
    if (this.target) {
      tx = this.target.obj.hitX;
      ty = this.target.obj.hitY;
    }
    const a = Math.atan2(ty - this.y, tx - this.x) + Math.sin(this.t * 9) * 0.6;
    const sp = 240;
    this.x += Math.cos(a) * sp * dt;
    this.y += Math.sin(a) * sp * dt;
    this.sprite.setPosition(this.x, this.y).setFlipX(Math.cos(a) < 0);
    if (this.target && dist(this.x, this.y, tx, ty) < 14) {
      this.scene.hit(this.target, Math.max(5, this.scene.attackDamage * 0.5), { quiet: true, small: true, hillFactor: 0.5 });
      this.stings -= 1;
      this.target = null;
      this.x += Phaser.Math.Between(-30, 30);
      this.y -= 25;
      if (Math.random() < 0.3) sfx.buzz();
    }
    return true;
  }
}

// ---------------------------------------------------------------- Igel

export class Hedgehog {
  constructor(scene, level) {
    this.scene = scene;
    const target = scene.randomMoleTarget() || scene.nearestTarget(LAWN.x + LAWN.w / 2, LAWN.y + LAWN.h / 2, 2000);
    const ty = target ? target.y + 4 : Phaser.Math.Between(LAWN.y + 40, LAWN.bottom - 20);
    const fromLeft = target ? target.x > LAWN.x + LAWN.w / 2 : Math.random() < 0.5;
    this.x = fromLeft ? LAWN.x - 10 : LAWN.right + 10;
    this.y = ty;
    this.vx = (fromLeft ? 1 : -1) * 430;
    this.dmg = scene.attackDamage * (1.6 + 0.4 * (level - 1));
    this.hitSet = new Set();
    this.sprite = scene.add.image(this.x, this.y, 'hedgehog').setScale(PX * 1.3).setDepth(8650);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.sprite.setPosition(this.x, this.y).setDepth(this.y + 1);
    this.sprite.rotation += (this.vx > 0 ? 1 : -1) * dt * 16;
    for (const t of this.scene.targetsNear(this.x, this.y - 6, 26)) {
      if (this.hitSet.has(t.obj)) continue;
      this.hitSet.add(t.obj);
      this.scene.hit(t, this.dmg, { quiet: false, hillFactor: 1.5 });
      this.scene.grassFx.explode(4, this.x, this.y);
    }
    if (this.x < LAWN.x - 30 || this.x > LAWN.right + 30) {
      this.sprite.destroy();
      return false;
    }
    return true;
  }
}

// ---------------------------------------------------------------- Mähroboter

export class Mower {
  constructor(scene) {
    this.scene = scene;
    this.x = Phaser.Math.Between(LAWN.x + 60, LAWN.right - 60);
    this.y = Phaser.Math.Between(LAWN.y + 60, LAWN.bottom - 40);
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 95;
    this.tick = 0;
    this.turnT = 2;
    this.sprite = scene.add.image(this.x, this.y, 'mower').setScale(PX).setDepth(this.y);
    this.shadow = scene.add.image(this.x, this.y + 8, 'shadow').setScale(PX * 1.4, PX).setAlpha(0.25).setDepth(-400);
  }

  update(dt) {
    this.turnT -= dt;
    if (this.turnT <= 0) {
      this.turnT = Phaser.Math.FloatBetween(1.5, 3);
      // Zum nächsten Hügel lenken
      const t = this.scene.nearestTarget(this.x, this.y, 400, { hillsFirst: true });
      this.angle = t ? Math.atan2(t.y - this.y, t.x - this.x) + Phaser.Math.FloatBetween(-0.3, 0.3) : Math.random() * Math.PI * 2;
    }
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    if (this.x < LAWN.x + 20 || this.x > LAWN.right - 20) {
      this.angle = Math.PI - this.angle;
      this.x = Phaser.Math.Clamp(this.x, LAWN.x + 20, LAWN.right - 20);
    }
    if (this.y < LAWN.y + 20 || this.y > LAWN.bottom - 12) {
      this.angle = -this.angle;
      this.y = Phaser.Math.Clamp(this.y, LAWN.y + 20, LAWN.bottom - 12);
    }
    this.sprite.setPosition(this.x, this.y).setRotation(this.angle + Math.PI / 2).setDepth(this.y);
    this.shadow.setPosition(this.x, this.y + 10);
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.25;
      const near = this.scene.targetsNear(this.x, this.y, 30);
      for (const t of near) this.scene.hit(t, this.scene.attackDamage * 0.55, { quiet: true, noText: true, hillFactor: 2 });
      if (near.length) this.scene.grassFx.explode(3, this.x, this.y);
    }
    return true;
  }
}

// ---------------------------------------------------------------- Regenwolke

export class Cloud {
  constructor(scene) {
    this.scene = scene;
    this.x = Phaser.Math.Between(LAWN.x + 80, LAWN.right - 80);
    this.y = Phaser.Math.Between(LAWN.y + 80, LAWN.bottom - 60);
    this.radius = 70;
    this.tick = 0;
    this.retarget = 0;
    this.tx = this.x;
    this.ty = this.y;
    this.shadow = scene.add.ellipse(this.x, this.y, this.radius * 2, this.radius * 0.9, 0x1a3a5a, 0.18).setDepth(-300);
    this.sprite = scene.add.image(this.x, this.y - 70, 'cloud').setScale(PX * 1.6).setDepth(8800).setAlpha(0.92);
  }

  update(dt) {
    this.retarget -= dt;
    if (this.retarget <= 0) {
      this.retarget = 3;
      const t = this.scene.densestSpot();
      if (t) {
        this.tx = t.x;
        this.ty = t.y;
      }
    }
    const a = Math.atan2(this.ty - this.y, this.tx - this.x);
    if (dist(this.x, this.y, this.tx, this.ty) > 6) {
      this.x += Math.cos(a) * 70 * dt;
      this.y += Math.sin(a) * 70 * dt;
    }
    this.sprite.setPosition(this.x, this.y - 70 + Math.sin(this.scene.elapsed * 2) * 3);
    this.shadow.setPosition(this.x, this.y);
    this.scene.rainFx.emitParticleAt(this.x + Phaser.Math.Between(-55, 55), this.y - 62);
    this.tick -= dt;
    if (this.tick <= 0) {
      this.tick = 0.4;
      for (const t of this.scene.targetsNear(this.x, this.y, this.radius)) {
        this.scene.hit(t, this.scene.attackDamage * 0.3, { quiet: true, noText: true, hillFactor: 1.6 });
      }
    }
    return true;
  }
}

// ---------------------------------------------------------------- Oma

const WALK = [1, 0, 2, 0];

export class Oma {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.dir = 'down';
    this.walkT = 0;
    this.cd = 0;
    this.target = null;
    this.retarget = 0;
    // Zuerst durch das Gartentor auf den Rasen laufen
    this.entering = true;
    this.enterY = LAWN.y + 50;
    this.shadow = scene.add.image(x, y, 'shadow').setScale(PX * 1.3, PX).setAlpha(0.3).setDepth(-400);
    this.sprite = scene.add.image(x, y, 'oma_down_0').setOrigin(0.5, 1).setScale(PX);
    this.label = scene.add
      .text(x, y, 'Oma', { fontFamily: scene.fontFamily, fontSize: '16px', color: '#e8c7ff', stroke: '#1e140d', strokeThickness: 3 })
      .setOrigin(0.5, 1);
  }

  // Wächst mit Opas Level, bleibt aber deutlich schwächer als Opa
  get damage() {
    return 4 + 1.2 * this.scene.level;
  }

  get speed() {
    return 105 + Math.min(45, this.scene.level * 1.2);
  }

  update(dt) {
    if (this.entering) {
      this.y += 90 * dt;
      this.walkT += dt;
      this.dir = 'down';
      if (this.y >= this.enterY) this.entering = false;
      this.render(true);
      return true;
    }
    this.retarget -= dt;
    if (!this.target || !this.scene.targetAlive(this.target) || this.retarget <= 0) {
      this.retarget = 1.2;
      this.target = this.scene.nearestTarget(this.x, this.y - 14, 2000, { molePriority: 120 });
    }
    let moving = false;
    if (this.target) {
      const tx = this.target.obj.hitX;
      const ty = this.target.obj.hitY;
      const dx = tx - this.x;
      const dy = ty - (this.y - 14);
      const d = Math.hypot(dx, dy);
      const reach = 34 + this.target.r;
      if (d > reach) {
        moving = true;
        const sp = this.speed;
        this.x = Phaser.Math.Clamp(this.x + (dx / d) * sp * dt, LAWN.x + 14, LAWN.right - 14);
        this.y = Phaser.Math.Clamp(this.y + (dy / d) * sp * dt, LAWN.y + 26, LAWN.bottom - 4);
        if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
        else this.dir = dy > 0 ? 'down' : 'up';
        this.walkT += dt;
      }
      this.cd -= dt;
      if (d <= reach + 4 && this.cd <= 0) {
        this.cd = 0.8;
        this.swing(Math.atan2(dy, dx));
        this.scene.hit(this.target, this.damage, { small: true, quiet: true, hillFactor: 1.2 });
      }
    }
    this.render(moving);
    return true;
  }

  render(moving) {
    const f = moving ? WALK[Math.floor(this.walkT * 9) % 4] : 0;
    const side = this.dir === 'left' || this.dir === 'right';
    this.sprite.setTexture(side ? `oma_side_${f}` : `oma_${this.dir}_${f}`).setFlipX(this.dir === 'left');
    this.sprite.setPosition(this.x, this.y).setDepth(this.y);
    this.shadow.setPosition(this.x, this.y - 2);
    this.label.setPosition(this.x, this.y - 38).setDepth(this.y + 2);
  }

  swing(ang) {
    const g = this.scene.add.graphics().setDepth(8200);
    g.fillStyle(0xe8c7ff, 0.3);
    g.slice(this.x, this.y - 14, 40, ang - 0.9, ang + 0.9, false);
    g.fillPath();
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
    this.scene.tweens.add({ targets: this.sprite, angle: { from: -12, to: 0 }, duration: 160 });
  }
}
