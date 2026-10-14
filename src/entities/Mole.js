import Phaser from 'phaser';
import { PX } from '../config.js';

// Maulwurfarten. from = ab welcher Spielzeit (s) sie auftauchen, weight = Häufigkeit.
// Fähigkeiten: armor (Schadensfaktor), dig (buddelt Extra-Hügel), flee (taucht bei
// Treffern ab), heal (heilt Nachbarn), babies (Junge beim Tod).
export const MOLE_KINDS = {
  normal: { tex: 'mole', name: 'Maulwurf', hpMult: 1, up: [2.5, 5.5], under: [1.2, 3.0], xp: 3, scale: PX, r: 20, from: 0, weight: 10 },
  fast: {
    tex: 'mole_fast',
    name: 'Flitzer',
    desc: 'Taucht nur ganz kurz auf – schnell sein!',
    hpMult: 0.6,
    up: [1.0, 2.2],
    under: [0.6, 1.6],
    xp: 4,
    scale: PX,
    r: 20,
    from: 50,
    weight: 3,
  },
  chill: {
    tex: 'mole_chill',
    name: 'Chiller',
    desc: 'Lässt sich Zeit und hält etwas mehr aus.',
    hpMult: 1.2,
    up: [5.0, 9.0],
    under: [1.5, 3.5],
    xp: 4,
    scale: PX,
    r: 20,
    from: 20,
    weight: 2,
  },
  scared: {
    tex: 'mole_scared',
    name: 'Angsthase',
    desc: 'Taucht bei einem Treffer sofort ab und woanders wieder auf!',
    hpMult: 0.8,
    up: [3.0, 6.0],
    under: [0.4, 0.9],
    xp: 5,
    scale: PX,
    r: 20,
    from: 40,
    weight: 2,
    flee: true,
  },
  dig: {
    tex: 'mole_dig',
    name: 'Buddler',
    desc: 'Buddelt neben sich zusätzliche Hügel!',
    hpMult: 1.1,
    up: [3.5, 6.5],
    under: [1.2, 3.0],
    xp: 5,
    scale: PX,
    r: 20,
    from: 70,
    weight: 2.5,
    dig: 2.4,
  },
  armor: {
    tex: 'mole_armor',
    name: 'Panzer-Maulwurf',
    desc: 'Stahlhelm! Nimmt nur halben Schaden.',
    hpMult: 1.2,
    up: [3.0, 6.0],
    under: [1.5, 3.0],
    xp: 6,
    scale: PX,
    r: 20,
    from: 100,
    weight: 2,
    armor: 0.5,
  },
  doc: {
    tex: 'mole_doc',
    name: 'Doktor-Maulwurf',
    desc: 'Heilt Maulwürfe und Hügel in seiner Nähe – zuerst erledigen!',
    hpMult: 1,
    up: [4.0, 7.0],
    under: [1.5, 3.0],
    xp: 6,
    scale: PX,
    r: 20,
    from: 140,
    weight: 1.3,
    heal: 2.2,
  },
  mama: {
    tex: 'mole_mama',
    name: 'Mama-Maulwurf',
    desc: 'Wenn sie erledigt wird, kommen ihre Babys raus!',
    hpMult: 1.5,
    up: [4.0, 7.0],
    under: [1.5, 3.0],
    xp: 6,
    scale: PX,
    r: 20,
    from: 170,
    weight: 1.3,
    babies: 3,
  },
  giga: {
    tex: 'mole_giga',
    name: 'Gigamaulwurf',
    hpMult: 30,
    up: [99999, 99999],
    under: [0.5, 0.5],
    xp: 120,
    scale: PX * 3,
    r: 58,
    boss: true,
    giga: true,
    slam: 2.8,
    from: Infinity,
    weight: 0,
  },
  baby: { tex: 'mole', name: 'Baby', hpMult: 0.3, up: [1.5, 3.0], under: [0.3, 0.8], xp: 1, scale: PX * 0.7, r: 15, from: Infinity, weight: 0 },
  boss: {
    tex: 'mole_boss',
    name: 'Boss-Maulwurf',
    hpMult: 8,
    up: [5.0, 8.0],
    under: [2.0, 4.0],
    xp: 30,
    scale: PX * 1.7,
    r: 34,
    boss: true,
    from: Infinity,
    weight: 0,
  },
};

const EMERGE_TIME = 0.35;
const DIVE_TIME = 0.4;

export class Mole {
  constructor(scene, kind, hp, delay) {
    this.scene = scene;
    this.kind = kind;
    this.def = MOLE_KINDS[kind];
    this.boss = !!this.def.boss;
    this.maxHp = hp;
    this.hp = hp;
    this.state = 'underground';
    this.timer = delay;
    this.t = 0;
    this.hill = null;
    this.dead = false;
    this.flash = 0;
    this.abilityT = this.def.dig || this.def.heal || this.def.slam || 0;
    this.fleeCd = 0;
    this.stunT = 0;
    this.wobble = Math.random() * 10;
    this.sprite = scene.add.image(0, 0, this.def.tex).setOrigin(0.5, 1).setScale(this.def.scale).setVisible(false);
    this.texW = this.sprite.frame.width;
    this.texH = this.sprite.frame.height;
    this.visH = 0;
  }

