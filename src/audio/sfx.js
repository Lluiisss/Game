// Kleine Retro-Soundeffekte, direkt mit der WebAudio-API synthetisiert.

let ctx = null;
let master = null;
let muted = false;
try {
  muted = localStorage.getItem('maulwurf-muted') === '1';
} catch {
  /* ignorieren */
}

export function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq = 440, freqEnd = null, dur = 0.1, type = 'square', vol = 0.15, delay = 0 }) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

let noiseBuf = null;
function noise({ dur = 0.1, vol = 0.12, delay = 0, freq = 1200, q = 1, type = 'bandpass' }) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = a.currentTime + delay;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export function masterNode() {
  ac();
  return master;
}

const muteListeners = [];
export function onMuteChange(fn) {
  muteListeners.push(fn);
}

let lastSwing = 0;

export const sfx = {
  unlock() {
    ac();
  },
  swing() {
    const now = performance.now();
    if (now - lastSwing < 90) return;
    lastSwing = now;
    noise({ dur: 0.08, vol: 0.06, freq: 2500, q: 0.8 });
  },
  spray() {
    const now = performance.now();
    if (now - lastSwing < 120) return;
    lastSwing = now;
    noise({ dur: 0.12, vol: 0.04, freq: 4000, q: 0.5, type: 'highpass' });
  },
  hit() {
    tone({ freq: 220, freqEnd: 90, dur: 0.09, type: 'square', vol: 0.12 });
  },
  crit() {
    tone({ freq: 520, freqEnd: 140, dur: 0.12, type: 'square', vol: 0.13 });
    noise({ dur: 0.06, vol: 0.08, freq: 900 });
  },
  hillHit() {
    noise({ dur: 0.07, vol: 0.1, freq: 400, q: 1.2 });
  },
  hillGone() {
    noise({ dur: 0.18, vol: 0.12, freq: 300, q: 0.7 });
    tone({ freq: 660, dur: 0.06, type: 'triangle', vol: 0.08, delay: 0.05 });
    tone({ freq: 880, dur: 0.08, type: 'triangle', vol: 0.08, delay: 0.1 });
  },
  pop() {
    tone({ freq: 160, freqEnd: 420, dur: 0.1, type: 'triangle', vol: 0.09 });
    noise({ dur: 0.1, vol: 0.05, freq: 300 });
  },
  dive() {
    tone({ freq: 380, freqEnd: 120, dur: 0.14, type: 'triangle', vol: 0.06 });
  },
  kill() {
    tone({ freq: 700, freqEnd: 200, dur: 0.18, type: 'square', vol: 0.1 });
    tone({ freq: 990, dur: 0.06, type: 'triangle', vol: 0.08, delay: 0.12 });
  },
  boss() {
    [110, 98, 82].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'sawtooth', vol: 0.12, delay: i * 0.22 }));
  },
  bossKill() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.12, type: 'square', vol: 0.1, delay: i * 0.08 }));
  },
  levelUp() {
    [392, 523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.12, type: 'triangle', vol: 0.12, delay: i * 0.07 }));
  },
  select() {
    tone({ freq: 660, dur: 0.05, type: 'square', vol: 0.08 });
    tone({ freq: 990, dur: 0.08, type: 'square', vol: 0.08, delay: 0.05 });
  },
  move() {
    tone({ freq: 440, dur: 0.03, type: 'square', vol: 0.05 });
  },
  gnome() {
    tone({ freq: 880, freqEnd: 440, dur: 0.06, type: 'triangle', vol: 0.06 });
  },
  splash() {
    noise({ dur: 0.25, vol: 0.08, freq: 3000, q: 0.4, type: 'highpass' });
  },
  warning() {
    tone({ freq: 880, dur: 0.08, type: 'square', vol: 0.06 });
    tone({ freq: 660, dur: 0.08, type: 'square', vol: 0.06, delay: 0.1 });
  },
  zap() {
    noise({ dur: 0.3, vol: 0.18, freq: 2500, q: 0.3, type: 'highpass' });
    tone({ freq: 1200, freqEnd: 80, dur: 0.25, type: 'sawtooth', vol: 0.1 });
  },
  buzz() {
    tone({ freq: 220, freqEnd: 260, dur: 0.08, type: 'sawtooth', vol: 0.03 });
  },
  heal() {
    [660, 880, 1100].forEach((f, i) => tone({ freq: f, dur: 0.08, type: 'sine', vol: 0.06, delay: i * 0.05 }));
  },
  oma() {
    [523, 784, 659, 1046].forEach((f, i) => tone({ freq: f, dur: 0.14, type: 'triangle', vol: 0.12, delay: i * 0.1 }));
  },
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, dur: 0.3, type: 'square', vol: 0.12, delay: i * 0.25 }));
  },
};

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem('maulwurf-muted', muted ? '1' : '0');
  } catch {
    /* ignorieren */
  }
  muteListeners.forEach((fn) => fn(muted));
  return muted;
}
