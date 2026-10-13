import { WEAPONS } from './weapons.js';

// Alle Upgrades haben mit dem Garten zu tun. apply(stats, scene) verändert Opas Werte.
export const UPGRADES = [
  {
    id: 'dmg',
    name: 'Geschärfte Zinken',
    desc: '+20 % Schaden',
    icon: 'i_dmg',
    max: 10,
    apply: (s) => {
      s.dmgMult *= 1.2;
    },
  },
  {
    id: 'speed',
    name: 'Bequeme Gartenclogs',
    desc: '+12 % Laufgeschwindigkeit',
    icon: 'i_speed',
    max: 6,
    apply: (s) => {
      s.speedMult += 0.12;
    },
  },
  {
    id: 'range',
    name: 'Teleskopstiel',
    desc: '+15 % Reichweite',
    icon: 'i_range',
    max: 6,
    apply: (s) => {
      s.rangeMult += 0.15;
    },
  },
  {
    id: 'rate',
    name: 'Gartenhandschuhe',
    desc: '+15 % Angriffstempo',
    icon: 'i_rate',
    max: 6,
    apply: (s) => {
      s.rateMult += 0.15;
    },
  },
  {
    id: 'arc',
    name: 'Weiter Schwung',
    desc: '+30° Schwungbreite bzw. größerer Aufschlag-Radius',
    icon: 'i_arc',
    max: 4,
    cond: (scene) => scene.weapon.type === 'swing' || scene.weapon.type === 'slam',
    apply: (s) => {
      s.arcBonus += 30;
    },
  },
  {
    id: 'hill',
    name: 'Rasenwalze',
    desc: '+40 % Schaden gegen Maulwurfshügel',
    icon: 'i_hill',
    max: 5,
    apply: (s) => {
      s.hillMult += 0.4;
    },
  },
  {
    id: 'crit',
    name: 'Glücksklee',
    desc: '+10 % Chance auf doppelten Schaden',
    icon: 'i_crit',
    max: 5,
    apply: (s) => {
      s.crit += 0.1;
    },
  },
  {
    id: 'xp',
    name: 'Biodünger',
    desc: '+20 % Erfahrung pro Maulwurf und Hügel',
    icon: 'i_xp',
    max: 5,
    apply: (s) => {
      s.xpMult += 0.2;
    },
  },
  {
    id: 'scare',
    name: 'Vogelscheuche',
    desc: 'Maulwürfe bleiben 15 % länger oben',
    icon: 'i_scare',
    max: 3,
    apply: (s) => {
      s.upMult += 0.15;
    },
  },
  {
    id: 'seeds',
    name: 'Rasensamen',
    desc: 'Alle Hügel verlieren von selbst 1,5 Leben pro Sekunde',
    icon: 'i_seeds',
    max: 5,
    apply: (s) => {
      s.seeds += 1;
    },
  },
  {
    id: 'gnome',
    name: 'Gartenzwerg',
    desc: 'Ein Zwerg bewacht die Stelle und wirft Steinchen auf alles in der Nähe',
    icon: 'gnome',
    max: 4,
    apply: (s, scene) => {
      s.gnomes += 1;
      scene.placeGnome();
    },
  },
  {
    id: 'sprinkler',
    name: 'Rasensprenger',
    desc: 'Alle 3 s spritzt Wasser rund um Opa und trifft alles in der Nähe',
    icon: 'i_sprinkler',
    max: 3,
    apply: (s) => {
      s.sprinkler += 1;
    },
  },
  {
    id: 'cart',
    name: 'Schubkarre',
    desc: 'Räumt sofort die 6 ältesten Hügel weg',
    icon: 'i_cart',
    max: 99,
    weight: 0.5,
    cond: (scene) => scene.hills.length >= 6,
    apply: (s, scene) => {
      scene.cartCleanup(6);
    },
  },
];

function weightedPick(pool) {
  const total = pool.reduce((a, u) => a + (u.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const u of pool) {
    r -= u.weight ?? 1;
    if (r <= 0) return u;
  }
  return pool[pool.length - 1];
}

export function rollChoices(scene) {
  const lv = scene.upgradeLevels;
  let pool = UPGRADES.filter((u) => (lv[u.id] || 0) < u.max && (!u.cond || u.cond(scene)));
  const choices = [];
  while (choices.length < 3 && pool.length) {
    const u = weightedPick(pool);
    pool = pool.filter((p) => p !== u);
    choices.push({ type: 'upgrade', up: u, level: (lv[u.id] || 0) + 1 });
  }

  // Neue Waffen sind seltener – die Chance steigt, je länger keine angeboten wurde.
  const avail = Object.values(WEAPONS).filter(
    (w) => w.id !== scene.weapon.id && w.tier >= scene.weapon.tier && scene.level >= w.minLevel,
  );
  const chance = 0.15 + scene.levelsSinceWeaponOffer * 0.06;
  if (avail.length && Math.random() < chance) {
    const w = avail[Math.floor(Math.random() * avail.length)];
    const slot = choices.length < 3 ? choices.length : Math.floor(Math.random() * 3);
    choices[slot] = { type: 'weapon', weapon: w };
    scene.levelsSinceWeaponOffer = 0;
  } else {
    scene.levelsSinceWeaponOffer += 1;
  }
  return choices;
}
