import Phaser from 'phaser';
import { GAME_W, GAME_H, HUD_H, LAWN, PX } from '../config.js';

// Ein paar Schmetterlinge flattern durch den Garten rund um den Rasen.
function randomGardenPoint(near) {
  for (let i = 0; i < 30; i++) {
    const x = near ? Phaser.Math.Clamp(near.x + Phaser.Math.Between(-180, 180), 16, GAME_W - 16) : Phaser.Math.Between(16, GAME_W - 16);
    const y = near
      ? Phaser.Math.Clamp(near.y + Phaser.Math.Between(-180, 180), HUD_H + 16, GAME_H - 16)
      : Phaser.Math.Between(HUD_H + 16, GAME_H - 16);
    const inLawn = x > LAWN.x - 10 && x < LAWN.right + 10 && y > LAWN.y - 10 && y < LAWN.bottom + 10;
    if (!inLawn) return { x, y };
  }
  return near || { x: 40, y: HUD_H + 40 };
}

export function addButterflies(scene, count) {
  for (let i = 0; i < count; i++) {
    const kind = i % 2 === 0 ? 'butterfly' : 'butterfly2';
    const p = randomGardenPoint();
    const b = scene.add.image(p.x, p.y, `${kind}_0`).setScale(PX).setDepth(-200);
    let frame = 0;
    scene.time.addEvent({
      delay: 140 + i * 13,
      loop: true,
      callback: () => {
        frame = 1 - frame;
        b.setTexture(`${kind}_${frame}`);
      },
    });
    const fly = () => {
      const t = randomGardenPoint(b);
      scene.tweens.add({
        targets: b,
        x: t.x,
        y: t.y,
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.InOut',
        onComplete: fly,
      });
    };
    fly();
  }
}
