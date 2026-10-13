// Alle Balancing-Kurven an einem Ort. t = überlebte Zeit in Sekunden.

export const FIRST_BOSS = 90;

export function maxMoles(t) {
  return Math.min(2 + Math.floor(t / 35), 20);
}

export function spawnInterval(t) {
  return Math.max(0.9, 3.2 - t / 90);
}

export function moleHp(t) {
  return Math.round(18 + t * 0.12 + Math.pow(t / 60, 2) * 1.2);
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

export function rollKind(t) {
  const r = Math.random();
  if (t > 50 && r < 0.18 + Math.min(0.12, t / 3000)) return 'fast';
  if (r > 0.82) return 'chill';
  return 'normal';
}

export function computeScore({ kills, bossKills, hillsRemoved, time }) {
  return (kills - bossKills) * 10 + bossKills * 150 + hillsRemoved * 4 + Math.floor(time) * 2;
}
