// Prozedural gezeichneter Garten rund um den Rasen: Zaun, Bäume, Beete,
// Gartenhaus, Teich, Gemüsebeet und allerlei Kleinkram.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function valueNoise(seed, cell) {
  const rng = mulberry32(seed);
  const cache = new Map();
  const at = (ix, iy) => {
    const k = ix * 7919 + iy * 104729;
    if (!cache.has(k)) cache.set(k, rng());
    return cache.get(k);
  };
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// Native Größe: halbe Bildschirmauflösung (unterhalb der HUD-Leiste).
export const GARDEN_NATIVE = { w: 544, h: 384, lawnX: 64, lawnY: 56, lawnW: 416, lawnH: 272 };

export function makeGarden(scene) {
  const { w: W, h: H, lawnX, lawnY, lawnW, lawnH } = GARDEN_NATIVE;
  const tex = scene.textures.createCanvas('garden', W, H);
  const ctx = tex.getContext();
  const img = ctx.createImageData(W, H);
  const rng = mulberry32(4711);
  const wildNoise = valueNoise(17, 6);
  const soilNoise = valueNoise(5, 3);
  const lx1 = lawnX + lawnW;
  const ly1 = lawnY + lawnH;

  const put = (x, y, hex) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const [r, g, b] = hexToRgb(hex);
    const i = (y * W + x) * 4;
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = 255;
  };
  const distIn = (x, y) => {
    const dx = x < lawnX ? lawnX - x : x >= lx1 ? x - lx1 + 1 : 0;
    const dy = y < lawnY ? lawnY - y : y >= ly1 ? y - ly1 + 1 : 0;
    return { dIn: Math.max(dx, dy), dx, dy };
  };

  // --- Grundfläche: Rasen, Steinkante, Beet, wilde Wiese
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inLawn = x >= lawnX && x < lx1 && y >= lawnY && y < ly1;
      if (inLawn) {
        const stripe = Math.floor((x - lawnX) / 32) % 2 === 0;
        const r = rng();
        let col;
        if (stripe) col = r < 0.08 ? '#4c9a30' : r > 0.94 ? '#7cc255' : r > 0.6 ? '#66b043' : '#5fa83d';
        else col = r < 0.08 ? '#43892a' : r > 0.94 ? '#6db547' : r > 0.6 ? '#5aa138' : '#549b34';
        if (y - lawnY < 3 || x - lawnX < 2) col = stripe ? '#4a8f2e' : '#43862a';
        put(x, y, col);
        continue;
      }
      const { dIn, dx, dy } = distIn(x, y);
      if (dIn <= 3) {
        const along = dx >= dy ? y : x;
        let col = along % 7 === 0 ? '#6e6e66' : dIn === 1 ? '#c4c4ba' : '#a3a39a';
        if (dIn === 3) col = '#7d7d74';
        if (rng() < 0.07) col = '#8f8f86';
        put(x, y, col);
      } else if (dIn <= 10) {
        const n = soilNoise(x, y);
        let col = n < 0.4 ? '#5c3f27' : n < 0.7 ? '#6b4a2e' : '#7a5636';
        if (rng() < 0.05) col = '#4a3220';
        if (dIn === 10) col = '#4a3220';
        put(x, y, col);
      } else {
        const n = wildNoise(x, y);
        const r = rng();
        let col = n < 0.35 ? '#3f7a2a' : n < 0.65 ? '#468530' : '#4e9136';
        if (r < 0.06) col = '#37702a';
        else if (r > 0.95) col = '#5fa040';
        put(x, y, col);
      }
    }
  }

  // --- Weg vom Gartentor (unten Mitte) zum Rasen
  const gateX = Math.floor(W / 2);
  for (let y = ly1 + 4; y < H; y += 7) {
    const ox = ((y / 7) | 0) % 2 === 0 ? -3 : 3;
    blob(put, rng, gateX + ox - 7, y, 6, 3, ['#b5b0a2', '#a39e90', '#c9c4b6']);
    blob(put, rng, gateX + ox + 7, y + 2, 6, 3, ['#b5b0a2', '#a39e90', '#c9c4b6']);
  }

  ctx.putImageData(img, 0, 0);

  // --- Blumen im Beet
  const flowerCols = ['#e84a5f', '#f7d038', '#a66cff', '#ffffff', '#ff8cc6', '#ff7b29', '#5ac8fa'];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const { dIn } = distIn(x, y);
      if (dIn < 5 || dIn > 9 || rng() > 0.22) continue;
      if (Math.abs(x - gateX) < 16 && y > ly1) continue;
      flower(ctx, x + (rng() < 0.5 ? 1 : 0), y, flowerCols[Math.floor(rng() * flowerCols.length)]);
    }
  }
  // Wildblumen in der Wiese
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * H);
    if (distIn(x, y).dIn < 13) continue;
    ctx.fillStyle = rng() < 0.5 ? '#ffffff' : rng() < 0.5 ? '#f7d038' : '#c79bff';
    ctx.fillRect(x, y, 1, 1);
  }

  // --- Gänseblümchen & Klee im Rasen
  for (let i = 0; i < 45; i++) {
    const x = lawnX + 4 + Math.floor(rng() * (lawnW - 8));
    const y = lawnY + 5 + Math.floor(rng() * (lawnH - 9));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y, 1, 1);
    ctx.fillRect(x + 1, y, 1, 1);
    ctx.fillRect(x, y - 1, 1, 1);
    ctx.fillRect(x, y + 1, 1, 1);
    ctx.fillStyle = '#f7d038';
    ctx.fillRect(x, y, 1, 1);
  }
  for (let i = 0; i < 18; i++) {
    const x = lawnX + 4 + Math.floor(rng() * (lawnW - 8));
    const y = lawnY + 4 + Math.floor(rng() * (lawnH - 8));
    ctx.fillStyle = '#3f8a2a';
    for (let k = 0; k < 6; k++) ctx.fillRect(x + Math.floor(rng() * 5) - 2, y + Math.floor(rng() * 3) - 1, 2, 1);
  }

  // --- Deko (von hinten nach vorne)
  drawShed(ctx, 8, 6);
  drawVeggies(ctx, rng, 92, 337, 120, 30);
  drawPond(ctx, rng, 400, 356, 44, 15);
  drawBirdBath(ctx, 30, 150);
  drawCompost(ctx, 504, 66);
  drawBench(ctx, 497, 250);
  drawBarrel(ctx, 30, 236);
  drawBeehive(ctx, 514, 160);

  // Zaun außen herum (mit Tor unten)
  drawFence(ctx, W, H, gateX);

  // Bäume und Büsche zuletzt, sie ragen über den Zaun
  const trees = [
    [120, 22, 17, 'apple'],
    [330, 20, 18, 'oak'],
    [450, 24, 16, 'cherry'],
    [28, 95, 15, 'oak'],
    [30, 300, 17, 'apple'],
    [516, 112, 14, 'cherry'],
    [512, 316, 18, 'oak'],
    [516, 210, 12, 'bush'],
    [28, 190, 11, 'bush'],
    [190, 30, 11, 'bush'],
    [262 - 40, 362, 12, 'bush'],
    [262 + 64, 364, 11, 'bush'],
    [40, 360, 14, 'cherry'],
  ];
  trees.forEach(([x, y, r, type], i) => drawTree(ctx, mulberry32(100 + i), x, y, r, type));

  tex.refresh();
}

