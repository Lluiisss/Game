import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, LAWN, FONT, TITLE_FONT, MAX_HILL_LOAD, BEEHIVES, OMA_SEAT, OMA_LEVEL } from '../config.js';
import * as D from '../difficulty.js';
import { WEAPONS, TYPE_LABEL } from '../data/weapons.js';
import { rollChoices } from '../data/upgrades.js';
import { sfx, toggleMute } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import { formatTime } from '../systems/leaderboard.js';
import { addButterflies } from '../gfx/ambient.js';
import { Player } from '../entities/Player.js';
import { Mole, MOLE_KINDS } from '../entities/Mole.js';
import { Hill } from '../entities/Hill.js';
import { Gnome, Bee, Hedgehog, Mower, Cloud, Oma } from '../entities/Helpers.js';

const DIRT_TINTS = [0x6c4220, 0x87552a, 0x523117, 0xa16b37];
const GRASS_TINTS = [0x5fa83d, 0x7cc255, 0x43892a];
const MAX_FLOAT_TEXTS = 45;

// Comic-Wörter und Effekte der lustigen Waffen
const FX_WORDS = {
  stun: ['QUIEK!', '#ffe14a'],
  bonk: ['BONK!', '#ff9a5a'],
  crack: ['KNALL!', '#ffffff'],
  saw: ['BRUMMM!', '#ffcf6a'],
  splash: ['PLATSCH!', '#8fd3ff'],
};


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
    this.levelsSinceHelper = 0;
    this.pendingLevelUps = 0;

    this.elapsed = 0;
    this.kills = 0;
    this.bossKills = 0;
    this.gigaKills = 0;
    this.giga = null;
    this.hillsRemoved = 0;
    this.damageDealt = 0;

    this.moles = [];
    this.hills = [];
    this.helpers = [];
    this.hives = [];
    this.cloud = null;
    this.seenKinds = new Set();
    this.announceQueue = [];
    this.oma = null;
    this.floatCount = 0;

    this.attackCd = 0;
    this.spawnTimer = 2.5;
    this.bossTimer = D.FIRST_BOSS;
    this.timers = { sprinkler: 3, bees: 2, hedgehog: 3, storm: 2 };
    this.warnTimer = 0;
    this.isOver = false;

    // Bis Level 15 sitzt Oma am Terrassentisch und schaut zu
    this.omaSitting = this.add
      .image(OMA_SEAT.x, OMA_SEAT.y, 'oma_down_0')
      .setOrigin(0.5, 1)
      .setScale(PX)
      .setCrop(0, 0, 22, 17)
      .setDepth(-140);
    this.tweens.add({ targets: this.omaSitting, y: OMA_SEAT.y - 2, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

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
      if (this.omaArriving) {
        this.omaArriving = false;
        this.spawnOma();
      }
    };
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => {
      this.events.off('resume', onResume);
      music.stop();
    });

    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 0.8));
    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 1.8));
    this.moles.push(new Mole(this, 'normal', D.moleHp(0), 2.8));

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
  }

  createHud() {
    const g = this.add.graphics().setDepth(9500);
    g.fillStyle(0x3b2716, 1).fillRect(0, 0, GAME_W, HUD_H);
    g.fillStyle(0x4d3420, 1).fillRect(0, 0, GAME_W, 4);
    g.fillStyle(0x24170c, 1).fillRect(0, HUD_H - 4, GAME_W, 4);
    for (let x = 0; x < GAME_W; x += 120) g.fillStyle(0x33210f, 1).fillRect(x, 4, 2, HUD_H - 8);
    g.fillStyle(0x2c1d10, 1).fillRect(0, 58, GAME_W, 2);

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
    this.hudStats = t(16, 60, 21, '#d9c9a6');
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

  get attackCooldown() {
    return Math.max(D.MIN_ATTACK_COOLDOWN, this.weapon.cooldown / this.attackRateMult);
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

    // Opa haut automatisch zu – man muss nur laufen und zielen.
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      this.attackCd = this.attackCooldown;
      this.performAttack();
    }

    this.updateSpawning(dt);

    const upMult = D.upTimeMult(this.elapsed) * this.stats.upMult;
    for (const m of this.moles) m.update(dt, upMult);
    this.moles = this.moles.filter((m) => !m.dead);

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
      this.updateHud(load);
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

    // Neue Maulwurfarten nacheinander ankündigen
    if (this.announceQueue.length && !this.currentBanner) {
      const m = this.announceQueue.shift();
      this.banner(`Neu: ${m.def.name}!`, '#ffcf6a', m.def.desc);
      if (m.hittable) this.pointAt(m);
    }

    this.drawBars();
    this.updateHud(load);

    if (this.pendingLevelUps > 0) this.openLevelUp();
    else if (this.omaPending) this.startOmaIntro();
    else if (this.gigaPending) this.spawnGiga();
  }

  updateSpawning(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = D.spawnInterval(this.elapsed);
      let normalAlive = this.moles.filter((m) => !m.boss).length;
      for (let i = 0; i < D.spawnBatch(this.elapsed) && normalAlive < D.maxMoles(this.elapsed); i++) {
        const kind = D.rollKind(this.elapsed);
        const hp = Math.round(D.moleHp(this.elapsed) * MOLE_KINDS[kind].hpMult);
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
    let pos;
    if (mole.spawnAt) {
      pos = mole.spawnAt;
      mole.spawnAt = null;
    } else if (mole.spawnNear) {
      pos = this.posNear(mole.spawnNear.x, mole.spawnNear.y, 30, 80);
      mole.spawnNear = null;
    } else {
      pos = this.findSpawnPos(mole.boss);
    }
    const hpBase = D.hillHp(this.elapsed);
    const size = mole.def.giga ? 1.9 : mole.kind === 'baby' ? 0.65 : 1;
    const hillHp = mole.def.giga ? hpBase * 10 : mole.boss ? hpBase * 4 : size < 1 ? hpBase * 0.5 : hpBase;
    const hill = new Hill(this, pos.x, pos.y, mole.boss, hillHp, size);
    this.hills.push(hill);
    mole.emerge(hill);
    this.dirtFx.explode(mole.boss ? 22 : 10, pos.x, hill.holeY);
    sfx.pop();
    // Neue Maulwurfart einmal groß ankündigen
    if (mole.def.desc && !this.seenKinds.has(mole.kind)) {
      this.seenKinds.add(mole.kind);
      this.announceQueue.push(mole);
    }
  }

  // Zufällige Position im Ring um (x, y), innerhalb des Rasens
  posNear(x, y, minD, maxD) {
    const a = Math.random() * Math.PI * 2;
    const d = Phaser.Math.FloatBetween(minD, maxD);
    return {
      x: Phaser.Math.Clamp(x + Math.cos(a) * d, LAWN.x + 24, LAWN.right - 24),
      y: Phaser.Math.Clamp(y + Math.sin(a) * d, LAWN.y + 40, LAWN.bottom - 8),
    };
  }

  // Pfeil über einem neuen Maulwurf
  pointAt(mole) {
    const arrow = this.add
      .text(mole.hitX, mole.hitY - 50, '▼', { fontFamily: FONT, fontSize: '34px', color: '#ffcf6a', stroke: '#1e140d', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(9200);
    this.tweens.add({ targets: arrow, y: arrow.y - 10, duration: 300, yoyo: true, repeat: 4, onComplete: () => arrow.destroy() });
  }

  // Fähigkeiten: Buddler buddelt, Doktor heilt, Gigamaulwurf stampft
  onMoleAbility(mole) {
    if (mole.def.slam) {
      const s = mole.sprite;
      this.tweens.add({ targets: s, scaleY: mole.def.scale * 0.75, scaleX: mole.def.scale * 1.15, duration: 120, yoyo: true });
      this.time.delayedCall(120, () => {
        if (mole.dead || !mole.hill) return;
        this.cameras.main.shake(260, 0.01);
        sfx.bonk();
        sfx.boss();
        const ring = this.add.circle(mole.hill.x, mole.hill.y - 10, 20).setStrokeStyle(6, 0x8a5a2a, 0.9).setDepth(8300);
        this.tweens.add({ targets: ring, radius: 190, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
        this.dirtFx.explode(30, mole.hill.x, mole.hill.y - 10);
        const n = 3 + Math.min(4, Math.floor(this.elapsed / 200));
        for (let i = 0; i < n; i++) {
          const pos = this.posNear(mole.hill.x, mole.hill.y, 100, 200);
          this.hills.push(new Hill(this, pos.x, pos.y, false, D.hillHp(this.elapsed), 1));
        }
      });
      return;
    }
    if (mole.def.dig) {
      if (this.hills.filter((h) => h.digger === mole).length >= 3) return;
      const pos = this.posNear(mole.hill.x, mole.hill.y, 45, 75);
      const hill = new Hill(this, pos.x, pos.y, false, D.hillHp(this.elapsed) * 0.6, 0.65);
      hill.digger = mole;
      this.hills.push(hill);
      this.dirtFx.explode(8, pos.x, hill.hitY);
      sfx.dive();
    }
    if (mole.def.heal) {
      const r = 150;
      const ring = this.add.circle(mole.hitX, mole.hitY, 10).setStrokeStyle(3, 0x7cff7c, 0.9).setDepth(8300);
      this.tweens.add({ targets: ring, radius: r, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
      for (const m of this.moles) {
        if (m === mole || !m.hittable || dist(m.hitX, m.hitY, mole.hitX, mole.hitY) > r || m.hp >= m.maxHp) continue;
        const amt = Math.round(m.maxHp * 0.2);
        m.hp = Math.min(m.maxHp, m.hp + amt);
        this.floatText(m.hitX, m.hitY - 20, `+${amt}`, '#7cff7c', 20);
      }
      for (const h of this.hills) {
        if (h.removed || h.hp >= h.maxHp || dist(h.x, h.y, mole.hill.x, mole.hill.y) > r) continue;
        h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.3);
      }
      sfx.heal();
    }
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

  rollCrit(dmg, extra = 0) {
    const crit = Math.random() < this.stats.crit + extra;
    return { dmg: crit ? dmg * 2 : dmg, crit };
  }

  damageMole(mole, rawDmg, opts = {}) {
    if (!mole.hittable) return;
    const { dmg, crit } = opts.noCrit ? { dmg: rawDmg, crit: false } : this.rollCrit(rawDmg, opts.extraCrit);
    const armored = !!mole.def.armor;
    const amount = Math.max(1, Math.round(dmg * (mole.def.armor || 1)));
    mole.hp -= amount;
    this.damageDealt += amount;
    mole.hitFlash();
    if (!opts.quiet) (crit ? sfx.crit : sfx.hit)();
    if (!opts.noText) {
      const size = crit ? 28 : opts.small ? 18 : 22;
      const color = opts.color || (crit ? '#ffe14a' : armored ? '#b8bcc4' : '#ffffff');
      this.floatText(mole.hitX + Phaser.Math.Between(-10, 10), mole.hitY - 18, String(amount), color, size);
    }
    if (mole.hp <= 0) this.killMole(mole);
    else if (mole.def.flee && mole.flee()) {
      this.floatText(mole.hitX, mole.hitY - 40, 'Hilfe!', '#7fd0ff', 22);
      this.dirtFx.explode(6, mole.hitX, mole.baseY);
      sfx.dive();
    }
  }

  killMole(mole) {
    const x = mole.hitX;
    const y = mole.hitY;
    mole.die();
    this.kills += 1;
    this.starFx.explode(mole.boss ? 18 : 7, x, y);
    if (mole.def.giga) {
      this.gigaKills += 1;
      this.giga = null;
      if (this.gigaLabel) this.gigaLabel.destroy();
      this.gigaLabel = null;
      this.cameras.main.shake(600, 0.012);
      this.starFx.explode(40, x, y);
      this.dirtFx.explode(40, x, y);
    }
    if (mole.boss) {
      this.bossKills += 1;
      sfx.bossKill();
      this.cameras.main.shake(250, 0.006);
      this.banner(mole.def.giga ? 'GIGAMAULWURF BESIEGT!' : 'Boss besiegt!', '#9fe870');
    } else {
      sfx.kill();
    }
    this.gainXp(mole.def.xp, x, y - 20);
    if (mole.def.babies && mole.hill) {
      for (let i = 0; i < mole.def.babies; i++) {
        const baby = new Mole(this, 'baby', Math.max(5, Math.round(mole.maxHp * MOLE_KINDS.baby.hpMult)), 0.3 + i * 0.25);
        baby.spawnNear = { x: mole.hill.x, y: mole.hill.y };
        this.moles.push(baby);
      }
      this.floatText(x, y - 46, 'Babys!', '#ff8cc6', 26);
    }
  }

  damageHill(hill, rawDmg, opts = {}) {
    if (hill.removed) return;
    let amount;
    if (opts.silent) {
      amount = rawDmg;
    } else {
      const { dmg, crit } = this.rollCrit(rawDmg, opts.extraCrit);
      amount = Math.max(1, Math.round(dmg));
      this.damageDealt += amount;
      if (!opts.noText) {
        this.floatText(hill.hitX + Phaser.Math.Between(-8, 8), hill.hitY - 14, String(amount), crit ? '#ffe14a' : '#e8c79a', crit ? 26 : opts.small ? 17 : 20);
      }
      this.dirtFx.explode(3, hill.hitX, hill.hitY);
      if (!opts.quiet) sfx.hillHit();
      if (!this.tweens.isTweening(hill.img)) this.tweens.add({ targets: hill.img, scaleY: hill.img.scaleX * 0.8, duration: 60, yoyo: true });
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
    }

    for (const t of hits) {
      this.hit(t, dmg, { hillFactor: w.hillMult, extraCrit: (w.fx === 'bonk' ? 0.15 : 0) + (w.critBonus || 0) });
      if (w.fx === 'stun' && t.kind === 'mole' && !t.obj.dead) t.obj.stunT = 1.6;
    }
    if (w.fx && hits.length) this.weaponFx(w.fx, hits[0]);
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
    // Jeder Bienenstock schickt regelmäßig zwei Bienen los
    for (const hive of this.hives) {
      hive.t -= dt;
      if (hive.t > 0) continue;
      hive.t = 5.5;
      if (!this.moles.some((m) => m.hittable)) continue;
      for (let i = 0; i < 2; i++) {
        this.helpers.push(new Bee(this, hive.x + Phaser.Math.Between(-6, 6), hive.y - 10 + Phaser.Math.Between(-4, 4)));
      }
      this.tweens.add({ targets: hive.sprite, scaleX: PX * 2, duration: 80, yoyo: true });
      sfx.buzz();
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
    if (this.cloud) this.cloud.grow();
    else {
      this.cloud = new Cloud(this);
      this.helpers.push(this.cloud);
    }
  }

  // Jedes Bienen-Upgrade stellt einen neuen Bienenstock an eine andere Stelle im Garten
  addBeehive() {
    const spot = BEEHIVES[this.hives.length % BEEHIVES.length];
    const sprite = this.add.image(spot.x, spot.y, 'beehive').setOrigin(0.5, 1).setScale(0).setDepth(-150);
    this.tweens.add({ targets: sprite, scale: PX * 1.8, duration: 400, ease: 'Back.Out' });
    this.hives.push({ x: spot.x, y: spot.y, sprite, t: 1 + this.hives.length * 1.1 });
    this.floatText(spot.x, spot.y - 40, 'Neuer Bienenstock!', '#ffe14a', 22, true);
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

  // Alle 20 Level: der Gigamaulwurf erscheint in der Mitte des Rasens
  spawnGiga() {
    this.gigaPending = false;
    const giga = new Mole(this, 'giga', D.moleHp(this.elapsed) * MOLE_KINDS.giga.hpMult, 1.4);
    giga.spawnAt = { x: LAWN.x + LAWN.w / 2, y: LAWN.y + LAWN.h / 2 + 40 };
    this.moles.push(giga);
    this.giga = giga;
    this.banner('GIGAMAULWURF!', '#ff3a3a', 'Er stampft auf den Boden und lässt überall Hügel wachsen!');
    sfx.boss();
    this.time.delayedCall(700, () => sfx.boss());
    this.cameras.main.shake(900, 0.006);
    if (this.gigaLabel) this.gigaLabel.destroy();
    this.gigaLabel = this.add
      .text(GAME_W / 2, LAWN.y + 6, 'GIGAMAULWURF', {
        fontFamily: TITLE_FONT,
        fontSize: '14px',
        color: '#ffcf6a',
        stroke: '#1e140d',
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setDepth(9050)
      .setVisible(false);
  }

  // Große Ankündigung, danach kommt Oma durch das Gartentor herein.
  startOmaIntro() {
    this.omaPending = false;
    this.omaArriving = true;
    this.scene.pause();
    this.scene.launch('OmaIntro');
  }

  spawnOma() {
    // Oma steht vom Terrassentisch auf und läuft auf den Rasen
    if (this.omaSitting) {
      this.tweens.killTweensOf(this.omaSitting);
      this.omaSitting.destroy();
      this.omaSitting = null;
    }
    this.oma = new Oma(this, OMA_SEAT.x, OMA_SEAT.y, LAWN.bottom - 30);
    this.banner('Oma ist da!', '#ff8a8a', 'Sie haut ab jetzt mit ihrer Bratpfanne mit.');
    this.time.addEvent({
      delay: 250,
      repeat: 8,
      callback: () => {
        if (!this.oma) return;
        const heart = this.add
          .text(this.oma.x + Phaser.Math.Between(-12, 12), this.oma.y - 40, '♥', { fontFamily: FONT, fontSize: '26px', color: '#ff5a7a', stroke: '#1e140d', strokeThickness: 4 })
          .setOrigin(0.5)
          .setDepth(9200);
        this.tweens.add({ targets: heart, y: heart.y - 34, alpha: 0, duration: 900, onComplete: () => heart.destroy() });
      },
    });
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

  swingFx(ang, arc, range) {
    const p = this.player;
    const dur = Math.min(140, this.attackCooldown * 700);
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

  weaponFx(fx, t) {
    const x = t.obj.hitX;
    const y = t.obj.hitY;
    if (fx === 'saw') this.dirtFx.explode(3, x, y);
    if (fx === 'splash') this.waterFx.explode(10, x, y);
    if (fx === 'bonk') this.cameras.main.shake(70, 0.003);
    if (this.time.now < (this.nextFxWord || 0)) return;
    this.nextFxWord = this.time.now + (fx === 'saw' ? 900 : 450);
    const [word, color] = FX_WORDS[fx];
    const txt = this.add
      .text(x + Phaser.Math.Between(-14, 14), y - 34, word, {
        fontFamily: TITLE_FONT,
        fontSize: '18px',
        color,
        stroke: '#1e140d',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(9150)
      .setAngle(Phaser.Math.Between(-15, 15))
      .setScale(0.4);
    this.tweens.add({ targets: txt, scale: 1, duration: 120, ease: 'Back.Out' });
    this.tweens.add({ targets: txt, alpha: 0, y: y - 56, delay: 350, duration: 300, onComplete: () => txt.destroy() });
    sfx[fx]?.();
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

  banner(msg, color, sub = null) {
    if (this.currentBanner) this.currentBanner.destroy();
    if (this.currentSub) this.currentSub.destroy();
    if (sub) {
      const st = this.add
        .text(GAME_W / 2, LAWN.y + 108, sub, {
          fontFamily: FONT,
          fontSize: '28px',
          color: '#ffffff',
          stroke: '#1e140d',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(9400);
      this.currentSub = st;
      this.tweens.add({ targets: st, alpha: 0, delay: 2600, duration: 500, onComplete: () => st.destroy() });
    }
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
      delay: sub ? 2600 : 1500,
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
    // Großer Lebensbalken für den Gigamaulwurf
    const gm = this.giga;
    if (gm && gm.hittable && this.gigaLabel) {
      const w = 520;
      const x = GAME_W / 2 - w / 2;
      const y = LAWN.y + 26;
      this.gigaLabel.setVisible(true);
      g.fillStyle(0x1e140d, 1).fillRect(x - 3, y - 3, w + 6, 18);
      g.fillStyle(0x5a1010, 1).fillRect(x, y, w, 12);
      g.fillStyle(0xe8302a, 1).fillRect(x, y, Math.max(0, (gm.hp / gm.maxHp) * w), 12);
      g.fillStyle(0xff8a7a, 1).fillRect(x, y, Math.max(0, (gm.hp / gm.maxHp) * w), 3);
    } else if (this.gigaLabel) this.gigaLabel.setVisible(false);
    for (const m of this.moles) {
      if (!m.hittable || m.def.giga) continue;
      const w = m.boss ? 60 : 30;
      const x = m.hitX - w / 2;
      const y = m.baseY - m.visH - 9;
      g.fillStyle(0x1e140d, 1).fillRect(x - 1, y - 1, w + 2, 6);
      g.fillStyle(0x5a1010, 1).fillRect(x, y, w, 4);
      g.fillStyle(0xe8302a, 1).fillRect(x, y, Math.max(0, (m.hp / m.maxHp) * w), 4);
      if (m.stunT > 0) {
        // Kreisende Sternchen über betäubten Maulwürfen
        for (let i = 0; i < 3; i++) {
          const a = this.elapsed * 6 + (i * Math.PI * 2) / 3;
          g.fillStyle(0xffe14a, 1).fillRect(m.hitX + Math.cos(a) * 14 - 2, y - 8 + Math.sin(a) * 4, 4, 4);
        }
      }
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
      gigaKills: this.gigaKills,
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
    const aps = (1 / this.attackCooldown).toFixed(1);
    this.hudStats.setText(
      `${w.name} (${TYPE_LABEL[w.type]})  |  Schaden ${Math.round(this.attackDamage)}  |  ` +
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
      if (this.level >= OMA_LEVEL && !this.oma) this.omaPending = true;
      if (this.level % 20 === 0) this.gigaPending = true;
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
      gigaKills: this.gigaKills,
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
