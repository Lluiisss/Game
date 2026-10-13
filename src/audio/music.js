// Einfache, treibende Chiptune-Musik. Wird live per WebAudio erzeugt:
// Bass, Arpeggio, Melodie und Schlagzeug. Die Intensität (0–2) und das
// Tempo steigen, wenn es auf dem Rasen brenzlig wird.
import { ac, masterNode, isMuted, onMuteChange } from './sfx.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// a-Moll mit E-Dur-Akkord für Spannung: Am – Am – F – E   |   Am – F – G – E
const PROG_GAME = [
  [57, 60, 64],
  [57, 60, 64],
  [53, 57, 60],
  [52, 56, 59],
  [57, 60, 64],
  [53, 57, 60],
  [55, 59, 62],
  [52, 56, 59],
];
const PROG_MENU = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
// Boss: düster – Dm – B♭ – E – Am
const PROG_BOSS = [
  [50, 53, 57],
  [46, 50, 53],
  [52, 56, 59],
  [57, 60, 64],
];

// Melodie: 8 Achtel pro Takt, null = Pause (Töne relativ zur Tonart a-Moll)
const MELODY = [
  [76, null, 76, 74, 72, null, 71, 72],
  [76, null, 79, null, 76, 74, 72, null],
  [77, null, 76, 74, 72, null, 69, 72],
  [71, null, 68, 71, 76, null, 74, 71],
  [76, null, 76, 74, 72, null, 74, 76],
  [77, 76, 74, null, 72, null, 69, null],
  [74, null, 74, 72, 71, null, 74, 79],
  [76, null, 75, 76, 80, null, 83, null],
];

let state = {
  playing: false,
  paused: false,
  mode: 'game',
  intensity: 0,
  bpm: 124,
  step: 0,
  nextTime: 0,
  timer: null,
};

let gain = null;

function out() {
  const a = ac();
  if (!a) return null;
  if (!gain) {
    gain = a.createGain();
    gain.gain.value = isMuted() ? 0 : 0.55;
    gain.connect(masterNode());
  }
  return a;
}

onMuteChange((m) => {
  if (gain) gain.gain.value = m ? 0 : 0.55;
});

function note(a, freq, t, dur, type, vol) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(gain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

let noiseBuf = null;
function drum(a, t, kind) {
  if (kind === 'kick') {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(gain);
    o.start(t);
    o.stop(t + 0.18);
    return;
  }
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  const g = a.createGain();
  const snare = kind === 'snare';
  f.type = snare ? 'bandpass' : 'highpass';
  f.frequency.value = snare ? 1800 : 7000;
  const dur = snare ? 0.12 : 0.04;
  g.gain.setValueAtTime(snare ? 0.22 : 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(gain);
  src.start(t);
  src.stop(t + dur + 0.02);
}

function scheduleStep(a, step, t) {
  const s16 = step % 16;
  const bar = Math.floor(step / 16);
  const sixteenth = 60 / state.bpm / 4;
  const { mode, intensity } = state;
  const prog = mode === 'menu' ? PROG_MENU : mode === 'boss' ? PROG_BOSS : PROG_GAME;
  const chord = prog[bar % prog.length];
  const root = chord[0] - 24;

  // Bass: treibende Achtel mit Oktavsprung
  if (s16 % 2 === 0) {
    const oct = s16 % 4 === 2 ? 12 : 0;
    note(a, midi(root + oct), t, sixteenth * 1.8, mode === 'boss' ? 'sawtooth' : 'triangle', mode === 'menu' ? 0.18 : 0.26);
  }

  // Arpeggio
  if (mode === 'menu' || intensity >= 1) {
    if (mode !== 'menu' || s16 % 2 === 0) {
      const tone = chord[s16 % 3] + 12 + (s16 >= 8 && intensity >= 2 ? 12 : 0);
      note(a, midi(tone), t, sixteenth * 0.9, 'square', mode === 'menu' ? 0.035 : 0.04);
    }
  }

  // Melodie
  if (mode !== 'menu' && intensity >= 2 && s16 % 2 === 0) {
    const m = MELODY[bar % MELODY.length][s16 / 2];
    if (m) note(a, midi(m - (mode === 'boss' ? 7 : 0)), t, sixteenth * 1.7, mode === 'boss' ? 'sawtooth' : 'square', 0.055);
  }

  // Schlagzeug
  if (mode === 'menu') {
    if (s16 % 4 === 2) drum(a, t, 'hat');
    return;
  }
  if (intensity === 0) {
    if (s16 === 0 || s16 === 8) drum(a, t, 'kick');
    if (s16 % 4 === 2) drum(a, t, 'hat');
  } else {
    if (s16 % 4 === 0) drum(a, t, 'kick');
    if (s16 === 4 || s16 === 12) drum(a, t, 'snare');
    if (intensity >= 2 ? true : s16 % 2 === 0) drum(a, t, 'hat');
    if (intensity >= 2 && s16 === 14) drum(a, t, 'kick');
  }
}

function tick() {
  if (!state.playing || state.paused) return;
  const a = out();
  if (!a || a.state !== 'running') return;
  if (state.nextTime < a.currentTime) state.nextTime = a.currentTime + 0.05;
  while (state.nextTime < a.currentTime + 0.15) {
    scheduleStep(a, state.step, state.nextTime);
    state.nextTime += 60 / state.bpm / 4;
    state.step = (state.step + 1) % (16 * 8);
  }
}

export const music = {
  play(mode = 'game') {
    out();
    state.mode = mode;
    state.step = 0;
    state.intensity = 0;
    state.bpm = mode === 'menu' ? 104 : 124;
    state.paused = false;
    state.nextTime = 0;
    if (!state.playing) {
      state.playing = true;
      state.timer = setInterval(tick, 25);
    }
  },
  stop() {
    state.playing = false;
    clearInterval(state.timer);
    state.timer = null;
  },
  setPaused(p) {
    state.paused = p;
    state.nextTime = 0;
  },
  // Wird jedes Frame vom Spiel aufgerufen
  update({ intensity, bpm, boss }) {
    if (!state.playing || state.mode === 'menu') return;
    state.intensity = intensity;
    state.bpm = bpm;
    const mode = boss ? 'boss' : 'game';
    if (mode !== state.mode) {
      state.mode = mode;
      // Taktanfang abwarten wäre schöner, aber ein harter Wechsel wirkt dramatisch
      state.step = state.step - (state.step % 16);
    }
  },
};