function blob(put, rng, cx, cy, rx, ry, cols) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1 - rng() * 0.15) continue;
      put(cx + x, cy + y, cols[Math.floor(rng() * cols.length)]);
    }
  }
}

function fillEllipse(ctx, rng, cx, cy, rx, ry, colorFn) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      if (d > 1) continue;
      const c = colorFn(x, y, d, rng());
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
}

function flower(ctx, x, y, c) {
  ctx.fillStyle = '#2f7a2c';
  ctx.fillRect(x, y + 1, 1, 2);
  ctx.fillStyle = c;
  ctx.fillRect(x - 1, y, 1, 1);
  ctx.fillRect(x + 1, y, 1, 1);
  ctx.fillRect(x, y - 1, 1, 1);
  ctx.fillStyle = c === '#f7d038' ? '#c0581a' : '#ffe066';
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function drawTree(ctx, rng, cx, cy, r, type) {
  // Schatten
  fillEllipse(ctx, rng, cx + 4, cy + r * 0.75, r * 0.95, r * 0.4, () => 'rgba(0,0,0,0.22)');
  if (type !== 'bush') {
    rect(ctx, cx - 2, cy + r * 0.4, 4, r * 0.55, '#5a3a1e');
    rect(ctx, cx - 2, cy + r * 0.4, 1, r * 0.55, '#7a5230');
  }
  const pal = {
    apple: ['#245c22', '#2f7030', '#3d8a38', '#56a64a'],
    oak: ['#1f4f20', '#2a6128', '#367833', '#4a9140'],
    cherry: ['#2a5e28', '#3a7a34', '#4a8f40', '#5fa64e'],
    bush: ['#22502a', '#2d6533', '#3b7d3e', '#4f9650'],
  }[type];
  const noise = valueNoise(Math.floor(rng() * 1000), 3);
  const ry = type === 'bush' ? r * 0.8 : r;
  fillEllipse(ctx, rng, cx, cy, r, ry, (x, y, d, rr) => {
    if (d > 0.82 && rr < 0.35) return null;
    const light = -x / r * 0.35 - y / ry * 0.45 + noise(cx + x, cy + y) * 0.6 - d * 0.3;
    if (light > 0.45) return pal[3];
    if (light > 0.15) return pal[2];
    if (light > -0.15) return pal[1];
    return pal[0];
  });
  // Outline
  ctx.fillStyle = 'rgba(15,30,12,0.55)';
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    ctx.fillRect(Math.round(cx + Math.cos(a) * (r + 0.5)), Math.round(cy + Math.sin(a) * (ry + 0.5)), 1, 1);
  }
  // Früchte / Blüten
  const n = Math.floor(r * 0.8);
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r * 0.75;
    const x = Math.round(cx + Math.cos(a) * d);
    const y = Math.round(cy + Math.sin(a) * d * (ry / r));
    if (type === 'apple') {
      rect(ctx, x, y, 2, 2, '#d8352a');
      rect(ctx, x, y, 1, 1, '#ff7a6a');
    } else if (type === 'cherry') {
      rect(ctx, x, y, 2, 2, '#ffb7d5');
      rect(ctx, x, y, 1, 1, '#ffffff');
    } else if (type === 'bush' && i % 2 === 0) {
      rect(ctx, x, y, 1, 1, '#f7d038');
    }
  }
}

