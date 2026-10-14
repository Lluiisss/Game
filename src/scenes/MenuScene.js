import Phaser from 'phaser';
import { GAME_W, GAME_H, PX, HUD_H, LAWN, FONT, TITLE_FONT } from '../config.js';
import { loadScores } from '../systems/leaderboard.js';
import { sfx, toggleMute, isMuted } from '../audio/sfx.js';
import { music } from '../audio/music.js';
import { addButterflies } from '../gfx/ambient.js';
import { VolumeSliders } from '../ui/VolumeSliders.js';
import { LeaderboardView } from '../ui/LeaderboardView.js';
import { fetchOnlineScores } from '../systems/firebase.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.add.image(0, HUD_H, 'garden').setOrigin(0).setScale(PX);
    this.add.rectangle(0, 0, GAME_W, HUD_H, 0x3b2716).setOrigin(0);

    // Dekorative Maulwürfe, die im Hintergrund auftauchen
    this.decoTimer = this.time.addEvent({ delay: 900, loop: true, callback: () => this.decoMole() });

    addButterflies(this, 6);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0804, 0.35).setOrigin(0).setDepth(5);

    const title = this.add
      .text(GAME_W / 2, 112, 'MAULWURF-ALARM!', {
        fontFamily: TITLE_FONT,
        fontSize: '44px',
        color: '#ffe14a',
        stroke: '#1e140d',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: title, y: 118, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.add
      .text(GAME_W / 2, 168, 'Opa verteidigt seinen Rasen', {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#f3ead2',
        stroke: '#1e140d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Opa + Rechen
    const opa = this.add.image(GAME_W / 2 - 40, 318, 'opa_down_0').setScale(PX * 2.5).setOrigin(0.5, 1).setDepth(10);
    this.add.image(GAME_W / 2 - 10, 304, 'w_rake').setScale(PX * 2.5).setOrigin(0.5, 1).setRotation(0.35).setDepth(9);
    this.add.image(GAME_W / 2 + 70, 320, 'hill_0').setScale(PX * 2.5).setOrigin(0.5, 1).setDepth(10);
    const mole = this.add.image(GAME_W / 2 + 70, 284, 'mole').setScale(PX * 2.5).setOrigin(0.5, 1).setDepth(10);
    this.tweens.add({ targets: mole, scaleY: PX * 2.3, duration: 500, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: opa, angle: 4, duration: 400, yoyo: true, repeat: -1 });
    const oma = this.add.image(GAME_W / 2 - 130, 318, 'oma_side_0').setScale(PX * 2.2).setOrigin(0.5, 1).setDepth(10);
    this.tweens.add({ targets: oma, y: 312, duration: 300, yoyo: true, repeat: -1 });
    this.add.image(GAME_W / 2 + 170, 318, 'w_scythe').setScale(PX * 2).setOrigin(0.5, 1).setRotation(-0.5).setDepth(10);

    this.panel(124, 340, 400, 410, 'SO GEHT\'S');
    const help = [
      'Pfeiltasten / WASD  laufen',
      'Opa haut automatisch zu!',
      'P / ESC  Pause    M  Ton',
      '',
      'Maulwürfe tauchen mit einem',
      'Hügel auf und wieder ab.',
      'Hau die Maulwürfe UND die',
      'Hügel weg! Ist der Rasen zu',
      'verhügelt: Game Over.',
      '',
      'Level-Up = Upgrades, später',
      'neue Gartengeräte und Helfer.',
      'Ab Level 15 hilft Oma mit.',
      'Achtung, Bosse!',
    ];
    this.add
      .text(144, 380, help.join('\n'), { fontFamily: FONT, fontSize: '25px', color: '#f3ead2', lineSpacing: 1 })
      .setDepth(10);

    this.panel(564, 340, 400, 410, 'BESTENLISTE');
    this.boardTab = this.add
      .text(764, 388, '', { fontFamily: FONT, fontSize: '21px', color: '#c9b99a' })
      .setOrigin(0.5)
      .setDepth(10);
    this.board = new LeaderboardView(this, 582, 404, { rows: 10, rowH: 30, fontSize: 24, format: 'short', width: 350 });
    this.boardSource = 'online';
    this.online = undefined;
    this.showBoard();
    fetchOnlineScores()
      .then((list) => (this.online = list))
      .catch(() => (this.online = null))
      .finally(() => {
        if (this.scene.isActive()) this.showBoard();
      });
    this.input.keyboard.on('keydown-T', () => {
      this.boardSource = this.boardSource === 'online' ? 'local' : 'online';
      this.showBoard();
    });

    const start = this.add
      .text(GAME_W / 2, 792, 'LEERTASTE / ENTER zum Starten', {
        fontFamily: TITLE_FONT,
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#1e140d',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    this.sliders = new VolumeSliders(this, GAME_W - 400, 24, { width: 180, gap: 38, fontSize: 22 });
    this.input.keyboard.on('keydown', (e) => this.sliders.handleKey(e));
    this.muteText = this.add
      .text(12, 46, '', { fontFamily: FONT, fontSize: '22px', color: '#c9b99a' })
      .setOrigin(0, 0)
      .setDepth(10);
    this.updateMuteText();

    this.add
      .text(12, 8, 'Highscores: online (Top 100) und auf diesem Gerät', {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#8a7a5a',
      })
      .setDepth(10);

    music.play('menu');
    this.events.once('shutdown', () => music.stop());

    let started = false;
    const go = (e) => {
      if ((e && e.repeat) || started) return;
      started = true;
      sfx.unlock();
      sfx.select();
      this.scene.start('Game');
    };
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.keyboard.on('keydown-M', () => {
      toggleMute();
      this.updateMuteText();
    });
    // Klick startet das Spiel – außer auf den Lautstärke-Reglern
    this.input.on('pointerdown', (p, over) => {
      if (!over.length) go();
    });
  }

  showBoard() {
    const online = this.boardSource === 'online';
    this.boardTab.setText(online ? 'Online (Top 100)  ·  T: Dieses Gerät' : 'Dieses Gerät  ·  T: Online');
    if (online) {
      if (this.online === undefined) this.board.setStatus('Lade Online-Bestenliste …');
      else if (this.online === null) this.board.setStatus('Online-Liste nicht\nerreichbar.\nT: lokale Liste');
      else if (!this.online.length) this.board.setStatus('Noch keine Einträge.\nSei der Erste!');
      else this.board.setEntries(this.online);
    } else {
      const local = loadScores();
      if (!local.length) this.board.setStatus('Noch keine Einträge.\nSei der Erste!');
      else this.board.setEntries(local);
    }
  }

  updateMuteText() {
    this.muteText.setText(`M: Ton ${isMuted() ? 'aus' : 'an'}`);
  }

  panel(x, y, w, h, title) {
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x1e140d, 0.6).fillRoundedRect(x + 4, y + 6, w, h, 10);
    g.fillStyle(0x3b2716, 0.92).fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(3, 0x6e4a26, 1).strokeRoundedRect(x, y, w, h, 10);
    this.add
      .text(x + w / 2, y + 22, title, { fontFamily: TITLE_FONT, fontSize: '16px', color: '#ffe14a' })
      .setOrigin(0.5)
      .setDepth(10);
  }

  decoMole() {
    const x = Phaser.Math.Between(LAWN.x + 30, LAWN.right - 30);
    const y = Phaser.Math.Between(LAWN.y + 30, LAWN.bottom - 10);
    const hill = this.add.image(x, y, `hill_${Phaser.Math.Between(0, 2)}`).setOrigin(0.5, 1).setScale(0).setDepth(1);
    const mole = this.add
      .image(x, y - 14, Phaser.Math.RND.pick(['mole', 'mole', 'mole_chill', 'mole_fast']))
      .setOrigin(0.5, 1)
      .setScale(PX, 0)
      .setDepth(2);
    this.tweens.add({ targets: hill, scale: PX, duration: 250, ease: 'Back.Out' });
    this.tweens.add({
      targets: mole,
      scaleY: PX,
      duration: 250,
      delay: 150,
      hold: 1400,
      yoyo: true,
      onComplete: () => {
        mole.destroy();
        this.tweens.add({ targets: hill, alpha: 0, delay: 800, duration: 600, onComplete: () => hill.destroy() });
      },
    });
  }
}
