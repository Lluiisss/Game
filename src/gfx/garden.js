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
// Terrassentisch (native Koordinaten, Mitte)
export const TABLE = { x: 130, y: 349 };

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
        // Terrasse aus grauen Waschbeton-Platten
        const ty = y - (ly1 + 4);
        const r = rng();
        let col = r < 0.3 ? '#9a978e' : r < 0.55 ? '#8a877e' : r < 0.8 ? '#a8a59c' : r < 0.93 ? '#7a776f' : '#b8b2a4';
        if (x % 15 === 0 || ty % 15 === 0) col = '#5e5c56';
        if (ty < 2) col = '#6e6c66';
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
  drawBirdBath(ctx, 30, 112);
  drawVeggies(ctx, rng, 10, 140, 42, 56);
  drawBarrel(ctx, 30, 228);
  [218, 246].forEach((y) => drawGeraniumPot(ctx, rng, 514, y));

  // --- Terrasse (nach Foto): Pergola mit Wein und Wagenrad, Sichtschutz,
  // dunkle Metallmöbel, zugeklappter Sonnenschirm, Geländer mit Geranien
  const ty0 = ly1 + 4;
  drawScreen(ctx, 0, ty0, H);
  // gestapelte Stühle in der Ecke
  drawChair(ctx, 26, ty0 + 14, 'up');
  drawChair(ctx, 30, ty0 + 18, 'up');
  // Tisch mit Stühlen ringsum (oben sitzt Oma, bis sie mithilft)
  drawChair(ctx, TABLE.x, TABLE.y - 15, 'up');
  drawChair(ctx, TABLE.x - 30, TABLE.y, 'left');
  drawChair(ctx, TABLE.x + 30, TABLE.y, 'right');
  drawChair(ctx, TABLE.x, TABLE.y + 16, 'down');
  drawTable(ctx, TABLE.x - 20, TABLE.y - 8, 40, 16);
  drawParasol(ctx, TABLE.x + 58, TABLE.y + 4);
  drawPot(ctx, rng, 250, ty0 + 14);
  // Kellertreppe unten rechts neben der Mitte
  drawCellarStairs(ctx, 296, ty0 + 3, 40, H - ty0 - 3);
  drawChair(ctx, 420, ty0 + 24, 'up');
  drawPot(ctx, rng, 470, ty0 + 30);
  drawRailing(ctx, rng, 346, W, ty0 + 3);
  drawPergola(ctx, rng, 10, 236, ty0 + 2, H - 3);

  // Zaun links, rechts und oben (mit Gartentor in der Mitte)
  drawFence(ctx, W, ty0, gateX);
  drawGateArch(ctx, rng, gateX);

  // Bäume und Büsche zuletzt, sie ragen über den Zaun
  const trees = [
    [36, 32, 17, 'oak'],
    [120, 30, 15, 'oak'],
    [200, 26, 11, 'bush'],
    [345, 26, 11, 'bush'],
    [438, 30, 18, 'mirabelle'],
    [504, 28, 12, 'currant'],
    [32, 276, 21, 'apple'],
    [516, 128, 13, 'cherry'],
    [526, 196, 10, 'bush'],
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
  const isBush = type === 'bush' || type === 'currant';
  const pal = {
    apple: ['#1d4a1c', '#2a6428', '#3a8034', '#58a24a', '#7cc060'],
    oak: ['#183f1a', '#235524', '#30702e', '#4a8c3e', '#66a852'],
    cherry: ['#204c1e', '#2e6a2a', '#3e8636', '#5aa24a', '#7ebc62'],
    mirabelle: ['#1f4a1c', '#2c6428', '#3c8034', '#58a046', '#78ba5a'],
    bush: ['#1a4420', '#265a2c', '#33743a', '#4a8e4c', '#64a862'],
    currant: ['#173e1e', '#22552a', '#2f6e36', '#468a48', '#5fa45c'],
  }[type];
  // Krone etwas nach oben versetzt, damit der Stamm darunter sichtbar ist
  const ccy = isBush ? cy : cy - r * 0.55;
  // Schatten am Boden
  fillEllipse(ctx, rng, cx + r * 0.25, cy + r * 0.55, r * 1.0, r * 0.38, () => 'rgba(0,0,0,0.22)');
  // Stamm mit Wurzeln und Rinde
  if (!isBush) {
    const tw = Math.max(4, Math.round(r * 0.32));
    const top = Math.round(ccy + r * 0.3);
    const bottom = Math.round(cy + r * 0.75);
    for (let y = top; y <= bottom; y++) {
      const w = tw + (y >= bottom - 1 ? 2 : 0);
      for (let x = -Math.floor(w / 2); x < Math.ceil(w / 2); x++) {
        let col = x < -w / 4 ? '#7a5634' : x > w / 4 ? '#4a3018' : '#5e3e20';
        if ((y + x * 3) % 5 === 0) col = '#3e2810';
        rect(ctx, cx + x, y, 1, 1, col);
      }
    }
    rect(ctx, cx - tw / 2 - 2, bottom, 2, 1, '#4a3018');
    rect(ctx, cx + tw / 2, bottom, 2, 1, '#4a3018');
  }
  // Krone aus mehreren Laub-Klumpen
  const lobes = [{ x: 0, y: 0, r: r * 0.66 }];
  const n = isBush ? 5 : 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng() * 0.5;
    const d = r * (0.42 + rng() * 0.12);
    lobes.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * (isBush ? 0.75 : 0.9), r: r * (0.42 + rng() * 0.14) });
  }
  const noise = valueNoise(Math.floor(rng() * 1000), 2);
  const inside = (x, y) => {
    let best = null;
    for (const l of lobes) {
      const dx = x - l.x;
      const dy = y - l.y;
      const d = Math.hypot(dx, dy) / l.r;
      if (d <= 1 && (!best || d < best.d)) best = { d, dx, dy, l };
    }
    return best;
  };
  const R = Math.ceil(r * 1.2);
  for (let y = -R; y <= R; y++) {
    for (let x = -R; x <= R; x++) {
      const hit = inside(x, y);
      if (!hit) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      let col;
      if (edge) col = '#0f2a10';
      else {
        // Licht von oben links, pro Klumpen schattiert, unten dunkler
        const light =
          (-hit.dx / hit.l.r) * 0.35 - (hit.dy / hit.l.r) * 0.5 - (y / r) * 0.35 + (noise(cx + x, ccy + y) - 0.5) * 0.7;
        col = light > 0.6 ? pal[4] : light > 0.25 ? pal[3] : light > -0.1 ? pal[2] : light > -0.45 ? pal[1] : pal[0];
      }
      rect(ctx, Math.round(cx + x), Math.round(ccy + y), 1, 1, col);
    }
  }
  // Früchte / Beeren / Blüten
  const count = Math.floor(r * (type === 'currant' ? 2.2 : 0.9));
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * r * 0.8;
    const x = Math.round(cx + Math.cos(a) * d);
    const y = Math.round(ccy + Math.sin(a) * d * 0.85);
    if (!inside(x - cx, y - ccy)) continue;
    if (type === 'apple') {
      rect(ctx, x, y, 2, 2, '#d8352a');
      rect(ctx, x, y, 1, 1, '#ff7a6a');
    } else if (type === 'cherry') {
      rect(ctx, x, y, 2, 2, '#ffb7d5');
      rect(ctx, x, y, 1, 1, '#ffffff');
    } else if (type === 'mirabelle') {
      rect(ctx, x, y, 2, 2, '#f2c230');
      rect(ctx, x, y, 1, 1, '#fff07a');
    } else if (type === 'currant') {
      rect(ctx, x, y, 1, 1, '#e8302a');
      rect(ctx, x + 1, y + 1, 1, 1, '#c01818');
      rect(ctx, x, y + 2, 1, 1, '#e8302a');
    } else if (type === 'bush' && i % 2 === 0) {
      rect(ctx, x, y, 1, 1, '#f7d038');
    }
  }
}