  get hittable() {
    return !this.dead && (this.state === 'emerging' || this.state === 'up' || this.state === 'diving');
  }

  get hitX() {
    return this.hill.x;
  }

  get hitY() {
    return this.baseY - Math.max(this.visH, 8) * 0.5;
  }

  get radius() {
    return this.def.r;
  }

  // Wie weit der Maulwurf aus dem Loch schaut (0..1)
  setFrac(f) {
    const v = Math.max(0, Math.min(this.texH, Math.round(this.texH * f)));
    this.sprite.setCrop(0, 0, this.texW, v);
    this.sprite.y = this.baseY + (this.texH - v) * this.def.scale;
    this.visH = v * this.def.scale;
  }

  emerge(hill) {
    this.hill = hill;
    hill.mole = this;
    this.baseY = hill.holeY;
    this.sprite.setPosition(hill.x, this.baseY).setDepth(hill.y + 0.5).setVisible(true).setRotation(0);
    this.state = 'emerging';
    this.t = 0;
    this.setFrac(0);
  }

  update(dt, upMult) {
    if (this.dead) return;
    if (this.fleeCd > 0) this.fleeCd -= dt;
    if (this.stunT > 0) this.stunT -= dt;
    if (this.flash > 0) {
      this.flash -= dt;
      if (this.flash <= 0) this.sprite.clearTint();
    }
    switch (this.state) {
      case 'underground':
        this.timer -= dt;
        if (this.timer <= 0) this.scene.moleWantsToEmerge(this);
        break;
      case 'emerging':
        this.t += dt;
        this.setFrac(Phaser.Math.Easing.Back.Out(Math.min(1, this.t / EMERGE_TIME)));
        if (this.t >= EMERGE_TIME) {
          this.state = 'up';
          this.timer = Phaser.Math.FloatBetween(this.def.up[0], this.def.up[1]) * upMult;
          this.setFrac(1);
        }
        break;
      case 'up': {
        // Betäubt (Gummihuhn): kann nicht abtauchen
        if (this.stunT <= 0) this.timer -= dt;
        this.wobble += dt;
        // Chillen: leichtes Atmen, kurz vor dem Abtauchen nervöses Zittern
        const nervous = this.timer < 0.8;
        const sq = nervous ? Math.sin(this.wobble * 40) * 0.06 : Math.sin(this.wobble * 3) * 0.03;
        this.sprite.setScale(this.def.scale * (1 + sq), this.def.scale * (1 - sq));
        this.sprite.setRotation(nervous ? Math.sin(this.wobble * 35) * 0.08 : Math.sin(this.wobble * 1.3) * 0.05);
        if (this.abilityT > 0) {
          this.abilityT -= dt;
          if (this.abilityT <= 0) {
            this.abilityT = this.def.dig || this.def.heal || this.def.slam;
            this.scene.onMoleAbility(this);
          }
        }
        if (this.timer <= 0) {
          this.state = 'diving';
          this.t = 0;
          this.sprite.setScale(this.def.scale).setRotation(0);
          this.scene.onMoleDive(this);
        }
        break;
      }
      case 'diving':
        this.t += dt;
        this.setFrac(1 - Math.min(1, this.t / DIVE_TIME));
        if (this.t >= DIVE_TIME) {
          this.hill.mole = null;
          this.hill = null;
          this.sprite.setVisible(false);
          this.state = 'underground';
          this.timer = Phaser.Math.FloatBetween(this.def.under[0], this.def.under[1]);
        }
        break;
      default:
        break;
    }
  }

  // Angsthase: sofort abtauchen
  flee() {
    if (this.state !== 'up' && this.state !== 'emerging') return false;
    if (this.fleeCd > 0) return false;
    this.fleeCd = 2.5;
    this.state = 'diving';
    this.t = DIVE_TIME * 0.5;
    this.sprite.setScale(this.def.scale).setRotation(0);
    this.timer = 0;
    return true;
  }

  hitFlash() {
    this.sprite.setTintFill(0xffffff);
    this.flash = 0.07;
  }

  die() {
    this.dead = true;
    this.state = 'dead';
    if (this.hill) this.hill.mole = null;
    const s = this.sprite;
    s.clearTint();
    const deadTex = `${this.def.tex}_dead`;
    s.setTexture(this.scene.textures.exists(deadTex) ? deadTex : 'mole_dead');
    s.setCrop();
    s.y = this.baseY;
    s.setScale(this.def.scale);
    this.scene.tweens.add({
      targets: s,
      y: s.y - 26,
      angle: Phaser.Math.RND.pick([-1, 1]) * 200,
      alpha: 0,
      scale: this.def.scale * 0.6,
      duration: 650,
      ease: 'Quad.Out',
      onComplete: () => s.destroy(),
    });
  }
}
