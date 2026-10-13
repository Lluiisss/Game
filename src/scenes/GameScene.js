import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, LAWN, FONT, TITLE_FONT, MAX_HILL_LOAD } from '../config.js';
import * as D from '../difficulty.js';
import { WEAPONS, TYPE_LABEL } from '../data/weapons.js';
import { rollChoices } from '../data/upgrades.js';
import { sfx, toggleMute } from '../audio/sfx.js';
import { formatTime } from '../systems/leaderboard.js';
import { Player } from '../entities/Player.js';
import { Mole } from '../entities/Mole.js';
import { Hill } from '../entities/Hill.js';
import { Gnome } from '../entities/Gnome.js';

const DIRT_TINTS = [0x6c4220, 0x87552a, 0x523117, 0xa16b37];
const GRASS_TINTS = [0x5fa83d, 0x7cc255, 0x43892a];

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.add.image(0, HUD_H, 'garden').setOrigin(0).setScale(PX).setDepth(-1000);

    this.stats = {
      dmgMult: 1,
      rateMult: 1,
      rangeMult: 1,
      speedMult: 1,
      arcBonus: 0,
      hillMult: 1,
      crit: 0,
      xpMult: 1,
      upMult: 1,
      seeds: 0,
      sprinkler: 0,
      gnomes: 0,
    };
    this.upgradeLevels = {};
    this.weapon = WEAPONS.rake;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = D.xpForLevel(1);
    this.levelsSinceWeaponOffer = 0;
    this.pendingLevelUps = 0;

    this.elapsed = 0;
    this.kills = 0;
    this.bossKills = 0;
    this.hillsRemoved = 0;
    this.damageDealt = 0;
    this.lastHitDamage = 0;

    this.moles = [];
    this.hills = [];
    this.gnomes = [];

    this.attackCd = 0;
    this.spawnTimer = 2.5;
    this.bossTimer = D.FIRST_BOSS;
    this.sprinklerTimer = 3;
    this.warnTimer = 0;
    this.isOver = false;

    this.player = new Player(this, LAWN.x + LAWN.w / 2, LAWN.y + LAWN.h / 2 + 20);
    this.bars = this.add.graphics().setDepth(9000);

    this.createParticles();
    this.createHud();

    this.keys = this.input.keyboard.addKeys({
      up: 'UP',
      down: 'DOWN',
      left: 'LEFT',
      right: 'RIGHT',
      w: 'W',
      a: 'A',
      s: 'S',
      d: 'D',
      space: 'SPACE',
    });
    this.input.keyboard.on('keydown-P', () => this.pauseGame());
    this.input.keyboard.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard.on('keydown-M', () => {
      const m = toggleMute();
      this.floatText(GAME_W / 2, HUD_H + 40, m ? 'Ton aus' : 'Ton an', '#ffffff', 24);
    });
    const onResume = () => this.input.keyboard.resetKeys();
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => this.events.off('resume', onResume));

    // Die ersten Maulwürfe
    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 1.0));
    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 2.6));

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.banner('Los geht\'s, Opa!', '#ffe14a');
  }

  // ------------------------------------------------------------------ Setup

  createParticles() {
    const base = {
      lifespan: { min: 350, max: 650 },
      speed: { min: 50, max: 150 },
      angle: { min: 200, max: 340 },
      gravityY: 380,
      scale: { start: 1.8, end: 0.6 },
      emitting: false,
    };
    this.dirtFx = this.add.particles(0, 0, 'px', { ...base, tint: DIRT_TINTS }).setDepth(8500);
    this.grassFx = this.add
      .particles(0, 0, 'px', { ...base, tint: GRASS_TINTS, speed: { min: 60, max: 180 }, angle: { min: 0, max: 360 } })
      .setDepth(8500);
    this.waterFx = this.add
      .particles(0, 0, 'drop', {
        lifespan: { min: 250, max: 450 },
        speed: { min: 40, max: 120 },
        angle: { min: 0, max: 360 },
        gravityY: 200,
        scale: { start: PX, end: 0.5 },
        alpha: { start: 1, end: 0 },
        emitting: false,
      })
      .setDepth(8500);
    this.starFx = this.add
      .particles(0, 0, 'star', {
        lifespan: 600,
        speed: { min: 60, max: 140 },
        angle: { min: 0, max: 360 },
        scale: { start: PX, end: 0 },
        rotate: { min: 0, max: 360 },
        emitting: false,
      })
      .setDepth(8600);
  }

  createHud() {
    const g = this.add.graphics().setDepth(9500);
    g.fillStyle(0x3b2716, 1).fillRect(0, 0, GAME_W, HUD_H);
    g.fillStyle(0x4d3420, 1).fillRect(0, 0, GAME_W, 4);
    g.fillStyle(0x24170c, 1).fillRect(0, HUD_H - 4, GAME_W, 4);
    for (let x = 0; x < GAME_W; x += 120) g.fillStyle(0x33210f, 1).fillRect(x, 4, 2, HUD_H - 8);
    // Untere Infotafel
    g.fillStyle(0x24170c, 0.85).fillRect(40, GAME_H - 44, GAME_W - 80, 34);
    g.lineStyle(2, 0x6e4a26, 1).strokeRect(40, GAME_H - 44, GAME_W - 80, 34);

    const t = (x, y, size, color = '#f3ead2') =>
      this.add.text(x, y, '', { fontFamily: FONT, fontSize: `${size}px`, color }).setDepth(9600);

    this.hudTime = t(16, 4, 30, '#ffe14a');
    this.hudLevel = t(150, 4, 30, '#9fe870');
    this.hudXpBar = this.add.graphics().setDepth(9600);
    this.hudXpText = t(250, 8, 20);
    this.hudLoadLabel = t(492, 6, 24);
    this.hudLoadBar = this.add.graphics().setDepth(9600);
    this.hudLoadText = t(872, 4, 30);
    this.hudLine2 = t(16, 34, 22);
    this.hudStats = t(GAME_W / 2, GAME_H - 40, 21, '#f3ead2').setOrigin(0.5, 0);
  }

  // ------------------------------------------------------------------ Loop

  update(time, deltaMs) {
    if (this.isOver) return;
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.elapsed += dt;

    const k = this.keys;
    const input = {
      left: k.left.isDown || k.a.isDown,
      right: k.right.isDown || k.d.isDown,
      up: k.up.isDown || k.w.isDown,
      down: k.down.isDown || k.s.isDown,
    };
    this.player.update(dt, input, this.stats);

    this.attackCd -= dt;
    if (k.space.isDown && this.attackCd <= 0) {
      this.attackCd = this.weapon.cooldown / this.stats.rateMult;
      this.performAttack();
    }

    this.updateSpawning(dt);

    const upMult = D.upTimeMult(this.elapsed) * this.stats.upMult;
    for (const m of this.moles) m.update(dt, upMult);
    this.moles = this.moles.filter((m) => !m.dead);

    for (const gn of this.gnomes) gn.update(dt, this.stats.rateMult);

    if (this.stats.seeds > 0) {
      const dmg = 1.5 * this.stats.seeds * dt;
      for (const h of this.hills) {
        if (!h.mole) this.damageHill(h, dmg, { silent: true });
      }
    }

    if (this.stats.sprinkler > 0) {
      this.sprinklerTimer -= dt;
      if (this.sprinklerTimer <= 0) {
        this.sprinklerTimer = 3;
        this.sprinkle();
      }
    }

    this.hills = this.hills.filter((h) => !h.removed);
    for (const h of this.hills) h.age += dt;

    const load = this.hillLoad();
    if (load >= MAX_HILL_LOAD) {
      this.gameOver();
      return;
    }
    if (load / MAX_HILL_LOAD >= 0.75) {
      this.warnTimer -= dt;
      if (this.warnTimer <= 0) {
        this.warnTimer = 2.5;
        sfx.warning();
      }
    }

    this.drawBars();
    this.updateHud(load);

    if (this.pendingLevelUps > 0) this.openLevelUp();
  }

  updateSpawning(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = D.spawnInterval(this.elapsed);
      const normalAlive = this.moles.filter((m) => !m.boss).length;
      if (normalAlive < D.maxMoles(this.elapsed)) {
        const kind = D.rollKind(this.elapsed);
        const hp = Math.round(D.moleHp(this.elapsed) * (kind === 'fast' ? 0.6 : kind === 'chill' ? 1.2 : 1));
        this.moles.push(new Mole(this, kind, hp, Phaser.Math.FloatBetween(0.2, 1.0)));
      }
    }
    this.bossTimer -= dt;
    if (this.bossTimer <= 0) {
      this.bossTimer = D.bossInterval(this.elapsed);
      this.moles.push(new Mole(this, 'boss', D.moleHp(this.elapsed) * 8, 1.5));
      this.banner('BOSS-MAULWURF!', '#ff5a4a');
      sfx.boss();
      this.cameras.main.shake(300, 0.004);
    }
  }

  hillLoad() {
    let load = 0;
    for (const h of this.hills) load += h.weight;
    return load;
  }

  // ------------------------------------------------------------------ Maulwürfe & Hügel

  findSpawnPos(boss) {
    const margin = boss ? 40 : 26;
    const p = this.player;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 30; i++) {
        const x = Phaser.Math.Between(LAWN.x + margin, LAWN.right - margin);
        const y = Phaser.Math.Between(LAWN.y + (boss ? 60 : 40), LAWN.bottom - 8);
        if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < (boss ? 110 : 70)) continue;
        let ok = true;
        for (const h of this.hills) {
          const minD = pass === 0 ? h.radius + (boss ? 30 : 18) : h.mole ? h.radius + 20 : 6;
          if (Phaser.Math.Distance.Between(x, y, h.x, h.y) < minD) {
            ok = false;
            break;
          }
        }
        if (ok) return { x, y };
      }
    }
    return {
      x: Phaser.Math.Between(LAWN.x + margin, LAWN.right - margin),
      y: Phaser.Math.Between(LAWN.y + 60, LAWN.bottom - 8),
    };
  }

  moleWantsToEmerge(mole) {
    const pos = this.findSpawnPos(mole.boss);
    const hpBase = D.hillHp(this.elapsed);
    const hill = new Hill(this, pos.x, pos.y, mole.boss, mole.boss ? hpBase * 4 : hpBase);
    this.hills.push(hill);
    mole.emerge(hill);
    this.dirtFx.explode(mole.boss ? 22 : 10, pos.x, hill.holeY);
    sfx.pop();
  }

  onMoleDive(mole) {
    this.dirtFx.explode(5, mole.hill.x, mole.hill.holeY);
    sfx.dive();
  }

  collectTargets() {
    const list = [];
    for (const m of this.moles) {
      if (m.hittable) list.push({ kind: 'mole', obj: m, x: m.hitX, y: m.hitY, r: m.radius });
    }
    for (const h of this.hills) {
      // Ein Hügel, auf dem gerade ein Maulwurf sitzt, ist geschützt.
      if (!h.removed && !(h.mole && h.mole.hittable)) {
        list.push({ kind: 'hill', obj: h, x: h.hitX, y: h.hitY, r: h.radius });
      }
    }
    return list;
  }

  // ------------------------------------------------------------------ Kampf

  get attackDamage() {
    return this.weapon.damage * this.stats.dmgMult;
  }

  performAttack() {
    const w = this.weapon;
    const st = this.stats;
    const p = this.player;
    const ox = p.cx;
    const oy = p.cy;
    const ang = p.facing;
    const range = w.range * st.rangeMult;
    const targets = this.collectTargets();
    const hits = [];

    if (w.type === 'swing') {
      const arc = Phaser.Math.DegToRad(Math.min(360, w.arc + st.arcBonus));
      for (const t of targets) {
        const d = Phaser.Math.Distance.Between(ox, oy, t.x, t.y);
        if (d - t.r > range) continue;
        const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(t.y - oy, t.x - ox) - ang));
        if (diff <= arc / 2 || d < t.r + 10) hits.push(t);
      }
      this.swingFx(ang, arc, range);
      sfx.swing();
    } else if (w.type === 'spin') {
      for (const t of targets) {
        if (Phaser.Math.Distance.Between(ox, oy, t.x, t.y) - t.r <= range) hits.push(t);
      }
      this.spinFx(range);
      sfx.swing();
    } else if (w.type === 'slam') {
      const aoe = (w.aoe + st.arcBonus * 0.4) * Math.sqrt(st.rangeMult);
      const ix = ox + Math.cos(ang) * range * 0.75;
      const iy = oy + 8 + Math.sin(ang) * range * 0.75;
      for (const t of targets) {
        if (Phaser.Math.Distance.Between(ix, iy, t.x, t.y) - t.r <= aoe) hits.push(t);
      }
      this.slamFx(ang, ix, iy, aoe);
    } else if (w.type === 'stream') {
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      for (const t of targets) {
        const vx = t.x - ox;
        const vy = t.y - oy;
        const proj = vx * cos + vy * sin;
        const perp = Math.abs(-vx * sin + vy * cos);
        if (proj >= -t.r && proj <= range + t.r && perp <= w.width / 2 + t.r) hits.push(t);
      }
      this.streamFx(ang, range);
      sfx.spray();
    }

    const base = this.attackDamage;
    for (const t of hits) {
      if (t.kind === 'mole') this.damageMole(t.obj, base);
      else this.damageHill(t.obj, base * w.hillMult * st.hillMult);
    }
  }

  rollCrit(dmg) {
    const crit = Math.random() < this.stats.crit;
    return { dmg: crit ? dmg * 2 : dmg, crit };
  }

  damageMole(mole, rawDmg, opts = {}) {
    if (!mole.hittable) return;
    const { dmg, crit } = this.rollCrit(rawDmg);
    const amount = Math.max(1, Math.round(dmg));
    mole.hp -= amount;
    this.damageDealt += amount;
    this.lastHitDamage = amount;
    mole.hitFlash();
    if (!opts.quiet) (crit ? sfx.crit : sfx.hit)();
    this.floatText(mole.hitX + Phaser.Math.Between(-8, 8), mole.hitY - 18, String(amount), crit ? '#ffe14a' : '#ffffff', crit ? 28 : 22);
    if (mole.hp <= 0) this.killMole(mole);
  }

  killMole(mole) {
    const x = mole.hitX;
    const y = mole.hitY;
    mole.die();
    this.kills += 1;
    this.starFx.explode(mole.boss ? 18 : 7, x, y);
    if (mole.boss) {
      this.bossKills += 1;
      sfx.bossKill();
      this.cameras.main.shake(250, 0.006);
      this.banner('Boss besiegt!', '#9fe870');
    } else {
      sfx.kill();
    }
    this.gainXp(mole.def.xp, x, y - 20);
  }

  damageHill(hill, rawDmg, opts = {}) {
    if (hill.removed) return;
    let amount;
    if (opts.silent) {
      amount = rawDmg;
    } else {
      const { dmg, crit } = this.rollCrit(rawDmg);
      amount = Math.max(1, Math.round(dmg));
      this.damageDealt += amount;
      this.floatText(hill.hitX + Phaser.Math.Between(-8, 8), hill.hitY - 14, String(amount), crit ? '#ffe14a' : '#e8c79a', crit ? 26 : 20);
      this.dirtFx.explode(4, hill.hitX, hill.hitY);
      if (!opts.quiet) sfx.hillHit();
      this.tweens.add({ targets: hill.img, scaleY: PX * 0.8, duration: 60, yoyo: true });
    }
    hill.hp -= amount;
    if (hill.hp <= 0) this.removeHill(hill);
  }

  removeHill(hill) {
    if (hill.removed) return;
    if (hill.mole && !hill.mole.dead) {
      // Sollte nicht passieren, aber sicher ist sicher: Maulwurf flieht.
      hill.mole.hill = null;
    }
    const { x, y } = hill;
    this.dirtFx.explode(hill.boss ? 26 : 14, x, hill.hitY);
    this.grassFx.explode(hill.boss ? 12 : 6, x, hill.hitY);
    const patch = this.add.image(x, y - 4, 'patch').setScale(hill.boss ? PX * 1.8 : PX).setDepth(-500).setAlpha(0.9);
    this.tweens.add({ targets: patch, alpha: 0, delay: 600, duration: 1800, onComplete: () => patch.destroy() });
    hill.destroy();
    this.hillsRemoved += 1;
    sfx.hillGone();
    this.gainXp(hill.boss ? 4 : 1, x, y - 30);
  }

  cartCleanup(n) {
    const oldest = [...this.hills].filter((h) => !h.mole).sort((a, b) => b.age - a.age).slice(0, n);
    oldest.forEach((h, i) => this.time.delayedCall(i * 120, () => this.removeHill(h)));
  }

  // ------------------------------------------------------------------ Helfer: Zwerge & Sprenger

  placeGnome() {
    const p = this.player;
    this.gnomes.push(new Gnome(this, p.x, p.y + 2));
  }

  findGnomeTarget(gnome) {
    let best = null;
    let bestD = gnome.range;
    for (const t of this.collectTargets()) {
      // Maulwürfe bevorzugen
      const d = Phaser.Math.Distance.Between(gnome.x, gnome.y - 12, t.x, t.y) + (t.kind === 'hill' ? 40 : 0);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  gnomeThrow(gnome, target) {
    const stone = this.add.image(gnome.x, gnome.y - 22, 'stone').setScale(PX).setDepth(8400);
    sfx.gnome();
    this.tweens.add({
      targets: stone,
      x: target.x,
      y: target.y,
      angle: 360,
      duration: 220,
      onComplete: () => {
        stone.destroy();
        const dmg = this.attackDamage * 0.7;
        if (target.kind === 'mole') this.damageMole(target.obj, dmg, { quiet: true });
        else this.damageHill(target.obj, dmg * this.stats.hillMult, { quiet: true });
      },
    });
  }

  sprinkle() {
    const lvl = this.stats.sprinkler;
    const radius = 75 + 18 * (lvl - 1);
    const p = this.player;
    const ox = p.cx;
    const oy = p.cy + 6;
    const ring = this.add.circle(ox, oy, 10).setStrokeStyle(3, 0x8fd3ff, 0.9).setDepth(8300);
    this.tweens.add({ targets: ring, radius, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this.waterFx.explode(1, ox + Math.cos(a) * radius * 0.8, oy + Math.sin(a) * radius * 0.8);
    }
    sfx.splash();
    const dmg = this.attackDamage * (0.3 + 0.2 * lvl);
    for (const t of this.collectTargets()) {
      if (Phaser.Math.Distance.Between(ox, oy, t.x, t.y) - t.r > radius) continue;
      if (t.kind === 'mole') this.damageMole(t.obj, dmg, { quiet: true });
      else this.damageHill(t.obj, dmg * this.stats.hillMult, { quiet: true });
    }
  }

  // ------------------------------------------------------------------ Effekte

  toolSwing(from, to, duration, scaleY = 1) {
    const p = this.player;
    const tool = p.tool;
    p.swinging = true;
    this.tweens.killTweensOf(tool);
    const ang = p.facing;
    tool.setPosition(p.cx, p.cy + 4).setScale(PX, PX * scaleY);
    tool.setDepth(Math.sin(ang) < -0.3 ? p.y - 1 : p.y + 1);
    const obj = { a: from };
    tool.setRotation(from + Math.PI / 2);
    this.tweens.add({
      targets: obj,
      a: to,
      duration,
      ease: 'Quad.Out',
      onUpdate: () => tool.setRotation(obj.a + Math.PI / 2),
      onComplete: () => {
        this.time.delayedCall(60, () => {
          p.swinging = false;
        });
      },
    });
    // Sicherheitsnetz, falls der Tween abgebrochen wird
    this.time.delayedCall(duration + 120, () => {
      p.swinging = false;
    });
  }

  swingFx(ang, arc, range) {
    const p = this.player;
    const dur = Math.min(140, (this.weapon.cooldown / this.stats.rateMult) * 700);
    this.toolSwing(ang - arc / 2, ang + arc / 2, dur, Math.min(1.8, this.stats.rangeMult));
    const g = this.add.graphics().setDepth(8200);
    g.fillStyle(0xffffff, 0.22);
    g.slice(p.cx, p.cy, range, ang - arc / 2, ang + arc / 2, false);
    g.fillPath();
    g.lineStyle(2, 0xffffff, 0.5);
    g.beginPath();
    g.arc(p.cx, p.cy, range, ang - arc / 2, ang + arc / 2, false);
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
  }

  spinFx(range) {
    const p = this.player;
    this.toolSwing(p.facing, p.facing + Math.PI * 2, 160, Math.min(1.8, this.stats.rangeMult));
    const g = this.add.graphics().setDepth(8200);
    g.lineStyle(3, 0xffffff, 0.5).strokeCircle(p.cx, p.cy, range);
    g.fillStyle(0xffffff, 0.12).fillCircle(p.cx, p.cy, range);
    this.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      this.grassFx.explode(1, p.cx + Math.cos(a) * range * 0.8, p.cy + Math.sin(a) * range * 0.8);
    }
  }

  slamFx(ang, ix, iy, aoe) {
    this.toolSwing(ang - 1.9, ang, 110);
    this.time.delayedCall(100, () => {
      const ring = this.add.circle(ix, iy, 6).setStrokeStyle(4, 0xfff2c0, 0.9).setDepth(8200);
      this.tweens.add({ targets: ring, radius: aoe, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
      this.dirtFx.explode(10, ix, iy);
      this.cameras.main.shake(90, 0.004);
      sfx.hillHit();
    });
  }

  streamFx(ang, range) {
    const p = this.player;
    const tool = p.tool;
    p.swinging = true;
    tool.setPosition(p.cx, p.cy + 4).setRotation(ang + Math.PI / 2).setScale(PX);
    tool.setDepth(Math.sin(ang) < -0.3 ? p.y - 1 : p.y + 1);
    if (this.streamReset) this.streamReset.remove();
    this.streamReset = this.time.delayedCall(200, () => {
      p.swinging = false;
    });
    const sx = p.cx + Math.cos(ang) * 22;
    const sy = p.cy + Math.sin(ang) * 22;
    for (let i = 0; i < 5; i++) {
      const d = Phaser.Math.Between(0, range - 20);
      const drop = this.add
        .image(sx, sy, 'drop')
        .setScale(PX)
        .setDepth(8300);
      this.tweens.add({
        targets: drop,
        x: sx + Math.cos(ang) * (d + 20) + Phaser.Math.Between(-4, 4),
        y: sy + Math.sin(ang) * (d + 20) + Phaser.Math.Between(-4, 4),
        alpha: 0.2,
        duration: 140 + d * 0.4,
        onComplete: () => drop.destroy(),
      });
    }
    const g = this.add.graphics().setDepth(8250);
    g.lineStyle(6, 0x8fd3ff, 0.45);
    g.lineBetween(sx, sy, p.cx + Math.cos(ang) * range, p.cy + Math.sin(ang) * range);
    g.lineStyle(2, 0xffffff, 0.6);
    g.lineBetween(sx, sy, p.cx + Math.cos(ang) * range, p.cy + Math.sin(ang) * range);
    this.tweens.add({ targets: g, alpha: 0, duration: 110, onComplete: () => g.destroy() });
    this.waterFx.explode(2, p.cx + Math.cos(ang) * range, p.cy + Math.sin(ang) * range);
  }

  floatText(x, y, msg, color = '#ffffff', size = 22) {
    const t = this.add
      .text(x, y, msg, {
        fontFamily: FONT,
        fontSize: `${size}px`,
        color,
        stroke: '#1e140d',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(9100);
    this.tweens.add({ targets: t, y: y - 28, alpha: 0, duration: 700, ease: 'Quad.Out', onComplete: () => t.destroy() });
  }

  banner(msg, color) {
    if (this.currentBanner) this.currentBanner.destroy();
    const t = this.add
      .text(GAME_W / 2, LAWN.y + 70, msg, {
        fontFamily: TITLE_FONT,
        fontSize: '28px',
        color,
        stroke: '#1e140d',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(9400)
      .setScale(0.3);
    this.currentBanner = t;
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.Out' });
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: t.y - 20,
      delay: 1500,
      duration: 500,
      onComplete: () => {
        if (this.currentBanner === t) this.currentBanner = null;
        t.destroy();
      },
    });
  }

  drawBars() {
    const g = this.bars;
    g.clear();
    for (const m of this.moles) {
      if (!m.hittable) continue;
      const w = m.boss ? 60 : 30;
      const x = m.hitX - w / 2;
      const y = m.baseY - m.visH - 9;
      g.fillStyle(0x1e140d, 1).fillRect(x - 1, y - 1, w + 2, 6);
      g.fillStyle(0x5a1010, 1).fillRect(x, y, w, 4);
      g.fillStyle(0xe8302a, 1).fillRect(x, y, Math.max(0, (m.hp / m.maxHp) * w), 4);
    }
    for (const h of this.hills) {
      if (h.hp >= h.maxHp || h.mole) continue;
      const w = h.boss ? 44 : 26;
      const x = h.x - w / 2;
      const y = h.y - h.h - 7;
      g.fillStyle(0x1e140d, 1).fillRect(x - 1, y - 1, w + 2, 5);
      g.fillStyle(0x4a2e14, 1).fillRect(x, y, w, 3);
      g.fillStyle(0xe0a040, 1).fillRect(x, y, Math.max(0, (h.hp / h.maxHp) * w), 3);
    }
  }

  updateHud(load) {
    const pct = Math.min(1, load / MAX_HILL_LOAD);
    this.hudTime.setText(`Zeit ${formatTime(this.elapsed)}`);
    this.hudLevel.setText(`Lv ${this.level}`);

    const xg = this.hudXpBar;
    xg.clear();
    xg.fillStyle(0x1e140d, 1).fillRect(228, 10, 244, 20);
    xg.fillStyle(0x2c4a1c, 1).fillRect(230, 12, 240, 16);
    xg.fillStyle(0x6fbf4a, 1).fillRect(230, 12, Math.round(240 * Math.min(1, this.xp / this.xpNeed)), 16);
    this.hudXpText.setText(`XP ${Math.floor(this.xp)} / ${this.xpNeed}`).setPosition(236, 8);

    this.hudLoadLabel.setText('Rasen verhügelt');
    const lg = this.hudLoadBar;
    lg.clear();
    const danger = pct >= 0.75;
    const blink = danger && Math.floor(this.elapsed * 4) % 2 === 0;
    lg.fillStyle(0x1e140d, 1).fillRect(652, 10, 210, 20);
    lg.fillStyle(0x2a1a0c, 1).fillRect(654, 12, 206, 16);
    // Markierung ab 75 %
    lg.fillStyle(0xff6a5a, 1).fillRect(654 + Math.round(206 * 0.75), 10, 2, 20);
    const col = pct < 0.5 ? 0xc88a3a : pct < 0.75 ? 0xe06a20 : blink ? 0xffffff : 0xe8302a;
    lg.fillStyle(col, 1).fillRect(654, 12, Math.round(206 * pct), 16);
    this.hudLoadText.setText(`${Math.round(pct * 100)}%`).setColor(danger ? '#ff6a5a' : '#f3ead2');

    const activeMoles = this.moles.filter((m) => m.hittable).length;
    const score = D.computeScore({
      kills: this.kills,
      bossKills: this.bossKills,
      hillsRemoved: this.hillsRemoved,
      time: this.elapsed,
    });
    this.hudLine2.setText(
      `Maulwürfe: ${this.kills}${this.bossKills ? ` (Boss ${this.bossKills})` : ''}   ` +
        `Hügel weg: ${this.hillsRemoved}   ` +
        `Auf dem Rasen: ${activeMoles} Maulw. / ${this.hills.length} Hügel   ` +
        `Boss in ${Math.ceil(this.bossTimer)}s   ` +
        `Punkte: ${score}`,
    );

    const w = this.weapon;
    const st = this.stats;
    const aps = (st.rateMult / w.cooldown).toFixed(1);
    const range = Math.round(w.range * st.rangeMult);
    this.hudStats.setText(
      `${w.name} (${TYPE_LABEL[w.type]})  |  Schaden ${Math.round(this.attackDamage)}  |  ` +
        `${aps} Schläge/s  |  Reichweite ${range}  |  Tempo ${Math.round(st.speedMult * 100)}%  |  ` +
        `Krit ${Math.round(st.crit * 100)}%`,
    );
  }

  // ------------------------------------------------------------------ Level & Upgrades

  gainXp(amount, x, y) {
    const gained = amount * this.stats.xpMult;
    this.xp += gained;
    this.floatText(x, y, `+${Math.round(gained * 10) / 10} XP`, '#9fe870', 20);
    while (this.xp >= this.xpNeed) {
      this.xp -= this.xpNeed;
      this.level += 1;
      this.xpNeed = D.xpForLevel(this.level);
      this.pendingLevelUps += 1;
    }
  }

  openLevelUp() {
    sfx.levelUp();
    const choices = rollChoices(this);
    this.scene.pause();
    this.scene.launch('LevelUp', {
      level: this.level - this.pendingLevelUps + 1,
      choices,
      onPick: (c) => this.applyChoice(c),
    });
  }

  applyChoice(c) {
    this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
    if (c.type === 'weapon') {
      this.weapon = c.weapon;
      this.player.setWeapon(c.weapon);
      this.attackCd = 0;
      this.banner(`Neu: ${c.weapon.name}!`, '#ffe14a');
    } else {
      this.upgradeLevels[c.up.id] = (this.upgradeLevels[c.up.id] || 0) + 1;
      c.up.apply(this.stats, this);
    }
  }

  // ------------------------------------------------------------------ Pause & Ende

  pauseGame() {
    if (this.isOver) return;
    this.scene.pause();
    this.scene.launch('Pause');
  }

  gameOver() {
    this.isOver = true;
    sfx.gameOver();
    this.bars.clear();
    this.cameras.main.shake(400, 0.008);
    const overlay = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x5a0000, 0).setOrigin(0).setDepth(9800);
    this.tweens.add({ targets: overlay, fillAlpha: 0.45, duration: 600 });
    const t = this.add
      .text(GAME_W / 2, GAME_H / 2, 'DER RASEN IST RUINIERT!', {
        fontFamily: TITLE_FONT,
        fontSize: '30px',
        color: '#ff5a4a',
        stroke: '#1e140d',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(9900)
      .setScale(0.2);
    this.tweens.add({ targets: t, scale: 1, duration: 500, ease: 'Back.Out' });
    const result = {
      time: this.elapsed,
      kills: this.kills,
      bossKills: this.bossKills,
      hillsRemoved: this.hillsRemoved,
      level: this.level,
      weapon: this.weapon.name,
      damage: this.damageDealt,
    };
    result.score = D.computeScore(result);
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameOver', result));
    });
  }
}
