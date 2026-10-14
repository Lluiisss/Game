import { FONT } from '../config.js';
import { getVolume, setVolume, sfx } from '../audio/sfx.js';

// Zwei Schieberegler (Musik / Sounds). Bedienbar mit der Maus oder mit
// ↑ ↓ (Regler wählen) und ← → (lauter/leiser).
export class VolumeSliders {
  constructor(scene, x, y, { width = 200, gap = 36, depth = 20, fontSize = 24 } = {}) {
    this.scene = scene;
    this.x0 = x + 96;
    this.width = width;
    this.sel = 0;
    this.items = [
      { kind: 'music', name: 'Musik' },
      { kind: 'sfx', name: 'Sounds' },
    ];
    this.items.forEach((it, i) => {
      const yy = y + i * gap;
      it.label = scene.add
        .text(x, yy, it.name, { fontFamily: FONT, fontSize: `${fontSize}px`, color: '#f3ead2' })
        .setOrigin(0, 0.5)
        .setDepth(depth);
      it.track = scene.add
        .rectangle(this.x0, yy, width, 10, 0x1e140d)
        .setOrigin(0, 0.5)
        .setStrokeStyle(2, 0x6e4a26)
        .setDepth(depth)
        .setInteractive({ useHandCursor: true });
      it.fill = scene.add.rectangle(this.x0, yy, 0, 6, 0x9fe870).setOrigin(0, 0.5).setDepth(depth);
      it.knob = scene.add
        .rectangle(this.x0, yy, 14, 24, 0xffe14a)
        .setStrokeStyle(2, 0x1e140d)
        .setDepth(depth + 1)
        .setInteractive({ useHandCursor: true, draggable: true });
      it.pct = scene.add
        .text(this.x0 + width + 14, yy, '', { fontFamily: FONT, fontSize: `${fontSize}px`, color: '#c9b99a' })
        .setOrigin(0, 0.5)
        .setDepth(depth);
      const setFromX = (px) => this.set(i, (px - this.x0) / width);
      it.track.on('pointerdown', (p) => setFromX(p.x));
      it.knob.on('drag', (p, dragX) => setFromX(dragX));
    });
    this.refresh();
  }

  set(i, value) {
    this.sel = i;
    setVolume(this.items[i].kind, Math.round(value * 20) / 20);
    if (this.items[i].kind === 'sfx') sfx.move();
    this.refresh();
  }

  refresh() {
    this.items.forEach((it, i) => {
      const v = getVolume(it.kind);
      it.fill.width = v * this.width;
      it.knob.x = this.x0 + v * this.width;
      it.pct.setText(`${Math.round(v * 100)}%`);
      it.label.setColor(i === this.sel ? '#ffe14a' : '#f3ead2');
    });
  }

  // Gibt true zurück, wenn die Taste verarbeitet wurde
  handleKey(e) {
    const it = this.items[this.sel];
    switch (e.code) {
      case 'ArrowUp':
        this.sel = (this.sel + 1) % 2;
        break;
      case 'ArrowDown':
        this.sel = (this.sel + 1) % 2;
        break;
      case 'ArrowLeft':
        this.set(this.sel, getVolume(it.kind) - 0.1);
        break;
      case 'ArrowRight':
        this.set(this.sel, getVolume(it.kind) + 0.1);
        break;
      default:
        return false;
    }
    this.refresh();
    return true;
  }
}
