import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, FONT, TITLE_FONT } from '../config.js';
import { loadScores, addScore, lastName, saveName, formatTime } from '../systems/leaderboard.js';
import { fetchOnlineScores, qualifiesOnline, submitOnlineScore, ONLINE_MAX } from '../systems/firebase.js';
import { LeaderboardView } from '../ui/LeaderboardView.js';
import { sfx } from '../audio/sfx.js';

const NAME_MAX = 12;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
    // Mit Punkten trägt man sich mit seinem Namen ein
    this.mode = data.score > 0 ? 'name' : 'board';
    this.name = lastName();
    this.myIndex = -1;
    this.myId = null;
    this.boardSource = 'online';
    this.boardMsg = '';
    this.online = undefined;
    // Online-Liste schon mal im Hintergrund laden
    this.onlinePromise = fetchOnlineScores()
      .then((list) => (this.online = list))
      .catch(() => (this.online = null));
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
    this.onlinePromise.then(() => {
      if (this.scene.isActive() && this.mode === 'board' && this.boardSource === 'online') this.showBoard();
    });
  }

  showNameEntry() {
    this.lower.removeAll(true);
    this.lower.add(
      this.add
        .text(GAME_W / 2, 460, 'Trag dich in die Bestenliste ein! Wie heißt du?', {
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
    if (this.board) this.board.destroy();
    const online = this.boardSource === 'online';
    this.lower.add(
      this.add
        .text(GAME_W / 2, 425, online ? `ONLINE-BESTENLISTE (TOP ${ONLINE_MAX})` : 'BESTENLISTE (DIESES GERÄT)', {
          fontFamily: TITLE_FONT,
          fontSize: '16px',
          color: '#9fe870',
        })
        .setOrigin(0.5),
    );
    this.board = new LeaderboardView(this, GAME_W / 2 - 310, 446, {
      rows: 10,
      rowH: 26,
      fontSize: 23,
      format: 'full',
      width: 610,
    });
    if (online) {
      if (this.online === undefined) this.board.setStatus('Lade Online-Bestenliste …');
      else if (this.online === null) this.board.setStatus('Online-Bestenliste nicht erreichbar.\nT: lokale Liste anzeigen');
      else if (!this.online.length) this.board.setStatus('Noch keine Einträge. Sei der Erste!');
      else this.board.setEntries(this.online, this.online.findIndex((e) => e.id === this.myId));
    } else {
      const local = loadScores();
      if (!local.length) this.board.setStatus('Noch keine Einträge.');
      else this.board.setEntries(local, this.myIndex);
    }
    if (this.boardMsg) {
      this.lower.add(
        this.add
          .text(GAME_W / 2, 744, this.boardMsg, { fontFamily: FONT, fontSize: '24px', color: '#ffcf6a' })
          .setOrigin(0.5),
      );
    }
    const hint = this.add
      .text(GAME_W / 2, 792, 'ENTER: Nochmal  ·  ESC: Menü  ·  T: Online/Gerät  ·  ↑↓ / Mausrad: blättern', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    this.lower.add(hint);
  }

  showSaving() {
    this.mode = 'saving';
    this.lower.removeAll(true);
    this.lower.add(
      this.add
        .text(GAME_W / 2, 540, 'Speichere in der Online-Bestenliste …', {
          fontFamily: FONT,
          fontSize: '30px',
          color: '#9fe870',
        })
        .setOrigin(0.5),
    );
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
    if (this.mode !== 'board') return;
    if (e.code === 'ArrowUp') this.board?.scroll(-1);
    if (e.code === 'ArrowDown') this.board?.scroll(1);
    if (e.repeat || this.time.now < this.boardReadyAt) return;
    if (e.code === 'KeyT') {
      this.boardSource = this.boardSource === 'online' ? 'local' : 'online';
      this.showBoard();
    } else if (e.key === 'Enter' || e.code === 'Space') {
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
    this.submitOnline(entry);
  }

  // Online nur eintragen, wenn es für die Top 100 reicht
  async submitOnline(entry) {
    this.showSaving();
    await this.onlinePromise;
    if (this.online === null) {
      this.boardSource = 'local';
      this.boardMsg = 'Online-Liste nicht erreichbar – lokal gespeichert.';
    } else if (!qualifiesOnline(entry.score, this.online)) {
      this.boardMsg = `Für die Online-Top-${ONLINE_MAX} hat es diesmal nicht gereicht.`;
    } else {
      try {
        this.myId = await submitOnlineScore(entry);
        this.online = await fetchOnlineScores();
        const rank = this.online.findIndex((e) => e.id === this.myId) + 1;
        this.boardMsg = rank > 0 ? `Online eingetragen – Platz ${rank}!` : 'Online eingetragen!';
      } catch {
        this.boardMsg = 'Online-Speichern fehlgeschlagen – lokal gespeichert.';
      }
    }
    if (this.scene.isActive()) this.showBoard();
  }
}
