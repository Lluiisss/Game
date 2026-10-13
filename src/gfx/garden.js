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
export const GARDEN_NATIVE = { w: 544, h: 372, lawnX: 64, lawnY: 50, lawnW: 416, lawnH: 272 };

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
      if (y >= ly1 + 4) {
        // Terrasse aus Holzdielen unten
        const ty = y - (ly1 + 4);
        const row = Math.floor(ty / 5);
        let col = row % 2 ? '#b8875a' : '#ad7d52';
        if (ty % 5 === 4) col = '#6e4a2e';
        else if ((x + row * 37) % 64 === 0) col = '#7a5434';
        else if (rng() < 0.06) col = '#a07048';
        if (ty < 2) col = '#5a3a22';
        put(x, y, col);
      } else if (dIn <= 3) {
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

  // --- Trittsteine vom Gartentor (oben Mitte) zum Rasen
  const gateX = Math.floor(W / 2);
  for (let y = 14; y < lawnY - 3; y += 8) {
    const ox = ((y / 8) | 0) % 2 === 0 ? -4 : 4;
    blob(put, rng, gateX + ox, y, 6, 3, ['#b5b0a2', '#a39e90', '#c9c4b6']);
  }

  ctx.putImageData(img, 0, 0);

  // --- Blumen im Beet
  const flowerCols = ['#e84a5f', '#f7d038', '#a66cff', '#ffffff', '#ff8cc6', '#ff7b29', '#5ac8fa'];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      const { dIn } = distIn(x, y);
      if (dIn < 5 || dIn > 9 || rng() > 0.22 || y >= ly1) continue;
      if (Math.abs(x - gateX) < 12 && y < lawnY) continue;
      flower(ctx, x + (rng() < 0.5 ? 1 : 0), y, flowerCols[Math.floor(rng() * flowerCols.length)]);
    }
  }
  // Wildblumen in der Wiese
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * H);
    if (distIn(x, y).dIn < 13 || y >= ly1) continue;
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

  // --- Deko links & rechts
  drawCompost(ctx, 512, 70);
  drawBeehive(ctx, 514, 165);
  drawPond(ctx, rng, 512, 245, 22, 30);
  drawBirdBath(ctx, 30, 112);
  drawVeggies(ctx, rng, 10, 140, 42, 56);
  drawBarrel(ctx, 30, 228);

  // --- Terrasse: Tisch mit Sonnenschirm, Grill, Liege, Blumentöpfe
  const ty0 = ly1 + 4;
  drawGrill(ctx, 44, ty0 + 22);
  drawTable(ctx, 150, ty0 + 24);
  drawLounger(ctx, 400, ty0 + 14);
  [96, 222, 322, 470, 520].forEach((x, i) => drawPot(ctx, rng, x, ty0 + 12 + (i % 2) * 14));

  // Zaun links, rechts und oben (mit Gartentor in der Mitte)
  drawFence(ctx, W, ty0, gateX);

  // Bäume und Büsche zuletzt, sie ragen über den Zaun
  const trees = [
    [36, 26, 17, 'oak'],
    [120, 22, 17, 'apple'],
    [200, 26, 11, 'bush'],
    [345, 26, 11, 'bush'],
    [430, 22, 17, 'cherry'],
    [512, 26, 16, 'oak'],
    [28, 280, 15, 'apple'],
    [516, 120, 13, 'cherry'],
    [516, 300, 13, 'bush'],
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

function drawFence(ctx, W, bottom, gateX) {
  const wood = '#efe4c8';
  const shade = '#c9b994';
  const dark = '#6e5a3a';
  // oben: Latten von vorne, Lücke für das Tor
  const y0 = 1;
  for (const [x0, x1] of [
    [0, gateX - 12],
    [gateX + 12, W],
  ]) {
    rect(ctx, x0, y0 + 3, x1 - x0, 1, dark);
    rect(ctx, x0, y0 + 7, x1 - x0, 1, dark);
    rect(ctx, x0, y0 + 2, x1 - x0, 1, shade);
    rect(ctx, x0, y0 + 6, x1 - x0, 1, shade);
  }
  for (let x = 1; x < W - 1; x += 4) {
    if (Math.abs(x + 1 - gateX) < 13) continue;
    rect(ctx, x, y0, 3, 10, wood);
    rect(ctx, x + 2, y0 + 1, 1, 9, shade);
    rect(ctx, x + 1, y0 - 1, 1, 1, wood);
    rect(ctx, x - 1, y0, 1, 10, dark);
    rect(ctx, x, y0 + 10, 3, 1, dark);
  }
  // Gartentor (offen) mit Pfosten
  rect(ctx, gateX - 14, 0, 4, 13, '#8a6a3a');
  rect(ctx, gateX + 10, 0, 4, 13, '#8a6a3a');
  rect(ctx, gateX - 13, 0, 2, 12, '#a8844a');
  rect(ctx, gateX + 11, 0, 2, 12, '#a8844a');
  for (let i = 0; i < 4; i++) rect(ctx, gateX - 22 + i * 2, 2 + i * 3, 2, 3, wood);
  // links & rechts: Zaun von oben gesehen, bis zur Terrasse
  for (const x0 of [2, W - 5]) {
    rect(ctx, x0, 0, 3, bottom, shade);
    rect(ctx, x0 + 1, 0, 1, bottom, wood);
    for (let y = 6; y < bottom - 4; y += 12) {
      rect(ctx, x0 - 1, y, 5, 5, dark);
      rect(ctx, x0, y + 1, 3, 3, wood);
    }
  }
}

function drawGrill(ctx, x, y) {
  rect(ctx, x - 8, y + 6, 18, 3, 'rgba(0,0,0,0.25)');
  rect(ctx, x - 7, y - 7, 14, 14, '#222222');
  rect(ctx, x - 6, y - 6, 12, 12, '#3a3a3a');
  for (let i = -5; i < 6; i += 2) rect(ctx, x - 6, y + i, 12, 1, '#777777');
  rect(ctx, x - 3, y - 3, 2, 2, '#e8502a');
  rect(ctx, x + 2, y + 1, 2, 2, '#ff8a1a');
  rect(ctx, x + 7, y - 1, 6, 2, '#5a3a22');
}

function drawTable(ctx, x, y) {
  const chair = (cx, cy) => {
    rect(ctx, cx - 4, cy - 4, 9, 9, '#e8e8e8');
    rect(ctx, cx - 4, cy - 4, 9, 2, '#bdbdbd');
  };
  chair(x - 22, y);
  chair(x + 22, y);
  // Schatten & Tisch
  rect(ctx, x - 12, y + 10, 26, 4, 'rgba(0,0,0,0.2)');
  for (let dy = -11; dy <= 11; dy++) {
    const w = Math.round(Math.sqrt(121 - dy * dy));
    rect(ctx, x - w, y + dy, w * 2, 1, '#f4f4f4');
  }
  // Sonnenschirm (rot-weiß gestreift)
  for (let dy = -19; dy <= 19; dy++) {
    for (let dx = -19; dx <= 19; dx++) {
      if (dx * dx + dy * dy > 361) continue;
      const a = Math.atan2(dy, dx);
      const seg = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8);
      rect(ctx, x + dx, y - 14 + dy, 1, 1, seg % 2 ? '#d8352a' : '#f4f4f4');
    }
  }
  rect(ctx, x - 1, y - 15, 3, 3, '#7a5434');
}

function drawLounger(ctx, x, y) {
  rect(ctx, x - 2, y + 14, 46, 3, 'rgba(0,0,0,0.2)');
  rect(ctx, x, y, 42, 14, '#7a5434');
  rect(ctx, x + 2, y + 2, 38, 10, '#3b8fd0');
  for (let i = 4; i < 40; i += 6) rect(ctx, x + i, y + 2, 2, 10, '#f4f4f4');
  rect(ctx, x + 30, y + 3, 8, 8, '#ffffff');
}

function drawPot(ctx, rng, x, y) {
  rect(ctx, x - 5, y, 10, 8, '#c4622d');
  rect(ctx, x - 6, y - 1, 12, 2, '#a84e22');
  fillEllipse(ctx, rng, x, y - 4, 7, 5, (dx, dy, d, r) => (r < 0.15 ? '#ff5a7a' : d < 0.4 ? '#56b04a' : '#3f8a2a'));
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
