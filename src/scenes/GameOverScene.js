import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, FONT, TITLE_FONT } from '../config.js';
import { loadScores, qualifies, addScore, lastName, saveName, formatTime } from '../systems/leaderboard.js';
import { sfx } from '../audio/sfx.js';

const NAME_MAX = 12;

const row = (rank, name, score, kills, hills, time, level) =>
  `${rank}  ${String(name).padEnd(12, ' ').slice(0, 12)} ${String(score).padStart(7, ' ')}  ` +
  `${String(kills).padStart(6, ' ')}  ${String(hills).padStart(5, ' ')}  ${String(time).padStart(6, ' ')}  ` +
  `${String(level).padStart(2, ' ')}`;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
    this.mode = qualifies(data.score) ? 'name' : 'board';
    this.name = lastName();
    this.myIndex = -1;
  }

  create() {
    this.add.image(0, HUD_H, 'garden').setOrigin(0).setScale(PX);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0804, 0.75).setOrigin(0);
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.add
      .text(GAME_W / 2, 56, 'GAME OVER', {
        fontFamily: TITLE_FONT,
        fontSize: '40px',
        color: '#ff5a4a',
        stroke: '#1e140d',
        strokeThickness: 10,
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 104, 'Die Maulwürfe haben Opas Rasen erobert.', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#f3ead2',
      })
      .setOrigin(0.5);

    const r = this.result;
    const stats = [
      ['Überlebt', formatTime(r.time)],
      ['Maulwürfe erledigt', `${r.kills}${r.bossKills ? ` (davon ${r.bossKills} Boss)` : ''}`],
      ['Hügel entfernt', String(r.hillsRemoved)],
      ['Level erreicht', String(r.level)],
      ['Letzte Waffe', r.weapon],
      ['Gesamtschaden', String(r.damage)],
    ];
    stats.forEach(([k, v], i) => {
      this.add.text(GAME_W / 2 - 290, 160 + i * 32, k, { fontFamily: FONT, fontSize: '26px', color: '#c9b99a' });
      this.add.text(GAME_W / 2 + 170, 160 + i * 32, v, { fontFamily: FONT, fontSize: '26px', color: '#ffffff' }).setOrigin(1, 0);
    });
    this.add
      .text(GAME_W / 2, 380, `PUNKTE: ${r.score}`, {
        fontFamily: TITLE_FONT,
        fontSize: '26px',
        color: '#ffe14a',
        stroke: '#1e140d',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.lower = this.add.container(0, 0);
    if (this.mode === 'name') this.showNameEntry();
    else this.showBoard();

    this.input.keyboard.on('keydown', (e) => this.onKey(e));
  }

  showNameEntry() {
    this.lower.removeAll(true);
    this.lower.add(
      this.add
        .text(GAME_W / 2, 460, 'Neuer Eintrag in der Bestenliste! Wie heißt du?', {
          fontFamily: FONT,
          fontSize: '30px',
          color: '#9fe870',
        })
        .setOrigin(0.5),
    );
    const box = this.add.graphics();
    box.fillStyle(0x1e140d, 1).fillRect(GAME_W / 2 - 180, 500, 360, 56);
    box.lineStyle(3, 0xffe14a, 1).strokeRect(GAME_W / 2 - 180, 500, 360, 56);
    this.lower.add(box);
    this.nameText = this.add
      .text(GAME_W / 2, 528, '', { fontFamily: FONT, fontSize: '40px', color: '#ffffff' })
      .setOrigin(0.5);
    this.lower.add(this.nameText);
    this.lower.add(
      this.add
        .text(GAME_W / 2, 585, 'Tippen · Backspace löschen · ENTER speichern', {
          fontFamily: FONT,
          fontSize: '24px',
          color: '#c9b99a',
        })
        .setOrigin(0.5),
    );
    this.cursorOn = true;
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => {
        this.cursorOn = !this.cursorOn;
        this.renderName();
      },
    });
    this.renderName();
  }

  renderName() {
    if (this.mode !== 'name' || !this.nameText) return;
    this.nameText.setText(this.name + (this.cursorOn && this.name.length < NAME_MAX ? '_' : ' '));
  }

  showBoard() {
    this.mode = 'board';
    this.boardReadyAt = this.time.now + 400;
    this.lower.removeAll(true);
    const scores = loadScores();
    this.lower.add(
      this.add
        .text(GAME_W / 2, 435, 'BESTENLISTE', { fontFamily: TITLE_FONT, fontSize: '16px', color: '#9fe870' })
        .setOrigin(0.5),
    );
    this.lower.add(
      this.add.text(GAME_W / 2 - 290, 460, row(' #', 'Name', 'Punkte', 'Maulw.', 'Hügel', 'Zeit', 'Lv'), {
        fontFamily: FONT,
        fontSize: '23px',
        color: '#c9b99a',
      }),
    );
    scores.forEach((s, i) => {
      const line = row(String(i + 1).padStart(2, ' '), s.name, s.score, s.kills, s.hills, formatTime(s.time), s.level);
      const mine = i === this.myIndex;
      this.lower.add(
        this.add.text(GAME_W / 2 - 290, 486 + i * 25, line, {
          fontFamily: FONT,
          fontSize: '23px',
          color: mine ? '#ffe14a' : '#f3ead2',
        }),
      );
    });
    if (!scores.length) {
      this.lower.add(
        this.add
          .text(GAME_W / 2, 540, 'Noch keine Einträge.', { fontFamily: FONT, fontSize: '26px', color: '#c9b99a' })
          .setOrigin(0.5),
      );
    }
    const hint = this.add
      .text(GAME_W / 2, 792, 'ENTER / LEERTASTE: Nochmal spielen   ·   ESC: Hauptmenü', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    this.lower.add(hint);
  }

  onKey(e) {
    if (this.mode === 'name') {
      if (e.key === 'Enter') {
        this.saveEntry();
      } else if (e.key === 'Backspace') {
        this.name = this.name.slice(0, -1);
        this.renderName();
      } else if (e.key.length === 1 && /[\wäöüÄÖÜß .\-!]/.test(e.key) && this.name.length < NAME_MAX) {
        this.name += e.key;
        this.renderName();
      }
      return;
    }
    if (e.repeat || this.time.now < this.boardReadyAt) return;
    if (e.key === 'Enter' || e.code === 'Space') {
      sfx.select();
      this.scene.start('Game');
    } else if (e.key === 'Escape') {
      this.scene.start('Menu');
    }
  }

  saveEntry() {
    const name = this.name.trim() || 'Opa';
    saveName(name);
    const r = this.result;
    const entry = {
      name,
      score: r.score,
      kills: r.kills,
      hills: r.hillsRemoved,
      time: Math.floor(r.time),
      level: r.level,
      date: new Date().toISOString().slice(0, 10),
    };
    this.myIndex = addScore(entry);
    sfx.levelUp();
    this.time.removeAllEvents();
    this.showBoard();
  }
}