function drawFence(ctx, W, H, gateX) {
  const wood = '#efe4c8';
  const shade = '#c9b994';
  const dark = '#6e5a3a';
  // oben & unten: Latten von vorne
  const row = (y0, skipGate) => {
    rect(ctx, 0, y0 + 3, W, 1, dark);
    rect(ctx, 0, y0 + 7, W, 1, dark);
    rect(ctx, 0, y0 + 2, W, 1, shade);
    rect(ctx, 0, y0 + 6, W, 1, shade);
    for (let x = 1; x < W - 1; x += 4) {
      if (skipGate && Math.abs(x + 1 - gateX) < 12) continue;
      rect(ctx, x, y0, 3, 10, wood);
      rect(ctx, x + 2, y0 + 1, 1, 9, shade);
      rect(ctx, x + 1, y0 - 1, 1, 1, wood);
      rect(ctx, x - 1, y0, 1, 10, dark);
      rect(ctx, x, y0 + 10, 3, 1, dark);
    }
  };
  row(1, false);
  row(H - 12, true);
  // Tor (offen)
  rect(ctx, gateX - 13, H - 15, 3, 14, '#8a6a3a');
  rect(ctx, gateX + 10, H - 15, 3, 14, '#8a6a3a');
  // links & rechts: Zaun von oben gesehen
  for (const x0 of [2, W - 5]) {
    rect(ctx, x0, 0, 3, H, shade);
    rect(ctx, x0 + 1, 0, 1, H, wood);
    for (let y = 6; y < H; y += 12) {
      rect(ctx, x0 - 1, y, 5, 5, dark);
      rect(ctx, x0, y + 1, 3, 3, wood);
    }
  }
}

function drawShed(ctx, x, y) {
  // Gartenhaus oben links: Dach + Vorderwand
  rect(ctx, x + 2, y + 34, 46, 4, 'rgba(0,0,0,0.25)');
  rect(ctx, x, y + 18, 44, 18, '#8a5a32');
  for (let i = 0; i < 44; i += 4) rect(ctx, x + i, y + 18, 1, 18, '#6e4524');
  rect(ctx, x + 16, y + 22, 11, 14, '#5a3a1e');
  rect(ctx, x + 25, y + 29, 1, 1, '#f2c230');
  rect(ctx, x + 4, y + 22, 8, 7, '#9fd8ff');
  rect(ctx, x + 7, y + 22, 1, 7, '#6e4524');
  rect(ctx, x + 4, y + 25, 8, 1, '#6e4524');
  rect(ctx, x + 32, y + 22, 8, 7, '#9fd8ff');
  rect(ctx, x + 35, y + 22, 1, 7, '#6e4524');
  rect(ctx, x + 32, y + 25, 8, 1, '#6e4524');
  // Dach
  rect(ctx, x - 3, y, 50, 19, '#a8433a');
  for (let i = 0; i < 19; i += 3) rect(ctx, x - 3, y + i, 50, 1, '#7d2f28');
  rect(ctx, x - 3, y + 9, 50, 2, '#5e2420');
  rect(ctx, x - 3, y + 18, 50, 2, '#4a1a16');
}

