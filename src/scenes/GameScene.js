import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, LAWN, FONT, TITLE_FONT, MAX_HILL_LOAD, BEEHIVE, OMA_LEVEL } from '../config.js';
import * as D from '../difficulty.js';
import { WEAPONS, TYPE_LABEL } from '../data/weapons.js';
import { rollChoices } from '../data/upgrades.js';
import { sfx, toggleMute } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import { formatTime } from '../systems/leaderboard.js';
import { addButterflies } from '../gfx/ambient.js';
import { Player } from '../entities/Player.js';
import { Mole } from '../entities/Mole.js';
import { Hill } from '../entities/Hill.js';
import { Gnome, Bee, Hedgehog, Mower, Cloud, Oma } from '../entities/Helpers.js';

const DIRT_TINTS = [0x6c4220, 0x87552a, 0x523117, 0xa16b37];
const GRASS_TINTS = [0x5fa83d, 0x7cc255, 0x43892a];
const FIRE_TINTS = [0xffd02a, 0xff8a1a, 0xe8401a, 0xc8200a];
const MAX_FLOAT_TEXTS = 45;

const dist = Phaser.Math.Distance.Between;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.fontFamily = FONT;
    this.add.image(0, HUD_H, 'garden').setOrigin(0).setScale(PX).setDepth(-1000);
    addButterflies(this, 5);

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
      multi: 0,
      bees: 0,
      hedgehog: 0,
      mowers: 0,
      clouds: 0,
      storm: 0,
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

    this.moles = [];
    this.hills = [];
    this.helpers = [];
    this.projectiles = [];
    this.oma = null;
    this.floatCount = 0;

    this.attackCd = 0;
    this.spawnTimer = 2.5;
    this.bossTimer = D.FIRST_BOSS;
    this.timers = { sprinkler: 3, bees: 2, hedgehog: 3, storm: 2 };
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
      this.floatText(GAME_W / 2, HUD_H + 40, m ? 'Ton aus' : 'Ton an', '#ffffff', 24, true);
    });
    const onResume = () => {
      this.input.keyboard.resetKeys();
      music.setPaused(false);
    };
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => {
      this.events.off('resume', onResume);
      music.stop();
    });

    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 1.0));
    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 2.6));

    music.play('game');
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.banner("Los geht's, Opa!", '#ffe14a');
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
    this.rainFx = this.add
      .particles(0, 0, 'drop', {
        lifespan: 230,
        speedY: { min: 260, max: 320 },
        speedX: { min: -10, max: 10 },
        scale: PX,
        alpha: { start: 0.9, end: 0.3 },
        emitting: false,
      })
      .setDepth(8750);
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
    this.fireFx = this.add
      .particles(0, 0, 'px', {
        lifespan: { min: 220, max: 460 },
        speed: { min: 10, max: 60 },
        angle: { min: 230, max: 310 },
        scale: { start: 4.5, end: 0.8 },
        alpha: { start: 1, end: 0 },
        tint: FIRE_TINTS,
        emitting: false,
      })
      .setDepth(8550);
    this.boomFx = this.add
      .particles(0, 0, 'px', {
        lifespan: { min: 300, max: 700 },
        speed: { min: 80, max: 320 },
        angle: { min: 0, max: 360 },
        scale: { start: 4, end: 0.5 },
        alpha: { start: 1, end: 0 },
        tint: FIRE_TINTS,
        emitting: false,
      })
      .setDepth(8560);
  }

  createHud() {
    const g = this.add.graphics().setDepth(9500);
    g.fillStyle(0x3b2716, 1).fillRect(0, 0, GAME_W, HUD_H);
    g.fillStyle(0x4d3420, 1).fillRect(0, 0, GAME_W, 4);
    g.fillStyle(0x24170c, 1).fillRect(0, HUD_H - 4, GAME_W, 4);
    for (let x = 0; x < GAME_W; x += 120) g.fillStyle(0x33210f, 1).fillRect(x, 4, 2, HUD_H - 8);
    g.fillStyle(0x24170c, 0.85).fillRect(40, GAME_H - 44, GAME_W - 80, 34);
    g.lineStyle(2, 0x6e4a26, 1).strokeRect(40, GAME_H - 44, GAME_W - 80, 34);

    const t = (x, y, size, color = '#f3ead2') =>
      this.add.text(x, y, '', { fontFamily: FONT, fontSize: `${size}px`, color }).setDepth(9600);

    this.hudTime = t(16, 4, 30, '#ffe14a');
    this.hudLevel = t(160, 4, 30, '#9fe870');
    this.hudXpBar = this.add.graphics().setDepth(9600);
    this.hudXpText = t(256, 8, 20);
    this.hudLoadLabel = t(566, 6, 24);
    this.hudLoadBar = this.add.graphics().setDepth(9600);
    this.hudLoadText = t(990, 4, 30);
    this.hudLine2 = t(16, 34, 22);
    this.hudStats = t(GAME_W / 2, GAME_H - 40, 21, '#f3ead2').setOrigin(0.5, 0);
  }

  // ------------------------------------------------------------------ Werte inkl. Level-Bonus

  get bonus() {
    return D.levelBonus(this.level);
  }

  get attackDamage() {
    return this.weapon.damage * this.stats.dmgMult * this.bonus.dmg;
  }

  get attackRateMult() {
    return this.stats.rateMult * this.bonus.rate;
  }

  get attackRange() {
    return this.weapon.range * this.stats.rangeMult * this.bonus.range;
  }

  get rangeMult() {
    return this.stats.rangeMult * this.bonus.range;
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
    this.player.update(dt, input, { speedMult: this.stats.speedMult * this.bonus.speed });

    this.attackCd -= dt;
    if (k.space.isDown && this.attackCd <= 0) {
      this.attackCd = this.weapon.cooldown / this.attackRateMult;
      this.performAttack();
    }

    this.updateSpawning(dt);

    const upMult = D.upTimeMult(this.elapsed) * this.stats.upMult;
    for (const m of this.moles) {
      m.update(dt, upMult);
      if (m.burnT > 0 && m.hittable) this.updateBurn(m, dt);
    }
    this.moles = this.moles.filter((m) => !m.dead);

    this.updateProjectiles(dt);
    this.updateItems(dt);
    this.helpers = this.helpers.filter((h) => h.update(dt));
    if (this.oma) this.oma.update(dt);

    if (this.stats.seeds > 0) {
      const dmg = 1.5 * this.stats.seeds * dt;
      for (const h of this.hills) {
        if (!h.mole) this.damageHill(h, dmg, { silent: true });
      }
    }

    this.hills = this.hills.filter((h) => !h.removed);
    for (const h of this.hills) h.age += dt;

    const load = this.hillLoad();
    if (load >= MAX_HILL_LOAD) {
      this.gameOver();
      return;
    }
    const pct = load / MAX_HILL_LOAD;
    if (pct >= 0.75) {
      this.warnTimer -= dt;
      if (this.warnTimer <= 0) {
        this.warnTimer = 2.5;
        sfx.warning();
      }
    }

    const bossUp = this.moles.some((m) => m.boss);
    music.update({
      intensity: pct >= 0.6 || bossUp ? 2 : pct >= 0.3 || this.elapsed > 40 ? 1 : 0,
      bpm: 120 + Math.min(28, this.elapsed / 12) + (pct >= 0.75 ? 10 : 0),
      boss: bossUp,
    });

    this.drawBars();
    this.updateHud(load);

    if (this.pendingLevelUps > 0) this.openLevelUp();
  }

  updateSpawning(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = D.spawnInterval(this.elapsed);
      let normalAlive = this.moles.filter((m) => !m.boss).length;
      for (let i = 0; i < D.spawnBatch(this.elapsed) && normalAlive < D.maxMoles(this.elapsed); i++) {
        const kind = D.rollKind(this.elapsed);
        const hp = Math.round(D.moleHp(this.elapsed) * (kind === 'fast' ? 0.6 : kind === 'chill' ? 1.2 : 1));
        this.moles.push(new Mole(this, kind, hp, Phaser.Math.FloatBetween(0.2, 1.0)));
        normalAlive += 1;
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

  // ------------------------------------------------------------------ Ziele

  findSpawnPos(boss) {
    const margin = boss ? 40 : 26;
    const p = this.player;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 30; i++) {
        const x = Phaser.Math.Between(LAWN.x + margin, LAWN.right - margin);
        const y = Phaser.Math.Between(LAWN.y + (boss ? 60 : 40), LAWN.bottom - 8);
        if (dist(x, y, p.x, p.y) < (boss ? 110 : 70)) continue;
        let ok = true;
        for (const h of this.hills) {
          const minD = pass === 0 ? h.radius + (boss ? 30 : 18) : h.mole ? h.radius + 20 : 6;
          if (dist(x, y, h.x, h.y) < minD) {
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

  targetAlive(t) {
    if (t.kind === 'mole') return t.obj.hittable;
    return !t.obj.removed && !(t.obj.mole && t.obj.mole.hittable);
  }

  targetsNear(x, y, r) {
    return this.collectTargets().filter((t) => dist(x, y, t.x, t.y) - t.r <= r);
  }

  // Nächstes Ziel; Maulwürfe werden standardmäßig bevorzugt.
  nearestTarget(x, y, maxD, opts = {}) {
    const molePriority = opts.molePriority ?? 60;
    let best = null;
    let bestScore = Infinity;
    for (const t of this.collectTargets()) {
      const d = dist(x, y, t.x, t.y);
      if (d - t.r > maxD) continue;
      let score = d;
      if (t.kind === 'mole' && !opts.hillsFirst) score -= molePriority;
      if (t.kind === 'hill' && opts.hillsFirst) score -= 100;
      if (score < bestScore) {
        bestScore = score;
        best = t;
      }
    }
    return best;
  }

  randomMoleTarget() {
    const moles = this.moles.filter((m) => m.hittable);
    if (!moles.length) return null;
    const m = Phaser.Math.RND.pick(moles);
    return { kind: 'mole', obj: m, x: m.hitX, y: m.hitY, r: m.radius };
  }

  // Stelle mit den meisten Hügeln/Maulwürfen in der Nähe (für die Regenwolke)
  densestSpot() {
    const ts = this.collectTargets();
    let best = null;
    let bestN = -1;
    for (const a of ts) {
      let n = 0;
      for (const b of ts) if (dist(a.x, a.y, b.x, b.y) < 90) n += b.kind === 'mole' ? 2 : 1;
      if (n > bestN) {
        bestN = n;
        best = a;
      }
    }
    return best;
  }

  // ------------------------------------------------------------------ Schaden

  // Einheitlicher Treffer für Spieler, Helfer und Explosionen.
  hit(t, dmg, opts = {}) {
    if (!this.targetAlive(t)) return;
    if (t.kind === 'mole') this.damageMole(t.obj, dmg, opts);
    else this.damageHill(t.obj, dmg * this.stats.hillMult * (opts.hillFactor ?? 1), opts);
  }

  rollCrit(dmg) {
    const crit = Math.random() < this.stats.crit;
    return { dmg: crit ? dmg * 2 : dmg, crit };
  }

  damageMole(mole, rawDmg, opts = {}) {
    if (!mole.hittable) return;
    const { dmg, crit } = opts.noCrit ? { dmg: rawDmg, crit: false } : this.rollCrit(rawDmg);
    const amount = Math.max(1, Math.round(dmg));
    mole.hp -= amount;
    this.damageDealt += amount;
    mole.hitFlash();
    if (!opts.quiet) (crit ? sfx.crit : sfx.hit)();
    if (!opts.noText) {
      const size = crit ? 28 : opts.small ? 18 : 22;
      const color = opts.color || (crit ? '#ffe14a' : '#ffffff');
      this.floatText(mole.hitX + Phaser.Math.Between(-10, 10), mole.hitY - 18, String(amount), color, size);
    }
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
      if (!opts.noText) {
        this.floatText(hill.hitX + Phaser.Math.Between(-8, 8), hill.hitY - 14, String(amount), crit ? '#ffe14a' : '#e8c79a', crit ? 26 : opts.small ? 17 : 20);
      }
      this.dirtFx.explode(3, hill.hitX, hill.hitY);
      if (!opts.quiet) sfx.hillHit();
      if (!this.tweens.isTweening(hill.img)) this.tweens.add({ targets: hill.img, scaleY: PX * 0.8, duration: 60, yoyo: true });
    }
    hill.hp -= amount;
    if (hill.hp <= 0) this.removeHill(hill);
  }

  removeHill(hill) {
    if (hill.removed) return;
    if (hill.mole && !hill.mole.dead) hill.mole.hill = null;
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

  updateBurn(m, dt) {
    m.burnT -= dt;
    m.burnAcc += m.burnDps * dt;
    if (Math.random() < 0.5) this.fireFx.emitParticleAt(m.hitX + Phaser.Math.Between(-10, 10), m.hitY + Phaser.Math.Between(-8, 8));
    if (m.burnAcc >= 1 && (m.burnAcc >= 8 || m.burnT <= 0)) {
      const amt = Math.floor(m.burnAcc);
      m.burnAcc -= amt;
      this.damageMole(m, amt, { quiet: true, noCrit: true, small: true, color: '#ff9a5a' });
    }
    if (m.burnT <= 0 && !m.dead) m.sprite.clearTint();
  }

  explode(x, y, radius, dmg) {
    sfx.explosion();
    this.cameras.main.shake(140, 0.005);
    const flash = this.add.circle(x, y, radius, 0xffb02a, 0.45).setDepth(8540);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.15, duration: 260, onComplete: () => flash.destroy() });
    const ring = this.add.circle(x, y, 8).setStrokeStyle(5, 0xfff2c0, 1).setDepth(8541);
    this.tweens.add({ targets: ring, radius, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    this.boomFx.explode(Math.min(40, 12 + radius / 4), x, y);
    this.dirtFx.explode(10, x, y);
    for (const t of this.targetsNear(x, y, radius)) {
      this.hit(t, dmg, { quiet: true, hillFactor: this.weapon.hillMult });
    }
  }

  // ------------------------------------------------------------------ Angriffe

  performAttack() {
    const w = this.weapon;
    const st = this.stats;
    const p = this.player;
    const ox = p.cx;
    const oy = p.cy;
    const ang = p.facing;
    const range = this.attackRange;
    const dmg = this.attackDamage;

    if (w.type === 'shot') {
      this.fireProjectiles();
      return;
    }

    const targets = this.collectTargets();
    const hits = [];
    if (w.type === 'swing') {
      const arc = Phaser.Math.DegToRad(Math.min(360, w.arc + st.arcBonus));
      for (const t of targets) {
        const d = dist(ox, oy, t.x, t.y);
        if (d - t.r > range) continue;
        const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(t.y - oy, t.x - ox) - ang));
        if (diff <= arc / 2 || d < t.r + 12) hits.push(t);
      }
      this.swingFx(ang, arc, range);
      sfx.swing();
    } else if (w.type === 'spin') {
      for (const t of targets) {
        if (dist(ox, oy, t.x, t.y) - t.r <= range) hits.push(t);
      }
      this.spinFx(range);
      sfx.swing();
    } else if (w.type === 'slam') {
      const aoe = (w.aoe + st.arcBonus * 0.4) * Math.sqrt(this.rangeMult);
      const ix = ox + Math.cos(ang) * range * 0.75;
      const iy = oy + 8 + Math.sin(ang) * range * 0.75;
      for (const t of targets) {
        if (dist(ix, iy, t.x, t.y) - t.r <= aoe) hits.push(t);
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
    } else if (w.type === 'cone') {
      const arc = Phaser.Math.DegToRad(Math.min(120, w.arc + st.arcBonus * 0.5));
      for (const t of targets) {
        const d = dist(ox, oy, t.x, t.y);
        if (d - t.r > range) continue;
        const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(t.y - oy, t.x - ox) - ang));
        if (diff <= arc / 2 + Math.atan2(t.r, Math.max(d, 1)) || d < t.r + 12) hits.push(t);
      }
      this.flameFx(ang, arc, range);
      sfx.flame();
    }

    for (const t of hits) {
      const quiet = w.type === 'cone' || w.type === 'stream';
      this.hit(t, dmg, { hillFactor: w.hillMult, quiet, small: quiet });
      if (w.type === 'cone' && t.kind === 'mole' && !t.obj.dead) {
        t.obj.burnT = 2;
        t.obj.burnDps = w.burn * this.stats.dmgMult * this.bonus.dmg;
      }
    }
  }

  fireProjectiles() {
    const w = this.weapon;
    const p = this.player;
    const range = this.attackRange;
    // Automatisch auf den nächsten Maulwurf zielen (sonst Hügel, sonst Blickrichtung)
    const target = this.nearestTarget(p.cx, p.cy, range, { molePriority: 200 });
    const aim = target ? Math.atan2(target.y - p.cy, target.x - p.cx) : p.facing;
    const n = 1 + this.stats.multi;
    for (let i = 0; i < n; i++) {
      const a = aim + (i - (n - 1) / 2) * 0.2;
      const sx = p.cx + Math.cos(a) * 18;
      const sy = p.cy + Math.sin(a) * 18;
      const scale = w.proj === 'p_rocket' ? PX * 1.2 : PX * 1.3;
      const sprite = this.add.image(sx, sy, w.proj).setScale(scale).setDepth(8450).setRotation(a);
      this.projectiles.push({
        sprite,
        x: sx,
        y: sy,
        a,
        speed: w.speed,
        dmg: this.attackDamage,
        pierce: w.pierce,
        explode: w.explode ? w.explode * Math.sqrt(this.rangeMult) : 0,
        homing: !!w.homing,
        target: i === Math.floor(n / 2) ? target : null,
        travelled: 0,
        range: range * 1.2,
        hitSet: new Set(),
        smoke: 0,
      });
    }
    this.aimTool(aim);
    if (w.homing) sfx.rocket();
    else sfx.shoot();
  }

  updateProjectiles(dt) {
    const targets = this.collectTargets();
    this.projectiles = this.projectiles.filter((pr) => {
      if (pr.homing) {
        if (!pr.target || !this.targetAlive(pr.target)) pr.target = this.nearestTarget(pr.x, pr.y, 400, { molePriority: 200 });
        if (pr.target) {
          const want = Math.atan2(pr.target.obj.hitY - pr.y, pr.target.obj.hitX - pr.x);
          const diff = Phaser.Math.Angle.Wrap(want - pr.a);
          pr.a += Phaser.Math.Clamp(diff, -6 * dt, 6 * dt);
        }
        pr.smoke -= dt;
        if (pr.smoke <= 0) {
          pr.smoke = 0.03;
          this.fireFx.emitParticleAt(pr.x - Math.cos(pr.a) * 12, pr.y - Math.sin(pr.a) * 12);
        }
      }
      const step = pr.speed * dt;
      pr.x += Math.cos(pr.a) * step;
      pr.y += Math.sin(pr.a) * step;
      pr.travelled += step;
      pr.sprite.setPosition(pr.x, pr.y);
      pr.sprite.setRotation(pr.homing ? pr.a : pr.sprite.rotation + dt * 12);

      for (const t of targets) {
        if (pr.hitSet.has(t.obj) || !this.targetAlive(t)) continue;
        if (dist(pr.x, pr.y, t.x, t.y) > t.r + 6) continue;
        if (pr.explode) {
          this.explode(pr.x, pr.y, pr.explode, pr.dmg);
          pr.sprite.destroy();
          return false;
        }
        pr.hitSet.add(t.obj);
        this.hit(t, pr.dmg, { hillFactor: this.weapon.hillMult });
        pr.pierce -= 1;
        if (pr.pierce < 0) {
          pr.sprite.destroy();
          return false;
        }
      }
      const out = pr.x < LAWN.x - 20 || pr.x > LAWN.right + 20 || pr.y < LAWN.y - 30 || pr.y > LAWN.bottom + 20;
      if (out || pr.travelled > pr.range) {
        if (pr.explode && !out) this.explode(pr.x, pr.y, pr.explode, pr.dmg);
        pr.sprite.destroy();
        return false;
      }
      return true;
    });
  }

  // ------------------------------------------------------------------ Items & Helfer

  updateItems(dt) {
    const st = this.stats;
    const tm = this.timers;
    if (st.sprinkler > 0) {
      tm.sprinkler -= dt;
      if (tm.sprinkler <= 0) {
        tm.sprinkler = 3;
        this.sprinkle();
      }
    }
    if (st.bees > 0) {
      tm.bees -= dt;
      if (tm.bees <= 0) {
        tm.bees = Math.max(1.5, 4 - 0.4 * st.bees);
        if (this.moles.some((m) => m.hittable)) {
          for (let i = 0; i < st.bees + 1; i++) {
            this.helpers.push(new Bee(this, BEEHIVE.x + Phaser.Math.Between(-6, 6), BEEHIVE.y + Phaser.Math.Between(-6, 6)));
          }
          sfx.buzz();
        }
      }
    }
    if (st.hedgehog > 0) {
      tm.hedgehog -= dt;
      if (tm.hedgehog <= 0) {
        tm.hedgehog = Math.max(3.5, 8 - 1.2 * (st.hedgehog - 1));
        this.helpers.push(new Hedgehog(this, st.hedgehog));
      }
    }
    if (st.storm > 0) {
      tm.storm -= dt;
      if (tm.storm <= 0) {
        tm.storm = Math.max(1.6, 5 - 0.7 * (st.storm - 1));
        this.lightning(st.storm >= 3 ? 2 : 1);
      }
    }
  }

  placeGnome() {
    const p = this.player;
    this.helpers.push(new Gnome(this, p.x, p.y + 2));
  }

  addMower() {
    this.helpers.push(new Mower(this));
  }

  addCloud() {
    this.helpers.push(new Cloud(this));
  }

  sprinkle() {
    const lvl = this.stats.sprinkler;
    const radius = 80 + 20 * (lvl - 1);
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
    const dmg = this.attackDamage * (0.4 + 0.25 * lvl);
    for (const t of this.targetsNear(ox, oy, radius)) this.hit(t, dmg, { quiet: true, small: true });
  }

  lightning(count) {
    const moles = this.moles.filter((m) => m.hittable).sort((a, b) => b.hp - a.hp);
    for (let i = 0; i < Math.min(count, moles.length); i++) {
      const m = moles[i];
      const tx = m.hitX;
      const ty = m.hitY;
      const g = this.add.graphics().setDepth(8900);
      const pts = [];
      let x = tx + Phaser.Math.Between(-40, 40);
      for (let y = LAWN.y - 120; y < ty; y += 22) {
        pts.push(new Phaser.Math.Vector2(x, y));
        x += Phaser.Math.Between(-14, 14);
      }
      pts.push(new Phaser.Math.Vector2(tx, ty));
      g.lineStyle(7, 0x8fd3ff, 0.5).strokePoints(pts);
      g.lineStyle(3, 0xffffff, 1).strokePoints(pts);
      this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
      const flash = this.add.rectangle(0, 0, GAME_W, GAME_H, 0xffffff, 0.18).setOrigin(0).setDepth(9300);
      this.tweens.add({ targets: flash, alpha: 0, duration: 140, onComplete: () => flash.destroy() });
      this.starFx.explode(6, tx, ty);
      this.hit({ kind: 'mole', obj: m }, this.attackDamage * (2.2 + 0.4 * this.stats.storm), { quiet: true, color: '#8fd3ff' });
    }
    if (moles.length) sfx.zap();
  }

  spawnOma() {
    const p = this.player;
    this.oma = new Oma(this, Phaser.Math.Clamp(p.x + 60, LAWN.x + 20, LAWN.right - 20), p.y);
    sfx.oma();
    this.banner('Oma kommt zu Hilfe!', '#e8c7ff');
    const heart = this.add.image(this.oma.x, this.oma.y - 50, 'i_oma').setScale(PX * 2).setDepth(9200);
    this.tweens.add({ targets: heart, y: heart.y - 30, alpha: 0, duration: 1400, onComplete: () => heart.destroy() });
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
    });
    if (this.swingReset) this.swingReset.remove();
    this.swingReset = this.time.delayedCall(duration + 80, () => {
      p.swinging = false;
    });
  }

  aimTool(ang) {
    const p = this.player;
    p.swinging = true;
    p.tool.setPosition(p.cx, p.cy + 4).setRotation(ang + Math.PI / 2).setScale(PX);
    p.tool.setDepth(Math.sin(ang) < -0.3 ? p.y - 1 : p.y + 1);
    if (this.swingReset) this.swingReset.remove();
    this.swingReset = this.time.delayedCall(220, () => {
      p.swinging = false;
    });
  }

  swingFx(ang, arc, range) {
    const p = this.player;
    const dur = Math.min(140, (this.weapon.cooldown / this.attackRateMult) * 700);
    this.toolSwing(ang - arc / 2, ang + arc / 2, dur, Math.min(1.8, this.rangeMult));
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
    this.toolSwing(p.facing, p.facing + Math.PI * 2, 160, Math.min(1.8, this.rangeMult));
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
    this.aimTool(ang);
    const sx = p.cx + Math.cos(ang) * 22;
    const sy = p.cy + Math.sin(ang) * 22;
    for (let i = 0; i < 5; i++) {
      const d = Phaser.Math.Between(0, range - 20);
      const drop = this.add.image(sx, sy, 'drop').setScale(PX).setDepth(8300);
      this.tweens.add({
        targets: drop,
        x: sx + Math.cos(ang) * (d + 20) + Phaser.Math.Between(-4, 4),
        y: sy + Math.sin(ang) * (d + 20) + Phaser.Math.Between(-4, 4),
        alpha: 0.2,
        duration: 140 + d * 0.4,
        onComplete: () => drop.destroy(),
      });
    }
    const ex = p.cx + Math.cos(ang) * range;
    const ey = p.cy + Math.sin(ang) * range;
    const g = this.add.graphics().setDepth(8250);
    g.lineStyle(8, 0x8fd3ff, 0.45).lineBetween(sx, sy, ex, ey);
    g.lineStyle(3, 0xffffff, 0.6).lineBetween(sx, sy, ex, ey);
    this.tweens.add({ targets: g, alpha: 0, duration: 110, onComplete: () => g.destroy() });
    this.waterFx.explode(2, ex, ey);
  }

  flameFx(ang, arc, range) {
    const p = this.player;
    this.aimTool(ang);
    for (let i = 0; i < 14; i++) {
      const a = ang + Phaser.Math.FloatBetween(-arc / 2, arc / 2);
      const d = Phaser.Math.FloatBetween(20, range);
      this.fireFx.emitParticleAt(p.cx + Math.cos(a) * d, p.cy + Math.sin(a) * d);
    }
    const g = this.add.graphics().setDepth(8540);
    g.fillStyle(0xff7a1a, 0.18);
    g.slice(p.cx, p.cy, range, ang - arc / 2, ang + arc / 2, false);
    g.fillPath();
    this.tweens.add({ targets: g, alpha: 0, duration: 90, onComplete: () => g.destroy() });
  }

  floatText(x, y, msg, color = '#ffffff', size = 22, force = false) {
    if (!force && this.floatCount >= MAX_FLOAT_TEXTS) return;
    this.floatCount += 1;
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
    this.tweens.add({
      targets: t,
      y: y - 28,
      alpha: 0,
      duration: 700,
      ease: 'Quad.Out',
      onComplete: () => {
        this.floatCount -= 1;
        t.destroy();
      },
    });
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
    xg.fillStyle(0x1e140d, 1).fillRect(248, 10, 284, 20);
    xg.fillStyle(0x2c4a1c, 1).fillRect(250, 12, 280, 16);
    xg.fillStyle(0x6fbf4a, 1).fillRect(250, 12, Math.round(280 * Math.min(1, this.xp / this.xpNeed)), 16);
    this.hudXpText.setText(`XP ${Math.floor(this.xp)} / ${this.xpNeed}`);

    this.hudLoadLabel.setText('Rasen verhügelt');
    const lg = this.hudLoadBar;
    lg.clear();
    const danger = pct >= 0.75;
    const blink = danger && Math.floor(this.elapsed * 4) % 2 === 0;
    lg.fillStyle(0x1e140d, 1).fillRect(724, 10, 254, 20);
    lg.fillStyle(0x2a1a0c, 1).fillRect(726, 12, 250, 16);
    lg.fillStyle(0xff6a5a, 1).fillRect(726 + Math.round(250 * 0.75), 10, 2, 20);
    const col = pct < 0.5 ? 0xc88a3a : pct < 0.75 ? 0xe06a20 : blink ? 0xffffff : 0xe8302a;
    lg.fillStyle(col, 1).fillRect(726, 12, Math.round(250 * pct), 16);
    this.hudLoadText.setText(`${Math.round(pct * 100)}%`).setColor(danger ? '#ff6a5a' : '#f3ead2');

    const activeMoles = this.moles.filter((m) => m.hittable).length;
    const score = D.computeScore({
      kills: this.kills,
      bossKills: this.bossKills,
      hillsRemoved: this.hillsRemoved,
      time: this.elapsed,
    });
    const omaInfo = this.oma ? `   Oma Lv ${this.level}` : this.level < OMA_LEVEL ? `   Oma ab Lv ${OMA_LEVEL}` : '';
    this.hudLine2.setText(
      `Maulwürfe: ${this.kills}${this.bossKills ? ` (Boss ${this.bossKills})` : ''}   ` +
        `Hügel weg: ${this.hillsRemoved}   ` +
        `Auf dem Rasen: ${activeMoles} Maulw. / ${this.hills.length} Hügel   ` +
        `Boss in ${Math.ceil(this.bossTimer)}s   ` +
        `Punkte: ${score}${omaInfo}`,
    );

    const w = this.weapon;
    const aps = (this.attackRateMult / w.cooldown).toFixed(1);
    const shots = w.type === 'shot' && this.stats.multi ? ` x${1 + this.stats.multi}` : '';
    this.hudStats.setText(
      `${w.name} (${TYPE_LABEL[w.type]})  |  Schaden ${Math.round(this.attackDamage)}${shots}  |  ` +
        `${aps} Angriffe/s  |  Reichweite ${Math.round(this.attackRange)}  |  ` +
        `Tempo ${Math.round(this.stats.speedMult * this.bonus.speed * 100)}%  |  Krit ${Math.round(this.stats.crit * 100)}%`,
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
      if (this.level >= OMA_LEVEL && !this.oma) this.spawnOma();
    }
  }

  openLevelUp() {
    sfx.levelUp();
    const level = this.level - this.pendingLevelUps + 1;
    const choices = rollChoices(this);
    this.scene.pause();
    this.scene.launch('LevelUp', {
      level,
      choices,
      omaUnlocked: level === OMA_LEVEL,
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

  cartCleanup(n) {
    const oldest = [...this.hills].filter((h) => !h.mole).sort((a, b) => b.age - a.age).slice(0, n);
    oldest.forEach((h, i) => this.time.delayedCall(i * 120, () => this.removeHill(h)));
  }

  // ------------------------------------------------------------------ Pause & Ende

  pauseGame() {
    if (this.isOver) return;
    music.setPaused(true);
    this.scene.pause();
    this.scene.launch('Pause');
  }

  gameOver() {
    this.isOver = true;
    music.stop();
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
