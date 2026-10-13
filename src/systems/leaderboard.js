// Bestenliste im localStorage des Browsers (GitHub Pages hat kein Backend).
const KEY = 'maulwurf-alarm-highscores-v1';
const NAME_KEY = 'maulwurf-alarm-name';
export const MAX_ENTRIES = 10;

export function loadScores() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function qualifies(score) {
  const s = loadScores();
  return score > 0 && (s.length < MAX_ENTRIES || score > s[s.length - 1].score);
}

export function addScore(entry) {
  const s = loadScores();
  s.push(entry);
  s.sort((a, b) => b.score - a.score);
  const top = s.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(top));
  } catch {
    /* ignorieren */
  }
  return top.indexOf(entry);
}

export function lastName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignorieren */
  }
}

export function formatTime(sec) {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
