import { FONT } from '../config.js';
import { formatTime } from '../systems/leaderboard.js';

const pad = (v, n) => String(v).padStart(n, ' ');
const name12 = (n) => String(n).padEnd(12, ' ').slice(0, 12);

const FORMATS = {
  short: {
    header: () => `  #  ${name12('Name')} ${pad('Punkte', 7)}  ${pad('Zeit', 5)}`,
    row: (i, e) => `${pad(i + 1, 3)}  ${name12(e.name)} ${pad(e.score, 7)}  ${pad(formatTime(e.time), 5)}`,
  },
  full: {
    header: () =>
      `  #  ${name12('Name')} ${pad('Punkte', 7)}  ${pad('Maulw.', 6)}  ${pad('Hügel', 5)}  ${pad('Zeit', 6)}  Lv`,
    row: (i, e) =>
      `${pad(i + 1, 3)}  ${name12(e.name)} ${pad(e.score, 7)}  ${pad(e.kills, 6)}  ${pad(e.hills, 5)}  ` +
      `${pad(formatTime(e.time), 6)}  ${pad(e.level, 2)}`,
  },
};

// Scrollbare Liste für bis zu 100 Einträge (Mausrad oder scroll())
export class LeaderboardView {
  constructor(scene, x, y, { rows = 10, rowH = 28, fontSize = 24, format = 'short', width = 380, depth = 10 } = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.rowsN = rows;
    this.rowH = rowH;
    this.width = width;
    this.fmt = FORMATS[format];
    this.entries = [];
    this.highlight = -1;
    this.offset = 0;
    const style = { fontFamily: FONT, fontSize: `${fontSize}px`, color: '#f3ead2' };
    this.header = scene.add.text(x, y, this.fmt.header(), { ...style, color: '#9fe870' }).setDepth(depth);
    this.rows = [];
    for (let i = 0; i < rows; i++) {
      this.rows.push(scene.add.text(x, y + (i + 1) * rowH, '', style).setDepth(depth));
    }
    this.status = scene.add
      .text(x + width / 2, y + (rows / 2 + 1) * rowH, '', { ...style, color: '#c9b99a', align: 'center' })
      .setOrigin(0.5)
      .setDepth(depth);
    this.bar = scene.add.graphics().setDepth(depth);
    this.objects = [this.header, ...this.rows, this.status, this.bar];

    // Mausrad über der Liste scrollt
    this.onWheel = (pointer, over, dx, dy) => {
      const inside =
        pointer.x >= x - 10 && pointer.x <= x + width + 20 && pointer.y >= y && pointer.y <= y + (rows + 1) * rowH;
      if (inside) this.scroll(Math.sign(dy) * 3);
    };
    scene.input.on('wheel', this.onWheel);
  }

  setEntries(entries, highlight = -1) {
    this.entries = entries || [];
    this.highlight = highlight;
    this.status.setText('');
    // Eigenen Eintrag sichtbar machen
    if (highlight >= 0) this.offset = Math.max(0, Math.min(highlight - Math.floor(this.rowsN / 2), this.maxOffset));
    else this.offset = 0;
    this.render();
  }

  setStatus(msg) {
    this.entries = [];
    this.render();
    this.status.setText(msg);
  }

  get maxOffset() {
    return Math.max(0, this.entries.length - this.rowsN);
  }

  scroll(delta) {
    this.offset = Math.max(0, Math.min(this.maxOffset, this.offset + delta));
    this.render();
  }

  render() {
    this.rows.forEach((t, i) => {
      const idx = this.offset + i;
      const e = this.entries[idx];
      t.setText(e ? this.fmt.row(idx, e) : '');
      t.setColor(idx === this.highlight ? '#ffe14a' : idx === 0 ? '#ffcf6a' : '#f3ead2');
    });
    // kleine Scrollleiste
    const g = this.bar;
    g.clear();
    if (this.entries.length > this.rowsN) {
      const h = this.rowsN * this.rowH;
      const top = this.y + this.rowH;
      const knobH = Math.max(16, (h * this.rowsN) / this.entries.length);
      const knobY = top + ((h - knobH) * this.offset) / this.maxOffset;
      g.fillStyle(0x1e140d, 0.8).fillRect(this.x + this.width + 8, top, 6, h);
      g.fillStyle(0x9fe870, 1).fillRect(this.x + this.width + 8, knobY, 6, knobH);
    }
  }

  setVisible(v) {
    this.objects.forEach((o) => o.setVisible(v));
  }

  destroy() {
    this.scene.input.off('wheel', this.onWheel);
    this.objects.forEach((o) => o.destroy());
  }
}
