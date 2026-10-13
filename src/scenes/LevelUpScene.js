import Phaser from 'phaser';
import { GAME_W, GAME_H, FONT, TITLE_FONT } from '../config.js';
import { TYPE_LABEL } from '../data/weapons.js';
import { sfx } from '../audio/sfx.js';

const CARD_W = 260;
const CARD_H = 340;

export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUp');
  }

  init(data) {
    this.choices = data.choices;
    this.onPick = data.onPick;
    this.level = data.level;
    this.sel = 0;
    this.ready = false;
    this.done = false;
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0804, 0.7).setOrigin(0);
    const title = this.add
      .text(GAME_W / 2, 150, `LEVEL ${this.level}!`, {
        fontFamily: TITLE_FONT,
        fontSize: '36px',
        color: '#9fe870',
        stroke: '#1e140d',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setScale(0.4);
    this.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.Out' });
    this.add
      .text(GAME_W / 2, 200, 'Such dir eine Verbesserung aus', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#f3ead2',
      })
      .setOrigin(0.5);

    const n = this.choices.length;
    const gap = 30;
    const total = n * CARD_W + (n - 1) * gap;
    this.cards = this.choices.map((c, i) => {
      const x = GAME_W / 2 - total / 2 + CARD_W / 2 + i * (CARD_W + gap);
      return this.makeCard(c, i, x, 420);
    });

    this.add
      .text(GAME_W / 2, 625, '← → auswählen   ·   LEERTASTE / ENTER bestätigen   ·   oder 1 / 2 / 3', {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#c9b99a',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown', (e) => {
      if (e.repeat || !this.ready) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.select((this.sel + n - 1) % n);
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.select((this.sel + 1) % n);
          break;
        case 'Space':
        case 'Enter':
          this.pick(this.sel);
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3': {
          const i = Number(e.code.slice(-1)) - 1;
          if (i < n) this.pick(i);
          break;
        }
        default:
          break;
      }
    });

    this.select(0, true);
    // Kurze Sperre, damit eine noch gedrückte Leertaste nicht sofort etwas auswählt.
    this.time.delayedCall(450, () => {
      this.ready = true;
    });
  }

  makeCard(choice, i, x, y) {
    const isWeapon = choice.type === 'weapon';
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    c.add(g);

    const icon = this.add.image(0, -95, isWeapon ? choice.weapon.tex : choice.up.icon).setScale(isWeapon ? 3 : 5);
    if (isWeapon) icon.setRotation(0.6);
    c.add(icon);

    const name = isWeapon ? choice.weapon.name : choice.up.name;
    const desc = isWeapon ? choice.weapon.desc : choice.up.desc;
    let sub;
    if (isWeapon) {
      const w = choice.weapon;
      sub = `NEUE WAFFE · ${TYPE_LABEL[w.type]}\nSchaden ${w.damage} · ${(1 / w.cooldown).toFixed(1)}/s · Reichw. ${w.range}`;
    } else {
      sub = choice.up.max >= 99 ? 'Sofort-Effekt' : `Stufe ${choice.level} / ${choice.up.max}`;
    }

    c.add(
      this.add
        .text(0, -20, name, {
          fontFamily: FONT,
          fontSize: '30px',
          color: isWeapon ? '#ffe14a' : '#ffffff',
          align: 'center',
          wordWrap: { width: CARD_W - 24 },
        })
        .setOrigin(0.5, 0),
    );
    c.add(
      this.add
        .text(0, 20, sub, {
          fontFamily: FONT,
          fontSize: '20px',
          color: isWeapon ? '#ffcf6a' : '#9fe870',
          align: 'center',
        })
        .setOrigin(0.5, 0),
    );
    c.add(
      this.add
        .text(0, isWeapon ? 72 : 56, desc, {
          fontFamily: FONT,
          fontSize: '23px',
          color: '#f3ead2',
          align: 'center',
          wordWrap: { width: CARD_W - 30 },
        })
        .setOrigin(0.5, 0),
    );
    c.add(
      this.add
        .text(CARD_W / 2 - 14, -CARD_H / 2 + 14, `[${i + 1}]`, { fontFamily: FONT, fontSize: '22px', color: '#c9b99a' })
        .setOrigin(1, 0),
    );

    const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => this.select(i));
    zone.on('pointerdown', () => {
      if (this.ready) this.pick(i);
    });
    c.add(zone);

    c.setData({ g, isWeapon });
    return c;
  }

  drawCard(card, selected) {
    const g = card.getData('g');
    const isWeapon = card.getData('isWeapon');
    g.clear();
    g.fillStyle(0x1e140d, 1).fillRoundedRect(-CARD_W / 2 + 4, -CARD_H / 2 + 6, CARD_W, CARD_H, 10);
    g.fillStyle(isWeapon ? 0x5a3d14 : 0x3b5a26, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10);
    g.fillStyle(isWeapon ? 0x6e4c1a : 0x47692f, 1).fillRoundedRect(-CARD_W / 2 + 8, -CARD_H / 2 + 8, CARD_W - 16, 110, 8);
    g.lineStyle(selected ? 5 : 3, selected ? 0xffe14a : isWeapon ? 0xc4901a : 0x2a3f1a, 1);
    g.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10);
  }

  select(i, silent = false) {
    if (this.sel !== i && !silent) sfx.move();
    this.sel = i;
    this.cards.forEach((c, idx) => {
      this.drawCard(c, idx === i);
      this.tweens.killTweensOf(c);
      this.tweens.add({ targets: c, scale: idx === i ? 1.06 : 0.96, y: idx === i ? 410 : 420, duration: 120 });
    });
  }

  pick(i) {
    if (this.done) return;
    this.done = true;
    sfx.select();
    this.onPick(this.choices[i]);
    this.scene.stop();
    this.scene.resume('Game');
  }
}