function drawFence(ctx, W, bottom, gateX) {
  // dunkler Holzzaun
  const wood = '#6a523e';
  const shade = '#4e3c2e';
  const dark = '#241a12';
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

const BEAM = '#3a2e26';

function drawWagonWheel(ctx, cx, cy, r) {
  for (let a = 0; a < Math.PI * 2; a += 0.08) {
    rect(ctx, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1, BEAM);
    rect(ctx, Math.round(cx + Math.cos(a) * (r - 1)), Math.round(cy + Math.sin(a) * (r - 1)), 1, 1, BEAM);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    for (let d = 1; d < r; d++) rect(ctx, Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 1, 1, '#5a4636');
  }
  rect(ctx, cx - 1, cy - 1, 3, 3, BEAM);
}

function drawVine(ctx, rng, x0, x1, y, density = 0.5) {
  for (let x = x0; x < x1; x += 2) {
    if (rng() > density) continue;
    const dy = Math.floor(rng() * 5) - 2;
    rect(ctx, x, y + dy, 2, 2, rng() < 0.5 ? '#4f9a3a' : '#6fb84a');
    if (rng() < 0.05) rect(ctx, x, y + dy + 2, 2, 2, '#6a3a7a');
  }
}

function drawPergola(ctx, rng, x0, x1, y0, y1) {
  for (let x = x0 + 6; x < x1; x += 14) rect(ctx, x, y0, 1, y1 - y0, 'rgba(30,22,16,0.35)');
  rect(ctx, x0, y0, x1 - x0, 3, BEAM);
  rect(ctx, x0, y1 - 3, x1 - x0, 3, BEAM);
  for (const x of [x0, x1 - 4]) {
    rect(ctx, x, y0 - 1, 5, 5, BEAM);
    rect(ctx, x, y1 - 4, 5, 5, BEAM);
  }
  drawVine(ctx, rng, x0, x1, y0 + 1, 0.7);
  drawVine(ctx, rng, x0 + 40, x1 - 30, y1 - 2, 0.35);
  drawWagonWheel(ctx, x1 - 26, y0 + 8, 7);
}

function drawScreen(ctx, x, y0, y1) {
  rect(ctx, x, y0, 8, y1 - y0, '#2a2420');
  for (let y = y0; y < y1; y += 4) rect(ctx, x, y, 8, 1, '#4a3e34');
  for (let i = 0; i < 8; i += 4) rect(ctx, x + i, y0, 1, y1 - y0, '#4a3e34');
}

// Metallstuhl von oben; back = Seite der Rückenlehne (vom Tisch weg)
function drawChair(ctx, x, y, back = 'up') {
  rect(ctx, x - 5, y + 6, 12, 2, 'rgba(0,0,0,0.25)');
  rect(ctx, x - 5, y - 5, 11, 11, '#3a3d42');
  for (let i = -4; i < 6; i += 2) for (let j = -4; j < 6; j += 2) rect(ctx, x + i, y + j, 1, 1, '#5a5e64');
  const bar = '#2a2c30';
  if (back === 'up') rect(ctx, x - 5, y - 8, 11, 3, bar);
  if (back === 'down') rect(ctx, x - 5, y + 6, 11, 3, bar);
  if (back === 'left') rect(ctx, x - 8, y - 5, 3, 11, bar);
  if (back === 'right') rect(ctx, x + 6, y - 5, 3, 11, bar);
}

function drawTable(ctx, x, y, w, h) {
  rect(ctx, x + 2, y + h, w, 3, 'rgba(0,0,0,0.25)');
  rect(ctx, x, y, w, h, '#2a2c30');
  rect(ctx, x + 2, y + 2, w - 4, h - 4, '#3a3d42');
  for (let i = 3; i < w - 3; i += 3) for (let j = 3; j < h - 3; j += 3) rect(ctx, x + i, y + j, 1, 1, '#5a5e64');
}

function drawParasol(ctx, x, y) {
  rect(ctx, x - 6, y - 6, 12, 12, '#c8c8c4');
  rect(ctx, x - 6, y + 5, 12, 1, '#9a9a96');
  rect(ctx, x - 3, y - 3, 6, 6, '#9aa0a8');
  rect(ctx, x - 2, y - 4, 4, 8, '#9aa0a8');
  rect(ctx, x - 1, y - 2, 2, 2, '#c4cad2');
}

function drawRailing(ctx, rng, x0, x1, y) {
  // Blumenkasten mit Geranien vor dem schwarzen Geländer
  rect(ctx, x0, y + 2, x1 - x0, 4, '#5a4636');
  for (let x = x0 + 1; x < x1 - 1; x += 2) {
    rect(ctx, x, y + 1 - Math.floor(rng() * 2), 2, 2, rng() < 0.5 ? '#3f8a2a' : '#56b04a');
    if (rng() < 0.45) rect(ctx, x, y - Math.floor(rng() * 2), 2, 2, rng() < 0.6 ? '#ff3a8a' : '#e8302a');
  }
  rect(ctx, x0, y + 7, x1 - x0, 2, '#1a1a1a');
  for (let x = x0; x < x1; x += 10) rect(ctx, x, y + 6, 2, 4, '#1a1a1a');
}

function drawGeraniumPot(ctx, rng, x, y) {
  rect(ctx, x - 5, y, 10, 7, '#c4622d');
  fillEllipse(ctx, rng, x, y - 3, 7, 5, (dx, dy, d, r) => (r < 0.3 ? (r < 0.15 ? '#ff3a8a' : '#e8302a') : d < 0.5 ? '#56b04a' : '#3f8a2a'));
}

function drawGateArch(ctx, rng, gateX) {
  // Pergola-Bogen über dem Gartentor mit Wein und Wagenrädern
  rect(ctx, gateX - 22, 1, 44, 3, BEAM);
  rect(ctx, gateX - 22, 9, 44, 3, BEAM);
  drawVine(ctx, rng, gateX - 22, gateX + 22, 2, 0.8);
  drawVine(ctx, rng, gateX - 22, gateX + 22, 10, 0.6);
  drawWagonWheel(ctx, gateX - 30, 8, 7);
  drawWagonWheel(ctx, gateX + 30, 8, 7);
}

function drawPot(ctx, rng, x, y) {
  rect(ctx, x - 5, y, 10, 8, '#c4622d');
  rect(ctx, x - 6, y - 1, 12, 2, '#a84e22');
  fillEllipse(ctx, rng, x, y - 4, 7, 5, (dx, dy, d, r) => (r < 0.15 ? '#ff5a7a' : d < 0.4 ? '#56b04a' : '#3f8a2a'));
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

// Kellertreppe rechts unten neben dem Rasen: Stufen werden nach unten dunkler
function drawCellarStairs(ctx, x, y, w, h) {
  rect(ctx, x - 2, y - 2, w + 4, h + 2, '#8a8a84');
  const steps = 8;
  const sh = Math.floor(h / steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const c = Math.round(170 - t * 120);
    const col = `rgb(${c},${c - 2},${c - 8})`;
    rect(ctx, x, y + i * sh, w, sh, col);
    rect(ctx, x, y + i * sh + sh - 1, w, 1, `rgb(${c - 40},${c - 42},${c - 46})`);
  }
  // Kellertür ganz unten
  rect(ctx, x + 10, y + steps * sh - 2, w - 20, 4, '#3a2414');
  // Mauern und schwarzes Geländer
  rect(ctx, x - 3, y - 2, 3, h + 2, '#b5b0a2');
  rect(ctx, x + w, y - 2, 3, h + 2, '#b5b0a2');
  rect(ctx, x + 1, y - 1, 1, h, '#1a1a1a');
  for (let yy = y; yy < y + h; yy += 8) rect(ctx, x, yy, 3, 2, '#1a1a1a');
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

