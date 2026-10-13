// Hilfsfunktion: zeichnet eine Pixel-Karte (Strings) in eine Canvas-Textur,
// optional mit automatischer dunkler Outline.

export const OUTLINE = '#1e140d';

export function drawMap(scene, key, rows, pal, outline = OUTLINE) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const pad = outline ? 1 : 0;
  const W = w + pad * 2;
  const H = h + pad * 2;
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  const filled = new Uint8Array(W * H);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + pad, y + pad, 1, 1);
      filled[(y + pad) * W + x + pad] = 1;
    }
  });
  if (outline) {
    ctx.fillStyle = outline;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (filled[y * W + x]) continue;
        const n =
          (x > 0 && filled[y * W + x - 1]) ||
          (x < W - 1 && filled[y * W + x + 1]) ||
          (y > 0 && filled[(y - 1) * W + x]) ||
          (y < H - 1 && filled[(y + 1) * W + x]);
        if (n) ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  tex.refresh();
}