function drawPond(ctx, rng, cx, cy, rx, ry) {
  fillEllipse(ctx, rng, cx, cy, rx + 2, ry + 2, (x, y, d) => (d > 0.85 ? '#8a8a80' : '#6e6e66'));
  fillEllipse(ctx, rng, cx, cy, rx, ry, (x, y, d, r) => {
    if (d > 0.8) return '#2a6fa8';
    if (r < 0.04) return '#9fd8ff';
    return y < -ry * 0.3 ? '#3b8fd0' : '#337fc0';
  });
  const pads = [
    [-20, -2],
    [6, 4],
    [24, -3],
  ];
  pads.forEach(([dx, dy]) => {
    fillEllipse(ctx, rng, cx + dx, cy + dy, 4, 2, () => '#3f9c3a');
    rect(ctx, cx + dx + 1, cy + dy - 1, 2, 1, '#2b6e28');
  });
  rect(ctx, cx + 7, cy + 3, 2, 1, '#ff8cc6');
  // Schilf
  for (let i = 0; i < 6; i++) {
    const x = cx + rx - 4 + i * 2;
    rect(ctx, x, cy - 8 + (i % 3), 1, 9, '#5a8a30');
    rect(ctx, x, cy - 9 + (i % 3), 1, 3, '#6e4524');
  }
}

function drawVeggies(ctx, rng, x, y, w, h) {
  rect(ctx, x - 2, y - 2, w + 4, h + 4, '#6e5a3a');
  rect(ctx, x, y, w, h, '#5c3f27');
  for (let r = 0; r < h; r += 7) {
    rect(ctx, x, y + r + 3, w, 2, '#4a3220');
    for (let i = 3; i < w - 2; i += 6) {
      const carrot = (r / 7) % 2 === 0;
      if (carrot) {
        rect(ctx, i + x, y + r + 2, 2, 1, '#f07d1a');
        rect(ctx, i + x - 1, y + r, 1, 2, '#3f9c3a');
        rect(ctx, i + x + 1, y + r - 1, 1, 3, '#56b04a');
        rect(ctx, i + x + 2, y + r, 1, 2, '#3f9c3a');
      } else {
        fillEllipse(ctx, rng, i + x + 1, y + r + 1, 2, 2, (dx, dy, d) => (d < 0.4 ? '#a6e07a' : '#5fb04a'));
      }
    }
  }
}

function drawBirdBath(ctx, x, y) {
  rect(ctx, x - 3, y + 2, 6, 8, '#9a9a90');
  rect(ctx, x - 5, y + 9, 10, 2, '#7d7d74');
  rect(ctx, x - 8, y - 2, 16, 5, '#b5b0a2');
  rect(ctx, x - 6, y - 1, 12, 2, '#5ac8fa');
  rect(ctx, x - 7, y - 3, 14, 1, '#c9c4b6');
  rect(ctx, x + 2, y - 5, 2, 2, '#4a6fa8');
  rect(ctx, x + 4, y - 4, 1, 1, '#f2c230');
}

function drawCompost(ctx, x, y) {
  rect(ctx, x - 12, y - 10, 24, 20, '#6e4524');
  for (let i = 0; i < 20; i += 4) rect(ctx, x - 12, y - 10 + i, 24, 1, '#4a2e14');
  rect(ctx, x - 10, y - 8, 20, 6, '#5c3f27');
  rect(ctx, x - 6, y - 7, 3, 2, '#f07d1a');
  rect(ctx, x + 2, y - 6, 3, 2, '#d8352a');
  rect(ctx, x - 1, y - 8, 2, 2, '#56b04a');
}

function drawBench(ctx, x, y) {
  rect(ctx, x, y + 14, 34, 3, 'rgba(0,0,0,0.25)');
  rect(ctx, x, y, 30, 4, '#8a5a32');
  rect(ctx, x, y + 5, 30, 4, '#9a6a3a');
  rect(ctx, x, y + 10, 30, 4, '#8a5a32');
  rect(ctx, x + 2, y + 14, 2, 3, '#3a2a1e');
  rect(ctx, x + 26, y + 14, 2, 3, '#3a2a1e');
}

function drawBarrel(ctx, x, y) {
  rect(ctx, x - 7, y - 9, 14, 18, '#3b6fc4');
  rect(ctx, x - 7, y - 5, 14, 1, '#2a4f8f');
  rect(ctx, x - 7, y + 4, 14, 1, '#2a4f8f');
  rect(ctx, x - 6, y - 10, 12, 3, '#5ac8fa');
  rect(ctx, x - 5, y - 9, 4, 1, '#ffffff');
}

function drawBeehive(ctx, x, y) {
  rect(ctx, x - 1, y + 6, 2, 8, '#6e4524');
  const rows = [6, 10, 12, 12, 10];
  rows.forEach((w, i) => rect(ctx, x - w / 2, y - 8 + i * 3, w, 3, i % 2 ? '#e0a030' : '#f2c230'));
  rect(ctx, x - 1, y + 2, 2, 2, '#3a2a1e');
}
