// Online-Bestenliste über Firebase Firestore.
// Hinweis: Der Web-API-Key ist bei Firebase kein Geheimnis – geschützt wird die
// Datenbank über die Firestore-Sicherheitsregeln (siehe firestore.rules).
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: 'AIzaSyC8uQ8G2L7O9TeE3SUnt5C9tpFmgtkWKTY',
  authDomain: 'opas-garten-und-die-maulwuerfe.firebaseapp.com',
  projectId: 'opas-garten-und-die-maulwuerfe',
  storageBucket: 'opas-garten-und-die-maulwuerfe.firebasestorage.app',
  messagingSenderId: '182179692773',
  appId: '1:182179692773:web:0f863b9b18542105ed540c',
  measurementId: 'G-WBYE2ZD02X',
};

export const ONLINE_MAX = 100;
const COLLECTION = 'highscores';

let db = null;
function getDb() {
  if (!db) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    // Analytics nur, wenn der Browser es unterstützt (blockiert sonst nichts)
    import('firebase/analytics')
      .then(({ getAnalytics, isSupported }) => isSupported().then((ok) => ok && getAnalytics(app)))
      .catch(() => {});
  }
  return db;
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
}

let cache = null;

// Die besten 100 Einträge (absteigend nach Punkten)
export async function fetchOnlineScores() {
  const q = query(collection(getDb(), COLLECTION), orderBy('score', 'desc'), limit(ONLINE_MAX));
  const snap = await withTimeout(getDocs(q), 8000);
  cache = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return cache;
}

export function cachedOnlineScores() {
  return cache;
}

// Kommt der Punktestand in die Online-Top-100?
export function qualifiesOnline(score, list) {
  if (score <= 0) return false;
  return list.length < ONLINE_MAX || score > list[list.length - 1].score;
}

export async function submitOnlineScore(entry) {
  const data = {
    name: String(entry.name).slice(0, 12),
    score: Math.floor(entry.score),
    kills: Math.floor(entry.kills),
    hills: Math.floor(entry.hills),
    time: Math.floor(entry.time),
    level: Math.floor(entry.level),
    createdAt: serverTimestamp(),
  };
  const ref = await withTimeout(addDoc(collection(getDb(), COLLECTION), data), 8000);
  return ref.id;
}
