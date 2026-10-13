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
    cond: (scene) => ['swing', 'slam'].includes(scene.weapon.type),
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
    minLevel: 4,
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
    minLevel: 4,
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
    minLevel: 7,
    helper: true,
    name: 'Gartenzwerg',
    desc: 'Ein Zwerg bewacht die Stelle und wirft schnell harte Steine auf alles in der Nähe',
    icon: 'gnome',
    max: 5,
    apply: (s, scene) => {
      s.gnomes += 1;
      scene.placeGnome();
    },
  },
  {
    id: 'sprinkler',
    minLevel: 7,
    helper: true,
    name: 'Rasensprenger',
    desc: 'Alle 3 s spritzt Wasser rund um Opa und trifft alles in der Nähe',
    icon: 'i_sprinkler',
    max: 3,
    apply: (s) => {
      s.sprinkler += 1;
    },
  },
  {
    id: 'bees',
    minLevel: 10,
    helper: true,
    name: 'Bienenstock',
    desc: 'Bienen schwärmen aus und stechen Maulwürfe. Jede Stufe: mehr Bienen',
    icon: 'i_bees',
    max: 5,
    apply: (s) => {
      s.bees += 1;
    },
  },
  {
    id: 'hedgehog',
    minLevel: 10,
    helper: true,
    name: 'Igel-Kumpel',
    desc: 'Ein Igel rollt regelmäßig quer über den Rasen und plättet alles auf seinem Weg',
    icon: 'i_hedgehog',
    max: 4,
    apply: (s) => {
      s.hedgehog += 1;
    },
  },
  {
    id: 'mower',
    minLevel: 13,
    helper: true,
    name: 'Mähroboter',
    desc: 'Ein Roboter fährt kreuz und quer und mäht Hügel und Maulwürfe weg',
    icon: 'i_mower',
    max: 3,
    apply: (s, scene) => {
      s.mowers += 1;
      scene.addMower();
    },
  },
  {
    id: 'cloud',
    minLevel: 13,
    helper: true,
    name: 'Regenwolke',
    desc: 'Eine Wolke zieht über den Rasen und weicht Hügel und Maulwürfe auf',
    icon: 'i_cloud',
    max: 3,
    apply: (s, scene) => {
      s.clouds += 1;
      scene.addCloud();
    },
  },
  {
    id: 'storm',
    minLevel: 16,
    helper: true,
    name: 'Gewitter-Wetterhahn',
    desc: 'Alle paar Sekunden schlägt ein Blitz in einen Maulwurf ein',
    icon: 'i_storm',
    max: 5,
    apply: (s) => {
      s.storm += 1;
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

// Helfer sind seltener als normale Verbesserungen – zuerst soll Opa selbst kämpfen.
const weightOf = (u) => u.weight ?? (u.helper ? 0.35 : 1);

function weightedPick(pool) {
  const total = pool.reduce((a, u) => a + weightOf(u), 0);
  let r = Math.random() * total;
  for (const u of pool) {
    r -= weightOf(u);
    if (r <= 0) return u;
  }
  return pool[pool.length - 1];
}

export function rollChoices(scene) {
  const lv = scene.upgradeLevels;
  let pool = UPGRADES.filter(
    (u) => (lv[u.id] || 0) < u.max && scene.level >= (u.minLevel || 1) && (!u.cond || u.cond(scene)),
  );
  const choices = [];
  while (choices.length < 3 && pool.length) {
    const u = weightedPick(pool);
    pool = pool.filter((p) => p !== u);
    // Höchstens ein Helfer (Zwerg, Bienen, Igel …) pro Auswahl
    if (u.helper) pool = pool.filter((p) => !p.helper);
    choices.push({ type: 'upgrade', up: u, level: (lv[u.id] || 0) + 1 });
  }

  // Neue Waffen sind selten und kommen erst nach und nach.
  const avail = Object.values(WEAPONS).filter(
    (w) => w.id !== scene.weapon.id && w.tier >= scene.weapon.tier && scene.level >= w.minLevel,
  );
  const better = avail.filter((w) => w.tier > scene.weapon.tier);
  const chance = 0.1 + scene.levelsSinceWeaponOffer * 0.05;
  if (avail.length && Math.random() < chance) {
    const from = better.length && Math.random() < 0.6 ? better : avail;
    const w = from[Math.floor(Math.random() * from.length)];
    const slot = choices.length < 3 ? choices.length : Math.floor(Math.random() * 3);
    choices[slot] = { type: 'weapon', weapon: w };
    scene.levelsSinceWeaponOffer = 0;
  } else {
    scene.levelsSinceWeaponOffer += 1;
  }
  return choices;
}
