import { MOLE_KINDS } from './entities/Mole.js';

// Alle Balancing-Kurven an einem Ort. t = überlebte Zeit in Sekunden.

export const FIRST_BOSS = 90;

export function maxMoles(t) {
  return Math.min(2 + Math.floor(t / 30), 40);
}

export function spawnInterval(t) {
  return Math.max(0.65, 3.2 - t / 90);
}

export function moleHp(t) {
  // ab ca. 8 Minuten wächst das Leben deutlich schneller (gegen Raketen & Co.)
  return Math.round(18 + t * 0.12 + Math.pow(t / 60, 2) * 1.2 + Math.pow(Math.max(0, t - 480) / 60, 3) * 1.5);
}

export function hillHp(t) {
  return Math.round(14 + t * 0.09);
}

// Maulwürfe werden mit der Zeit hektischer und bleiben kürzer oben.
export function upTimeMult(t) {
  return Math.max(0.65, 1 - t / 900);
}

export function bossInterval(t) {
  return Math.max(40, 80 - t / 15);
}

export function xpForLevel(level) {
  const l = level - 1;
  return Math.round(8 + 6 * l + 0.7 * l * l);
}

// Zufällige Maulwurfart, die zur Spielzeit passt (neue Arten kommen nach und nach)
export function rollKind(t) {
  const pool = Object.entries(MOLE_KINDS).filter(([, k]) => k.weight > 0 && t >= k.from);
  const total = pool.reduce((a, [, k]) => a + k.weight, 0);
  let r = Math.random() * total;
  for (const [id, k] of pool) {
    r -= k.weight;
    if (r <= 0) return id;
  }
  return 'normal';
}

export function computeScore({ kills, bossKills, hillsRemoved, time }) {
  return (kills - bossKills) * 10 + bossKills * 150 + hillsRemoved * 4 + Math.floor(time) * 2;
}

// Automatischer Bonus pro Level (zusätzlich zu den gewählten Upgrades)
export function levelBonus(level) {
  const l = level - 1;
  return {
    dmg: 1 + 0.025 * l,
    rate: 1 + 0.01 * l,
    range: 1 + Math.min(0.15, 0.005 * l),
    speed: 1 + Math.min(0.2, 0.006 * l),
  };
}

// Später tauchen pro Spawn-Takt mehrere Maulwürfe gleichzeitig auf
export function spawnBatch(t) {
  return 1 + Math.floor(t / 400);
}
